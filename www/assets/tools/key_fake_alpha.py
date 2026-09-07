#!/usr/bin/env python3
"""제미나이가 **그림으로 그려 넣은** 가짜 투명 체크무늬를 진짜 투명으로 바꾼다.

   왜 필요한가
   - 프롬프트에 "배경 완전 투명"이라고 적으면 제미나이는 알파 채널을 만드는
     대신 **회색·흰색 체크무늬를 그려 준다**. 겉보기엔 투명해 보이지만
     알파는 전부 255다(실제로 칠지도v1·v2가 그랬다).
   - 그대로 게임에 넣으면 어두운 대화창 위에 흰 체크무늬 네모가 뜬다.

   어떻게 지우나
   - 체크무늬는 **무채색**(R≈G≈B)이고 **밝다**. 유물은 색이 있다(녹슨 철은
     붉은기, 청동은 푸른기). 그 둘로 가른다.
   - 색만 보면 유물 안의 회색 하이라이트까지 지워진다. 그래서 **테두리에서
     시작해 번져 나가며**(flood fill) 바깥과 이어진 부분만 지운다.
     유물 안쪽에 갇힌 회색은 살아남는다.
   - 가장자리 한 겹은 반투명으로 부드럽게 만든다(계단 지지 않게).

   쓰는 법
     python3 key_fake_alpha.py ~/Downloads/칠지도v2.png            # 미리보기만
     python3 key_fake_alpha.py ~/Downloads/칠지도v2.png -o out.png  # 저장
     python3 key_fake_alpha.py ... --size 160                       # 게임 규격으로
"""
import argparse
import os
from collections import deque

import numpy as np
from PIL import Image


def key_out(im, sat_max=26, light_min=150):
    """테두리와 이어진 '밝은 무채색'을 투명하게."""
    a = np.array(im.convert('RGBA')).astype(np.int16)
    rgb = a[:, :, :3]
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    # 무채색이면서 밝다 = 체크무늬 후보
    bgish = ((mx - mn) <= sat_max) & (mx >= light_min)

    h, w = bgish.shape
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bgish[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bgish[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bgish[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))

    a[:, :, 3] = np.where(seen, 0, 255)

    # 가장자리 한 겹만 반투명 — 계단이 지지 않게
    al = a[:, :, 3].astype(np.uint8)
    edge = (al == 255)
    nb = np.zeros_like(edge)
    nb[1:, :] |= (al[:-1, :] == 0); nb[:-1, :] |= (al[1:, :] == 0)
    nb[:, 1:] |= (al[:, :-1] == 0); nb[:, :-1] |= (al[:, 1:] == 0)
    a[:, :, 3] = np.where(edge & nb, 165, a[:, :, 3])
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def trim(im, pad_ratio=0.05):
    """빈 자리를 잘라 내고 정사각형 가운데에 다시 앉힌다."""
    bb = im.getbbox()
    if not bb:
        return im
    c = im.crop(bb)
    side = int(max(c.size) * (1 + pad_ratio * 2))
    out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.paste(c, ((side - c.size[0]) // 2, (side - c.size[1]) // 2), c)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('-o', '--out')
    ap.add_argument('--size', type=int, default=0, help='정사각 크기(예: 160)')
    ap.add_argument('--sat', type=int, default=26)
    ap.add_argument('--light', type=int, default=150)
    a = ap.parse_args()

    im = Image.open(os.path.expanduser(a.src))
    before = np.array(im.convert('RGBA'))[:, :, 3]
    out = trim(key_out(im, a.sat, a.light))
    if a.size:
        out = out.resize((a.size, a.size), Image.LANCZOS)

    after = np.array(out)[:, :, 3]
    print('%s' % os.path.basename(a.src))
    print('  넣기 전 완전투명 %.0f%%  →  뒤 %.0f%%'
          % ((before < 10).mean() * 100, (after < 10).mean() * 100))
    print('  크기 %s → %s' % (im.size, out.size))
    if a.out:
        out.save(os.path.expanduser(a.out))
        print('  저장:', a.out)
    else:
        print('  (-o 를 안 줘서 저장하지 않았다)')


if __name__ == '__main__':
    main()
