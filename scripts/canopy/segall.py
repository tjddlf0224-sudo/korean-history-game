import sys; sys.path.insert(0,'.')
from lib import *
import cv2
from rembg import remove, new_session
sess=new_session('isnet-general-use')
ZONES=[k for k in paste]
out={}
for k in ZONES:
    f,z=k.split('#'); g=fillgrid(paste[k])
    bg=background(f,z)
    lab,n=nd.label(nd.binary_dilation(g,structure=np.ones((3,3)),iterations=1))   # 1칸 틈은 한 덩어리
    lab=lab*g
    comps=[]
    for i in range(1,n+1):
        m=(lab==i)
        if not m.any(): continue
        rr,cc=np.where(m)
        x0=max(0,cc.min()*G-8); x1=min(W,cc.max()*G+8); y0=max(0,rr.min()*G-8); y1=min(H,rr.max()*G+8)
        cm=cellmask(m.astype(np.uint8))[y0*S:y1*S,x0*S:x1*S]
        mg=int(max(x1-x0,y1-y0)*0.2)
        X0,Y0,X1,Y1=max(0,x0-mg),max(0,y0-mg),min(W,x1+mg),min(H,y1+mg)
        big=bg.crop((X0*S,Y0*S,X1*S,Y1*S))
        a=np.asarray(remove(big,session=sess,only_mask=True)).astype(float)/255
        soft=a[(y0-Y0)*S:(y1-Y0)*S,(x0-X0)*S:(x1-X0)*S]
        comps.append({'box':[x0,y0,x1,y1],'cm':cm,'soft':soft,'cells':int(m.sum())})
    out[k]=comps
    print(k,[(c['box'],c['cells']) for c in comps])
import pickle; pickle.dump(out,open('comps.pkl','wb'))
