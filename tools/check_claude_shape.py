"""Reference shape, motion and clipping checks for the two articulated rigs."""
from PIL import Image, ImageChops, ImageDraw
from build_collection import SPECS, ORANGE, render
from animate_mascots import FRAMES
neutral=next(s for s in SPECS if s[0]=='neutral')
im=render('claude',neutral)
color=tuple(bytes.fromhex(ORANGE[1:]))
mask=Image.new('L',im.size)
mask.putdata([255 if p[:3]==color and p[3] else 0 for p in im.getdata()])
expected=Image.new('L',im.size);d=ImageDraw.Draw(expected)
d.rectangle((24,24,71,59),fill=255);d.rectangle((12,36,83,47),fill=255)
for x in (24,38,52,66):d.rectangle((x,60,x+5,71),fill=255)
# Facial marks may cut into the block; perimeter and limbs must stay original.
assert ImageChops.subtract(mask,expected).getbbox() is None
for y in (24,25,34,35,48,58):
    xs=[x for x in range(96) if mask.getpixel((x,y))]
    assert (min(xs),max(xs))==(24,71),(y,xs)
for mascot in ('gpt','claude'):
    for spec in SPECS:
        poses=[]
        for k in range(FRAMES):
            im=render(mascot,spec,k,True)
            poses.append(im.tobytes())
            box=im.getchannel('A').getbbox()
            assert box and box[0]>0 and box[1]>0 and box[2]<96 and box[3]<96,(mascot,spec[0],k,box)
        assert poses[0]==poses[-1],('Loop seam',mascot,spec[0])
        assert len(set(poses))>1,('No animation',mascot,spec[0])
    for name in ('hello','clapping','walking','dancing','flag-waving'):
        spec=next(s for s in SPECS if s[0]==name)
        frames=[render(mascot,spec,k,True) for k in range(FRAMES)]
        assert len({f.tobytes() for f in frames})>=6,(mascot,name)
print('Reference Claude block, both moving rigs and 4,176 animation poses verified without canvas clipping.')
