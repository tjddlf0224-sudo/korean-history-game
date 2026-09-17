#!/usr/bin/env python3
"""www/*.html의 캐시 버전(?v=N)을 한 칸 올린다. 사용: python3 scripts/bump_version.py"""
import glob, re, os
root = os.path.join(os.path.dirname(__file__), '..', 'www')
files = glob.glob(os.path.join(root, '*.html'))
vers = set()
for f in files:
    vers |= set(int(v) for v in re.findall(r"\?v=(\d+)", open(f).read()))
cur = max(vers); new = cur + 1
n = 0
for f in files:
    s = open(f).read()
    t = s.replace(f'?v={cur}', f'?v={new}')
    if t != s:
        open(f, 'w').write(t); n += 1
print(f'v{cur} → v{new} ({n}개 파일)')
