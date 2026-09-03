# -*- coding: utf-8 -*-
"""배리어 전수 조사 — 갈 수 있어야 할 곳을 못 가는지 찾는다.

   왜
   - 제보: "여기 지나갈 수가 없어. 배리어 촘촘하게 해야지."
   - 사용자가 정한 우선순위가 분명하다:
       **못 가는 것이 제일 큰 문제. 못 갈 곳을 다닐 수 있는 건 큰 문제가 아니다.**

   무엇이 문제인가
   - 배리어는 그림 위에 씌운 **사각형**이다. 사각형은 그림보다 항상 넉넉하다.
   - 그 위에 canStand가 `pad=16`으로 네 귀퉁이를 본다 — 즉 발자국이 32×32다.
     결과적으로 **모든 배리어가 사방 16px 부풀려진다.** 32px보다 좁은 틈은
     전부 막힌다. 움집 사이, 바위 옆 같은 자리가 통째로 닫힌다.

   이 도구가 하는 일
   - 36개 챕터의 ZONES에서 barriers·spawn·npcs·exits를 뽑는다.
   - canStand를 그대로 옮겨(pad·NPC 반지름 34·테두리 6) BFS를 돌린다.
   - 구역마다 알려 준다:
       설 수 있는 칸이 몇 %인가 / 스폰에서 닿는 칸이 몇 %인가
       (닿는 칸 < 설 수 있는 칸이면 **섬**이 있다는 뜻)
       못 닿는 NPC·출구가 있는가
   - `--pad N` 으로 pad를 바꿔 가며 견줄 수 있다.

   쓰는 법
     python3 scripts/audit_barriers.py
     python3 scripts/audit_barriers.py --pad 10
     python3 scripts/audit_barriers.py --pad 10 --zone seonsa1.html:seonsa --map
"""
import argparse
import glob
import io
import os
import re
from collections import deque

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
GRID = 16
NPC_R = 34


def num(s, key):
    m = re.search(key + r'\s*:\s*(-?[\d.]+)', s)
    return float(m.group(1)) if m else None


def balanced(s, i, open_ch, close_ch):
    """s[i]가 여는 괄호라고 보고 짝이 맞는 닫는 괄호 위치를 준다."""
    d = 0
    while i < len(s):
        if s[i] == open_ch:
            d += 1
        elif s[i] == close_ch:
            d -= 1
            if d == 0:
                return i
        i += 1
    return -1


def parse_chapter(path):
    """ZONES에서 구역별 barriers·spawn·npcs·exits를 뽑는다.

       JS를 실행하지 않고 글자만 읽는다 — 값이 전부 숫자 리터럴이라 된다.
       (spawn.x 처럼 다른 값을 참조하는 곳이 있으면 None으로 두고 건너뛴다.)"""
    s = io.open(path, encoding='utf-8').read()
    bw = num(s, r'const BG_W') or 1376
    bh = num(s, r'const BG_H') or 768

    i = s.find('const ZONES = {')
    if i < 0:
        return None
    j = balanced(s, s.find('{', i), '{', '}')
    body = s[s.find('{', i) + 1:j]

    zones = {}
    # 최상위 키만 — 두 칸 들여쓰기로 시작하는 `이름: {`
    for m in re.finditer(r'\n  (\w+):\s*\{', body):
        k = balanced(body, body.index('{', m.end() - 1), '{', '}')
        blk = body[m.end():k]
        z = {'barriers': [], 'npcs': [], 'exits': [], 'spawn': None}

        mb = re.search(r'barriers:\s*\[', blk)
        if mb:
            e = balanced(blk, blk.index('[', mb.end() - 1), '[', ']')
            for bm in re.finditer(r'\{([^{}]*)\}', blk[mb.end():e]):
                t = bm.group(1)
                v = [num(t, kk) for kk in ('x0', 'y0', 'x1', 'y1')]
                if None not in v:
                    z['barriers'].append(tuple(v))

        ms = re.search(r'spawn:\s*\{([^{}]*)\}', blk)
        if ms:
            x, y = num(ms.group(1), 'x'), num(ms.group(1), 'y')
            if x is not None and y is not None:
                z['spawn'] = (x, y)

        mn = re.search(r'npcs:\s*\[', blk)
        if mn:
            e = balanced(blk, blk.index('[', mn.end() - 1), '[', ']')
            for nm in re.finditer(r'\{([^{}]*)\}', blk[mn.end():e]):
                t = nm.group(1)
                x, y = num(t, r'\bx'), num(t, r'\by')
                idm = re.search(r"id:\s*'([^']*)'", t)
                if x is not None and y is not None:
                    z['npcs'].append((x, y, idm.group(1) if idm else '?'))

        me = re.search(r'exits:\s*\[', blk)
        if me:
            e = balanced(blk, blk.index('[', me.end() - 1), '[', ']')
            for em in re.finditer(r'rect:\s*\{([^{}]*)\}', blk[me.end():e]):
                t = em.group(1)
                v = [num(t, kk) for kk in ('x0', 'y0', 'x1', 'y1')]
                if None not in v:
                    z['exits'].append(tuple(v))

        zones[m.group(1)] = z
    return {'bw': bw, 'bh': bh, 'zones': zones}


