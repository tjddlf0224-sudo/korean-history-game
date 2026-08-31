#!/usr/bin/env python3
"""챕터 파일에서 인물 카드 데이터를 뽑아 assets/heroes_data.js 를 만든다.

챕터의 NPC나 대화가 바뀌면 다시 돌린다. heroes_data.js 는 손으로 고치지 않는다.

  python3 assets/tools/gen_heroes.py

무엇을 뽑는가
- 이름·초상·시대: NPC 정의와 index.html 의 시대 구분에서
- 대화 키: NPC_DATA 에서 `<npcId>_...` 인 것 중 **퀴즈가 있는 것만**.
  퀴즈 없는 대화(sejong_wait 같은 안내용)까지 세면 영영 못 채우는 카드가 생긴다.

같은 인물이 여러 챕터에 나오면(흥선대원군) 초상 파일명을 키로 삼아 하나로 묶는다.
초상이 없는 인물은 NPC id 를 키로 쓰고, 도감에서는 실루엣으로 보인다.
"""
import re, glob, os, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SKIP = {'_ranktest.html', '_bosstest.html', '_smoke.html',
        'index.html', 'exam_practice.html', 'prologue.html'}


def main():
    os.chdir(ROOT)

    # 도감 정렬을 챕터 목록과 같게 맞춘다 — 다른 순서면 찾기 어렵다
    idx = open('index.html', encoding='utf-8').read()
    era_of, era_order = {}, []
    for em in re.finditer(r"\{ title: '([^']+)',[^\[]*cards: \[(.*?)\n  \] \}", idx, re.S):
        era_order.append(em.group(1))
        for hm in re.finditer(r"href: '(\w+\.html)'", em.group(2)):
            era_of[hm.group(1)] = em.group(1)

    heroes = {}
    for f in sorted(glob.glob('*.html')):
        b = os.path.basename(f)
        if b in SKIP:
            continue
        s = open(f, encoding='utf-8').read()
        if 'const ZONES' not in s:
            continue
        for nid, name, rest in re.findall(
                r"\{\s*id:\s*'(\w+)',\s*name:\s*'([^']+)'((?:(?!\},).)*)\}", s, re.S):
            m = re.search(r"img:\s*'([^']+)'", rest)
            img = m.group(1) if m else None
            # 지도에 초상을 안 쓰는 인물도 있다 — 반신 초상은 지도에서 머리만
            # 떠 보여서 img를 빼고 실루엣으로 그리기 때문이다(대화창에는 그대로
            # 뜬다). 그럴 때는 NPC_DATA 쪽 초상을 가져온다.
            if not img:
                # 블록 안에서만 찾는다. 다음 인물까지 넘어가면 엉뚱한 얼굴이
                # 붙는다 — 실제로 김홍집에게 최익현 초상이 붙었다.
                bm = re.search(r"^  %s_\w+:\s*\{([\s\S]*?)(?=\n  \w+:\s*\{|\n\};)"
                               % re.escape(nid), s, re.M)
                if bm:
                    dm = re.search(r"img:\s*'([^']+)'", bm.group(1))
                    if dm:
                        img = dm.group(1)
            rm = re.search(r"role:\s*'(\w+)'", rest)
            role = rm.group(1) if rm else 'commoner'
            key = os.path.splitext(os.path.basename(img))[0] if img else nid
            talks = []
            for km in re.finditer(r"^  (%s_\w+):\s*\{(.*?)^  \}," % re.escape(nid), s, re.S | re.M):
                if re.search(r"\{\s*q:\s*[\"']", km.group(2)):
                    talks.append(km.group(1))
            if not talks:
                continue
            if key in heroes:
                prev = heroes[key]['ch'].get(b, [])
                heroes[key]['ch'][b] = sorted(set(prev + talks))
            else:
                heroes[key] = {'n': name, 'p': (os.path.basename(img) if img else None),
                               'e': era_of.get(b, '기타'), 'r': role,
                               'ch': {b: sorted(set(talks))}}

    order = {e: i for i, e in enumerate(era_order)}
    items = sorted(heroes.items(), key=lambda kv: (order.get(kv[1]['e'], 99), kv[1]['n']))

    lines = []
    for k, v in items:
        ch = ', '.join(f"'{c}':[{','.join(repr(t) for t in ts)}]"
                       for c, ts in sorted(v['ch'].items()))
        p = f"'{v['p']}'" if v['p'] else 'null'
        lines.append(f"    {k}: {{ n:'{v['n']}', p:{p}, e:'{v['e']}', r:'{v.get('r','commoner')}', ch:{{{ch}}} }},")

    out = ("/* 인물 카드 데이터 — 챕터 파일에서 뽑아 생성한다(assets/tools/gen_heroes.py).\n"
           "   손으로 고치지 말 것. 챕터의 NPC나 대화가 바뀌면 다시 뽑는다.\n\n"
           "   n=이름  p=초상 파일  e=시대(챕터 목록과 같은 구분)  r=역할(능력치의 근거)\n"
           "   ch={챕터: [퀴즈가 있는 대화 키]}  — 이 대화를 전부 끝내야 카드를 얻는다\n"
           f"   인물 {len(items)}명 */\n"
           "window.HERO_DATA = (function(){\n  return {\n" + "\n".join(lines) + "\n  };\n})();\n")
    open('assets/heroes_data.js', 'w', encoding='utf-8').write(out)

    print(f'인물 {len(items)}명 → assets/heroes_data.js')
    c = collections.Counter(v['e'] for _, v in items)
    for e in era_order:
        print(f'  {e}: {c.get(e, 0)}명')


if __name__ == '__main__':
    main()
