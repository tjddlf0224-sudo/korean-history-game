#!/usr/bin/env python3
"""조선 전기 타일셋 생성 — 국가유산 디지털 서비스 참고자료 기반 색감.
브라우저 canvas.toDataURL() 왕복 대신 PIL로 직접 PNG를 구워서
base64 수기 전사 중 발생하는 손상 위험을 없앤다."""
from PIL import Image, ImageDraw
import random

CS = 64
TILES = [
    ("ground", "#bfa374"),
    ("stone", "#a89f8f"),
    ("roof", "#33404a"),
    ("roof_fascia", "#33404a"),
    ("wood_floor", "#7a5c38"),
    ("wood_wall", "#5c4326"),
    ("stone_wall", "#8a8e93"),
    ("grass", "#748a52"),
    ("thatch", "#d9c48a"),
    ("stone_fence", "#7a8088"),
]

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def shade(rgb, amt):
    r, g, b = rgb
    def f(c):
        c2 = c + (c * amt if amt < 0 else (255 - c) * amt)
        return max(0, min(255, int(c2)))
    return (f(r), f(g), f(b))

sheet = Image.new('RGBA', (CS * len(TILES), CS), (0, 0, 0, 0))

def draw_ground(d, ox, base, rnd):
    d.rectangle([ox, 0, ox + CS, CS], fill=base + (255,))
    for _ in range(10):
        x = ox + rnd.randint(6, CS - 6)
        y = rnd.randint(6, CS - 6)
        r = rnd.uniform(2, 4.5)
        c = (0, 0, 0, 22) if rnd.random() > 0.5 else (255, 255, 255, 22)
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)

def draw_stone(d, ox, base, rnd):
    half = CS // 2
    for by in range(2):
        for bx in range(2):
            n = rnd.uniform(-0.5, 0.5)
            c = shade(base, n * 0.16)
            d.rectangle([ox + bx*half + 1, by*half + 1, ox + bx*half + half - 1, by*half + half - 1], fill=c + (255,))
            for _ in range(3):
                sx = ox + bx*half + rnd.randint(4, half - 4)
                sy = by*half + rnd.randint(4, half - 4)
                d.ellipse([sx-1.4, sy-1.4, sx+1.4, sy+1.4], fill=(0, 0, 0, 15))
    d.rectangle([ox + 1, 1, ox + CS - 1, CS - 1], outline=(0, 0, 0, 50), width=2)

def draw_roof(d, ox, base, rnd, fascia=False):
    rows = 6
    for r in range(rows):
        n = rnd.uniform(-0.5, 0.5)
        c = shade(base, n * 0.12 - r * 0.015)
        y0 = r * (CS / rows)
        y1 = y0 + CS / rows + 1
        d.rectangle([ox, y0, ox + CS, y1], fill=c + (255,))
    d.line([ox, 1, ox + CS, 1], fill=(255, 255, 255, 26), width=2)
    if fascia:
        d.rectangle([ox, CS - 10, ox + CS, CS], fill=(122, 42, 31, 255))
        d.rectangle([ox, CS - 10, ox + CS, CS - 7], fill=(0, 0, 0, 90))
        for i in range(3):
            x = ox + 8 + i * 20
            d.rectangle([x, CS - 8, x + 3, CS - 2], fill=(224, 185, 74, 255))

def draw_wood_floor(d, ox, base, rnd):
    planks = 5
    for i in range(planks):
        n = rnd.uniform(-0.5, 0.5)
        c = shade(base, n * 0.14)
        y0 = i * (CS / planks)
        y1 = y0 + CS / planks - 1
        d.rectangle([ox, y0, ox + CS, y1], fill=c + (255,))
    d.line([ox + CS * 0.3, 0, ox + CS * 0.3, CS], fill=(0, 0, 0, 20), width=1)

def draw_wood_wall(d, ox, base, rnd):
    planks = 4
    for i in range(planks):
        n = rnd.uniform(-0.5, 0.5)
        c = shade(base, n * 0.18)
        x0 = ox + i * (CS / planks)
        x1 = x0 + CS / planks - 1
        d.rectangle([x0, 0, x1, CS], fill=c + (255,))
    d.rectangle([ox + 1, 1, ox + CS - 1, CS - 1], outline=(0, 0, 0, 46), width=2)

def draw_stone_wall(d, ox, base, rnd):
    rows, cols = 4, 3
    rowH = CS / rows
    for r in range(rows):
        offset = 0 if r % 2 == 0 else CS / cols / 2
        for c_ in range(-1, cols + 1):
            n = rnd.uniform(-0.5, 0.5)
            col = shade(base, n * 0.22)
            bx = ox + c_ * (CS / cols) + offset
            x0 = max(ox, bx) + 1
            x1 = bx + CS / cols - 1
            y0 = r * rowH + 1
            y1 = y0 + rowH - 2
            if x1 > x0:
                d.rectangle([x0, y0, x1, y1], fill=col + (255,))
    d.rectangle([ox, 0, ox + CS, 5], fill=(0, 0, 0, 64))

def draw_grass(d, ox, base, rnd):
    d.rectangle([ox, 0, ox + CS, CS], fill=base + (255,))
    for _ in range(9):
        bx = ox + rnd.randint(5, CS - 5)
        by = rnd.randint(5, CS - 5)
        ang = rnd.uniform(-0.45, 0.45)
        n = rnd.random()
        c = shade(base, 0.26 if n > 0.5 else -0.18)
        import math
        ex = bx + math.sin(ang) * 8
        ey = by - 8
        d.line([bx, by + 5, ex, ey], fill=c + (255,), width=3)

def draw_thatch(d, ox, base, rnd):
    d.rectangle([ox, 0, ox + CS, CS], fill=base + (255,))
    for r in range(12):
        n = rnd.uniform(-0.5, 0.5)
        c = shade(base, n * 0.22)
        yy = 3 + r * 5
        d.line([ox, yy, ox + CS, yy - 4], fill=c + (255,), width=3)

def draw_stone_fence(d, ox, base, rnd):
    d.rectangle([ox, 0, ox + CS, CS], fill=base + (255,))
    for _ in range(14):
        cx = ox + rnd.randint(4, CS - 4)
        cy = rnd.randint(4, CS - 4)
        rx = rnd.uniform(4, 7)
        ry = rnd.uniform(3, 5)
        n = rnd.uniform(-0.5, 0.5)
        c = shade(base, n * 0.32)
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=c + (255,))

for i, (name, hexcol) in enumerate(TILES):
    ox = i * CS
    base = hexrgb(hexcol)
    d = ImageDraw.Draw(sheet)
    rnd = random.Random(1000 + i)
    if name == 'ground':
        draw_ground(d, ox, base, rnd)
    elif name == 'stone':
        draw_stone(d, ox, base, rnd)
    elif name == 'roof':
        draw_roof(d, ox, base, rnd, fascia=False)
    elif name == 'roof_fascia':
        draw_roof(d, ox, base, rnd, fascia=True)
    elif name == 'wood_floor':
        draw_wood_floor(d, ox, base, rnd)
    elif name == 'wood_wall':
        draw_wood_wall(d, ox, base, rnd)
    elif name == 'stone_wall':
        draw_stone_wall(d, ox, base, rnd)
    elif name == 'grass':
        draw_grass(d, ox, base, rnd)
    elif name == 'thatch':
        draw_thatch(d, ox, base, rnd)
    elif name == 'stone_fence':
        draw_stone_fence(d, ox, base, rnd)

sheet.save('tileset.png')
print('saved', sheet.size)
