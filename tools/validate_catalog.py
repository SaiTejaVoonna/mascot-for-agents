"""Validate every downloadable collection export, loop and source pack."""
import json, hashlib, zipfile
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'site/catalog.json').read_text())
assert data['version']==3
assert len(data['expressions'])==58
ids=[e['id'] for e in data['expressions']]
assert len(set(ids))==58
count=0
for m in data['mascots']:
    hashes=[]
    for e in data['expressions']:
        for fmt in ('png','gif','webp'):
            p=(root/'site'/m['base']/f"{e['id']}.{fmt}").resolve()
            assert p.is_relative_to(root) and p.is_file(),p
            with Image.open(p) as im:
                im.load()
                rgba=im.convert('RGBA');assert rgba.getchannel('A').getextrema()==(0,255),p
                if fmt=='png':hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
                else:
                    assert im.n_frames>1 and im.info.get('loop')==0,p
                    first=im.convert('RGBA').tobytes();changed=False
                    for i in range(im.n_frames):
                        im.seek(i);assert im.convert('RGBA').getchannel('A').getextrema()==(0,255),p
                        changed|=im.convert('RGBA').tobytes()!=first
                    assert changed,f'Static animation: {p}'
            count+=1
    assert len(set(hashes))==58,f'Duplicate stills in {m["id"]}'
    with zipfile.ZipFile((root/'site'/m['pack']).resolve()) as z:
        assert z.testzip() is None
        assert 'tools/build_collection.py' in z.namelist()
        assert 'tools/animate_mascots.py' in z.namelist()
print(f'Validated {count} exports, 116 distinct character/expression pairs and 2 source ZIPs.')
