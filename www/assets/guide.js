/* ============ 가이드 — 읽히지 말고, 해 보게 한다 ============

   왜 이렇게 만들었나
   - 쿠키런은 시작할 때 **실제로 플레이하는 도중에 잠깐씩 멈춰 세워** 알려 준다.
     글로 된 설명서를 먼저 읽히지 않는다. 그래서 직관적이다.
   - 여기도 같은 방식이다. 화면을 어둡게 덮되 **가리킬 것만 뚫어** 보여 주고,
     "이걸 해 보라"고 한 뒤 **그 행동을 실제로 할 때까지 기다린다.**
     읽고 넘기는 것이 아니라 한 번 해 봤을 때 끝난다.

   두 가지 자리에서 뜬다
     1) 처음 챕터에 들어왔을 때 — 움직이기 → 다가가기 → 말 걸기 → 문제 풀기
     2) 계급이 올라 기능이 열렸을 때 — 열린 단추를 가리키고 한 번 눌러 보게 한다

   원칙
   - 한 번 끝낸 가이드는 다시 안 뜬다(기기에 적어 둔다).
   - 언제든 건너뛸 수 있다. 붙잡아 두면 그때부터 방해다.
   - 기다리는 조건이 영영 안 오면 스스로 물러난다(막히지 않게).

   붙이는 법
     <script src="assets/guide.js"></script>   (unlock.js 뒤)
*/
window.Guide = (function(){
  const KEY = 'khg_guide';

  function done(){
    try { return new Set(JSON.parse(localStorage.getItem(KEY)) || []); } catch(e){ return new Set(); }
  }
  function mark(id){
    const s = done(); s.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch(e){}
  }
  function has(id){ return done().has(id); }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    /* 화면을 덮되 가리킬 것만 뚫는다. box-shadow를 크게 줘서 구멍 바깥을
       어둡게 만든다 — 사각형 네 개를 따로 그리는 것보다 어긋남이 없다. */
    #gd-hole { position:absolute; z-index:9200; border-radius:14px; pointer-events:none;
      box-shadow:0 0 0 9999px rgba(6,4,2,.82); transition:none; }
    #gd-hole.ring { outline:2px solid #f0c96b; outline-offset:3px; }
    #gd-bub { position:absolute; z-index:9201; width:min(84%,330px);
      background:#1a140c; border:1px solid #c9a24a; border-radius:14px;
      padding:14px 16px; font-family:"Gowun Batang",serif; color:#f5ecd8;
      font-size:14.5px; line-height:1.8; }
    #gd-bub .t { color:#f0c96b; font-weight:700; font-size:13px; letter-spacing:.14em;
      display:block; margin-bottom:5px; }
    #gd-bub .skip { display:block; margin-top:10px; background:none; border:0;
      color:#8d7f66; font-family:inherit; font-size:12.5px; cursor:pointer; padding:2px; }
    #gd-bub .go { display:block; width:100%; margin-top:10px; padding:10px;
      border-radius:9px; border:1px solid #4a3c26; background:#3a2c1a; color:#f0c96b;
      font-family:inherit; font-size:14px; cursor:pointer; }
    /* 손가락 — 가리키는 곳에서 까딱인다 */
    #gd-tap { position:absolute; z-index:9202; width:26px; height:26px; pointer-events:none;
      border-radius:50%; border:2px solid #f0c96b; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function el(id){ return document.getElementById(id); }
  function clear(){
    ['gd-hole','gd-bub','gd-tap'].forEach(i => { const e = el(i); if (e) e.remove(); });
  }

  /* 화면 크기 — #wrap이 0×0으로 잡히는 챕터가 있어서(자식만 절대배치)
     그럴 땐 뷰포트를 쓴다. 이걸 안 하면 말풍선이 화면 밖으로 나간다. */
  function box(){
    const r = layer().getBoundingClientRect();
    return (r.width > 10 && r.height > 10)
      ? { l: r.left, t: r.top, w: r.width, h: r.height }
      : { l: 0, t: 0, w: window.innerWidth, h: window.innerHeight };
  }

  /* 대상 사각형 구하기 — DOM 요소 또는 직접 준 사각형 */
  function rectOf(target){
    const L = box();
    if (target && target.getBoundingClientRect){
      const r = target.getBoundingClientRect();
      return { x: r.left - L.l, y: r.top - L.t, w: r.width, h: r.height };
    }
    if (target && typeof target.x === 'number') return target;
    return { x: L.w / 2, y: L.h / 2, w: 1, h: 1 };
  }

  /* 자리가 잡혔는가 — 배치가 끝나기 전에 재면 화면 밖 좌표가 나온다.
     실제로 겪었다: 금 단추가 화면에 멀쩡히 보이는데 left가 -76으로 읽혔다. */
  function settled(r){
    const L = box();
    return r.w > 0 && r.h > 0 &&
           r.x + r.w > 0 && r.y + r.h > 0 &&
           r.x < L.w && r.y < L.h;
  }
  function whenSettled(getTarget, tries){
    return new Promise(res => {
      let n = 0;
      (function tick(){
        const r = rectOf(typeof getTarget === 'function' ? getTarget() : getTarget);
        if (settled(r) || ++n >= (tries || 20)) return res(r);
        setTimeout(tick, 120);
      })();
    });
  }

  /* 한 단계 보여 주기.
     wait: () => boolean 이면 그 조건이 참이 될 때까지 기다린다.
     wait 가 없으면 "알겠다" 단추를 누를 때까지. */
  async function step(opt){
    css();
    clear();
    const r = await whenSettled(opt.target);
    if (opt.target && !settled(r)) return true;   // 끝내 못 찾으면 이 단계는 건너뛴다
    return new Promise(resolve => {
      const L = layer();
      const pad = opt.pad == null ? 8 : opt.pad;

      const hole = document.createElement('div');
      hole.id = 'gd-hole';
      if (opt.ring !== false) hole.className = 'ring';
      hole.style.left = (r.x - pad) + 'px';
      hole.style.top = (r.y - pad) + 'px';
      hole.style.width = (r.w + pad * 2) + 'px';
      hole.style.height = (r.h + pad * 2) + 'px';
      L.appendChild(hole);

      const bub = document.createElement('div');
      bub.id = 'gd-bub';
      bub.innerHTML = (opt.tag ? `<span class="t">${opt.tag}</span>` : '') + opt.text +
        (opt.wait ? '' : '<button class="go">알겠다</button>') +
        '<button class="skip">가이드 그만 보기</button>';
      L.appendChild(bub);

      // 말풍선은 구멍을 피해 위나 아래에 붙인다
      const LB = box();
      // 넣은 **뒤에** 실제 크기로 맞춘다. 먼저 계산하면 offsetWidth가 0이라
      // 화면 밖으로 밀려 잘린다(실제로 왼쪽이 잘렸다).
      function place(){
        const bw = bub.offsetWidth, bh2 = bub.offsetHeight;
        const below2 = r.y + r.h + 16;
        bub.style.left = Math.round(Math.max(10, Math.min(LB.w - bw - 10,
                                    r.x + r.w / 2 - bw / 2))) + 'px';
        bub.style.top = Math.round(below2 + bh2 < LB.h - 10 ? below2
                                   : Math.max(10, Math.min(LB.h - bh2 - 10, r.y - bh2 - 16))) + 'px';
      }
      place();
      requestAnimationFrame(place);

      let timer = null, poll = null;
      function finish(skipAll){
        clearTimeout(timer); clearInterval(poll);
        clear();
        resolve(skipAll ? 'skip' : true);
      }
      bub.querySelector('.skip').onclick = () => finish(true);
      const go = bub.querySelector('.go');
      if (go) go.onclick = () => finish(false);

      if (opt.wait){
        poll = setInterval(() => { try { if (opt.wait()) finish(false); } catch(e){} }, 250);
        // 영영 안 오는 조건에 갇히지 않게 — 오래 걸리면 스스로 물러난다
        timer = setTimeout(() => finish(false), opt.timeout || 30000);
      }
    });
  }

  const running = new Set();
  async function run(id, steps){
    if (has(id) || running.has(id)) return;
    running.add(id);
    try {
      for (const s of steps){
        const r = await step(s);
        if (r === 'skip'){ markAll(); return; }
      }
      // **끝까지 간 뒤에** 적는다. 시작할 때 적으면, 화면이 아직 안 잡혀
      // 한 번 실패했을 때 그 가이드를 영영 못 보게 된다(실제로 그랬다).
      mark(id);
    } finally { running.delete(id); }
  }
  function markAll(){
    // "그만 보기"를 누르면 앞으로 모든 가이드를 안 띄운다
    try { localStorage.setItem(KEY, JSON.stringify(['__off__'])); } catch(e){}
  }
  function off(){ return has('__off__'); }

  /* ---------------- 첫 챕터 ---------------- */
  function firstChapter(){
    if (off() || has('first')) return;
    if (typeof World === 'undefined') return;
    const started = { x: World.px, y: World.py };
    run('first', [
      { tag:'움 직 이 기', target: () => el('stick-zone'),
        text:'왼쪽 아래 둥근 곳을 끌면 걷는다. 한번 움직여 보라.',
        wait: () => Math.hypot(World.px - started.x, World.py - started.y) > 40,
        timeout: 25000 },
      { tag:'다 가 가 기', target: null, ring:false,
        text:'머리 위에 <b>!</b>가 뜬 사람에게 다가가 보라.',
        wait: () => !!World.nearNpc, timeout: 40000 },
      { tag:'말 걸 기', target: () => el('act-btn'),
        text:'이 단추를 누르면 말을 건다.',
        wait: () => !!document.querySelector('#dlg-overlay.show, .ov.show'),
        timeout: 25000 },
      { tag:'문 제', target: () => el('quiz-panel') || el('quiz-overlay'),
        text:'대사 끝에 문제가 나온다. <b>틀려도 괜찮다</b> — 바로 해설이 나오고, 틀린 문제는 며칠 뒤 다시 만난다.',
      },
    ]);
  }

  /* ---------------- 기능이 열렸을 때 ----------------
     unlock.js가 여는 것들과 짝을 맞춘다. 열린 단추를 가리키고
     **한 번 눌러 보게** 한다 — 열렸다고 알리기만 하면 안 쓴다. */
  const ON_UNLOCK = {
    heroes: { btn: 'hero-btn', tag:'인 물 도 감',
      text:'만난 사람이 카드로 쌓인다. 그 사람의 문제를 <b>첫 시도에 다 맞히면 ★</b>이 붙는다.' },
    shop:   { btn: 'gold-btn',   tag:'금 으 로  하 는  것',
      text:'모은 금을 쓸 수 있게 되었다. 눌러서 무엇이 있는지 보라.' },
    auto:   { btn: 'auto-btn',   tag:'자 동 이 동',
      text:'이제 걷는 것은 맡겨도 된다. <b>대사는 직접 넘겨야 한다</b> — 거기서 배우기 때문이다.' },
    scan:   { btn: 'gold-btn',   tag:'유 물 탐 지',
      text:'이 구역에서 못 찾은 유물 자리를 잠깐 비춰 준다. 금으로 하는 것 안에 있다.' },
    mg_match: { btn: 'daily-mini', tag:'미 니 게 임',
      text:'유물과 시대를 잇는 놀이가 열렸다. 이기면 금이 나온다.' },
    mg_face:  { btn: 'daily-mini', tag:'미 니 게 임',
      text:'얼굴을 보고 이름을 맞히는 놀이가 열렸다.' },
    box2:   { btn: 'daily-box',  tag:'상 자',
      text:'이제 시대 상자를 하루 두 번 연다.' },
  };

  /* 계급이 오른 직후에 부른다. 새로 열린 것들을 하나씩 안내한다. */
  async function onUnlock(){
    if (off() || !window.Unlock) return;
    for (const g of Unlock.GATES){
      for (const [id] of g.opens){
        if (!Unlock.has(id)) continue;
        const key = 'unlock_' + id;
        if (has(key)) continue;
        const c = ON_UNLOCK[id];
        if (!c) { mark(key); continue; }
        const btn = el(c.btn);
        if (!btn) continue;                 // 이 화면에 그 단추가 없으면 다음에
        await run(key, [{
          tag: c.tag, target: btn,
          text: `<b>${g.name}</b>이 되어 열렸다.<br>${c.text}`,
          wait: () => btn.dataset.gdTapped === '1',
          timeout: 20000,
        }]);
      }
    }
  }

  /* 단추를 누른 것을 알아채려고 표시만 남긴다(원래 동작은 그대로 둔다) */
  function tagButtons(){
    for (const id of new Set(Object.values(ON_UNLOCK).map(c => c.btn))){
      const b = el(id);
      if (b && !b._gdTag){
        b.addEventListener('click', () => { b.dataset.gdTapped = '1'; }, true);
        b._gdTag = true;
      }
    }
  }

  /* 화면이 아직 안 잡혔는지 — 앱이 막 뜨는 중이거나 탭이 뒤에 있으면
     문서 크기가 0으로 읽힌다. 그때는 안내를 띄우지 말고 **미룬다**. */
  function ready(){
    const b = box();
    if (!(b.w > 100 && b.h > 100)) return false;
    // 대사·퀴즈 같은 것이 떠 있으면 그 위에 겹쳐 놓지 않는다.
    // 이 게임은 인트로도 대사창으로 나오므로 이걸 안 보면 인트로를 덮는다.
    if (document.querySelector('.ov.show, #dlg-overlay.show, #quiz-overlay.show')) return false;
    return true;
  }

  function init(){
    if (off()) return;
    tagButtons();
    // 챕터 화면이면 첫 안내, 어느 화면이든 새로 열린 기능 안내
    setTimeout(() => {
      tagButtons();
      if (!ready()) return;
      // 첫 안내가 먼저다 — 처음 온 사람에게 해금 설명부터 들이밀면 안 된다
      if (typeof World !== 'undefined' && !document.querySelector('#intro-overlay.show')){
        firstChapter();
        if (!has('first')) return;      // 첫 안내가 도는 중이면 해금 안내는 다음에
      }
      onUnlock();
    }, 1200);
    // 계급이 오르면 그 자리에서 다시 본다
    setInterval(() => {
      if (!ready()) return;
      tagButtons();
      // 첫 안내를 아직 못 봤으면 그것부터 — 미뤄졌을 수 있다
      if (typeof World !== 'undefined' && !has('first')){ firstChapter(); return; }
      onUnlock();
    }, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { run, step, has, mark, onUnlock, firstChapter,
           reset(){ try { localStorage.removeItem(KEY); } catch(e){} } };
})();
