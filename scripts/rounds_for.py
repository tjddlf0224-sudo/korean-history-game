# -*- coding: utf-8 -*-
"""낱말로 기출 회차 찾기 — 새 퀴즈의 src를 손으로 짐작하지 않으려고.

  python3 scripts/rounds_for.py 1책12법 계절제 세형동검
주제명(topic_rounds.json)과 기출변형(exam_variants.json) 본문을 함께 훑는다.
띄어쓰기는 무시한다."""
import json, os, re, sys
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www', 'assets')
T = json.load(open(os.path.join(W, 'tools', 'topic_rounds.json'), encoding='utf-8'))
V = json.load(open(os.path.join(W, 'data', 'exam_variants.json'), encoding='utf-8'))
items = V if isinstance(V, list) else V.get('items') or V.get('questions') or list(V.values())

def ns(s): return re.sub(r'\s+', '', s or '')

for term in sys.argv[1:]:
    k = ns(term)
    tops = {t: r for t, r in T.items() if k in ns(t)}
    rs = sorted({x for r in tops.values() for x in r})
    vr = set()
    for it in items:
        if isinstance(it, dict) and k in ns(json.dumps(it, ensure_ascii=False)):
            for r in it.get('src') or []:
                vr.add(int(r))
    print(f'{term}: 주제 {rs}  변형본문 {sorted(vr)}  (주제명 {list(tops)[:4]})')
