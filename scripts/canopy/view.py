import json, os, sys
from PIL import Image, ImageDraw
d = json.load(open('all_zones.json'))
base = '/Users/yunsismac/Korean-History-Game/www/'
def bg(f, z):
    o = d[f][z]; p = base + o['img'].replace('.png', '.webp')
    if not os.path.exists(p): p = base + o['img']
    return Image.open(p).convert('RGB')
if __name__ == '__main__':
    for key in sys.argv[1:]:
        f, z = key.split('#'); o = d[f][z]
        im = bg(f, z).resize((1376, 768))
        ov = Image.new('RGBA', im.size, (0,0,0,0)); dr = ImageDraw.Draw(ov)
        for b in o['barriers']: dr.rectangle([b['x0'], b['y0'], b['x1'], b['y1']], fill=(255,0,0,60))
        for x in range(0, 1376, 32): dr.line([(x,0),(x,768)], fill=(255,255,255,90 if x%128==0 else 35))
        for y in range(0, 768, 32): dr.line([(0,y),(1376,y)], fill=(255,255,255,90 if y%128==0 else 35))
        im = Image.alpha_composite(im.convert('RGBA'), ov); dr = ImageDraw.Draw(im)
        for x in range(0, 1376, 128): dr.text((x+2, 2), str(x), fill=(255,255,0))
        for y in range(128, 768, 128): dr.text((2, y+2), str(y), fill=(255,255,0))
        for n in o['npcs']: dr.ellipse([n['x']-6,n['y']-6,n['x']+6,n['y']+6], fill=(60,140,255))
        im.convert('RGB').save(f'v_{f[:-5]}_{z}.jpg', quality=82)
