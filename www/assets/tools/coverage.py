#!/usr/bin/env python3
"""기출 주제 빈도 ↔ 게임 반영 상태 대조표.

기출 3,700문항의 topic 문자열에서 키워드를 뽑아 빈도를 세고,
그 키워드가 게임에서 어느 수준까지 다뤄지는지를 네 단계로 표시한다.

  무대  — 챕터 제목이나 구역 이름에 들어간다 (그 개념이 배경이 되는 무대다)
  NPC   — 그 이름의 NPC가 서 있다
  퀴즈  — 문제·보기·해설에 나온다
  언급  — 대사에만 나온다

'빈도는 높은데 무대가 아닌 것'이 다음에 만들 챕터 후보다.
저장해 둔 원칙: 기출률 높은 개념은 반드시 맵이나 메인 무대로 올린다.

  python3 coverage.py            # 상위 60개
  python3 coverage.py 150        # 상위 150개
  python3 coverage.py --gaps     # 무대가 아닌 것만
  python3 coverage.py --csv > x.csv
  python3 coverage.py --md       # 커버리지_리포트.md 새로 씀
"""
import collections
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.abspath(os.path.join(HERE, '..', '..'))
EXAM = os.path.expanduser(
    '~/Library/Mobile Documents/com~apple~CloudDocs/앱 개발/한국사 게임/분석/시대분류')

# topic 문자열에 붙어 다니는, 그 자체로는 개념이 아닌 말들.
# 이걸 안 걸러내면 '시기'(120회)가 1위로 올라와 표가 쓸모없어진다.
STOP = set("""
시기 사이 사이시기 순서 배열 변천 상황 내용 특징 활동 사실 인물 사건 정책 제도 업적
전개 결과 배경 원인 과정 의의 영향 관련 공통 비교 구분 종류 대표 주요 기타 이후 이전
항쟁 침입 대응 멸망 건국 정벌 전투 전쟁 개혁안 개혁정치 정부 역사 사료 순서배열 하대
연표 흐름 변화 성격 조직 단체 인물들 왕조별 지문 사진 지도 자료해석 복합 통합 총정리
당시 무렵 초기 후기 중기 말기 전기 시대 나라 국가 왕조 세력 지역 지방 중앙 우리 및 등
문화 사회 경제 정치 생활 유물 유적 자료 기록 문서 서적 인식 사상 운동 개혁 정비 발전
설치 폐지 실시 시행 파견 편찬 건립 창건 제작 사용 유형 형태 모습 위치 명칭 이름 계보
""".split())

# 시대·범주 이름. 개념이 아니라 문제의 '갈래'라서 따로 센다.
BROAD = set("""
선사 고대 고려 조선 조선전기 조선후기 근대 개항기 근대개항기 일제강점기 현대
고구려 백제 신라 통일신라 가야 삼국 남북국 후삼국 대한제국 일제 임시정부
문화유산 지역사 답사 세시풍속 생활상 시대별 시대통합
""".split())

# 뒤에 붙는 조사만 떼어 낸다. 앞글자를 건드리면 '의열단'이 '열단'이 된다.
JOSA = ('으로', '에서', '에게', '의', '와', '과', '은', '는', '이', '가', '을', '를', '도', '에')


def load_exam():
    rounds = {}
    for p in sorted(glob.glob(os.path.join(EXAM, '*회.json'))):
        o = json.load(open(p, encoding='utf-8'))
        rounds[str(o['round'])] = o['questions']
    return rounds


def keywords(topic):
    """topic 한 줄에서 개념 키워드를 뽑는다."""
    # 6·25는 가운뎃점으로 쪼개면 '25전쟁'이 된다. 먼저 붙여 둔다.
    t = topic.replace('6·25', '6.25').replace('4·19', '4.19').replace('5·18', '5.18')
    t = t.replace('3·1', '3.1').replace('4·3', '4.3').replace('10·26', '10.26')
    t = re.sub(r'[~·,/()\[\]]+', ' ', t)
    out = []
    for w in t.split():
        for j in JOSA:                       # 뒤에서만, 그것도 남는 말이 길 때만
            if len(w) - len(j) >= 3 and w.endswith(j):
                w = w[:-len(j)]
                break
        if len(w) < 2 or w in STOP or re.fullmatch(r'\d+', w):
            continue
        out.append(w)
    return out


