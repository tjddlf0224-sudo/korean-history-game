import sys; sys.path.insert(0,'.')
from lib import *
import pickle, cv2, glob
comps=pickle.load(open('comps.pkl','rb'))
OUT=WWW+'assets/canopy/'
def grab(bgcrop, cm, soft):
    bgr=cv2.cvtColor(np.asarray(bgcrop),cv2.COLOR_RGB2BGR)
    mask=np.full(cm.shape,cv2.GC_BGD,np.uint8)
    inner=nd.binary_erosion(cm,iterations=10)
    mask[cm]=cv2.GC_PR_FGD; mask[inner]=cv2.GC_FGD
    mask[cm&(soft<0.03)&~inner]=cv2.GC_PR_BGD
    cv2.grabCut(bgr,mask,None,np.zeros((1,65)),np.zeros((1,65)),6,cv2.GC_INIT_WITH_MASK)
    return ((mask==1)|(mask==3))&cm
data=json.load(open('canopy_data_old.json'))
tot=0
for k,cl in comps.items():
    f,z=k.split('#')
    for old in data.get(f,{}).get(z,[]):
        p=WWW+old['src']
        if os.path.exists(p): os.remove(p)
    lst=[]; bg=background(f,z)
    for i,c in enumerate(cl):
        x0,y0,x1,y1=c['box']; crop=bg.crop((x0*S,y0*S,x1*S,y1*S))
        A=c['cm']&(c['soft']>0.12)
        m=A if A.sum()/c['cm'].sum()>=0.5 else grab(crop,c['cm'],c['soft'])
        m=nd.binary_closing(m,structure=np.ones((5,5),bool))&c['cm']
        alpha=Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8)) if False else Image.fromarray((m*255).astype('uint8'))
        from PIL import ImageFilter
        alpha=alpha.filter(ImageFilter.GaussianBlur(0.8))
        rgba=np.dstack([np.asarray(crop),np.asarray(alpha)]); rgba[rgba[...,3]==0,:3]=0
        name=f"{f[:-5]}_{z}_{i}.webp"
        Image.fromarray(rgba,'RGBA').save(OUT+name,quality=90,method=6)
        tot+=os.path.getsize(OUT+name)
        lst.append({'src':'assets/canopy/'+name,'x':int(x0),'y':int(y0),'w':int(x1-x0),'h':int(y1-y0),'base':int(y1)})
    data.setdefault(f,{})[z]=lst
    print(k,len(lst))
json.dump(data,open('canopy_data_new.json','w'),ensure_ascii=False)
with open(OUT+'data.js','w',encoding='utf-8') as fp:
    fp.write('/* 나무·지붕·문루 덮개 목록 — scratchpad의 mkpieces.py/build_canopy.py가 만든다(손으로 고치지 말 것). canopy.js가 읽는다. */\n')
    fp.write('window.CANOPY_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print('new bytes',tot, 'dir', sum(os.path.getsize(p) for p in glob.glob(OUT+'*.webp')))
