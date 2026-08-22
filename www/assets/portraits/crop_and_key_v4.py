#!/usr/bin/env python3
"""5열x3행(14명+빈칸1) 마젠타 시트 크롭 + 배경 투명화.
그림체 통일 재생성분: 세종/인부(퀄리티 재작업) + painterly로 튀었던 4명
(수양대군·장영실·좌수·늙은내관) + v3 시트 8명 전체.

주의(재발 방지): 이번 시트는 셀 사이에 흰색/검은색 격자 테두리선이 그려져
있었는데, 이 선이 마젠타 임계값을 통과 못 해(흰색은 마젠타와 거리가 아주
멀어 오히려 "전경"으로 오분류됨) 크롭 맨 위/옆 가장자리에 검은 띠로 눌어
붙는 문제가 있었다(세종 모자가 다시 "잘린 것처럼" 보였던 원인). 마진을
6px→11px로 키워 테두리선 자체를 크롭 밖으로 밀어내고, 그래도 남는 경우를
대비해 가장 큰 연결요소만 남기는 방식(crop_single.py와 동일 원리)도 같이
적용해 이중으로 방어한다."""
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = '/Users/yunsismac/Downloads/Gemini_Generated_Image_nv18qenv18qenv18.png'
COLS, ROWS = 5, 3
LABELS = [
    'sejong', 'commoner1', 'suyang', 'jangyeongsil', 'jwasu',
    'naesi', 'daewongun', 'gimgu', 'gimokgyun', 'hongyeongsik',
    'muwiyeong_soldier', 'seongjong', 'yiyi', 'yunbonggil',
]

im = Image.open(SRC).convert('RGB')
W, H = im.size
cw, ch = W / COLS, H / ROWS
MARGIN = 11
PAD = 8  # 최종 출력에 남길 여백

MAGENTA = np.array([255, 0, 255])
THRESH = 95

for i, name in enumerate(LABELS):
    col, row = i % COLS, i // COLS
    x0 = int(col * cw) + MARGIN
    y0 = int(row * ch) + MARGIN
    x1 = int((col + 1) * cw) - MARGIN
    y1 = int((row + 1) * ch) - MARGIN
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

    # 격자 테두리선(흰/검 조각)이 캐릭터와 분리된 별도 연결요소로 남으면,
    # 가장 큰 연결요소(=캐릭터 본체)만 남기고 나머지는 배경 처리한다.
    labeled, n = ndimage.label(is_fg)
    if n > 1:
        sizes = ndimage.sum(is_fg, labeled, range(1, n + 1))
        main_label = np.argmax(sizes) + 1
        is_fg = labeled == main_label

    ys, xs = np.where(is_fg)
    by0, by1 = max(0, ys.min() - PAD), min(arr.shape[0], ys.max() + PAD)
    bx0, bx1 = max(0, xs.min() - PAD), min(arr.shape[1], xs.max() + PAD)

    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    excess = np.clip((r + b) / 2 - g, 0, None)
    arr[..., 0] = np.clip(r - excess, 0, 255)
    arr[..., 2] = np.clip(b - excess, 0, 255)

    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(is_fg, 255, 0)

    out = Image.fromarray(rgba, 'RGBA').crop((bx0, by0, bx1, by1))
    out.save(f'{name}.png')
    print(name, out.size, f'components={n}')
