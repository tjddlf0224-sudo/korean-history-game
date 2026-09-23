import json, re
res = json.load(open('fill_result.json'))
base = '/Users/yunsismac/Korean-History-Game/www/'
for k, v in res.items():
    if not v['fill']: continue
    f, z = k.split('#'); t = open(base+f, encoding='utf-8').read()
    m = re.search(r'\n  ' + re.escape(z) + r': \{', t)
    s = t.index('[', t.index('barriers: [', m.start())); d = 0; i = s
    while True:
        c = t[i]
        if c in '[{': d += 1
        elif c in ']}':
            d -= 1
            if d == 0: break
        i += 1
    j = t.rfind('\n', s, i) + 1
    add = '    // 걸어서 못 가는 곳 — 헷갈리지 않게 막아 둠\n' + ''.join(f"    {{ x0: {a}, y0: {b}, x1: {c_}, y1: {e} }},\n" for a,b,c_,e in v['fill'])
    open(base+f, 'w', encoding='utf-8').write(t[:j] + add + t[j:]); print('ok', k, len(v['fill']))
