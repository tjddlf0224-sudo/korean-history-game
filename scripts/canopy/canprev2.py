import json, os, sys
from PIL import Image, ImageDraw
WWW='/Users/yunsismac/Korean-History-Game/www/'
Z=json.load(open('all_zones.json')); tree=json.load(open(sys.argv[1]))
t=open(WWW+'assets/canopy/data.js',encoding='utf-8').read(); D=json.loads(t[t.index('window.CANOPY_DATA = ')+21:t.rindex(';')])
keys=sorted(tree); tiles=[]
for k in keys:
    f,zn=k.split('#'); z=Z[f][zn]
    p=WWW+z['img'].replace('.png','.webp'); p=p if os.path.exists(p) else WWW+z['img']
    im=Image.open(p).convert('RGB').resize((1376,768)).convert('RGBA')
    ov=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(ov)
    for a,b,c,e in tree[k]: d.rectangle([a,b,c,e],outline=(255,255,0,160))
    for pc in D[f][zn]:
        if pc.get('auto'): continue
        a=Image.open(WWW+pc['src']).convert('RGBA').resize((pc['w'],pc['h'])).split()[3]
        ov.paste(Image.new('RGBA',a.size,(200,60,255,140)),(pc['x'],pc['y']),a)
        d.line([(pc['x'],pc['base']),(pc['x']+pc['w'],pc['base'])],fill=(0,255,255,255),width=3)
    im=Image.alpha_composite(im,ov).convert('RGB').resize((688,384)); ImageDraw.Draw(im).text((4,4),k,fill=(255,255,0)); tiles.append(im)
for s in range(0,len(tiles),6):
    sh=Image.new('RGB',(1376,384*3))
    for i,t2 in enumerate(tiles[s:s+6]): sh.paste(t2,((i%2)*688,(i//2)*384))
    sh.save(f'../canall_{s//6}.jpg',quality=85)
print(len(tiles))
