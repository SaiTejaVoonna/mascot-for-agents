"""Reference shape, motion and clipping checks for the two articulated rigs."""
from PIL import Image, ImageChops, ImageDraw
from build_collection import SPECS, ORANGE, render
from animate_mascots import FRAMES, claude_rig
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
for name in ('hello','goodbye','thinking','shrug','flag-waving'):
    for k in range(FRAMES):
        rig=claude_rig(name,k/(FRAMES-1))
        assert len(rig['feet'])==4
        assert all(y==71 for x,y in rig['feet']),('Planted foot drift',name,k)
crouch=claude_rig('excited',.08)
flight=claude_rig('excited',.32)
landing=claude_rig('excited',.54)
assert crouch['bottom']>59 and all(y==71 for x,y in crouch['feet'])
assert flight['air']<0 and all(y<71 for x,y in flight['feet'])
assert landing['bottom']>59 and all(y==71 for x,y in landing['feet'])
print('Reference block, 4,176 unclipped poses, loop seams, four planted contacts and jump phases verified.')
