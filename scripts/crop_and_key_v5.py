#!/usr/bin/env python3
"""제미나이 시트 → 투명 PNG (v5: 슈퍼샘플링 + 프리멀티플라이드 알파).

2026-08-22 NPC 초상 22종·주인공 12장에 처음 쓴 방식(커밋 9fc35cb·36df116).
그 뒤로 동료(바우·차돌이) 걷기 그림엔 이 기법 없이 옛날 하드 임계값
크롭(crop_blobs.py)만 썼다가, 이미 작은 원본을 v166·v180에서 두 번이나
사후 업스케일+샤프닝으로 땜질했다 — 그래도 "테두리가 흐릿하다"는 제보가
2026-09-20에 다시 나왔다(성일님이 git log에서 이 기법을 직접 찾아냄).
바우·차돌이를 큰 캔버스로 다시 뽑아 이 스크립트로 재추출해 해결.

문제: 하드 임계값으로 마스크를 만들면 알파가 0/255 두 값뿐이라 곡선이
픽셀 계단 그대로 남는다. 침식(erosion)까지 더하면 외곽선까지 갉아먹힌다.

v5 방식:
  1) 셀을 SS배(4배) LANCZOS로 확대한다 — 경계가 원본 기준 서브픽셀
     위치에 놓여 부드럽게 보간된다.
  2) 확대본에서 마스크를 만든다(침식 없음 — 침식이 테두리를 갉아먹던 주범).
     연결요소 중 가장 큰 덩어리만 남기고(격자선 등 잔여물 제거),
     안에 뚫린 구멍은 메운다.
  3) 배경색 스필(마젠타/초록이 반투명 경계에 번지는 것)을 억제한다.
  4) 프리멀티플라이(rgb*mask)한 뒤 원래 크기로 축소한다. 알파도 같이
     축소하면 0~255 사이 중간값이 생기며 진짜 안티에일리어싱이 된다.
     프리멀티플라이 없이 그냥 축소하면 배경색이 테두리로 번진다.
  5) 언프리멀티플라이로 색을 복원하고, PAD px 여백을 남겨 크롭한다.

배경색은 고정값을 가정하지 않고 셀 네 모서리에서 직접 잰다(제미나이가
마젠타를 분홍으로, 초록을 다른 톤으로 내놓는 일이 흔하다).

사용:
  # 격자 시트에서 칸 하나씩(이름: (x0,y0,x1,y1))
  python3 crop_and_key_v5.py SRC OUT_DIR "{'down': (6,6,165,180), 'up': (177,6,335,180)}"

  # 칸이 아니라 이미지 전체가 캐릭터 하나면(제미나이 그리드 지시를 안 따를 때 —
  # 2026-09-20에 4×3을 요청해도 6×3으로 나오고, 격자 안의 세 걸음도 다 똑같이
  # 나와서 방향별로 한 장씩 따로 뽑는 우회로 정착했다)
  python3 crop_and_key_v5.py down.jpg OUT_DIR "{'down': (0,0,1024,559)}"
"""
import sys
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = sys.argv[1]
OUT_DIR = sys.argv[2]
BOXES = eval(sys.argv[3])  # {name: (x0,y0,x1,y1)}
SS = 4          # 슈퍼샘플 배율
THRESH = 90     # 확대본에서의 배경 거리 임계값
PAD = 4         # 최종 출력에 남길 여백(px)


def measure_bg(arr):
    """셀 네 모서리 6x6 평균으로 실제 배경색을 잰다."""
    c = [arr[:6, :6], arr[:6, -6:], arr[-6:, :6], arr[-6:, -6:]]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in c]), axis=0)


im = Image.open(SRC).convert('RGB')

for name, box in BOXES.items():
    cell = im.crop(box)
    w0, h0 = cell.size
    bg = measure_bg(np.array(cell).astype(np.int16))

    # 1) 슈퍼샘플 확대
    big = cell.resize((w0 * SS, h0 * SS), Image.LANCZOS)
    arr = np.array(big).astype(np.float64)

    # 2) 마스크(침식 없음) — 가장 큰 덩어리만, 구멍은 메움
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=-1))
    mask = dist >= THRESH
    labeled, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, labeled, range(1, n + 1))
        mask = labeled == (np.argmax(sizes) + 1)
    mask = ndimage.binary_fill_holes(mask)

    # 3) 배경색 스필 억제 — 마젠타(R+B 초과)든 초록(G 초과)이든 배경 쪽으로
    #    치우친 초과분을 깎는다
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    if bg[1] > bg[0] and bg[1] > bg[2]:   # 초록 배경
        excess = np.clip(g - (r + b) / 2, 0, None)
        arr[..., 1] = np.clip(g - excess, 0, 255)
    else:                                  # 마젠타 배경
        excess = np.clip((r + b) / 2 - g, 0, None)
        arr[..., 0] = np.clip(r - excess, 0, 255)
        arr[..., 2] = np.clip(b - excess, 0, 255)

    # 4) 프리멀티플라이 후 축소
    a_big = mask.astype(np.float64)
    premult = arr * a_big[..., None]
    pm_small = np.array(Image.fromarray(premult.astype(np.uint8), 'RGB')
                        .resize((w0, h0), Image.LANCZOS)).astype(np.float64)
    a_small = np.array(Image.fromarray((a_big * 255).astype(np.uint8), 'L')
                       .resize((w0, h0), Image.LANCZOS)).astype(np.float64) / 255.0

    # 5) 언프리멀티플라이
    safe = np.maximum(a_small, 1e-4)[..., None]
    rgb = np.clip(pm_small / safe, 0, 255)
    rgba = np.dstack([rgb.astype(np.uint8), (a_small * 255).astype(np.uint8)])

    ys, xs = np.where(a_small > 0.02)
    y0, y1 = max(0, ys.min() - PAD), min(h0, ys.max() + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w0, xs.max() + PAD)

    out = Image.fromarray(rgba, 'RGBA').crop((x0, y0, x1, y1))
    out.save(f'{OUT_DIR}/{name}.png')

    a = np.array(out)[..., 3]
    soft = ((a > 8) & (a < 247)).sum()
    print(f'{name:12s} {out.size}  반투명 경계픽셀 {soft}개  bg={bg.astype(int).tolist()}')
