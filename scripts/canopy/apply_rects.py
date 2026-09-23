import re, json, sys
def replace_barriers(text, zone, rects, trailer=None):
    m = re.search(r'\n  ' + re.escape(zone) + r': \{', text)
    if not m: raise SystemExit(f'zone not found {zone}')
    bidx = text.index('barriers: [', m.start())
    s = text.index('[', bidx); depth = 0; i = s
    while True:
        c = text[i]
        if c in '[{': depth += 1
        elif c in ']}':
            depth -= 1
            if depth == 0: break
        i += 1
    body = ''.join(f"    {{ x0: {a}, y0: {b}, x1: {c_}, y1: {d} }},\n" for a,b,c_,d in rects)
    return text[:s] + '[\n' + body + '  ]' + text[i+1:]
if __name__ == '__main__':
    paste = json.load(open(sys.argv[1]))
    base = '/Users/yunsismac/Korean-History-Game/www/'
    files = {}
    for k, v in paste.items():
        f, z = k.split('#'); files.setdefault(f, []).append((z, v))
    for f, zs in files.items():
        t = open(base+f, encoding='utf-8').read()
        for z, v in zs: t = replace_barriers(t, z, v)
        open(base+f, 'w', encoding='utf-8').write(t)
        print('updated', f, [z for z,_ in zs])
