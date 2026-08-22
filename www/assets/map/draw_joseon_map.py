#!/usr/bin/env python3
"""조선 8도 지도(joseon8do.png)를 실제 지리 데이터로 직접 그린다.

왜 코드로 그리는가:
  태극기 괘 배치 때와 같은 이유다. AI 이미지 생성은 정밀한 기하·상징 요소에
  근본적으로 취약해서, 한반도 윤곽이나 압록강·두만강 위치를 미묘하게 틀리게
  그린다. 지도는 조금만 틀어져도 학습 자료로서 못 쓰게 되므로 처음부터
  실측 데이터로 그린다.

데이터 출처(둘 다 퍼블릭 도메인 — Natural Earth, 저작권 표시 의무 없음):
  data/korea_outline.geojson : ne_50m_admin_0_countries 에서 남/북한만 추출
  data/korea_rivers.geojson  : ne_10m_rivers_lake_centerlines 에서 압록강(Yalu)·
                               두만강(Tumen)만 추출
  https://www.naturalearthdata.com/about/terms-of-use/

투영: 단순 등장방형(Plate carrée). 이 축척(한반도 한정)에서는 왜곡이 작고,
게임용 스타일 지도이므로 정밀 투영이 필요 없다. 다만 위도에 따른 가로 압축만
cos(중위도)으로 보정해 남북으로 늘어져 보이지 않게 한다.

8도 경계는 근대 이전 행정구역이라 현대 지리 데이터에 없다. 교과서 지도와
동일하게 근사 경계선으로 긋고, 이름 라벨은 이미지에 굽지 않는다(라벨은
map_component.js가 시대에 맞춰 그린다 — 함길도/함경도처럼 시대별로 다름).
"""
import json
import math
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
# 한반도는 남북으로 긴 땅이라 16:9 가로 캔버스에 맞춰 늘리면 형태가 망가진다.
# 실제 종횡비를 지키는 세로형 캔버스를 쓰고, 오버레이에서는 높이에 맞춰 축소한다.
W, H = 760, 980

# 데이터 실측 범위(lon 124.35~130.93, lat 33.20~43.00)에 여백을 둔 표시 범위
LON_C, LAT_C = 127.65, 38.10
LAT_SPAN = 10.9              # 화면에 담을 위도 폭
MARGIN_TOP = 0.06            # 위아래 여백 비율

PAPER = (232, 214, 180)
PAPER_DARK = (214, 192, 152)
SEA = (150, 178, 186)
SEA_DEEP = (128, 158, 168)
LAND = (222, 206, 168)
INK = (74, 56, 34)
RIVER = (72, 118, 150)
BORDER_LINE = (140, 116, 78)


def load(name):
    with open(os.path.join(HERE, 'data', name), encoding='utf-8') as f:
        return json.load(f)


# 등장방형 투영 — x는 cos(중위도)로 축척을 맞춰 실제 형태를 유지한다.
# (16:9에 억지로 채우려고 x를 늘렸더니 한반도가 옆으로 퍼져서 폐기한 방식)
_COS = math.cos(math.radians(LAT_C))
_K = (H * (1 - MARGIN_TOP * 2)) / LAT_SPAN   # 위도 1도당 픽셀


def project(lon, lat):
    x = W / 2 + (lon - LON_C) * _COS * _K
    y = H / 2 - (lat - LAT_C) * _K
    return x, y


def rings(geom):
    """Polygon / MultiPolygon 을 외곽 링 목록으로 편다."""
    t, c = geom['type'], geom['coordinates']
    if t == 'Polygon':
        return [c[0]]
    if t == 'MultiPolygon':
        return [poly[0] for poly in c]
    return []


def lines(geom):
    t, c = geom['type'], geom['coordinates']
    if t == 'LineString':
        return [c]
    if t == 'MultiLineString':
        return c
    return []


