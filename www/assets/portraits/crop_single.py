#!/usr/bin/env python3
"""단일 마젠타 배경 이미지 하나를 크롭+투명화한다(시트가 아니라 한 장짜리
초상 재생성용). 가장 큰 연결요소(캐릭터 본체)만 남기고 나머지(제미나이
스파클 워터마크 같은 작은 고립 조각)는 버려서, 워터마크가 마젠타 임계값을
통과해 살아남아도 크롭 범위에 안 들어오게 한다."""
import sys
from PIL import Image
import numpy as np
from scipy import ndimage

MAGENTA = np.array([246, 26, 246])
THRESH = 95
PAD = 14

def process(src, dst):
    im = Image.open(src).convert('RGB')
    arr = np.array(im).astype(np.int16)
    dist_m = np.sqrt(((arr - MAGENTA) ** 2).sum(axis=-1))
    is_fg = dist_m >= THRESH

    for _ in range(2):
        eroded = is_fg.copy()
        eroded[1:, :] &= is_fg[:-1, :]
        eroded[:-1, :] &= is_fg[1:, :]
        eroded[:, 1:] &= is_fg[:, :-1]
        eroded[:, :-1] &= is_fg[:, 1:]
        is_fg = eroded

    labeled, n = ndimage.label(is_fg)
    if n == 0:
        raise SystemExit(f'{src}: 전경 픽셀 없음')
    sizes = ndimage.sum(is_fg, labeled, range(1, n + 1))
    main_label = np.argmax(sizes) + 1
    main_mask = labeled == main_label

    ys, xs = np.where(main_mask)
    y0, y1 = max(0, ys.min() - PAD), min(arr.shape[0], ys.max() + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(arr.shape[1], xs.max() + PAD)

    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    excess = np.clip((r + b) / 2 - g, 0, None)
    arr[..., 0] = np.clip(r - excess, 0, 255)
    arr[..., 2] = np.clip(b - excess, 0, 255)

    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(main_mask, 255, 0)

    out = Image.fromarray(rgba, 'RGBA').crop((x0, y0, x1, y1))
    out.save(dst)
    print(dst, out.size, f'{n} components, main={sizes.max():.0f}px')

if __name__ == '__main__':
    process(sys.argv[1], sys.argv[2])
