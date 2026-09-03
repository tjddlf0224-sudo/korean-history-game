#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JSON으로 받은 새 대사를 챕터 HTML의 beats에 넣는다.

   왜 JSON을 거치나
   - JS를 손으로 쓰면 따옴표·쉼표 하나에 챕터가 통째로 죽는다. 실제로 겪었다:
     beats 뒤에 쉼표가 없는 NPC에서 치환이 **NPC를 닫는 괄호까지 먹어**
     SyntaxError로 챕터가 안 열렸다.
   - JSON으로 받아 이 도구가 JS를 찍어 내면 그런 사고가 안 난다.

   무엇을 지키나
   - quizSeq·name·img·icon은 건드리지 않는다. beats만 갈아끼운다.
   - 배열을 닫는 ']' 바로 뒤의 쉼표까지만 삼킨다(그 뒤 '}'는 절대 안 건드린다).
   - 넣기 전에 그림 파일이 실제로 있는지, 도해 종류가 있는 것인지 검사한다.
   - 넣은 뒤 인라인 스크립트를 node --check로 돌려 문법을 확인한다.
     하나라도 깨지면 **원래대로 되돌린다**.

   쓰는 법
     python3 scripts/apply_beats.py beats_godae1.json
     python3 scripts/apply_beats.py --check-only beats_godae1.json
