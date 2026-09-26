"""성일님이 러프하게 칠한 '나무 위' 칸을 실제 물체 윤곽으로 다듬는다.
칸 덩어리 둘레 48px까지 넓힌 범위에서 isnet으로 물체를 잡고, 칠한 칸과 닿는 조각만 남긴다.
→ 칸 밖으로 삐져나온 나무 끝·석탑 머리/기단은 살리고, 칸 안의 땅은 뺀다."""
import sys; sys.path.insert(0,'.')
from lib import *
import cv2
from rembg import remove, new_session
from PIL import ImageFilter
sess=new_session('isnet-general-use')
OUT=WWW+'assets/canopy/'
data=json.load(open('canopy_data_old.json'))
tree=json.load(open(sys.argv[1])); newcells={}
EX={'tongil.html#gameunsa':[[1326,280,1376,760]]}   # 오른쪽 담장은 덮개 아님
for key,rects in tree.items():
    f,z=key.split('#'); g=fillgrid(rects); bg=background(f,z)
    for old in data.get(f,{}).get(z,[]):
        if old.get('auto'): continue
        p=WWW+old['src']
        if os.path.exists(p): os.remove(p)
    keep=[o for o in data.get(f,{}).get(z,[]) if o.get('auto')]
    lab,n=nd.label(nd.binary_dilation(g,structure=np.ones((3,3)),iterations=1)); lab=lab*g
    lst=[]; allmask=np.zeros((H*S,W*S),bool)
    for i in range(1,n+1):
        m=(lab==i)
        if not m.any(): continue
        cmfull=cellmask(m.astype(np.uint8))
        rr,cc=np.where(m); M=48
        x0=max(0,cc.min()*G-8-M); x1=min(W,cc.max()*G+8+M); y0=max(0,rr.min()*G-8-M); y1=min(H,rr.max()*G+8+M)
        mg=int(max(x1-x0,y1-y0)*0.15); X0,Y0,X1,Y1=max(0,x0-mg),max(0,y0-mg),min(W,x1+mg),min(H,y1+mg)
        big=bg.crop((X0*S,Y0*S,X1*S,Y1*S))
        soft=np.asarray(remove(big,session=sess,only_mask=True)).astype(float)/255
        soft=soft[(y0-Y0)*S:(y1-Y0)*S,(x0-X0)*S:(x1-X0)*S]
        cm=cmfull[y0*S:y1*S,x0*S:x1*S]
        k1=soft>0.15
        L,nn=nd.label(k1)
        ids=set(np.unique(L[k1&cm]))-{0}
        k=np.isin(L,list(ids))
        # isnet이 놓친 부분(단풍 든 잎처럼 배경과 비슷한 색)은 GrabCut으로 — 칠한 칸 둘레 안에서만
        bgr=cv2.cvtColor(np.asarray(bg.crop((x0*S,y0*S,x1*S,y1*S))),cv2.COLOR_RGB2BGR)
        mk=np.full(cm.shape,cv2.GC_PR_BGD,np.uint8); mk[cm]=cv2.GC_PR_FGD
        mk[k&cm]=cv2.GC_FGD
        edge=np.zeros_like(cm); edge[:6,:]=edge[-6:,:]=edge[:,:6]=edge[:,-6:]=True; mk[edge]=cv2.GC_BGD
        try:
            cv2.grabCut(bgr,mk,None,np.zeros((1,65)),np.zeros((1,65)),5,cv2.GC_INIT_WITH_MASK)
            gc=((mk==1)|(mk==3))&nd.binary_dilation(cm,iterations=12)
        except Exception: gc=np.zeros_like(cm)
        how='isnet+%d%%gc'%int(100*(gc&~k).sum()/max(cm.sum(),1))
        kis=k.copy(); k=k|gc
        k=nd.binary_closing(k,structure=np.ones((5,5),bool)); k=nd.binary_fill_holes(k)
        # 칠한 덩어리에서 너무 멀리 번진 것(배경의 다른 물체) 자르기
        k&=nd.binary_dilation(cm,iterations=M*S)
        for e in EX.get(key,[]):
            yy,xx=np.mgrid[0:k.shape[0],0:k.shape[1]]; gx=x0+xx/S; gy=y0+yy/S
            k&=~((gx>=e[0])&(gx<=e[2])&(gy>=e[1])&(gy<=e[3]))
        # 한 덩어리 안에 나무가 여럿이면 따로 — 앞뒤를 가르는 밑동 높이가 나무마다 다르다.
        # 나무 나누기는 isnet 조각으로 하고, GrabCut으로 더한 픽셀은 가장 가까운 나무에 붙인다.
        kis&=k
        CL,cn=nd.label(nd.binary_dilation(kis,iterations=2)); CL=CL*kis
        big_ids=[j for j in range(1,cn+1) if (CL==j).sum()>=1500]
        if not big_ids: parts=[k]
        else:
            seed=np.isin(CL,big_ids)
            _,(iy,ix)=nd.distance_transform_edt(~seed,return_indices=True)
            owner=CL[iy,ix]
            parts=[k&(owner==j) for j in big_ids]
            # 잎 덩어리가 줄기 위에 얹힌 모양(가로로 겹치고 세로로는 거의 안 겹침)이면 한 나무 — 다시 합친다
            def bb(m):
                ys_,xs_=np.where(m); return xs_.min(),ys_.min(),xs_.max(),ys_.max()
            merged=True
            while merged and len(parts)>1:
                merged=False
                for a in range(len(parts)):
                    for b in range(a+1,len(parts)):
                        A=bb(parts[a]); B=bb(parts[b])
                        xo=min(A[2],B[2])-max(A[0],B[0]); yo=min(A[3],B[3])-max(A[1],B[1])
                        wn=min(A[2]-A[0],B[2]-B[0]); hn=min(A[3]-A[1],B[3]-B[1])
                        if xo>=0.5*wn and yo<=0.15*hn and yo>-24:
                            parts[a]=parts[a]|parts[b]; parts.pop(b); merged=True; break
                    if merged: break
        for k in parts:
          ys,xs=np.where(k)
          if len(ys)==0: continue
          bx0,by0,bx1,by1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
          px0,py0=x0+bx0//S,y0+by0//S; px1,py1=x0+(bx1+S-1)//S,y0+(by1+S-1)//S
          kk=k[(py0-y0)*S:(py1-y0)*S,(px0-x0)*S:(px1-x0)*S]
          crop=bg.crop((px0*S,py0*S,px1*S,py1*S))
          alpha=Image.fromarray((kk*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
          rgba=np.dstack([np.asarray(crop),np.asarray(alpha)]); rgba[rgba[...,3]==0,:3]=0
          name=f"{f[:-5]}_{z}_{len(lst)}.webp"
          Image.fromarray(rgba,'RGBA').save(OUT+name,quality=90,method=6)
          lst.append({'src':'assets/canopy/'+name,'x':int(px0),'y':int(py0),'w':int(px1-px0),'h':int(py1-py0),'base':int(py1)})
          allmask[py0*S:py1*S,px0*S:px1*S]|=kk
          print(key,i,how,(px0,py0,px1,py1))
    data.setdefault(f,{})[z]=lst+keep
    # 도구에 보일 칸: 칸의 30% 이상 덮이면
    cg=np.zeros((R,C),np.uint8)
    for r in range(R):
        for c in range(C):
            sub=allmask[max(0,(r*G-8)*S):max(0,(r*G+8)*S),max(0,(c*G-8)*S):max(0,(c*G+8)*S)]
            if sub.size and sub.mean()>=0.3: cg[r,c]=1
    newcells[key]=cg
json.dump(data,open('canopy_data_new.json','w'),ensure_ascii=False)
with open(OUT+'data.js','w',encoding='utf-8') as fp:
    fp.write('/* 나무·지붕·문루 덮개 목록 — scripts/canopy의 mkpieces.py/refine.py/build_canopy.py가 만든다(손으로 고치지 말 것). canopy.js가 읽는다. */\n')
    fp.write('window.CANOPY_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
import pickle; pickle.dump(newcells,open('newcells.pkl','wb'))
