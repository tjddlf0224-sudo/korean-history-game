#!/usr/bin/env python3
"""공사현장 소품 6종(3x2 마젠타 시트) 크롭 + 배경 투명화."""
from PIL import Image
import numpy as np

SRC = 'props_sheet_raw.png'
COLS, ROWS = 3, 2
PAD_SIDE = 24
PAD_TOP = 24
LABEL_BAND_RATIO = 0.16

NAMES = [
    'stone_pile', 'wood_platform', 'log_pile',
    'tool_crate', 'dirt_mound', 'rope_fence',
]

MAGENTA = np.array([246, 20, 244])
THRESH = 95

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

    arr = np.array(crop).astype(np.int16)
    dist_m = np.sqrt(((arr - MAGENTA) ** 2).sum(axis=-1))
    is_fg = dist_m >= THRESH
    for _ in range(2):
        eroded = is_fg.copy()
        eroded[1:, :] &= is_fg[:-1, :]
        eroded[:-1, :] &= is_fg[1:, :]
        eroded[:, 1:] &= is_fg[:, :-1]
        eroded[:, :-1] &= is_fg[:, 1:]
        is_fg = eroded
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    excess = np.clip((r + b) / 2 - g, 0, None)
    arr[..., 0] = np.clip(r - excess, 0, 255)
    arr[..., 2] = np.clip(b - excess, 0, 255)
    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(is_fg, 255, 0)

    out = Image.fromarray(rgba, 'RGBA')
    out.save(f'{name}.png')
    print(name, out.size)
