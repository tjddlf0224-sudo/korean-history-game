#!/usr/bin/env python3
"""걷기 프레임마다 캐릭터가 원본 캔버스 안에서 서로 다른 위치에 있어서
(크롭 격자 안에서 좌우로 들쭉날쭉) 프레임을 바꿀 때마다 화면에서 옆으로
순간이동하는 것처럼 보이는 문제를 고침. 각 프레임의 실제 캐릭터
바운딩박스를 구해서, 모든 프레임이 같은 캔버스 안에서 같은 기준점
(가로 중앙, 발 위치=바닥 기준)에 오도록 다시 배치한다."""
from PIL import Image

OUT_W, OUT_H = 110, 172
BOTTOM_MARGIN = 6

def recenter(path):
    im = Image.open(path).convert('RGBA')
    bbox = im.getbbox()
    crop = im.crop(bbox)
    bw, bh = crop.size
    canvas = Image.new('RGBA', (OUT_W, OUT_H), (0, 0, 0, 0))
    x = (OUT_W - bw) // 2
    y = OUT_H - BOTTOM_MARGIN - bh
    canvas.paste(crop, (x, y), crop)
    canvas.save(path)
    return canvas.size

for d in ['down', 'up', 'left']:
    for i in range(3):
        size = recenter(f'{d}_{i}.png')
        print(d, i, size)

# 오른쪽은 다시 센터링된 왼쪽 프레임을 좌우 반전해서 재생성
for i in range(3):
    left = Image.open(f'left_{i}.png')
    right = left.transpose(Image.FLIP_LEFT_RIGHT)
    right.save(f'right_{i}.png')
    print('right', i, right.size, '(remirrored)')
