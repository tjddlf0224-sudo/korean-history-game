#!/usr/bin/env python3
"""최만리 전용 초상 대신 '상소문(반대 상소)' 그래픽을 그린다 — 실제 인물
초상이 없는 카메오 화자를 아이콘 대신 이 장면에 어울리는 소품 이미지로 대체."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

S = 4
W = H = 300 * S
im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

PAPER = (222, 202, 164, 255)
d.rounded_rectangle([0, 0, W - 1, H - 1], radius=14 * S, fill=PAPER)

rng = np.random.default_rng(11)
noise = rng.normal(0, 1, (H, W))
noise = (noise - noise.min()) / (noise.max() - noise.min())
tint = ((noise - 0.5) * 40).astype(np.int16)
arr = np.array(im)
mask = arr[..., 3] > 0
for c in range(3):
    ch = arr[..., c].astype(np.int16)
    ch[mask] = np.clip(ch[mask] + tint[mask], 0, 255)
    arr[..., c] = ch.astype(np.uint8)
im = Image.fromarray(arr, 'RGBA')

rng2 = np.random.default_rng(3)
for _ in range(10):
    cx, cy = int(rng2.integers(20 * S, 280 * S)), int(rng2.integers(20 * S, 280 * S))
    r = int(rng2.integers(8 * S, 26 * S))
    spot = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spot)
    sd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(120, 90, 50, 28))
    spot = spot.filter(ImageFilter.GaussianBlur(float(r) * 0.4))
    im = Image.alpha_composite(im, spot)
d = ImageDraw.Draw(im)

GRID = (120, 95, 60, 90)
n_cols = 5
margin = 34 * S
col_w = (W - margin * 2) / n_cols
for i in range(n_cols + 1):
    x = margin + i * col_w
    d.line([(x, margin * 0.7), (x, H - margin * 0.7)], fill=GRID, width=max(1, S // 2))
d.line([(margin, margin * 0.7), (W - margin, margin * 0.7)], fill=GRID, width=max(1, S // 2))
d.line([(margin, H - margin * 0.7), (W - margin, H - margin * 0.7)], fill=GRID, width=max(1, S // 2))

font_path = '/System/Library/Fonts/Supplemental/AppleMyungjo.ttf'
font = ImageFont.truetype(font_path, int(30 * S))
INK = (40, 32, 22, 235)
lines = ['諺文者', '古字有異', '中國에도', '流入되면', '吾等이']
for i, text in enumerate(lines):
    col_idx = n_cols - 1 - i
    cx = margin + col_idx * col_w + col_w / 2
    y = margin * 1.1
    for ch2 in text:
        bbox = font.getbbox(ch2)
        cw = bbox[2] - bbox[0]
        d.text((cx - cw / 2, y), ch2, font=font, fill=INK)
        y += 34 * S

seal = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(seal)
sx, sy, sr = W - 58 * S, H - 58 * S, 26 * S
sd.rounded_rectangle([sx - sr, sy - sr, sx + sr, sy + sr], radius=4 * S, outline=(150, 20, 20, 230), width=int(3 * S))
sfont = ImageFont.truetype(font_path, int(20 * S))
sd.text((sx, sy - sr * 0.55), '崔', font=sfont, fill=(160, 25, 25, 220), anchor='mm')
sd.text((sx, sy + sr * 0.05), '萬', font=sfont, fill=(160, 25, 25, 220), anchor='mm')
im = Image.alpha_composite(im, seal)

out = im.resize((300, 300), Image.LANCZOS)
out.save('choemalli_sangso.png')
print('saved', out.size)
