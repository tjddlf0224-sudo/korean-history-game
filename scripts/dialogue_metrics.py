# -*- coding: utf-8 -*-
"""대사 작법 지표 — 챕터별로 긴 줄·NPC 연속 독백·첫 줄 인사 여부를 센다.
   python3 scripts/dialogue_metrics.py [--list]"""
import glob, os, re, sys
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
LIST = '--list' in sys.argv
tot = dict(lines=0, long=0, run=0, talks=0)
rows = []
for f in sorted(glob.glob(os.path.join(W, '*.html'))):
    s = open(f, encoding='utf-8').read()
    i = s.find('const NPC_DATA')
    if i < 0: continue
    body = s[i:]
    long_ = run4 = n = talks = 0
    for m in re.finditer(r'\n  (\w+):\s*\{', body):
        j = body.find('beats:', m.end())
        k = body.find('\n  },', m.end())
        if j < 0 or j > k: continue
        blk = body[j:k]
        talks += 1
        whos = []
        for lm in re.finditer(r"(?:who:'(\w+)'[^\n]*?\bt:|Party\.say\('(\w+)', '\w+', )'((?:[^'\\]|\\.)*)'", blk):
            who = lm.group(1) or 'party'
            t = lm.group(3)
            if who == 'doc': continue
            n += 1
            if len(t) > 50:
                long_ += 1
                if LIST: print(f'  LONG {os.path.basename(f)} {m.group(1)} {len(t)} {t[:50]}')
            whos.append(who)
        r = 0
        for w in whos:
            r = r + 1 if w == 'npc' else 0
            if r == 4:
                run4 += 1
                if LIST: print(f'  RUN4 {os.path.basename(f)} {m.group(1)}')
    rows.append((os.path.basename(f), talks, n, long_, run4))
    tot['lines'] += n; tot['long'] += long_; tot['run'] += run4; tot['talks'] += talks
for r in rows:
    print('%-20s 대화%3d 줄%4d 긴줄%3d 독백4+%3d' % r)
print('합계', tot)
