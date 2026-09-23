"""나무 덮개 만들기: specs.json(나무 상자) → 원본 픽셀 오린 webp + 밑동 배리어 + (open이면) 잎 아래 열기."""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd
import cv2
from rembg import remove, new_session
SESS = {'isnet': new_session('isnet-general-use'), 'u2net': new_session('u2net')}
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apply_rects import replace_barriers

G, PAD, NPC_R, EDGE, W, H, S = 16, 10, 34, 6, 1376, 768, 2
C, R = W//G + 1, H//G + 1
rnd = lambda v: math.floor(v + 0.5)
WWW = '/Users/yunsismac/Korean-History-Game/www/'
OUT = WWW + 'assets/canopy/'
zones = json.load(open('all_zones.json'))
specs = json.load(open('specs.json'))
only = sys.argv[1:]   # 무대 몇 곳만 다시 만들 때

def grid_of(rects):
    g = np.zeros((R, C), np.uint8)
    for r in range(R):
        for c in range(C):
            x, y = c*G, r*G
            for b in rects:
                if b[0] <= x <= b[2] and b[1] <= y <= b[3]: g[r, c] = 1; break
    return g
def blocked_px(g, x, y):
    if x < EDGE or y < EDGE or x >= W-EDGE or y >= H-EDGE: return True
    c, r = rnd(x/G), rnd(y/G)
    if c < 0 or r < 0 or c >= C or r >= R: return True
    return bool(g[r, c])
def stand(g, npcs, c, r):
    x, y = c*G, r*G
    for dx, dy in ((-PAD,-PAD),(PAD,-PAD),(-PAD,PAD),(PAD,PAD)):
        if blocked_px(g, x+dx, y+dy): return False
    return all((n['x']-x)**2 + (n['y']-y)**2 >= NPC_R**2 for n in npcs)
def reach(g, f, zid):
    z = zones[f][zid]; npcs = z['npcs']
    starts = [(z['spawn']['x'], z['spawn']['y'])]
    for oz in zones[f].values():
        for e in oz.get('exits') or []:
            if e.get('to') == zid and e.get('spawn'): starts.append((e['spawn']['x'], e['spawn']['y']))
    seen, q = set(), []
    for sx, sy in starts:
        best = None
        for r in range(R):
            for c in range(C):
                d = (c*G-sx)**2 + (r*G-sy)**2
                if d <= 1600 and stand(g, npcs, c, r) and (best is None or d < best[0]): best = (d, c, r)
        if best and (best[1], best[2]) not in seen: seen.add((best[1], best[2])); q.append((best[1], best[2]))
    while q:
        c, r = q.pop()
        for dc in (-1,0,1):
            for dr in (-1,0,1):
                n = (c+dc, r+dr)
                if n not in seen and 0 <= n[0] < C and 0 <= n[1] < R and stand(g, npcs, *n):
                    seen.add(n); q.append(n)
    return seen
