"""Authored pixel expression tracks, stable contacts and closed semantic loops."""
import json, math
from functools import lru_cache
from PIL import Image, ImageDraw
FRAMES=36
FRAME_MS=70
# pose, accent, action, milliseconds per rendered frame
PERFORMANCES={
 'neutral':('down','none','idle',110),
 'happy':('down','none','smile',80),
 'thinking':('chin','none','gaze',110),
 'confused':('down','question','search',90),
 'skeptical':('down','none','brow',100),
 'surprised':('shrug','none','recoil',70),
 'smug':('hips','none','hold',100),
 'embarrassed':('clasp','blush','shy',100),
 'annoyed':('down','none','exhale',100),
 'jealous':('down','none','glance',100),
 'laughing':('down','none','laugh',70),
 'love':('hug','none','hug',90),
 'sad':('down','none','sigh',110),
 'crying':('wipe','none','cry',90),
 'angry':('lowfist','none','tense',80),
 'excited':('up','confetti','hop',70),
 'sleepy':('mouth','none','yawn',110),
 'sleeping':('down','zzz','breathe',110),
 'wink':('down','none','wink',90),
 'cool':('hips','none','shades',100),
 'shocked':('cheeks','none','freeze',100),
 'worried':('chest','none','anxious',100),
 'nervous':('clasp','sweat','tremble',80),
 'proud':('hips','none','lift',100),
 'celebrating':('up','confetti','cheer',70),
 'hello':('raise','none','wave',70),
 'goodbye':('raise','none','slowwave',100),
 'thanks':('chest','none','dip',100),
 'sorry':('clasp','none','bow',110),
 'please':('clasp','none','plead',110),
 'yes':('down','none','nod',80),
 'no':('lowopen','none','no',90),
 'facepalm':('forehead','none','facepalm',100),
 'shrug':('shrug','none','shrug',90),
 'clapping':('clap','none','clap',70),
 'thumbs-up':('raise','none','thumb',90),
 'victory':('trophy','trophy','win',90),
 'mind-blown':('shrug','burst','freeze',80),
 'dizzy':('down','stars','wobble',90),
 'sick':('belly','thermo','breathe',110),
 'hungry':('belly','none','rub',90),
 'focused':('down','none','focus',110),
 'idea':('down','bulb','realization',80),
 'loading':('down','loader','wait',110),
 'error':('down','error','recoil',90),
 'success':('down','check','nod',90),
 'suspicious':('down','none','scan',100),
 'bored':('down','none','idle',110),
 'determined':('lowfist','none','set',90),
 'relieved':('down','none','exhale',110),
 'walking':('down','none','walk',70),
 'dancing':('dance','none','dance',70),
 'pointing':('pointer','none','point',90),
 'flag-waving':('raise','none','flag',70),
 'typing':('type','none','type',70),
 'peeking':('peek','none','peek',100),
 'stumbling':('balance','none','stumble',70),
 'foot-tap':('down','none','tap',90),
}
REDESIGNED=set(PERFORMANCES)
def frame_ms(spec): return PERFORMANCES[spec[0]][3]
def line(d,points,color,width=1): d.line(points,fill=color,width=width)
def bell(p): return (1-math.cos(2*math.pi*p))/2
def pulse(p): return (1-math.cos(4*math.pi*p))/2
def lerp(a,b,t): return tuple(round(x+(y-x)*t) for x,y in zip(a,b))

