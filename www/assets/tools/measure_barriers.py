#!/usr/bin/env python3
"""배경 이미지 속 가구(책상·의자·제단 등)의 실제 외곽 좌표를 픽셀 분석으로
찾아내는 범용 도구. 어떤 챕터든 "길이 막혔다/멀쩡한 바닥을 못 간다"는
신고가 들어오면, 눈대중으로 barriers 좌표를 다시 추측하지 말고 이 스크립트로
먼저 실측할 것.

원리: 이 게임의 배경 그림들은 전부 카툰 스타일이라 가구마다 진한 갈색/검정
계열 윤곽선이 뚜렷하다. 그 어두운 픽셀만 골라 connected-component로 묶으면
가구 하나하나의 진짜 bounding box가 나온다("어림짐작 사각형"보다 항상 정확).

사용법:
    python3 measure_barriers.py <배경이미지경로> [--region x0 y0 x1 y1] [--min-size N] [--threshold N]

예시(ch2 사례처럼 특정 구역만 다시 재보고 싶을 때):
    python3 measure_barriers.py ../scenes/ch3_gungya.png --region 100 150 1290 650

출력: 발견한 각 가구의 bbox를 좌표 그대로 콘솔에 출력(그대로 barriers 배열에
복붙 가능한 JS 객체 리터럴 형태로도 같이 출력).

주의: 이 스크립트는 "후보"를 찾아줄 뿐 — 결과를 그대로 믿지 말고, 반드시
①원본 이미지에서 해당 bbox 위치를 Read로 다시 확인하고 ②게임에 적용한 뒤
`?debug=1` 격자를 스크린샷으로 찍어 가구 윤곽과 빨간 점이 실제로 겹치는지
눈으로 최종 검증할 것(ch2 작업 시 확립된 표준 절차, 이 세 단계를 항상 같이 할 것).
"""
import sys
import argparse
from collections import deque

from PIL import Image
import numpy as np


def label_components(mask):
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    comps = []
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not visited[y, x]:
                q = deque([(y, x)])
                visited[y, x] = True
                pts = []
                while q:
                    cy, cx = q.popleft()
                    pts.append((cy, cx))
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((ny, nx))
                comps.append(pts)
    return comps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image', help='배경 이미지 경로')
    ap.add_argument('--region', nargs=4, type=int, metavar=('X0', 'Y0', 'X1', 'Y1'),
                     help='이 범위 안에서만 검사(생략하면 전체 이미지)')
    ap.add_argument('--min-size', type=int, default=200, help='이보다 작은 얼룩은 무시(기본 200px)')
    ap.add_argument('--threshold', type=int, default=230,
                     help='R+G+B 합이 이 값보다 작으면 "어두운 윤곽선"으로 간주(기본 230)')
    ap.add_argument('--margin', type=int, default=4, help='검출된 bbox에 더할 여유(기본 4px)')
    args = ap.parse_args()

    im = Image.open(args.image).convert('RGB')
    W, H = im.size
    x0, y0, x1, y1 = args.region if args.region else (0, 0, W, H)
    arr = np.array(im).astype(int)
    region = arr[y0:y1, x0:x1]
    brightness = region.sum(axis=2)
    dark = brightness < args.threshold

    comps = label_components(dark)
    comps = [c for c in comps if len(c) > args.min_size]
    boxes = []
    for c in comps:
        ys = [p[0] for p in c]
        xs = [p[1] for p in c]
        bx0, bx1 = min(xs) + x0, max(xs) + x0
        by0, by1 = min(ys) + y0, max(ys) + y0
        boxes.append((bx0 - args.margin, by0 - args.margin, bx1 + args.margin, by1 + args.margin, len(c)))
    boxes.sort(key=lambda b: (b[1], b[0]))

    print(f'{len(boxes)}개 후보 발견(min-size={args.min_size}, threshold={args.threshold}):\n')
    for bx0, by0, bx1, by1, size in boxes:
        print(f'  size={size:6d}  x:{bx0}-{bx1}  y:{by0}-{by1}')

    print('\n--- barriers 배열에 그대로 붙여넣을 JS 형태 ---')
    for bx0, by0, bx1, by1, size in boxes:
        print(f'      {{ x0:{bx0}, y0:{by0}, x1:{bx1}, y1:{by1} }},')

    print('\n주의: 결과를 그대로 믿지 말 것 — 작은 소품(책·펜 등)이 개별 얼룩으로')
    print('잡히거나, 서로 다른 가구가 하나로 뭉쳐 잡힐 수 있음. --min-size / --region으로')
    print('범위를 좁혀가며 원본 이미지와 대조하고, 적용 후 ?debug=1로 최종 확인할 것.')


if __name__ == '__main__':
    main()
