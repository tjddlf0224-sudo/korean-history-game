import json, os, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
G=16; W,H=1376,768; C,R=W//G+1,H//G+1; S=2
WWW='/Users/yunsismac/Korean-History-Game/www/'
cdata=json.load(open('canopy_data_old.json'))
paste=json.load(open('paste4.json'))['나무위']
game=json.load(open('all_zones.json'))
def fillgrid(rects):
    g=np.zeros((R,C),np.uint8)
    for r in range(R):
        for c in range(C):
            x,y=c*G,r*G
            if any(a<=x<=c2 and b<=y<=d for a,b,c2,d in rects): g[r,c]=1
    return g
def piece_alpha(t):
    return np.asarray(Image.open(WWW+t['src']).convert('RGBA'))[...,3]
def oldgrid(f,z):
    g=np.zeros((R,C),np.uint8)
    for t in cdata.get(f,{}).get(z,[]):
        a=piece_alpha(t)>128
        for r in range(R):
            for c in range(C):
                cx,cy=c*G,r*G
                x0,x1=max(cx-8,t['x']),min(cx+8,t['x']+t['w']); y0,y1=max(cy-8,t['y']),min(cy+8,t['y']+t['h'])
                if x1<=x0 or y1<=y0: continue
                sub=a[(y0-t['y'])*2:(y1-t['y'])*2,(x0-t['x'])*2:(x1-t['x'])*2]
                if sub.size and sub.sum()>=0.3*32*32: g[r,c]=1
    return g
def background(f,z):
    p=WWW+game[f][z]['img'].replace('.png','.webp')
    if not os.path.exists(p): p=WWW+game[f][z]['img']
    im=Image.open(p).convert('RGB')
    return im.resize((W*S,H*S),Image.LANCZOS) if im.size!=(W*S,H*S) else im
def cellmask(g):
    m=np.zeros((H*S,W*S),bool)
    for r in range(R):
        for c in range(C):
            if g[r,c]:
                m[max(0,(r*G-8)*S):min(H*S,(r*G+8)*S), max(0,(c*G-8)*S):min(W*S,(c*G+8)*S)]=True
    return m
