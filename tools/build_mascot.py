"""Reproducible pixel mascot: Pillow, no image generation at render time.

The silhouette bitmap is sampled from Sai's approved medium-weight reference.
Eyes, brows, arms and hands are drawn independently on a fixed pixel grid.
Run: python build_mascot.py
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'mascots' / 'gpt'
MINT = '#84edbd'
DARK = '#0a0d0c'
ORDER = ['neutral', 'happy', 'thinking', 'confused', 'skeptical',
         'surprised', 'smug', 'embarrassed', 'annoyed', 'jealous']
POSES = {'happy': 'up', 'thinking': 'chin', 'skeptical': 'raise',
         'surprised': 'up', 'annoyed': 'hips', 'jealous': 'hips'}


def silhouette():
    seed = json.loads((ASSETS / 'silhouette.json').read_text())
    mask = Image.new('L', (78, 78))
    mask.putdata([255 if (int(row, 16) >> (77-x)) & 1 else 0
                  for row in seed['rows'] for x in range(78)])
    # Remove original arms. Their replacements live on their own layer.
    d = ImageDraw.Draw(mask)
    d.rectangle((0, 40, 12, 63), fill=0)
    d.rectangle((67, 40, 77, 63), fill=0)
    # Slightly thin the knot, preserving feet and the generous face area.
    thin = mask.filter(ImageFilter.MinFilter(3))
    thin.paste(mask.crop((0, 64, 78, 78)), (0, 64))
    d = ImageDraw.Draw(thin)
    # Rebuild face as a solid panel; expression marks never alter silhouette.
    d.polygon([(32,26),(43,26),(43,28),(48,28),(48,30),(49,30),
               (49,46),(46,46),(46,49),(33,49),(33,47),(29,47),
               (29,30),(30,30),(30,28),(32,28)], fill=255)
    body = Image.new('RGBA', mask.size, MINT)
    body.putalpha(thin)
    return body


def eyes(name):
    out = Image.new('RGBA', (78,78))
    d = ImageDraw.Draw(out)
    def box(x,y,w,h): d.rectangle((x,y,x+w-1,y+h-1), fill=DARK)
    def line(points, width=2): d.line(points, fill=DARK, width=width)
    if name == 'neutral':
        box(33,34,3,6); box(44,34,3,6)
    elif name == 'happy':
        line([(32,37),(32,35),(34,33),(36,35),(36,37)])
        line([(43,37),(43,35),(45,33),(47,35),(47,37)])
    elif name == 'thinking':
        box(34,32,3,4); box(45,32,3,4)
        line([(32,29),(36,29)],1)
    elif name == 'confused':
        box(33,32,3,7); box(43,37,5,2)
        line([(31,28),(36,27)],2)
    elif name == 'skeptical':
        box(33,34,3,6); box(42,35,6,2); box(45,37,3,3)
        line([(31,29),(36,29)],2)
    elif name == 'surprised':
        box(32,32,4,10); box(43,32,4,10)
        line([(31,28),(36,28)],1); line([(42,28),(47,28)],1)
    elif name == 'smug':
        box(31,36,6,2); box(42,36,6,2)
        box(35,38,2,2); box(46,38,2,2)
    elif name == 'embarrassed':
        box(34,37,3,4); box(45,37,3,4)
        d.rectangle((30,42,34,43),fill='#eab4b3')
        d.rectangle((44,42,48,43),fill='#eab4b3')
    elif name == 'annoyed':
        line([(31,31),(36,33)],2); line([(42,33),(47,31)],2)
        box(33,35,3,5); box(44,35,3,5)
    elif name == 'jealous':
        box(34,35,3,5); box(46,35,3,5)
        line([(31,31),(36,33)],2); line([(43,30),(48,30)],2)
    return out


def arms(pose):
    out = Image.new('RGBA',(78,78))
    d = ImageDraw.Draw(out)
    def arm(points,hand):
        d.line(points,fill=MINT,width=3)
        x,y=hand
        d.rectangle((x,y,x+4,y+5), fill=MINT)
    if pose == 'up':
        arm([(13,48),(7,48),(5,42)],(2,37))
        arm([(65,48),(71,48),(74,42)],(72,37))
    elif pose == 'hips':
        arm([(13,47),(6,50),(10,55),(14,53)],(12,50))
        arm([(65,47),(73,50),(70,55),(66,53)],(62,50))
    else:
        arm([(13,47),(8,51),(6,57)],(3,55))
        if pose == 'raise':
            arm([(65,48),(72,48),(73,42)],(71,37))
        elif pose == 'chin':
            arm([(65,48),(69,51),(61,54),(53,47)],(49,43))
        else:
            arm([(65,47),(70,51),(73,57)],(71,55))
    return out


def font(size):
    try:
        return ImageFont.truetype('DejaVuSansMono.ttf',size)
    except OSError:
        return ImageFont.load_default(size=size)


def center_text(draw, text, y, left, width, size, fill):
    f=font(size)
    w=draw.textlength(text,font=f)
    draw.text((left+(width-w)/2,y),text,font=f,fill=fill)


def main():
    outdir=ASSETS
    layers=outdir/'layers'
    layers.mkdir(parents=True,exist_ok=True)
    body=silhouette()
    body.save(layers/'body.png')
    names=[]
    sheet=Image.new('RGB',(1544,848),'#191d1b')
    d=ImageDraw.Draw(sheet)
    d.text((30,23),'GPT / CODE-DRAWN EXPRESSION STUDY',font=font(30),fill='#f0f5f1')
    d.text((30,66),'One fixed silhouette. Independent eyes and hands. No generative redraws.',font=font(16),fill='#a7b8ac')
    for i,name in enumerate(ORDER):
        hand=arms(POSES.get(name,'down'))
        face=eyes(name)
        sprite=body.copy()
        sprite.alpha_composite(hand)
        sprite.alpha_composite(face)
        filename=f'gpt-{i+1:02}-{name}.png'
        sprite.resize((624,624),Image.Resampling.NEAREST).save(outdir/filename)
        face.save(layers/f'eyes-{name}.png')
        row,col=divmod(i,5)
        x,y=22+col*304,108+row*360
        d.rounded_rectangle((x,y,x+286,y+340),radius=12,fill='#0a0d0c')
        big=sprite.resize((234,234),Image.Resampling.NEAREST)
        sheet.paste(big,(x+26,y+8),big)
        center_text(d,name.upper(),y+254,x,286,18,'#e7f0e9')
        # A deliberately small second view helps judge actual video readability.
        small=sprite.resize((62,62),Image.Resampling.NEAREST)
        sheet.paste(small,(x+111,y+278),small)
        names.append(filename)
    for pose in ['down','up','raise','chin','hips']:
        arms(pose).save(layers/f'arms-{pose}.png')
    sheet.save(outdir/'gpt-expression-sheet.png')
    (outdir/'render-info.json').write_text(json.dumps({'canvas':[78,78], 'color':MINT,
        'expressions':names, 'layers':'layers/', 'method':'Pillow pixel drawing'},indent=2)+'\n')
    print(outdir/'gpt-expression-sheet.png')


if __name__=='__main__':
    main()
