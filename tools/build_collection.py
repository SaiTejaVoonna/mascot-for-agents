"""Build 58 paired emotes as transparent PNG, GIF and animated WebP.
No API keys or model calls. Run from any working directory.
"""
from pathlib import Path
import json, math, zipfile
from PIL import Image, ImageDraw, ImageFont
from build_mascot import silhouette, arms
ROOT=Path(__file__).resolve().parents[1]
# id, face, pose, effect, motion, category, search aliases
SPECS=[
('neutral','open','down','none','breathe','Everyday','calm 😐'),
('happy','happy','down','none','breathe','Joy','smile 😊 😄'),
('thinking','side','chin','none','tilt','Everyday','hmm 🤔'),
('confused','uneven','shrug','question','tilt','Everyday','what 😕'),
('skeptical','skeptic','raise','none','tilt','Everyday','doubt 🤨'),
('surprised','wide','up','rays','pop','Surprise','wow 😮'),
('smug','half','hips','spark','tilt','Attitude','heh 😏'),
('embarrassed','shy','down','blush','sway','Shy','oops 😳'),
('annoyed','angry','hips','anger','shake','Attitude','irritated 😒'),
('jealous','side','hips','none','sway','Attitude','envy jealous'),
('laughing','happy','down','none','laugh','Joy','lol 😂'),
('love','heart','hug','none','sway','Joy','love ❤️ 🥰'),
('sad','sad','down','none','breathe','Sad','unhappy 🙁'),
('crying','sad','wipe','tears','sob','Sad','cry 😢'),
('angry','angry','up','anger','shake','Attitude','mad 😡'),
('excited','star','up','confetti','bounce','Joy','yay 🤩'),
('sleepy','half','down','zzz','breathe','Everyday','tired 🥱'),
('sleeping','closed','hug','zzz','breathe','Everyday','sleep 😴'),
('wink','wink','down','none','breathe','Everyday','😉'),
('cool','shades','hips','none','sway','Attitude','sunglasses 😎'),
('shocked','wide','shrug','bolt','pop','Surprise','😱 shock'),
('worried','sad','hug','sweat','sway','Sad','anxious 😟'),
('nervous','uneven','hug','sweat','shake','Shy','😬 nervous'),
('proud','closed','hips','star','bounce','Attitude','pride'),
('celebrating','happy','up','confetti','wave','Joy','party 🎉 🥳'),
('hello','open','raise','hello','wave','Gestures','hi hey 👋'),
('goodbye','sad','raise','bye','wave','Gestures','bye 👋'),
('thanks','happy','heart','none','bow','Gestures','thank you 🙏'),
('sorry','sad','hug','blush','bow','Shy','apology 🥺'),
('please','puppy','hug','spark','breathe','Shy','beg 🥺'),
('yes','happy','raise','check','nod','Gestures','okay ✅ 👍'),
('no','angry','cross','cross','shake','Gestures','nope ❌'),
('facepalm','closed','face','sweat','tilt','Attitude','🤦 fail'),
('shrug','uneven','shrug','none','sway','Gestures','idk 🤷'),
('clapping','happy','clap','rays','clap','Gestures','applause 👏'),
('thumbs-up','wink','raise','none','hold','Gestures','good 👍'),
('victory','happy','up','trophy','bounce','Joy','win 🏆'),
('mind-blown','wide','shrug','burst','pop','Surprise','🤯 mind blown'),
('dizzy','spiral','down','stars','sway','Surprise','😵 dizzy'),
('sick','uneven','hug','thermo','breathe','Sad','ill 🤒'),
('hungry','wide','clap','snack','bounce','Everyday','food hungry 😋'),
('focused','angry','chin','target','breathe','Work','focus coding'),
('idea','wide','raise','bulb','pop','Work','eureka 💡'),
('loading','half','chin','loader','breathe','Work','working wait ⏳'),
('error','wide','shrug','error','shake','Work','bug failure 🚨'),
('success','happy','up','check','bounce','Work','done passed ✅'),
('suspicious','side','cross','question','tilt','Attitude','sus 🧐'),
('bored','half','down','dots','breathe','Everyday','meh 😑'),
('determined','angry','hips','flame','bounce','Work','ready 💪'),
('relieved','closed','down','sigh','bow','Everyday','phew 😌'),
]

