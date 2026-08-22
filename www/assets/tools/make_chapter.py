#!/usr/bin/env python3
"""챕터 스펙(JSON) → 챕터 HTML 생성기.

왜 생성기인가:
  챕터를 손으로 하나씩 만들다 보니 구조가 조금씩 어긋났고, 그 결과 공통 개선을
  넣을 때마다 특정 챕터에서만 빠지는 일이 반복됐다(0화가 대표적 — DPR 대응,
  화자 색 구분, 다음 목표, 장소 라벨, 캐시 무효화 5가지가 한꺼번에 빠져 있었다).
  틀을 하나로 두고 데이터만 갈아끼우면 그 문제가 구조적으로 사라진다.

틀: ch6.html
  (퀴즈 엔진 O, 보스전 X, 단일 구역 — 가장 군더더기 없는 챕터)
  틀을 고치면 `--all`로 전 챕터를 다시 찍어내면 된다.

쓰는 법:
  python3 make_chapter.py specs/goryeo1.json
  python3 make_chapter.py --all          # specs/ 전부
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.abspath(os.path.join(HERE, '..', '..'))
TEMPLATE = os.path.join(WWW, 'ch6.html')
SPEC_DIR = os.path.join(HERE, 'specs')


def js(o, indent=6):
    """파이썬 값을 읽기 좋은 JS 리터럴로."""
    pad = ' ' * indent
    if isinstance(o, dict):
        inner = ', '.join(f'{k}: {js(v, 0)}' for k, v in o.items())
        return '{ ' + inner + ' }'
    if isinstance(o, list):
        if not o:
            return '[]'
        return '[\n' + ''.join(f'{pad}{js(x, indent)},\n' for x in o) + ' ' * (indent - 2) + ']'
    if isinstance(o, str):
        return "'" + o.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n') + "'"
    if isinstance(o, bool):
        return 'true' if o else 'false'
    if o is None:
        return 'null'
    return str(o)


def zones_block(spec):
    out = ['const ZONES = {']
    if spec.get('zoneNote'):
        out.append('  /* ' + spec['zoneNote'] + ' */')
    for z in spec['zones']:
        out.append(f"  {z['id']}: {{")
        if z.get('note'):
            out.append('    // ' + z['note'])
        out.append(f"    img: '{z['img']}', label: '{z['label']}',")
        out.append(f"    spawn: {{ x: {z['spawn'][0]}, y: {z['spawn'][1]} }},")
        out.append('    barriers: [')
        for b in z.get('barriers', []):
            c = ('  // ' + b[4]) if len(b) > 4 else ''
            out.append(f'      {{ x0:{b[0]}, y0:{b[1]}, x1:{b[2]}, y1:{b[3]} }},{c}')
        out.append('    ],')
        out.append('    npcs: [')
        for n in z.get('npcs', []):
            look = n.get('look', {})
            out.append(
                f"      {{ id:'{n['id']}', name:'{n['name']}', x:{n['x']}, y:{n['y']}, "
                f"img:'assets/portraits/{n['id']}.png', "
                f"look:{{ role:'{look.get('role','commoner')}', body:'{look.get('body','#8a6d3b')}', "
                f"accent:'{look.get('accent','#c9a24a')}' }} }},")
        out.append('    ],')
        exits = z.get('exits', [])
        if not exits:
            out.append('    exits: [],')
        else:
            out.append('    exits: [')
            for e in exits:
                r = e['rect']
                out.append(f"      {{ rect:{{x0:{r[0]},y0:{r[1]},x1:{r[2]},y1:{r[3]}}}, to:'{e['to']}', "
                           f"spawn:{{x:{e['spawn'][0]},y:{e['spawn'][1]}}}, label:'{e['label']}' }},")
            out.append('    ],')
        out.append('  },')
    out.append('};')
    return '\n'.join(out)


def npcdata_block(spec):
    out = ['const NPC_DATA = {']
    for key, d in spec['npcData'].items():
        out.append(f'  {key}: {{')
        if d.get('note'):
            out.append('    // ' + d['note'])
        out.append(f"    name: '{d['name']}', icon: '{d.get('icon','👤')}', img: 'assets/portraits/{d['portrait']}.png',")
        out.append('    beats: [')
        for b in d['beats']:
            t = js(b['t'], 0)
            extra = ''
            if b.get('speaker'):
                extra = (f", name:'{b['speaker']['name']}', icon:'{b['speaker'].get('icon','👤')}'"
                         f", img:'assets/portraits/{b['speaker']['portrait']}.png'")
            out.append(f"      {{ who:'npc'{extra}, t:{t} }},")
        out.append('    ],')
        qs = d.get('quiz', [])
        if qs:
            out.append('    quizSeq: [')
            for q in qs:
                out.append(f"      {{ q:{js(q['q'],0)},")
                out.append(f"        opts:[{js(q['opts'][0],0)},{js(q['opts'][1],0)}], answer:0, src:{q['src']},")
                out.append(f"        feedback:[{js(q['fb'][0],0)},{js(q['fb'][1],0)}] }},")
            out.append('    ]')
        else:
            out.append('    quiz: null')
        if d.get('endsChapter'):
            out[-1] += ','
            out.append('    endsChapter: true')
        out.append('  },')
    out.append('};')
    return '\n'.join(out)


def build(spec):
    s = open(TEMPLATE, encoding='utf-8').read()
    L = s.split('\n')

    def find(pred, start=0):
        for i in range(start, len(L)):
            if pred(L[i]):
                return i
        raise AssertionError('못 찾음')

    def cut(a_pred, b_pred, new):
        nonlocal L
        a = find(a_pred)
        b = find(b_pred, a)
        L = L[:a] + new.split('\n') + L[b:]

    cut(lambda l: l.startswith('const ZONES = {'), lambda l: l.startswith('const zoneImgs'), zones_block(spec))
    cut(lambda l: l.startswith('const NPC_DATA = {'), lambda l: l.startswith('const Stage = {'), npcdata_block(spec))
    a = find(lambda l: l.startswith('const INTRO_LINES'))
    b = find(lambda l: l.startswith('let introIdx'), a)
    L = L[:a] + ['const INTRO_LINES = ['] + [f'  {js(x,0)},' for x in spec['intro']] + ['];'] + L[b:]
    s = '\n'.join(L)

    def sub(pat, rep, tag, cnt=1):
        nonlocal s
        assert re.search(pat, s), f'{tag} 못 찾음'
        s = re.sub(pat, lambda m: rep, s, count=cnt)

    first = spec['zones'][0]['id']
    s = re.sub(r"zone: '\w+', px: ZONES\.\w+\.spawn\.x, py: ZONES\.\w+\.spawn\.y",
               lambda m: f"zone: '{first}', px: ZONES.{first}.spawn.x, py: ZONES.{first}.spawn.y", s)

    sub(r'<title>.*?</title>', f"<title>한국사 게임 - {spec['num']} {spec['name']}</title>", 'title')
    sub(r'<div id="hud">\n(?:.*\n)*?  </div>',
        f'<div id="hud">\n    <div>{spec["num"]} · {spec["name"]}</div>\n'
        f'    <div class="sub">{spec["sub"]}</div>\n    <div class="sub" id="hud-goal"></div>\n  </div>', 'hud')
    e = spec['ending']
    sub(r'<div id="end-screen">\n(?:.*\n)*?  </div>\n',
        f'<div id="end-screen">\n    <div>\n      <h2>{spec["num"]} · 끝</h2>\n'
        + ''.join(f'      <p>{p}</p>\n' for p in e['lines'])
        + f'      <p style="margin-top:18px; opacity:.7;">{e["next"]}</p>\n'
        f'      <div><a href="{spec["nextHref"]}">다음 화로</a><a href="index.html">챕터 목록</a></div>\n'
        '    </div>\n  </div>\n', 'end')

    main, others = spec['talkers'][0], spec['talkers'][1:]
    keyfor = [f"    if (id === '{main['id']}') return '{main['id']}_' + Math.min(Stage.state.talkStage, {main['stages']-1});"]
    keyfor += [f"    if (id === '{o['id']}') return '{o['id']}_0';" for o in others]
    sub(r"  keyFor\(id\)\{\n(?:.*\n)*?    return null;\n  \},",
        '  keyFor(id){\n' + '\n'.join(keyfor) + '\n    return null;\n  },', 'keyFor')
    sub(r"if \(this\.npc\.id === '\w+'\)\{", f"if (this.npc.id === '{main['id']}'){{", 'afterQuiz')
    sub(r"Stage\.state\.talkStage = Math\.min\(Stage\.state\.talkStage \+ 1, \d+\)",
        f"Stage.state.talkStage = Math.min(Stage.state.talkStage + 1, {main['stages']-1})", 'talkStage')

    goal_else = others[0]['goal'] if others else main['goal']
    sub(r"const t = done \? '다음 목표: 다음 화로 넘어가기'[\s\S]*?;\n",
        "const t = done ? '다음 목표: 다음 화로 넘어가기'\n"
        f"    : '다음 목표: ' + (Stage.state.talkStage < {main['stages']-1} ? '{main['goal']}' : '{goal_else}');\n", '목표')
    sub(r"document\.getElementById\('dlg-tag'\)\.textContent = '[^']*';",
        f"document.getElementById('dlg-tag').textContent = '{spec['tag']}';", 'dlg-tag')

    s = s.replace('/* 사료 근거:', '/* 이 챕터는 make_chapter.py가 스펙에서 찍어낸 것이다. 고치려면 스펙을\n'
                                   '   고치고 다시 생성할 것 — 여기서 직접 고치면 다음 생성 때 사라진다.\n'
                                   '   사료 근거:', 1)
    # 틀(ch6)에 남아 있던 6화 전용 설명을 이 챕터 것으로 갈아끼운다.
    labels = ' / '.join(z['label'] for z in spec['zones'])
    s = re.sub(r'   6화는 [^\n]*\n(?:   [^\n]*\n)*?   World\.zone은 항상 [^\n]*\*/',
               lambda m: (f"   무대는 {labels}. 좌표(배리어·출구·NPC 위치)는 배경 그림을 격자로\n"
                          f"   재서 스펙에 적어 둔다 — 배경을 바꾸면 스펙의 좌표도 같이 고쳐야 한다. */"), s, count=1)
    return s


def main():
    args = sys.argv[1:]
    specs = (sorted(os.path.join(SPEC_DIR, f) for f in os.listdir(SPEC_DIR) if f.endswith('.json'))
             if args == ['--all'] else args)
    for p in specs:
        spec = json.load(open(p, encoding='utf-8'))
        out = os.path.join(WWW, spec['id'] + '.html')
        open(out, 'w', encoding='utf-8').write(build(spec))
        nq = sum(len(d.get('quiz', [])) for d in spec['npcData'].values())
        print(f"{spec['id']+'.html':22s} 구역 {len(spec['zones'])} · "
              f"NPC {sum(len(z.get('npcs',[])) for z in spec['zones'])} · 퀴즈 {nq}")


if __name__ == '__main__':
    main()