def make_can_stand(z, bw, bh, pad):
    bars = z['barriers']
    npcs = z['npcs']

    def px_blocked(x, y):
        if x < 6 or y < 6 or x >= bw - 6 or y >= bh - 6:
            return True
        for x0, y0, x1, y1 in bars:
            if x0 <= x <= x1 and y0 <= y <= y1:
                return True
        return False

    def can(x, y):
        for dx, dy in ((-pad, -pad), (pad, -pad), (-pad, pad), (pad, pad)):
            if px_blocked(x + dx, y + dy):
                return False
        for nx, ny, _ in npcs:
            if (nx - x) ** 2 + (ny - y) ** 2 < NPC_R * NPC_R:
                return False
        return True

    return can


def snap(v):
    return int(round(v / GRID) * GRID)


def analyse(z, bw, bh, pad):
    can = make_can_stand(z, bw, bh, pad)
    cells = [(x, y) for y in range(0, int(bh) + 1, GRID)
             for x in range(0, int(bw) + 1, GRID) if can(x, y)]
    stand = set(cells)

    start = None
    if z['spawn']:
        sx, sy = snap(z['spawn'][0]), snap(z['spawn'][1])
        if (sx, sy) in stand:
            start = (sx, sy)
        else:                                  # 스폰이 배리어 위 — 가장 가까운 칸에서
            start = min(stand, key=lambda c: (c[0] - sx) ** 2 + (c[1] - sy) ** 2) if stand else None
    elif stand:
        start = next(iter(stand))

    seen = set()
    if start:
        q = deque([start]); seen.add(start)
        while q:
            x, y = q.popleft()
            for dx, dy in ((GRID, 0), (-GRID, 0), (0, GRID), (0, -GRID)):
                c = (x + dx, y + dy)
                if c in stand and c not in seen:
                    seen.add(c); q.append(c)

    def near(tx, ty, r):
        return any((c[0] - tx) ** 2 + (c[1] - ty) ** 2 <= r * r for c in seen)

    lost_npc = [n[2] for n in z['npcs'] if not near(n[0], n[1], 108.8)]
    lost_exit = sum(1 for x0, y0, x1, y1 in z['exits']
                    if not near((x0 + x1) / 2, (y0 + y1) / 2, 40))
    total = (int(bw) // GRID + 1) * (int(bh) // GRID + 1)
    return {'stand': len(stand), 'reach': len(seen), 'total': total,
            'island': len(stand) - len(seen),
            'lost_npc': lost_npc, 'lost_exit': lost_exit}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pad', type=int, default=16)
    ap.add_argument('--zone', default=None, help='챕터.html:구역 하나만')
    ap.add_argument('--map', action='store_true', help='격자를 그려 본다')
    a = ap.parse_args()

    os.chdir(BASE)
    files = sorted(f for f in glob.glob('*.html')
                   if 'const NPC_DATA' in io.open(f, encoding='utf-8').read())
    if a.zone:
        files = [a.zone.split(':')[0]]

    print('pad = %d (발자국 %d×%d)\n' % (a.pad, a.pad * 2, a.pad * 2))
    print('%-18s %-14s %6s %6s %7s %s' %
          ('챕터', '구역', '설수있음', '닿음', '섬', '못 닿는 것'))
    tot_island = 0
    bad = []
    for f in files:
        d = parse_chapter(f)
        if not d:
            continue
        for zid, z in d['zones'].items():
            if a.zone and ':' in a.zone and zid != a.zone.split(':')[1]:
                continue
            r = analyse(z, d['bw'], d['bh'], a.pad)
            tot_island += r['island']
            flag = ''
            if r['lost_npc']:
                flag += 'NPC ' + ','.join(r['lost_npc'][:3]) + ' '
            if r['lost_exit']:
                flag += '출구 %d개' % r['lost_exit']
            if r['island'] or flag:
                bad.append((f, zid, r))
            print('%-18s %-14s %5d%% %5d%% %7d %s' %
                  (f, zid, 100 * r['stand'] // r['total'],
                   100 * r['reach'] // r['total'], r['island'], flag or ''))

            if a.map:
                can = make_can_stand(z, d['bw'], d['bh'], a.pad)
                for y in range(0, int(d['bh']) + 1, GRID * 2):
                    print('  ' + ''.join('.' if can(x, y) else '#'
                                         for x in range(0, int(d['bw']) + 1, GRID)))
    print('\n섬(닿을 수 없는 칸) 합계: %d칸 · 문제 구역 %d곳' % (tot_island, len(bad)))


if __name__ == '__main__':
    main()
