#!/usr/bin/env python3
"""모든 챕터의 모든 NPC가 실제로 걸어서 닿는 자리에 서 있는지 검사한다.

check_reachability.js 는 구역과 출구를 보고, 이건 **인물**을 본다.
NPC를 새로 세우거나 옮긴 뒤에는 이걸 돌린다.

판정은 챕터의 로직 그대로 — canStand(pad 16), 대화 사거리 108.8.
스폰에서 BFS로 닿는 칸 중에 사거리 안에 드는 칸이 하나라도 있어야 한다.

  python3 assets/tools/check_npc_reach.py
"""
import glob
import re
import sys
from collections import deque

PAD, INTERACT, STEP = 16, 108.8, 8
SKIP = ('_', 'index', 'ending', 'exam', 'prologue', 'ch0_phaser')


def zones_of(html):
    m = re.search(r'const ZONES\s*=\s*\{([\s\S]*?)\n\};', html)
    if not m:
        return {}
    out = {}
    for zm in re.finditer(r"\n  (\w+):\s*\{([\s\S]*?)(?=\n  \w+:\s*\{|\Z)", m.group(1)):
        zid, b = zm.group(1), zm.group(2)
        bars = []
        bm = re.search(r'barriers:\s*\[([\s\S]*?)\n    \]', b)
        if bm:
            bars = [tuple(map(int, r)) for r in re.findall(
                r'x0:\s*(-?\d+),\s*y0:\s*(-?\d+),\s*x1:\s*(-?\d+),\s*y1:\s*(-?\d+)', bm.group(1))]
        npcs = []
        nm = re.search(r'npcs:\s*\[([\s\S]*?)\n    \]', b)
        if nm:
            for e in re.finditer(r"\{\s*id:\s*'(\w+)'[^}]*?x:\s*(\d+),\s*y:\s*(\d+)", nm.group(1)):
                npcs.append((e.group(1), int(e.group(2)), int(e.group(3))))
        sp = re.search(r'spawn:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)', b)
        out[zid] = dict(bars=bars, npcs=npcs,
                        spawn=(int(sp.group(1)), int(sp.group(2))) if sp else None)
    return out


def reachable(bars, spawn, w, h):
    def barrier(x, y):
        return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in bars)

    def can(x, y):
        if x - PAD < 0 or y - PAD < 0 or x + PAD > w or y + PAD > h:
            return False
        return not (barrier(x - PAD, y - PAD) or barrier(x + PAD, y - PAD) or
                    barrier(x - PAD, y + PAD) or barrier(x + PAD, y + PAD))

    sx, sy = (spawn[0] // STEP) * STEP, (spawn[1] // STEP) * STEP
    seen, q = {(sx, sy)}, deque([(sx, sy)])
    while q:
        x, y = q.popleft()
        for dx, dy in ((STEP, 0), (-STEP, 0), (0, STEP), (0, -STEP)):
            n = (x + dx, y + dy)
            if n in seen or not (0 < n[0] < w and 0 < n[1] < h):
                continue
            if can(*n):
                seen.add(n)
                q.append(n)
    return seen


def main():
    bad, total = [], 0
    for f in sorted(glob.glob('*.html')):
        if f.startswith(SKIP):
            continue
        html = open(f, encoding='utf-8').read()
        m = re.search(r'BG_W\s*=\s*(\d+)[\s\S]{0,80}?BG_H\s*=\s*(\d+)', html)
        W, H = (int(m.group(1)), int(m.group(2))) if m else (1376, 768)
        for zid, z in zones_of(html).items():
            if not z['npcs'] or not z['spawn']:
                continue
            cells = reachable(z['bars'], z['spawn'], W, H)
            for nid, x, y in z['npcs']:
                total += 1
                if not any((x - cx) ** 2 + (y - cy) ** 2 < INTERACT ** 2 for cx, cy in cells):
                    bad.append(f'{f} · {zid} · {nid} (x:{x}, y:{y})')

    print(f'인물 {total}명 검사')
    if bad:
        print(f'\n■ 걸어서 닿을 수 없는 인물 {len(bad)}명')
        for b in bad:
            print('  ✗', b)
        sys.exit(1)
    print('\n■ 전원 도달 가능 ✅')


if __name__ == '__main__':
    main()