def main():
    # 바다 바탕(살짝 결이 있는 종이 위 물빛)
    img = Image.new('RGB', (W, H), SEA)
    d = ImageDraw.Draw(img)

    # 위쪽으로 갈수록 살짝 짙어지는 바다 그라데이션
    for y in range(H):
        t = y / H
        c = tuple(int(SEA_DEEP[i] + (SEA[i] - SEA_DEEP[i]) * t) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)

    # 육지 — 한반도 + 만주 쪽 일부가 데이터에 함께 들어오지만,
    # 남/북한만 추출했으므로 한반도만 그려진다.
    outline = load('korea_outline.geojson')
    land_mask = Image.new('L', (W, H), 0)
    dm = ImageDraw.Draw(land_mask)
    for f in outline['features']:
        for ring in rings(f['geometry']):
            pts = [project(lon, lat) for lon, lat in ring]
            if len(pts) >= 3:
                dm.polygon(pts, fill=255)

    land = Image.new('RGB', (W, H), LAND)
    # 종이 질감을 위해 아주 옅은 명암 변화를 준다
    grain = Image.new('L', (W, H), 0)
    dg = ImageDraw.Draw(grain)
    for i in range(0, H, 3):
        dg.line([(0, i), (W, i)], fill=6)
    land = Image.composite(Image.new('RGB', (W, H), PAPER_DARK), land, grain)

    img = Image.composite(land, img, land_mask)
    d = ImageDraw.Draw(img)

    # 해안선 — feature(남한/북한)별로 링을 그리면 둘 사이의 '휴전선'까지
    # 그려져 조선 지도에 시대착오적인 선이 생긴다. 그래서 개별 윤곽이 아니라
    # 합쳐진 육지 마스크의 '가장자리'만 뽑아서 그린다.
    edge = land_mask.filter(ImageFilter.MaxFilter(5))
    edge = ImageChops.subtract(edge, land_mask)
    ink_layer = Image.new('RGB', (W, H), INK)
    img = Image.composite(ink_layer, img, edge)
    d = ImageDraw.Draw(img)

    # 8도 근사 경계선 — 교과서 지도와 같은 수준의 개략선.
    # (경위도로 잡은 뒤 육지 안쪽에서만 보이도록 마스킹한다)
    province_lines = [
        # 평안도 / 함길도 (낭림산맥 능선 부근)
        [(126.4, 41.6), (127.3, 41.0), (127.6, 40.2), (127.4, 39.6)],
        # 평안도 / 황해도
        [(124.6, 39.2), (125.6, 38.9), (126.6, 38.7)],
        # 함길도 / 강원도
        [(127.4, 39.6), (128.3, 39.1), (128.9, 38.6)],
        # 황해도 / 경기도
        [(126.6, 38.7), (126.9, 38.1), (127.3, 37.9)],
        # 강원도 / 경기도
        [(127.3, 37.9), (127.8, 37.6), (128.1, 37.2)],
        # 경기도 / 충청도
        [(126.4, 36.9), (127.1, 36.9), (127.9, 36.9)],
        # 강원도 / 경상도
        [(128.1, 37.2), (128.7, 37.0), (129.2, 36.8)],
        # 충청도 / 경상도
        [(127.9, 36.9), (128.1, 36.3), (128.0, 35.7)],
        # 충청도 / 전라도
        [(126.4, 36.0), (127.0, 36.0), (127.6, 35.9)],
        # 전라도 / 경상도
        [(127.6, 35.9), (127.8, 35.3), (127.9, 34.9)],
    ]
    plines = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dp = ImageDraw.Draw(plines)
    for seg in province_lines:
        pts = [project(lon, lat) for lon, lat in seg]
        dp.line(pts, fill=BORDER_LINE + (190,), width=2, joint='curve')
    plines.putalpha(Image.composite(plines.getchannel('A'),
                                    Image.new('L', (W, H), 0), land_mask))
    img = Image.alpha_composite(img.convert('RGBA'), plines).convert('RGB')
    d = ImageDraw.Draw(img)

    # 압록강·두만강 — 국경이므로 다른 선보다 굵고 진하게
    rivers = load('korea_rivers.geojson')
    for f in rivers['features']:
        for ln in lines(f['geometry']):
            pts = [project(lon, lat) for lon, lat in ln]
            if len(pts) >= 2:
                d.line(pts, fill=RIVER, width=6, joint='curve')

    # ── 섬 보강 ──────────────────────────────────────────────
    # 독도는 Natural Earth 1:50m 데이터에 들어갈 만큼 크지 않아 아예 빠져 있다.
    # 우리 영토 표기는 빠지면 안 되므로 실측 좌표로 직접 그린다.
    # (제주도·울릉도는 데이터에 있으나 작아서 눈에 안 띄므로 함께 강조)
    ISLANDS = [
        ('독도',   131.8724, 37.2411, 4.5),   # 동도·서도 중심
        ('울릉도', 130.8760, 37.5024, 7.0),
    ]
    for _name, lon, lat, r in ISLANDS:
        ix, iy = project(lon, lat)
        d.ellipse([ix - r, iy - r, ix + r, iy + r], fill=LAND, outline=INK, width=2)

    # 세 섬은 작아서 놓치기 쉬우므로 지시선을 그어 위치를 분명히 한다
    # (라벨 글자는 map_component.js가 그린다 — 이미지에 굽지 않는 원칙 유지)
    for lon, lat, dx, dy in [(126.53, 33.38, 0, 26),      # 제주도
                             (130.876, 37.502, 26, -14),  # 울릉도
                             (131.8724, 37.2411, 26, 14)]: # 독도
        ix, iy = project(lon, lat)
        d.line([(ix, iy), (ix + dx, iy + dy)], fill=INK, width=1)

    # 백두산 표식(두 강이 갈라지는 지점)
    bx, by = project(128.06, 41.99)
    d.polygon([(bx, by - 13), (bx - 12, by + 7), (bx + 12, by + 7)],
              fill=(238, 240, 240), outline=INK)

    img = img.filter(ImageFilter.SMOOTH)
    out = os.path.join(HERE, 'joseon8do.png')
    img.save(out)

    # 좌표를 JS와 손으로 맞추면 어긋나기 쉬우므로, 같은 project()로 계산해
    # JSON으로 내보낸다(map_component.js가 이 파일을 읽는다).
    points = {
        'size': [W, H],
        'provinces': [
            {'id': 'hamgil',      'lonlat': [128.6, 40.6], 'early': '함길도', 'late': '함경도'},
            {'id': 'pyeongan',    'lonlat': [125.7, 39.9], 'early': '평안도', 'late': '평안도'},
            {'id': 'hwanghae',    'lonlat': [125.7, 38.4], 'early': '황해도', 'late': '황해도'},
            {'id': 'gangwon',     'lonlat': [128.3, 37.8], 'early': '강원도', 'late': '강원도'},
            {'id': 'gyeonggi',    'lonlat': [126.9, 37.4], 'early': '경기도', 'late': '경기도'},
            {'id': 'chungcheong', 'lonlat': [127.2, 36.5], 'early': '충청도', 'late': '충청도'},
            {'id': 'gyeongsang',  'lonlat': [128.5, 35.9], 'early': '경상도', 'late': '경상도'},
            {'id': 'jeolla',      'lonlat': [127.0, 35.3], 'early': '전라도', 'late': '전라도'},
        ],
        # 섬 이름 — 지시선 끝에 붙는 작은 라벨(도 이름보다 작게 그린다)
        'islands': [
            {'id': 'jeju',    'lonlat': [126.53, 33.38],     'off': [0, 26],   'name': '제주도'},
            {'id': 'ulleung', 'lonlat': [130.876, 37.502],   'off': [26, -14], 'name': '울릉도'},
            {'id': 'dokdo',   'lonlat': [131.8724, 37.2411], 'off': [26, 14],  'name': '독도'},
        ],
        'markers': [
            {'id': 'hamgil',  'lonlat': [130.0, 42.6], 'label': '6진(두만강)'},
            {'id': 'amnok',   'lonlat': [126.0, 40.9], 'label': '4군(압록강)'},
            {'id': 'baekdu',  'lonlat': [128.06, 41.99], 'label': '백두산'},
            {'id': 'hanyang', 'lonlat': [126.98, 37.57], 'label': '한양'},
        ],
    }
    for group in ('provinces', 'markers', 'islands'):
        for it in points[group]:
            x, y = project(*it['lonlat'])
            ox, oy = it.get('off', [0, 0])
            it['x'], it['y'] = round(x + ox, 1), round(y + oy, 1)
    with open(os.path.join(HERE, 'map_points.json'), 'w', encoding='utf-8') as f:
        json.dump(points, f, ensure_ascii=False, indent=1)

    print(f'저장: {out}  {img.size}')
    print('map_points.json 갱신 — 라벨/지점 좌표는 이 파일이 단일 출처')


if __name__ == '__main__':
    main()
