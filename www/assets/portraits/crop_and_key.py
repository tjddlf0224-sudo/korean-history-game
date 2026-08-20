#!/usr/bin/env python3
"""마젠타 배경 시트에서 20인 크롭 + 배경 투명화(직접 색상 임계값,
마젠타는 캐릭터 옷 색과 겹칠 일이 없어 flood-fill보다 훨씬 깔끔하다)."""
from PIL import Image
import numpy as np

SRC = 'npc_sheet_magenta.png'
COLS, ROWS = 5, 4
PAD_TOP = 20
PAD_SIDE = 22

LABELS = [
    'jeongdojeon', 'taejong', 'sejong', 'sinsukju', 'kimjongseo',
    'sejo', 'seongsammun', 'seogeojeong', 'yeonsangun', 'jogwangjo',
    'josik', 'josik2', 'yihwang', 'kimilson', 'commoner1',
    'commoner2', 'gungnyeo', 'naesi', 'general', 'scholar',
]

im = Image.open(SRC).convert('RGB')
W, H = im.size
cw, ch = W / COLS, H / ROWS
LABEL_BAND = int(ch * 0.16)

MAGENTA = np.array([246, 26, 246])
THRESH = 95  # 압축 노이즈로 경계부 색이 지저분해서 소프트 알파/디컨탐 대신 확실한 하드 컷 사용

for i, name in enumerate(LABELS):
    col, row = i % COLS, i // COLS
    x0 = int(col * cw) + PAD_SIDE
    y0 = int(row * ch) + PAD_TOP
    x1 = int((col + 1) * cw) - PAD_SIDE
    y1 = int((row + 1) * ch) - LABEL_BAND
    crop = im.crop((x0, y0, x1, y1))

    arr = np.array(crop).astype(np.int16)
    dist_m = np.sqrt(((arr - MAGENTA) ** 2).sum(axis=-1))
    is_bg = dist_m < THRESH

    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(is_bg, 0, 255)

    out = Image.fromarray(rgba, 'RGBA')
    out.save(f'{name}.png')
    print(name, out.size, f'{is_bg.mean()*100:.1f}% removed')