def game_text():
    """게임을 네 층으로 나눠 읽는다."""
    stage, npc, quiz, talk = [], [], [], []
    for f in sorted(os.listdir(WWW)):
        if not f.endswith('.html') or f in ('index.html', '_smoke.html'):
            continue
        s = open(os.path.join(WWW, f), encoding='utf-8').read()
        if 'const ZONES = {' not in s:
            continue
        stage += re.findall(r'<title>([^<]+)</title>', s)
        stage += re.findall(r"label: '([^']+)'", s)          # 구역 이름
        stage += re.findall(r'<div>([^<]*·[^<]*)</div>', s)  # HUD 챕터명
        stage += re.findall(r'/\* ([^*]{0,400})\*/', s)[:2]  # 구역 설계 주석
        npc += re.findall(r"id:'\w+', name:'([^']+)'", s)
        npc += re.findall(r"^\s*name:\s*'([^']+)',\s*icon", s, re.M)
        quiz += re.findall(r"q:\s*'([^']+)'", s)
        quiz += re.findall(r"opts:\s*\[([^\]]+)\]", s)
        quiz += re.findall(r"feedback:\s*\[([^\]]+)\]", s)
        talk += re.findall(r"t:\s*'([^']+)'", s)
    idx = open(os.path.join(WWW, 'index.html'), encoding='utf-8').read()
    for key in ('title', 'range', 'name'):        # 시대명 · 시대 범위 · 챕터 제목
        stage += re.findall(key + r": '([^']+)'", idx)
    npc += re.findall(r"who: '([^']+)'", idx)     # 카드에 적힌 등장인물은 무대가 아니라 NPC다
    return tuple(squash(' '.join(xs)) for xs in (stage, npc, quiz, talk))


# 같은 것을 다르게 부르는 말들. 왼쪽(기출 표기)을 오른쪽(게임 표기)으로도 찾아본다.
ALIAS = {
    '을사조약': ['을사늑약'], '위만조선': ['위만'], '한일신협약': ['정미7조약'],
    '6.25전쟁': ['6.25', '한국전쟁'], '임술농민봉기': ['임술', '진주'],
    '동학농민운동': ['동학 농민 운동'], '광무개혁': ['광무'], '을미개혁': ['을미'],
    '삼국유사': ['일연'], '경국대전': ['경국대전'],
}


def squash(t):
    """게임은 '3·1 운동', 기출 색인은 '3.1운동'으로 적는다. 둘을 같은 꼴로 만든다."""
    return re.sub(r'[\s·.\-‧・]', '', t)


def main():
    args = sys.argv[1:]
    gaps_only = '--gaps' in args
    as_csv = '--csv' in args
    topn = next((int(a) for a in args if a.isdigit()), 60)

    rounds = load_exam()
    nq = sum(len(v) for v in rounds.values())

    hits = collections.Counter()        # 키워드 → 문항 수
    seen_rounds = collections.defaultdict(set)
    for r, qs in rounds.items():
        for q in qs:
            for k in set(keywords(q['topic'])):
                hits[k] += 1
                seen_rounds[k].add(r)

    stage, npc, quiz, talk = game_text()

    def level(k):
        forms = [squash(k)] + [squash(a) for a in ALIAS.get(k, [])]
        for layer, tag in ((stage, '무대'), (npc, 'NPC'), (quiz, '퀴즈'), (talk, '언급')):
            if any(f in layer for f in forms):
                return tag
        return '없음'

    rows, broad = [], []
    for k, c in hits.most_common():
        if c < 3:
            break
        rec = (k, c, len(seen_rounds[k]), level(k))
        (broad if k in BROAD else rows).append(rec)

    if '--md' in args:
        write_md(rounds, nq, broad, rows)
        return

    if as_csv:
        print('키워드,문항수,회차수,반영수준')
        for k, c, r, lv in rows:
            print(f'{k},{c},{r},{lv}')
        return

    print(f'기출 {len(rounds)}회차 · {nq}문항\n')
    print(f'■ 시대·유형 갈래 (개념이 아니라 문제의 종류) — {len(broad)}개')
    print(f'{"갈래":16s}{"문항":>4s}{"회차":>4s}  반영')
    print('-' * 40)
    for k, c, r, lv in broad[:20]:
        mark = {'무대': '★ 무대', 'NPC': '● NPC', '퀴즈': '○ 퀴즈', '언급': '· 언급', '없음': '✗ 없음'}[lv]
        print(f'{k:16s}{c:4d}{r:4d}  {mark}')
    print()
    print(f'3회 이상 나온 개념 키워드 {len(rows)}개\n')
    tally = collections.Counter(lv for _, _, _, lv in rows)
    print('반영 수준 분포: ' + ' · '.join(f'{k} {v}개' for k, v in
                                   sorted(tally.items(), key=lambda x: '무대NPC퀴즈언급없음'.find(x[0]))))
    print()

    show = [r for r in rows if r[3] != '무대'] if gaps_only else rows
    head = '무대가 아닌 키워드' if gaps_only else '전체'
    print(f'■ {head} — 빈도 높은 순 상위 {min(topn, len(show))}개')
    print(f'{"순":>3s} {"키워드":18s}{"문항":>4s}{"회차":>4s}  반영')
    print('-' * 46)
    for i, (k, c, r, lv) in enumerate(show[:topn], 1):
        mark = {'무대': '★ 무대', 'NPC': '● NPC', '퀴즈': '○ 퀴즈', '언급': '· 언급', '없음': '✗ 없음'}[lv]
        print(f'{i:3d} {k:18s}{c:4d}{r:4d}  {mark}')

    if not gaps_only:
        worst = [r for r in rows if r[3] in ('없음', '언급')][:25]
        print(f'\n■ 손도 안 댔거나 대사에만 있는 것 상위 {len(worst)}개')
        for k, c, r, lv in worst:
            print(f'    {c:3d}문항  {k:16s} {lv}')