SPECS += [
('walking','open','down','none','walk','Actions','walk steps 🚶'),
('dancing','happy','up','none','dance','Actions','dance groove 💃'),
('pointing','open','raise','none','point','Actions','point look 👉'),
('flag-waving','happy','raise','none','flag','Actions','flag cheer 🚩'),
('typing','angry','chin','none','type','Work','type keyboard laptop ⌨️'),
('peeking','uneven','hug','none','peek','Actions','peek hide 🫣'),
('stumbling','wide','shrug','none','stumble','Actions','stumble trip balance'),
('foot-tap','half','down','none','tap','Actions','tap impatient foot'),
]

from animate_mascots import PERFORMANCES
assert {s[0] for s in SPECS}==set(PERFORMANCES), 'Each reaction needs an explicit performance'
SPECS=[(s[0],s[1],*PERFORMANCES[s[0]][:3],s[5],s[6]) for s in SPECS]

DARK='#202531';MINT='#79dfb0';ORANGE='#d77757';BLUE='#4386e6';GOLD='#e6ac38';PINK='#ef839f'
def line(d,points,fill=DARK,width=2):d.line(points,fill=fill,width=width)
def heart(d,x,y,c,size=1):
    pts=[(0,1),(1,0),(2,0),(3,1),(4,0),(5,0),(6,1),(6,3),(3,6),(0,3)]
    d.polygon([(x+a*size,y+b*size) for a,b in pts],fill=c)
def face(style,blink=False):
    im=Image.new('RGBA',(24,26));d=ImageDraw.Draw(im)
    for j,x in enumerate([3,15]):
        if blink and style not in ('heart','star','shades','spiral','closed'):line(d,[(x,12),(x+5,12)])
        elif style in ('happy','closed'):line(d,[(x,12),(x+2,10 if style=='happy' else 12),(x+5,12)])
        elif style=='heart':heart(d,x-1,8,PINK)
        elif style=='star':d.polygon([(x+2,7),(x+3,10),(x+6,10),(x+4,12),(x+5,15),(x+2,13),(x,15),(x,12),(x-2,10),(x+1,10)],fill=GOLD)
        elif style=='shades':
            d.rectangle((x-2,8,x+6,14),fill=DARK);line(d,[(x,9),(x+2,9)],'#6d8094',1)
        elif style=='spiral':line(d,[(x,8),(x+5,8),(x+5,14),(x,14),(x,10),(x+3,10),(x+3,12)],width=1)
        elif style=='wink' and j==0:line(d,[(x,12),(x+5,12)])
        elif style=='sad':
            d.rectangle((x+1,11,x+3,16),fill=DARK);line(d,[(x-1,7 if j==0 else 9),(x+5,9 if j==0 else 7)],width=1)
        elif style=='angry':
            d.rectangle((x+1,12,x+3,16),fill=DARK);line(d,[(x-1,8 if j==0 else 10),(x+5,10 if j==0 else 8)])
        elif style=='half' or (style=='skeptic' and j==1):line(d,[(x,12),(x+5,12)]);d.rectangle((x+3,13,x+4,15),fill=DARK)
        elif style=='uneven' and j==1:line(d,[(x,14),(x+5,14)])
        else:
            y=8 if style=='wide' else 10
            dx=2 if style=='side' else 0
            d.rectangle((x+dx,y,x+dx+3,17 if style in ('wide','puppy') else 15),fill=DARK)
            if style=='puppy':d.point((x+dx,y),fill='white')
            if style in ('skeptic','uneven'):line(d,[(x-1,6),(x+5,5)],width=1)
    if style=='shades':line(d,[(6,9),(17,9)])
    if style=='wide':d.rectangle((10,19,13,23),fill=DARK)
    elif style in ('happy','heart','wink','star'):line(d,[(9,20),(11,22),(14,20)],width=1)
    elif style=='sad':line(d,[(9,23),(11,21),(14,23)],width=1)
    elif style=='shy':line(d,[(10,23),(13,23)],width=1)
    return im

