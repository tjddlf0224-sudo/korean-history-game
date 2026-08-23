#!/usr/bin/env python3
"""제미나이 워터마크(우하단 반짝임)만 딱 지우고 원래 색으로 되돌린다.

앞선 시도들이 왜 틀렸는지 적어 둔다. 다시 같은 길로 들어서지 않기 위해서다.
  · remove_watermark.py — 깨끗한 다른 자리를 복사해 덮었다. 배경에는 되지만
    NPC 시트에서는 워터마크가 맨 오른쪽 아래 칸 인물 위에 얹혀서, 복사해 오면
    인물이 잘려 나간다.
  · 자리를 통째로 라플라스로 메우기 — 옆에 있던 두루마리와 옷 주름까지 같이
    사라졌다. 지우는 게 아니라 뭉개는 것이었다.
  · 밝은 픽셀 찾아 지우기 — 흰 옷, 종이, 태극기까지 워터마크로 오인했다.
  · 이미지 크기 대비 '비율' 위치로 찾기 — 이게 결정적인 착각이었다. 워터마크는
    비율이 아니라 **오른쪽 아래 모서리에서 고정 픽셀만큼 떨어진 자리**에 찍힌다.
    가로세로 비가 다른 이미지들(1376x768 / 1046x1024 / 1328x800)을 같은 비율로
    보다 보니 매번 다른 데를 짚었다.

지금 방식 — 그림 종류에 따라 둘로 나눈다.

  [인물 시트]  --sheet   되돌리기
    워터마크는 흰색을 반투명하게 덮어씌운 것이라
        보이는색 = 원래색 x (1 - a) + 255 x a
    로 쓸 수 있다. 자리 안쪽을 도려내고 테두리에서 번지게 채워 '원래 밝기'를
    가늠한 뒤 a를 재고, 식을 뒤집어 원래색을 되돌린다. 밑에 있던 그림이
    그대로 살아나므로 인물에는 이게 맞다. 두 번 돌린다.
    재는 a는 템플릿의 1.8배를 넘지 못하게 막는다 — 두루마리처럼 밝은 소품
    위에서는 '원래 밝기' 추정이 어두워져 a가 튀고, 그대로 되돌리면 종이가
    누렇게 뜬다.

  [배경 그림]  기본       본떠 메우기 (inpaint.py)
    배경은 밑그림을 되살리는 것보다 무늬가 이어지는 게 중요하다. 구멍
    테두리에서부터 한 조각씩, 같은 그림 안에서 가장 비슷한 조각을 찾아
    붙인다. 울타리 살과 기와 줄이 끊기지 않고 이어진다.
    인물에 쓰면 안 된다 — 손이나 책 같은 소품을 끌어와 붙인다.

  자리는 '오른쪽 아래 모서리에서 (128, 117)픽셀'로 고정이다. 이미지 크기
  대비 비율이 아니다. 모양과 진하기는 gemini_watermark_alpha.png에 떠 두었다
  (22장의 밝아진 정도를 중앙값으로 모은 것, 값 x1000으로 저장).

  python3 degemini.py <이미지...>            # 제자리에서 지움(원본은 .orig로 복사)
  python3 degemini.py --check <이미지...>    # 지우지 않고 전/후 비교만 /tmp/dg_*.png
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import inpaint

# 오른쪽 아래 모서리에서 이만큼 떨어진 곳이 워터마크 중심(픽셀 고정).
OFF_X, OFF_Y = 128, 117
ALPHA_PNG = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         'gemini_watermark_alpha.png')
_alpha = None


def alpha():
    global _alpha
    if _alpha is None:
        _alpha = np.asarray(Image.open(ALPHA_PNG).convert('L')).astype(np.float64) / 1000.0
    return _alpha


def place(w, h):
    """알파를 놓을 자리. 이미지가 작아 자리가 안 나오면 None."""
    a = alpha()
    s = a.shape[0]
    x0, y0 = w - OFF_X - s // 2, h - OFF_Y - s // 2
    if x0 < 0 or y0 < 0 or x0 + s > w or y0 + s > h:
        return None
    return x0, y0, s


def smooth_fill(L, hole, iters=700):
    """구멍 안쪽을 테두리 값에서 번지게 채운다 — 워터마크가 없었다면 이랬을 밝기."""
    out = L.astype(np.float64).copy()
    edge = ndimage.binary_dilation(hole, np.ones((3, 3))) & ~hole
    out[hole] = out[edge].mean() if edge.any() else out.mean()
    for _ in range(iters):
        nb = np.zeros_like(out)
        nb[1:-1, 1:-1] = (out[:-2, 1:-1] + out[2:, 1:-1] + out[1:-1, :-2] + out[1:-1, 2:]) / 4.0
        out[hole] = nb[hole]
    return out


def measure_alpha(patch, tpl):
    """이 장에서 실제로 얼마나 덮였는지를 픽셀마다 잰다.

    템플릿은 '어디까지가 워터마크 자리인가'만 정해 주고, 진하기는 장마다
    직접 잰다. 장마다 워터마크가 얹히는 세기가 조금씩 다르고, 가장자리는
    특히 급하게 옅어져서 고정 템플릿으로는 테두리 잔상이 남는다.

    자리 안쪽 밝기를 지우고 테두리에서 번지게 채워 '원래 밝기'를 가늠한 뒤,
    그보다 밝아진 만큼을 a로 삼는다. 원래 밝은 자리(흰 옷·눈)에서는 a가
    작게 나와 거의 손대지 않는 셈이 된다.
    """
    support = ndimage.binary_dilation(tpl > 0, np.ones((7, 7)))
    L = patch.mean(axis=2)
    clean = smooth_fill(L, support)
    a = (L - clean) / np.maximum(255.0 - clean, 1.0)
    a = np.where(support, np.clip(a, 0.0, 0.75), 0.0)
    a = ndimage.gaussian_filter(a, 0.8)
    # 템플릿보다 지나치게 진하게 재는 것을 막는다. 밝은 소품(두루마리·종이) 위에서는
    # '원래 밝기' 추정이 어두워지는 바람에 a가 튀고, 그대로 되돌리면 종이가 누렇게 뜬다.
    a = np.minimum(a, tpl * 1.8)
    a[~support] = 0.0
    return a


def unblend(patch, passes=2):
    """되돌리기 — 워터마크에 덮인 만큼을 재서 원래 색으로 복원한다(인물용)."""
    cur = patch.astype(np.float64)
    tpl = alpha()
    for _ in range(passes):
        a = measure_alpha(cur, tpl)
        rec = (cur - 255.0 * a[..., None]) / np.maximum(1.0 - a, 0.05)[..., None]
        cur = np.where((a > 0)[..., None], np.clip(rec, 0, 255), cur)
    return cur.astype('uint8')


def process(path, check=False, sheet=False):
    name = os.path.basename(path)
    im = Image.open(path)
    mode = im.mode
    rgb = im.convert('RGB')
    w, h = rgb.size
    pos = place(w, h)
    if pos is None:
        print(f'  {name[:44]:46s} 이미지가 작아 자리를 못 잡음 — 그대로 둠')
        return False
    x0, y0, s = pos

    if sheet:
        before = np.asarray(rgb.crop((x0, y0, x0 + s, y0 + s)))
        after = unblend(before)
        box = (x0, y0)
        how = '되돌리기'
    else:
        # 배경은 무늬가 이어져야 해서 본떠 메운다. 확산으로 채우면 선이 끊기고,
        # 사각형을 통째로 복사하면 엉뚱한 것(울타리 조각·문짝)이 딸려 온다.
        P = 70
        bx = (max(0, x0 - P), max(0, y0 - P), min(w, x0 + s + P), min(h, y0 + s + P))
        before = np.asarray(rgb.crop(bx))
        m = np.zeros(before.shape[:2], bool)
        oy, ox = y0 - bx[1], x0 - bx[0]
        m[oy:oy + s, ox:ox + s] = alpha() > 0.02
        after = inpaint.exemplar_fill(before, m)
        box = bx[:2]
        how = '본떠 메우기'

    if check:
        hh, ww = before.shape[:2]
        cmp = Image.new('RGB', (ww * 2 + 6, hh), (20, 20, 20))
        cmp.paste(Image.fromarray(before), (0, 0))
        cmp.paste(Image.fromarray(after), (ww + 6, 0))
        cmp.save(f'/tmp/dg_{os.path.splitext(name)[0][:28]}.png')
        print(f'  {name[:44]:46s} {how} · /tmp/dg_*.png')
        return True

    rgb.paste(Image.fromarray(after), box)
    if mode == 'RGBA':                    # 투명도는 그대로 살린다
        rgb = Image.merge('RGBA', rgb.split() + (im.split()[3],))
    orig = path + '.orig'
    if not os.path.exists(orig):
        shutil.copy2(path, orig)
    rgb.save(path)
    print(f'  {name[:44]:46s} {how}로 지움')
    return True


def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    check = '--check' in sys.argv[1:]
    sheet = '--sheet' in sys.argv[1:]
    if not args:
        print(__doc__)
        return 1
    print(f'{len(args)}장 {"확인" if check else "처리"} '
          f'({"인물 시트 → 되돌리기" if sheet else "배경 → 본떠 메우기"})')
    n = sum(process(p, check, sheet) for p in args)
    print(f'{n}/{len(args)}장 처리.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