MARK = {'무대': '★ 무대', 'NPC': '● NPC', '퀴즈': '○ 퀴즈', '언급': '· 언급만', '없음': '✗ 없음'}


def write_md(rounds, nq, broad, rows):
    out = os.path.abspath(os.path.join(WWW, '..', '커버리지_리포트.md'))
    tally = collections.Counter(lv for _, _, _, lv in rows)
    L = []
    L.append('# 기출 주제 빈도 ↔ 게임 반영 상태\n')
    L.append(f'기출 **{len(rounds)}회차 {nq}문항**의 주제를 키워드로 쪼개 빈도를 세고, '
             '각 키워드가 게임에서 어디까지 다뤄지는지 대조한 표다.\n')
    L.append('| 표시 | 뜻 |\n|---|---|\n'
             '| ★ 무대 | 챕터 제목이나 구역 이름 — 그 개념이 배경이 되는 무대다 |\n'
             '| ● NPC | 그 이름의 NPC가 서 있다 |\n'
             '| ○ 퀴즈 | 문제·보기·해설에 나온다 |\n'
             '| · 언급만 | 대사에만 스쳐 간다 |\n'
             '| ✗ 없음 | 게임 어디에도 없다 |\n')
    L.append(f'\n3회 이상 나온 개념 키워드 **{len(rows)}개** — '
             + ' · '.join(f'{MARK[k]} {v}' for k, v in
                          sorted(tally.items(), key=lambda x: '무대NPC퀴즈언급없음'.find(x[0]))) + '\n')
    L.append('\n> 다시 뽑기: `python3 www/assets/tools/coverage.py --md`\n')

    L.append('\n## 시대·유형 갈래\n\n개념이 아니라 문제의 종류다. '
             '`문화유산`·`지역사`·`세시풍속`처럼 유형 자체가 통째로 빠진 것이 보인다.\n')
    L.append('\n| 갈래 | 문항 | 회차 | 반영 |\n|---|---:|---:|---|\n')
    for k, c, r, lv in broad:
        L.append(f'| {k} | {c} | {r} | {MARK[lv]} |\n')

    L.append('\n## 빈도 높은데 무대가 아닌 것 (상위 50)\n\n'
             '기출률 높은 개념은 맵이나 메인 무대로 올린다는 원칙에 비추어, '
             '다음 챕터 후보가 여기 있다.\n')
    L.append('\n| # | 키워드 | 문항 | 회차 | 반영 |\n|---:|---|---:|---:|---|\n')
    for i, (k, c, r, lv) in enumerate([x for x in rows if x[3] != '무대'][:50], 1):
        L.append(f'| {i} | {k} | {c} | {r} | {MARK[lv]} |\n')

    gaps = [x for x in rows if x[3] in ('없음', '언급')]
    L.append(f'\n## 게임에 없거나 대사에만 있는 것 — {len(gaps)}개 전부\n')
    L.append('\n| 키워드 | 문항 | 회차 | 반영 |\n|---|---:|---:|---|\n')
    for k, c, r, lv in gaps:
        L.append(f'| {k} | {c} | {r} | {MARK[lv]} |\n')

    L.append(f'\n## 전체 {len(rows)}개\n')
    L.append('\n| # | 키워드 | 문항 | 회차 | 반영 |\n|---:|---|---:|---:|---|\n')
    for i, (k, c, r, lv) in enumerate(rows, 1):
        L.append(f'| {i} | {k} | {c} | {r} | {MARK[lv]} |\n')

    open(out, 'w', encoding='utf-8').write(''.join(L))
    print(f'{out}\n  개념 {len(rows)}개 · 갈래 {len(broad)}개 · 구멍 {len(gaps)}개')


if __name__ == '__main__':
    main()
