#!/usr/bin/env python3
"""AI 시트에서 인물을 '덩어리'로 찾아 자른다(격자가 틀려도, 인물이 칸을 넘어도 됨).
전체를 크로마키 → 덩어리 라벨 → 작은 조각(깃털 끝 등)은 가장 가까운 큰 덩어리에 붙임 →
줄(row)별로 왼쪽부터 번호. --list 로 번호 확인, --map 으로 골라 저장.
사용: crop_blobs.py SRC --bg green --list
      crop_blobs.py SRC --bg green --out DIR --map down=0,1,2 up=4,5,6 right=7,11,12
"""
import argparse, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'www', 'assets', 'player'))
from crop_player import key_out

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('--bg', default='green')
ap.add_argument('--out'); ap.add_argument('--list', action='store_true')
ap.add_argument('--map', nargs='*', default=[]); ap.add_argument('--names', nargs='*', default=[])
ap.add_argument('--mask', nargs='*', default=[], help='x0,y0,x1,y1 영역을 배경으로(로고 지우기)')
ap.add_argument('--noflip', action='store_true')
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
rgba = np.array(key_out(im, a.bg))
for m in a.mask:
    x0, y0, x1, y1 = map(int, m.split(',')); rgba[y0:y1, x0:x1, 3] = 0
alpha = rgba[..., 3] > 0
lab, n = ndimage.label(alpha, structure=np.ones((3, 3)))
sizes = ndimage.sum(alpha, lab, range(1, n + 1))
big = [i + 1 for i, s in enumerate(sizes) if s >= 0.15 * sizes.max()]
boxes = {i: ndimage.find_objects((lab == i).astype(int))[0] for i in big}
# 작은 조각을 가까운 큰 덩어리에 붙이기(너무 작은 먼지는 버림)
cent = {i: ndimage.center_of_mass(lab == i) for i in big}
owner = np.zeros_like(lab)
for i in big: owner[lab == i] = i
objs = ndimage.find_objects(lab)
for j in range(1, n + 1):
    if j in big or sizes[j-1] < 40: continue
    sl = objs[j-1]; cy = (sl[0].start + sl[0].stop) / 2; cx = (sl[1].start + sl[1].stop) / 2
    best = min(big, key=lambda i: max(0, boxes[i][1].start - cx, cx - boxes[i][1].stop) * 3 + max(0, boxes[i][0].start - cy, cy - boxes[i][0].stop))
    b = boxes[best]
    if b[1].start - 25 <= cx <= b[1].stop + 25 and b[0].start - 40 <= cy <= b[0].stop + 25:
        owner[lab == j] = best
# 줄 나누기: 세로 중심으로 묶고, 줄 안에서 왼쪽부터
items = sorted(big, key=lambda i: cent[i][0])
rows = []
for i in items:
    if rows and abs(cent[i][0] - np.mean([cent[k][0] for k in rows[-1]])) < 0.5 * (boxes[i][0].stop - boxes[i][0].start):
        rows[-1].append(i)
    else:
        rows.append([i])
order = [i for r in rows for i in sorted(r, key=lambda k: cent[k][1])]

def cut(i):
    ys, xs = np.where(owner == i)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = rgba[y0:y1, x0:x1].copy()
    out[..., 3] = np.where(owner[y0:y1, x0:x1] == i, 255, 0)
    return Image.fromarray(out, 'RGBA')

if a.list:
    for k, i in enumerate(order):
        b = boxes[i]; print(k, 'row', next(r for r, rr in enumerate(rows) if i in rr), 'x', b[1].start, b[1].stop, 'y', b[0].start, b[0].stop, 'px', int(sizes[i-1]))
if a.out:
    os.makedirs(a.out, exist_ok=True)
    for m in a.map:
        d, idx = m.split('=')
        for k, s in enumerate(idx.split(',')):
            t = cut(order[int(s)])
            t.save(os.path.join(a.out, f'{d}_{k}.png'))
            if d == 'right' and not a.noflip:
                t.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(a.out, f'left_{k}.png'))
    for s in a.names:
        k, name = s.split('=')
        cut(order[int(k)]).save(os.path.join(a.out, name + '.png'))
    print('saved')
