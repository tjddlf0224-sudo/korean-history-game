/* ============ 하는 일 — 지도 위에서 직접 해 보는 것 ============

   왜 만들었나
   - 지도에서 할 수 있는 일이 "말 걸기"와 "줍기" 둘뿐이었다. 밭에 서 있어도
     밭은 그림일 뿐이고, 배에 올라도 배는 배경일 뿐이었다.
   - 어떤 것은 **읽는 것보다 해 보는 것**이 남는다. 모내기가 왜 위험했는지는
     설명을 읽는 것보다, 못자리를 앉히고 비를 기다려 보는 편이 빠르다.

   무엇을 하나
     그 자리에 서면 단추가 뜬다 → 누르면 짧은 장면이 흐른다 → 한 번 보상.
     사건이 아니라 **일**이다. 싸움은 encounter.js가, 사건은 manse.js가 맡는다.

   쓰는 법 (챕터에서)
     Deed.add({
       id:'nongsa_gwonnong', zone:'gwonnong', x:700, y:420, range:170,
       label:'농사를 짓는다', tag:'권 농',
       lines:[ '…', '…' ],          // 한 줄씩 넘어간다
       gold:20, badge:'did_nongsa',
     });
     매 프레임: Deed.tick(World)

   지킨 것
   - **한 번만 준다.** 같은 자리를 오갈 때마다 금이 나오면 그것만 하게 된다.
   - 대사·퀴즈가 떠 있으면 단추를 감춘다. 하던 것을 끊지 않는다.
   - 보상은 곁가지다. 안 해도 챕터는 끝까지 된다.
*/
window.Deed = (function(){
  const KEY = 'khg_deed';

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; }
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
  function done(id){ return !!load()[id]; }
  function mark(id){ const v = load(); v[id] = Date.now(); save(v); }

  const LIST = [];
  let busy = false;
  function add(spec){
    if (spec && spec.id && !LIST.some(d => d.id === spec.id)) LIST.push(spec);
  }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #dd-btn { position:absolute; left:50%; bottom:calc(96px + env(safe-area-inset-bottom));
      transform:translateX(-50%); z-index:58; padding:12px 24px; border-radius:999px;
      border:1px solid #7faf8b; background:rgba(20,26,18,.94); color:#bfe6cb;
      font-family:"Gowun Batang",serif; font-size:15.5px; font-weight:700; cursor:pointer;
      box-shadow:0 6px 20px rgba(0,0,0,.5); display:none; }
    #dd-btn.on { display:block; }
    /* 이미 본 것은 흐리게 — 새로 할 일과 구별된다 */
    #dd-btn.seen { border-color:#5d7a67; color:#93ab9b;
      background:rgba(18,22,17,.9); font-weight:400; }
    #dd-ov { position:absolute; inset:0; z-index:93; display:none; align-items:center;
      justify-content:center; background:rgba(9,11,8,.93); font-family:"Gowun Batang",serif;  overflow-y:auto; padding:10px; box-sizing:border-box;}
    #dd-ov.show { display:flex; }
    #dd-ov .box {
      /* 가로로 누우면 게임 높이가 390px뿐이라 긴 창은 위아래가 잘렸다.
         높이 미디어쿼리는 못 쓴다 — 세로로 든 휴대폰에서는 #wrap을 90도
         돌려 쓰므로 화면 높이(844)와 게임 높이(390)가 다르다.
         부모 기준 %로 잡고, 넘치면 창 안에서 스크롤되게 한다. */
      max-height:100%; overflow-y:auto; -webkit-overflow-scrolling:touch;
      box-sizing:border-box; width:min(88%,540px); text-align:center; }
    #dd-ov .tag { font-size:12px; letter-spacing:.28em; color:#8fae97; margin-bottom:16px; }
    #dd-ov .ln { font-size:16px; line-height:2.05; color:#e9e4d4; }
    #dd-ov .ln b { color:#bfe6cb; }
    #dd-ov .sm { margin-top:22px; font-size:12px; color:#7d8a80; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function veil(){
    css();
    let d = document.getElementById('dd-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'dd-ov';
      d.innerHTML = '<div class="box"><div class="tag"></div><div class="ln"></div>' +
                    '<div class="sm">화면을 누르면 계속됩니다</div></div>';
      layer().appendChild(d);
    }
    d.classList.add('show');
    return d;
  }

  function step(d, html){
    d.querySelector('.ln').innerHTML = html;
    return new Promise(res => {
      const go = () => { d.removeEventListener('pointerdown', go); res(); };
      // 바로 붙이면 단추를 누른 그 손가락이 첫 줄을 넘겨 버린다
      setTimeout(() => d.addEventListener('pointerdown', go), 260);
    });
  }

  async function run(spec, W){
    busy = true;
    const wasPaused = W && W.paused;
    if (W) W.paused = true;
    const d = veil();
    d.querySelector('.tag').textContent = spec.tag || '';
    try {
      // 두 번째부터는 이야기만 보여 준다 — 보상은 처음 한 번뿐이다
      const first = !done(spec.id);
      for (const ln of (spec.lines || [])) await step(d, ln);
      mark(spec.id);
      if (first){
        if (spec.gold && window.Gold) Gold.earn(spec.gold, spec.tag || '한 일');
        if (spec.badge && window.Badges) Badges.earn(spec.badge);
        if (spec.item && window.Items && Items.give) Items.give(spec.item);
        if (spec.onDone) spec.onDone();
      }
    } finally {
      d.classList.remove('show');
      if (W) W.paused = wasPaused;
      busy = false;
    }
  }

  function btn(){
    css();
    let b = document.getElementById('dd-btn');
    if (!b){ b = document.createElement('button'); b.id = 'dd-btn'; layer().appendChild(b); }
    return b;
  }

  function tick(W){
    const b = btn();
    if (busy || !W || W.paused){ b.classList.remove('on'); return; }
    if (document.querySelector('.ov.show, #dlg-overlay.show, #quiz-overlay.show, ' +
        '#ms-ov.show, #ec-ov.show')){ b.classList.remove('on'); return; }
    for (const s of LIST){
      if (s.zone !== W.zone) continue;
      if (Math.hypot(W.px - s.x, W.py - s.y) <= (s.range || 160)){
        // 한 번 본 것도 다시 볼 수 있다("다시 보고 싶은데"는 실제 제보다).
        // 보상은 처음 한 번뿐이므로 반복해서 금을 캘 수는 없다.
        const seen = done(s.id);
        b.textContent = (s.label || '해 보기') + (seen ? ' · 다시 보기' : '');
        b.classList.toggle('seen', seen);
        b.onclick = () => { b.classList.remove('on'); run(s, W); };
        b.classList.add('on');
        return;
      }
    }
    b.classList.remove('on');
  }

  return { add, tick, run, done, mark, LIST, _load: load };
})();
