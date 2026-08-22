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

# 표시 범위를 경위도로 못박는다(예전엔 중심+위도폭이라 좌우 여백이 얼마나
# 생기는지 가늠이 안 됐고, 그 결과 한반도가 캔버스 폭의 54%밖에 못 채워
# 화면 절반이 바다였다). 지금 범위는 세 가지를 동시에 만족시킨 값이다.
#   서쪽 123.6 — 압록강 건너 요동(명)까지 보이게
#   동쪽 132.4 — 독도(131.87)와 그 라벨까지 반드시 들어가게
#   남쪽  32.9 — 제주도 아래 라벨 자리 + 일본 규슈 북단
#   북쪽  43.9 — 두만강 북쪽 만주(여진)까지
# 이 범위에서 한반도 본토가 가로 폭의 약 75%를 차지한다.
LON_MIN, LON_MAX = 123.6, 132.4
LAT_MIN, LAT_MAX = 32.9, 43.9

W = 760                       # 가로는 고정, 세로는 축척에서 계산된다

PAPER = (232, 214, 180)
PAPER_DARK = (214, 192, 152)
SEA = (150, 178, 186)
SEA_DEEP = (128, 158, 168)
LAND = (222, 206, 168)          # 조선 — 따뜻한 종이색
FOREIGN = (196, 196, 190)       # 주변국 — 차갑고 채도 낮은 회색으로 구분
FOREIGN_DARK = (182, 182, 176)
INK = (74, 56, 34)
FOREIGN_INK = (108, 104, 96)
RIVER = (72, 118, 150)
BORDER_LINE = (140, 116, 78)


def load(name):
    with open(os.path.join(HERE, 'data', name), encoding='utf-8') as f:
        return json.load(f)


# 등장방형 투영 — x는 cos(중위도)로 축척을 맞춰 실제 형태를 유지한다.
# (16:9에 억지로 채우려고 x를 늘렸더니 한반도가 옆으로 퍼져서 폐기한 방식)
_COS = math.cos(math.radians((LAT_MIN + LAT_MAX) / 2))
_K = W / ((LON_MAX - LON_MIN) * _COS)        # 경도 1도당 픽셀
H = int(round((LAT_MAX - LAT_MIN) * _K))


