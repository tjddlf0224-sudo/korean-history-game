#!/usr/bin/env python3
"""격자가 4x3이 아닌 걷기 시트에서 칸을 골라 12장(down/up/right + left 반전)으로 자른다.
사용: crop_cells.py SRC --grid ROWSxCOLS --bg green --out DIR --map down=r,c;r,c;r,c up=... right=...
"""
import argparse, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'www', 'assets', 'player'))
from crop_player import key_out
from PIL import Image
ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('--grid', required=True); ap.add_argument('--bg', default='green')
ap.add_argument('--out', required=True); ap.add_argument('--pad', type=int, default=6)
ap.add_argument('--map', nargs='+', required=True)
a = ap.parse_args()
R, C = map(int, a.grid.split('x'))
im = Image.open(a.src).convert('RGB'); W, H = im.size; cw, ch = W / C, H / R
os.makedirs(a.out, exist_ok=True)
for m in a.map:
    d, cells = m.split('=')
    for i, rc in enumerate(cells.split(';')):
        r, c = map(int, rc.split(','))
        crop = im.crop((int(c*cw)+a.pad, int(r*ch)+a.pad, int((c+1)*cw)-a.pad, int((r+1)*ch)-a.pad))
        out = key_out(crop, a.bg); out.save(os.path.join(a.out, f'{d}_{i}.png'))
        if d == 'right':
            out.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(a.out, f'left_{i}.png'))
print('ok')
