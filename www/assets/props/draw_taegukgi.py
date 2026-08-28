#!/usr/bin/env python3
"""건곤감리 배치가 100% 정확한 태극기(1923 임시의정원 태극기 톤 — 빛바랜 크림색 천
+ 붉은갈색/짙은갈색 태극)를 코드로 직접 그린다. AI 생성이 괘 배치를 계속
틀려서(감/곤 뒤바뀜, 줄 개수 틀림 등) 기하학적으로 정확도가 100% 보장되는
코드 드로잉으로 전환. 4배 슈퍼샘플링 후 축소해서 안티에일리어싱 품질 확보."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math

SCALE = 4
W, H = 700 * SCALE, 460 * SCALE
im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

# ---- 빛바랜 크림색 천 배경(둥근 모서리 + 미세 노이즈 텍스처) ----
CREAM = (232, 220, 196, 255)
CREAM_DARK = (208, 192, 162, 255)
radius = 10 * SCALE
d.rounded_rectangle([0, 0, W - 1, H - 1], radius=radius, fill=CREAM)

# 미세한 얼룩/노이즈로 오래된 천 느낌
rng = np.random.default_rng(7)
noise = rng.normal(0, 1, (H // SCALE, W // SCALE))
noise = np.array(Image.fromarray(((noise - noise.min()) / (noise.max() - noise.min()) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR))
arr = np.array(im)
mask = arr[..., 3] > 0
tint = ((noise.astype(np.int16) - 128) * 0.12).astype(np.int16)
for c in range(3):
    ch = arr[..., c].astype(np.int16)
    ch[mask] = np.clip(ch[mask] + tint[mask], 0, 255)
    arr[..., c] = ch.astype(np.uint8)
im = Image.fromarray(arr, 'RGBA')
d = ImageDraw.Draw(im)

# 접힌 자국(가로/세로 옅은 선)
fold_color = (0, 0, 0, 18)
fold_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(fold_layer)
fd.line([(W * 0.5, 0), (W * 0.5, H)], fill=fold_color, width=2 * SCALE)
fd.line([(0, H * 0.5), (W, H * 0.5)], fill=fold_color, width=2 * SCALE)
im = Image.alpha_composite(im, fold_layer)
d = ImageDraw.Draw(im)

cx, cy = W / 2, H / 2

# ---- 태극(음양) 문양: 위 절반 붉은갈색, 아래 절반 짙은 갈색-검정 ----
R = H * 0.30
RED = (168, 78, 46, 255)
DARKBLACK = (44, 34, 26, 255)

taegeuk = Image.new('RGBA', (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(taegeuk)
# 1) 바탕: 원을 수평으로 반분 -> 위 절반 빨강, 아래 절반 검정
td.ellipse([cx - R, cy - R, cx + R, cy + R], fill=RED)
td.pieslice([cx - R, cy - R, cx + R, cy + R], 0, 180, fill=DARKBLACK)
# 2) S자 곡선: 분할선(수평선, y=cy) 위에 중심을 둔 작은 원 두 개를 좌/우로 배치,
#    각각 반대 색으로 완전히 채워 겹치면 정확한 음양 물결 모양이 만들어진다.
r2 = R / 2
# 왼쪽 작은 원(중심이 위/아래 경계선 위, 원 왼쪽) -> 검정으로 채움(위쪽-왼쪽에 검정이 파고듦)
td.ellipse([cx - r2 - r2, cy - r2, cx - r2 + r2, cy + r2], fill=DARKBLACK)
# 오른쪽 작은 원(중심이 경계선 위, 원 오른쪽) -> 빨강으로 채움(아래쪽-오른쪽에 빨강이 파고듦)
td.ellipse([cx + r2 - r2, cy - r2, cx + r2 + r2, cy + r2], fill=RED)
im = Image.alpha_composite(im, taegeuk)
d = ImageDraw.Draw(im)

# ---- 괘(트라이그램) ----
BLACK = (40, 32, 24, 255)
bar_len = H * 0.20   # 괘 한 줄 길이
bar_th = H * 0.045   # 괘 한 줄 두께
gap_frac = 0.22       # 끊긴 줄의 중앙 공백 비율
row_gap = bar_th * 1.7  # 세 줄 사이 간격

def draw_trigram(pattern, corner):
    """pattern: [top,mid,bottom] 각각 'solid' 또는 'broken'.
       corner: 'tl','tr','bl','br' — 어느 모서리인지."""
    # 로컬 캔버스(회전 전): 가로=bar_len, 세로=3줄+간격
    pad = int(bar_th * 2)
    cw = int(bar_len) + pad * 2
    chh = int(row_gap * 2 + bar_th * 3) + pad * 2
    tile = Image.new('RGBA', (cw, chh), (0, 0, 0, 0))
    td2 = ImageDraw.Draw(tile)
    y0 = pad
    for i, kind in enumerate(pattern):
        y = y0 + i * (bar_th + row_gap)
        if kind == 'solid':
            td2.rectangle([pad, y, pad + bar_len, y + bar_th], fill=BLACK)
        else:
            seg = bar_len * (1 - gap_frac) / 2
            td2.rectangle([pad, y, pad + seg, y + bar_th], fill=BLACK)
            td2.rectangle([pad + bar_len - seg, y, pad + bar_len, y + bar_th], fill=BLACK)

    # 모서리별 회전각: 실제 태극기는 각 괘 블록이 중심-모서리 대각선에
    # 수직으로 놓이도록 45도 회전돼 있다(막대가 대각선과 수직).
    angle = {'tl': 45, 'tr': -45, 'bl': -45, 'br': 45}[corner]
    tile = tile.rotate(angle, expand=True, resample=Image.BICUBIC)
    return tile

TRIGRAMS = {
    'tl': ['solid', 'solid', 'solid'],   # 건
    'tr': ['solid', 'broken', 'solid'],  # 리 (예전엔 여기 감 무늬가 들어가 있었음 — 감/리가 뒤바뀐 버그)
    'bl': ['broken', 'solid', 'broken'], # 감
    'br': ['broken', 'broken', 'broken'],# 곤
}

margin_x = W * 0.14
margin_y = H * 0.16
positions = {
    'tl': (margin_x, margin_y),
    'tr': (W - margin_x, margin_y),
    'bl': (margin_x, H - margin_y),
    'br': (W - margin_x, H - margin_y),
}

for corner, pattern in TRIGRAMS.items():
    tile = draw_trigram(pattern, corner)
    px, py = positions[corner]
    tw, th_ = tile.size
    im.alpha_composite(tile, (int(px - tw / 2), int(py - th_ / 2)))

# ---- 살짝 빈티지 느낌: 부드러운 블러 + 경미한 노이즈로 마감 ----
im = im.filter(ImageFilter.GaussianBlur(radius=0.4 * SCALE))

# ---- 다운스케일(슈퍼샘플 → 고품질 안티에일리어싱) ----
out = im.resize((700, 460), Image.LANCZOS)
out.save('taegukgi.png')
print('saved', out.size)
