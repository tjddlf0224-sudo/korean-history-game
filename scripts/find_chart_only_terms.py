# -*- coding: utf-8 -*-
"""도해에만 나온 말을 대사가 이미 아는 것처럼 쓰는 자리를 찾는다.

   무엇이 문제인가
   - 도해(chart)는 **그 대사 한 마디에만** 뜨고 다음 마디로 넘어가면 사라진다.
     그래서 도해에만 적힌 낱말·숫자를 몇 마디 뒤 대사가 아무 설명 없이
     꺼내면, 듣는 사람 눈에는 난데없다.
   - 실제로 대가야 왕 대목이 그랬다. '순장'과 사람 수가 두 마디 앞 숫자표에만
     있었는데, 주인공이 대뜸 "그 많은 사람이 순장이라니" 하고 놀랐다.
     제보: "순장에 대해 설명하지도 않는데 주인공이 갑자기 …"

   어떻게 찾나
   - 대화마다 앞에서부터 훑으며 두 자루를 채운다.
       말한 것  — 지금까지 대사(t)에 나온 글자
       그린 것  — 지금까지 도해(chart) 안에 있던 글자
   - 이번 대사에 나온 낱말이 **그린 것에는 있는데 말한 것에는 없으면** 후보다.
     즉 "그림으로만 스쳤을 뿐 한 번도 입에 올린 적 없는 말".
   - 사람 이름·땅 이름은 원래 도해와 대사가 같이 쓰므로 시끄럽다.
     그래서 **주인공(me)이 꺼내는 경우**와 놀람·확인 말투를 더 무겁게 본다.

   쓰는 법
     python3 scripts/find_chart_only_terms.py
     python3 scripts/find_chart_only_terms.py --all     # 약한 후보까지
"""
import argparse
import glob
import io
import os
import re

WWW = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

# 조사·흔한 말은 빼고 본다. 낱말로 쳐 봐야 뜻이 없다.
STOP = set('''
그 저 이 것 수 때 곳 말 일 뒤 앞 안 밖 위 아래 사람 나라 임금 왕 우리 자네 그대
하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 오늘 지금 여기 거기 무엇 어디 누구
'''.split())

# 놀람·확인하는 말투 — 이런 자리에서 처음 나오면 더 어색하다
SURPRISE = ('라니', '이나요', '입니까', '이라고', '말입니까', '그렇게', '그 많은',
            '벌써', '설마', '어찌', '나요?')


def balanced(s, i, o, c):
    d = 0
    while i < len(s):
        if s[i] == o:
            d += 1
        elif s[i] == c:
            d -= 1
            if d == 0:
                return i
        i += 1
    return -1


def split_objects(s):
    """최상위 { ... } 항목만 나눈다."""
    out, d, st = [], 0, None
    for i, ch in enumerate(s):
        if ch == '{':
            if d == 0:
                st = i
            d += 1
        elif ch == '}':
            d -= 1
            if d == 0:
                out.append(s[st:i + 1])
    return out


def strings_in(s):
    """작은따옴표 문자열을 모은다(\\' 는 건너뛴다)."""
    return re.findall(r"'((?:[^'\\]|\\.)*)'", s)


def words(text):
    """두 글자 이상 한글 덩어리만 낱말로 본다."""
    out = []
    for w in re.findall(r'[가-힣]{2,}', text):
        # 조사가 붙은 채로는 못 맞추므로, 앞 2~5글자를 후보로 함께 본다
        for n in range(len(w), 1, -1):
            out.append(w[:n])
    return out


def parse(path):
    """NPC_DATA에서 대화별 (who, 대사, 도해 글자) 목록을 뽑는다."""
    s = io.open(path, encoding='utf-8').read()
    i = s.find('const NPC_DATA')
    if i < 0:
        return {}
    body = s[s.find('{', i) + 1:balanced(s, s.find('{', i), '{', '}')]
    talks = {}
    for m in re.finditer(r'\n  (\w+):\s*\{', body):
        k = balanced(body, body.index('{', m.end() - 1), '{', '}')
        blk = body[m.end():k]
        mb = re.search(r'beats:\s*\[', blk)
        if not mb:
            continue
        e = balanced(blk, blk.index('[', mb.end() - 1), '[', ']')
        beats = []
        for t in split_objects(blk[mb.end():e]):
            who = (re.search(r"who:\s*'(\w+)'", t) or [None, '?'])[1]
            mt = re.search(r"\bt:\s*'((?:[^'\\]|\\.)*)'", t)
            text = mt.group(1) if mt else ''
            mc = re.search(r'chart:\s*\{', t)
            chart = ''
            if mc:
                ce = balanced(t, t.index('{', mc.end() - 1), '{', '}')
                chart = ' '.join(strings_in(t[mc.end():ce]))
            beats.append((who, text, chart))
        talks[m.group(1)] = beats
    return talks


def scan(path, loose):
    hits = []
    for talk, beats in parse(path).items():
        said, drawn = '', ''
        for idx, (who, text, chart) in enumerate(beats):
            new = []
            for w in set(words(text)):
                if len(w) < 2 or w in STOP:
                    continue
                if w in drawn and w not in said:
                    new.append(w)
            if new and not chart:
                # 지금 화면에 도해가 떠 있으면 문제가 아니다 — 눈앞에 있으니까.
                # 도해 없이, 그림으로만 스쳤던 말을 꺼내는 자리만 본다.
                term = max(new, key=len)
                # 그 말을 마지막으로 그린 것이 몇 마디 전인가
                gap = None
                for back in range(idx - 1, -1, -1):
                    if term in beats[back][2]:
                        gap = idx - back
                        break
                strong = (who == 'me' or any(k in text for k in SURPRISE)) and (gap or 0) >= 2
                if strong or loose:
                    hits.append((os.path.basename(path), talk, idx, who, term, text, strong, gap))
            said += ' ' + text
            drawn += ' ' + chart
    return hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--all', action='store_true', help='약한 후보까지 본다')
    a = ap.parse_args()

    rows = []
    for f in sorted(glob.glob(os.path.join(WWW, '*.html'))):
        rows += scan(f, a.all)

    strong = [r for r in rows if r[6]]
    print('훑은 챕터 %d개 · 후보 %d곳(무거운 것 %d곳)\n'
          % (len(glob.glob(os.path.join(WWW, '*.html'))), len(rows), len(strong)))
    for f, talk, idx, who, term, text, st, gap in (rows if a.all else strong):
        print('%-18s %-16s #%-2d %-4s [%s] · %s마디 전 도해에만'
              % (f, talk, idx, who, term, gap))
        print('     %s' % text[:90])


if __name__ == '__main__':
    main()
