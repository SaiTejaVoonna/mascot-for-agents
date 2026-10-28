"""Articulated pixel rigs. 36 authored poses, 70 ms each; no model or API calls.
Claude's original tabs become attached block hands during action, never extra arms.
GPT uses its uneroded reference knot; face size stays fixed.
"""
import json, math
from functools import lru_cache
from PIL import Image, ImageDraw
FRAMES=36
FRAME_MS=70
def lerp(a,b,t): return tuple(round(x+(y-x)*t) for x,y in zip(a,b))
def line(d,points,color,width): d.line(points,fill=color,width=width)
@lru_cache(maxsize=1)
def gpt_mask(root):
    rows=json.loads((root/'assets/mascots/gpt/silhouette.json').read_text())['rows']
    mask=Image.new('L',(78,78))
    mask.putdata([255 if (int(row,16)>>(77-x))&1 else 0 for row in rows for x in range(78)])
    d=ImageDraw.Draw(mask)
    d.rectangle((0,40,12,63),fill=0);d.rectangle((67,40,77,63),fill=0)
    d.rectangle((0,65,77,77),fill=0)
    d.polygon([(32,26),(43,26),(43,28),(48,28),(48,30),(49,30),
               (49,46),(46,46),(46,49),(33,49),(33,47),(29,47),
               (29,30),(30,30),(30,28),(32,28)],fill=255)
    return mask
def targets(pose,mascot):
    g=mascot=='gpt'
    rest=[(17,66),(79,66)] if g else [(17,42),(78,42)]
    return {
      'down':rest,'up':[(14,31),(81,31)],'raise':[rest[0],(80,30)],
      'hips':[(29,62),(68,62)],'chin':[rest[0],(58,57)],
      'shrug':[(14,43),(81,43)],'hug':[(42,60),(55,60)],
      'cross':[(58,61),(39,61)],'clap':[(44,61),(52,61)],
      'face':[rest[0],(49,42)],'wipe':[rest[0],(60,48)],
    }.get(pose,rest)
def draw_hand(d,elbow,end,color,gpt,pose,index):
    x,y=end
    if gpt:
        d.rectangle((x-3,y-2,x+3,y+3),fill=color)
        if pose in ('up','raise','shrug'): d.rectangle((x-2,y-5,x,y),fill=color)
    else:
        d.rectangle((x-4,y-4,x+4,y+4),fill=color)
        if pose in ('up','raise','shrug'): d.rectangle((x-4,y-7,x-1,y),fill=color)
