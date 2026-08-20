#!/usr/bin/env python3
"""2차 재생성 시트(npc_sheet_v2.png, 테두리 또렷하게 다시 뽑음) 크롭 + 배경 투명화.
셀 사이에 여백(거터)이 있는 레이아웃이라 첫 시트와 격자 좌표가 다름 —
거터(진회색/네이비) 컬럼/로우를 실측해서 좌표를 직접 구했다(가정 대신 실측).
라벨 하단 경계도 같은 방식(행별 실측, 5칸 전부 일치 확인)으로 구했다."""
from PIL import Image
import numpy as np

SRC = 'npc_sheet_v2.png'
PAD_SIDE = 16
PAD_TOP = 18

LABELS = [
    'jeongdojeon', 'taejong', 'sejong', 'sinsukju', 'kimjongseo',
    'sejo', 'seongsammun', 'seogeojeong', 'yeonsangun', 'jogwangjo',
    'josik', 'josik2', 'yihwang', 'kimilson', 'commoner1',
    'commoner2', 'gungnyeo', 'naesi', 'general', 'scholar',
]

COL_X = [(18, 237), (252, 474), (490, 710), (725, 947), (962, 1181)]
ROW_Y = [(14, 230), (230, 440), (440, 654), (654, 896)]
ROW_LABEL_BOTTOM = [202, 197, 201, 205]  # 각 행의 라벨 시작 직전 y(셀 내부 상대좌표)

im = Image.open(SRC).convert('RGB')
MAGENTA = np.array([246, 32, 238])
THRESH = 95

for i, name in enumerate(LABELS):
    col, row = i % 5, i // 5
    cx0, cx1 = COL_X[col]
    cy0, cy1 = ROW_Y[row]
    x0 = cx0 + PAD_SIDE
    y0 = cy0 + PAD_TOP
    x1 = cx1 - PAD_SIDE
    y1 = cy0 + ROW_LABEL_BOTTOM[row]
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
    print(name, out.size, f'{(~is_fg).mean()*100:.1f}% removed')
