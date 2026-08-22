#!/usr/bin/env python3
"""마젠타 시트 → 투명 PNG 추출 (v5: 안티에일리어싱 테두리).

v4까지의 문제: 하드 임계값으로 마스크를 만들고(알파가 0/255 두 값뿐) 거기에
침식까지 2회 돌려서, 테두리가 계단처럼 각지고 우둘투둘하게 깎여 나왔다.
게임에서 88px로 축소해 그리면 이 계단이 그대로 눈에 띈다.

v5 방식 — 슈퍼샘플링 + 프리멀티플라이드 알파:
  1) 셀을 SS배(4배) LANCZOS로 확대한다. 확대하면 경계 픽셀이 부드럽게
     보간되어, 임계값 경계가 원본 기준 '서브픽셀' 위치에 놓인다.
  2) 확대본에서 마스크를 만든다(침식 없음 — 침식이 테두리를 갉아먹던 주범).
  3) 색을 프리멀티플라이(rgb*mask)한 뒤 원래 크기로 축소한다. 알파도 같이
     축소하면 0~255 사이 중간값이 생기면서 진짜 안티에일리어싱이 된다.
  4) 언프리멀티플라이로 색을 복원한다. 프리멀티플라이 없이 그냥 축소하면
     배경 마젠타가 테두리로 번져 분홍 테가 생긴다(그래서 이 순서가 중요).

배경색은 (255,0,255)로 가정하지 않고 네 모서리에서 실측한다 — 이 시트의
실제 배경은 (250,6,243)이었다.
"""
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = '/Users/yunsismac/Downloads/Gemini_Generated_Image_nv18qenv18qenv18.png'
COLS, ROWS = 5, 3
LABELS = [
    'sejong', 'commoner1', 'suyang', 'jangyeongsil', 'jwasu',
    'naesi', 'daewongun', 'gimgu', 'gimokgyun', 'hongyeongsik',
    'muwiyeong_soldier', 'seongjong', 'yiyi', 'yunbonggil',
]

MARGIN = 11   # 셀 사이 격자 테두리선을 크롭 밖으로 밀어내는 여백
PAD = 8       # 최종 출력에 남길 여백
SS = 4        # 슈퍼샘플 배율
THRESH = 110  # 확대본에서의 배경 거리 임계값


def measure_bg(arr):
    """네 모서리 8x8 평균으로 실제 배경색을 잰다."""
    c = [arr[:8, :8], arr[:8, -8:], arr[-8:, :8], arr[-8:, -8:]]
    return np.median(np.concatenate([p.reshape(-1, 3) for p in c]), axis=0)


im = Image.open(SRC).convert('RGB')
W, H = im.size
cw, ch = W / COLS, H / ROWS

for i, name in enumerate(LABELS):
    col, row = i % COLS, i // COLS
    box = (int(col * cw) + MARGIN, int(row * ch) + MARGIN,
           int((col + 1) * cw) - MARGIN, int((row + 1) * ch) - MARGIN)
    cell = im.crop(box)
    w0, h0 = cell.size

    bg = measure_bg(np.array(cell).astype(np.int16))

    # 1) 슈퍼샘플 확대
    big = cell.resize((w0 * SS, h0 * SS), Image.LANCZOS)
    arr = np.array(big).astype(np.float64)

    # 2) 마스크 (침식 없음)
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=-1))
    mask = dist >= THRESH

    # 격자 테두리선 잔여물 제거: 가장 큰 연결요소(=캐릭터)만 남긴다
    labeled, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, labeled, range(1, n + 1))
        mask = labeled == (np.argmax(sizes) + 1)
    # 캐릭터 내부에 뚫린 구멍(배경색과 우연히 비슷한 밝은 부분) 메우기
    mask = ndimage.binary_fill_holes(mask)

    # 마젠타 스필 억제: 살아남은 픽셀에서 R·B가 G보다 높은 초과분을 깎는다
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    excess = np.clip((r + b) / 2 - g, 0, None)
    arr[..., 0] = np.clip(r - excess, 0, 255)
    arr[..., 2] = np.clip(b - excess, 0, 255)

    # 3) 프리멀티플라이 후 축소 (배경색이 테두리로 번지는 것을 막는다)
    a_big = mask.astype(np.float64)
    premult = arr * a_big[..., None]
    pm_small = np.array(Image.fromarray(premult.astype(np.uint8), 'RGB')
                        .resize((w0, h0), Image.LANCZOS)).astype(np.float64)
    a_small = np.array(Image.fromarray((a_big * 255).astype(np.uint8), 'L')
                       .resize((w0, h0), Image.LANCZOS)).astype(np.float64) / 255.0

    # 4) 언프리멀티플라이
    safe = np.maximum(a_small, 1e-4)[..., None]
    rgb = np.clip(pm_small / safe, 0, 255)

    rgba = np.dstack([rgb.astype(np.uint8),
                      (a_small * 255).astype(np.uint8)])

    ys, xs = np.where(a_small > 0.02)
    y0, y1 = max(0, ys.min() - PAD), min(h0, ys.max() + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w0, xs.max() + PAD)

    out = Image.fromarray(rgba, 'RGBA').crop((x0, y0, x1, y1))
    out.save(f'{name}.png')

    a = np.array(out)[..., 3]
    soft = ((a > 8) & (a < 247)).sum()
    print(f'{name:20s} {out.size}  반투명 경계픽셀 {soft:5d}개  bg={bg.astype(int).tolist()}')
