#!/usr/bin/env python3
"""이 프로젝트의 Gemini 생성 배경 이미지들에 공통으로 박혀 있는 제미나이
스파클 워터마크(우하단 모서리, 옅은 4방향 별 모양)를 지우는 범용 도구.

발견 경위: 2화(황금시대) 집현전 배경에서 사용자가 "우측하단 맵에 제미나이
로고 있어"로 지적 → 확인해보니 이 프로젝트의 거의 모든 Gemini 배경(16개
파일)에 동일한 모양·거의 동일한 위치(대략 x:1210-1296, y:605-690, 1376x768
캔버스 기준)로 박혀 있었음. 그동안 "장식용 반짝임 표시"로 착각하고 있었음.

사용법:
    python3 remove_watermark.py <이미지경로> [--target x0 y0 x1 y1] [--src x0 y0]

--target을 생략하면 기본값(1210,605,1296,690 — 이 프로젝트 표준 위치)을 씀.
--src를 생략하면 target과 같은 y범위에서 좌우로 후보 여러 곳을 자동 탐색해
(엣지가 적고 밝기 분산이 낮은 곳 = 워터마크·소품이 없는 곳) 가장 무난한
곳을 자동 선택함 — 자동 선택이 이상하면 반드시 결과를 직접 눈으로 확인하고
--src로 수동 지정해서 재실행할 것.

주의: 이미지를 바로 덮어씀 — 실행 전에 원본이 git에 커밋돼 있는지 확인할 것
(git으로 언제든 복구 가능하도록).
"""
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def edge_score(arr):
    gy, gx = np.gradient(arr.mean(axis=2))
    return float(np.abs(gx).mean() + np.abs(gy).mean())


def find_clean_source(im_arr, tw, th, ty0, avoid_box, W, H, step=40):
    best = None
    for sx in range(20, W - tw - 20, step):
        sy = ty0
        if sy < 0 or sy + th > H:
            continue
        # skip if overlapping the region to avoid (the watermark box itself, with margin)
        ax0, ay0, ax1, ay1 = avoid_box
        if not (sx + tw < ax0 - 10 or sx > ax1 + 10):
            continue
        patch = im_arr[sy:sy + th, sx:sx + tw]
        if patch.shape[:2] != (th, tw):
            continue
        score = edge_score(patch.astype(float)) + patch.std() * 0.1
        if best is None or score < best[0]:
            best = (score, sx, sy)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('--target', nargs=4, type=int, default=[1210, 605, 1296, 690])
    ap.add_argument('--src', nargs=2, type=int, default=None, help='소스 패치 좌상단 x y (생략시 자동탐색)')
    ap.add_argument('--feather', type=int, default=6)
    args = ap.parse_args()

    im = Image.open(args.image).convert('RGB')
    W, H = im.size
    arr = np.array(im)

    tx0, ty0, tx1, ty1 = args.target
    tw, th = tx1 - tx0, ty1 - ty0

    if args.src:
        sx0, sy0 = args.src
    else:
        result = find_clean_source(arr, tw, th, ty0, args.target, W, H)
        if result is None:
            print('자동 소스 탐색 실패 — --src로 직접 지정할 것')
            return
        _, sx0, sy0 = result
        print(f'자동 선택된 소스: ({sx0},{sy0})')

    patch = im.crop((sx0, sy0, sx0 + tw, sy0 + th))
    parr = np.array(patch).astype(np.int16)
    rng = np.random.default_rng(abs(hash(args.image)) % (2**31))
    noise = rng.normal(0, 3, (th, tw, 1)).astype(np.int16)
    parr = np.clip(parr + noise, 0, 255).astype(np.uint8)
    patch = Image.fromarray(parr, 'RGB')

    mask = Image.new('L', (tw, th), 0)
    d = ImageDraw.Draw(mask)
    m = args.feather
    d.rectangle([m, m, tw - m, th - m], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=m))

    im.paste(patch, (tx0, ty0), mask)
    im.save(args.image)
    print(f'{args.image}: 패치 완료 (target={args.target}, src=({sx0},{sy0}))')


if __name__ == '__main__':
    main()