def hand_layer(pose,color,t):
    im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
    ends={'down':[(15,69),(83,69)],'up':[(10,39),(86,39)],'hips':[(23,65),(73,65)],'raise':[(14,69),(85,39)],'chin':[(13,70),(63,57)],'shrug':[(9,50),(88,50)],'hug':[(41,67),(55,67)],'cross':[(58,64),(38,64)],'clap':[(44-int(t*2),64),(52+int(t*2),64)],'face':[(15,69),(49,47)],'wipe':[(15,69),(63,50)]}[pose]
    for origin,end in zip([(23,57),(73,57)],ends):
        line(d,[origin,((origin[0]+end[0])//2,end[1]+3),end],color,3)
        x,y=end;d.rectangle((x-2,y-2,x+3,y+3),fill=color)
    return im

def fx(im,effect,k):
    d=ImageDraw.Draw(im);p=k/12;rise=int(4*p);c=BLUE
    font=ImageFont.load_default(size=12)
    if effect in ('question','dots','zzz','hello','bye','error'):
        text={'question':'?','dots':'.'*(1+k//4),'zzz':'zZ','hello':'HI','bye':'BYE','error':'!'}[effect]
        d.text((72,8-rise//2),text,font=font,fill=c if effect!='error' else '#d75353')
    elif effect in ('heart','hearts','envy'):
        heart(d,77,15-rise,PINK if effect!='envy' else '#9b83c7')
        if effect=='hearts':heart(d,8,27-rise,PINK)
    elif effect=='blush':
        d.rectangle((40,53,44,54),fill=PINK);d.rectangle((57,53,61,54),fill=PINK)
    elif effect in ('rays','laugh','burst'):
        for x,y in [(16,18),(47,7),(82,24)]:line(d,[(x,y),(x,y+5)],GOLD,2)
        if effect=='burst':d.polygon([(40,10),(45,2),(49,9),(57,3),(55,13)],fill=GOLD)
    elif effect in ('confetti','stars','star','spark'):
        for i,(x,y) in enumerate([(11,16),(79,13),(87,34),(7,40)]):
            yy=y+(k+i*3)%10 if effect=='confetti' else y
            cc=[GOLD,PINK,BLUE,'#9f8bc7'][i]
            line(d,[(x-2,yy),(x+2,yy)],cc,1);line(d,[(x,yy-2),(x,yy+2)],cc,1)
    elif effect in ('sweat','tears','sigh'):
        for x,y in ([(65,33)] if effect=='sweat' else [(40,52),(59,52)] if effect=='tears' else [(76,52)]):
            yy=y+int(p*7);d.polygon([(x,yy),(x-2,yy+4),(x+2,yy+4)],fill='#73a8d5')
    elif effect=='anger':
        for x,y in [(77,15),(84,21)]:line(d,[(x-3,y),(x,y),(x,y-3)],'#d75353',2)
    elif effect in ('bolt','flame'):
        d.polygon([(80,6),(75,18),(81,18),(77,29),(88,14),(82,14),(85,6)],fill=GOLD if effect=='bolt' else '#ea8d42')
    elif effect in ('check','cross','thumb'):
        if effect=='check':line(d,[(76,17),(80,21),(88,11)],'#47976f',3)
        elif effect=='cross':line(d,[(77,12),(86,21)],'#ce655c',3);line(d,[(86,12),(77,21)],'#ce655c',3)
        else:d.rectangle((78,15,86,22),fill=GOLD);d.rectangle((81,9,84,19),fill=GOLD)
    elif effect=='bulb':
        d.ellipse((76,6,88,18),fill=GOLD);d.rectangle((80,18,84,21),fill=DARK)
    elif effect=='loader':
        for j in range(8):
            a=j*math.pi/4;d.rectangle((int(82+6*math.cos(a)),int(16+6*math.sin(a)),int(82+6*math.cos(a))+1,int(16+6*math.sin(a))+1),fill=BLUE if j<=k%8 else '#c9d3df')
    elif effect=='target':d.ellipse((77,9,89,21),outline=BLUE,width=2);d.ellipse((81,13,85,17),fill=BLUE)
    elif effect=='trophy':d.rectangle((77,8,87,16),fill=GOLD);line(d,[(82,16),(82,22),(77,22),(87,22)],GOLD,2)
    elif effect=='thermo':line(d,[(80,8),(80,22)],'#d75353',3);d.ellipse((77,20,83,26),fill='#d75353')
    elif effect=='snack':d.rectangle((75,12,89,21),fill='#b88c56');line(d,[(75,15),(89,15)],'#e8b76f',2)

def render(mascot,spec,k=0,animated=False):
    from animate_mascots import render as articulated_render
    return articulated_render(mascot,spec,k,animated)

def gif_frame(im):
    # Stable palette: reserve index zero for transparency in every frame.
    rgba=im.resize((288,288),Image.Resampling.NEAREST)
    palette=Image.new('P',(1,1));colors=['#000000',MINT,ORANGE,DARK,BLUE,GOLD,PINK,'#9b83c7','#73a8d5','#d75353','#9f8bc7','#47976f','#ce655c','#c9d3df','#ea8d42','#b88c56','#e8b76f','#ffffff','#6d8094','#ad6247']
    rgb=[]
    for c in colors:rgb.extend(tuple(bytes.fromhex(c[1:])))
    palette.putpalette(rgb+[0]*(768-len(rgb)))
    rgbim=rgba.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE)
    rgbim.paste(0,mask=rgba.getchannel('A').point(lambda a:255 if a==0 else 0))
    return rgbim

def main():
    (ROOT/'packs').mkdir(parents=True,exist_ok=True)
    (ROOT/'site').mkdir(parents=True,exist_ok=True)
    from animate_mascots import FRAMES, frame_ms, REDESIGNED
    catalog={'version':3,'revision':8,'redesigned':sorted(REDESIGNED),'expressions':[],'mascots':[]}
    expressions=[{'id':s[0],'name':s[0].replace('-',' ').title(),'category':s[5],'tags':s[6].split(),'motion':s[4],'pose':s[2],'durationMs':FRAMES*frame_ms(s)} for s in SPECS]
    catalog['expressions']=expressions
    for mascot in ['gpt','claude']:
        folder=f'{mascot}-v5'
        out=ROOT/'assets'/'collection'/folder;out.mkdir(parents=True,exist_ok=True)
        for spec in SPECS:
            duration=frame_ms(spec)
            still=render(mascot,spec)
            still.resize((384,384),Image.Resampling.NEAREST).save(out/f'{spec[0]}.png')
            frames=[render(mascot,spec,k,True) for k in range(FRAMES)]
            gifs=[gif_frame(f) for f in frames]
            gifs[0].save(out/f'{spec[0]}.gif',save_all=True,append_images=gifs[1:],duration=duration,loop=0,transparency=0,disposal=2,optimize=False)
            webps=[f.resize((288,288),Image.Resampling.NEAREST) for f in frames]
            from io import BytesIO
            buffer=BytesIO()
            webps[0].save(buffer,format='WEBP',save_all=True,append_images=webps[1:],duration=duration,loop=0,lossless=True,method=4)
            payload=buffer.getvalue()
            assert len(payload)>20, spec[0]
            (out/f'{spec[0]}.webp').write_bytes(payload)
        # Compact contact sheet for review.
        sheet=Image.new('RGB',(1000,math.ceil(len(SPECS)/8)*170),'#f5f2ee');d=ImageDraw.Draw(sheet)
        for i,spec in enumerate(SPECS):
            x=(i%8)*125;y=(i//8)*170
            sprite=render(mascot,spec).resize((110,110),Image.Resampling.NEAREST)
            sheet.paste(sprite,(x+7,y+10),sprite);d.text((x+5,y+126),spec[0],fill=DARK,font=ImageFont.load_default(size=12))
        sheet.save(out/'contact-sheet.jpg',quality=90)
        manifest={'id':mascot,'name':'GPT' if mascot=='gpt' else 'Claude','status':'Community expression study','source':'tools/build_collection.py','formats':['png','gif','webp'],'expressions':expressions,'revision':'v8','frames':FRAMES,'durationMsByExpression':{s[0]:FRAMES*frame_ms(s) for s in SPECS},'redesigned':sorted(REDESIGNED),'canvas':[96,96]}
        (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        with zipfile.ZipFile(ROOT/'packs'/f'{mascot}-58-emotes-v5.zip','w',zipfile.ZIP_DEFLATED) as z:
            for f in out.iterdir():z.write(f,f'{mascot}/{f.name}')
            for f in [ROOT/'tools/animate_mascots.py',ROOT/'tools/build_collection.py',ROOT/'tools/build_mascot.py',ROOT/'requirements.txt',ROOT/'README.md',ROOT/'tools/validate_catalog.py',ROOT/'tools/check_claude_shape.py',ROOT/'AGENTS.md',ROOT/'docs/CLAUDE_REFERENCE.md',ROOT/'index.html',ROOT/'site/index.html',ROOT/'site/app.js',ROOT/'site/style.css',ROOT/'assets/README.md',ROOT/'assets/mascots/gpt/silhouette.json']:
                z.write(f,f.relative_to(ROOT))
        catalog['mascots'].append({'id':mascot,'name':'GPT' if mascot=='gpt' else 'Claude','base':f'../assets/collection/{folder}/','pack':f'../packs/{mascot}-58-emotes-v5.zip'})
    (ROOT/'site/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Built 116 PNGs, 116 GIF loops, 116 animated WebPs and two source packs.')
if __name__=='__main__':main()
