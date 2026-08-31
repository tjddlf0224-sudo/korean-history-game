#!/usr/bin/env python3
"""주인공 걷기 사이클 시트(4행x3열) 크롭 + 배경 투명화.

행: 아래/위/옆모습. AI가 좌우를 구분 못 그려서 옆모습 한 행만 쓰고
반대쪽은 좌우 반전으로 만든다.

┌─ 좌우 — 눈대중하지 말고 재라 ──────────────────────────────────────┐
│ 원본 시트 player_sheet_raw.png의 옆모습 행은 **오른쪽을 본다.**    │
│ 그래서 그 행을 right로 삼고, left는 좌우반전으로 만든다.           │
│                                                                    │
│ 눈으로 보고 판단하지 말 것 — 치비 그림이라 작게 보면 어느 쪽인지   │
│ 사람 눈에도 잘 안 잡힌다(실제로 두 번 틀렸다). 이렇게 재라:        │
│   얼굴(살색) 픽셀의 가로 중심이 몸통 중심보다 오른쪽이면 오른쪽을  │
│   보는 것이다. 아래 한 줄로 확인된다.                              │
│                                                                    │
│   python3 -c "from PIL import Image; import numpy as np;           │
│     a=np.array(Image.open('right_1.png').convert('RGBA'));         │
│     al=a[...,3]; r,g,b=a[...,0].astype(int),a[...,1].astype(int),  │
│     a[...,2].astype(int); ys,xs=np.where(al>100);                  │
│     h=np.zeros_like(al,bool); h[ys.min():ys.min()+                 │
│     int((ys.max()-ys.min())*.45), xs.min():xs.max()+1]=True;       │
│     s=(al>100)&h&(r>170)&(g>120)&(b>100)&(r>b+18)&(r>g+8);         │
│     print(np.where(s)[1].mean()-(xs.min()+xs.max())/2)"            │
│                                                                    │
│ 2026-08-31: 예전에는 파일 이름이 그림과 반대여서, 챕터마다         │
│ DIR_SRC로 좌우를 바꿔치기해 보정했다. 그 보정을 모르는 boss.js에서 │
│ 주인공이 보스 반대쪽을 보는 버그가 났다. 이제 이름과 그림이 같고   │
│ 보정도 없앴으니, **파일을 다시 뽑을 때 이 규칙을 지켜라.**         │
└────────────────────────────────────────────────────────────────────┘

배경색은 옷 색과 가장 먼 것을 골라야 한다. 마젠타 배경에 홍색 관복을 놓으면
옷이 배경으로 오인돼 뚫리고, 초록 배경에 옥색(연녹색) 도포를 놓으면 같은 일이
난다. 그래서 신분마다 배경을 갈라 쓰고, 여기서 둘 다 처리한다.

  마젠타 배경 : 노비(회갈색) · 양인(흰색) · 중인(옥색) · 양반(연옥색)
  초록 배경   : 재상(홍색 단령) · 왕(대홍색 곤룡포)

사용:
  python3 crop_player.py                                  # 기본(기존 시트, 마젠타)
  python3 crop_player.py --src sheet_wang.png --bg green --out wang
  python3 crop_player.py --src sheet_jungin.png --bg magenta --out jungin
"""
import argparse
import os
from PIL import Image
import numpy as np

COLS, ROWS = 3, 4
PAD = 14
DIRS = ['down', 'up', 'right']  # row0=down, row1=up, row2=옆모습(오른쪽을 봄), row3은 버림

# 배경색별 키 값. thresh는 "이 색에서 이만큼 떨어지면 전경"으로 보는 거리.
BGS = {
    'magenta': {'key': np.array([246, 26, 246]), 'thresh': 95},
    'green':   {'key': np.array([26, 246, 26]),  'thresh': 95},
}


def key_out(crop, bg):
    """배경색을 빼고 알파를 만든다. 경계에 남는 배경색 번짐(spill)도 걷어낸다."""
    conf = BGS[bg]
    arr = np.array(crop).astype(np.int16)
    dist = np.sqrt(((arr - conf['key']) ** 2).sum(axis=-1))
    is_fg = dist >= conf['thresh']

    # 경계 한 겹을 깎아 배경색 테두리가 남지 않게 한다
    for _ in range(2):
        eroded = is_fg.copy()
        eroded[1:, :] &= is_fg[:-1, :]
        eroded[:-1, :] &= is_fg[1:, :]
        eroded[:, 1:] &= is_fg[:, :-1]
        eroded[:, :-1] &= is_fg[:, 1:]
        is_fg = eroded

    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    if bg == 'magenta':
        # 마젠타(R+B)가 번진 만큼 R·B를 깎는다
        excess = np.clip((r + b) / 2 - g, 0, None)
        arr[..., 0] = np.clip(r - excess, 0, 255)
        arr[..., 2] = np.clip(b - excess, 0, 255)
    else:
        # 초록이 번진 만큼 G를 깎는다
        excess = np.clip(g - np.maximum(r, b), 0, None)
        arr[..., 1] = np.clip(g - excess, 0, 255)

    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(is_fg, 255, 0)
    return Image.fromarray(rgba, 'RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='player_sheet_raw.png', help='시트 이미지')
    ap.add_argument('--bg', default='magenta', choices=list(BGS), help='배경색')
    ap.add_argument('--out', default='.', help='결과를 넣을 폴더(신분 이름 등)')
    a = ap.parse_args()

    os.makedirs(a.out, exist_ok=True)
    im = Image.open(a.src).convert('RGB')
    W, H = im.size
    cw, ch = W / COLS, H / ROWS

    frames = {}
    for row, direction in enumerate(DIRS):
        for col in range(COLS):
            crop = im.crop((int(col * cw) + PAD, int(row * ch) + PAD,
                            int((col + 1) * cw) - PAD, int((row + 1) * ch) - PAD))
            out = key_out(crop, a.bg)
            name = f'{direction}_{col}'
            out.save(os.path.join(a.out, f'{name}.png'))
            frames[name] = out
            # 전경이 너무 적으면 옷이 배경색으로 오인돼 뚫린 것이다 — 바로 알려준다
            alpha = np.array(out)[..., 3]
            filled = (alpha > 0).mean()
            warn = '  ← 전경이 너무 적다! 옷 색이 배경색과 가까운지 확인' if filled < 0.06 else ''
            print(f'{name} {out.size} 전경 {filled*100:.1f}%{warn}')

    for col in range(COLS):
        left = frames[f'right_{col}'].transpose(Image.FLIP_LEFT_RIGHT)
        left.save(os.path.join(a.out, f'left_{col}.png'))
        print(f'left_{col} {left.size} (좌우반전)')


if __name__ == '__main__':
    main()
