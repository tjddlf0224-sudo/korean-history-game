#!/usr/bin/env python3
"""사용자가 Gemini로 뽑은 20인 NPC 시트를 5x4 그리드로 잘라 개별 PNG로 저장."""
from PIL import Image

SRC = 'npc_sheet_raw.png'
im = Image.open(SRC).convert('RGBA')
W, H = im.size
COLS, ROWS = 5, 4
cw, ch = W / COLS, H / ROWS

# 시트에 표시된 라벨 순서(왼쪽→오른쪽, 위→아래). 원본 시트에 조식/평민이
# 중복 라벨링되어 있어(그리드 20칸 vs 실제 캐릭터 18명) 각각 _2를 붙여 구분.
LABELS = [
    'jeongdojeon', 'taejong', 'sejong', 'sinsukju', 'kimjongseo',
    'sejo', 'seongsammun', 'seogeojeong', 'yeonsangun', 'jogwangjo',
    'josik', 'josik2', 'yihwang', 'kimilson', 'commoner1',
    'commoner2', 'gungnyeo', 'naesi', 'general', 'scholar',
]

# 셀 안쪽 여백(라벨 텍스트 바 제외하고 인물 일러스트만 크롭)
PAD_TOP = 1
PAD_SIDE = 4
LABEL_BAND = int(ch * 0.16)  # 각 칸 하단 라벨 바 높이만큼 제외

for i, name in enumerate(LABELS):
    col = i % COLS
    row = i // COLS
    x0 = int(col * cw) + PAD_SIDE
    y0 = int(row * ch) + PAD_TOP
    x1 = int((col + 1) * cw) - PAD_SIDE
    y1 = int((row + 1) * ch) - LABEL_BAND
    crop = im.crop((x0, y0, x1, y1))
    crop.save(f'{name}.png')
    print(name, crop.size)
