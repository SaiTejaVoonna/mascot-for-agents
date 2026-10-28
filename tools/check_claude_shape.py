"""Guard the straight Clawd outline across every authored frame."""
from PIL import Image, ImageDraw, ImageChops
from build_collection import SPECS, ORANGE, render
color=tuple(bytes.fromhex(ORANGE[1:]))
base=Image.new('L',(96,96));d=ImageDraw.Draw(base)
d.rectangle((24,24,71,59),fill=255);d.rectangle((12,36,83,47),fill=255)
for x in (24,38,52,66):d.rectangle((x,60,x+5,71),fill=255)
def bodymask(im):
    mask=Image.new('L',im.size)
    mask.putdata([255 if p[:3]==color and p[3] else 0 for p in im.getdata()])
    return mask
allowed=[]
for dx in range(-2,3):
    for dy in range(-5,3):
        m=Image.new('L',base.size);m.paste(base,(dx,dy));allowed.append(m)
for spec in SPECS:
    still=bodymask(render('claude',spec))
    assert ImageChops.subtract(still,base).getbbox() is None,spec[0]
    # The flat top and shoulder band must keep their exact extents.
    for y in (24,25,34,35,48,58):
        xs=[x for x in range(96) if still.getpixel((x,y))]
        assert min(xs)==24 and max(xs)==71,(spec[0],y)
    for k in range(12):
        m=bodymask(render('claude',spec,k,True))
        assert any(ImageChops.subtract(m,a).getbbox() is None for a in allowed),(spec[0],k)
print('Claude outline: 50 stills + 600 animation frames have no tiered shoulders or extra orange limbs.')
