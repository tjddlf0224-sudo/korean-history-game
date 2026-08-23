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

지금 방식:
  워터마크는 흰색을 반투명하게 덮어씌운 것이라

      보이는색 = 원래색 x (1 - a) + 255 x a

  로 쓸 수 있다. 덮인 정도 a는 이미지마다 같으므로 한 번만 재 두면 된다.
  22장의 (밝아진 정도)를 중앙값으로 모아 별 모양 알파를 떠서
  gemini_watermark_alpha.png에 넣어 두었다(값 x1000으로 저장).
  지울 때는 그 자리에 알파를 대고

      원래색 = (보이는색 - 255a) / (1 - a)

  로 되돌린다. 메우는 게 아니라 되돌리는 것이라 밑에 있던 그림이 살아나고,
  알파가 0인 곳(별 바깥)은 한 픽셀도 바뀌지 않는다.

  python3 degemini.py <이미지...>            # 제자리에서 지움(원본은 .orig로 복사)
  python3 degemini.py --check <이미지...>    # 지우지 않고 전/후 비교만 /tmp/dg_*.png
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

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
    a[~support] = 0.0
    return a


def patch_copy(rgb, x0, y0, s, tpl):
    """워터마크 자리를 근처의 깨끗한 자리로 덮는다(배경 그림용).

    배경은 흙·물·기와처럼 무늬가 이어지는 그림이라, 옆자리를 떠다 붙이면
    티가 안 난다. 인물 시트에는 쓰면 안 된다 — 얼굴이나 옷이 잘려 나간다.
    """
    w, h = rgb.size
    arr = np.asarray(rgb).astype(np.float64)
    target = arr[y0:y0 + s, x0:x0 + s]
    # 같은 높이에서 왼쪽으로 여러 후보를 보고, 가장 밋밋한(경계가 적은) 자리를 고른다
    best, best_score = None, None
    for dx in range(int(s * 1.4), int(s * 5), max(8, s // 4)):
        sx = x0 - dx
        if sx < 0:
            break
        cand = arr[y0:y0 + s, sx:sx + s]
        gy, gx = np.gradient(cand.mean(axis=2))
        score = float(np.abs(gx).mean() + np.abs(gy).mean())
        if best_score is None or score < best_score:
            best, best_score = cand, score
    if best is None:
        return None
    # 가장자리를 부드럽게 이어 붙인다
    m = (ndimage.gaussian_filter((tpl > 0).astype(np.float64), 4.0))
    m = np.clip(m / max(m.max(), 1e-6) * 1.8, 0, 1)[..., None]
    arr[y0:y0 + s, x0:x0 + s] = target * (1 - m) + best * m
    return Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))


def process(path, check=False, mode_patch=False):
    name = os.path.basename(path)
    im = Image.open(path)
    mode = im.mode
    rgb = im.convert('RGB')
    w, h = rgb.size
    pos = place(w, h)
    if pos is None:
        print(f'  {name[:46]:48s} 이미지가 작아 자리를 못 잡음 — 그대로 둠')
        return False
    x0, y0, s = pos
    if mode_patch:
        newim = patch_copy(rgb, x0, y0, s, alpha())
        if newim is None:
            print(f'  {name[:46]:48s} 덮을 자리를 못 찾음 — 그대로 둠')
            return False
        if check:
            b = np.asarray(rgb.crop((x0, y0, x0 + s, y0 + s)))
            a2 = np.asarray(newim.crop((x0, y0, x0 + s, y0 + s)))
            cmp = Image.new('RGB', (s * 2 + 6, s), (20, 20, 20))
            cmp.paste(Image.fromarray(b), (0, 0)); cmp.paste(Image.fromarray(a2), (s + 6, 0))
            cmp.resize(((s * 2 + 6) * 3, s * 3), Image.NEAREST) \
               .save(f'/tmp/dg_{os.path.splitext(name)[0][:28]}.png')
            print(f'  {name[:46]:48s} 덮어쓰기 자리 ({x0},{y0})')
            return True
        orig = path + '.orig'
        if not os.path.exists(orig):
            shutil.copy2(path, orig)
        newim.save(path)
        print(f'  {name[:46]:48s} 옆자리로 덮음')
        return True
    patch = np.asarray(rgb.crop((x0, y0, x0 + s, y0 + s))).astype(np.float64)
    # 한 번에 다 못 걷어내는 장이 있다. 되돌린 뒤 남은 만큼을 다시 재서 두 번 돌린다.
    cur, amax = patch, 0.0
    for _ in range(2):
        a = measure_alpha(cur, alpha())
        amax = max(amax, float(a.max()))
        rec = (cur - 255.0 * a[..., None]) / np.maximum(1.0 - a, 0.05)[..., None]
        cur = np.where((a > 0)[..., None], np.clip(rec, 0, 255), cur)
    out = cur.astype('uint8')

    if check:
        before = np.asarray(rgb.crop((x0, y0, x0 + s, y0 + s)))
        cmp = Image.new('RGB', (s * 2 + 6, s), (20, 20, 20))
        cmp.paste(Image.fromarray(before), (0, 0))
        cmp.paste(Image.fromarray(out), (s + 6, 0))
        cmp.resize(((s * 2 + 6) * 3, s * 3), Image.NEAREST) \
           .save(f'/tmp/dg_{os.path.splitext(name)[0][:28]}.png')
        print(f'  {name[:46]:48s} 자리 ({x0},{y0}) · 최대 a={amax:.2f}')
        return True

    rgb.paste(Image.fromarray(out), (x0, y0))
    if mode == 'RGBA':                    # 투명도는 그대로 살린다
        rgb = Image.merge('RGBA', rgb.split() + (im.split()[3],))
    orig = path + '.orig'
    if not os.path.exists(orig):
        shutil.copy2(path, orig)
    rgb.save(path)
    print(f'  {name[:46]:48s} 워터마크 되돌림 · 최대 a={amax:.2f}')
    return True


def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    check = '--check' in sys.argv[1:]
    # 배경 그림은 옆자리를 복사해 덮는 편이 확실하다(--patch).
    # 인물 시트는 덮으면 인물이 잘리므로 되돌리기(기본)를 쓴다.
    mp = '--patch' in sys.argv[1:]
    if not args:
        print(__doc__)
        return 1
    print(f'{len(args)}장 {"확인" if check else "처리"} ({"옆자리 덮기" if mp else "되돌리기"})')
    n = sum(process(p, check, mp) for p in args)
    print(f'{n}/{len(args)}장 처리.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