# Eye, mouth, brow, gaze. Each ID has an authored semantic direction.
FACES={
 'neutral':('open','flat','none',0),'happy':('happy','grin','none',0),
 'thinking':('open','flat','question',1),'confused':('uneven','crooked','question',0),
 'skeptical':('half','slant','one',1),'surprised':('wide','o','high',0),
 'smug':('half','smirk','one',0),'embarrassed':('low','small','high',0),
 'annoyed':('half','frown','flat',-1),'jealous':('half','clench','one',2),
 'laughing':('squeeze','laugh','none',0),'love':('happy','smile','none',0),
 'sad':('low','frown','sad',0),'crying':('squeeze','sob','sad',0),
 'angry':('open','teeth','angry',0),'excited':('star','laugh','none',0),
 'sleepy':('half','yawn','none',0),'sleeping':('closed','small','none',0),
 'wink':('wink','smile','none',0),'cool':('shades','smirk','none',0),
 'shocked':('wide','gasp','high',0),'worried':('low','crooked','sad',0),
 'nervous':('uneven','teeth','high',0),'proud':('closed','smile','none',0),
 'celebrating':('happy','laugh','none',0),'hello':('open','smile','none',0),
 'goodbye':('low','smile','sad',0),'thanks':('happy','smile','none',0),
 'sorry':('low','smallfrown','sad',0),'please':('puppy','small','sad',0),
 'yes':('happy','flat','none',0),'no':('half','flat','flat',0),
 'facepalm':('closed','frown','none',0),'shrug':('uneven','slant','question',0),
 'clapping':('happy','grin','none',0),'thumbs-up':('wink','smile','none',0),
 'victory':('happy','grin','none',0),'mind-blown':('wide','gasp','none',0),
 'dizzy':('spiral','crooked','none',0),'sick':('half','sob','sad',0),
 'hungry':('open','tongue','none',0),'focused':('open','small','flat',0),
 'idea':('puppy','grin','high',0),'loading':('half','small','none',1),
 'error':('uneven','crooked','high',0),'success':('happy','smile','high',0),
 'suspicious':('half','flat','one',-1),'bored':('half','flat','flat',0),
 'determined':('open','slant','angry',0),'relieved':('closed','exhale','none',0),
 'walking':('open','smile','none',0),'dancing':('happy','laugh','none',0),
 'pointing':('open','small','none',2),'flag-waving':('happy','smile','high',0),
 'typing':('low','flat','flat',0),'peeking':('wide','small','one',1),
 'stumbling':('wide','crooked','high',0),'foot-tap':('half','slant','flat',-1),
}
def performance_face(name,p):
    from build_collection import DARK,PINK,BLUE,GOLD,heart
    im=Image.new('RGBA',(24,26));d=ImageDraw.Draw(im)
    eyes,mouth,brow,gaze=FACES[name]
    b=bell(p);q=pulse(p)
    if name in ('thinking','confused','suspicious','jealous','loading','peeking'):
        gaze+=round(math.sin(2*math.pi*p))
    if name=='no': gaze=round(2*math.sin(4*math.pi*p))
    blink=.79<p<.87 and eyes not in ('closed','spiral','shades','star','wink','squeeze')
    if name=='sleepy' and b>.65: blink=True
    for j,x in enumerate((3,15)):
        if blink or eyes=='closed' or (eyes=='wink' and j==0 and not .64<p<.76):
            line(d,[(x,12),(x+5,12)],DARK,2 if blink else 1)
        elif eyes in ('happy','squeeze'):
            line(d,[(x,12),(x+2,10 if eyes=='happy' else 14),(x+5,12)],DARK,2)
        elif eyes=='star':
            d.polygon([(x+2,7),(x+3,10),(x+6,10),(x+4,12),(x+5,15),
                       (x+2,13),(x,15),(x,12),(x-2,10),(x+1,10)],fill=GOLD)
        elif eyes=='shades':
            d.rectangle((x-2,8,x+6,14),fill=DARK)
            line(d,[(x+round(b),9),(x+2+round(b),9)],'#6d8094')
        elif eyes=='spiral':
            line(d,[(x,8),(x+5,8),(x+5,14),(x,14),(x,10),(x+3,10),(x+3,12)],DARK)
        elif eyes=='half':
            line(d,[(x,11),(x+5,11)],DARK,2)
            d.rectangle((x+2+gaze,12,x+3+gaze,15),fill=DARK)
        elif eyes=='uneven' and j==1:
            line(d,[(x,13),(x+5,13)],DARK,2)
        else:
            yy=8 if eyes in ('wide','puppy') else 12 if eyes=='low' else 10
            hh=8 if eyes=='wide' else 6 if eyes=='puppy' else 4
            d.rectangle((x+1+gaze,yy,x+3+gaze,yy+hh),fill=DARK)
            if eyes=='puppy': d.point((x+1+gaze,yy),fill='white')
    if eyes=='shades':line(d,[(7,9),(16,9)],DARK,2)
    if brow=='high':
        line(d,[(2,5),(8,4)],DARK);line(d,[(14,4),(20,5)],DARK)
    elif brow=='sad':
        line(d,[(2,8),(8,5)],DARK);line(d,[(14,5),(20,8)],DARK)
    elif brow=='angry':
        line(d,[(2,6),(8,9)],DARK,2);line(d,[(14,9),(20,6)],DARK,2)
    elif brow=='one':
        line(d,[(2,5-round(b)),(8,5-round(b))],DARK);line(d,[(14,8),(20,9)],DARK)
    elif brow=='question':
        line(d,[(2,5),(8,4)],DARK);line(d,[(14,5),(20,7)],DARK)
    elif brow=='flat':
        line(d,[(2,7),(8,7)],DARK);line(d,[(14,7),(20,7)],DARK)
    if mouth=='flat':line(d,[(9,21),(14,21)],DARK)
    elif mouth=='small':line(d,[(10,21),(12,21)],DARK,2)
    elif mouth=='smile':line(d,[(8,20),(11,22),(15,20)],DARK)
    elif mouth=='smirk':line(d,[(9,22),(13,22),(16,19)],DARK)
    elif mouth=='slant':line(d,[(9,22),(14,20)],DARK)
    elif mouth=='frown':line(d,[(8,23),(11,21),(15,23)],DARK)
    elif mouth=='smallfrown':line(d,[(10,23),(12,22),(14,23)],DARK)
    elif mouth=='crooked':line(d,[(7,22),(10,20),(13,22),(16,20)],DARK)
    elif mouth=='clench':d.rectangle((9,20,15,22),outline=DARK)
    elif mouth in ('grin','laugh'):
        h=(2+round(2*b)) if mouth=='grin' else 4+round(4*q)
        d.rectangle((7,18,16,18+h),fill=DARK)
        if mouth=='laugh':d.rectangle((9,17+h,14,18+h),fill=PINK)
    elif mouth=='teeth':
        d.rectangle((7,19,17,24),fill=DARK);line(d,[(8,21),(16,21)],'white')
        for x in (10,13):line(d,[(x,20),(x,22)],DARK)
    elif mouth in ('o','gasp','yawn'):
        r=2 if mouth=='o' else 4
        h=3 if mouth=='o' else 4+round(2*b) if mouth=='gasp' else 2+round(5*b)
        d.ellipse((11-r,18,12+r,18+h),fill=DARK)
    elif mouth=='sob':line(d,[(8,23),(10,21),(12,23),(14,21),(16,23)],DARK,2)
    elif mouth=='tongue':
        line(d,[(8,20),(11,22),(15,20)],DARK)
        d.rectangle((13,22,15,24),fill=PINK)
    elif mouth=='exhale':
        d.ellipse((10,20,13+round(b),23),outline=DARK)
    if name in ('embarrassed','love'):
        for x in (1,18):d.rectangle((x,17,x+3,18),fill=PINK)
    if name=='crying':
        fall=round(6*q)
        for x in (5,18):d.rectangle((x,15,x+1,17+fall),fill=BLUE)
    if name=='sleeping':
        d.rectangle((8,18,16,25),fill=(0,0,0,0))
        d.ellipse((10,20,13,22+round(b)),outline=DARK)
    return im

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
    g=mascot=='gpt';rest=[(17,66),(79,66)] if g else [(17,42),(78,42)]
    chest=56 if g else 51
    return {
      'down':rest,'up':[(14,31),(81,31)],'raise':[rest[0],(80,30)],
      'hips':[(29,62),(68,62)],'chin':[rest[0],(58,57)],
      'shrug':[(14,43),(81,43)],'hug':[(42,61),(55,61)],
      'clasp':[(44,65),(53,65)],'chest':[rest[0],(56,chest)],
      'lowfist':[(25,65),(71,65)],'lowopen':[(17,52),(79,52)],
      'clap':[(44,61),(52,61)],'forehead':[rest[0],(49,35)],
      'wipe':[rest[0],(60,49)],'mouth':[rest[0],(55,57)],
      'cheeks':[(30,49),(67,49)],'belly':[rest[0],(52,64)],
      'pointer':[rest[0],(81,48)],'type':[(40,66),(56,66)],
      'peek':[(34,50),(62,50)],'dance':[(16,34),(79,34)],
      'balance':[(13,36),(81,43)],
      'trophy':[(40,65 if g else 59),(56,65 if g else 59)],
    }[pose]

