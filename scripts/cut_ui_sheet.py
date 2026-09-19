#!/usr/bin/env python3
"""제미나이 UI 시트(순녹색 배경)에서 조각을 잘라 투명 PNG로 저장한다.
   초록 번짐(spill)을 계산해 가장자리를 부드럽게 빼고, 덩어리(반짝이 포함)를 줄·칸 순서로 번호 매긴다.
   사용: cut_ui_sheet.py SRC --list
         cut_ui_sheet.py SRC --out DIR --names a b c ... [--size 256] [--rows 2]"""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('--out'); ap.add_argument('--names', nargs='*', default=[])
ap.add_argument('--size', type=int, default=256, help='긴 변 최대 크기')
ap.add_argument('--list', action='store_true'); ap.add_argument('--merge', type=int, default=18)
ap.add_argument('--mask', nargs='*', default=[], help='x0,y0,x1,y1 영역 지우기(로고)')
a = ap.parse_args()

im = np.array(Image.open(a.src).convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
spill = g - np.maximum(r, b)
alpha = np.clip(1 - (spill - 25) / 70, 0, 1)          # 25 이하 불투명, 95 이상 투명
for m in a.mask:
    x0, y0, x1, y1 = map(int, m.split(',')); alpha[y0:y1, x0:x1] = 0
# 초록 번짐 제거: 반투명·가장자리 픽셀의 g를 r,b 최대값으로 누른다
gfix = np.where(spill > 0, np.maximum(r, b) + np.minimum(spill, 0), g)
rgb = np.stack([r, np.minimum(g, np.maximum(gfix, np.maximum(r, b))), b], -1)
rgb[..., 1] = np.where(spill > 5, np.maximum(r, b), g)
mask = alpha > 0.5
lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=a.merge))
objs = ndimage.find_objects(lab)
boxes = []
for i, sl in enumerate(objs):
    ys, xs = sl
    area = (lab[sl] == i + 1).sum()
    if area < 1500: continue
    boxes.append([xs.start, ys.start, xs.stop, ys.stop])
# 줄 나누기: y 중심이 가까운 것끼리
boxes.sort(key=lambda bx: (bx[1] + bx[3]) / 2)
rows, cur = [], []
for bx in boxes:
    cy = (bx[1] + bx[3]) / 2
    if cur and abs(cy - np.mean([(c[1] + c[3]) / 2 for c in cur])) > 60:
        rows.append(cur); cur = []
    cur.append(bx)
if cur: rows.append(cur)
ordered = [bx for row in rows for bx in sorted(row, key=lambda c: c[0])]
for k, bx in enumerate(ordered):
    print(k, bx, bx[2] - bx[0], 'x', bx[3] - bx[1])
if a.list: raise SystemExit
os.makedirs(a.out, exist_ok=True)
rgba = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
for k, name in enumerate(a.names):
    if name in ('-', '_') or k >= len(ordered): continue
    x0, y0, x1, y1 = ordered[k]
    p = 4
    x0, y0 = max(0, x0 - p), max(0, y0 - p); x1, y1 = min(rgba.shape[1], x1 + p), min(rgba.shape[0], y1 + p)
    piece = Image.fromarray(rgba[y0:y1, x0:x1])
    # 이 덩어리에 속하지 않는 옆 덩어리 조각 지우기
    sub = lab[y0:y1, x0:x1]; ids = [v for v in np.unique(sub) if v]
    main = max(ids, key=lambda v: (sub == v).sum())
    arr = np.array(piece); arr[..., 3] = np.where(sub == main, arr[..., 3], 0); piece = Image.fromarray(arr)
    s = a.size / max(piece.size)
    if s < 1: piece = piece.resize((round(piece.width * s), round(piece.height * s)), Image.LANCZOS)
    piece.save(os.path.join(a.out, name + '.png'), optimize=True)
    print('saved', name, piece.size)
