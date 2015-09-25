var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var parse = require('csv-parse');
var R = require('ramda');
var xmlserializer = require('xmlserializer');

var dataCSV = fs.readFileSync(path.join(__dirname, 'data/data.csv'), { encoding: 'utf-8' });
var countryCSV = fs.readFileSync(path.join(__dirname, 'data/country.csv'), { encoding: 'utf-8' });

var countryKeys, data;

parseCountries(countryCSV);

function parseCountries(csv) {
  countryKeys = {};
  var header = true;
  var countryCSVParser = parse();
  var record;

  countryCSVParser.on('readable', function() {
    while (record = countryCSVParser.read()) {
      if (!header) {
        countryKeys[record[0]] = record[3];
      } else {
        header = false;
      }
    }
  });

  countryCSVParser.on('finish', function() {
    parseData(dataCSV);
  });

  countryCSVParser.write(csv);

  countryCSVParser.end();
}

function parseData(csv) {
  data = [];
  var header = true;
  var row, record, head;

  var dataCSVParser = parse();

  dataCSVParser.on('readable', function() {
    while (record = dataCSVParser.read()) {
      if (!header) {
        row = {};
        for (var i = 0; i < record.length; i++) {
          row[head[i]] = record[i];
        }
        data.push(row);
      } else {
        head = record;
        header = false;
      }
    }
  });

  dataCSVParser.on('finish', function() {
    generateBarChartData(data);
  });

  dataCSVParser.write(csv);

  dataCSVParser.end();
}

function generateBarChartData(rawData) {
  var barData = rawData.map(function(donor) {

    var donorData = {};

    donorData.name = donor['Name of Donor'];

    var q21Keys = Object.keys(donor).filter(function(key) {
      return key.indexOf('Q21_C') > -1;
    });

    var order = function(a, b) { return parseInt(a.q21) - parseInt(b.q21); };
    donorData.top5 = R.take(5, R.sort(order, q21Keys.map(function(key) {
      var countryCode = key.match(/C\d*$/)[0];
      return {
        countryName: countryKeys[countryCode],
        q14: +parseFloat(donor['Q14_' + countryCode] || 0).toFixed(2),
        q25: +parseFloat(donor['Q25_' + countryCode] || 0).toFixed(2),
        q21: +parseFloat(donor[key]).toFixed(2)
      };
    })));

    return donorData;
  });
  writeChartsToDisk(barData);
}

function writeChartsToDisk(barData, i) {
  if (!i) i = 0;
  var donorData = barData[i].top5.map(function(d) {
    return {
      group: d.countryName,
      q14: d.q14 || 0,
      q21: d.q21 || 0
    };
  });
  jsdom.env({
    features: { QuerySelector: true },
    html: '<!DOCTYPE html>',
    scripts: [ 'http://d3js.org/d3.v3.min.js' ],
    done: function(err, window) {
      if (err) {
        console.log('Error generating bar chart for:', barData[i].name);
        return console.log(err);
      }
      var svg = getChart(window, donorData);
      fs.writeFileSync(
        path.join(__dirname, '..', 'graphics', 'bar_chart_' + barData[i].name + '.svg'),
        xmlserializer.serializeToString(svg),
        { encoding: 'utf-8' }
      );
      if (++i < barData.length) writeChartsToDisk(barData, i);
    }
  });
}