def draw_hand(d,end,color,gpt,kind='mitten'):
    x,y=end;r=3 if gpt else 4
    d.polygon([(x-r+1,y-r),(x+r-1,y-r),(x+r,y-r+1),(x+r,y+r-1),
               (x+r-1,y+r),(x-r+1,y+r),(x-r,y+r-1),(x-r,y-r+1)],fill=color)
    if kind=='thumb':d.rectangle((x-r,y-r-4,x-r+2,y),fill=color)
    elif kind=='pointer':
        d.rectangle((x+1,y-2,x+7,y),fill=color)
        d.rectangle((x-2,y+1,x,y+5),fill=color)

def keyed(p,keys):
    """Uneven action beats with eased transitions, including a held crouch."""
    for (a,x),(b,y) in zip(keys,keys[1:]):
        if a<=p<=b:
            t=(p-a)/(b-a);t=t*t*(3-2*t)
            return x+(y-x)*t
    return keys[-1][1]

def claude_rig(name,p):
    """Weighted rectangular torso, attached tabs and four independent contacts.

    A community interpretation of the reference motion, not Anthropic's rig.
    Coordinates are absolute on the 96 px drawing grid. Planted toes stay at 71.
    """
    b=bell(p);wave=math.sin(2*math.pi*p)
    x=top=bottom=air=hand_lag=0
    if name in ('hello','goodbye','shrug','confused','skeptical','thinking'):
        x=round(2*wave)
    elif name=='flag-waving':x=-round(2*wave)
    elif name in ('thanks','sorry'):
        top=round(3*b);bottom=round(b)
    elif name in ('love','please','nervous'):
        top=bottom=round(b)
    elif name in ('proud','victory'):
        top=bottom=-round(b)
    elif name in ('sleeping','sick','relieved'):
        top=round(b)
    elif name in ('dizzy','stumbling'):
        x=round((3 if name=='stumbling' else 2)*wave)
        top=bottom=round(b)
    elif name=='walking':
        top=bottom=-round(abs(math.sin(4*math.pi*p)))
    elif name=='dancing':
        x=round(3*wave);top=bottom=-round(pulse(p))
    elif name in ('excited','celebrating'):
        flight=[(0,0),(.10,0),(.25,-7),(.32,-8),(.47,0),(1,0)]
        compress=[(0,0),(.06,3),(.10,3),(.20,0),(.45,0),(.54,3),(.68,0),(1,0)]
        air=round(keyed(p,flight))
        top=bottom=round(keyed(p,compress))
        # Tabs follow the crouch/flight a beat later, then settle after landing.
        lag_p=(p-.035)%1
        hand_lag=round(keyed(lag_p,flight)+keyed(lag_p,compress))-air-bottom
    shoulder=round((top+bottom)/2)+air
    feet=[]
    for i,base in enumerate((24,38,52,66)):
        toe_x=base+2;toe_y=71+air
        if name in ('walking','dancing'):
            phase=2*math.pi*p+(0,math.pi,.35,math.pi+.35)[i]+math.pi/4
            toe_x+=round((4 if name=='walking' else 2)*math.cos(phase))
            toe_y-=round(3*max(0,math.sin(phase)))
        elif name=='stumbling':
            recovering=(i==3 and wave>0) or (i==0 and wave<0)
            if recovering:
                toe_x+=round(3*wave);toe_y-=round(2*abs(wave))
        elif name=='foot-tap' and i==3:toe_y-=round(3*pulse(p))
        feet.append((toe_x,toe_y))
    return {'x':x,'top':24+top+air,'bottom':59+bottom+air,
            'face_y':top+air,'shoulder':shoulder,'hand_y':shoulder+hand_lag,
            'feet':feet,'air':air}

