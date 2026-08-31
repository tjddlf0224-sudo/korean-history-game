/* ============ 연출 — 카메라·충격·집중선 ============

   왜 만들었나
   - 이 게임에는 **카메라가 없었다.** 줌도 흔들림도 없고, 있는 것이라곤 보스전
     DOM 안의 흔들림 하나뿐이었다. 그래서 무슨 일이 벌어져도 화면은 늘 같은 거리에서
     같은 자세로 보고만 있었다. 사건이 격했던 대목에서도 그랬다.
   - 박진감은 새 그림으로 만드는 게 아니라 **보는 방식**으로 만든다. 같은 장면도
     확 당겨서 흔들면 다른 장면이 된다. 그림을 한 장도 더 안 그리고 되는 일이다.

   어떻게 만들었나 — 챕터를 하나도 안 고친다
   - 무대는 <canvas id="game"> 한 장이다. 그 **엘리먼트에 CSS 변형을 건다.**
     그리기 코드(camX·ZOOM)를 고치려면 36개 파일을 건드려야 하지만, 이러면 한 곳이다.
   - 겹쳐 그리는 것(집중선·비네트)은 **#wrap 안에** 넣는다. 밖에 붙이면 세로 모드에서
     화면만 90도 틀어진다(보스전에서 이미 겪은 일이다. 미니맵도 같은 이유로 안에 있다).

   쓰는 법
     Fx.shake(12, 320)      화면을 흔든다(세기, ms)
     Fx.punch(.06, 260)     확 당겼다 놓는다
     Fx.lines(300)          집중선 — 먹을 튀긴 듯한 방사선
     Fx.danger(true)        붉은 비네트(위험). false로 끈다
     Fx.impact()            타격 한 방 = 흔들림+당김+집중선+히트스톱
     Fx.freeze(90)          화면을 아주 짧게 세운다(히트스톱)

   안 넣기로 한 것
   - **낙관(도장) 찍기**: 촌스럽다. 넣지 않는다.
   - **시간 제한**: 어디에도 걸지 않는다. 생각을 해야 배우고, 정답을 맞힌 뒤에는
     시계를 걸 이유가 없다. 미니게임에도 안 건다.

   지킨 것
   - **멀미를 안 만든다.** 흔들림에 상한을 두고, prefers-reduced-motion이면 전부
     세기를 크게 낮춘다(끄지는 않는다 — 아예 없으면 무슨 일이 난 줄 모른다).
   - **겹쳐서 커지지 않는다.** 연달아 부르면 더 세게 흔들리는 게 아니라 센 쪽을 따른다.
*/
window.Fx = (function(){

  const CAP_SHAKE = 22;                  // 이 이상은 안 흔든다
  function calm(){
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch(e){ return false; }
  }
  const K = () => calm() ? 0.35 : 1;     // 흔들림을 줄이는 사람에게는 약하게

  function stage(){ return document.getElementById('game'); }
  function layer(){ return document.getElementById('wrap') || document.body; }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #fx-lines, #fx-vig { position:absolute; inset:0; pointer-events:none; }
    #fx-lines { z-index:60; opacity:0; }
    /* 집중선 — 만화의 스피드선이 아니라 **먹을 튀긴 방사선**으로 간다.
       가운데는 비우고 가장자리만 남긴다(mask). 그래야 화면을 안 가린다. */
    #fx-lines i { position:absolute; inset:-12%;
      background:repeating-conic-gradient(from 0deg at 50% 50%,
        rgba(255,238,200,.00) 0deg, rgba(255,238,200,.34) .5deg,
        rgba(255,238,200,.00) 1.6deg, rgba(255,238,200,.00) 4deg);
      -webkit-mask-image:radial-gradient(circle at 50% 50%,
        transparent 34%, #000 62%, #000 100%);
      mask-image:radial-gradient(circle at 50% 50%,
        transparent 34%, #000 62%, #000 100%); }
    #fx-vig { z-index:59; opacity:0; transition:opacity .45s;
      box-shadow:inset 0 0 120px 34px rgba(150,26,26,.66); }
    #fx-vig.on { opacity:1; animation:fx-pulse 1.5s ease-in-out infinite; }
    @keyframes fx-pulse { 0%,100%{ opacity:.55; } 50%{ opacity:1; } }
`;
    document.head.appendChild(s);
  }

  /* ---------------- 카메라 ----------------
     흔들림과 당김을 **한 transform에 같이 쓴다.** 따로 쓰면 나중 것이 앞 것을 지운다. */
  let shakeAmp = 0, shakeUntil = 0, punchAmt = 0, punchUntil = 0, raf = 0;
  let freezeUntil = 0;      // 이 시각까지는 화면을 얼린다(히트스톱)

  function apply(){
    const el = stage();
    const now = performance.now();
    // 히트스톱 — 때린 순간을 아주 짧게 **정지**시킨다. 격투 게임의 기본기이고,
    // 이 게임에서 가장 싸게 무게를 만드는 방법이다. 90ms면 '멈췄다'고
    // 인식되지 않으면서 손맛만 남는다. 더 길면 렉으로 느껴진다.
    if (now < freezeUntil){
      raf = requestAnimationFrame(apply);
      return;                       // 이 프레임은 화면을 그대로 둔다
    }
    const sLeft = Math.max(0, shakeUntil - now);
    const pLeft = Math.max(0, punchUntil - now);
    if (!el){ raf = 0; return; }
    if (sLeft <= 0 && pLeft <= 0){
      el.style.transform = '';
      el.style.willChange = '';
      shakeAmp = punchAmt = 0; raf = 0;
      return;
    }
    let x = 0, y = 0;
    if (sLeft > 0){
      // 끝으로 갈수록 잦아든다. 일정하게 흔들면 기계 같다.
      const a = shakeAmp * (sLeft / (shakeUntil - shakeStart || 1));
      x = (Math.random() * 2 - 1) * a;
      y = (Math.random() * 2 - 1) * a;
    }
    let sc = 1;
    if (pLeft > 0){
      // 확 들어갔다가 부드럽게 돌아온다
      const t = 1 - pLeft / (punchUntil - punchStart || 1);
      sc = 1 + punchAmt * (t < .18 ? t / .18 : 1 - (t - .18) / .82);
    }
    el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
    raf = requestAnimationFrame(apply);
  }
  let shakeStart = 0, punchStart = 0;
  function pump(){
    const el = stage();
    if (el) el.style.willChange = 'transform';
    if (!raf) raf = requestAnimationFrame(apply);
  }

  function shake(mag, ms){
    const a = Math.min(CAP_SHAKE, (mag || 10)) * K();
    const until = performance.now() + (ms || 300);
    // 겹쳐 부르면 더 세지는 게 아니라 **센 쪽을 따른다**
    if (a >= shakeAmp || performance.now() > shakeUntil){ shakeAmp = a; shakeStart = performance.now(); }
    if (until > shakeUntil) shakeUntil = until;
    pump();
  }
  function punch(amt, ms){
    const a = Math.min(.22, (amt || .05)) * K();
    const until = performance.now() + (ms || 260);
    if (a >= punchAmt || performance.now() > punchUntil){ punchAmt = a; punchStart = performance.now(); }
    if (until > punchUntil) punchUntil = until;
    pump();
  }

  /* ---------------- 집중선 ---------------- */
  let lineT = 0;
  function lines(ms){
    css();
    let d = document.getElementById('fx-lines');
    if (!d){
      d = document.createElement('div'); d.id = 'fx-lines';
      d.innerHTML = '<i></i>';
      layer().appendChild(d);
    }
    const dur = ms || 320;
    const i = d.firstChild;
    // 들어올 때 살짝 돌면서 조여든다 — 가만히 있으면 그림 같고, 움직이면 힘이 붙는다
    i.style.transition = 'none';
    i.style.transform = 'rotate(0deg) scale(1.35)';
    d.style.transition = 'none';
    d.style.opacity = calm() ? '.28' : '.85';
    requestAnimationFrame(() => {
      i.style.transition = `transform ${dur}ms ease-out`;
      i.style.transform = 'rotate(7deg) scale(1)';
      d.style.transition = `opacity ${dur}ms ease-out`;
      d.style.opacity = '0';
    });
    clearTimeout(lineT);
    lineT = setTimeout(() => { d.style.opacity = '0'; }, dur + 40);
  }

  /* ---------------- 위험 비네트 ---------------- */
  function danger(on){
    css();
    let d = document.getElementById('fx-vig');
    if (!d){ d = document.createElement('div'); d.id = 'fx-vig'; layer().appendChild(d); }
    d.classList.toggle('on', !!on);
  }


  /* 아주 짧게 화면을 세운다. 흔들림·당김이 도는 중에 이걸 걸면
     그 프레임에서 딱 멈췄다가 다시 흐른다 — 그 한 박자가 타격이 된다.
     느려진 시간을 오래 끌면 렉이라 오해받으므로 100ms를 넘기지 않는다. */
  function freeze(ms){
    const t = performance.now() + Math.min(100, ms || 90) * (calm() ? 0.4 : 1);
    if (t > freezeUntil) freezeUntil = t;
    pump();
  }

  /* ---------------- 타격 한 방 ----------------
     흔들림·당김·집중선은 따로 쓰면 밋밋하다. 셋이 같은 순간에 겹쳐야 '맞았다'가 된다.
     강도: 1 보통 / 2 크게 / 3 결정타 */
  function impact(level){
    const L = level || 1;
    punch(.04 + .028 * L, 220 + 60 * L);
    shake(7 + 5 * L, 240 + 70 * L);
    freeze(52 + 20 * L);            // 보통 72 · 크게 92 · 결정타 112→100(상한)
    if (L >= 2) lines(260 + 60 * L);
    try { if (navigator.vibrate) navigator.vibrate(L >= 3 ? [50, 30, 70] : 40); } catch(e){}
  }

  return { shake, punch, lines, danger, impact, freeze, calm };
})();
