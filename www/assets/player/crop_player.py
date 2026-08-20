#!/usr/bin/env python3
"""주인공 걷기 사이클 시트(4행x3열, 마젠타 배경) 크롭 + 배경 투명화.
행: 아래/위/왼쪽/오른쪽. AI가 좌우를 구분 못 그려서 '왼쪽' 행만 쓰고
오른쪽은 좌우 반전으로 직접 생성한다."""
from PIL import Image
import numpy as np

SRC = 'player_sheet_raw.png'
COLS, ROWS = 3, 4
PAD = 14

DIRS = ['down', 'up', 'left']  # row0=down, row1=up, row2=left(캐노니컬), row3(AI 결과)는 버림

im = Image.open(SRC).convert('RGB')
W, H = im.size
cw, ch = W / COLS, H / ROWS

MAGENTA = np.array([246, 26, 246])
THRESH = 95

def key_out(crop):
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
    return Image.fromarray(rgba, 'RGBA')

frames = {}
for row, direction in enumerate(DIRS):
    for col in range(COLS):
        x0 = int(col * cw) + PAD
        y0 = int(row * ch) + PAD
        x1 = int((col + 1) * cw) - PAD
        y1 = int((row + 1) * ch) - PAD
        crop = im.crop((x0, y0, x1, y1))
        out = key_out(crop)
        name = f'{direction}_{col}'
        out.save(f'{name}.png')
        frames[name] = out
        print(name, out.size)

# 오른쪽 = 왼쪽 프레임 좌우 반전
for col in range(COLS):
    left = frames[f'left_{col}']
    right = left.transpose(Image.FLIP_LEFT_RIGHT)
    right.save(f'right_{col}.png')
    print(f'right_{col}', right.size, '(mirrored)')
