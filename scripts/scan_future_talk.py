# -*- coding: utf-8 -*-
"""NPC가 자기 시대 뒤의 일을 말하는지 의심되는 줄을 뽑는다(사람이 읽고 판단).
   python3 scripts/scan_future_talk.py"""
import glob, os, re
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
PAT = re.compile(r'훗날|뒷날|먼 훗날|지금의|오늘날|지금도 남|현재|뒤에 ?알려|들었소|들었네|들었습니다|하더군|다더군|라더군|이라 하오|부르게 됩니다|발견|출토|국보|유네스코|세기')
for f in sorted(glob.glob(os.path.join(W, '*.html'))):
    s = open(f, encoding='utf-8').read()
    i = s.find('const NPC_DATA')
    if i < 0: continue
    key = None
    for ln in s[i:].split('\n'):
        k = re.match(r'  ([a-z_0-9]+): *\{', ln)
        if k: key = k.group(1)
        m = re.search(r"who:'npc'(?:, name:'([^']*)')?[^\n]*?\bt:'((?:[^'\\]|\\.)*)'", ln)
        if m and PAT.search(m.group(2)):
            print(f'{os.path.basename(f):18s} {key:18s} {m.group(2)[:70]}')
