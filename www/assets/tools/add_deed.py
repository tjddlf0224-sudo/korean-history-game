#!/usr/bin/env python3
"""챕터에 '지도에서 하는 일'(deed.js)을 붙인다.

왜 도구로 만드나
  스물일곱 챕터에 손으로 붙이면 반드시 어긋난다. 실제로 앞서 여섯 챕터에서
  Stage.keyFor 를 빠뜨려 새 인물이 전부 말이 안 걸렸다(파일 검사는 통과했다).
  자리 잡기·삽입·루프 연결·스크립트 태그를 한 번에 처리해서 빠뜨릴 곳을 없앤다.

자리는 **눈대중으로 정하지 않는다.** 챕터의 canStand 로직(pad 16)을 그대로 옮긴
너비 우선 탐색으로 스폰에서 걸어 닿는 칸을 구하고, 기존 인물과 충분히 떨어진
곳을 고른다. 그래야 "가긴 가는데 인물에 밀려 못 선다"가 안 생긴다.

쓰는 법
  python3 add_deed.py spec.json
  spec.json = [{ "file":"godae1.html", "zone":"hanseong", "id":"...",
                 "label":"...", "tag":"...", "lines":["...","..."],
                 "gold":24, "badge":"did_...", "comment":"고증 메모" }, ...]
"""
import json
import os
import re
import sys
from collections import deque

PAD, STEP = 16, 8
HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.dirname(os.path.dirname(HERE))
WWW = os.path.join(WWW, 'www') if not HERE.endswith('www/assets/tools') else \
      os.path.dirname(os.path.dirname(HERE))


def zone_info(html, zid):
    body = re.search(r'const ZONES\s*=\s*\{([\s\S]*?)\n\};', html).group(1)
    m = re.search(r"\n  %s:\s*\{([\s\S]*?)(?=\n  \w+:\s*\{|\Z)" % re.escape(zid), body)
    if not m:
        return None
    b = m.group(1)
    bm = re.search(r'barriers:\s*\[([\s\S]*?)\n    \]', b)
    bars = []
    if bm:
        bars = [tuple(map(int, g)) for g in re.findall(
            r'x0:\s*(-?\d+),\s*y0:\s*(-?\d+),\s*x1:\s*(-?\d+),\s*y1:\s*(-?\d+)', bm.group(1))]
    npcs = [(int(x), int(y)) for x, y in re.findall(r"x:\s*(\d+),\s*y:\s*(\d+),\s*img:", b)]
    # **exits 안의 spawn 을 집지 않도록** exits 앞부분에서만 찾는다.
    # 출구의 spawn 은 '건너간 뒤 설 자리'라 **다른 구역의 좌표**다. 그걸 이 구역의
    # 시작점으로 쓰면 엉뚱한 데를 재게 된다(ch1 훈련장에서 실제로 그랬다).
    head = b.split('exits:')[0]
    sp = re.search(r'spawn:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)', head)
    if sp:
        return bars, npcs, (int(sp.group(1)), int(sp.group(2)))
    # 구역에 spawn 이 없는 경우가 있다 — 그런 구역은 **다른 구역의 출구**로만 들어온다.
    # 그 출구가 지정한 자리를 시작점으로 쓴다.
    alt = re.findall(r"to:\s*'%s',\s*spawn:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)"
                     % re.escape(zid), body)
    if alt:
        return bars, npcs, (int(alt[0][0]), int(alt[0][1]))
    return None


