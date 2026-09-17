# -*- coding: utf-8 -*-
"""2026-09-17 새 인물·유물 시트 자르기.

- 로고: 우하단 고정 자리에서 '밝게 뜬 회백색' 화소만 골라 둘레에서 번져 메운다.
- 인물: 마젠타 키 → 덩어리 묶기 → 좌→우(위→아래) 순서로 이름 붙이기 → 높이 312.
- 유물: 4×4 칸 안쪽만(격자선·영어 글자 제외) 잘라 160×160.
"""
import os
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

# 원본 시트는 프로젝트의 _source_art/에 둔다(다운로드 폴더는 정리되면 사라진다).
DL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '_source_art') + '/'
OUT_P = '/Users/yunsismac/Korean-History-Game/www/assets/portraits/'
OUT_I = '/Users/yunsismac/Korean-History-Game/www/assets/items/'


def diffuse_fill(a, m, it=400):
    """m(참) 자리를 둘레 값으로 번져 메운다(라플라스 풀이)."""
    a = a.copy()
    a[m] = 0
    known = ~m
    for _ in range(it):
        s = np.zeros_like(a)
        n = np.zeros(m.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            s += np.roll(a, (dy, dx), (0, 1))
            n += np.roll(np.ones(m.shape), (dy, dx), (0, 1))
        a[m] = (s / n[..., None])[m]
        a[known] = a[known]
    return a


def star_template(R=28.5, p=0.7, size=72):
    """제미나이 로고(네 갈래 반짝이) 모양. 중심은 우하단에서 (120,120)."""
    yy, xx = np.mgrid[-size // 2:size // 2, -size // 2:size // 2] + .5
    v = (np.abs(xx) / R) ** p + (np.abs(yy) / R) ** p
    return np.clip((1.0 - v) * 6, 0, 1)   # 가장자리 한두 화소만 부드럽게


def remove_logo(im, debug=None, A_list=(0.27,)):
    """로고는 흰색을 일정 비율로 얹은 것 → 그 비율을 거꾸로 빼낸다(언블렌드).
    비율 A는 로고 테두리가 가장 안 보이는 값을 고른다."""
    a = np.array(im.convert('RGB')).astype(float)
    H, W, _ = a.shape
    T = star_template()
    S = T.shape[0]
    cy, cx = H - 120, W - 120
    y0, x0 = cy - S // 2, cx - S // 2
    sub = a[y0:y0 + S, x0:x0 + S]
    edge = (T > 0) & (T < 1) | (ndimage.binary_dilation(T > 0, iterations=2) & (T == 0))
    best = None
    for A in A_list:
        al = (A * T)[..., None]
        fix = np.clip((sub - 255 * al) / (1 - al), 0, 255)
        g = np.abs(np.diff(fix, axis=0)).sum(-1)[:, :-1] + np.abs(np.diff(fix, axis=1)).sum(-1)[:-1, :]
        score = g[edge[:-1, :-1]].sum()
        if best is None or score < best[0]:
            best = (score, A, fix)
    a[y0:y0 + S, x0:x0 + S] = best[2]
    out = Image.fromarray(a.astype(np.uint8))
    if debug:
        c = (W - 260, H - 230, W, H)
        im.convert('RGB').crop(c).resize((520, 460)).save(debug + '_before.png')
        out.crop(c).resize((520, 460)).save(debug + '_after.png')
    return out, round(float(best[1]), 2)


def key_rgba(im, bg=None, thresh=95):
    a = np.array(im.convert('RGB')).astype(float)
    if bg is None:
        c = [a[:8, :8], a[:8, -8:], a[-8:, :8], a[-8:, -8:]]
        bg = np.median(np.concatenate([p.reshape(-1, 3) for p in c]), axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(-1))
    mask = dist >= thresh
    return a, mask, bg


def fill_holes_not_bg(m, a, bg, lo=45):
    """막힌 틈 가운데 배경색(마젠타)이 아닌 곳만 채운다."""
    holes = ndimage.binary_fill_holes(m) & ~m
    far = np.sqrt(((a - bg) ** 2).sum(-1)) >= lo
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pink = (g < r * .8) & (g < b * .8) & (b > r * .5)
    return m | (holes & far & ~pink)


def defringe(rgb, alpha):
    """배경에 닿은 테두리의 마젠타 기운만 걷는다."""
    near = np.array(Image.fromarray(((alpha < 250) * 255).astype(np.uint8))
                    .filter(ImageFilter.MaxFilter(7))) > 0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    pink = near & (g < r * .78) & (g < b * .78) & (b > r * .55)
    ex = np.clip((r + b) / 2 - g, 0, None)
    rgb = rgb.copy()
    rgb[..., 0] = np.where(pink, np.clip(r - ex, 0, 255), r)
    rgb[..., 2] = np.where(pink, np.clip(b - ex, 0, 255), b)
    return rgb


def figures(im, names, order='row', min_area=3000):
    a, mask, bg = key_rgba(im)
    mask = ndimage.binary_opening(mask, iterations=1)
    grp = ndimage.binary_dilation(mask, iterations=14)
    lab, n = ndimage.label(grp)
    objs = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = (mask[sl] & (lab[sl] == i + 1)).sum()
        if area >= min_area:
            objs.append((sl, i + 1, area))
    if len(objs) != len(names):
        print('!! 덩어리 수', len(objs), '≠ 이름 수', len(names), [o[2] for o in objs])
        sys.exit(1)
    if order == 'row':
        objs.sort(key=lambda o: o[0][1].start)
    else:  # 2×2: 위→아래, 좌→우
        objs.sort(key=lambda o: (o[0][0].start // 300, o[0][1].start))
    for (sl, idx, _), name in zip(objs, names):
        m = mask & (lab == idx)
        m = fill_holes_not_bg(m, a, bg)
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgb = a[y0:y1, x0:x1]
        al = m[y0:y1, x0:x1].astype(np.uint8) * 255
        al = np.array(Image.fromarray(al).filter(ImageFilter.MinFilter(3))
                      .filter(ImageFilter.GaussianBlur(.5))).astype(float)
        rgb = defringe(rgb, al)
        out = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8), 'RGBA')
        h = 312
        w = round(out.width * h / out.height)
        out = out.resize((w, h), Image.LANCZOS)
        pad = Image.new('RGBA', (w + 8, h + 3), (0, 0, 0, 0))
        pad.alpha_composite(out, (4, 0))
        pad.save(OUT_P + name + '.png')
        print(f'{name:18s} {pad.size}')


def relics(im, names):
    """4×4. 칸 안 위쪽 약 80%만(아래 영어 글자 띠 제외)."""
    a = np.array(im.convert('RGB')).astype(float)
    H, W = a.shape[:2]
    cw, ch = W / 4, H / 4
    for i, name in enumerate(names):
        if name is None:
            continue
        c, r = i % 4, i // 4
        X0, X1 = int(c * cw) + 8, int((c + 1) * cw) - 8
        Y0, Y1 = int(r * ch) + 8, int(r * ch + ch * .865)
        X0, Y0 = X0 + 6, Y0 + 6
        cellarr = a[Y0:Y1, X0:X1]
        bg = np.median(np.concatenate([cellarr[:6, :6].reshape(-1, 3), cellarr[:6, -6:].reshape(-1, 3)]), axis=0)
        m = np.sqrt(((cellarr - bg) ** 2).sum(-1)) >= 120
        lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=4))
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        keep = np.isin(lab, [k + 1 for k, s in enumerate(sizes) if s > sizes.max() * .05])
        # 칸 가장자리에 닿은 조각(격자선·글자 윗부분)은 버린다
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        small_edge = [k for k in edge if sizes[k - 1] < sizes.max() * .3]
        keep &= ~np.isin(lab, small_edge)
        m = fill_holes_not_bg(m & keep, cellarr, bg)
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgb = cellarr[y0:y1, x0:x1]
        al = m[y0:y1, x0:x1].astype(np.uint8) * 255
        al = np.array(Image.fromarray(al).filter(ImageFilter.MinFilter(3))
                      .filter(ImageFilter.GaussianBlur(.5))).astype(float)
        rgb = defringe(rgb, al)
        obj = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8), 'RGBA')
        s = 144 / max(obj.size)
        obj = obj.resize((max(1, round(obj.width * s)), max(1, round(obj.height * s))), Image.LANCZOS)
        cell = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
        cell.alpha_composite(obj, ((160 - obj.width) // 2, (160 - obj.height) // 2))
        cell.save(OUT_I + name + '.png')
        print(f'{name:18s} 원본 {x1-x0}×{y1-y0}')


if __name__ == '__main__':
    def load(tag):
        im, _ = remove_logo(Image.open(DL + 'Gemini_Generated_Image_' + tag + '.png'))
        return im
    # 시트 A (2×2): 변한 사람은 칼 때문에 보류 → 잘라만 두고 이름에 _hold
    import os
    if os.environ.get('ONLY') != 'relic':
      figures(load('h07tb5h07tb5h07t'),
            ['byeonhan_hold', 'seondeok_f', 'jongjangin', 'goryeo_yeoin'], order='grid')
      figures(load('k9umy4k9umy4k9um'), ['saimdang', 'gwangjak', 'bobusang', 'sijeon'])
      figures(load('mil9aamil9aamil9'), ['yugiljun', 'sindolseok_hold', 'hwangseong_gija', 'ihoeyeong'])
    relics(load('979edy979edy979e'), [
        'sehyeongdonggeom', 'dahori_but', 'houmyeong', 'yeonga7',
        None, 'jeokseongbi', 'sangwonsajong', 'balhae_seokdeung',
        'balhae_saja', None, 'suncheongja', 'gonyeo',
        'chochungdo', 'sokdaejeon', 'daejeontongpyeon', 'hwangseong'])
