import json, re, sys
sys.path.insert(0,'.')
import numpy as np
from PIL import Image
h=open('art_base.html',encoding='utf-8').read()
m='const ZONES = '; s=h.index(m)+len(m); d=0; i=s; st=None; esc=False
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
zones=json.loads(h[s:i+1]); post=h[i+1:]; pre=h[:s]
game=json.load(open('all_zones.json')); p4=json.load(open('paste4.json')); sentc=p4.pop('나무위')
cd=json.load(open('canopy_data_new.json'))
WWW='/Users/yunsismac/Korean-History-Game/www/'
G=16; W,H_=1376,768; C,R=W//G+1,H_//G+1
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
            out.append([max(0,c*G-8),max(0,r*G-8),min(W,c2*G+8),min(H_,r2*G+8)]); c=c2+1
    return out
def piece_cells(f,z):
    cg=np.zeros((R,C),np.uint8)
    for t in cd.get(f,{}).get(z,[]):
        a=np.asarray(Image.open(WWW+t['src']).convert('RGBA'))[...,3]>128
        for r in range(R):
            for c in range(C):
                cx,cy=c*G,r*G
                x0,x1=max(cx-8,t['x']),min(cx+8,t['x']+t['w']); y0,y1=max(cy-8,t['y']),min(cy+8,t['y']+t['h'])
                if x1<=x0 or y1<=y0: continue
                sub=a[(y0-t['y'])*2:(y1-t['y'])*2,(x0-t['x'])*2:(x1-t['x'])*2]
                if sub.size and sub.sum()>=0.3*32*32: cg[r,c]=1
    return cg
nref=0; ndone=0
for z in zones:
    k=z['chapter']+'#'+z['zone']; g=game.get(z['chapter'],{}).get(z['zone'])
    if g:
        z['barriers']=[[b['x0'],b['y0'],b['x1'],b['y1']] for b in g['barriers']]
        z['npcs']=[{'id':x['id'],'name':x.get('name',x['id']),'x':x['x'],'y':x['y']} for x in g.get('npcs',[])]
        z['spots']=[{'id':x['id'],'name':x.get('label',x['id']),'x':x['x'],'y':x['y']} for x in (g.get('spots') or [])]
        z['exits']=[[e['rect']['x0'],e['rect']['y0'],e['rect']['x1'],e['rect']['y1']] for e in (g.get('exits') or [])]
        z['spawn']=[g['spawn']['x'],g['spawn']['y']]; nref+=1
    if k in p4 and not z.get('done'): z['done']=True; ndone+=1
    if k in sentc: z['canopy']=sentc[k]
    else:
        z['canopy']=to_rects(piece_cells(z['chapter'],z['zone'])) if cd.get(z['chapter'],{}).get(z['zone']) else []
print('refreshed',nref,'newly done',ndone)
# ── 코드 패치 ──
a=post.index("/* v2(2026-09-23)"); b=post.index("function stamp(n)")
new_block="""/* v3(2026-09-24): 보내 주신 것은 게임과 이 페이지 데이터에 이미 들어갔다.
   옛 저장분이 그대로 남아 있으면 새 데이터를 덮어 버리므로, 보내 주신 것과 똑같은 구역은
   버리고 아직 안 보낸 고친 것만 v3로 옮겨 온다(막기·나무 위 둘 다). */
const SAVE_KEY = 'barrier-editor.v3';
let saved = carry(SAVE_KEY, ['barrier-editor.v2', 'barrier-editor.v1'], SENT);


"""
post=post[:a]+new_block+post[b:]
old_c="""const CSAVE_KEY = 'barrier-editor.canopy.v1';
let csaved = {};
try { csaved = JSON.parse(localStorage.getItem(CSAVE_KEY) || '{}') || {}; } catch (e) { csaved = {}; }"""
assert old_c in post
post=post.replace(old_c,"""const CSAVE_KEY = 'barrier-editor.canopy.v2';
let csaved = carry(CSAVE_KEY, ['barrier-editor.canopy.v1'], SENTC);""")
HOIST="""const SENT = """+json.dumps(p4,separators=(',',':'))+""";
const SENTC = """+json.dumps(sentc,separators=(',',':'))+""";
function carry(newKey, oldKeys, sent){
  let cur = null;
  try { cur = JSON.parse(localStorage.getItem(newKey) || 'null'); } catch (e) { cur = null; }
  if (cur && typeof cur === 'object') return cur;
  cur = {};
  try {
    for (const ok of oldKeys){
      const old = JSON.parse(localStorage.getItem(ok) || '{}') || {};
      for (const k of Object.keys(old))
        if (JSON.stringify(old[k]) !== JSON.stringify(sent[k]) && !cur[k]) cur[k] = old[k];
    }
    localStorage.setItem(newKey, JSON.stringify(cur));
  } catch (e) {}
  return cur;
}
"""
assert 'const undos = [];' in post
post=post.replace('const undos = [];', HOIST+'const undos = [];',1)
old_leg='나무 위(인물이 잎 아래로 지나감)'
assert old_leg in pre+post
out=pre.replace(old_leg,'나무·지붕·문루 위(인물이 그 아래로 지나감)')+json.dumps(zones,ensure_ascii=False,separators=(',',':'))+post.replace(old_leg,'나무·지붕·문루 위(인물이 그 아래로 지나감)')
# 안내문: 사이드바 설명에 덮개 범위
out=out.replace("끌면 여러 칸을 한 번에 칠합니다.</p>","끌면 여러 칸을 한 번에 칠합니다.<br>\"나무 위 칠하기\"로는 나무·지붕·문루처럼 인물이 <b style=\"color:#c08adf\">아래로 지나갈</b> 것을 칠합니다.</p>",1)
open('art_new.html','w',encoding='utf-8').write(out); print(len(out))
h2=out; s2=h2.index('<script>',h2.index('</dialog>'))+8; e2=h2.index('</script>',s2); open('ed_script.js','w').write(h2[s2:e2])
