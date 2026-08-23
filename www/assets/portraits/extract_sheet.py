#!/usr/bin/env python3
"""마젠타 그리드 시트 → 낱장 투명 PNG (v5 알고리즘 + 시트 목록 내장).

crop_and_key_v5.py는 시트 하나마다 SRC/COLS/ROWS/LABELS를 손으로 고쳐야 했다.
앞으로 찍을 시트가 18장이라 그 방식은 반드시 어긋난다. 시트별 격자와 이름을
아래 SHEETS에 미리 적어 두고, 쓸 때는 파일과 키만 준다.

  python3 extract_sheet.py ~/Downloads/Gemini_....png sheet1   # 한 장
  python3 extract_sheet.py --all ~/Downloads                    # 다섯 장 한꺼번에

--all은 폴더에서 sheet1~sheet5로 시작하는 파일을 찾아 순서대로 처리한다.
다섯 장을 다 받은 뒤 이름만 sheet1.png … sheet5.png로 바꿔 두고 한 번 돌리면
70명이 같은 조건으로 한꺼번에 잘려 나온다.

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
    # 5열 3행 15명 고정. 이미 게임에 들어간 48명이 같은 조건(5x3 마젠타 시트)에서
    # 나왔다. 시트마다 조건을 바꾸면 인물끼리 밝기가 어긋난다 — 노산군을 혼자
    # 크게 뽑았다가 밝기가 153으로 튀어(나머지는 60~98) 다시 뽑은 적이 있다.
    'sheet1': (5, 3, [
        'gusukgi', 'sinseokgi', 'cheongdonggi', 'dangun', 'gwanggaeto',
        'muryeong', 'jinheung', 'hwarang', 'jangbogo', 'uisang',
        'balhae', 'minjeong', 'gyeonhwon', 'gungye', 'choechiwon']),
    'sheet2': (5, 3, [
        'wanggeon', 'gwangjong', 'choeseungno', 'seohui', 'yungwan',
        'choechunghyeon', 'sambyeolcho', 'uicheon', 'jinul', 'igyubo',
        'gongmin', 'gwanghae', 'injo', 'hullyeon', 'daedong']),
    'sheet3': (5, 3, [
        'jeongjo', 'jeongyagyong', 'bakjega', 'hongdaeyong', 'gimhongdo',
        'samjeong', 'hongyeong', 'imsul', 'choeje', 'choeikhyeon',
        'sinheon', 'gaehwa', 'jeonbongjun', 'jipgang', 'gungug']),
    'sheet4': (5, 3, [
        'eulmi', 'gojong', 'seojaepil', 'maeil', 'sinminhoe',
        'jeongmi', 'mudan', 'samil', 'bakeunsik', 'gwangbokhoe',
        'mulsan', 'eohakhoe', 'singanhoe', 'uiyeoldan', 'cheongsanri']),
    # 시트5는 10명이라 제미나이가 5열 2행으로 그려 왔다. 실제로 받은 대로 맞춘다.
    'sheet5': (5, 2, [
        'yeounhyeong', 'sintak', 'yukio', 'jeju', 'nongji',
        'sasaoip', 'yusin', 'gwangju', 'yuwol', 'tongil']),
    # '마지막 칸을 비워 두라'고 했지만 제미나이가 무시하고 15칸을 다 채웠다.
    # 13번 자리에 중복 인물을 하나씩 그려 넣어 뒤가 한 칸씩 밀렸다.
    # 실제로 받은 그림에 맞춰 13번을 건너뛴다(None).
    'sheet6': (5, 3, [
        'suro', 'ureuk', 'cheolsang', 'wae', 'gyebaek',
        'gwanchang', 'gimyusin', 'munmu', 'sinmun', 'jeonsigwa',
        'songsang', 'arabsang', None, 'jujeon', 'yisunsin']),
    'sheet7': (5, 3, [
        'gwakjaeu', 'gimsimin', 'gwonyul', 'johun', 'nongae',
        'hanil', 'veteran', 'saemaul', 'olympic', 'gimdaejung',
        'seollal', 'dano', None, 'chuseok', 'dongji']),
    # 6화 확장(통신사 보고)과 임진왜란 무대 분할(신립·행주 아낙)에서
    # 새로 필요해진 사람들. 5x2로 두고 마지막 칸은 비워 로고를 피한다.
    'sheet8': (5, 2, [
        'seonjo', 'hwangyungil', 'gimseongil', 'jeongcheol', 'gunjol',
        'sinrip', 'haengju_yeoin', 'useen', None, None]),
    # 단일맵→2~3맵 확장 작업에서 새로 필요해진 사람들을 모아 5x3 한 장으로.
    # (묘청·김부식·석공: 고려2화/후기1화 / 근초고왕·성왕: 고대1화 /
    #  대조영·문왕: 고대4화 / 신숭겸·경순왕: 고대5화 / 유형원·이익: 후기3화)
    # 인원이 적을 때마다 낱장·소수 그리드로 따로 뽑으면 화질·명도가 튀어서
    # (3명 이하 그리드는 유독 선명하게 나오는 경향) 5x3 15칸으로 통일한다.
    # 다음에 또 몇 명 추가될 때는 이 시트의 빈 칸(11~15)부터 채울 것 —
    # 새 sheet13 같은 걸 만들지 말 것.
    'sheet9': (5, 3, [
        'myocheong', 'gimbusik', 'seokgong', 'geunchogo', 'seongwang',
        'daejoyeong', 'munwang', 'sinsunggyeom', 'gyeongsunwang', 'yuhyeongwon',
        'iik', 'yangheonsu', 'eojaeyeon', 'uibyeongbu', 'anchangho']),
    # gimgu·yunbonggil는 뺐다 — ilje_ch7.html에 이미 있는 사람들이고 초상도
    # 이미 있음(일제 2화 한인애국단 콘텐츠가 중복이라 국민대표회의로 교체됨).
    # 다음 몇 명이 필요해지면 여기(sheet10) 빈 칸부터 채울 것.
    'sheet10': (5, 3, [
        'sinchaeho', 'yugwansun', 'siwon1', 'siwon2', None,
        None, None, None, None, None,
        None, None, None, None, None]),
}


MARGIN = 11   # 셀 사이 격자선을 크롭 밖으로 밀어내는 여백
PAD = 8       # 최종 출력에 남길 여백
SS = 4        # 슈퍼샘플 배율
THRESH = 110  # 확대본에서의 배경 거리 임계값


def measure_bg(arr):
    """네 모서리 8x8 중앙값 — 배경이 (255,0,255)라는 가정을 하지 않는다."""
    c = [arr[:8, :8], arr[:8, -8:], arr[-8:, :8], arr[-8:, -8:]]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in c]), axis=0)


def despill(rgb, a, bg):
    """테두리에 남은 배경색 기운을 걷어낸다.

    가장자리 픽셀은 인물색과 배경 마젠타가 섞인 값이라, 잘라내고 나면 분홍
    테두리로 남는다. 실루엣 가장자리 몇 픽셀 안에서만, 초록보다 튀어나온
    빨강·파랑(=마젠타 성분)을 깎는다. 옷 안쪽은 건드리지 않으므로 자주색
    관복 같은 색은 그대로 살아 있는다.
    """
    if bg[1] >= min(bg[0], bg[2]):     # 배경이 마젠타 계열이 아니면 손대지 않는다
        return rgb
    solid = ndimage.binary_erosion(a > 0.8, np.ones((3, 3)), iterations=3)
    band = (a > 0.02) & ~solid
    if not band.any():
        return rgb
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = np.clip((r + b) / 2.0 - g, 0, None)     # 마젠타 성분
    k = 0.9 * band
    out = rgb.copy()
    out[..., 0] = np.clip(r - k * m, 0, 255)
    out[..., 2] = np.clip(b - k * m, 0, 255)
    return out


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

    rgb = despill(rgb, a_s, bg)
    rgba = np.dstack([rgb, a_s * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')

    bb = im.getbbox()
    if not bb:
        return None
    im = im.crop((max(0, bb[0] - PAD), max(0, bb[1] - PAD),
                  min(w0, bb[2] + PAD), min(h0, bb[3] + PAD)))
    im.save(out)
    return im.size


def run(src, key):
    assert key in SHEETS, f'모르는 시트 키: {key}'
    cols, rows, labels = SHEETS[key]
    im = Image.open(os.path.expanduser(src)).convert('RGB')
    W, H = im.size
    cw, ch = W / cols, H / rows
    print(f'{key}: {os.path.basename(src)} {W}x{H} → {cols}열x{rows}행, 칸 {int(cw)}x{int(ch)}')
    if ch < 500:
        print(f'  ※ 칸 높이 {int(ch)}px — 인물이 {int(ch*0.8)}px 남짓으로 나온다.'
              ' 게임 화면에서 필요한 건 420px쯤이니, 너무 작으면 시트를 다시 받는 게 낫다.')
    done = 0
    for i, name in enumerate(labels):
        if not name:
            continue
        col, row = i % cols, i // cols
        box = (int(col * cw) + MARGIN, int(row * ch) + MARGIN,
               int((col + 1) * cw) - MARGIN, int((row + 1) * ch) - MARGIN)
        size = extract(im.crop(box), os.path.join(HERE, name + '.png'))
        print(f'  {name+".png":24s} {"실패 - 칸이 비었나?" if not size else f"{size[0]}x{size[1]}"}')
        done += 1 if size else 0
    return done


def find_sheets(folder):
    """폴더에서 sheet1~sheet5로 시작하는 파일을 키 순서대로 짝지어 준다."""
    folder = os.path.expanduser(folder)
    out = []
    for key in SHEETS:
        hit = sorted(f for f in os.listdir(folder)
                     if f.lower().startswith(key) and f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
        if hit:
            out.append((os.path.join(folder, hit[0]), key))
        else:
            print(f'  (없음) {key} — 파일 이름을 {key}.png로 바꿔 두면 잡힌다')
    return out


def main():
    args = sys.argv[1:]
    if args and args[0] == '--all':
        folder = args[1] if len(args) > 1 else os.path.expanduser('~/Downloads')
        pairs = find_sheets(folder)
        if not pairs:
            print('처리할 시트가 없다.')
            return 1
        total = sum(run(src, key) for src, key in pairs)
        print(f'\n{len(pairs)}장에서 {total}명 추출 완료.')
        print('확인: python3 assets/tools/check_all.py')
        return 0

    if len(args) < 2:
        print('사용법: python3 extract_sheet.py <시트.png> <시트키>')
        print('        python3 extract_sheet.py --all <폴더>   (기본 ~/Downloads)\n')
        print('등록된 시트:')
        for k, (c, r, names) in SHEETS.items():
            live = [n for n in names if n]
            print(f'  {k:9s} {c}열x{r}행  {len(live)}명  {", ".join(live)}')
        return 1

    run(args[0], args[1])
    return 0


if __name__ == '__main__':
    sys.exit(main())
