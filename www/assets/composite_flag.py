#!/usr/bin/env python3
"""ilje_ch7_imjeong.png 배경의 책상 위 태극기(건곤감리가 잘못된 AI생성본)를
코드로 새로 그린 정확한 태극기(props/taegukgi.png)로 교체한다."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BG_PATH = 'scenes/ilje_ch7_imjeong_ORIGINAL_BACKUP.png'
FLAG_PATH = 'props/taegukgi.png'
OUT_PATH = 'scenes/ilje_ch7_imjeong.png'

bg = Image.open(BG_PATH).convert('RGBA')

# ---- 1) 기존 태극기 자리를 주변 책상 나무결로 패치 ----
# 깨끗한 책상 나무 patch 소스 (물건 없는 영역)
patch_src = bg.crop((545, 308, 645, 340))  # 100x32
# 목표 영역(기존 깃발 바운딩박스에 딱 맞춰, 옆 잉크병/서류를 침범하지 않게 최소 여유만)
tgt_box = (681, 268, 767, 324)  # 86x56
tw, th = tgt_box[2] - tgt_box[0], tgt_box[3] - tgt_box[1]
patch = patch_src.resize((tw, th), Image.LANCZOS)

# 살짝 밝기/색조 노이즈를 섞어 단조로운 스트레치 티가 덜 나게
arr = np.array(patch).astype(np.int16)
rng = np.random.default_rng(3)
noise = rng.normal(0, 4, (th, tw, 1)).astype(np.int16)
arr[..., :3] = np.clip(arr[..., :3] + noise, 0, 255)
patch = Image.fromarray(arr.astype(np.uint8), 'RGBA')

# 타원형 부드러운 마스크로 자연스럽게 블렌딩(주변 소품을 침범하지 않도록 여백 최소화)
mask = Image.new('L', (tw, th), 0)
md = ImageDraw.Draw(mask)
md.ellipse([1, 1, tw - 1, th - 1], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(radius=2.5))

bg.paste(patch, (tgt_box[0], tgt_box[1]), mask)

# ---- 2) 새로 그린 정확한 태극기를 책상 위 원래 위치/각도에 맞춰 합성 ----
flag = Image.open(FLAG_PATH).convert('RGBA')
# 실제 소품 크기(측정값: 상단변 폭 ~62px, 좌측변 길이 ~44px)에 맞춰 축소
flag = flag.resize((66, 46), Image.LANCZOS)

# 살짝 아래로 그림자를 깔아 책상에 놓인 듯한 입체감
shadow = Image.new('RGBA', flag.size, (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle([4, 6, flag.width - 2, flag.height + 2], radius=6, fill=(20, 15, 10, 110))
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=4))

# 측정한 기울기에 맞춰 회전 (양수 = PIL 기준 반시계, 실측 top edge가 오른쪽으로 갈수록
# 위로 올라가는 형태를 재현하려면 음수 방향으로 조정)
ANGLE = 8
shadow_r = shadow.rotate(ANGLE, expand=True, resample=Image.BICUBIC)
flag_r = flag.rotate(ANGLE, expand=True, resample=Image.BICUBIC)

center = (724, 296)  # 실측 4모서리 평균 중심
sx = center[0] - shadow_r.width // 2
sy = center[1] - shadow_r.height // 2 + 3
bg.alpha_composite(shadow_r, (sx, sy))

fx = center[0] - flag_r.width // 2
fy = center[1] - flag_r.height // 2
bg.alpha_composite(flag_r, (fx, fy))

bg.convert('RGB').save(OUT_PATH)
print('saved', OUT_PATH, bg.size)
