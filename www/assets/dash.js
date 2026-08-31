/* ============ 달리기 — 끝까지 밀면 뛴다 ============

   왜 만들었나
   - 이동 속도가 전 챕터 한 값(165, 화면상 264px/s)으로 고정이었고 달리는 수단이
     아예 없었다. 지도를 가로지르는 동안은 아무 일도 안 일어나는데 그 시간이 늘 같다.
   - 속도감은 **빠른 것**이 아니라 **빨라지는 것**에서 온다. 늘 빠르면 그게 보통이
     되어 아무 느낌이 없다. 그래서 평소 속도는 그대로 두고, 밀어붙였을 때만 붙게 했다.

   어떻게 — 단추를 새로 안 만든다
   - 조이스틱은 이미 **얼마나 밀었는지**를 갖고 있다(World.stick.dx/dy는 0~1).
     그런데 World.update()가 곧바로 정규화해서 그 크기를 버린다. 버려지던 값을 읽어서
     **끝까지 민 동안만** 속도를 올린다. 화면에 단추가 하나도 안 늘어난다.
   - 자판은 Shift다.
   - 자동 이동은 늘 뛴다 — 그건 건너뛰려고 켜는 것이기 때문이다.

   지킨 것
   - **서서히 붙는다.** 즉시 바뀌면 순간이동처럼 보이고 속도감이 오히려 죽는다.
   - 챕터 파일은 하나도 안 고친다. World는 전역 렉시컬 환경에 있어 밖에서 읽힌다
     (window.World가 아니다 — 이걸 몰라 여섯 번 걸렸다).

   붙이는 법
     <script src="assets/dash.js"></script>   (fx.js 뒤)
*/
window.Dash = (function(){
  const BASE = 165;          // 챕터가 쓰는 기본값
  const RUN  = 258;          // 달릴 때. 1.56배
  const RIM  = 0.92;         // 이만큼 밀면 달린다(끝까지 민 것)
  const RAMP = 260;          // 붙는 데 걸리는 시간(ms)

  let cur = BASE, want = BASE, last = 0, shift = false, running = false, raf = 0;

  function world(){
    try { return (typeof World !== 'undefined') ? World : null; } catch(e){ return null; }
  }

  /* 조이스틱을 얼마나 밀었나 — update()가 버리는 값 */
  function push(){
    const W = world();
    if (!W || !W.stick) return 0;
    return Math.min(1, Math.hypot(W.stick.dx || 0, W.stick.dy || 0));
  }

  /* autowalk.js는 isOn()이 아니라 게터 `on`으로 상태를 알려 준다.
     함수인 줄 알고 부르면 조용히 늘 false가 되어 자동 이동이 안 빨라진다. */
  function autoOn(){
    try { return !!(window.Auto && Auto.on); } catch(e){ return false; }
  }

  /* 속도를 한 걸음 옮긴다. 화면도 World도 안 건드리는 **순수 계산**이라
     브라우저 없이 확인할 수 있다(연출은 rAF 위에서 도는데, 그건 창이 숨으면
     아예 멈춰서 확인이 안 된다 — 그래서 판단하는 부분만 따로 뺐다). */
  function step(prev, dt, pushAmt, shiftKey, auto){
    const want = (auto || shiftKey || pushAmt >= RIM) ? RUN : BASE;
    const d = (RUN - BASE) * (dt / RAMP);
    if (prev < want) return Math.min(want, prev + d);
    if (prev > want) return Math.max(want, prev - d);
    return prev;
  }

  function tick(now){
    const W = world();
    if (!W){ raf = 0; return; }
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;

    cur = step(cur, dt, push(), shift, autoOn());
    want = cur;
    W.speed = cur;

    // 막 뛰기 시작한 순간에만 한 번 —  계속 걸어 두면 멀미가 난다
    const nowRunning = cur > BASE + (RUN - BASE) * 0.6;
    if (nowRunning && !running && window.Fx && W.moving) Fx.lines(240);
    running = nowRunning;

    raf = requestAnimationFrame(tick);
  }

  function start(){
    if (raf || !world()) return;
    last = 0; raf = requestAnimationFrame(tick);
  }

  function init(){
    addEventListener('keydown', e => { if (e.key === 'Shift') shift = true; });
    addEventListener('keyup',   e => { if (e.key === 'Shift') shift = false; });
    // World가 만들어질 때까지 기다린다. 챕터마다 만들어지는 시점이 다르다.
    let tries = 0;
    const wait = setInterval(() => {
      if (world() || ++tries > 40){ clearInterval(wait); start(); }
    }, 150);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { start, speed: () => cur, step, BASE, RUN, RIM, RAMP };
})();
