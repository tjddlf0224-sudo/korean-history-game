# -*- coding: utf-8 -*-
"""챕터 대사·퀴즈를 안전하게 끼워 넣는 도우미.

edit(path, pairs, quiz_add)
  pairs    — [(원문, 바꿀 글)] : 원문이 **정확히 한 번** 있어야 한다(아니면 멈춘다).
  quiz_add — [(대화키, 다음 대화키 또는 None, 넣을 퀴즈 글)] : 그 대화의
             quizSeq 맨 끝에 붙인다. 모두 확인한 뒤에만 파일을 쓴다."""
import re


def edit(path, pairs=(), quiz_add=()):
    s = open(path, encoding='utf-8').read()
    for a, b in pairs:
        n = s.count(a)
        if n != 1:
            raise SystemExit(f'{path}: 원문이 {n}번 — {a[:70]!r}')
        s = s.replace(a, b)
    for key, nxt, txt in quiz_add:
        i = s.index('  ' + key + ': {')
        j = s.index('  ' + nxt + ': {') if nxt else s.index('\n};\n', i)
        blk = s[i:j]
        m = list(re.finditer(r'\n    \],?\n', blk))
        if not m:
            raise SystemExit(f'{path}: {key}의 quizSeq 끝을 못 찾음')
        k = m[-1].start() + 1
        blk = blk[:k] + txt + blk[k:]
        s = s[:i] + blk + s[j:]
    # 도해를 기다리는 대사(끝이 `',`) 바로 다음 줄에 새 대사가 오면 문법이 깨진다.
    # 2026-09-17 고려 1·4화에서 실제로 났다 — 쓰기 전에 막는다.
    lines = s.split('\n')
    for n in range(len(lines) - 1):
        if re.search(r"\bt:'(?:[^'\\]|\\.)*',\s*$", lines[n]) and lines[n + 1].lstrip().startswith('{ who:'):
            raise SystemExit(f'{path}:{n + 1}: 도해를 기다리는 대사 뒤에 새 대사가 끼었음')
    open(path, 'w', encoding='utf-8').write(s)
    print('ok', path)
