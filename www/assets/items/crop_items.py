#!/usr/bin/env python3
"""유물 도감 아이콘 시트를 잘라 items.js의 id 이름으로 저장한다.

제미나이가 시트마다 다른 격자를 그려 놓아서(4x4를 요구했는데 6x3으로 그리고
한글 이름표까지 박은 것도 있다) 시트별로 격자와 라벨 높이를 따로 적어 둔다.
이름표는 칸 아래에 붙어 있어 아래 일정 비율을 버리면 그림이 온전히 남는다.

  python3 crop_items.py                # 다운로드 폴더의 시트 4장을 전부 처리
  python3 crop_items.py --dry          # 자르지 않고 매핑만 확인

배경 제거는 crop_player.py의 key_out과 같은 방식이다(마젠타/초록 크로마키 +
경계 침식 + 번짐 억제). 여기서는 유물이 칸을 크게 채우므로 PAD를 작게 준다.
"""
import argparse
import os
import unicodedata
from PIL import Image
import numpy as np

DL = os.path.expanduser('~/Downloads')
OUT = os.path.dirname(os.path.abspath(__file__))

BGS = {
    'magenta': {'key': np.array([246, 26, 246]), 'thresh': 95},
    'green':   {'key': np.array([26, 246, 26]),  'thresh': 95},
}

# id는 items.js의 키와 같아야 한다. None은 버리는 칸
# (제미나이가 지어낸 유물, 중복, 비우라고 한 칸).
SHEETS = [
    {
        'file': '보충시트_고려_조선19종.png', 'bg': 'magenta',
        'cols': 5, 'rows': 4, 'label': 0.0,
        'ids': [
            'ibulbyeongjwasang', 'hunyo10jo', 'simu28jo', 'geonwonjungbo', 'eunbyeong',
            'sanggamcheongja', 'palmandaejanggyeong', 'samguksagi', 'samgukyusa', 'jikji',
            'hwatongdogam', 'joseongyeongukjeon', 'honilgangni', 'gyemija', 'hunminjeongeum',
            'angbuilgu', 'cheugugi', 'sosuseowon', 'cheokhwabi', None,
        ],
    },
    {
        'file': '유물시트1_선사_고대.png', 'bg': 'magenta',
        'cols': 6, 'rows': 3, 'label': 0.18,
        'ids': [
            'jumeokdokki', 'bitsalmunui', 'bandal', 'bipahyeong', None, None,
            'misongni', 'chiljido', 'gwanggaetobi', 'jinheungbi', 'geumdongdaehyangno', 'deongiswe',
            'manpasikjeok', 'sesogogye', 'pangapot', 'gayageum', 'mugujeonggwang', 'cheonghaejin',
        ],
    },
    {
        'file': '유물시트3_조선전기말_조선후기.png', 'bg': 'magenta',
        'cols': 4, 'rows': 4, 'label': 0.0,
        # 측우기·소수서원 편액은 보충 시트 쪽이 옳아서 여기서는 버린다
        'ids': [
            None, 'nongsajikseol', 'jagyeongnu', 'mongyudowondo',
            'gyeongguktaejeon', 'baekja', None, 'geobukseon',
            'nanjungilgi', 'bigyeokjincheolloe', 'samjeondobi', 'sangpyeongtongbo',
            'donguibogam', 'daedongyeojido', 'mongminsimseo', 'geojunggi',
        ],
    },
    {
        'file': '유물시트4_개항기_현대.png', 'bg': 'green',
        'cols': 6, 'rows': 3, 'label': 0.18, 'label_rows': [1, 2],
        # 척화비 탁본은 보충 시트 쪽이 옳다. 의궤·국새 중복은 하나씩만.
        'ids': [
            'jeonggamnok', None, 'sujagi', 'oegyujanggak', None, 'daehanguksae',
            'dongnipsinmun', None, 'gimiseoneon', 'taegeukgi', 'joseoneohakhoe', 'geumbuchi',
            'jeheonheonbeop', 'uiyeoldan', 'haninaegukdan', 'nongjigaehyeok', 'sailgu', 'yugilo',
        ],
    },
]


def key_out(crop, bg):
    conf = BGS[bg]
    arr = np.array(crop).astype(np.int16)
    dist = np.sqrt(((arr - conf['key']) ** 2).sum(axis=-1))
    is_fg = dist >= conf['thresh']
    for _ in range(2):
        e = is_fg.copy()
        e[1:, :] &= is_fg[:-1, :]; e[:-1, :] &= is_fg[1:, :]
        e[:, 1:] &= is_fg[:, :-1]; e[:, :-1] &= is_fg[:, 1:]
        is_fg = e
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    if bg == 'magenta':
        excess = np.clip((r + b) / 2 - g, 0, None)
        arr[..., 0] = np.clip(r - excess, 0, 255)
        arr[..., 2] = np.clip(b - excess, 0, 255)
    else:
        excess = np.clip(g - np.maximum(r, b), 0, None)
        arr[..., 1] = np.clip(g - excess, 0, 255)
    rgba = np.dstack([arr.astype(np.uint8), np.full(arr.shape[:2], 255, np.uint8)])
    rgba[..., 3] = np.where(is_fg, 255, 0)
    return Image.fromarray(rgba, 'RGBA')


def trim(img):
    """투명 여백을 잘라내고 정사각형 캔버스 가운데에 놓는다.
    칸마다 유물 크기가 제각각이라, 이 과정을 거쳐야 도감에서 나란히 놓았을 때
    크기가 들쭉날쭉해 보이지 않는다."""
    a = np.array(img)[..., 3]
    ys, xs = np.where(a > 0)
    if len(ys) == 0:
        return None
    img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(img.size) * 1.08)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((160, 160), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    files = {unicodedata.normalize('NFC', f): f for f in os.listdir(DL)}
    made = 0
    for sh in SHEETS:
        src = files.get(sh['file'])
        if not src:
            print(f"! 없음: {sh['file']}")
            continue
        im = Image.open(os.path.join(DL, src)).convert('RGB')
        W, H = im.size
        cw, chh = W / sh['cols'], H / sh['rows']
        pad = int(min(cw, chh) * 0.045)
        print(f"\n{sh['file']}  {sh['cols']}x{sh['rows']}")
        for i, iid in enumerate(sh['ids']):
            if not iid:
                continue
            r, c = divmod(i, sh['cols'])
            # 이름표가 있는 행만 아래를 버린다(시트4는 1행에 이름표가 없다)
            lab = sh['label'] if ('label_rows' not in sh or r in sh['label_rows']) else 0.0
            box = (int(c * cw) + pad, int(r * chh) + pad,
                   int((c + 1) * cw) - pad, int((r + 1) * chh) - pad - int(chh * lab))
            out = trim(key_out(im.crop(box), sh['bg']))
            if out is None:
                print(f'  ! {iid}: 전경 없음'); continue
            if not a.dry:
                out.save(os.path.join(OUT, f'{iid}.png'))
            made += 1
            print(f'  {iid}')
    print(f'\n{made}개 {"확인" if a.dry else "저장"}')


if __name__ == '__main__':
    main()
