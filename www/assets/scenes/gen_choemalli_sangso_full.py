#!/usr/bin/env python3
"""최만리 등의 언문 반대 상소를 '실제로 읽는' 느낌을 주는 큰 문서 그래픽.
작은 초상 원 안에 넣는 게 아니라 대화창 자체를 대체하는 큰 이미지로 써서,
텍스트를 대화창(dlg-text)이 아니라 이 종이 그림 위에 직접 얹는다."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

S = 3
W, H = 900 * S, 620 * S
im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

PAPER = (223, 202, 163, 255)
d.rounded_rectangle([0, 0, W - 1, H - 1], radius=6 * S, fill=PAPER)

rng = np.random.default_rng(21)
noise = rng.normal(0, 1, (H, W))
noise = (noise - noise.min()) / (noise.max() - noise.min())
tint = ((noise - 0.5) * 34).astype(np.int16)
arr = np.array(im)
mask = arr[..., 3] > 0
for c in range(3):
    ch = arr[..., c].astype(np.int16)
    ch[mask] = np.clip(ch[mask] + tint[mask], 0, 255)
    arr[..., c] = ch.astype(np.uint8)
im = Image.fromarray(arr, 'RGBA')

# 얼룩(세월의 흔적) + 가장자리 어둡게(빈티지 vignette)
rng2 = np.random.default_rng(5)
for _ in range(16):
    cx, cy = int(rng2.integers(30 * S, (900 - 30) * S)), int(rng2.integers(30 * S, (620 - 30) * S))
    r = int(rng2.integers(14 * S, 46 * S))
    spot = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spot)
    sd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(110, 82, 46, 22))
    spot = spot.filter(ImageFilter.GaussianBlur(float(r) * 0.45))
    im = Image.alpha_composite(im, spot)
d = ImageDraw.Draw(im)

# 접힌 자국(가로 2줄)
fold = Image.new('RGBA', (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(fold)
for fy in (H * 0.34, H * 0.67):
    fd.line([(20 * S, fy), (W - 20 * S, fy)], fill=(90, 65, 35, 24), width=int(2 * S))
im = Image.alpha_composite(im, fold)
d = ImageDraw.Draw(im)

font_path = '/System/Library/Fonts/Supplemental/AppleMyungjo.ttf'
title_font = ImageFont.truetype(font_path, int(30 * S))
body_font = ImageFont.truetype(font_path, int(22 * S))

INK = (35, 27, 19, 240)

# 제목(가로, 상단 중앙) — 세로쓰기 문서의 표제
title = '諺文反對上疏'
tw = sum((title_font.getbbox(c)[2] - title_font.getbbox(c)[0]) + 4 * S for c in title)
tx = (W - tw) / 2
ty = 26 * S
for c in title:
    bbox = title_font.getbbox(c)
    cw = bbox[2] - bbox[0]
    d.text((tx, ty), c, font=title_font, fill=INK)
    tx += cw + 4 * S
d.line([(80 * S, ty + 46 * S), (W - 80 * S, ty + 46 * S)], fill=(90, 65, 35, 160), width=int(1.5 * S))

# 본문: 실제 최만리 등 갑자상소(1444)의 핵심 논지를 참고해 새로 쓴 요약 문구
# (원문 그대로가 아니라 이 게임 톤에 맞춰 재구성한 것 — 프로젝트 공통 원칙)
columns = [
    '自古中國',
    '言語不同',
    '因音制字',
    '未有變夏',
    '從夷者也',
    '諺文一作',
    '字學自廢',
    '吏文亦弛',
    '刑獄之司',
    '恐生偏枉',
    '此臣等之',
    '區區憂慮',
]
n_cols = len(columns)
margin_x = 60 * S
top_y = 96 * S
bottom_y = H - 30 * S
col_w = (W - margin_x * 2) / n_cols
line_gap = 30 * S

for i, text in enumerate(columns):
    col_idx = n_cols - 1 - i
    cx = margin_x + col_idx * col_w + col_w / 2
    y = top_y
    for ch2 in text:
        bbox = body_font.getbbox(ch2)
        cw = bbox[2] - bbox[0]
        d.text((cx - cw / 2, y), ch2, font=body_font, fill=INK)
        y += line_gap
    if col_idx != 0:
        lx = margin_x + col_idx * col_w
        d.line([(lx, top_y - 10 * S), (lx, bottom_y)], fill=(90, 65, 35, 70), width=int(1 * S))

# 좌하단 서명 조 + 낙관(붉은 도장)
sign_font = ImageFont.truetype(font_path, int(18 * S))
d.text((margin_x, bottom_y - 30 * S), '副提學 崔萬理 等', font=sign_font, fill=(55, 42, 28, 220))

seal = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(seal)
sx, sy, sr = margin_x + 150 * S, bottom_y - 20 * S, 22 * S
sd.rounded_rectangle([sx - sr, sy - sr, sx + sr, sy + sr], radius=4 * S, outline=(150, 20, 20, 220), width=int(3 * S))
sfont = ImageFont.truetype(font_path, int(17 * S))
sd.text((sx, sy - sr * 0.5), '崔', font=sfont, fill=(160, 25, 25, 210), anchor='mm')
sd.text((sx, sy + sr * 0.5), '理', font=sfont, fill=(160, 25, 25, 210), anchor='mm')
im = Image.alpha_composite(im, seal)

out = im.resize((900, 620), Image.LANCZOS)
out.save('choemalli_sangso_full.png')
print('saved', out.size)
