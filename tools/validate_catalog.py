"""Check the starter catalog and downloadable PNG exports."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
site = root / 'site'
data = json.loads((site / 'catalog.json').read_text())
seen = set()
count = 0
for mascot in data['mascots']:
    assert mascot['id'] not in seen, 'Duplicate mascot ID'
    seen.add(mascot['id'])
    names = mascot['expressions']
    assert len(names) == len(set(names)), 'Duplicate expression'
    for index, name in enumerate(names, 1):
        file = (site / mascot['assetBase'] / f"{mascot['id']}-{index:02}-{name}.png").resolve()
        assert file.is_relative_to(root), 'Asset path escapes repository'
        assert file.is_file(), f'Missing export: {file}'
        with Image.open(file) as im:
            im.load()
            assert im.format == 'PNG', f'Unexpected format: {file}'
            assert im.mode == 'RGBA', f'PNG lacks alpha: {file}'
            assert im.getchannel('A').getextrema() == (0, 255), f'Invalid transparency: {file}'
        count += 1
assert count, 'No downloadable expressions'
print(f'Validated {count} PNG exports across {len(seen)} catalog entries.')
