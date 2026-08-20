#!/usr/bin/env python3
"""assets/tiles_gemini/의 Gemini 생성 타일 9종을 64x64 셀로 리사이즈해
ch0_phaser.html이 기대하는 순서(0~9)의 tileset.png로 재조립한다.
순서: 0=ground 1=stone 2=roof 3=roof_fascia 4=wood_floor 5=wood_wall
      6=stone_wall 7=grass 8=thatch 9=stone_fence
roof_fascia는 별도 원본이 없어 roof 타일에 처마 파사드(붉은 띠+금장식)를
합성해서 만든다 — 건물 남쪽 면임을 알려주는 게임플레이용 시각 신호라
장식이 아니라 유지해야 하는 요소."""
from PIL import Image, ImageDraw

SRC_DIR = '../tiles_gemini'
CS = 64

ORDER = [
    ('ground', 'ground.png'),
    ('stone', 'stone.png'),
    ('roof', 'roof.png'),
    ('roof_fascia', 'roof.png'),
    ('wood_floor', 'wood_floor.png'),
    ('wood_wall', 'wood_wall.png'),
    ('stone_wall', 'stone_wall.png'),
    ('grass', 'grass.png'),
    ('thatch', 'thatch.png'),
    ('stone_fence', 'stone_fence.png'),
]

sheet = Image.new('RGBA', (CS * len(ORDER), CS), (0, 0, 0, 0))

for i, (name, filename) in enumerate(ORDER):
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
