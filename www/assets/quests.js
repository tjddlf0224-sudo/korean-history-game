/* ============ 서브 퀘스트 — 오늘 할 일과, 오래 걸리는 목표 ============

   왜 만들었나
   - 지금 목표는 "다음 목표: 태조 왕건과 대화하기" 하나뿐이다. 이건 그 챕터를
     끝내는 **메인 퀘스트**다. 이것만 있으면 할 일이 한 줄로 늘어선 외길이 된다.
   - 곁길이 있어야 놀 거리가 된다. 그래서 두 갈래를 둔다.
       · **오늘 것** — 하루 만에 끝나는 작은 것 셋. 매일 바뀐다.
       · **긴 것**   — 며칠~몇 주 걸리는 누적 목표. 모으는 재미와 이어진다.

   설계에서 지킨 것
   - **새로 세는 것을 최소로.** 유물 수·인물 수·챕터 완주는 이미 다른 모듈이
     알고 있다. 퀘스트는 그걸 읽기만 한다. 같은 걸 두 곳에서 세면 반드시 어긋난다.
   - **오늘 것은 날짜로 정한다.** 무작위로 뽑으면 앱을 껐다 켤 때마다 바뀐다.
     날짜를 씨앗으로 삼아 하루 동안 같은 것이 나오게 한다.
   - **보상은 받아야 들어온다.** 저절로 들어오면 달성한 줄도 모르고 지나간다.

   붙이는 법
     <script src="assets/quests.js"></script>   (gold.js·items.js·heroes.js 뒤)
     Quests.open()
*/
window.Quests = (function(){
  const KEY = 'khg_quest';
  const today = () => Math.floor(Date.now() / 86400000);

  function load(){
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) return v; } catch(e){}
    return { day: 0, prog: {}, taken: {}, doneAch: {} };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  let st = load();

  function rollDay(){
    if (st.day !== today()){
      st.day = today(); st.prog = {}; st.taken = {};
      save(st);
    }
  }

  /* ---------------- 오늘 것 ----------------
     get(): 지금 얼마나 됐나 / need: 얼마나 하면 되나 */
  const DAILY = [
    { id:'d_first',  name:'첫 시도로 10문항 맞히기', need:10, gold:40,
      hint:'찍지 않고 아는 것으로', get:() => st.prog.first || 0 },
    { id:'d_relic',  name:'유물 하나 찾아내기', need:1, gold:35,
      hint:'지도를 걷다 보면 행동 단추가 바뀝니다',
      get:() => st.prog.relic || 0 },
    { id:'d_talk',   name:'새로운 사람 셋과 대화하기', need:3, gold:35,
      hint:'머리 위에 !가 뜬 사람', get:() => st.prog.talk || 0 },
    { id:'d_combo',  name:'연속 8 만들기', need:8, gold:45,
      hint:'첫 시도로 이어서 맞히면 쌓입니다', get:() => st.prog.combo || 0 },
    { id:'d_mini',   name:'미니게임 한 판', need:1, gold:30,
      hint:'계급이 오르면 열립니다', get:() => st.prog.mini || 0 },
    { id:'d_chapter',name:'챕터 하나 끝내기', need:1, gold:60,
      hint:'끝까지 가면 시대의 열쇠에 가까워집니다', get:() => st.prog.chapter || 0 },
  ];

  /* 날짜를 씨앗으로 오늘 것 셋을 고른다 — 하루 동안 안 바뀐다 */
  function todayList(){
    rollDay();
    const d = today();
    const idx = [];
    let seed = d;
    while (idx.length < 3){
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const i = seed % DAILY.length;
      if (idx.indexOf(i) < 0) idx.push(i);
    }
    return idx.map(i => DAILY[i]);
  }

  /* ---------------- 긴 것 ----------------
     이미 다른 모듈이 세고 있는 것을 읽기만 한다. */
  function relics(){ try { return (window.Items && Items.owned().length) || 0; } catch(e){ return 0; } }
  function heroes(){
    try {
      if (window.Heroes && Heroes.owned) return Heroes.owned().length;
      const raw = JSON.parse(localStorage.getItem('khg_heroes') || '{}');
      return Object.keys(raw.cards || raw || {}).length;
    } catch(e){ return 0; }
  }
  function chapters(){
    try {
      const all = Badges.load();
      return Object.keys(all).filter(k => k.indexOf('ch_complete_') === 0).length;
    } catch(e){ return 0; }
  }

  const ACH = [
    { id:'a_relic10', name:'유물 열 가지', need:10, gold:80,  get:relics },
    { id:'a_relic30', name:'유물 서른 가지', need:30, gold:200, get:relics },
    { id:'a_relic64', name:'유물을 모두', need:64, gold:600, get:relics },
    { id:'a_hero20',  name:'스무 사람을 만나다', need:20, gold:80,  get:heroes },
    { id:'a_hero60',  name:'예순 사람을 만나다', need:60, gold:200, get:heroes },
    { id:'a_ch5',     name:'다섯 화를 끝내다', need:5,  gold:120, get:chapters },
    { id:'a_ch15',    name:'열다섯 화를 끝내다', need:15, gold:300, get:chapters },
    { id:'a_ch36',    name:'서른여섯 화를 모두', need:36, gold:1000, get:chapters },
  ];

  /* ---------------- 진행 올리기 ----------------
     이미 있는 함수를 감싸서 받는다. 챕터를 고치지 않는다. */
  function bump(k, n){
    rollDay();
    st.prog[k] = (st.prog[k] || 0) + (n == null ? 1 : n);
    save(st);
  }
  function setMax(k, v){
    rollDay();
    if ((st.prog[k] || 0) < v){ st.prog[k] = v; save(st); }
  }

  let combo = 0;
  function wire(){
    if (window.Juice && !Juice._qWired){
      const oc = Juice.correct, ow = Juice.wrong;
      Juice.correct = function(firstTry){
        oc.apply(this, arguments);
        if (firstTry){ bump('first'); combo++; setMax('combo', combo); }
        else combo = 0;
      };
      Juice.wrong = function(){ ow.apply(this, arguments); combo = 0; };
      Juice._qWired = true;
    }
    if (window.Items && !Items._qWired){
      const og = Items.give;
      Items.give = function(id){
        const had = Items.has(id);
        const r = og.apply(this, arguments);
        if (!had && Items.has(id)) bump('relic');
        return r;
      };
      Items._qWired = true;
    }
    if (window.Badges && !Badges._qWired){
      const oe = Badges.earn;
      Badges.earn = function(id){
        const r = oe.apply(this, arguments);
        if (String(id).indexOf('ch_complete_') === 0) bump('chapter');
        return r;
      };
      Badges._qWired = true;
    }
    if (window.Heroes && Heroes.recordTalk && !Heroes._qWired){
      const ot = Heroes.recordTalk;
      Heroes.recordTalk = function(){ bump('talk'); return ot.apply(this, arguments); };
      Heroes._qWired = true;
    }
    if (window.Mini && Mini.start && !Mini._qWired){
      const os = Mini.start;
      Mini.start = function(){ bump('mini'); return os.apply(this, arguments); };
      Mini._qWired = true;
    }
  }

  /* ---------------- 보상 받기 ---------------- */
  function claimDaily(id){
    const q = DAILY.find(x => x.id === id);
    if (!q || st.taken[id] || q.get() < q.need) return null;
    st.taken[id] = 1; save(st);
    if (window.Gold) Gold.earn(q.gold, '퀘스트');
    return q.gold;
  }
  function claimAch(id){
    const q = ACH.find(x => x.id === id);
    if (!q || st.doneAch[id] || q.get() < q.need) return null;
    st.doneAch[id] = 1; save(st);
    if (window.Gold) Gold.earn(q.gold, '도전');
    return q.gold;
  }

  /* 받을 것이 있으면 true — 단추에 점을 찍는 데 쓴다 */
  function pending(){
    rollDay();
    for (const q of todayList()) if (!st.taken[q.id] && q.get() >= q.need) return true;
    for (const q of ACH) if (!st.doneAch[q.id] && q.get() >= q.need) return true;
    return false;
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #qs-ov { position:absolute; inset:0; z-index:95; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.9); font-family:"Gowun Batang",serif; }
    #qs-ov.show { display:flex; }
    /* 한 줄에 **지금 어느 상태인가**가 보여야 한다 —
       아직 못 함 / 다 함(받을 수 있음) / 이미 받음. 셋을 다르게 그린다. */
    #qs-ov .q { position:relative; border:1px solid #3a2c1a; border-radius:12px;
      padding:8px 12px; background:#241b11; display:flex; gap:10px; align-items:center;
      transition:border-color .16s, background .16s; }
    /* 다 한 줄은 금테를 두르고 왼쪽에 금빛 띠를 세운다 */
    #qs-ov .q.done { border-color:#6b5730; background:#2a2013; }
    #qs-ov .q.done::before { content:''; position:absolute; left:0; top:9px; bottom:9px; width:3px;
      border-radius:0 3px 3px 0; background:linear-gradient(180deg,#efcd8b,#c9a24a); }
    #qs-ov .q.got { opacity:.55; }
    /* 상태 표 — 동그라미 하나로 */
    #qs-ov .dot { flex:none; width:22px; height:22px; border-radius:50%;
      border:1.5px solid #4a3c26; display:flex; align-items:center; justify-content:center; }
    #qs-ov .dot svg { width:13px; height:13px; display:none; color:#2b1f0c; }
    #qs-ov .q.done .dot { border-color:#e0bd76; background:linear-gradient(180deg,#efcd8b,#c9a24a); }
    #qs-ov .q.done .dot svg { display:block; }
    /* span은 인라인이라 그냥 두면 이름과 힌트가 한 줄로 붙는다(gold.js에서 겪은 것) */
    #qs-ov .tx { flex:1; min-width:0; display:flex; flex-direction:column; }
    #qs-ov .nm { display:block; font-size:13.5px; color:#f5ecd8; line-height:1.4; }
    #qs-ov .hint { display:block; font-size:11px; color:#8d7f66; line-height:1.5; }
    /* 막대와 숫자를 한 줄에 나란히 — 아래로 한 줄 더 쓰면 그만큼 줄이 길어진다 */
    #qs-ov .pg { display:flex; align-items:center; gap:8px; margin-top:5px; }
    #qs-ov .bar { flex:1; }
    #qs-ov .n { flex:none; }
    #qs-ov .bar { height:5px; border-radius:3px; background:#31261a; overflow:hidden; }
    #qs-ov .bar i { display:block; height:100%; border-radius:3px;
      background:linear-gradient(90deg,#8a6f34,#f0c96b); transition:width .5s cubic-bezier(.2,.9,.25,1); }

    #qs-ov .n { font-size:11px; color:#a2947c; font-variant-numeric:tabular-nums; }
    /* 받을 수 있는 줄의 단추만 금빛이다 — 이 화면에서 누를 곳이 한눈에 보인다 */
    #qs-ov .q button { flex:none; min-width:66px; background:#2a2013; border:1px solid #4a3c26;
      color:#8d7f66; border-radius:10px; padding:9px 12px; font-family:inherit;
      font-size:12.5px; cursor:pointer; }
    #qs-ov .q.done button:not(:disabled) { background:linear-gradient(180deg,#efcd8b,#c9a24a);
      border-color:#e0bd76; color:#2b1f0c; font-weight:700;
      box-shadow:0 3px 11px rgba(201,162,74,.26); }
    #qs-ov .q button:disabled { opacity:.5; cursor:default; }
    /* 오늘 몇 개 남았는지 — 제목 밑에 알약으로 */
    #qs-ov .qs-tally { display:flex; justify-content:center; gap:7px; }
    #qs-ov .qs-tally .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px;
      border-radius:999px; border:1px solid #46381f; background:rgba(0,0,0,.28);
      font-size:11.5px; color:#a8997e; }
    #qs-ov .qs-tally .chip b { color:#f0c96b; font-weight:700; font-variant-numeric:tabular-nums; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  const QS_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';

  function row(q, taken, claim){
    const cur = Math.min(q.get(), q.need), pct = Math.round(cur / q.need * 100);
    const ok = cur >= q.need;
    return `<div class="q${ok ? ' done' : ''}${taken ? ' got' : ''}">` +
      `<span class="dot">${QS_CHECK}</span><span class="tx">` +
      `<span class="nm">${q.name}</span>` +
      (q.hint && !ok ? `<span class="hint">${q.hint}</span>` : '') +
      `<span class="pg"><span class="bar"><i style="width:${pct}%"></i></span>` +
      `<span class="n">${cur} / ${q.need}</span></span></span>` +
      `<button data-c="${claim}" data-id="${q.id}"${taken ? ' disabled' : (ok ? '' : ' disabled')}>` +
      `${taken ? '받음' : '금 ' + q.gold}</button></div>`;
  }

  function open(){
    css(); rollDay();
    let d = document.getElementById('qs-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'qs-ov'; layer().appendChild(d);
      d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
    }
    const today = todayList();
    const ready = today.filter(q => q.get() >= q.need && !st.taken[q.id]).length;
    const got = today.filter(q => st.taken[q.id]).length;
    d.innerHTML = '<div class="panel"><h3>할 일</h3>' +
      `<div class="qs-tally"><span class="chip">오늘 <b>${got}</b> / ${today.length} 받음</span>` +
      (ready ? `<span class="chip">받을 것 <b>${ready}</b></span>` : '') + '</div>' +
      '<div class="sec">오늘</div>' +
      today.map(q => row(q, !!st.taken[q.id], 'd')).join('') +
      '<div class="sec">긴 것</div>' +
      ACH.filter(q => !st.doneAch[q.id] || q.get() >= q.need)
         .slice(0, 6).map(q => row(q, !!st.doneAch[q.id], 'a')).join('') +
      '<button class="x" id="qs-x" aria-label="닫기">✕</button></div>';
    d.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => {
        const got = b.dataset.c === 'd' ? claimDaily(b.dataset.id) : claimAch(b.dataset.id);
        if (got != null) open();
      };
    });
    d.querySelector('#qs-x').onclick = () => d.classList.remove('show');
    d.classList.add('show');
  }

  function init(){ wire(); setTimeout(wire, 1500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { open, pending, todayList, ACH, claimDaily, claimAch, wire,
           _st: () => st };
})();
