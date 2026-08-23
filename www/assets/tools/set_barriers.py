#!/usr/bin/env python3
"""author_specs.py의 구역 하나에 배리어와 NPC 자리를 박아 넣는 도우미.

스펙을 손으로 고치다 보면 따옴표·들여쓰기가 조금씩 달라 문자열 치환이 자꾸
빗나간다. 구역 id로 위치를 찾아 'barriers' 배열만 통째로 갈아끼우고, NPC는
id로 찾아 x·y만 바꾼다.

  from set_barriers import patch
  patch('samguk',
        barriers=[[0,0,1376,175,'성벽'], ...],
        spawn=(688,470),
        npcs={'muryeong':(430,330), 'hwarang':(688,545)})

배리어 한 줄은 [x0,y0,x1,y1] 또는 [x0,y0,x1,y1,'설명']이다.
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'author_specs.py')


def _fmt(barriers, indent='     '):
    out = ['[\n']
    for b in barriers:
        note = f",'{b[4]}'" if len(b) > 4 else ''
        out.append(f'{indent}[{b[0]},{b[1]},{b[2]},{b[3]}{note}],\n')
    out.append(indent[:-2] + ']')
    return ''.join(out)


def patch(zone_id, barriers=None, spawn=None, npcs=None, note=None, path=SRC):
    s = open(path, encoding='utf-8').read()
    m = re.search(r"'id':\s*'%s'\s*," % re.escape(zone_id), s)
    assert m, f'구역 {zone_id}을 못 찾음'
    start = m.end()
    end = s.index("'npcs'", start)
    seg = s[start:end]

    if spawn is not None:
        seg2 = re.sub(r"'spawn':\s*\[\d+\s*,\s*\d+\]", f"'spawn':[{spawn[0]},{spawn[1]}]", seg)
        assert seg2 != seg or f'[{spawn[0]},{spawn[1]}]' in seg, f'{zone_id} spawn 못 바꿈'
        seg = seg2
    if barriers is not None:
        b = re.search(r"'barriers':\s*\[", seg)
        assert b, f'{zone_id} barriers 못 찾음'
        depth, i = 0, b.end() - 1
        while True:                       # 대괄호 짝을 세어 배열 끝을 찾는다
            if seg[i] == '[':
                depth += 1
            elif seg[i] == ']':
                depth -= 1
                if depth == 0:
                    break
            i += 1
        # note가 여러 줄이면 모든 줄에 #을 붙여야 한다 — 안 그러면 둘째 줄부터
        # 파이썬 코드로 읽혀 문법 오류가 난다(실제로 이렇게 깨진 적이 있다:
        # author_specs.py가 조용히 실패해 spec이 갱신 안 된 걸 모르고 넘어갔었다).
        head = ('\n   ' + '\n   '.join('# ' + ln for ln in note.split('\n')) + '\n   ') if note else ''
        seg = seg[:b.start()] + head + "'barriers':" + _fmt(barriers) + seg[i + 1:]
    s = s[:start] + seg + s[end:]

    if npcs:
        # NPC는 구역 블록 안에서만 찾는다(같은 id가 다른 챕터에 또 있을 수 있다)
        zs = s.index("'id':'%s'" % zone_id) if ("'id':'%s'" % zone_id) in s else m.start()
        ze = s.index("'exits'", zs) if "'exits'" in s[zs:] else len(s)
        blk = s[zs:ze]
        for nid, (x, y) in npcs.items():
            pat = r"(\{'id':'%s','name':'[^']*','x':)\d+(,'y':)\d+" % re.escape(nid)
            new = re.sub(pat, lambda mm: f'{mm.group(1)}{x}{mm.group(2)}{y}', blk)
            assert new != blk, f'{zone_id}의 NPC {nid} 못 찾음'
            blk = new
        s = s[:zs] + blk + s[ze:]

    open(path, 'w', encoding='utf-8').write(s)
    return True
