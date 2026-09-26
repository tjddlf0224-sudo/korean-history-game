"""전깃줄 덮개: 까만 가는 선만 뽑는다. 땅바닥 선로(가운데 밝은 이중선, 완전 수평)는 뺀다.
   전깃줄은 전봇대 꼭대기 높이라 지도 안 어디에 서 있어도 인물보다 앞 → base를 지도 아래 끝 너머로."""
import sys, json, os, numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd
W, H, S = 1376, 768, 2
WWW = '/Users/yunsismac/Korean-History-Game/www/'
cfg = json.loads(sys.argv[1])   # {"file":..,"zone":..,"img":..,"y0":..,"y1":..,"ex":[[..]], "thr":..}
p = WWW + cfg['img'].replace('.png', '.webp')
if not os.path.exists(p): p = WWW + cfg['img']
im = Image.open(p).convert('RGB')
if im.size != (W*S, H*S): im = im.resize((W*S, H*S), Image.LANCZOS)
y0, y1 = cfg['y0'], cfg['y1']
A = np.asarray(im.crop((0, y0*S, W*S, y1*S))).astype(int)
lum = (0.3*A[...,0] + 0.59*A[...,1] + 0.11*A[...,2]).astype('uint8')
import cv2
k = cfg.get('k', 11)
bh = cv2.morphologyEx(lum, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))).astype(int)
dark = bh > cfg.get('bh', 40)
hh, ww = dark.shape
yy, xx = np.mgrid[0:hh, 0:ww]; gx = xx/S; gy = y0 + yy/S
for e in cfg.get('ex', []):
    dark &= ~((gx >= e[0]) & (gx <= e[2]) & (gy >= e[1]) & (gy <= e[3]))
# 성일님이 칠한 덮개 조각(전봇대·가로등 몸통)은 빼기 — 그 조각이 자기 밑동 높이로 앞뒤를 맡는다
_t = open(WWW + 'assets/canopy/data.js', encoding='utf-8').read()
_d = json.loads(_t[_t.index('window.CANOPY_DATA = ') + 21:_t.rindex(';')])
for pc in _d.get(cfg['file'], {}).get(cfg['zone'], []):
    if pc.get('auto') == 'wires': continue
    a = np.asarray(Image.open(WWW + pc['src']).convert('RGBA'))[..., 3] > 60
    a = nd.binary_dilation(a, iterations=3)
    px0, py0 = pc['x']*S, pc['y']*S - y0*S
    ys, xs = np.where(a)
    ys = ys + py0; xs = xs + px0
    ok = (ys >= 0) & (ys < hh) & (xs >= 0) & (xs < ww)
    dark[ys[ok], xs[ok]] = False
# 세로 획(기둥)도 빼기: 전깃줄은 거의 가로라 세로 선 모양으로 여는 연산에 안 걸린다
vert = cv2.morphologyEx(dark.astype('uint8'), cv2.MORPH_OPEN, np.ones((cfg.get('vk', 21), 1), np.uint8)) > 0
dark &= ~nd.binary_dilation(vert, iterations=2)
# 선로: 거의 모든 칸이 어두운 가로줄(완전 수평) → 그 줄 ±3px 빼기
frac = dark.mean(axis=1)
rail_rows = np.where(frac > cfg.get('railfrac', 0.45))[0]
rail = np.zeros(hh, bool)
for r in rail_rows: rail[max(0, r-cfg.get('railpad', 1)):r+cfg.get('railpad', 1)+1] = True
dark &= ~rail[:, None]
# 가는 선만: 두꺼운 덩어리(전봇대·가로등 몸통 등)는 여는 연산으로 걸러 빼기 — 그건 성일님이 칠한 조각이 맡음
thick = nd.binary_opening(dark, structure=np.ones((7, 7), bool))
thick = nd.binary_dilation(thick, iterations=2)
wire = dark & ~thick
# 너무 작은 부스러기 빼기
lab, n = nd.label(wire, structure=np.ones((3, 3)))
if n:
    sz = nd.sum(wire, lab, range(1, n+1))
    sl = nd.find_objects(lab)
    keep = [i+1 for i, s in enumerate(sz) if s >= cfg.get('minpx', 40) and (sl[i][1].stop - sl[i][1].start) >= cfg.get('minw', 80)]
    wire = np.isin(lab, keep)
wire = nd.binary_dilation(wire, iterations=1)
alpha = Image.fromarray((wire*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))
rgba = np.dstack([A.astype('uint8'), np.asarray(alpha)]); rgba[rgba[...,3] == 0, :3] = 0
name = f"{cfg['file'][:-5]}_{cfg['zone']}_wires.webp"
Image.fromarray(rgba, 'RGBA').save(WWW + 'assets/canopy/' + name, quality=90, method=6)
print('rail rows(2x):', list(rail_rows[:40]), 'wire px', int(wire.sum()), 'bytes', os.path.getsize(WWW + 'assets/canopy/' + name))
# 미리보기
pv = Image.fromarray(A.astype('uint8'))
pv = Image.composite(Image.new('RGB', pv.size, (255, 0, 255)), pv, Image.fromarray((wire*255).astype('uint8')))
d = ImageDraw.Draw(pv)
for r in rail_rows: d.line([(0, r), (40, r)], fill=(0, 255, 0), width=1)
pv.save('../wires_prev.png')
json.dump({'src': 'assets/canopy/' + name, 'x': 0, 'y': y0, 'w': W, 'h': y1 - y0, 'base': 9999, 'auto': 'wires'}, open('wires_entry.json', 'w'))
