#!/usr/bin/env python3
"""맵 배경 png → 2배 해상도 webp.

왜:
  게임은 배경을 ZOOM(1.6)배로 그리고 거기에 기기 픽셀비(아이폰 3)가 또 곱해진다.
  원본 1픽셀이 화면에서 최대 4.8픽셀이 되니, 1376x768 원본은 뿌옇게 보인다.
  2배(2752x1536)로 담으면 그 뿌연 정도가 눈에 띄게 줄어든다.

  png로 2배를 담으면 장당 4MB라 못 쓴다. webp로 담으면 2배 해상도인데도
  지금 png보다 작다 — 사고 배경은 1228KB → 132KB, 지방 고을은 2058KB → 533KB.
  해상도는 올라가고 용량은 내려간다.

  챕터 HTML은 스펙에 적힌 .png 경로에서 확장자만 .webp로 바꿔 먼저 불러오고,
  없으면 png로 되돌아간다. 그래서 이 스크립트를 안 돌려도 게임은 그대로 돈다.
  제미나이에서 새 맵을 받아 넣은 뒤 한 번씩 돌려 주면 된다.

쓰는 법:
  python3 to_webp.py            # 아직 webp가 없는 png만 변환
  python3 to_webp.py --force    # 전부 다시 변환
  python3 to_webp.py --clean    # 원본 png가 사라진 webp를 지운다
"""
import os
import sys

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SCALE = 2
QUALITY = 80
UNSHARP = dict(radius=1.6, percent=55, threshold=3)


def sources():
    return sorted(f for f in os.listdir(HERE)
                  if f.endswith('.png') and not f.startswith('_sample_')
                  and not f.endswith('_orig.png'))


def convert(name, force=False):
    src = os.path.join(HERE, name)
    dst = src[:-4] + '.webp'
    if os.path.exists(dst) and not force and os.path.getmtime(dst) >= os.path.getmtime(src):
        return None
    im = Image.open(src).convert('RGB')
    big = im.resize((im.width * SCALE, im.height * SCALE), Image.LANCZOS)
    # 늘리기만 하면 물러진다. 언샤프로 가장자리만 다시 세운다.
    big = big.filter(ImageFilter.UnsharpMask(**UNSHARP))
    big.save(dst, 'WEBP', quality=QUALITY, method=6)
    return (im.size, big.size, os.path.getsize(src), os.path.getsize(dst))


def main():
    args = sys.argv[1:]
    if '--clean' in args:
        for f in sorted(os.listdir(HERE)):
            if f.endswith('.webp') and not os.path.exists(os.path.join(HERE, f[:-5] + '.png')):
                os.remove(os.path.join(HERE, f))
                print('지움', f)
        return
    force = '--force' in args
    tot_a = tot_b = 0
    for name in sources():
        r = convert(name, force)
        if not r:
            continue
        (w0, h0), (w1, h1), sa, sb = r
        tot_a += sa; tot_b += sb
        print(f'{name:34s} {w0}x{h0} png {sa//1024:>5}KB  →  {w1}x{h1} webp {sb//1024:>5}KB')
    if tot_a:
        print(f'\n합계 {tot_a//1024}KB → {tot_b//1024}KB  ({tot_b/tot_a:.0%})')
    else:
        print('새로 변환할 것 없음.')


if __name__ == '__main__':
    main()
