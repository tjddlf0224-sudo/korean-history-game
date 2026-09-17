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
    open(path, 'w', encoding='utf-8').write(s)
    print('ok', path)
