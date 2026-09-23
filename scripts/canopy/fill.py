import json, math
G, PAD, NPC_R, EDGE, W, H = 16, 10, 34, 6, 1376, 768
C, R = W//G + 1, H//G + 1
rnd = lambda v: math.floor(v + 0.5)
game = json.load(open('game_zones.json'))
sel = json.load(open('sel_zones.json'))

def grid_of(rects):
    g = bytearray(C*R)
    for r in range(R):
        for c in range(C):
            x, y = c*G, r*G
            for b in rects:
                if b[0] <= x <= b[2] and b[1] <= y <= b[3]: g[r*C+c] = 1; break
    return g
def blocked_px(g, x, y):
    if x < EDGE or y < EDGE or x >= W-EDGE or y >= H-EDGE: return True
    c, r = rnd(x/G), rnd(y/G)
    if c < 0 or r < 0 or c >= C or r >= R: return True
    return bool(g[r*C+c])
def stand(g, npcs, c, r):
    x, y = c*G, r*G
    for dx, dy in ((-PAD,-PAD),(PAD,-PAD),(-PAD,PAD),(PAD,PAD)):
        if blocked_px(g, x+dx, y+dy): return False
    return all((n['x']-x)**2 + (n['y']-y)**2 >= NPC_R**2 for n in npcs)
def to_rects(g):
    used = bytearray(len(g)); out = []
    for r in range(R):
        c = 0
        while c < C:
            if not g[r*C+c] or used[r*C+c]: c += 1; continue
            c2 = c
            while c2+1 < C and g[r*C+c2+1] and not used[r*C+c2+1]: c2 += 1
            r2 = r
            while r2+1 < R and all(g[(r2+1)*C+k] and not used[(r2+1)*C+k] for k in range(c, c2+1)): r2 += 1
            for rr in range(r, r2+1):
                for cc in range(c, c2+1): used[rr*C+cc] = 1
            out.append([max(0, c*G-G//2), max(0, r*G-G//2), min(W, c2*G+G//2), min(H, r2*G+G//2)])
            c = c2 + 1
    return out

result, report = {}, []
for key in sel:
    f, zid = key.split('#')
    z = game[f][zid]
    rects = [[b['x0'], b['y0'], b['x1'], b['y1']] for b in z.get('barriers', [])]
    npcs = z.get('npcs', [])
    g = grid_of(rects)
    starts = [(z['spawn']['x'], z['spawn']['y'])]
    for oz in game[f].values():
        for e in oz.get('exits', []) or []:
            if e.get('to') == zid and e.get('spawn'): starts.append((e['spawn']['x'], e['spawn']['y']))
    seen = set(); q = []
    for sx, sy in starts:
        best = None
        for r in range(R):
            for c in range(C):
                d = (c*G-sx)**2 + (r*G-sy)**2
                if d <= 40**2 and stand(g, npcs, c, r) and (best is None or d < best[0]): best = (d, c, r)
        if best and (best[1], best[2]) not in seen:
            seen.add((best[1], best[2])); q.append((best[1], best[2]))
        elif not best: report.append(f'{key}: 시작점 ({sx},{sy}) 근처에 설 자리 없음')
    while q:
        c, r = q.pop()
        for dc in (-1,0,1):
            for dr in (-1,0,1):
                n = (c+dc, r+dr)
                if n in seen or not (0 <= n[0] < C and 0 <= n[1] < R): continue
                if stand(g, npcs, *n): seen.add(n); q.append(n)
    foot = set()
    for c, r in seen:
        for dc in (-1,0,1):
            for dr in (-1,0,1): foot.add((c+dc, r+dr))
    add = bytearray(C*R); n_add = 0
    for r in range(R):
        for c in range(C):
            if g[r*C+c] or (c, r) in foot: continue
            x, y = c*G, r*G
            if any((n['x']-x)**2 + (n['y']-y)**2 < (NPC_R+G)**2 for n in npcs): continue
            add[r*C+c] = 1; n_add += 1
    fill = to_rects(add)
    # 닿는지 점검
    near = lambda px, py, rad: any((c*G-px)**2 + (r*G-py)**2 <= rad*rad for c, r in seen)
    for n in npcs:
        if not near(n['x'], n['y'], 48): report.append(f"{key}: NPC {n.get('name', n['id'])} 앞에 설 자리 없음")
    for s in z.get('spots', []) or []:
        if not near(s['x'], s['y'], 128): report.append(f"{key}: 유물 {s['id']} 닿지 않음")
    for e in z.get('exits', []) or []:
        rc = e['rect']
        if not any(rc['x0']-10 <= c*G <= rc['x1']+10 and rc['y0']-10 <= r*G <= rc['y1']+10 for c, r in seen):
            report.append(f"{key}: 출구 → {e.get('to')} 닿지 않음")
    result[key] = {'rects': rects, 'fill': fill, 'cells': n_add, 'reach': len(seen)}
    print(f"{key:40s} 걸을곳 {len(seen):5d}칸  메울칸 {n_add:5d} → 사각형 {len(fill)}")
json.dump(result, open('fill_result.json', 'w'))
print('\n점검:'); print('\n'.join(report) if report else '문제 없음')
