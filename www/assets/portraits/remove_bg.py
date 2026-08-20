#!/usr/bin/env python3
"""크롭된 NPC 초상화들의 크림색 배경을 투명하게 제거.
단순 색상 거리 임계값 대신 모서리에서 시작하는 flood-fill로 '배경과
연결된 영역'만 지운다 — 흰 도포처럼 배경색과 비슷한 옷도 캐릭터 윤곽선에
막혀 안 지워지도록 하기 위함."""
from PIL import Image, ImageDraw
import numpy as np

NAMES = [
    'jeongdojeon', 'taejong', 'sejong', 'sinsukju', 'kimjongseo',
    'sejo', 'seongsammun', 'seogeojeong', 'yeonsangun', 'jogwangjo',
    'josik', 'josik2', 'yihwang', 'kimilson', 'commoner1',
    'commoner2', 'gungnyeo', 'naesi', 'general', 'scholar',
]

SENTINEL = (1, 254, 1)  # 캐릭터 그림에 나올 리 없는 형광 녹색 마커
THRESH = 16

for name in NAMES:
    im = Image.open(f'{name}.png').convert('RGB')
    w, h = im.size
    work = im.copy()
    seeds = [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2),
             (w // 2, 1), (1, h // 2), (w - 2, h // 2), (w // 2, h - 2)]
    for sx, sy in seeds:
        px = work.getpixel((sx, sy))
        if px == SENTINEL:
            continue
        ImageDraw.floodfill(work, (sx, sy), SENTINEL, thresh=THRESH)

    arr = np.array(work)
    mask_bg = np.all(arr == np.array(SENTINEL), axis=-1)

    orig = np.array(im.convert('RGBA'))
    alpha = np.where(mask_bg, 0, 255).astype(np.uint8)
    orig[..., 3] = alpha

    out = Image.fromarray(orig, 'RGBA')
    out.save(f'{name}.png')
    transparent_ratio = mask_bg.mean()
    print(f'{name}: bg removed {transparent_ratio*100:.1f}%')
