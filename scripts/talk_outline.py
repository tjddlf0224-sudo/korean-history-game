# -*- coding: utf-8 -*-
"""챕터의 모든 대화를 순서대로 짧게: python3 scripts/talk_outline.py tongil [폭]"""
import os, re, sys
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
f = sys.argv[1]; width = int(sys.argv[2]) if len(sys.argv) > 2 else 70
s = open(os.path.join(W, f if f.endswith('.html') else f + '.html'), encoding='utf-8').read()
m = re.search(r'const NPC_DATA\s*=\s*\{([\s\S]*?)\n\};', s)
o = re.search(r"const order = \[([\s\S]*?)\];", s)
if o: print('ORDER', ' '.join(re.findall(r"\['(\w+)'", o.group(1))))
for km in re.finditer(r"\n  ([a-z_0-9]+): *\{([\s\S]*?)(?=\n  [a-z_0-9]+: *\{|\Z)", m.group(1)):
    key, b = km.group(1), km.group(2)
    nm = re.search(r"name:\s*'([^']*)'", b)
    flags = ' '.join(x for x in ['endsChapter' if 'endsChapter' in b else '', 'partyJoin' if 'partyJoin' in b else ''] if x)
    print(f'== {key} [{nm.group(1) if nm else ""}] {flags}')
    for ln in b.split('\n'):
        t = re.search(r"who:'(\w+)'.*?\bt:'((?:[^'\\]|\\.)*)'", ln)
        p = re.search(r"Party\.say\('(\w+)',\s*'(\w+)',\s*'((?:[^'\\]|\\.)*)'", ln)
        if p: print(f'   {p.group(1)[:3]:4s} {p.group(3)[:width]}')
        elif t: print(f'   {t.group(1):4s} {t.group(2)[:width]}')
        elif re.search(r"\bq:\s*'", ln): print('   Q')
