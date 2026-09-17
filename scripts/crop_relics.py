# -*- coding: utf-8 -*-
"""제미나이 유물 시트에서 칸을 골라 도감 아이콘(160x160 투명 PNG)으로 만든다.
   배경색은 모서리에서 직접 재므로 마젠타가 분홍으로 나와도 된다.
   python3 scripts/crop_relics.py SRC --cols 4 --pick 0=imsinseogi 3=suncheongja"""
import argparse, os
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('--cols', type=int, required=True)
ap.add_argument('--pick', nargs='+', required=True)   # 칸번호=파일이름
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'www', 'assets', 'items'))
ap.add_argument('--thresh', type=float, default=80)
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
W, H = im.size
arr = np.array(im).astype(np.int16)
# 배경색: 네 모서리 20x20의 중앙값
corners = np.concatenate([arr[:20, :20].reshape(-1, 3), arr[:20, -20:].reshape(-1, 3),
                          arr[-20:, :20].reshape(-1, 3), arr[-20:, -20:].reshape(-1, 3)])
key = np.median(corners, axis=0)
print('배경색', key)

def cut(box):
    crop = arr[box[1]:box[3], box[0]:box[2]].copy()
    dist = np.sqrt(((crop - key) ** 2).sum(-1))
    fg = dist >= a.thresh
    for _ in range(2):           # 경계 한 겹 깎기
        e = fg.copy()
        e[1:, :] &= fg[:-1, :]; e[:-1, :] &= fg[1:, :]
        e[:, 1:] &= fg[:, :-1]; e[:, :-1] &= fg[:, 1:]
        fg = e
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
    excess = np.clip((r + b) / 2 - g, 0, None)    # 자홍 번짐 걷어내기
    crop[..., 0] = np.clip(r - excess, 0, 255); crop[..., 2] = np.clip(b - excess, 0, 255)
    rgba = np.dstack([crop.astype(np.uint8), np.where(fg, 255, 0).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    al = np.array(img)[..., 3]
    ys, xs = np.where(al > 0)
    if not len(ys): return None
    img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(img.size) * 1.08)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((160, 160), Image.LANCZOS)

cw = W / a.cols
pad = int(cw * 0.05)
for p in a.pick:
    idx, name = p.split('=')
    c = int(idx)
    out = cut((int(c * cw) + pad, pad, int((c + 1) * cw) - pad, H - pad))
    if out is None: print('!', name, '전경 없음'); continue
    path = os.path.join(a.out, name + '.png')
    out.save(path); print('저장', path)
