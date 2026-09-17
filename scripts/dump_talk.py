# -*- coding: utf-8 -*-
"""대화 한 묶음의 대사·퀴즈를 짧게 훑어본다.  python3 scripts/dump_talk.py gaehang5 gojong_0 maeil_0"""
import os, re, sys
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
f = sys.argv[1]
s = open(os.path.join(W, f if f.endswith('.html') else f + '.html'), encoding='utf-8').read()
for key in sys.argv[2:]:
    i = s.find('\n  ' + key + ': {')
    if i < 0:
        print('!! 없음', key); continue
    m = re.search(r'\n  [a-z_0-9]+: *\{|\n\};', s[i + 5:])
    blk = s[i:i + 5 + m.start()]
    print('==', key)
    for ln in blk.split('\n'):
        t = re.search(r"who:'(\w+)'.*?\bt:'((?:[^'\\]|\\.)*)'", ln)
        q = re.search(r"\bq:\s*'((?:[^'\\]|\\.)*)'", ln)
        c = re.search(r"chart:\{ type:'(\w+)', title:'([^']*)'", ln)
        if t: print(f'  {t.group(1):4s} {t.group(2)[:90]}')
        elif q: print(f'  Q    {q.group(1)[:90]}')
        elif c: print(f'         [{c.group(1)}] {c.group(2)}')
