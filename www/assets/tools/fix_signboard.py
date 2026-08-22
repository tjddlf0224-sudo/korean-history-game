#!/usr/bin/env python3
"""배경 그림 속 현판(간판)의 한자를 지우고 올바른 글자로 다시 그린다.

배경 이유: 제미나이가 만든 지방 고을 배경(ch4_jibang_goeul.png)의 향청 현판
글자가 뭉개져서, 셋째 글자 所만 맞고 앞의 留鄕은 실제로 존재하지 않는 획
조합이었다. 태극기 괘 배치 때와 같은 교훈 — AI 이미지 생성은 정확한 기호
(한자·괘 등)에 근본적으로 취약하므로, 벤더를 바꿔가며 재시도하지 말고
코드로 직접 그려서 덮는 게 정답이다.

지우는 방식: 현판 안쪽 패널에서 '밝은 픽셀(나무 바탕)'만 모아 열별 중앙값을
구한 뒤, 어두운 픽셀(글씨)을 그 색으로 채운다 — 단색으로 뭉개지 않고 원래
패널의 좌우 밝기 그라데이션을 유지하기 위함.

사용법:
    python3 fix_signboard.py <이미지> --panel x0 y0 x1 y1 --text 留鄕所
"""
import argparse

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = '/System/Library/Fonts/Supplemental/AppleMyungjo.ttf'  # 한국식 명조(한자 전통자형)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('--panel', nargs=4, type=int, required=True,
                    help='현판 안쪽 패널(글씨가 놓인 밝은 영역) x0 y0 x1 y1')
    ap.add_argument('--text', required=True)
    ap.add_argument('--dark', type=int, default=120, help='이 밝기 미만이면 글씨로 간주')
    ap.add_argument('--ink', nargs=3, type=int, default=[38, 26, 18])
    ap.add_argument('--scale', type=float, default=0.82, help='글자 높이 / 패널 높이')
    args = ap.parse_args()

    im = Image.open(args.image).convert('RGB')
    x0, y0, x1, y1 = args.panel
    panel = np.array(im.crop((x0, y0, x1, y1))).astype(np.int16)
    h, w, _ = panel.shape

    # 1) 글씨(어두운 픽셀)를 같은 열의 밝은 픽셀 중앙값으로 덮어 지운다.
    bright = panel.mean(axis=2) >= args.dark
    if bright.sum() < w:  # 임계값이 잘못 잡히면 통째로 뭉개지므로 먼저 막는다
        raise SystemExit(f'--dark {args.dark}가 너무 높음: 나무 바탕으로 잡힌 픽셀이 '
                         f'{bright.sum()}개뿐. 패널 밝기 상위값을 보고 낮출 것.')
    fallback = np.median(panel[bright], axis=0)  # 패널 전체의 나무색(글씨 제외)
    for cx in range(w):
        col_ok = panel[bright[:, cx], cx]
        if len(col_ok) < 3:  # 그 열이 거의 글씨뿐이면 이웃 열들로 대체
            lo, hi = max(0, cx - 3), min(w, cx + 4)
            nb = panel[:, lo:hi][bright[:, lo:hi]]
            col_ok = nb if len(nb) >= 3 else fallback[None, :]
        panel[~bright[:, cx], cx] = np.median(col_ok, axis=0)

    im.paste(Image.fromarray(panel.astype(np.uint8), 'RGB'), (x0, y0))

    # 2) 글자를 크게 그린 뒤 축소해서 붙인다(작은 픽셀 크기로 바로 그리면
    #    획이 뭉개져서, 8배로 그린 후 LANCZOS 축소하는 편이 훨씬 선명하다).
    n = len(args.text)
    cell_w, cell_h = (x1 - x0) / n, (y1 - y0)
    px = max(8, int(cell_h * args.scale))
    SS = 8
    font = ImageFont.truetype(FONT, px * SS)

    layer = Image.new('RGBA', ((x1 - x0) * SS, (y1 - y0) * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i, ch in enumerate(args.text):
        bb = d.textbbox((0, 0), ch, font=font)
        cw, chh = bb[2] - bb[0], bb[3] - bb[1]
        cx = (i + 0.5) * cell_w * SS - cw / 2 - bb[0]
        cy = (y1 - y0) * SS / 2 - chh / 2 - bb[1]
        d.text((cx, cy), ch, font=font, fill=tuple(args.ink) + (238,))

    layer = layer.resize((x1 - x0, y1 - y0), Image.LANCZOS)
    im.paste(layer, (x0, y0), layer)
    im.save(args.image)
    print(f'{args.image}: 현판 "{args.text}" 다시 그림 (panel={args.panel}, {px}px)')


if __name__ == '__main__':
    main()
