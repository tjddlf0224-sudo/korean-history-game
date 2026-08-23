#!/usr/bin/env python3
"""본떠 메우기 — 같은 그림 안에서 비슷한 조각을 찾아 구멍을 채운다.

왜 이걸 따로 만들었나:
  · 라플라스로 번지게 채우면(확산 방식) 매끈해지는 대신 선이 끊긴다.
    울타리 살, 기와 줄, 돌담 이음매가 뭉개진다.
  · 사각형을 통째로 복사해 덮으면 평평한 바닥에서는 완벽하지만, 무늬가
    있는 곳에서는 엉뚱한 것(울타리 조각, 나무 문짝)이 딸려 온다.
  · 본떠 메우기(exemplar/Criminisi 방식)는 구멍 테두리에서부터 한 조각씩,
    주변에서 가장 비슷한 조각을 찾아 붙인다. 선이 이어진다.

opencv가 있으면 cv2.inpaint로 끝날 일이지만, 시스템 파이썬에 설치가 막혀
있어(PEP 668) numpy만으로 짰다. 구멍이 작아서(수천 픽셀) 이 정도면 충분하다.

  from inpaint import exemplar_fill
  out = exemplar_fill(rgb_uint8, mask_bool)
"""
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view
from scipy import ndimage

PATCH = 9        # 한 번에 붙이는 조각 크기(홀수)
SEARCH = 96      # 조각을 찾아 볼 범위(구멍 중심에서 픽셀)
STRIDE = 2       # 후보를 이만큼 건너뛰며 본다(속도)


def exemplar_fill(img, mask, patch=PATCH, search=SEARCH, stride=STRIDE, max_steps=4000):
    """mask가 True인 곳을 주변에서 본떠 채운다.

    테두리부터 한 조각씩 안으로 좁혀 들어간다. 매번, 아직 채우지 않은
    픽셀이 가장 적은 자리를 먼저 고른다(=주변 정보가 가장 많은 자리).
    """
    out = img.astype(np.float32).copy()
    todo = mask.copy()
    if not todo.any():
        return img.copy()
    h, w = todo.shape
    r = patch // 2

    yy, xx = np.nonzero(todo)
    cy, cx = int(yy.mean()), int(xx.mean())
    y0, y1 = max(0, cy - search), min(h, cy + search)
    x0, x1 = max(0, cx - search), min(w, cx + search)
    if y1 - y0 < patch + 2 or x1 - x0 < patch + 2:
        return img.copy()

    for _ in range(max_steps):
        if not todo.any():
            break
        # 테두리에서, 알려진 픽셀이 가장 많은 자리를 고른다
        border = todo & ~ndimage.binary_erosion(todo, np.ones((3, 3)))
        if not border.any():
            border = todo
        known = (~todo).astype(np.float32)
        score = ndimage.uniform_filter(known, size=patch)
        score = np.where(border, score, -1.0)
        ty, tx = np.unravel_index(int(np.argmax(score)), score.shape)
        ty = int(np.clip(ty, r, h - r - 1))
        tx = int(np.clip(tx, r, w - r - 1))

        tgt = out[ty - r:ty + r + 1, tx - r:tx + r + 1]
        tmask = todo[ty - r:ty + r + 1, tx - r:tx + r + 1]
        kn = ~tmask
        if not kn.any():
            todo[ty - r:ty + r + 1, tx - r:tx + r + 1] = False
            continue

        # 후보 조각들 — 구멍을 하나도 안 물고 있는 자리만
        region = out[y0:y1, x0:x1]
        rtodo = todo[y0:y1, x0:x1]
        wins = sliding_window_view(region, (patch, patch, 3)).squeeze(2)[::stride, ::stride]
        wtodo = sliding_window_view(rtodo, (patch, patch))[::stride, ::stride]
        ok = ~wtodo.any(axis=(2, 3))
        if not ok.any():
            todo[ty - r:ty + r + 1, tx - r:tx + r + 1] = False
            continue

        d = wins - tgt[None, None]
        sq = (d * d).sum(axis=4)                    # 색 차이 제곱
        ssd = np.where(kn[None, None], sq, 0).sum(axis=(2, 3))
        ssd = np.where(ok, ssd, np.inf)
        by, bx = np.unravel_index(int(np.argmin(ssd)), ssd.shape)
        src = wins[by, bx]

        tgt[tmask] = src[tmask]
        todo[ty - r:ty + r + 1, tx - r:tx + r + 1] = False

    return np.clip(out, 0, 255).astype(np.uint8)