def render(mascot,spec,k=0,animated=False):
    # Import at call time so build_collection can use this renderer as its public entry.
    from build_collection import ROOT,MINT,ORANGE,DARK,PINK,face,fx
    name,style,pose,effect,motion,category,tags=spec
    gpt=mascot=='gpt';color=MINT if gpt else ORANGE
    p=k/FRAMES if animated else .42
    wave=math.sin(2*math.pi*p)
    # Ease into a clear held performance, then recover to the resting silhouette.
    if animated:
        if p<.18: energy=math.sin(p/.18*math.pi/2)**2
        elif p<.66: energy=1
        elif p<.92: energy=math.cos((p-.66)/.26*math.pi/2)**2
        else: energy=0
    else: energy=1
    body=Image.new('RGBA',(96,96));d=ImageDraw.Draw(body)
    if gpt:
        layer=Image.new('RGBA',(78,78),color);layer.putalpha(gpt_mask(ROOT))
        body.alpha_composite(layer,(9,9));facebox=(37,34,24,26)
    else:
        d.rectangle((24,24,71,59),fill=color)
        facebox=(29,27,38,30)
    f=face(style,animated and k in (28,29))
    fd=ImageDraw.Draw(f)
    if not gpt and style=='sad':
        fd.rectangle((0,5,23,10),fill=(0,0,0,0))
        line(fd,[(2,9),(8,6)],DARK,1);line(fd,[(14,6),(20,9)],DARK,1)
    if name=='angry':
        line(fd,[(1,7),(8,11)],DARK,3);line(fd,[(14,11),(21,7)],DARK,3)
    if name=='laughing':
        fd.rectangle((8,19,15,24),fill=DARK);fd.rectangle((10,23,13,24),fill=PINK)
    body.alpha_composite(f.resize(facebox[2:],Image.Resampling.NEAREST),facebox[:2])
    rest=targets('down',mascot);ends=[lerp(a,b,energy) for a,b in zip(rest,targets(pose,mascot))]
    origins=[(25,56),(71,56)] if gpt else [(26,42),(69,42)]
    if animated and name in ('hello','goodbye','wink','thumbs-up'):
        ends[1]=(ends[1][0]+round(4*math.sin(6*math.pi*p)*energy),ends[1][1]-round(3*math.cos(6*math.pi*p)*energy))
    if name=='clapping':
        gap=round(7*(.5+.5*math.cos(8*math.pi*p))) if animated else 0
        ends=[(45-gap,58),(51+gap,58)]
    if name=='walking':
        stride=round(7*wave) if animated else 5
        ends=[(17,55+stride),(78,55-stride)]
    if name=='dancing':
        ends=[(16,34+round(8*wave)),(79,34-round(8*wave))]
    if name=='pointing': ends=[rest[0],lerp(rest[1],(84,38),energy)]
    if name=='flag-waving':
        ends=[rest[0],(75+round(3*wave*energy),30)]
    if name=='typing':
        pulse=round(2*math.sin(10*math.pi*p)) if animated else 0
        ends=[(42,63+pulse),(55,63-pulse)]
    if name=='peeking': ends=[(34,55),(62,55)]
    if name=='stumbling': ends=[(13,36+round(3*wave)),(81,43-round(3*wave))]
    for i,(origin,end) in enumerate(zip(origins,ends)):
        if not gpt and end==rest[i]:
            x=12 if i==0 else 72;d.rectangle((x,36,x+11,47),fill=color);continue
        elbow=(round(origin[0]+(end[0]-origin[0])*.55),round((origin[1]+end[1])*.5+3))
        if not gpt and end[0] in range(35,63):
            line(d,[origin,elbow,end],DARK,10)
        line(d,[origin,elbow,end],color,4 if gpt else 8)
        draw_hand(d,elbow,end,color,gpt,pose,i)
        if name=='pointing' and i==1:d.rectangle((end[0],end[1]-2,end[0]+5,end[1]),fill=color)
    # Independently articulated feet stay connected to the body on the ground.
    walking=name in ('walking','dancing','stumbling')
    for i,x in enumerate((37,53) if gpt else (24,38,52,66)):
        stride=round(3*math.sin(2*math.pi*p+i*math.pi)) if animated and walking else 0
        lift=max(0,-stride)
        top=74 if gpt else 59;bottom=84 if gpt else 71
        line(d,[(x+2,top),(x+2+stride,bottom-lift)],color,6)
        if gpt:d.rectangle((x-5+stride,bottom-3-lift,x+3+stride,bottom-lift),fill=color)
    if name=='typing':
        d.rectangle((31,57,65,70),fill='#6d8094');d.rectangle((34,59,62,67),fill=DARK)
        d.rectangle((28,71,68,73),fill='#6d8094')
    if name=='peeking':
        d.rectangle((25,61,70,86),fill='#6d8094')
        for x in (34,62):d.rectangle((x-3,58,x+3,63),fill=color)
    dy=dx=angle=0
    if animated:
        dy=round(math.sin(2*math.pi*p))
        if motion in ('bounce','pop'):
            # Anticipation, takeoff, flight, landing, settle.
            keys=[(0,0),(.12,3),(.27,-10 if motion=='pop' else -7),(.43,-8 if motion=='pop' else -5),(.57,3),(.7,0),(1,0)]
            for (a,y),(b,z) in zip(keys,keys[1:]):
                if a<=p<=b:
                    t=(p-a)/(b-a);dy=round(y+(z-y)*(t*t*(3-2*t)));break
        if motion in ('sway','tilt','bow','shake'):
            angle=(3 if motion!='shake' else 1.8)*wave
            dx=round(wave)
        if name=='dancing':angle=4*wave;dy=-round(2*abs(math.sin(4*math.pi*p)))
        if name=='walking':dy=-round(abs(2*math.sin(4*math.pi*p)))
        if name=='foot-tap':
            # Tap the outer foot independently without translating the body.
            x=56 if gpt else 69
            d.rectangle((x-3,73 if gpt else 60,x+4,85 if gpt else 72),fill=(0,0,0,0))
            y=(82 if gpt else 69)-round(3*abs(math.sin(4*math.pi*p)))
            d.rectangle((x-3,y-5,x+3,y+2),fill=color)
        if name=='stumbling':angle=-5*wave;dx=round(wave)
    if angle:body=body.rotate(angle,resample=Image.Resampling.NEAREST,center=(48,55))
    im=Image.new('RGBA',(96,96));im.alpha_composite(body,(dx,dy))
    if name=='flag-waving':
        # Transform the hand anchor with the body before attaching the flag.
        x,y=ends[1];x+=dx;y+=dy
        q=ImageDraw.Draw(im);line(q,[(x,y),(x,y-17)],DARK,2)
        flutter=round(2*math.sin(6*math.pi*p))
        q.polygon([(x+1,y-17),(x+14,y-16+flutter),(x+14,y-7+flutter),(x+1,y-8)],fill='#4386e6')
    else:fx(im,'check' if not gpt and effect=='thumb' else effect,round(p*11))
    return im
