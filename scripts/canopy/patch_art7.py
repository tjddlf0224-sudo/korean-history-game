import json, numpy as np
from PIL import Image
live=open('barrier_editor6.html',encoding='utf-8').read()
def span(h,marker):
    s=h.index(marker)+len(marker); d=0; i=s; st=None; esc=False
    while True:
        c=h[i]
        if st:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==st: st=None
        elif c in '"\'': st=c
        elif c in '[{': d+=1
        elif c in ']}':
            d-=1
            if d==0: break
        i+=1
    return s,i+1
s,e=span(live,'const ZONES = '); pre,zones,suf=live[:s],json.loads(live[s:e]),live[e:]
game=json.load(open('all_zones.json'))
WWW='/Users/yunsismac/Korean-History-Game/www/'
t=open(WWW+'assets/canopy/data.js',encoding='utf-8').read(); D=json.loads(t[t.index('window.CANOPY_DATA = ')+21:t.rindex(';')])
G=16;W,H=1376,768;C,R=W//G+1,H//G+1
def to_rects(g):
    used=np.zeros_like(g); out=[]
    for r in range(R):
        c=0
        while c<C:
            if not g[r,c] or used[r,c]: c+=1; continue
            c2=c
            while c2+1<C and g[r,c2+1] and not used[r,c2+1]: c2+=1
            r2=r
            while r2+1<R and all(g[r2+1,k] and not used[r2+1,k] for k in range(c,c2+1)): r2+=1
            used[r:r2+1,c:c2+1]=1
            out.append([max(0,c*G-8),max(0,r*G-8),min(W,c2*G+8),min(H,r2*G+8)]); c=c2+1
    return out
def cells(pieces):
    m=np.zeros((H*2,W*2),bool)
    for p in pieces:
        if p.get('auto'): continue
        a=np.asarray(Image.open(WWW+p['src']).convert('RGBA'))[...,3]>60
        h,w=a.shape; m[p['y']*2:p['y']*2+h,p['x']*2:p['x']*2+w]|=a
    g=np.zeros((R,C),np.uint8)
    for r in range(R):
        for c in range(C):
            sub=m[max(0,(r*G-8)*2):max(0,(r*G+8)*2),max(0,(c*G-8)*2):max(0,(c*G+8)*2)]
            if sub.size and sub.mean()>=0.3: g[r,c]=1
    return to_rects(g)
paste=json.load(open('paste7.json')); tree=json.load(open('tree7.json'))
n=0
for z in zones:
    f,zn=z['chapter'],z['zone']; g=game[f][zn]
    z['barriers']=[[b['x0'],b['y0'],b['x1'],b['y1']] for b in g['barriers']]
    z['npcs']=[{'id':x['id'],'name':x.get('name',x['id']),'x':x['x'],'y':x['y']} for x in g.get('npcs',[])]
    z['spots']=[{'id':x['id'],'name':x.get('label',x['id']),'x':x['x'],'y':x['y']} for x in (g.get('spots') or [])]
    z['exits']=[[x['rect']['x0'],x['rect']['y0'],x['rect']['x1'],x['rect']['y1']] for x in (g.get('exits') or [])]
    z['spawn']=[g['spawn']['x'],g['spawn']['y']]
    z['canopy']=cells(D.get(f,{}).get(zn,[]))
    if f+'#'+zn in paste: z['done']=True
    n+=1
print('zones',n,'done',sum(1 for z in zones if z.get('done')))
a,b=span(suf,'const SENT = '); sent=json.loads(suf[a:b]); sent.update(paste); suf=suf[:a]+json.dumps(sent,separators=(',',':'))+suf[b:]
a,b=span(suf,'const SENTC = '); sc=json.loads(suf[a:b]); sc.update(tree); suf=suf[:a]+json.dumps(sc,separators=(',',':'))+suf[b:]
def rep(o,nw):
    global suf
    assert suf.count(o)==1,o; suf=suf.replace(o,nw)
rep("const CSAVE_KEY = 'barrier-editor.canopy.v4';","const CSAVE_KEY = 'barrier-editor.canopy.v5';")
rep("const SAVE_KEY = 'barrier-editor.v5';","const SAVE_KEY = 'barrier-editor.v6';")
rep("carry(SAVE_KEY, ['barrier-editor.v4',","carry(SAVE_KEY, ['barrier-editor.v5', 'barrier-editor.v4',")
rep("carry(CSAVE_KEY, ['barrier-editor.canopy.v3',","carry(CSAVE_KEY, ['barrier-editor.canopy.v4', 'barrier-editor.canopy.v3',")
out=pre+json.dumps(zones,ensure_ascii=False,separators=(',',':'))+suf
open('barrier_editor7.html','w',encoding='utf-8').write(out)
h=out; s2=h.index('<script>',h.index('</dialog>'))+8; e2=h.index('</script>',s2); open('ed7.js','w').write(h[s2:e2]); print(len(out))
