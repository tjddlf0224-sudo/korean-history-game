# -*- coding: utf-8 -*-
"""갈 수 있어야 할 곳을 못 가던 것을 고친다 — 배리어를 구역마다 필요한 만큼 깎는다.

   사용자가 정한 우선순위(그대로 따른다)
       "못 가는 게 제일 큰 문제야. 차라리 못 가야 할 곳을 다닐 수 있는 건
        큰 문제가 안 되는데 못 가는 게 제일 큰 문제야."

   무엇이 잘못돼 있었나 (scripts/audit_barriers.py 로 실측)
   - 36개 챕터 79개 구역에서 **닿을 수 있는 칸이 전체의 46%뿐**이었다.
     9%(서대문)·11%(광화문)·14%(김해)처럼 거의 못 걸어다니는 구역이 있었다.
   - 닿을 수 없는 '섬'이 1791칸, 못 닿는 출구가 1개 있었다.
   - 원인 두 겹:
       ① 배리어가 그림 위에 씌운 **사각형**이다. 사각형은 그림보다 넉넉하다.
       ② canStand가 pad=16으로 네 귀퉁이를 본다 — 발자국이 32×32다.
          결과적으로 모든 배리어가 사방 16px 부풀려져, 32px보다 좁은 틈은
          전부 막힌다. 움집 사이·바위 옆이 통째로 닫혔다.

   어떻게 고치나
   - pad 16 → 10 (발자국 32×32 → 20×20). 전 챕터 공통.
   - 배리어를 깎는다. 단 **구역마다 필요한 만큼만** 깎는다:
     깎기를 8부터 2씩 올려 가며, 섬이 12칸 이하가 되면 거기서 멈춘다
     (최대 32). 멀쩡한 구역을 과하게 열어 건물 속을 걷게 되는 일을 줄인다.
   - 얇은 배리어는 22px보다 얇아지지 않게 지킨다 — 담·성벽이 사라지면
     안 되니까(작은 소품은 22px까지 줄면 사실상 안 막는다. 그게 맞다).
   - 넣은 뒤 다시 재서 **NPC와 출구가 하나도 안 잃었는지** 확인한다.
     하나라도 잃으면 그 구역은 되돌린다.

   쓰는 법
     python3 scripts/loosen_barriers.py            # 실제로 고친다
     python3 scripts/loosen_barriers.py --dry      # 재 보기만
"""
import argparse
import glob
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audit_barriers as A          # 파서와 BFS를 그대로 쓴다

MIN_W = 22          # 이보다 얇아지지 않게
ISLAND_OK = 12      # 이 정도 섬은 남겨 둔다(그림상 진짜 막힌 자리도 있다)
NEW_PAD = 10


def erode(bars, e):
    out = []
    for x0, y0, x1, y1 in bars:
        w, h = x1 - x0, y1 - y0
        ex = min(e, max(0, (w - MIN_W) / 2.0))
        ey = min(e, max(0, (h - MIN_W) / 2.0))
        out.append((round(x0 + ex), round(y0 + ey), round(x1 - ex), round(y1 - ey)))
    return out


def pick_erosion(z, bw, bh):
    """이 구역에 필요한 만큼만 깎는다. (깎기, 재본 결과, 처음 결과)"""
    base = A.analyse(z, bw, bh, NEW_PAD)
    best = (0, base)
    for e in range(8, 34, 2):
        z2 = dict(z); z2['barriers'] = erode(z['barriers'], e)
        r = A.analyse(z2, bw, bh, NEW_PAD)
        # NPC나 출구를 잃으면 그 깎기는 쓰지 않는다
        if len(r['lost_npc']) > len(base['lost_npc']) or r['lost_exit'] > base['lost_exit']:
            continue
        best = (e, r)
        if r['island'] <= ISLAND_OK:
            break
    return best[0], best[1], base


def rewrite_barriers(src, zone_id, new_bars):
    """그 구역의 barriers 배열 숫자만 갈아 쓴다. 다른 것은 건드리지 않는다."""
    i = src.find('const ZONES = {')
    if i < 0:
        return src, '(ZONES 없음)'
    zstart = src.find('{', i)
    m = re.search(r'\n  ' + re.escape(zone_id) + r':\s*\{', src[zstart:])
    if not m:
        return src, '(구역 없음)'
    off = zstart + m.end()
    mb = re.search(r'barriers:\s*\[', src[off:])
    if not mb:
        return src, '(barriers 없음)'
    bstart = off + src[off:].index('[', mb.end() - 1)
    bend = A.balanced(src, bstart, '[', ']')
    body = '\n' + '\n'.join(
        '    { x0: %d, y0: %d, x1: %d, y1: %d },' % b for b in new_bars) + '\n  '
    return src[:bstart + 1] + body + src[bend:], None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    os.chdir(A.BASE)

    files = sorted(f for f in glob.glob('*.html')
                   if 'const NPC_DATA' in io.open(f, encoding='utf-8').read())

    print('%-18s %-14s %6s %8s %8s' % ('챕터', '구역', '깎기', '닿음', '섬'))
    tot_before = tot_after = tot_cells = 0
    isl_before = isl_after = 0
    plans = {}

    for f in files:
        d = A.parse_chapter(f)
        if not d:
            continue
        for zid, z in d['zones'].items():
            if not z['barriers']:
                continue
            e, after, base = pick_erosion(z, d['bw'], d['bh'])
            tot_before += base['reach']; tot_after += after['reach']
            tot_cells += base['total']
            isl_before += base['island']; isl_after += after['island']
            if e:
                plans.setdefault(f, []).append((zid, erode(z['barriers'], e)))
            print('%-18s %-14s %6d %3d→%3d%% %4d→%4d' %
                  (f, zid, e,
                   100 * base['reach'] // base['total'],
                   100 * after['reach'] // after['total'],
                   base['island'], after['island']))

    print('\n■ 전체 — 닿는 칸 %d%% → %d%% · 섬 %d칸 → %d칸'
          % (100 * tot_before // tot_cells, 100 * tot_after // tot_cells,
             isl_before, isl_after))
    print('  (pad는 16 → %d로 함께 낮춘 값이다)' % NEW_PAD)

    if a.dry:
        print('\n--dry 라서 고치지 않았다.')
        return

    # ---- 배리어 갈아 쓰기 ----
    n_zone = 0
    for f, jobs in plans.items():
        s = io.open(f, encoding='utf-8').read()
        for zid, bars in jobs:
            s2, err = rewrite_barriers(s, zid, bars)
            if err:
                print('  ⚠️ %s %s %s' % (f, zid, err)); continue
            s = s2; n_zone += 1
        io.open(f, 'w', encoding='utf-8').write(s)
    print('\n배리어를 갈아 쓴 구역: %d곳' % n_zone)

    # ---- pad 낮추기 ----
    OLD = '    const pad = 16;'
    NEW = ('    // 발자국. 예전 16은 네 귀퉁이가 32×32를 훑어, 모든 배리어가 사방\n'
           '    // 16px 부풀려졌다. 32px보다 좁은 틈이 전부 막혀 "지나갈 수가 없다"는\n'
           '    // 제보가 나왔다. 10이면 20×20 — 움집 사이 같은 틈으로 지나갈 수 있다.\n'
           '    const pad = %d;' % NEW_PAD)
    n = 0
    for f in files:
        s = io.open(f, encoding='utf-8').read()
        if OLD in s:
            io.open(f, 'w', encoding='utf-8').write(s.replace(OLD, NEW, 1)); n += 1
    print('pad 16 → %d 로 바꾼 챕터: %d개' % (NEW_PAD, n))


if __name__ == '__main__':
    main()