"""
import json, sys, os, re, subprocess, shutil, tempfile

WWW = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

TYPES = {'timeline','compare','relic','faces','quote','stat','pyramid','vs',
         'map','steps','grid','callout','bar','flow','tree','kings'}


def js_str(s):
    """JS 작은따옴표 문자열로. 줄바꿈은 <br>로 이미 들어와 있어야 한다."""
    return "'" + str(s).replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ') + "'"


def js_val(v, ind):
    if isinstance(v, bool):  return 'true' if v else 'false'
    if isinstance(v, (int, float)): return repr(v)
    if isinstance(v, str):   return js_str(v)
    if isinstance(v, list):
        return '[ ' + ', '.join(js_val(x, ind) for x in v) + ' ]'
    if isinstance(v, dict):
        return '{ ' + ', '.join('%s:%s' % (k, js_val(x, ind)) for k, x in v.items()) + ' }'
    return 'null'


def beats_js(beats, ind='    '):
    out = [ind + 'beats: [']
    for b in beats:
        line = ind + '  { who:' + js_str(b.get('who', 'npc')) + ', t:' + js_str(b['t'])
        for k in ('name', 'img', 'icon', 'docImg'):
            if b.get(k): line += ', %s:%s' % (k, js_str(b[k]))
        if b.get('chart'):
            line += ',\n' + ind + '    chart:' + js_val(b['chart'], ind)
        line += ' },'
        out.append(line)
    out.append(ind + '],')
    return '\n'.join(out)


def check_assets(data, problems):
    """가리키는 그림이 실제로 있는지 — 없는 파일은 빈 칸으로 뜬다."""
    for key, beats in data['npcs'].items():
        for i, b in enumerate(beats):
            c = b.get('chart')
            if not c: continue
            t = c.get('type')
            if t and t not in TYPES:
                problems.append('%s[%d] 없는 도해 종류: %s' % (key, i, t))
            if t == 'relic':
                for it in c.get('items', []):
                    p = os.path.join(WWW, 'assets/items', it.get('img', '') + '.png')
                    if not os.path.exists(p):
                        problems.append('%s[%d] 없는 유물 그림: items/%s.png' % (key, i, it.get('img')))
            if t == 'faces':
                for it in c.get('people', []):
                    p = os.path.join(WWW, 'assets/portraits', it.get('img', '') + '.png')
                    if not os.path.exists(p):
                        problems.append('%s[%d] 없는 초상: portraits/%s.png' % (key, i, it.get('img')))
            if t and t not in ('bar','flow','tree','kings') and not c.get('title'):
                problems.append('%s[%d] 도해에 title이 없다' % (key, i))


def replace_beats(s, npc_key, new_js):
    """그 NPC의 beats 배열만 갈아끼운다. 배열 뒤 쉼표까지만 삼킨다."""
    m = re.search(r'\n  ' + re.escape(npc_key) + r':\s*\{', s)
    if not m: return s, '못 찾음'
    bi = s.find('    beats: [', m.end())
    if bi < 0: return s, 'beats 없음'
    d, j = 0, s.find('[', bi)
    while j < len(s):
        if s[j] == '[': d += 1
        elif s[j] == ']':
            d -= 1
            if d == 0: break
        j += 1
    end = j + 1
    if end < len(s) and s[end] == ',': end += 1     # ']' 뒤 쉼표까지만
    return s[:bi] + new_js + s[end:], None


def syntax_ok(path):
    s = open(path, encoding='utf-8').read()
    for code in re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', s, re.S):
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
            f.write(code); tmp = f.name
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        os.unlink(tmp)
        if r.returncode:
            return False, r.stderr.strip().split('\n')[:4]
    return True, None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    check_only = '--check-only' in sys.argv
    if not args:
        print('쓰는 법: apply_beats.py [--check-only] <beats.json> ...'); return 1

    for jf in args:
        data = json.load(open(jf, encoding='utf-8'))
        chapter = data['chapter']
        path = os.path.join(WWW, chapter)
        print('\n=== %s ← %s' % (chapter, os.path.basename(jf)))
        if not os.path.exists(path):
            print('  ❌ 챕터 파일이 없다'); continue

        problems = []
        check_assets(data, problems)
        if problems:
            print('  ⚠️  %d건' % len(problems))
            for p in problems[:12]: print('     -', p)
            if check_only: continue

        if check_only:
            # 유산 사진(docImg)의 글은 대사가 아니라 **캡션**이다. 출처까지 적으므로
            # 길 수밖에 없고, 화면에서도 이름표 없이 사진 아래에 따로 뜬다.
            # 길이·비율 통계에서 빼야 실제 대사가 어떤지 보인다.
            beats = [b for v in data['npcs'].values() for b in v]
            talk = [b for b in beats if not b.get('docImg')]
            docs = len(beats) - len(talk)
            L = [len(re.sub(r'<[^>]+>', '', b['t'])) for b in talk]
            n = len(talk)
            me = sum(1 for b in talk if b.get('who') == 'me')
            ch = sum(1 for b in talk if b.get('chart'))
            print('  대사 %d개 · 평균 %.1f자 · 최대 %d자 · 주인공 %d(%.0f%%) · 도해 %d(%.0f%%)%s'
                  % (n, sum(L)/len(L), max(L), me, me/n*100, ch, ch/n*100,
                     ' · 유산 사진 %d장' % docs if docs else ''))
            for b in talk:
                ln = len(re.sub(r'<[^>]+>', '', b['t']))
                if ln > 45: print('     ⚠️  %d자: %s…' % (ln, b['t'][:30]))
            continue

        backup = path + '.bak'
        shutil.copyfile(path, backup)
        s = open(path, encoding='utf-8').read()
        done, fail = 0, []
        for key, beats in data['npcs'].items():
            s2, err = replace_beats(s, key, beats_js(beats))
            if err: fail.append('%s (%s)' % (key, err))
            else: s = s2; done += 1
        open(path, 'w', encoding='utf-8').write(s)

        ok, err = syntax_ok(path)
        if not ok:
            shutil.copyfile(backup, path)
            print('  ❌ 문법이 깨져 되돌렸다:'); [print('     ', e) for e in err]
            continue
        os.unlink(backup)
        print('  ✅ NPC %d개 교체' % done)
        if fail:
            print('  ⚠️  못 바꾼 NPC:', ', '.join(fail))
    return 0


if __name__ == '__main__':
    sys.exit(main())