def draw_claude_tab(d,origin,end,color,kind='mitten'):
    """The original side tab articulates as one thick block, without an elbow."""
    x,y=end;ox,oy=origin
    # Outside the torso, a broad rectangular bridge overlaps both body and tab.
    # Inside the torso, the tab overlaps the body; no long forearm is drawn.
    if x<24 or x>71:
        d.rectangle((min(ox,x)-2,min(oy,y)-4,max(ox,x)+2,max(oy,y)+4),fill=color)
    d.rectangle((x-5,y-5,x+5,y+5),fill=color)
    if 30<=x<=65:
        # A small contact edge separates the block hand from the same-color body.
        d.rectangle((x-4,y+4,x+4,y+5),fill='#ad6247')
        line(d,[(x-5,y-2),(x-5,y+4)],'#ad6247',1)
    if kind=='thumb':d.rectangle((x-5,y-9,x-2,y),fill=color)
    elif kind=='pointer':
        d.rectangle((x+2,y-2,x+8,y),fill=color)
        d.rectangle((x-2,y+2,x,y+6),fill=color)

def draw_claude_legs(d,rig,color):
    for i,base in enumerate((24,38,52,66)):
        hip_x=base+2+rig['x'];hip_y=rig['bottom']
        toe_x,toe_y=rig['feet'][i]
        # Six-pixel-wide leg; hip follows the torso while the toe retains contact.
        near=i/3 if rig['x']>0 else (3-i)/3
        knee_x=round((hip_x+toe_x)/2+rig['x']*.65*near)
        knee_y=round((hip_y+toe_y)/2)
        d.polygon([(hip_x-2,hip_y),(hip_x+3,hip_y),
                   (knee_x+3,knee_y),(toe_x+3,toe_y),
                   (toe_x-2,toe_y),(knee_x-2,knee_y)],fill=color)