function getChart(window, _data) {
  var d3 = window.d3;
  // convert from pixels to points for ReportLabs
  var PX_RATIO = 4 / 3;
  // margin.middle is distance from center line to each y-axis
  var margin = {
    top: 20 * PX_RATIO,
    right: 20 * PX_RATIO,
    bottom: 10 * PX_RATIO,
    left: 20 * PX_RATIO,
    middle: _data.reduce(function(p, c) {
      if (c.group.length > p) p = c.group.length;
      return p;
    }, 0) * 5 * PX_RATIO
  };

  // SET UP DIMENSIONS
  var w = 410 * PX_RATIO,
      h = 245 * PX_RATIO;

  // the width of each side of the chart
  var regionWidth = w / 2 - margin.middle;

  // these are the x-coordinates of the y-axes
  var pointA = regionWidth,
      pointB = w - regionWidth;


  // CREATE SVG
  var svg = d3.select('body').append('svg')
    .attr('width', margin.left + w + margin.right)
    .attr('height', margin.top + h + margin.bottom)
    // ADD A GROUP FOR THE SPACE WITHIN THE MARGINS
    .append('g')
      .attr('transform', translation(margin.left, margin.top));

  // labels
  svg.selectAll('text')
    .data(_data)
    .enter()
    .append('text');

  // SET UP SCALES

  // the xScale goes from 0 to the width of a region
  //  it will be reversed for the left x-axis
  var xScale = d3.scale.linear()
    .domain([0, 5])
    .range([0, regionWidth])
    .nice();

  var yScale = d3.scale.ordinal()
    .domain(_data.map(function(d) { return d.group; }))
    .rangeRoundBands([h, 0], 0.1);


  // SET UP AXES
  var yAxisLeft = d3.svg.axis()
    .scale(yScale)
    .orient('right')
    .tickSize(0, 0)
    .tickPadding(margin.middle - 4);

  var yAxisRight = d3.svg.axis()
    .scale(yScale)
    .orient('left')
    .tickSize(0, 0)
    .tickFormat('');

  var xAxisRight = d3.svg.axis()
    .scale(xScale)
    .innerTickSize(-h)
    .ticks(5)
    .orient('top');

  var xAxisLeft = d3.svg.axis()
    // REVERSE THE X-AXIS SCALE ON THE LEFT SIDE BY REVERSING THE RANGE
    .innerTickSize(-h)
    .ticks(5)
    .scale(xScale.copy().range([pointA, 0]))
    .orient('top');

  // DRAW AXES
  svg.append('g')
    .attr('class', 'axis y left')
    .attr('transform', translation(pointA, 0))
    .call(yAxisLeft)
    .selectAll('text')
      .style('text-anchor', 'middle');

  svg.append('g')
    .attr('class', 'axis x left')
    .call(xAxisLeft);

  svg.append('g')
    .attr('class', 'axis y right')
    .attr('transform', translation(pointB, 0))
    .call(yAxisRight);

  svg.append('g')
    .attr('class', 'axis x right')
    .attr('transform', translation(pointB, 0))
    .call(xAxisRight);

  // MAKE GROUPS FOR EACH SIDE OF CHART
  // scale(-1,1) is used to reverse the left side so the bars grow left instead of right
  var leftBarGroup = svg.append('g')
    .attr('transform', translation(pointA, 0) + 'scale(-1,1)');
  var rightBarGroup = svg.append('g')
    .attr('transform', translation(pointB, 0));

  // DRAW BARS
  leftBarGroup.selectAll('.bar.left')
    .data(_data)
    .enter().append('rect')
      .attr('class', 'bar left')
      .attr('x', 0)
      .attr('y', function(d) { return yScale(d.group) + 10; })
      .attr('width', function(d) { return xScale(d.q14); })
      .attr('height', '30px')
      .attr('fill', '#92b5d8');

  rightBarGroup.selectAll('.bar.right')
    .data(_data)
    .enter().append('rect')
      .attr('class', 'bar right')
      .attr('x', 0)
      .attr('y', function(d) { return yScale(d.group) + 10; })
      .attr('width', function(d) { return xScale(d.q21); })
      .attr('height', '30px')
      .attr('fill', '#161f34');

  // bar labels
  svg.append('g')
    .selectAll('text')
    .data(_data)
    .enter()
    .append('text')
      .text(function(d) { return d.q14; })
        .attr('x', function(d) { return (w / 2) - xScale(d.q14) - margin.middle - 25; })
        .attr('y', function(d) { return yScale(d.group) + 30; });

  svg.append('g')
    .selectAll('text')
    .data(_data)
    .enter()
    .append('text')
      .text(function(d) { return d.q21; })
        .attr('x', function(d) { return (w / 2) + margin.middle + xScale(d.q21) + 15; })
        .attr('y', function(d) { return yScale(d.group) + 30; });


  // styling
  svg.selectAll('.axis')
    .style('fill', 'transparent')
    .style('stroke', '#000')
    .style('shape-rendering', 'crispEdges');

  svg.selectAll('text')
    .style('fill', '#000')
    .style('font-family', 'Helvetica')
    .style('stroke', 'none');

  svg.selectAll('line')
    .style('stroke', '#B2B2B2');

  d3.selectAll('path').remove(); // remove axis line

  // so sick of string concatenation for translations
  function translation(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  return window.document.getElementsByTagName('svg')[0];
}
