#!/usr/bin/env python3
"""assets/tiles_gemini/의 Gemini 생성 타일을 64x64 셀로 리사이즈해
ch0_phaser.html이 기대하는 순서(0~9)의 tileset.png로 재조립한다.
순서: 0=ground 1=stone 2=roof 3=roof_fascia 4=wood_floor 5=wood_wall
      6=stone_wall 7=grass 8=thatch 9=stone_fence

stone_wall/stone_fence는 Gemini 원본을 안 쓴다 — 눈높이에서 찍은 정면
사진처럼 나와서(원근감 있는 명암) 위에서 내려다보는 우리 구도랑 근본적
으로 안 맞음(사용자 피드백). 대신 진짜 '바로 위에서 본 돌 상판' 각도를
코드로 확실히 통제해서 직접 그린다.
roof_fascia는 별도 원본이 없어 roof 타일에 처마 파사드(붉은 띠+금장식)를
합성해서 만든다 — 건물 남쪽 면임을 알려주는 게임플레이용 시각 신호라
장식이 아니라 유지해야 하는 요소."""
from PIL import Image, ImageDraw
import random

SRC_DIR = '../tiles_gemini'
CS = 64

ORDER = [
    ('ground', 'ground.png'),
    ('stone', 'stone.png'),
    ('roof', 'roof.png'),
    ('roof_fascia', 'roof.png'),
    ('wood_floor', 'wood_floor.png'),
    ('wood_wall', 'wood_wall.png'),
    ('stone_wall', None),
    ('grass', 'grass.png'),
    ('thatch', 'thatch.png'),
    ('stone_fence', None),
]

def shade(rgb, amt):
    r, g, b = rgb
    def f(c):
        c2 = c + (c * amt if amt < 0 else (255 - c) * amt)
        return max(0, min(255, int(c2)))
    return (f(r), f(g), f(b))

def draw_stone_wall_top(rnd):
    """남한산성 자연석 성벽 참고 — 진짜 바로 위에서 본 상판 돌 블록.
    화강암 판석보다 더 진하고 채도 낮은 회청색으로 '바닥이 아니라
    성벽 위'라는 무게감을 준다."""
    base = (90, 98, 106)
    tile = Image.new('RGBA', (CS, CS), base + (255,))
    d = ImageDraw.Draw(tile)
    rows, cols = 3, 3
    rowH = CS / rows
    for r in range(rows):
        offset = 0 if r % 2 == 0 else CS / cols / 2
        for c in range(-1, cols + 1):
            n = rnd.uniform(-0.5, 0.5)
            col = shade(base, n * 0.22)
            bx = c * (CS / cols) + offset
            x0, x1 = max(0, bx) + 1, bx + CS / cols - 1
            y0, y1 = r * rowH + 1, r * rowH + rowH - 2
            if x1 > x0:
                d.rectangle([x0, y0, x1, y1], fill=col + (255,))
    d.rectangle([0, 0, CS - 1, CS - 1], outline=(20, 24, 28, 140), width=2)
    return tile

def draw_stone_fence_top(rnd):
    """돌담 상판 — 자연석 성벽보다 밝고 둥근 자갈이 촘촘히 박힌 느낌."""
    base = (132, 140, 146)
    tile = Image.new('RGBA', (CS, CS), base + (255,))
    d = ImageDraw.Draw(tile)
    for _ in range(20):
        cx, cy = rnd.uniform(4, CS - 4), rnd.uniform(4, CS - 4)
        rx, ry = rnd.uniform(5, 9), rnd.uniform(4, 7)
        n = rnd.uniform(-0.5, 0.5)
        col = shade(base, n * 0.3)
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col + (255,), outline=(60, 66, 70, 90))
    return tile

sheet = Image.new('RGBA', (CS * len(ORDER), CS), (0, 0, 0, 0))

for i, (name, filename) in enumerate(ORDER):
    if name == 'stone_wall':
        tile = draw_stone_wall_top(random.Random(11))
    elif name == 'stone_fence':
        tile = draw_stone_fence_top(random.Random(22))
    else:
        src = Image.open(f'{SRC_DIR}/{filename}').convert('RGBA')
        tile = src.resize((CS, CS), Image.LANCZOS)
    if name == 'roof_fascia':
        d = ImageDraw.Draw(tile)
        d.rectangle([0, CS - 10, CS, CS], fill=(122, 42, 31, 255))
        d.rectangle([0, CS - 10, CS, CS - 8], fill=(0, 0, 0, 90))
        for k in range(3):
            x = 8 + k * 20
            d.rectangle([x, CS - 8, x + 3, CS - 2], fill=(224, 185, 74, 255))
    sheet.paste(tile, (i * CS, 0))

sheet.save('tileset.png')
print('saved', sheet.size)
