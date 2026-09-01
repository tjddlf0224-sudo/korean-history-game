/* ============ 마주침 — 길을 막고 선 것 ============

   왜 만들었나
   - 지도에 서 있는 것은 전부 "말을 걸 사람"이었다. 다가가면 대사가 나오고
     문제가 나온다. 서른여섯 판이 같은 리듬이었다.
   - 길을 **막고 선 것**이 하나 있으면 리듬이 깨진다. 다가가는 순간 상대가
     먼저 말을 걸고, 문제를 맞혀야 물러난다. 같은 문제인데 처지가 달라진다.

   무엇을 쓰나 — 새로 만들지 않고 있는 것을 잇는다
   - 싸움은 boss.js를 그대로 쓴다. 이미 체력·연속정답·타격 연출이 다 있다.
   - 화면 흔들림과 집중선은 fx.js를 쓴다.
   - 그래서 이 파일은 **언제 누가 튀어나오는지**만 다룬다.

   쓰는 법 (챕터에서)
     Encounter.add({
       id: 'beom_gungya',            // 한 번 물리치면 다시 안 나온다
       zone: 'gungya', x: 900, y: 420, range: 150,
       name: '호랑이', img: 'assets/portraits/beom.png',
       cry: '…크르릉.',              // 튀어나올 때 한 마디
       lead: '풀숲이 흔들렸다. ...',   // 그 앞에 깔 설명
       questions: [ {q, opts, answer, feedback, src} ],
       win: '호랑이가 물러났다.', lose: '뒷걸음질로 물러났다.',
       gold: 25, badge: 'beom_gungya',
     });
     그리고 매 프레임: Encounter.tick(World)

   지킨 것
   - **막다른 길을 만들지 않는다.** 져도 그 자리에 그대로 있고 다시 붙을 수 있다.
     학습을 막는 장치가 되면 안 된다.
   - 한 번 물리치면 끝이다. 지나갈 때마다 또 나오면 성가시다.
*/
window.Encounter = (function(){
  const KEY = 'khg_encounter';

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; }
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
  function beaten(id){ return !!load()[id]; }
  function markBeaten(id){ const v = load(); v[id] = Date.now(); save(v); }

  const LIST = [];
  let busy = false;

  function add(spec){
    if (!spec || !spec.id) return;
    if (!LIST.some(e => e.id === spec.id)) LIST.push(spec);
  }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #ec-ov { position:absolute; inset:0; z-index:93; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.9); font-family:"Gowun Batang",serif; }
    #ec-ov.show { display:flex; }
    #ec-ov .card { width:min(90%,470px); text-align:center; display:flex;
      flex-direction:column; align-items:center; gap:14px; }
    #ec-ov img { width:min(48%,190px); height:auto;
      filter:drop-shadow(0 10px 22px rgba(0,0,0,.65));
      animation:ec-in .42s cubic-bezier(.2,.9,.25,1) both; }
    @keyframes ec-in { 0%{ opacity:0; transform:scale(1.5); }
      100%{ opacity:1; transform:scale(1); } }
    #ec-ov .cry { font-size:23px; font-weight:700; color:#f0c96b;
      text-shadow:0 0 22px rgba(240,201,107,.4); }
    #ec-ov .lead { font-size:14.5px; line-height:1.9; color:#e6dbc2; }
    #ec-ov .sm { font-size:12px; color:#8d7f66; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  /* 튀어나오는 장면. 누르면 넘어가고, 그다음이 싸움이다. */
  function burst(e){
    css();
    let d = document.getElementById('ec-ov');
    if (!d){ d = document.createElement('div'); d.id = 'ec-ov'; layer().appendChild(d); }
    d.innerHTML = '<div class="card">' +
      (e.img ? `<img src="${e.img}" alt="">` : '') +
      (e.cry ? `<div class="cry">${e.cry}</div>` : '') +
      (e.lead ? `<div class="lead">${e.lead}</div>` : '') +
      '<div class="sm">화면을 누르면 계속됩니다</div></div>';
    d.classList.add('show');
    if (window.Fx){ Fx.punch(.12, 460); Fx.shake(15, 520); Fx.lines(420); }
    try { if (navigator.vibrate) navigator.vibrate([60, 40, 80]); } catch(err){}
    return new Promise(res => {
      const go = () => { d.removeEventListener('pointerdown', go); d.classList.remove('show'); res(); };
      d.addEventListener('pointerdown', go);
    });
  }

  async function fire(e, W){
    busy = true;
    const wasPaused = W.paused;
    W.paused = true;
    try {
      await burst(e);
      if (!window.Boss){ busy = false; W.paused = wasPaused; return; }
      Boss.start({
        name: e.name, img: e.img, bg: e.bg,
        hp: (e.questions || []).length, lives: e.lives || 3,
        questions: e.questions || [],
        intro: e.intro || e.cry || '',
        onWin: () => {
          markBeaten(e.id);
          W.paused = wasPaused; busy = false;
          if (e.gold && window.Gold) Gold.earn(e.gold, e.name);
          if (e.badge && window.Badges) Badges.earn(e.badge);
          if (e.onWin) e.onWin();
        },
        // 져도 그 자리에 그대로 둔다. 다시 붙으면 된다 —
        // 못 이기면 못 지나가는 길을 만들면 공부를 막는 장치가 된다.
        onLose: () => {
          W.paused = wasPaused; busy = false;
          if (e.onLose) e.onLose();
        },
      });
    } catch(err){
      busy = false; W.paused = wasPaused;
    }
  }

  /* 매 프레임 부른다. 가까이 가면 튀어나온다. */
  function tick(W){
    if (busy || !W || W.paused) return;
    // 대사·퀴즈가 떠 있으면 끼어들지 않는다
    if (document.querySelector('.ov.show, #dlg-overlay.show, #quiz-overlay.show')) return;
    for (const e of LIST){
      if (e.zone !== W.zone || beaten(e.id)) continue;
      const d = Math.hypot(W.px - e.x, W.py - e.y);
      if (d <= (e.range || 150)){ fire(e, W); return; }
    }
  }

  return { add, tick, beaten, markBeaten, LIST, _load: load };
})();
