# -*- coding: utf-8 -*-
"""도해 지도에 쓸 **주변 육지 윤곽**을 실제 해안선에서 만든다.

   왜 필요한가
   - 지금 도해 지도는 **한반도 윤곽만** 그린다. 그래서 부여·고구려처럼
     만주에 있던 나라를 찍으면 핀이 허공에 뜬다. 어디가 육지인지 알 수 없다.
   - 영역을 색으로 칠하면 바다 위에까지 번졌다(제보: "영역이 바다에도
     그려지는 등 조금 조잡해보여").

   무엇을 만드나
   - `www/assets/map/data/neighbors.geojson`(중국·러시아·일본 실제 해안선)을
     도해의 눈금으로 옮겨 SVG path 문자열로 뽑는다.
   - 눈금은 chart.js가 쓰는 것과 같다:
         x = (경도 - 124) / 7   * 100
         y = (43.3 - 위도) / 9.5 * 150
   - 보이는 창(viewBox) 밖은 잘라 낸다. 사각형은 볼록하므로
     서덜랜드-호지먼으로 정확히 잘린다(라이브러리 없이).
   - 점이 너무 많으면 파일이 커진다. 더글러스-포이커로 성기게 줄인다
     (한반도 윤곽도 같은 방식으로 419점 → 1.5KB로 줄여 쓰고 있다).

   쓰는 법
     python3 scripts/make_map_paths.py            # 문자열을 찍어 본다
     python3 scripts/make_map_paths.py --apply    # chart.js에 넣는다
"""
import argparse
import json
import math
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, 'www', 'assets', 'map', 'data')
CHART = os.path.join(BASE, 'www', 'assets', 'chart.js')

# 보이는 창 — chart.js의 north viewBox '-20 -48 140 212' 보다 조금 넉넉하게.
# (딱 맞춰 자르면 테두리에 실선이 생겨 '벽'처럼 보인다)
BOX = (-30, -58, 130, 176)      # x0, y0, x1, y1

MIN_AREA = 1.4      # 이보다 작은 섬은 버린다(도해에서 점 하나로 뭉갠다)
EPS = 0.9           # 더글러스-포이커 허용 오차


def to_xy(lon, lat):
    return ((lon - 124.0) / 7.0 * 100.0, (43.3 - lat) / 9.5 * 150.0)


def clip_rect(pts, box):
    """서덜랜드-호지먼 — 사각형(볼록)으로 다각형을 자른다."""
    x0, y0, x1, y1 = box

    def inside(p, edge):
        if edge == 0: return p[0] >= x0
        if edge == 1: return p[0] <= x1
        if edge == 2: return p[1] >= y0
        return p[1] <= y1

    def cross(a, b, edge):
        ax, ay = a; bx, by = b
        if edge in (0, 1):
            xe = x0 if edge == 0 else x1
            t = (xe - ax) / (bx - ax)
            return (xe, ay + t * (by - ay))
        ye = y0 if edge == 2 else y1
        t = (ye - ay) / (by - ay)
        return (ax + t * (bx - ax), ye)

    out = pts
    for edge in range(4):
        if not out: return []
        buf, prev = [], out[-1]
        for cur in out:
            if inside(cur, edge):
                if not inside(prev, edge): buf.append(cross(prev, cur, edge))
                buf.append(cur)
            elif inside(prev, edge):
                buf.append(cross(prev, cur, edge))
            prev = cur
        out = buf
    return out


def dp(pts, eps):
    """더글러스-포이커 — 모양을 지키면서 점을 줄인다."""
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    den = math.hypot(dx, dy)
    worst, wi = -1.0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = (abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / den) if den else \
            math.hypot(p[0] - a[0], p[1] - a[1])
        if d > worst: worst, wi = d, i
    if worst > eps:
        return dp(pts[:wi + 1], eps)[:-1] + dp(pts[wi:], eps)
    return [a, b]


def area(pts):
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def rings_of(geom):
    t, c = geom['type'], geom['coordinates']
    if t == 'Polygon': return [c[0]]
    if t == 'MultiPolygon': return [poly[0] for poly in c]
    return []


def build(names, src):
    d = json.load(open(os.path.join(DATA, src), encoding='utf-8'))
    parts = []
    for f in d['features']:
        nm = f.get('properties', {}).get('name')
        if names and nm not in names: continue
        for ring in rings_of(f['geometry']):
            pts = [to_xy(lon, lat) for lon, lat in ring]
            pts = clip_rect(pts, BOX)
            if len(pts) < 4: continue
            if area(pts) < MIN_AREA: continue
            pts = dp(pts, EPS)
            if len(pts) < 4: continue
            parts.append(pts)
    parts.sort(key=area, reverse=True)
    return parts


def to_path(parts):
    out = []
    for pts in parts:
        out.append('M' + ' '.join('%.1f,%.1f' % p for p in pts) + 'Z')
    return ''.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()

    land = build({'China', 'Russia'}, 'neighbors.geojson')
    sea_neighbor = build({'Japan'}, 'neighbors.geojson')
    print('만주·연해주 조각 %d개 (%d자)' % (len(land), len(to_path(land))))
    print('일본 조각 %d개 (%d자)' % (len(sea_neighbor), len(to_path(sea_neighbor))))

    if not a.apply:
        print('\n--apply 를 주면 chart.js에 넣는다.')
        return

    s = open(CHART, encoding='utf-8').read()
    block = (
        "  /* 주변 육지 — 만주·연해주(MAINLAND_PATH)와 일본(ISLE_PATH).\n"
        "     한반도만 그리면 부여·고구려 핀이 허공에 뜨고, 영역을 칠하면\n"
        "     바다까지 번진다(실제 제보). 같은 눈금으로 실제 해안선을 옮겼다.\n"
        "     scripts/make_map_paths.py 가 neighbors.geojson에서 뽑는다. */\n"
        "  const MAINLAND_PATH = '%s';\n"
        "  const ISLE_PATH = '%s';\n" % (to_path(land), to_path(sea_neighbor))
    )
    if 'const MAINLAND_PATH' in s:
        s = re.sub(r"  /\* 주변 육지[\s\S]*?const ISLE_PATH = '[^']*';\n", block, s, count=1)
    else:
        m = re.search(r"  const KOREA_PATH = '[^']*';\n", s)
        s = s[:m.end()] + '\n' + block + s[m.end():]
    open(CHART, 'w', encoding='utf-8').write(s)
    print('\nchart.js에 넣었다.')


if __name__ == '__main__':
    main()
