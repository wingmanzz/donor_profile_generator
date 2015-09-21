import os
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib import colors
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import letter

PAGEWIDTH, PAGEHEIGHT = letter

# register Open Sans
pdfmetrics.registerFont(TTFont('Open Sans', 'assets/fonts/fonts-open-sans/OpenSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Open Sans Bold', 'assets/fonts/fonts-open-sans/OpenSans-Bold.ttf'))


# get the immediate directories of a directory
def get_immediate_subdirectories(a_dir):
    return [name for name in os.listdir(a_dir)
            if os.path.isdir(os.path.join(a_dir, name))]


################################
# Function HeaderOverview - header for overview page
def drawHeader(canvas, donor):
    canvas.saveState()
    headboxh = 80
    headboxx = 20
    headboxy = 695
    headboxw = 570
    footboxh = 65
    footboxx = 20
    footboxy = 20
    footboxw = 570

    # aiddata logo
    logouri = "assets/images/aiddata_main_wht.png"
    mapuri = "donors/" + donor + "/map.png"
    influenceuri = "donors/" + donor + "/influence.png"
    adviceuri = "donors/" + donor + "/advice.png"
    advicelegenduri = "assets/images/bubble_legend.png"
    compuri = "donors/" + donor + "/comp.png"
    comp2uri = "donors/" + donor + "/comp2.png"

    # blue header
    canvas.setFillColorRGB(.086, .121, .203)
    canvas.rect(headboxx, headboxy, headboxw, headboxh, fill=1)
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.setFont('Open Sans', 20)
    canvas.drawString(headboxx + 160, headboxy + .425 * headboxh, "Development Partner Profile")

    # green header
    headboxh = 30
    headboxx = 20
    headboxy = 665
    headboxw = 570
    canvas.setFillColorRGB(.461, .711, .340)
    canvas.rect(headboxx, headboxy, headboxw, headboxh, fill=1)
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.setFont('Open Sans', 18)
    donor_year = donor + " 2015"
    textWidth = stringWidth(donor_year, "Open Sans", 18)
    canvas.drawString(headboxx + headboxw - (textWidth + 10), headboxy + .30 * headboxh, donor + " 2015")

    # add logo
    logo = ImageReader(logouri)
    canvas.drawImage(logo, 30, 700, 120, 68, mask='auto')


    # add map
    canvas.setFont('Open Sans', 12)
    canvas.setFillColor(colors.black)
    title_str = "Distribution of " + donor + "'s Official Development Assistance(ODA) 2004-2013"
    textWidth = stringWidth(title_str, "Open Sans", 12)
    pl = (PAGEWIDTH / 2) - (textWidth / 2)
    canvas.drawString(pl, 650, title_str)
    map = ImageReader(mapuri)
    canvas.drawImage(map, 75, 320, 450, 350, mask='auto')

    # add influence chart
    canvas.setFont('Open Sans', 12)
    canvas.setFillColor(colors.black)
    title_str = "Three Aspects of " + donor + "'s Performance in the Countries It Influences Most"
    textWidth = stringWidth(title_str, "Open Sans", 12)
    pl = (PAGEWIDTH / 2) - (textWidth / 2)
    canvas.drawString(pl, 320, title_str)
    influence = ImageReader(influenceuri)
    canvas.drawImage(influence, 80, 20, 450, 275, mask='auto')

    # move to next page
    canvas.showPage()

    # add advice chart
    canvas.setFont('Open Sans', 12)
    canvas.setFillColor(colors.black)
    title_str = "Usefulness of Advice, Volume of ODA and Agenda-Setting Influence, by Policy Area"
    textWidth = stringWidth(title_str, "Open Sans", 12)
    pl = (PAGEWIDTH / 2) - (textWidth / 2)
    canvas.drawString(pl, 750, title_str)
    advice = ImageReader(adviceuri)
    canvas.drawImage(advice, 75, 530, 350, 200, mask='auto')
    advicelegend = ImageReader(advicelegenduri)
    canvas.drawImage(advicelegend, 450, 545,150,200, mask='auto')

    # add advice comp chart
    canvas.setFont('Open Sans', 12)
    canvas.setFillColor(colors.black)
    title_str = "Usefulness of " + donor + "'s Advice Compared to the Average"
    textWidth = stringWidth(title_str, "Open Sans", 12)
    pl = (PAGEWIDTH / 3) - (textWidth / 2)
    canvas.drawString(pl, 500, title_str)
    canvas.setFont('Open Sans', 6)
    key_str1 = "All Other Development Partners"
    canvas.drawString(pl+60,487, key_str1)
    canvas.drawString(pl+210,487, donor)
    canvas.setStrokeColorRGB(.461, .711, .340)
    canvas.line(pl+30, 489, pl+50, 489)
    canvas.setStrokeColorRGB(.890, .118, .118)
    canvas.line(pl+180, 489, pl+200, 489)
    comp = ImageReader(compuri)
    canvas.drawImage(comp, 45, 280, 325, 200, mask='auto')

    # add comp2 chart
    canvas.setFont('Open Sans', 12)
    canvas.setFillColor(colors.black)
    title_str = "Three Dimensions of  " + donor + "'s Performance Compared to Other Development Partners"
    textWidth = stringWidth(title_str, "Open Sans", 12)
    pl = (PAGEWIDTH / 2) - (textWidth / 2)
    canvas.drawString(pl, 250, title_str)
    comp2 = ImageReader(comp2uri)
    canvas.drawImage(comp2, 45, 90, 525, 150, mask='auto')


    # blue footer
    canvas.setStrokeColorRGB(.086, .121, .203)
    canvas.setFillColorRGB(.086, .121, .203)
    canvas.rect(footboxx, footboxy, footboxw, footboxh, fill=1)
    canvas.saveState()
    canvas.setFillColor(colors.white)

    # add logo
    logo = ImageReader(logouri)
    canvas.drawImage(logo, 475, 20, 105, 65, mask='auto')

    return canvas


donor_dirs = get_immediate_subdirectories("donors")

for donor in donor_dirs:
    canvas = canvas.Canvas("donors/" + donor + "/donor_profile.pdf", pagesize=letter)
    canvas.setLineWidth(.3)
    canvas.setFont('Open Sans', 12)

    canvas = drawHeader(canvas, donor)

    canvas.save()