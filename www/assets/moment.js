/* ============ 급한 대목 — 사건이 격했던 자리에서만 화면이 급해진다 ============

   왜 만들었나
   - 카메라(fx.js)를 만들어 놓고 보스전에서만 썼다. 정작 역사가 가장 급했던
     대목들은 조용한 대사창으로 지나갔다. 몽골이 쳐들어와도, 조총이 울려도,
     만세 소리가 번져도 화면은 가만히 있었다.
   - **아무 데나 흔들면 싸구려가 된다.** 그래서 자리를 손으로 골랐다.
     여기 적힌 다섯 대목은 전부 그 챕터가 이미 다루는 사건이다 —
     없는 사건을 만들지 않았고, 대사도 한 줄 안 고쳤다. 화면만 반응한다.

   어떻게 — 챕터를 하나도 안 고친다
   - Dialog.render 를 밖에서 감싼다. 그 안에 `this.key`(대화 키)와 `this.idx`
     (몇 번째 대사인지)가 있으므로, 파일·키·순번으로 자리를 짚을 수 있다.
   - Dialog 는 챕터가 const 로 선언하지만 전역 렉시컬이라 밖에서 잡힌다
     (window.Dialog 로는 안 잡힌다 — 이 함정에 여러 번 걸렸다).

   지킨 것
   - **한 대사에 한 번만.** 대사를 앞뒤로 넘기며 다시 읽을 때마다 흔들리면
     성가시다.
   - 붉은 비네트는 **그 대사를 벗어나면 반드시 끈다.** 안 끄면 지도 위까지
     붉게 남는다(보스전에서 겪었다).
   - 세기를 낮게 잡았다. 보스전 타격보다 약해야 한다 — 여기는 이야기지 싸움이 아니다.

   붙이는 법
     <script src="assets/moment.js"></script>   (fx.js 뒤)
*/
window.Moment = (function(){

  /* 파일 → 대화키 → 대사 순번(0부터) → 무엇을 할지
     kind: shake(흔들림) / boom(한 방) / swell(밀려옴) / dread(불안) */
  const M = {
    'goryeo2.html': {
      // 삼별초의 항쟁이 끝나는 줄. 1273년 여몽연합군에게 진압된다.
      sambyeolcho_0: { 3: { kind:'fall' } },
    },
    'imjin.html': {
      // 동래성이 반나절을 못 버티고 무너지는 줄
      dongnae_0: { 3: { kind:'fall' } },
      // 탄금대 — 조총이 먼저 오고, 그다음 강에 몸을 던진다
      sinrip_0:  { 4: { kind:'shot', big:true }, 5: { kind:'fall' } },
    },
    'ilje1.html': {
      // 만세는 때리는 것이 아니라 **밀려오는** 것이다. 그래서 흔들지 않고 당긴다.
      siwon1_0:    { 1: { kind:'swell' } },
      // 독립선언서를 외는 줄에서 크게, 제암리 학살을 말하는 줄에서 붉어진다
      yugwansun_0: { 2: { kind:'swell', big:true }, 6: { kind:'dread' } },
    },
    'hyeondae1.html': {
      // 6·25 — **흔들지 않는다.** 흔들면 전쟁이 액션이 된다.
      // 새벽의 남침에서 한 번 낮게 울리고, 흥남 철수에서 가장자리가 붉어진다.
      yukio_0: { 0: { kind:'rumble' }, 2: { kind:'dread' } },
    },
  };

  const seen = new Set();          // 파일|키|순번 — 한 번만
  let dangerOn = false;

  function fire(spec){
    if (!window.Fx) return;
    const big = !!spec.big;
    switch (spec.kind){
      case 'rumble':               // 멀리서 다가오는 것
        Fx.shake(big ? 7 : 4, big ? 1400 : 1000);
        break;
      case 'shot':                 // 조총 — 짧고 날카롭게
        Fx.punch(big ? .06 : .04, 200);
        Fx.shake(big ? 12 : 8, 240);
        Fx.freeze(big ? 70 : 45);
        break;
      case 'fall':                 // 무너짐
        Fx.shake(14, 900);
        Fx.punch(.05, 600);
        break;
      case 'swell':                // 함성 — 때리지 않고 밀려온다
        Fx.punch(big ? .09 : .06, big ? 1200 : 900);
        if (big) Fx.lines(700);
        break;
      case 'dread':                // 불안 — 가장자리가 붉어진다
        Fx.danger(true); dangerOn = true;
        break;
    }
  }

  function clearDanger(){
    if (dangerOn && window.Fx){ Fx.danger(false); dangerOn = false; }
  }

  function look(){
    try {
      if (typeof Dialog === 'undefined' || !Dialog) return;
      const file = location.pathname.split('/').pop();
      const byKey = M[file];
      if (!byKey) return;
      const spot = byKey[Dialog.key] && byKey[Dialog.key][Dialog.idx];
      if (!spot){ clearDanger(); return; }
      const id = file + '|' + Dialog.key + '|' + Dialog.idx;
      if (seen.has(id)){ return; }     // 다시 읽어도 한 번만
      seen.add(id);
      clearDanger();
      fire(spot);
    } catch(e){}
  }

  function wire(){
    try {
      if (typeof Dialog === 'undefined' || !Dialog || Dialog._momWired) return;
      const r = Dialog.render;
      if (typeof r !== 'function') return;
      Dialog.render = function(){ const out = r.apply(this, arguments); look(); return out; };
      const c = Dialog.close;
      if (typeof c === 'function'){
        Dialog.close = function(){ clearDanger(); return c.apply(this, arguments); };
      }
      Dialog._momWired = true;
    } catch(e){}
  }

  function init(){
    wire();
    let n = 0;
    const t = setInterval(() => { wire(); if (++n > 20) clearInterval(t); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { M, wire, fire, _seen: seen };
})();
