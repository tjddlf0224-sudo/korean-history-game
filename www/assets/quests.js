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
    #qs-ov .panel { width:min(94%,470px); max-height:88%; overflow-y:auto; background:#1a140c;
      border:1px solid #4a3c26; border-radius:16px; padding:20px 18px;
      display:flex; flex-direction:column; gap:10px; }
    #qs-ov h3 { margin:0; font-size:18px; color:#f0c96b; text-align:center; }
    #qs-ov .sec { font-size:12px; letter-spacing:.2em; color:#a89676; margin-top:6px; }
    #qs-ov .q { border:1px solid #3a2c1a; border-radius:11px; padding:11px 13px;
      background:#241c12; display:flex; gap:11px; align-items:center; }
    #qs-ov .q.done { border-color:#c9a24a; }
    /* span은 인라인이라 그냥 두면 이름과 힌트가 한 줄로 붙는다(gold.js에서 겪은 것) */
    #qs-ov .tx { flex:1; min-width:0; display:flex; flex-direction:column; }
    #qs-ov .nm { display:block; font-size:14px; color:#f5ecd8; }
    #qs-ov .hint { display:block; font-size:11.5px; color:#8d7f66; margin-top:2px; line-height:1.6; }
    #qs-ov .bar { display:block; }
    #qs-ov .n { display:block; }
    #qs-ov .bar { height:5px; border-radius:3px; background:#3a2c1a; margin-top:6px; overflow:hidden; }
    #qs-ov .bar i { display:block; height:100%; background:#c9a24a; }
    #qs-ov .n { font-size:11.5px; color:#b8a888; font-variant-numeric:tabular-nums; margin-top:3px; }
    #qs-ov .q button { flex:none; background:#3a2c1a; border:1px solid #c9a24a; color:#f0c96b;
      border-radius:9px; padding:8px 12px; font-family:inherit; font-size:12.5px; cursor:pointer; }
    #qs-ov .q button:disabled { opacity:.32; cursor:default; border-color:#4a3c26; color:#8d7f66;
      background:#2a2013; }
    #qs-ov .close { padding:11px; border-radius:11px; border:1px solid #4a3c26;
      background:#2a2013; color:#f5ecd8; font-family:inherit; font-size:14px; cursor:pointer; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function row(q, taken, claim){
    const cur = Math.min(q.get(), q.need), pct = Math.round(cur / q.need * 100);
    const ok = cur >= q.need;
    return `<div class="q${ok ? ' done' : ''}"><span class="tx">` +
      `<span class="nm">${q.name}</span>` +
      (q.hint && !ok ? `<span class="hint">${q.hint}</span>` : '') +
      `<span class="bar"><i style="width:${pct}%"></i></span>` +
      `<span class="n">${cur} / ${q.need}</span></span>` +
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
    d.innerHTML = '<div class="panel"><h3>할 일</h3>' +
      '<div class="sec">오 늘</div>' +
      todayList().map(q => row(q, !!st.taken[q.id], 'd')).join('') +
      '<div class="sec">긴 것</div>' +
      ACH.filter(q => !st.doneAch[q.id] || q.get() >= q.need)
         .slice(0, 6).map(q => row(q, !!st.doneAch[q.id], 'a')).join('') +
      '<button class="close" id="qs-x">닫기</button></div>';
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