def render(mascot,spec,k=0,animated=False):
    from build_collection import ROOT,MINT,ORANGE,DARK,GOLD,BLUE,fx
    name,style,pose,effect,motion,category,tags=spec
    pose,effect,motion,_=PERFORMANCES[name]
    # One semantic pose at the seam. Static art uses an intentional readable key.
    static_frame={'neutral':0,'sleeping':0,'walking':6,'sleepy':17,
                  'clapping':9,'facepalm':17,'peeking':0}.get(name,9)
    p=(k if animated else static_frame)/(FRAMES-1)
    b=bell(p);q=pulse(p);wave=math.sin(2*math.pi*p)
    gpt=mascot=='gpt';color=MINT if gpt else ORANGE
    rig=None if gpt else claude_rig(name,p)
    rest=targets('down',mascot);ends=list(targets(pose,mascot))
    origins=[(25,56),(71,56)] if gpt else [(26,42),(69,42)]
    body=Image.new('RGBA',(96,96));d=ImageDraw.Draw(body)
    dip=round(2*b) if name in ('thanks','sorry','yes','success') else 0
    breathe=round(b) if name in ('sleeping','sick','relieved') else 0
    if gpt:
        layer=Image.new('RGBA',(78,78),color);layer.putalpha(gpt_mask(ROOT))
        body.alpha_composite(layer,(9,9));facebox=(37,34+dip,24,26)
    else:
        d.rectangle((24+rig['x'],rig['top'],71+rig['x'],rig['bottom']),fill=color)
        facebox=(29+rig['x'],27+dip+rig['face_y'],38,30)
    f=performance_face(name,p)
    if name=='proud':facebox=(facebox[0],facebox[1]-round(b),facebox[2],facebox[3])
    gaze_shift=round(wave) if name=='no' else 0
    body.alpha_composite(f.resize(facebox[2:],Image.Resampling.NEAREST),
                         (facebox[0]+gaze_shift,facebox[1]))
    if name=='typing':
        d.rectangle((31,54,65,65),fill='#6d8094')
        d.rectangle((34,56,62,63),fill=DARK)
        d.rectangle((28,68,68,73),fill='#6d8094')
    if name in ('hello','goodbye'):
        swings=4 if name=='hello' else 2
        ends[1]=(80+round(3*math.sin(swings*math.pi*p)),30-round(2*q))
    elif name=='shrug':ends=[(14,43-round(2*b)),(81,43-round(2*b))]
    elif name=='clapping':
        gap=round(7*(1+math.cos(4*math.pi*p))/2)
        ends=[(45-gap,58),(51+gap,58)]
    elif name=='love':ends=[(40+round(2*b),61),(57-round(2*b),61)]
    elif name=='crying':ends=[rest[0],(60-round(3*b),49)]
    elif name=='pointing':ends=[rest[0],(79+round(2*b),48)]
    elif name=='facepalm':ends=[rest[0],(49,35+round(2*b))]
    elif name=='sleepy':ends=[rest[0],(55,57-round(2*b))]
    elif name=='hungry':ends=[rest[0],(52+round(2*wave),64)]
    elif name in ('nervous','please'):
        squeeze=round(b)
        ends=[(44+squeeze,65),(53-squeeze,65)]
    elif name=='walking':
        stride=round(6*math.sin(2*math.pi*p+math.pi/4))
        ends=[(17,55+stride),(78,55-stride)]
    elif name=='dancing':ends=[(16,34+round(7*wave)),(79,34-round(7*wave))]
    elif name=='flag-waving':ends=[rest[0],(75+round(3*wave),30)]
    elif name=='typing':
        tap=round(2*math.sin(6*math.pi*p))
        ends=[(40,66+tap),(56,66-tap)]
    elif name=='stumbling':ends=[(13,36+round(3*wave)),(81,43-round(3*wave))]
    if not gpt:
        if name=='walking':
            swing=round(3*math.sin(2*math.pi*p+math.pi/4))
            ends=[(17,42+swing),(78,42-swing)]
        elif name=='flag-waving':ends[0]=(17,42+round(b))
        origins=[(26+rig['x'],42+rig['shoulder']),(69+rig['x'],42+rig['shoulder'])]
        ends=[(x+rig['x'],y+rig['hand_y']) for x,y in ends]
    for i,(origin,end) in enumerate(zip(origins,ends)):
        kind='thumb' if name=='thumbs-up' and i==1 else 'pointer' if name=='pointing' and i==1 else 'mitten'
        if not gpt:
            rest_end=(rest[i][0]+rig['x'],rest[i][1]+rig['hand_y'])
            if end==rest_end:
                x=(12 if i==0 else 72)+rig['x'];y=36+rig['hand_y']
                d.rectangle((x,y,x+11,y+11),fill=color)
            else:draw_claude_tab(d,origin,end,color,kind)
            continue
        elbow=(round(origin[0]+(end[0]-origin[0])*.55),
               round((origin[1]+end[1])*.5+3))
        line(d,[origin,elbow,end],color,4 if gpt else 8)
        draw_hand(d,end,color,gpt,kind)
    if not gpt:draw_claude_legs(d,rig,color)
    for i,x in enumerate((37,53) if gpt else ()):
        stride=round(3*math.sin(2*math.pi*p+i*math.pi+math.pi/4)) if name in ('walking','dancing','stumbling') else 0
        lift=max(0,-stride);top=74 if gpt else 59;bottom=84 if gpt else 71
        line(d,[(x+2,top),(x+2+stride,bottom-lift)],color,6)
        if gpt:d.rectangle((x-5+stride,bottom-3-lift,x+3+stride,bottom-lift),fill=color)
    if name=='foot-tap' and gpt:
        x=56 if gpt else 69;bottom=84 if gpt else 71
        d.rectangle((x-3,bottom-12,x+4,bottom+1),fill=(0,0,0,0))
        lift=round(3*q)
        line(d,[(x,bottom-12),(x,bottom-4-lift)],color,6)
        d.rectangle((x-3,bottom-5-lift,x+3,bottom-lift),fill=color)
    dx=dy=angle=0
    if name in ('excited','celebrating'):dy=-round(3*q)
    elif name in ('surprised','error'):dx=round(2*b)
    elif name=='dancing':dx=round(2*wave)
    elif name=='dizzy':angle=2*wave
    elif name=='stumbling':angle=-3*wave
    elif name=='peeking':dy=round(6*(1-b))
    if not gpt and name!='peeking':dx=dy=angle=0
    if angle:body=body.rotate(angle,resample=Image.Resampling.NEAREST,center=(48,55))
    im=Image.new('RGBA',(96,96));im.alpha_composite(body,(dx,dy));a=ImageDraw.Draw(im)
    if name=='peeking':
        a.rectangle((25,49,70,86),fill='#6d8094')
        for x in (34,62):draw_hand(a,(x,50),color,gpt)
    elif name=='flag-waving':
        x,y=ends[1];line(a,[(x,y),(x,y-17)],DARK,2)
        flutter=round(2*math.sin(6*math.pi*p))
        a.polygon([(x+1,y-17),(x+14,y-16+flutter),(x+14,y-7+flutter),(x+1,y-8)],fill=BLUE)
    elif effect=='trophy':
        y=60 if gpt else 54
        tx=0 if gpt else rig['x'];y+=0 if gpt else rig['hand_y']
        a.rectangle((43+tx,y,53+tx,y+8),fill=GOLD)
        line(a,[(43+tx,y+2),(39+tx,y+2),(39+tx,y+6),(43+tx,y+7)],GOLD,2)
        line(a,[(53+tx,y+2),(57+tx,y+2),(57+tx,y+6),(53+tx,y+7)],GOLD,2)
        line(a,[(48+tx,y+8),(48+tx,y+15),(42+tx,y+15),(54+tx,y+15)],GOLD,2)
    elif effect=='thermo':
        line(a,[(65,48),(65,59)],'#d75353',2)
        a.ellipse((62,56,68,62),fill='#d75353')
    elif effect=='loader':
        step=round(p*8)%8
        for j in range(8):
            theta=j*math.pi/4;x=round(82+6*math.cos(theta));y=round(16+6*math.sin(theta))
            a.rectangle((x,y,x+1,y+1),fill=BLUE if j==step else '#c9d3df')
    elif effect=='stars':
        for x,y in ((14,15),(80,17)):
            y+=round(2*wave);line(a,[(x-2,y),(x+2,y)],GOLD);line(a,[(x,y-2),(x,y+2)],GOLD)
    elif effect=='confetti':
        if .25<p<.80:
            for i,c in ((0,GOLD),(1,BLUE)):
                x,y=ends[i];x+=dx;y+=dy
                yy=y-8+round(5*math.sin(2*math.pi*(p-.25)))
                for sx,sy in ((-3,0),(2,-3),(4,2)):
                    a.rectangle((x+sx,yy+sy,x+sx+1,yy+sy+1),fill=c)
    elif effect=='burst':
        h=round(2*b)
        a.polygon([(40,13),(43,5-h),(47,10),(52,4-h),(55,13)],fill=GOLD)
    else:fx(im,effect,round(3*b))
    return im
