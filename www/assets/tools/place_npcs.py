#!/usr/bin/env python3
"""새 NPC를 세울 자리를 실제 도달 가능성으로 골라 준다.

왜 만들었나
  좌표를 눈대중으로 찍으면 반드시 틀린다. 배경 그림만 보면 멀쩡한 마당인데
  배리어가 덮고 있거나, 서 있을 수는 있어도 플레이어가 대화 사거리 안으로
  못 들어가는 자리가 나온다. 실제로 여러 번 겪었다(공산 벌판 하늘 스폰,
  청해진 나루터 통행 불가).

무엇을 보장하나 — 챕터의 판정 로직을 그대로 옮겼다
  · canStand: 몸 상자 pad=16의 네 귀퉁이가 배리어에 닿지 않을 것
  · NPC 반발: 기존 NPC와 34px 안으로 겹치지 않을 것
  · 대화 사거리: INTERACT_RANGE=108.8 안에 **스폰에서 걸어 닿는** 칸이 있을 것
    (서 있을 자리 자체는 NPC가 막고 서므로 걸을 수 있을 필요가 없다)

  이 셋을 다 만족하는 칸 중에서, 기존 NPC·유물 지점과 고루 떨어지도록
  가장 먼 자리부터 하나씩 집는다.

사용:
  python3 assets/tools/place_npcs.py goryeo1.html gaegyeong 4
"""
import json
import re
import sys
from collections import deque

PAD = 16            # canStand의 몸 상자 반폭
NPC_BLOCK = 34      # NPC 반발 거리
INTERACT = 108.8    # 대화 사거리
STEP = 8            # 격자 간격


def parse_zone(html, zone):
    """ZONES에서 한 구역의 배리어·NPC·유물지점·스폰을 꺼낸다."""
    z = re.search(r'const ZONES\s*=\s*\{(.*?)\n\};', html, re.S).group(1)
    blk = re.search(rf'\n  {zone}:\s*\{{(.*?)\n  \}},', z, re.S)
    if not blk:
        raise SystemExit(f'구역 {zone} 을(를) 못 찾음')
    b = blk.group(1)

    def rects(name):
        m = re.search(rf'{name}:\s*\[(.*?)\n    \]', b, re.S)
        if not m:
            return []
        return [tuple(map(int, r)) for r in
                re.findall(r'x0:\s*(\d+),\s*y0:\s*(\d+),\s*x1:\s*(\d+),\s*y1:\s*(\d+)', m.group(1))]

    def points(name):
        m = re.search(rf'{name}:\s*\[(.*?)\n    \]', b, re.S)
        if not m:
            return []
        return [(int(x), int(y)) for x, y in re.findall(r'x:\s*(\d+),\s*y:\s*(\d+)', m.group(1))]

    spawn = re.search(r'spawn:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)', b)
    return {
        'barriers': rects('barriers'),
        'npcs': points('npcs'),
        'spots': points('spots'),
        'spawn': (int(spawn.group(1)), int(spawn.group(2))) if spawn else None,
    }


def make_walk(bars, w, h):
    def barrier(x, y):
        return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in bars)

    def can(x, y):
        if x - PAD < 0 or y - PAD < 0 or x + PAD > w or y + PAD > h:
            return False
        return not (barrier(x - PAD, y - PAD) or barrier(x + PAD, y - PAD) or
                    barrier(x - PAD, y + PAD) or barrier(x + PAD, y + PAD))
    return can


def reachable(can, spawn, w, h):
    """스폰에서 실제로 걸어 닿는 칸(격자)."""
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
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    f, zone, want = sys.argv[1], sys.argv[2], int(sys.argv[3])
    html = open(f, encoding='utf-8').read()
    z = parse_zone(html, zone)
    W = H = None
    m = re.search(r'BG_W\s*=\s*(\d+)[\s\S]{0,80}?BG_H\s*=\s*(\d+)', html)
    if m:
        W, H = int(m.group(1)), int(m.group(2))
    else:
        W, H = 1376, 768
    can = make_walk(z['barriers'], W, H)
    walk = reachable(can, z['spawn'], W, H)
    print(f'{f} · {zone} — 걸어 닿는 칸 {len(walk)}개 (격자 {STEP}px)')

    # 스폰 자리에 세우면 시작하자마자 NPC 안에 갇힌다. 막는 것에도, 벌리는
    # 것에도 함께 넣는다.
    taken = list(z['npcs']) + [z['spawn']]
    avoid = list(z['npcs']) + list(z['spots']) + [z['spawn']]

    # 그림 가장자리는 배리어가 없어도 하늘이거나 먼 산인 경우가 많다. 실제로
    # 공산 벌판에서 스폰이 하늘에 떠 있던 적이 있다. 위쪽을 특히 넉넉히 띄운다.
    TOP, SIDE = 140, 70

    def ok(p):
        if not (SIDE <= p[0] <= W - SIDE and TOP <= p[1] <= H - SIDE):
            return False
        # 기존 NPC와 겹치지 않고, 걸어 닿는 칸이 사거리 안에 있어야 한다
        if any((p[0] - a) ** 2 + (p[1] - b) ** 2 < (NPC_BLOCK + 8) ** 2 for a, b in taken):
            return False
        return any((p[0] - x) ** 2 + (p[1] - y) ** 2 < INTERACT ** 2 for x, y in walk)

    # 후보는 "걸어 닿는 칸 + 그 둘레" — NPC는 벽 앞에 서도 된다
    cand = sorted({(x, y) for x, y in walk} |
                  {(x + dx, y + dy) for x, y in walk
                   for dx in (-STEP, 0, STEP) for dy in (-STEP, 0, STEP)})
    cand = [p for p in cand if ok(p)]

    picked = []
    for _ in range(want):
        best, bd = None, -1
        for p in cand:
            d = min((p[0] - a) ** 2 + (p[1] - b) ** 2 for a, b in avoid + picked)
            if d > bd:
                best, bd = p, d
        if best is None:
            break
        picked.append(best)
        print(f'  x:{best[0]}, y:{best[1]}   (가장 가까운 기존 요소까지 {bd ** .5:.0f}px)')
    if len(picked) < want:
        print(f'  ※ {want}개를 요청했으나 {len(picked)}개만 가능')


if __name__ == '__main__':
    main()
