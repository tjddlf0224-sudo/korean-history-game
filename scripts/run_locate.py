# -*- coding: utf-8 -*-
"""NPC가 4줄 이상 연달아 말하는 곳의 첫 줄과 셋째 줄을 보여 준다(끼워 넣을 자리)."""
import glob, os, re
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
for f in sorted(glob.glob(os.path.join(W, '*.html'))):
    s = open(f, encoding='utf-8').read(); i = s.find('const NPC_DATA')
    if i < 0: continue
    key = None; run = []
    def flush():
        if len(run) >= 4:
            print(f'{os.path.basename(f):16s} {key:16s} {len(run)}줄 | 3번째: {run[2][:34]}')
    for ln in s[i:].split('\n'):
        k = re.match(r'  ([a-z_0-9]+): *\{', ln)
        if k: flush(); key = k.group(1); run = []; continue
        m = re.search(r"(?:who:'(\w+)'[^\n]*?\bt:|Party\.say\('(\w+)', '\w+', )'((?:[^'\\]|\\.)*)'", ln)
        if not m: 
            if re.search(r"\bq:\s*'", ln): flush(); run = []
            continue
        who = m.group(1) or 'party'
        if who == 'doc': continue
        if who == 'npc': run.append(m.group(3))
        else: flush(); run = []