def pick_spot(bars, npcs, spawn, W=1376, H=768):
    """스폰에서 걸어 닿는 칸 중, 기존 인물에서 가장 멀리 떨어진 자리."""
    def ok(x, y):
        if x - PAD < 0 or y - PAD < 0 or x + PAD > W or y + PAD > H:
            return False
        for x0, y0, x1, y1 in bars:
            if x + PAD > x0 and x - PAD < x1 and y + PAD > y0 and y - PAD < y1:
                return False
        return True
    sx, sy = spawn
    if not ok(sx, sy):
        return None, 0, 0
    seen = {(sx // STEP, sy // STEP)}
    q = deque([(sx, sy)])
    pts = [(sx, sy)]
    while q:
        x, y = q.popleft()
        for dx, dy in ((STEP, 0), (-STEP, 0), (0, STEP), (0, -STEP)):
            nx, ny = x + dx, y + dy
            k = (nx // STEP, ny // STEP)
            if k in seen or not ok(nx, ny):
                continue
            seen.add(k)
            q.append((nx, ny))
            pts.append((nx, ny))
    # 가장자리에 붙은 칸은 뺀다. 지도 끝에 서 있는 것은 자연스럽지 않고,
    # 플레이어가 그 구석까지 갈 이유도 없다.
    EDGE = 90
    inner = [p for p in pts if EDGE < p[0] < W - EDGE and EDGE < p[1] < H - EDGE]
    pool = inner or pts
    cx = sum(p[0] for p in pool) / len(pool)
    cy = sum(p[1] for p in pool) / len(pool)
    best = None
    for p in pool:
        dn = min([((p[0] - n[0]) ** 2 + (p[1] - n[1]) ** 2) ** .5 for n in npcs] or [9999])
        dsp = ((p[0] - sx) ** 2 + (p[1] - sy) ** 2) ** .5
        if not (dn > 150 and 140 < dsp < 460):
            continue
        # 인물과 멀되(300에서 포화), 걸어 다니는 한복판에 가까운 쪽을 고른다.
        dc = ((p[0] - cx) ** 2 + (p[1] - cy) ** 2) ** .5
        score = min(dn, 300) - dc * 0.35
        if not best or score > best[0]:
            best = (score, p, dn)
    if not best:
        for p in pool:
            dn = min([((p[0] - n[0]) ** 2 + (p[1] - n[1]) ** 2) ** .5 for n in npcs] or [9999])
            dc = ((p[0] - cx) ** 2 + (p[1] - cy) ** 2) ** .5
            score = min(dn, 300) - dc * 0.35
            if not best or score > best[0]:
                best = (score, p, dn)
    return best[1], best[2], len(pts)


def block_for(spec, x, y):
    lines = ',\n'.join("    '%s'" % ln.replace("\\", "\\\\").replace("'", "\\'")
                       for ln in spec['lines'])
    return """
/* ============ %s ============
%s */
if (window.Deed) Deed.add({
  id: '%s', zone: '%s', x: %d, y: %d, range: 175,
  label: '%s', tag: '%s',
  lines: [
%s,
  ],
  gold: %d, badge: '%s',
});
""" % (spec['tag'].replace(' ', ''), spec.get('comment', ''), spec['id'], spec['zone'],
       x, y, spec['label'], spec['tag'], lines, spec.get('gold', 24), spec['badge'])


def apply(spec):
    path = os.path.join(WWW, spec['file'])
    s = open(path, encoding='utf-8').read()
    if "id: '%s'" % spec['id'] in s:
        return '이미 있음'
    zi = zone_info(s, spec['zone'])
    if not zi:
        return '구역 %s 없음' % spec['zone']
    bars, npcs, spawn = zi
    pt, dn, reach = pick_spot(bars, npcs, spawn)
    if not pt:
        # 구역 자체 spawn 이 막힌 경우가 있다(ch1 훈련장). 플레이어는 그 값이 아니라
        # **출구가 지정한 자리**로 들어오므로, 그걸 찾아 다시 시도한다.
        alt = re.findall(r"to:\s*'%s',\s*spawn:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)"
                         % re.escape(spec['zone']), s)
        if alt:
            pt, dn, reach = pick_spot(bars, npcs, (int(alt[0][0]), int(alt[0][1])))
    if not pt:
        return '스폰이 막혀 자리를 못 구함'
    i = s.rindex('</script>')
    s = s[:i] + block_for(spec, pt[0], pt[1]) + '\n' + s[i:]
    old = "  requestAnimationFrame(loop);\n}"
    if 'Deed.tick' not in s:
        if old not in s:
            return '게임 루프를 못 찾음'
        s = s.replace(old, "  if (window.Deed) Deed.tick(World);\n" + old, 1)
    if 'assets/deed.js' not in s:
        m = re.search(r'(\n\s*<script src="assets/fx\.js\?v=\d+"></script>)', s)
        if not m:
            return 'fx.js 스크립트 태그를 못 찾음'
        s = s[:m.end(1)] + '\n  <script src="assets/deed.js?v=18"></script>' + s[m.end(1):]
    open(path, 'w', encoding='utf-8').write(s)
    return '자리(%d,%d) · 인물까지 %.0f · 닿는칸 %d' % (pt[0], pt[1], dn, reach)


def main():
    specs = json.load(open(sys.argv[1], encoding='utf-8'))
    ok = 0
    for sp in specs:
        r = apply(sp)
        print('  %-18s %-22s %s' % (sp['file'], sp['id'], r))
        if r.startswith('자리'):
            ok += 1
    print('%d/%d 붙임' % (ok, len(specs)))


if __name__ == '__main__':
    sys.exit(main())
