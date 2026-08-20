#!/usr/bin/env python3
"""Gemini로 뽑은 마젠타 배경 타일 시트(3x3)를 개별 PNG로 크롭."""
from PIL import Image

SRC = 'tiles_sheet_raw.png'
COLS, ROWS = 3, 3
PAD_SIDE = 26
PAD_TOP = 26
LABEL_BAND_RATIO = 0.20

NAMES = [
    'stone', 'roof', 'wood_floor',
    'wood_wall', 'stone_wall', 'grass',
    'thatch', 'stone_fence', 'ground',
]

im = Image.open(SRC).convert('RGB')
W, H = im.size
cw, ch = W / COLS, H / ROWS
label_band = int(ch * LABEL_BAND_RATIO)

for i, name in enumerate(NAMES):
    col, row = i % COLS, i // COLS
    x0 = int(col * cw) + PAD_SIDE
    y0 = int(row * ch) + PAD_TOP
    x1 = int((col + 1) * cw) - PAD_SIDE
    y1 = int((row + 1) * ch) - label_band
    crop = im.crop((x0, y0, x1, y1))
    crop.save(f'{name}.png')
    print(name, crop.size)
