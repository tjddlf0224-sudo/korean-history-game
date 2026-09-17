# -*- coding: utf-8 -*-
"""국가유산포털 사진의 공공누리 유형을 사진 한 장씩 확인한다.
   python3 scripts/check_kogl.py <ccbaCpno> [파일이름조각 ...]
   상세페이지 → selectCulImageList.do → 각 사진 id로 imgHeritage.do를 열어 mark0N.svg를 읽는다."""
import json, re, subprocess, sys

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
def curl(url, xhr=False):
    cmd = ['curl', '-sL', '-A', UA]
    if xhr: cmd += ['-H', 'X-Requested-With: XMLHttpRequest']
    return subprocess.run(cmd + [url], capture_output=True, text=True).stdout

cpno = sys.argv[1]
want = sys.argv[2:]
page = curl(f'https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno={cpno}&pageNo=1_1_2_0')
g = lambda k: re.search(k + r"=([0-9A-Za-z]+)", page).group(1)
kdcd, asno, ctcd = g('ccbaKdcd'), g('ccbaAsno'), g('ccbaCtcd')
data = json.loads(curl(f'https://www.heritage.go.kr/heri/cul/selectCulImageList.do?ccbaKdcd={kdcd}&ccbaAsno={asno}&ccbaCtcd={ctcd}', xhr=True))
for x in data['list']:
    fn = x['imageUrl'].split('/')[-1]
    if want and not any(w in fn for w in want): continue
    html = curl(f"https://www.heritage.go.kr/heri/cul/imgHeritage.do?ccimId={x['id']}&ccbaKdcd={kdcd}&ccbaAsno={asno}&ccbaCtcd={ctcd}")
    m = re.search(r'/images/2025/open/mark0(\d)\.svg', html)
    t = re.search(r'licenseType(\d)\.do', html)
    print(f"{fn:34s} id={x['id']:>18s} 공공누리 제{m.group(1) if m else '?'}유형  링크 type{t.group(1) if t else '?'}  {x.get('desc','')[:34]}")
