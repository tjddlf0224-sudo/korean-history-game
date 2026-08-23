#!/usr/bin/env python3
"""author_specs.py의 NPC 대사에 새 칸(beat)을 끼워 넣는 도우미.

대사 목록이 파이썬 리터럴로 적혀 있어 손으로 넣다 보면 따옴표·들여쓰기가
어긋난다. NPC 키로 위치를 찾아 원하는 자리에 한 칸 넣어 준다.

  from add_beat import insert
  insert('sinmun_0',
         text='개혁을 한 줄로 놓고 보게.',
         chart={'head':[...], 'rows':[[...]], 'note':'...'},
         before='가장 손이 아팠던 건')     # 이 말로 시작하는 칸 앞에 넣는다
                                          # before를 안 주면 맨 끝에 붙인다
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'author_specs.py')


def _lit(v, ind=0):
    """파이썬 리터럴로 예쁘게. dict는 한 줄, list는 필요하면 여러 줄."""
    if isinstance(v, dict):
        return '{' + ', '.join(f'{_lit(k)}:{_lit(x)}' for k, x in v.items()) + '}'
    if isinstance(v, list):
        return '[' + ', '.join(_lit(x) for x in v) + ']'
    if isinstance(v, str):
        return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    return repr(v)


def insert(npc_key, text, chart=None, before=None, path=SRC):
    s = open(path, encoding='utf-8').read()
    m = re.search(r"npc\('%s'\s*,[^\[]*\[" % re.escape(npc_key), s)
    assert m, f'{npc_key} 대사 목록을 못 찾음'
    start = m.end()                      # beats 리스트 '[' 바로 다음
    depth, i = 1, start
    while depth:                         # 대괄호 짝을 세어 beats 끝을 찾는다
        if s[i] == '[':
            depth += 1
        elif s[i] == ']':
            depth -= 1
        i += 1
    end = i - 1                          # beats 리스트를 닫는 ']' 위치

    beat = {'t': text}
    if chart:
        beat['chart'] = chart
    piece = '\n    ' + _lit(beat) + ','

    if before:
        j = s.find("'" + before, start)
        assert j != -1 and j < end, f'{npc_key}에서 "{before}"로 시작하는 칸을 못 찾음'
        k = s.rfind('\n', start, j)      # 그 칸이 시작하는 줄 앞
        s = s[:k] + piece + s[k:]
    else:
        s = s[:end].rstrip().rstrip(',') + ',' + piece + '\n    ' + s[end:]

    open(path, 'w', encoding='utf-8').write(s)
    return True
