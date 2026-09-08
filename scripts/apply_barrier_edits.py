# -*- coding: utf-8 -*-
"""배리어 편집기에서 손본 결과를 챕터에 반영한다.

   왜 이렇게 하나
   - 배리어는 원래 measure_barriers.py 가 그림의 윤곽선을 뭉쳐 뽑은 것이고,
     그 도구는 "결과를 그대로 믿지 말고 눈으로 최종 검증하라"고 못박아 두었다.
     그 검증을 숫자(닿을 수 없는 칸 수)로 대신했다가 두 번 틀렸다 —
     한 번은 건물이 뚫렸고, 한 번은 멀쩡한 길이 막혔다.
   - 그래서 이제 사람이 지도를 보고 칸을 칠한다. 이 도구는 그 결과를 옮기고,
     **옮긴 뒤 게임이 망가지지 않았는지 반드시 다시 잰다.**

   넣는 것
     {"챕터.html#구역": [[x0,y0,x1,y1], ...], ...}

   넣은 뒤 검사하는 것 (하나라도 어긋나면 그 구역은 되돌린다)
     - 스폰 자리에 설 수 있는가
     - NPC 전원에게 말이 닿는가(대화 반경 108.8)
     - 출구마다 그 앞에 설 수 있는가
     - '해 보기'(Deed)마다 판정 거리 안에 설 자리가 있는가

   쓰는 법
     python3 scripts/apply_barrier_edits.py <고친것.json>
     python3 scripts/apply_barrier_edits.py <고친것.json> --check-only
"""
import argparse
import io
import json
import os
import re
import sys
from collections import deque

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audit_barriers as A
from loosen_barriers import rewrite_barriers

PAD = 10
TALK = 108.8


def reachable(z, bw, bh, pad=PAD, G=8):
    """스폰에서 실제로 걸어 닿는 칸들.

       걸음 폭은 **8px**이다. 16px로 재면 16px보다 얇은 벽을 건너뛰어,
       실제로는 갇힌 자리를 '닿는다'고 잘못 본다(성삼문에게서 실제로 겪었다).
       게임의 check_reachability.js 도 8px를 쓴다 — 같은 눈으로 봐야 한다."""
    can = A.make_can_stand(z, bw, bh, pad)
    stand = {(x, y)
             for y in range(0, int(bh) + 1, G)
             for x in range(0, int(bw) + 1, G) if can(x, y)}
    if not stand:
        return set(), can
    sx, sy = (A.snap(z['spawn'][0]), A.snap(z['spawn'][1])) if z['spawn'] else next(iter(stand))
    start = (sx, sy) if (sx, sy) in stand else \
        min(stand, key=lambda c: (c[0] - sx) ** 2 + (c[1] - sy) ** 2)
    seen = {start}
    q = deque([start])
    while q:
        x, y = q.popleft()
        for dx, dy in ((G, 0), (-G, 0), (0, G), (0, -G)):
            c = (x + dx, y + dy)
            if c in stand and c not in seen:
                seen.add(c); q.append(c)
    return seen, can


def deeds_of(src, zone):
    out = []
    for m in re.finditer(r"Deed\.add\(\{(.{0,900}?)\}\);", src, re.S):
        blk = m.group(1)

        def g(k, pat=r"[^,}]+"):
            mm = re.search(k + r':\s*(' + pat + ')', blk)
            return mm.group(1).strip().strip("'") if mm else None
        if g('zone') != zone:
            continue
        x, y, r = g('x'), g('y'), g('range')
        lab = g('label', r"'[^']*'")
        if x and y:
            out.append((lab or '?', float(x), float(y), float(r or 160)))
    return out


def check(z, bw, bh, src, zone):
    """이 구역이 여전히 제대로 도는가. 문제를 글로 돌려준다."""
    seen, can = reachable(z, bw, bh)
    bad = []
    if not seen:
        return ['설 수 있는 자리가 하나도 없다']
    if z['spawn'] and not can(*z['spawn']):
        bad.append('시작 자리에 설 수 없다')

    def near(tx, ty, r):
        return any((c[0] - tx) ** 2 + (c[1] - ty) ** 2 <= r * r for c in seen)

    for nx, ny, nid in z['npcs']:
        if not near(nx, ny, TALK):
            bad.append('인물 %s 에게 말이 안 닿는다' % nid)
    for i, (x0, y0, x1, y1) in enumerate(z['exits']):
        if not near((x0 + x1) / 2, (y0 + y1) / 2, 40):
            bad.append('출구 %d 번에 못 간다' % (i + 1))
    for lab, dx, dy, rng in deeds_of(src, zone):
        if not near(dx, dy, rng):
            bad.append("'%s' 를 할 자리가 없다" % lab)
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('edits')
    ap.add_argument('--check-only', action='store_true')
    a = ap.parse_args()

    edits = json.load(open(a.edits, encoding='utf-8'))
    os.chdir(A.BASE)

    by_chapter = {}
    for k, v in edits.items():
        ch, zone = k.split('#')
        by_chapter.setdefault(ch, []).append((zone, v))

    ok = rolled = 0
    for ch, jobs in sorted(by_chapter.items()):
        src = io.open(ch, encoding='utf-8').read()
        d = A.parse_chapter(ch)
        out = src
        for zone, bars in jobs:
            z = dict(d['zones'][zone])
            before = check(z, d['bw'], d['bh'], src, zone)
            z['barriers'] = [tuple(b) for b in bars]
            after = check(z, d['bw'], d['bh'], src, zone)
            new_bad = [m for m in after if m not in before]
            b0 = len(d['zones'][zone]['barriers'])
            if new_bad:
                print('  ❌ %-14s %-14s 되돌림 — %s' % (ch, zone, ' / '.join(new_bad[:3])))
                rolled += 1
                continue
            out, err = rewrite_barriers(out, zone, [tuple(int(v) for v in b) for b in bars])
            if err:
                print('  ⚠️  %-14s %-14s %s' % (ch, zone, err)); rolled += 1; continue
            seen, _ = reachable(z, d['bw'], d['bh'])
            print('  ✅ %-14s %-14s 배리어 %d→%d · 닿는 칸 %d'
                  % (ch, zone, b0, len(bars), len(seen)))
            ok += 1
        if not a.check_only and out != src:
            io.open(ch, 'w', encoding='utf-8').write(out)

    print('\n반영 %d곳 · 되돌림 %d곳%s' % (ok, rolled, ' (--check-only 라 저장 안 함)' if a.check_only else ''))


if __name__ == '__main__':
    main()
