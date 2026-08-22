#!/usr/bin/env python3
"""마젠타 그리드 시트 → 낱장 투명 PNG (v5 알고리즘 + 시트 목록 내장).

crop_and_key_v5.py는 시트 하나마다 SRC/COLS/ROWS/LABELS를 손으로 고쳐야 했다.
앞으로 찍을 시트가 18장이라 그 방식은 반드시 어긋난다. 시트별 격자와 이름을
아래 SHEETS에 미리 적어 두고, 쓸 때는 파일과 키만 준다.

  python3 extract_sheet.py ~/Downloads/Gemini_....png seonsa1

키를 생략하면 등록된 시트 목록을 보여준다.
이름이 None인 칸은 빈 칸(배경만)이라 건너뛴다.

추출 방식은 v5 그대로다 — 4배 확대 → 마스크 → 프리멀티플라이 → 축소.
침식을 넣거나 순서를 바꾸면 테두리가 계단처럼 각지거나 분홍 테가 낀다.
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))

# 챕터별 시트 구성 — 제미나이_프롬프트.md의 프롬프트와 순서가 정확히 같아야 한다.
SHEETS = {
    'seonsa1':  (2, 2, ['gusukgi', 'sinseokgi', 'cheongdonggi', 'dangun']),
    'godae1':   (2, 2, ['gwanggaeto', 'muryeong', 'jinheung', 'hwarang']),
    'godae2':   (2, 2, ['jangbogo', 'uisang', 'balhae', 'minjeong']),
    'godae3':   (2, 2, ['gyeonhwon', 'gungye', 'choechiwon', None]),
    'goryeo1':  (2, 2, ['wanggeon', 'gwangjong', 'choeseungno', None]),
    'goryeo2':  (2, 2, ['seohui', 'yungwan', 'choechunghyeon', 'sambyeolcho']),
    'goryeo3':  (2, 2, ['uicheon', 'jinul', 'igyubo', 'gongmin']),
    'hugi1':    (2, 2, ['gwanghae', 'injo', 'hullyeon', 'daedong']),
    'hugi2':    (3, 2, ['jeongjo', 'jeongyagyong', 'bakjega', 'hongdaeyong', 'gimhongdo', None]),
    'hugi3':    (2, 2, ['samjeong', 'hongyeong', 'imsul', 'choeje']),
    'gaehang1': (2, 2, ['choeikhyeon', 'sinheon', 'gaehwa', None]),
    'gaehang4': (2, 2, ['jeonbongjun', 'jipgang', 'gungug', 'eulmi']),
    'gaehang5': (3, 2, ['gojong', 'seojaepil', 'maeil', 'sinminhoe', 'jeongmi', None]),
    'ilje1':    (2, 2, ['mudan', 'samil', 'bakeunsik', 'gwangbokhoe']),
    'ilje2':    (3, 2, ['mulsan', 'eohakhoe', 'singanhoe', 'uiyeoldan', 'cheongsanri', None]),
    'hyeondae1': (3, 2, ['yeounhyeong', 'sintak', 'yukio', 'jeju', 'nongji', None]),
    'hyeondae2': (3, 2, ['sasaoip', 'yusin', 'gwangju', 'yuwol', 'tongil', None]),
}

MARGIN = 11   # 셀 사이 격자선을 크롭 밖으로 밀어내는 여백
PAD = 8       # 최종 출력에 남길 여백
SS = 4        # 슈퍼샘플 배율
THRESH = 110  # 확대본에서의 배경 거리 임계값


def measure_bg(arr):
    """네 모서리 8x8 중앙값 — 배경이 (255,0,255)라는 가정을 하지 않는다."""
    c = [arr[:8, :8], arr[:8, -8:], arr[-8:, :8], arr[-8:, -8:]]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in c]), axis=0)


def extract(cell, out):
    w0, h0 = cell.size
    bg = measure_bg(np.array(cell).astype(np.int16))

    big = cell.resize((w0 * SS, h0 * SS), Image.LANCZOS)
    arr = np.array(big).astype(np.float64)
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=2))
    mask = dist > THRESH

    # 가장 큰 덩어리만 남긴다 — 글자나 얼룩이 붙어 나오는 걸 막는다.
    lab, n = ndimage.label(mask)
    if n == 0:
        return None
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    mask = lab == (int(np.argmax(sizes)) + 1)
    mask = ndimage.binary_fill_holes(mask)

    a = mask.astype(np.float64)
    # 마젠타가 테두리로 번지지 않도록 색을 먼저 곱한 뒤 축소한다.
    pm = arr * a[:, :, None]
    pm_s = np.array(Image.fromarray(pm.astype(np.uint8)).resize((w0, h0), Image.LANCZOS)).astype(np.float64)
    a_s = np.array(Image.fromarray((a * 255).astype(np.uint8)).resize((w0, h0), Image.LANCZOS)).astype(np.float64) / 255.0

    keep = a_s > 0.004
    rgb = np.zeros((h0, w0, 3))
    rgb[keep] = np.clip(pm_s[keep] / a_s[keep][:, None], 0, 255)

    rgba = np.dstack([rgb, a_s * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')

    bb = im.getbbox()
    if not bb:
        return None
    im = im.crop((max(0, bb[0] - PAD), max(0, bb[1] - PAD),
                  min(w0, bb[2] + PAD), min(h0, bb[3] + PAD)))
    im.save(out)
    return im.size


def main():
    if len(sys.argv) < 3:
        print('사용법: python3 extract_sheet.py <시트.png> <챕터키>\n')
        print('등록된 시트:')
        for k, (c, r, names) in SHEETS.items():
            live = [n for n in names if n]
            print(f'  {k:11s} {c}열×{r}행  {len(live)}명  {", ".join(live)}')
        return 1

    src, key = sys.argv[1], sys.argv[2]
    assert key in SHEETS, f'모르는 시트 키: {key}'
    cols, rows, labels = SHEETS[key]

    im = Image.open(os.path.expanduser(src)).convert('RGB')
    W, H = im.size
    cw, ch = W / cols, H / rows
    print(f'{key}: {W}×{H} → {cols}열×{rows}행, 칸 크기 {int(cw)}×{int(ch)}')

    for i, name in enumerate(labels):
        if not name:
            continue
        col, row = i % cols, i // cols
        box = (int(col * cw) + MARGIN, int(row * ch) + MARGIN,
               int((col + 1) * cw) - MARGIN, int((row + 1) * ch) - MARGIN)
        out = os.path.join(HERE, name + '.png')
        size = extract(im.crop(box), out)
        print(f'  {name+".png":24s} {"실패 — 칸이 비었나?" if not size else f"{size[0]}×{size[1]}"}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
