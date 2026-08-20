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
    is_fg = dist_m >= THRESH

    # 경계부에 마젠타가 섞인 오염 픽셀 1겹을 깎아낸다(3x3 침식) —
    # 압축 노이즈 때문에 하드 컷만으로는 테두리에 마젠타 기가 남는다.
    for _ in range(2):
        eroded = is_fg.copy()
        eroded[1:, :] &= is_fg[:-1, :]
        eroded[:-1, :] &= is_fg[1:, :]
        eroded[:, 1:] &= is_fg[:, :-1]
        eroded[:, :-1] &= is_fg[:, 1:]
        is_fg = eroded

    # 마젠타 스필 억제: 살아남은 불투명 픽셀 중에도 R·B가 G보다 나란히
    # 높은(마젠타가 살짝 섞인) 픽셀이 있다 — 그 초과분만큼 R·B를 깎아
    # 색조를 중화한다(그린스크린 스필 서프레션과 동일한 원리, 마젠타용).
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    excess = np.clip((r + b) / 2 - g, 0, None)
    r2 = np.clip(r - excess, 0, 255)
    b2 = np.clip(b - excess, 0, 255)
    arr[..., 0] = r2
    arr[..., 2] = b2

    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(is_fg, 255, 0)

    out = Image.fromarray(rgba, 'RGBA')
    out.save(f'{name}.png')
    print(name, out.size, f'{(~is_fg).mean()*100:.1f}% removed')