def project(lon, lat):
    x = (lon - LON_MIN) * _COS * _K
    y = (LAT_MAX - lat) * _K
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

    # ── 주변국 육지 ────────────────────────────────────────
    # 예전에는 한반도만 그려서 지도 윗부분(만주)이 통째로 바다처럼 보였다.
    # 이제 요동·만주·연해주·일본 북단을 실제 지형으로 그린다.
    #
    # 주의: 나라별로 따로 그리면 중국-러시아, 중국-북한 같은 '현대 국경선'이
    # 지도에 찍힌다. 조선 지도에 20세기 국경을 그리는 셈이라 반드시 피해야
    # 한다(한반도 해안선에서 휴전선이 그려졌던 것과 같은 실수). 그래서 모든
    # 주변국을 하나의 마스크로 합친 뒤 그 '가장자리'만 해안선으로 뽑는다.
    # 명/여진/청 같은 정치적 구분은 선이 아니라 라벨로만 표시한다 —
    # 15세기 이 일대의 세력권은 선으로 그을 만큼 고정돼 있지 않았다.
    neighbors = load('neighbors.geojson')
    foreign_mask = Image.new('L', (W, H), 0)
    fm = ImageDraw.Draw(foreign_mask)
    for f in neighbors['features']:
        for ring in rings(f['geometry']):
            pts = [project(lon, lat) for lon, lat in ring]
            if len(pts) >= 3:
                fm.polygon(pts, fill=255)

    foreign = Image.new('RGB', (W, H), FOREIGN)
    fgrain = Image.new('L', (W, H), 0)
    dfg = ImageDraw.Draw(fgrain)
    for i in range(0, H, 3):
        dfg.line([(0, i), (W, i)], fill=6)
    foreign = Image.composite(Image.new('RGB', (W, H), FOREIGN_DARK), foreign, fgrain)
    img = Image.composite(foreign, img, foreign_mask)

    fedge = foreign_mask.filter(ImageFilter.MaxFilter(5))
    fedge = ImageChops.subtract(fedge, foreign_mask)
    img = Image.composite(Image.new('RGB', (W, H), FOREIGN_INK), img, fedge)
    d = ImageDraw.Draw(img)

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

    # 8도 경계선은 뺐다. 이 축척에서는 근사선이 산줄기와 어긋나 조잡해 보이고,
    # 도 이름 라벨도 함께 뺐다(도 이름은 이미 아는 상식이라 지도만 어지럽힌다).
    # 대신 고을 이름으로 위치를 짚게 한다. 좌표는 map_points.json에 남겨둔다.

    # 압록강·두만강 — 국경이므로 다른 선보다 굵고 진하게
    # 두 강은 모두 백두산에서 발원해 서로 반대 방향으로 흐른다(압록강은 서남,
    # 두만강은 동북). 데이터를 그대로 이으면 백두산을 관통하는 한 줄기처럼
    # 보이므로, 발원점 둘레를 비워 물길이 거기서 시작한다는 것이 드러나게 한다.
    BAEKDU = (128.06, 41.99)
    bx0, by0 = project(*BAEKDU)
    SOURCE_GAP = 15                      # 백두산 둘레 이만큼은 강을 그리지 않는다

    rivers = load('korea_rivers.geojson')
    for f in rivers['features']:
        for ln in lines(f['geometry']):
            pts = [project(lon, lat) for lon, lat in ln]
            seg = []
            for p in pts:
                if math.hypot(p[0] - bx0, p[1] - by0) < SOURCE_GAP:
                    if len(seg) >= 2:
                        d.line(seg, fill=RIVER, width=6, joint='curve')
                    seg = []
                else:
                    seg.append(p)
            if len(seg) >= 2:
                d.line(seg, fill=RIVER, width=6, joint='curve')

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

    # 백두산 — 두 강이 갈라지는 지점. 산이므로 초록 세모로 그리고, 봉우리에만
    # 흰 눈을 얹는다(예전엔 흰 세모라 지도 기호인지 산인지 알기 어려웠다).
    bx, by = project(128.06, 41.99)
    MOUNT = (58, 104, 62)
    d.polygon([(bx, by - 15), (bx - 14, by + 8), (bx + 14, by + 8)],
              fill=MOUNT, outline=INK)
    d.polygon([(bx, by - 15), (bx - 5, by - 3), (bx + 5, by - 3)],
              fill=(242, 244, 244))

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
            # 대마도 — 이종무의 정벌(1419)과 계해약조(1443)의 무대라 반드시 짚어준다
            {'id': 'daemado', 'lonlat': [129.30, 34.30],     'off': [30, 0],   'name': '대마도'},
        ],
        # 주변국 이름 — 시대에 따라 갈린다. 조선 전기(early)의 북쪽 이웃은
        # 명(明)과 여진(女眞)이다. 청(淸)은 1636년에 서는 나라라 이 시대엔
        # 아직 없다 — early에 청을 쓰면 200년을 앞당기는 시대착오가 된다.
        # 값이 None이면 그 시대엔 그리지 않는다.
        'countries': [
            {'id': 'ming',    'lonlat': [123.95, 40.95], 'early': '명(明)',     'late': None},
            {'id': 'jurchen', 'lonlat': [129.30, 43.35], 'early': '여진(女眞)', 'late': None},
            {'id': 'qing',    'lonlat': [126.60, 42.95], 'early': None,         'late': '청(淸)'},
            {'id': 'japan',   'lonlat': [130.70, 33.35], 'early': '일본(日本)', 'late': '일본(日本)'},
        ],
        # 세종 대 주요 고을. 감영 소재지·국경 관문·삼포처럼 기출과 직접
        # 이어지는 곳만 골랐다(경상감영은 조선 전기엔 대구가 아니라 상주).
        'cities': [
            {'id': 'hanyang',  'lonlat': [126.98, 37.57], 'name': '한양', 'big': True},
            {'id': 'gaeseong', 'lonlat': [126.55, 37.97], 'name': '개성'},
            {'id': 'pyeongyang', 'lonlat': [125.75, 39.02], 'name': '평양', 'big': True},
            {'id': 'uiju',     'lonlat': [124.50, 40.10], 'name': '의주'},
            {'id': 'ganggye',  'lonlat': [126.60, 40.97], 'name': '강계'},
            {'id': 'hoeryeong','lonlat': [129.75, 42.44], 'name': '회령'},
            {'id': 'gyeongseong', 'lonlat': [129.60, 41.58], 'name': '경성'},
            {'id': 'chungju',  'lonlat': [127.93, 36.97], 'name': '충주'},
            {'id': 'sangju',   'lonlat': [128.16, 36.41], 'name': '상주'},
            {'id': 'jeonju',   'lonlat': [127.15, 35.82], 'name': '전주'},
            {'id': 'naju',     'lonlat': [126.72, 35.02], 'name': '나주'},
            {'id': 'gyeongju', 'lonlat': [129.22, 35.84], 'name': '경주'},
            # 삼포 — 계해약조로 왜인의 왕래를 이 세 곳으로 묶었다. 서로 가까워
            # 라벨이 겹치므로 off로 흩어 놓는다.
            {'id': 'jepo',     'lonlat': [128.68, 35.13], 'name': '제포',   'off': [-16, 16]},
            {'id': 'busanpo',  'lonlat': [129.08, 35.20], 'name': '부산포', 'off': [10, 26]},
            {'id': 'yeompo',   'lonlat': [129.36, 35.53], 'name': '염포',   'off': [22, 4]},
        ],
        # 강 이름 — 어느 물줄기가 어느 강인지 지도에서 바로 읽히게 한다.
        # 'from'/'to'는 그 강이 어디서 어디까지인지 캡션에 쓰는 설명.
        'rivers': [
            {'id': 'amnokgang', 'lonlat': [125.60, 40.35], 'name': '압록강',
             'note': '백두산에서 서남쪽으로 흘러 의주를 지나 서해로'},
            {'id': 'dumangang', 'lonlat': [129.25, 42.12], 'name': '두만강',
             'note': '백두산에서 동북쪽으로 흘러 동해로'},
        ],
        'markers': [
            {'id': 'hamgil',  'lonlat': [130.0, 42.6], 'label': '6진(두만강)'},
            {'id': 'amnok',   'lonlat': [126.0, 40.9], 'label': '4군(압록강)'},
            {'id': 'baekdu',  'lonlat': [128.06, 41.99], 'label': '백두산'},
            {'id': 'hanyang', 'lonlat': [126.98, 37.57], 'label': '한양'},
        ],
    }
    for group in ('provinces', 'markers', 'islands', 'countries', 'cities', 'rivers'):
        for it in points[group]:
            x, y = project(*it['lonlat'])
            ox, oy = it.get('off', [0, 0])
            if group == 'cities':
                # 고을은 점은 실제 위치에, 글자만 off 만큼 밀어 놓는다.
                # (섬은 지시선 끝에 글자를 다는 방식이라 x,y 자체를 옮긴다)
                it['x'], it['y'] = round(x, 1), round(y, 1)
                it['lx'], it['ly'] = round(x + ox, 1), round(y + oy, 1)
            else:
                it['x'], it['y'] = round(x + ox, 1), round(y + oy, 1)
    with open(os.path.join(HERE, 'map_points.json'), 'w', encoding='utf-8') as f:
        json.dump(points, f, ensure_ascii=False, indent=1)

    print(f'저장: {out}  {img.size}')
    print('map_points.json 갱신 — 라벨/지점 좌표는 이 파일이 단일 출처')


if __name__ == '__main__':
    main()
