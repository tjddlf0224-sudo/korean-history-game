#!/usr/bin/env python3
"""기출문제 데이터(exam_variants.json) 구조·품질 전수 검사.

check_all.py는 챕터 파일 쪽만 보고, 기출문제 풀이 모드가 쓰는 이 데이터는
따로 검사하는 게 없었다. 여기서 기계적으로 확인 가능한 것들을 전부 본다.

실행: python3 www/assets/tools/check_exam_data.py
"""
import json, os, re, sys, unicodedata
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # www/
PATH = os.path.join(ROOT, 'assets', 'data', 'exam_variants.json')

with open(PATH, encoding='utf-8') as f:
    D = json.load(f)

ERRORS = []    # 반드시 고쳐야 하는 것
WARNS = []     # 사람이 봐야 하는 것

ERAS = {'선사·초기국가', '고대', '고려', '조선 전기', '조선 후기',
        '근대·개항기', '일제강점기', '현대', '시대 통합'}


def norm(s):
    """비교용 정규화 — 공백·문장부호를 털어 낸다."""
    s = unicodedata.normalize('NFC', s or '')
    s = re.sub(r'<[^>]+>', '', s)                 # <u> 등 마크업 제거
    s = re.sub(r'[\s\.,·「」『』"\'()\[\]?!~—-]', '', s)
    return s


ids = Counter()
by_qtext = defaultdict(list)

for i, it in enumerate(D):
    qid = it.get('id') or f'(id없음 #{i})'
    ids[qid] += 1

    # ---- 필수 필드 ----
    for key in ('id', 'era', 'q', 'opts', 'answer', 'feedback'):
        if key not in it:
            ERRORS.append(f"{qid}: 필수 항목 '{key}' 없음")
    if 'opts' not in it or 'answer' not in it:
        continue

    opts = it['opts']
    ans = it['answer']

    # ---- 시대값 ----
    if it.get('era') not in ERAS:
        ERRORS.append(f"{qid}: 시대값이 이상함 → {it.get('era')!r}")

    # ---- 선택지 ----
    if not isinstance(opts, list) or len(opts) < 2:
        ERRORS.append(f"{qid}: 선택지가 2개 미만")
        continue
    if not isinstance(ans, int) or not (0 <= ans < len(opts)):
        ERRORS.append(f"{qid}: 정답 번호({ans})가 선택지 범위(0~{len(opts)-1}) 밖")
        continue

    nopts = [norm(o) for o in opts]
    if len(set(nopts)) != len(nopts):
        dup = [o for o, c in Counter(nopts).items() if c > 1]
        ERRORS.append(f"{qid}: 같은 선택지가 두 번 나옴 → {dup}")
    for o in opts:
        if not str(o).strip():
            ERRORS.append(f"{qid}: 빈 선택지 있음")

    # ---- 해설(feedback) ----
    fb = it.get('feedback')
    if not isinstance(fb, list) or len(fb) != 2:
        ERRORS.append(f"{qid}: feedback은 [오답해설, 정답해설] 2개여야 하는데 {len(fb) if isinstance(fb,list) else type(fb).__name__}")
    else:
        for j, t in enumerate(fb):
            if not str(t).strip():
                ERRORS.append(f"{qid}: feedback[{j}]가 비어 있음")

    # ---- 제시문 ----
    p = it.get('passage')
    if p is not None:
        if not str(p).strip():
            ERRORS.append(f"{qid}: passage가 빈 문자열")
        # <u> 태그 짝
        if p.count('<u>') != p.count('</u>'):
            ERRORS.append(f"{qid}: <u> 태그 짝이 안 맞음 ({p.count('<u>')}/{p.count('</u>')})")
        # 문제에 (가)가 있는데 제시문에 없음 (이번에 133건 고친 유형)
        if '(가)' in it['q'] and '(가)' not in p:
            WARNS.append(f"{qid}: 문제에는 '(가)'가 있는데 제시문에 없음")
        # 제시문이 정답 선택지를 통째로 담고 있으면 글자 대조로 풀린다
        na = norm(opts[ans])
        if len(na) >= 4 and na in norm(p):
            WARNS.append(f"{qid}: 제시문에 정답 '{opts[ans]}'이 그대로 들어 있음(정답 유출 의심)")
    else:
        if '(가)' in it['q']:
            WARNS.append(f"{qid}: 제시문이 없는데 문제에 '(가)'가 있음")

    # ---- 밑줄 안내와 실제 밑줄 ----
    if '밑줄' in it['q']:
        if not p or '<u>' not in p:
            ERRORS.append(f"{qid}: '밑줄 그은'이라고 했는데 제시문에 밑줄(<u>)이 없음")

    # ---- 출처(src) ----
    src = it.get('src')
    if src is not None:
        if not isinstance(src, list) or not all(isinstance(n, int) for n in src):
            ERRORS.append(f"{qid}: src는 회차 번호(정수) 배열이어야 함 → {src!r}")
        elif any(n < 1 or n > 100 for n in src):
            WARNS.append(f"{qid}: src 회차 번호가 범위를 벗어남 → {src}")

    by_qtext[(norm(it['q']), norm(p) if p else '')].append(qid)

# ---- 전역 검사 ----
for qid, c in ids.items():
    if c > 1:
        ERRORS.append(f"id가 중복됨: {qid} ({c}번)")

for (q, p), qids in by_qtext.items():
    if len(qids) > 1 and p:      # 제시문까지 같은 완전 중복만
        WARNS.append(f"문제+제시문이 완전히 같은 문항 {len(qids)}개: {', '.join(qids)}")

print(f"검사한 문항: {len(D)}개")
print(f"시대별: " + ', '.join(f'{k} {v}' for k, v in Counter(x.get('era') for x in D).most_common()))

if ERRORS:
    print(f"\n■ 오류 {len(ERRORS)}건 (반드시 수정)\n")
    for e in ERRORS[:100]:
        print('  ✗ ' + e)
    if len(ERRORS) > 100:
        print(f'  … 외 {len(ERRORS)-100}건')
if WARNS:
    print(f"\n■ 확인 필요 {len(WARNS)}건\n")
    for w in WARNS[:100]:
        print('  ? ' + w)
    if len(WARNS) > 100:
        print(f'  … 외 {len(WARNS)-100}건')
if not ERRORS and not WARNS:
    print('\n■ 이상 없음 ✅')
sys.exit(1 if ERRORS else 0)
