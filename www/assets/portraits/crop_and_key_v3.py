#!/usr/bin/env python3
"""3차 시트(npc_sheet_v3.png, 4열x2행, 흰 여백 거터+이름 라벨) 크롭 + 배경 투명화.
거터/라벨 경계를 실측(y=150,500 가로 스캔으로 세로 경계, x=150/700/1300
세로 스캔으로 가로 경계, 라벨 상단은 각 열 중앙에서 흰 픽셀 첫 등장 y로 실측)."""
from PIL import Image
import numpy as np

SRC = 'npc_sheet_v3.png'

# 파일명은 ilje_ch7.html / gaehang_ch2.html / gaehang_ch3.html에 이미
# 미리 박혀 있던 img 경로와 정확히 맞춤(코드 수정 없이 바로 연결되게).
LABELS = [
    'seongjong', 'yiyi', 'daewongun', 'gimokgyun',
    'hongyeongsik', 'gimgu', 'yunbonggil', 'muwiyeong_soldier',
]

COL_X = [(0, 363), (364, 727), (728, 1091), (1092, 1455)]
ROW_Y = [(0, 359), (360, 719)]
ROW_LABEL_TOP = [322, 679]  # 셀이 아니라 이미지 전체 기준 y

im = Image.open(SRC).convert('RGB')
MAGENTA = np.array([250, 6, 242])
THRESH = 95
MARGIN = 4

for i, name in enumerate(LABELS):
    col, row = i % 4, i // 4
    cx0, cx1 = COL_X[col]
    cy0, cy1 = ROW_Y[row]
    x0 = cx0 + MARGIN
    x1 = cx1 - MARGIN
    y0 = cy0 + MARGIN
    y1 = ROW_LABEL_TOP[row] - 2
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
