const { chromium } = require('/Users/yunsismac/AccountingMaster-Projects/AccountingMaster-Capacitor-v2/node_modules/playwright');
const SIZE = process.argv[2] || 'iphone';
const VP = SIZE === 'ipad' ? {width:1376,height:1032} : {width:1434,height:660};
const ONLY = process.argv[3];
const B = 'http://localhost:8912/';
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:VP, deviceScaleFactor:2 });
  await ctx.addInitScript(()=>{ try{
    localStorage.setItem('khg_prologue_seen','1'); localStorage.setItem('khg_guide', JSON.stringify(['__off__']));
    localStorage.setItem('khg_rank', JSON.stringify({xp:4100}));
    localStorage.setItem('khg_gold', JSON.stringify({gold:2877, shield:0, funded:true}));
    if (!localStorage.getItem('khg_heroes_seeded')){
      localStorage.setItem('khg_heroes_seeded','1');
    }
  }catch(e){} });
  const p = await ctx.newPage();
  p.on('pageerror', e=>console.log('ERR', e.message));
  async function go(u){
    await p.goto(B+u); await p.waitForTimeout(2500);
    // 인트로 내레이션 닫기
    for (let i=0;i<40;i++){
      const vis = await p.evaluate(()=>{ const o=document.getElementById('intro-overlay'); return o && getComputedStyle(o).display!=='none' && o.offsetParent!==null && !o.classList.contains('hide'); });
      if (!vis) break;
      await p.evaluate(()=>{ try{ introSkip(); }catch(e){ const n=document.getElementById('intro-next'); n&&n.click(); } });
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(800);
  }
  async function shot(n){ await p.screenshot({path:`${SIZE}_${n}.png`}); console.log('saved', n); }
  const want = n => !ONLY || ONLY.split(',').includes(n);

  if (want('1')){ await go('index.html'); await shot('1'); }
  if (want('2')){ await go('godae1.html'); await shot('2'); }
  if (want('3')){ await go(SIZE==='ipad' ? 'godae1.html?tl=1' : 'godae1.html');
    await p.evaluate(()=>{ Dialog.open('geunchogo_0'); Dialog.idx = (location.search.includes('tl') ? Dialog.data.beats.findIndex(b=>b.chart&&b.chart.type==='timeline') : 0); Dialog.render(); });
    await p.waitForTimeout(900); await shot('3'); }
  if (want('4')){ await go('godae1.html');
    await p.evaluate(()=>{ Dialog.open('gwanggaeto_0'); const i=Dialog.data.beats.findIndex(b=>b.docImg); Dialog.idx=i; Dialog.render(); });
    await p.waitForTimeout(1200); await shot('4'); }
  if (want('5')){ await go('tongil.html');
    await p.evaluate(()=>{ Boss.start({ name:'계백', img:'assets/boss/gyebaek.png', bg:'assets/scenes/tongil_hwangsanbeol.webp', hp:5, lives:3, questions: Boss.fromChapter(NPC_DATA,5) }); });
    await p.waitForTimeout(1800); await shot('5'); }
  if (want('6')){ await go('goryeo2.html');
    await p.evaluate(()=>{ const d=window.HERO_DATA; const have={}; Object.keys(d).forEach((k,i)=>{ if(i%9!==4) have[k]= (i%3===0?2:1); });
      localStorage.setItem('khg_heroes', JSON.stringify({have, prog:{}})); Heroes.openBook(); });
    await p.waitForTimeout(1200);
    await p.evaluate(()=>{ const p=document.querySelector('#hero-ov .panel'); if(p) p.scrollTop=0; });
    await shot('6'); }
  if (want('7')){ await go('exam_practice.html?era=3'); await p.waitForTimeout(2000); await shot('7'); }
  await b.close();
})();
