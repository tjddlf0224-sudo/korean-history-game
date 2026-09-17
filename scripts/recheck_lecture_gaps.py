# -*- coding: utf-8 -*-
"""교안 핵심어 재대조 — 대사(t)·도해·퀴즈 문자열에만 있는지 본다(주석·계보표 제외).
   python3 scripts/recheck_lecture_gaps.py"""
import glob, json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(R, '_research/교안대조/대조결과.json'), encoding='utf-8'))

def corpus():
    out = {}
    for f in glob.glob(os.path.join(R, 'www', '*.html')):
        s = open(f, encoding='utf-8').read()
        i = s.find('const NPC_DATA')
        if i < 0: continue
        body = s[i:]
        body = re.sub(r'/\*[\s\S]*?\*/', '', body)
        body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
        strs = re.findall(r"'((?:[^'\\]|\\.)*)'", body)
        out[os.path.basename(f)] = ' '.join(strs)
    return out

C = corpus()
def cnt(terms):
    n = 0
    for t in terms:
        for txt in C.values():
            n += txt.count(t)
    return n

before0 = [x for x in D if x['cnt'] == 0]
still = [(x['ch'], x['kw'], x['terms']) for x in before0 if cnt(x['terms']) == 0]
print(f'처음 없던 {len(before0)}개 중 아직 없는 것 {len(still)}개')
for s in still: print('  ', s)
thin = [x for x in D if 0 < x['cnt'] <= 1]
th = [(x['ch'], x['kw'], cnt(x['terms'])) for x in thin if cnt(x['terms']) <= 1]
print(f'얇던 {len(thin)}개 중 여전히 1회 이하 {len(th)}개')
for s in th: print('  ', s)
