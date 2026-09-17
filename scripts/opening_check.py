# -*- coding: utf-8 -*-
"""대화 첫머리가 '자기소개'로만 시작하는지(작법 3장: 첫 3줄 안에 일이 벌어진다) 센다."""
import glob, os, re
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
INTRO = re.compile(r"^(나는|저는|소인은|소승은|소신은|과인은|여기는|예가|우리는|이 )|이라 하오|이올시다|라 하옵니다|일세\.$")
EVENT = re.compile(r"^\(|!|\?|섰거라|마침|좀|주게|주시오|보게|보시오|받아|들어")
tot = bad = 0
for f in sorted(glob.glob(os.path.join(W, '*.html'))):
    s = open(f, encoding='utf-8').read(); i = s.find('const NPC_DATA')
    if i < 0: continue
    m = re.search(r'const NPC_DATA\s*=\s*\{([\s\S]*?)\n\};', s)
    for km in re.finditer(r"\n  ([a-z_0-9]+): *\{([\s\S]*?)(?=\n  [a-z_0-9]+: *\{|\Z)", m.group(1)):
        key, b = km.group(1), km.group(2)
        if key.endswith(('_wait', '_repeat')) or 'beats' not in b: continue
        lines = re.findall(r"(?:who:'(\w+)'[^\n]*?\bt:|Party\.say\('(\w+)', '\w+', )'((?:[^'\\]|\\.)*)'", b)[:3]
        if not lines: continue
        tot += 1
        first3 = [t for _, _, t in lines]
        if not any(EVENT.search(t) for t in first3) and (lines[0][2] and INTRO.search(lines[0][2])):
            bad += 1
            print(f'{os.path.basename(f):16s} {key:18s} {first3[0][:40]} / {first3[1][:30] if len(first3)>1 else ""}')
print(f'자기소개로만 여는 대화 {bad}/{tot}')