def to_rects(g):
    used = np.zeros_like(g); out = []
    for r in range(R):
        c = 0
        while c < C:
            if not g[r, c] or used[r, c]: c += 1; continue
            c2 = c
            while c2+1 < C and g[r, c2+1] and not used[r, c2+1]: c2 += 1
            r2 = r
            while r2+1 < R and all(g[r2+1, k] and not used[r2+1, k] for k in range(c, c2+1)): r2 += 1
            used[r:r2+1, c:c2+1] = 1
            out.append([max(0, c*G-G//2), max(0, r*G-G//2), min(W, c2*G+G//2), min(H, r2*G+G//2)])
            c = c2 + 1
    return out
def disk(rr):
    a = np.arange(-rr, rr+1); return np.add.outer(a*a, a*a) <= rr*rr
def background(f, zid):
    p = WWW + zones[f][zid]['img'].replace('.png', '.webp')
    if not os.path.exists(p): p = WWW + zones[f][zid]['img']
    im = Image.open(p).convert('RGB')
    return im.resize((W*S, H*S), Image.LANCZOS) if im.size != (W*S, H*S) else im

data = {}
if os.path.exists('canopy_data.json'): data = json.load(open('canopy_data.json'))
report, previews = [], []
for key, trees in specs.items():
    if only and key not in only: continue
    f, zid = key.split('#'); z = zones[f][zid]
    rects = [[b['x0'], b['y0'], b['x1'], b['y1']] for b in z['barriers']]
    g = grid_of(rects); g0 = g.copy()
    seen0 = reach(g, f, zid)
    img = background(f, zid); A = np.asarray(img)
    # 바닥 색 모으기: 걸을 수 있는 칸(나무 상자 밖)의 픽셀
    boxes = [t['box'] for t in trees]
    samp = []
    for c, r in seen0:
        x, y = c*G, r*G
        if any(b[0]-8 <= x <= b[2]+8 and b[1]-8 <= y <= b[3]+8 for b in boxes): continue
        blk = A[max(0,(y-8)*S):(y+8)*S:3, max(0,(x-8)*S):(x+8)*S:3].reshape(-1, 3)
        samp.append(blk)
    samp = np.concatenate(samp).astype(int) // 16
    idx = samp[:,0]*256 + samp[:,1]*16 + samp[:,2]
    cnt = np.bincount(idx, minlength=4096)
    thr = max(3, int(len(idx) * 0.0004))
    ground_bins = cnt >= thr
    zone_list = []
    for i, t in enumerate(trees):
        x0, y0, x1, y1 = t['box']; base = t.get('base', y1)
        crop = A[y0*S:y1*S, x0*S:x1*S].astype(int)
        hh, ww = crop.shape[:2]
        yy, xx = np.mgrid[0:hh, 0:ww]; gx = x0 + xx/S; gy = y0 + yy/S
        lum = 0.3*crop[...,0] + 0.59*crop[...,1] + 0.11*crop[...,2]
        method = t.get('m', 'isnet')
        mg = t.get('margin', 0.15); mx, my = int((x1-x0)*mg), int((y1-y0)*mg)
        X0, Y0, X1, Y1 = max(0, x0-mx), max(0, y0-my), min(W, x1+mx), min(H, y1+my)
        big = img.crop((X0*S, Y0*S, X1*S, Y1*S))
        sl = (slice((y0-Y0)*S, (y1-Y0)*S), slice((x0-X0)*S, (x1-X0)*S))
        soft = None
        if method == 'dark':
            k = nd.binary_closing(lum < t.get('thr', 150), structure=disk(t.get('close', 8)))
        else:
            parts = []
            if method in ('isnet', 'union', 'hue', 'u2net'):
                a = np.asarray(remove(big, session=SESS['u2net' if method == 'u2net' else 'isnet'], only_mask=True)).astype(float)/255
                parts.append(a[sl])
            if method == 'hue':
                hm = lum < t.get('dthr', 60)   # 어두운 솔잎(풀밭과 색이 비슷해 AI가 줄기만 잡는 그림)
                hm = nd.binary_opening(hm, structure=disk(1)); hm = nd.binary_closing(hm, structure=disk(4))
                parts.append(hm.astype(float))
            if method in ('grabcut', 'union'):
                bgr = cv2.cvtColor(np.asarray(big), cv2.COLOR_RGB2BGR); mk = np.zeros(bgr.shape[:2], np.uint8)
                rect = ((x0-X0)*S, (y0-Y0)*S, (x1-x0)*S, (y1-y0)*S)
                b1 = np.zeros((1,65)); f1 = np.zeros((1,65))
                cv2.grabCut(bgr, mk, rect, b1, f1, 6, cv2.GC_INIT_WITH_RECT)
                parts.append(((mk == 1) | (mk == 3)).astype(float)[sl])
            soft = np.maximum.reduce(parts)
            k = soft > t.get('thr', 0.12)
        for e in t.get('ex', []):
            k &= ~((gx >= e[0]) & (gx <= e[2]) & (gy >= e[1]) & (gy <= e[3]))
        for e in t.get('green', []):
            inside = (gx >= e[0]) & (gx <= e[2]) & (gy >= e[1]) & (gy <= e[3])
            greenish = (crop[...,1] > crop[...,0] - 12) & (crop[...,1] > crop[...,2] + 15)
            k &= ~inside | greenish
        holes = nd.binary_fill_holes(k) & ~k
        lab, n = nd.label(holes)
        if n:
            sizes = nd.sum(holes, lab, range(1, n+1))
            k |= np.isin(lab, [j+1 for j, s in enumerate(sizes) if s < t.get('hole', 700)])
        lab, n = nd.label(k)
        if n:
            sizes = nd.sum(k, lab, range(1, n+1))
            k = np.isin(lab, [j+1 for j, s in enumerate(sizes) if s >= 300])
        for e in t.get('ex', []):   # 닫기가 다시 메운 것도 빼기
            k &= ~((gx >= e[0]) & (gx <= e[2]) & (gy >= e[1]) & (gy <= e[3]))
        k &= gy <= base
        alpha = Image.fromarray((k*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
        rgba = np.dstack([crop.astype('uint8'), np.asarray(alpha)])
        rgba[rgba[...,3] == 0, :3] = 0
        name = f"{f[:-5]}_{zid}_{i}.webp"
        Image.fromarray(rgba, 'RGBA').save(OUT + name, quality=90, method=6)
        zone_list.append({'src': 'assets/canopy/' + name, 'x': x0, 'y': y0, 'w': x1-x0, 'h': y1-y0, 'base': base})
        # 칸별 잎 덮임 비율
        opened, trunk = [], []
        if t.get('open'):
            for r in range(R):
                for c in range(C):
                    cx, cy = c*G, r*G
                    if not (x0 <= cx <= x1 and y0 <= cy <= min(y1, base)) or not g[r, c]: continue
                    sub = k[max(0,(cy-8-y0)*S):max(0,(cy+8-y0)*S), max(0,(cx-8-x0)*S):max(0,(cx+8-x0)*S)]
                    if sub.size and sub.mean() >= 0.5: g[r, c] = 0; opened.append((c, r))
        # 밑동: 밑동 바로 위 줄들에서 잎/줄기가 있는 가로 폭
        if base < H - 4:
            band = k[max(0,(base-20-y0)*S):max(0,(base-4-y0)*S)]
            cols = np.where(band.any(axis=0))[0]
            if len(cols):
                xs = x0 + cols/S; mid = float(np.median(xs))
                a, b = max(xs.min(), mid-12), min(xs.max(), mid+12)
                for c in range(rnd(a/G), rnd(b/G)+1):
                    for r in [rnd((base-8)/G)]:
                        if 0 <= c < C and 0 <= r < R:
                            if not g[r, c]: trunk.append((c, r))
                            g[r, c] = 1
        previews.append((key, i, t, k, crop, opened, trunk))
    data.setdefault(f, {})[zid] = zone_list
    # 새로 닿게 된 칸이 잎 아래가 아닌 곳으로 새는지
    seen1 = reach(g, f, zid)
    newc = seen1 - seen0
    leak = [cc for cc in newc if not any(b[0]-16 <= cc[0]*G <= b[2]+16 and b[1]-16 <= cc[1]*G <= b[3]+16 for b in boxes if True)]
    lost = seen0 - seen1
    for n_ in z['npcs']:
        if not any((c*G-n_['x'])**2 + (r*G-n_['y'])**2 <= 48*48 for c, r in seen1): report.append(f'{key}: NPC {n_.get("name")} 닿지 않음')
    for s_ in z.get('spots') or []:
        if not any((c*G-s_['x'])**2 + (r*G-s_['y'])**2 <= 128*128 for c, r in seen1): report.append(f'{key}: 유물 {s_["id"]} 닿지 않음')
    for e in z.get('exits') or []:
        rc = e['rect']
        if not any(rc['x0']-10 <= c*G <= rc['x1']+10 and rc['y0']-10 <= r*G <= rc['y1']+10 for c, r in seen1): report.append(f'{key}: 출구→{e.get("to")} 닿지 않음')
    print(f'{key:28s} 나무 {len(trees)}  새로 걷는 칸 {len(newc):4d}(상자 밖 {len(leak)})  못 가게 된 칸 {len(lost)}')
    if (g != g0).any():
        path = WWW + f; txt = open(path, encoding='utf-8').read()
        txt = replace_barriers(txt, zid, to_rects(g))
        open(path, 'w', encoding='utf-8').write(txt)
json.dump(data, open('canopy_data.json', 'w'), ensure_ascii=False, indent=0)
with open(OUT + 'data.js', 'w', encoding='utf-8') as fp:
    fp.write('/* 나무 덮개 목록 — scratchpad의 build_canopy.py가 만든다(손으로 고치지 말 것). canopy.js가 읽는다. */\n')
    fp.write('window.CANOPY_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
# 미리보기: 잎(보라)·밑동(빨강)·연 칸(초록)
tiles = []
for key, i, t, k, crop, opened, trunk in previews:
    x0, y0, x1, y1 = t['box']
    im = Image.fromarray(crop.astype('uint8'))
    tint = Image.new('RGB', im.size, (200, 60, 255))
    im = Image.composite(Image.blend(im, tint, 0.45), im, Image.fromarray((k*255).astype('uint8')))
    d = ImageDraw.Draw(im)
    for c, r in trunk: d.rectangle([(c*G-8-x0)*S, (r*G-8-y0)*S, (c*G+8-x0)*S, (r*G+8-y0)*S], outline=(255,0,0), width=3)
    for c, r in opened: d.rectangle([(c*G-8-x0)*S+2, (r*G-8-y0)*S+2, (c*G+8-x0)*S-2, (r*G+8-y0)*S-2], outline=(0,255,0), width=1)
    im.thumbnail((300, 260))
    tile = Image.new('RGB', (300, 280), (20, 20, 20)); tile.paste(im, (0, 20))
    ImageDraw.Draw(tile).text((3, 3), f'{key} #{i}', fill=(255,255,0)); tiles.append(tile)
for s in range(0, len(tiles), 20):
    sheet = Image.new('RGB', (1500, 1120), (0,0,0))
    for j, tl in enumerate(tiles[s:s+20]): sheet.paste(tl, ((j%5)*300, (j//5)*280))
    sheet.save(f'prev_{s//20}.jpg', quality=85)
print('\n'.join(report) if report else '닿기 점검 문제 없음')
