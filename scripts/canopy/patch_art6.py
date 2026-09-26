import json, re
live = open('/Users/yunsismac/.claude/projects/-Users-yunsismac/a112141d-5377-49ca-920e-661e8d8eea18/tool-results/artifact-bd94d93a-1790427995-662d.html', encoding='utf-8').read()
m = 'const ZONES = '; s = live.index(m) + len(m); d = 0; i = s; st = None; esc = False
while True:
    c = live[i]
    if st:
        if esc: esc = False
        elif c == '\\': esc = True
        elif c == st: st = None
    elif c in '"\'': st = c
    elif c in '[{': d += 1
    elif c in ']}':
        d -= 1
        if d == 0: break
    i += 1
pre, zones, suf = live[:s], json.loads(live[s:i+1]), live[i+1:]
paste = json.load(open('paste6.json')); tree = paste['나무위']
bar = {k: v for k, v in paste.items() if k != '나무위'}
game = json.load(open('all_zones.json'))
n = 0
for z in zones:
    k = z['chapter'] + '#' + z['zone']
    if k not in bar: continue
    g = game[z['chapter']][z['zone']]
    z['barriers'] = bar[k]
    z['npcs'] = [{'id': x['id'], 'name': x.get('name', x['id']), 'x': x['x'], 'y': x['y']} for x in g.get('npcs', [])]
    z['spots'] = [{'id': x['id'], 'name': x.get('label', x['id']), 'x': x['x'], 'y': x['y']} for x in (g.get('spots') or [])]
    z['exits'] = [[e['rect']['x0'], e['rect']['y0'], e['rect']['x1'], e['rect']['y1']] for e in (g.get('exits') or [])]
    z['spawn'] = [g['spawn']['x'], g['spawn']['y']]
    if k in tree: z['canopy'] = tree[k]
    z['done'] = True; n += 1
print('zones refreshed', n)
# SENT / SENTC 합치기
def take(name):
    a = suf.index('const ' + name + ' = ') + len('const ' + name + ' = '); dd = 0; j = a; st2 = None; es = False
    while True:
        c = suf[j]
        if st2:
            if es: es = False
            elif c == '\\': es = True
            elif c == st2: st2 = None
        elif c in '"\'': st2 = c
        elif c in '[{': dd += 1
        elif c in ']}':
            dd -= 1
            if dd == 0: break
        j += 1
    return a, j + 1, json.loads(suf[a:j+1])
a, b, sent = take('SENT'); sent.update(bar)
suf = suf[:a] + json.dumps(sent, separators=(',', ':')) + suf[b:]
a, b, sentc = take('SENTC'); sentc.update(tree)
suf = suf[:a] + json.dumps(sentc, separators=(',', ':')) + suf[b:]
def rep(old, new):
    global suf
    assert suf.count(old) == 1, old
    suf = suf.replace(old, new)
rep("const CSAVE_KEY = 'barrier-editor.canopy.v3';", "const CSAVE_KEY = 'barrier-editor.canopy.v4';")
rep("const SAVE_KEY = 'barrier-editor.v4';", "const SAVE_KEY = 'barrier-editor.v5';")
rep("carry(SAVE_KEY, ['barrier-editor.v3', 'barrier-editor.v2', 'barrier-editor.v1'], SENT)", "carry(SAVE_KEY, ['barrier-editor.v4', 'barrier-editor.v3', 'barrier-editor.v2', 'barrier-editor.v1'], SENT)")
rep("carry(CSAVE_KEY, ['barrier-editor.canopy.v2', 'barrier-editor.canopy.v1'], SENTC)", "carry(CSAVE_KEY, ['barrier-editor.canopy.v3', 'barrier-editor.canopy.v2', 'barrier-editor.canopy.v1'], SENTC)")
rep("/* v4(2026-09-26) — v3(2026-09-24)", "/* v5(2026-09-26 밤) — v4(2026-09-26) — v3(2026-09-24)")
open('barrier_editor6.html', 'w', encoding='utf-8').write(pre + json.dumps(zones, ensure_ascii=False, separators=(',', ':')) + suf)
h = open('barrier_editor6.html', encoding='utf-8').read()
s2 = h.index('<script>', h.index('</dialog>')) + 8; e2 = h.index('</script>', s2); open('ed6.js', 'w').write(h[s2:e2])
print('bytes', len(h))
