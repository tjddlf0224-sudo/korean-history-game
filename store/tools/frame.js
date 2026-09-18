const { chromium } = require('/Users/yunsismac/AccountingMaster-Projects/AccountingMaster-Capacitor-v2/node_modules/playwright');
const path = require('path');
const SIZE = process.argv[2] || 'iphone';
const VP = SIZE === 'ipad' ? {width:1376,height:1032} : {width:1389,height:642};
const LIST = [
  ['2','직접 걸으며 역사 속 인물을 만나요','36개 이야기 · 한능검 심화 출제 범위 전체'],
  ['3','지도와 연표로 한눈에','대화 속에 핵심이 그림으로 정리됩니다'],
  ['5','배운 만큼 싸우는 보스전','계백 · 세조 · 전봉준… 기출로 논파하세요'],
  ['4','진짜 문화유산 사진으로 확인','국립중앙박물관 · 국가유산청 공공누리 자료'],
  ['6','218명의 인물 도감','만난 인물을 모으고 동료로 데려가세요'],
  ['7','기출 변형 문제로 실전 연습','시대별 기출을 바꿔 낸 문제 수백 개'],
  ['1','한능검 심화, 이야기로 끝낸다','선사부터 현대까지 한 흐름으로'],
];
(async()=>{
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:VP, deviceScaleFactor:2 });
  let n=0;
  for (const [src, h, s] of LIST){
    n++;
    const img = 'data:image/png;base64,' + require('fs').readFileSync(`${SIZE}_${src}.png`).toString('base64');
    const cap = SIZE==='ipad' ? 150 : 118;
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;width:${VP.width}px;height:${VP.height}px;overflow:hidden;
 background:radial-gradient(120% 90% at 50% 0%, #3a2a14 0%, #1a130a 55%, #120d07 100%);font-family:"Gowun Batang",serif;}
.cap{height:${cap}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${SIZE==='ipad'?10:6}px;}
h1{margin:0;color:#f3cf78;font-size:${SIZE==='ipad'?52:40}px;font-weight:700;letter-spacing:.02em;text-shadow:0 2px 10px rgba(0,0,0,.6)}
p{margin:0;color:#d9c9a6;font-size:${SIZE==='ipad'?24:18}px;letter-spacing:.04em}
.shot{position:absolute;left:50%;bottom:${SIZE==='ipad'?40:22}px;transform:translateX(-50%);
 height:${VP.height - cap - (SIZE==='ipad'?40:22) - 6}px;border-radius:18px;overflow:hidden;
 box-shadow:0 18px 50px rgba(0,0,0,.7),0 0 0 2px #6b5226}
.shot img{height:100%;display:block}
</style></head><body><div class="cap"><h1>${h}</h1><p>${s}</p></div><div class="shot"><img src="${img}"></div></body></html>`, {waitUntil:'networkidle'});
    await p.evaluate(()=>document.fonts.ready);
    await p.waitForTimeout(400);
    await p.screenshot({path:`final_${SIZE}_${n}.png`});
  }
  await b.close(); console.log('done');
})();
