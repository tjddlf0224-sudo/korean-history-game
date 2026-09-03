#!/usr/bin/env python3
"""걷기 프레임을 하나의 캔버스 규격에 맞춰 다시 앉힌다.

   왜 필요한가
   ① 프레임마다 캐릭터가 격자 안에서 좌우로 들쭉날쭉해서, 프레임이 바뀔 때마다
      화면에서 옆으로 순간이동하는 것처럼 보였다.
   ② 챕터는 **높이 88px에 맞추고 비율을 유지해서** 그린다
      (`H = 88; W = H * naturalWidth / naturalHeight`).
      그래서 캔버스가 가로로 넓으면 인물이 그만큼 작아진다.
      12장이 같은 캔버스 크기여야 크기도 위치도 안 흔들린다.

   그래서 한 폴더의 12장을 다 재서, 가장 큰 것에 맞춘 **하나의 캔버스**를 만들고
   전부 가로 가운데·바닥 기준으로 앉힌다.

   쓰는 법
     python3 recenter.py              # 이 폴더(계급 없던 기존 스프라이트)
     python3 recenter.py --dir nobi   # 신분별 폴더
"""
import argparse
import os
from PIL import Image

MARGIN_X = 5      # 좌우 여백
MARGIN_BOTTOM = 4 # 발밑 여백
MARGIN_TOP = 3

NAMES = [f'{d}_{i}' for d in ('down', 'up', 'left', 'right') for i in range(3)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', default='.', help='스프라이트가 든 폴더')
    a = ap.parse_args()

    paths = [os.path.join(a.dir, n + '.png') for n in NAMES]
    paths = [p for p in paths if os.path.exists(p)]
    if not paths:
        print('그림이 없다:', a.dir); return

    # ① 열두 장을 다 재서 가장 큰 인물에 맞춘 캔버스 하나를 정한다
    crops = {}
    mw = mh = 0
    for p in paths:
        im = Image.open(p).convert('RGBA')
        bb = im.getbbox()
        if not bb: continue
        c = im.crop(bb)
        crops[p] = c
        mw = max(mw, c.size[0]); mh = max(mh, c.size[1])

    W = mw + MARGIN_X * 2
    H = mh + MARGIN_TOP + MARGIN_BOTTOM

    # ② 전부 같은 캔버스에, 가로는 가운데·세로는 바닥을 맞춰 앉힌다
    for p, c in crops.items():
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        bw, bh = c.size
        canvas.paste(c, ((W - bw) // 2, H - MARGIN_BOTTOM - bh), c)
        canvas.save(p)

    print('%-10s 12장 → %dx%d (화면에서 가로 %.0fpx)' % (a.dir, W, H, 88 * W / H))


if __name__ == '__main__':
    main()
