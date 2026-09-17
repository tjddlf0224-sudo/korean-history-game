# -*- coding: utf-8 -*-
"""주인공 속말((속으로) …) 바로 뒤에 동료·NPC가 '대꾸'하는 줄을 뽑는다(속말은 남에게 안 들림)."""
import glob, os, re
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
Q = re.compile(r'\?|뭐|무슨|왜|어떻게|정말|맞아|그렇')
for f in sorted(glob.glob(os.path.join(W, '*.html'))):
    s = open(f, encoding='utf-8').read(); i = s.find('const NPC_DATA')
    if i < 0: continue
    prev = None; key = None
    for ln in s[i:].split('\n'):
        k = re.match(r'  ([a-z_0-9]+): *\{', ln)
        if k: key = k.group(1); prev = None
        me = re.search(r"who:'me'[^\n]*?\bt:'((?:[^'\\]|\\.)*)'", ln)
        pa = re.search(r"Party\.say\('(\w+)', '\w+', '((?:[^'\\]|\\.)*)'", ln)
        npc = re.search(r"who:'npc'[^\n]*?\bt:'((?:[^'\\]|\\.)*)'", ln)
        cur = None
        if me: cur = ('me', me.group(1))
        elif pa: cur = (pa.group(1), pa.group(2))
        elif npc: cur = ('npc', npc.group(1))
        if not cur: continue
        if prev and prev[0] == 'me' and prev[1].startswith('(속으로)') and cur[0] != 'me' and not cur[1].startswith('('):
            print(f'{os.path.basename(f):16s} {key:16s} | {prev[1][:36]} → [{cur[0]}] {cur[1][:40]}')
        prev = cur
