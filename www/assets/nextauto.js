/* ============ 맞혔으면 알아서 넘어간다 ============

   왜 만들었나
   - 문제를 맞힌 뒤에도 '다음'을 한 번 더 눌러야 넘어갔다. **맞혔다는 건
     안다는 뜻이다.** 아는 사람에게 단추를 한 번 더 누르게 하는 건 순전한 손해다.
   - 이 게임에는 문항이 640개가 넘는다. 한 번씩만 줄여도 640번이 줄어든다.

   무엇을 하고 무엇을 안 하나
   - **첫 시도에 맞혔을 때만** 저절로 넘어간다. 한 번이라도 틀렸으면 그대로 둔다 —
     해설을 읽어야 하는 순간을 재촉하면 안 된다.
   - 넘어가기 전에 단추 위로 가는 줄이 차오른다. 그동안 **아무 데나 누르면 즉시**
     넘어가고, **'다음'이 아닌 곳을 누르면 멈춘다**(더 보고 싶을 수 있다).
   - 이건 시간 제한이 아니다. 답을 고르는 동안에는 아무 시계도 돌지 않는다.

   어떻게 — 챕터를 하나도 안 고친다
   - Quiz는 챕터가 const로 선언하지만 전역 렉시컬이라 밖에서 잡힌다
     (window.Quiz로는 안 잡힌다 — difficulty.js와 같은 방식).

   붙이는 법
     <script src="assets/nextauto.js"></script>   (difficulty.js 뒤)
*/
window.NextAuto = (function(){
  const WAIT = 700;            // 맞힌 뒤 이만큼 뒤에 넘어간다
  let timer = 0, armed = false;

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    /* 차오르는 줄 — 단추 아래쪽에 얇게. 얼마나 남았는지 보이면 재촉이 아니라 안내가 된다. */
    #quiz-next.na-run { position:relative; overflow:hidden; }
    #quiz-next.na-run::after { content:''; position:absolute; left:0; bottom:0; height:2.5px;
      width:100%; background:#c9a24a; transform-origin:left center;
      animation:na-fill ${WAIT}ms linear forwards; }
    @keyframes na-fill { from { transform:scaleX(0); } to { transform:scaleX(1); } }`;
    document.head.appendChild(s);
  }

  function stop(){
    clearTimeout(timer); timer = 0; armed = false;
    const b = document.getElementById('quiz-next');
    if (b) b.classList.remove('na-run');
    document.removeEventListener('pointerdown', onTap, true);
  }

  function onTap(e){
    if (!armed) return;
    const b = document.getElementById('quiz-next');
    // '다음'을 눌렀으면 원래 동작에 맡긴다(중복 진행 방지)
    if (b && e.target && (e.target === b || b.contains(e.target))){ stop(); return; }
    // 그 밖의 곳을 누르면 **멈춘다.** 해설을 더 보고 싶을 수 있다.
    stop();
  }

  function arm(){
    css();
    const b = document.getElementById('quiz-next');
    if (!b) return;
    stop();
    armed = true;
    b.classList.add('na-run');
    document.addEventListener('pointerdown', onTap, true);
    timer = setTimeout(() => {
      armed = false;
      b.classList.remove('na-run');
      document.removeEventListener('pointerdown', onTap, true);
      // 그 사이에 화면이 닫혔으면 아무것도 하지 않는다
      const ov = document.getElementById('quiz-overlay');
      if (!ov || !ov.classList.contains('show')) return;
      if (b.classList.contains('show')) b.click();
    }, WAIT);
  }

  function wire(){
    try {
      if (typeof Quiz === 'undefined' || !Quiz || Quiz._naWired) return;
      const pick = Quiz.pick;
      if (typeof pick !== 'function') return;
      Quiz.pick = function(i){
        const missedBefore = this._missed;
        const r = pick.apply(this, arguments);
        // 맞혔고(answered), 이 문항에서 한 번도 안 틀렸을 때만
        try {
          if (this.answered && !missedBefore && !this._missed) arm();
        } catch(e){}
        return r;
      };
      // 문제가 새로 열리면 이전 타이머를 확실히 끈다
      const open = Quiz._openOne;
      if (typeof open === 'function'){
        Quiz._openOne = function(){ stop(); return open.apply(this, arguments); };
      }
      Quiz._naWired = true;
    } catch(e){}
  }

  function init(){
    wire();
    // Quiz가 나중에 만들어지는 챕터가 있어 잠깐 더 본다
    let n = 0;
    const t = setInterval(() => { wire(); if (++n > 20) clearInterval(t); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { arm, stop, wire, WAIT, isArmed: () => armed };
})();
