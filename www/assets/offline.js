/* ============ 그대가 없는 사이 — 오프라인 보상 ============

   왜 만들었나
   - 인기 게임을 뜯어보니 가장 큰 차이가 여기 있었다. 방치형이 4년 만에 매출
     비중 10배(1.7% → 16%)가 된 이유는 하나로 모인다 — **안 켜도 자란다.**
     켜면 "그동안 이만큼 쌓였습니다"가 기다리고 있고, 그걸 쓰는 재미로 3분을 보낸다.
   - 우리 게임은 정반대였다. **켜야만 자란다.** 껐다 켜면 아무 일도 안 일어나 있다.
     다시 켤 이유가 스트릭 하나뿐이었다.

   무엇을 주나 — 공부한 만큼만
   - 그냥 시간만 흘렀다고 퍼 주면 안 된다. 그러면 안 하는 게 이득이 된다.
   - 그래서 **마지막으로 공부한 양에 비례**해 쌓인다. 많이 푼 사람에게 더 쌓이고,
     한 번도 안 푼 사람에게는 아무것도 안 쌓인다.
   - 최대 8시간까지만 쌓인다. 하루 종일 안 켜도 8시간치다 — 오래 안 켜는 것이
     이득이 되면 안 된다.

   붙이는 법
     <script src="assets/offline.js"></script>   (gold.js·energy.js 뒤)
*/
window.Offline = (function(){
  const KEY = 'khg_offline';
  const CAP_MS = 8 * 60 * 60 * 1000;      // 최대 8시간치
  const MIN_MS = 20 * 60 * 1000;          // 20분은 넘어야 알린다(껐다 켤 때마다 뜨면 성가시다)

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v) { v.bank = v.bank || 0; return v; }
    } catch(e){}
    return { at: 0, rate: 0, bank: 0 };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  let st = load();

  /* 시간당 얼마나 쌓이나 — 최근에 푼 문항 수로 정한다.
     한 문항에 금 2를 주므로, 시간당 그 절반쯤이 적당하다. */
  function rate(){
    // 오늘 푼 만큼을 본다. 퀘스트가 이미 세고 있으니 그걸 읽는다.
    let solved = 0;
    try {
      const q = JSON.parse(localStorage.getItem('khg_quest') || '{}');
      solved = (q.prog && q.prog.first) || 0;
    } catch(e){}
    // 아무것도 안 푼 사람에게는 안 쌓인다
    if (solved <= 0) return 0;
    return Math.min(30, 4 + solved);      // 시간당 금. 많이 풀어도 30이 상한
  }

  /* 자리를 비운 사이 쌓인 몫. 아직 넣어 두지 않은 것만 센다. */
  function accrued(){
    if (!st.at) return { gold: 0, ms: 0, capped: false };
    const raw = Date.now() - st.at;
    const gap = Math.min(CAP_MS, raw);
    const r = st.rate || 0;
    if (gap < MIN_MS || r <= 0) return { gold: 0, ms: 0, capped: false };
    return { gold: Math.floor(r * (gap / 3600000)), ms: gap, capped: raw > CAP_MS };
  }

  function pending(){
    const a = accrued();
    const gold = (st.bank || 0) + a.gold;
    if (gold < 1) return null;
    return { gold, ms: a.ms, capped: a.capped, banked: (st.bank || 0) };
  }

  /* 지금 쌓인 몫을 넣어 둔다 — 목록 화면에 닿을 때까지 없어지지 않게.
     챕터 안에서 창을 옮겨 다니다 몫을 잃는 일을 막는다. */
  function bankNow(){
    const a = accrued();
    if (a.gold > 0) st.bank = (st.bank || 0) + a.gold;
    st.at = Date.now(); st.rate = rate(); save(st);
  }

  /* 자리를 뜬다 — 여기서부터 다시 센다.
     화면을 보고 있던 동안은 쳐 주지 않는다(그건 그냥 플레이 시간이다). */
  function mark(){ st.at = Date.now(); st.rate = rate(); save(st); }
  function clear(){ st.bank = 0; st.at = Date.now(); st.rate = rate(); save(st); }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #of-ov { position:absolute; inset:0; z-index:96; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.92); font-family:"Gowun Batang",serif; }
    #of-ov.show { display:flex; }
    #of-ov .panel { width:min(92%,400px); background:#1a140c; border:1px solid #c9a24a;
      border-radius:16px; padding:24px 20px; display:flex; flex-direction:column; gap:12px;
      text-align:center; }
    #of-ov .tag { font-size:12px; letter-spacing:.26em; color:#a89676; }
    #of-ov .ln { font-size:14.5px; color:#e6dbc2; line-height:1.85; }
    #of-ov .big { font-size:30px; font-weight:700; color:#f0c96b;
      font-variant-numeric:tabular-nums; text-shadow:0 0 22px rgba(240,201,107,.45); }
    #of-ov .sm { font-size:12px; color:#8d7f66; line-height:1.7; }
    #of-ov button { padding:13px; border-radius:11px; font-family:inherit; font-size:15px;
      cursor:pointer; border:1px solid #4a3c26; background:#2a2013; color:#f5ecd8; }
    #of-ov button.hi { background:#3a2c1a; border-color:#c9a24a; color:#f0c96b; font-weight:700; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function fmt(ms){
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}분`;
    const h = Math.floor(m / 60);
    return m % 60 ? `${h}시간 ${m % 60}분` : `${h}시간`;
  }

  function show(p){
    css();
    let d = document.getElementById('of-ov');
    if (!d){ d = document.createElement('div'); d.id = 'of-ov'; layer().appendChild(d); }
    d.innerHTML = '<div class="panel">' +
      '<div class="tag">자 리 를  비 우 신  사 이</div>' +
      `<div class="ln">${p.ms ? fmt(p.ms) + ' 동안 ' : ''}배운 것이 익었습니다.</div>` +
      `<div class="big">금 ${p.gold}</div>` +
      (p.capped ? '<div class="sm">여덟 시간치까지만 쌓입니다.</div>' : '') +
      '<button class="hi" id="of-take">받기</button>' +
      '<button id="of-ad">광고 보고 두 배로</button>' +
      '<div class="sm" id="of-msg"></div></div>';
    d.classList.add('show');
    const close = () => { clear(); d.classList.remove('show'); };
    d.querySelector('#of-take').onclick = () => {
      if (window.Gold) Gold.earn(p.gold, '없는 사이');
      close();
    };
    d.querySelector('#of-ad').onclick = async () => {
      const b = d.querySelector('#of-ad');
      b.disabled = true; b.textContent = '광고 준비 중…';
      const ok = window.Ads ? await Ads.rewarded() : false;
      if (!ok){
        b.disabled = false; b.textContent = '광고 보고 두 배로';
        d.querySelector('#of-msg').textContent = '광고를 끝까지 보지 않으셨습니다.';
        return;
      }
      if (window.Gold) Gold.earn(p.gold * 2, '없는 사이 · 두 배');
      close();
    };
  }

  /* 켤 때 한 번 본다. 목록 화면에서만 띄운다 —
     챕터 안에서 갑자기 뜨면 하던 것을 끊는다. */
  function check(){
    const onList = /(^|\/)index\.html?$/.test(location.pathname) ||
                   location.pathname.endsWith('/');
    const p = pending();
    if (!p){ mark(); return null; }
    // 챕터 안이면 넣어 두었다가 목록에 돌아왔을 때 준다.
    // 하던 것을 끊지 않으면서, 몫도 잃지 않는다.
    if (!onList){ bankNow(); return p; }
    show(p);
    return p;
  }

  /* 나갔다 → 그 시각부터 센다 / 돌아왔다 → 쌓인 게 있나 본다 */
  function onVis(){
    if (document.visibilityState === 'hidden') mark();
    else setTimeout(check, 300);
  }

  function init(){
    setTimeout(check, 900);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', mark);
    /* 켜 둔 채로 손 놓고 있던 시간은 자리를 비운 것이 아니다.
       보고 있는 동안 계속 시각을 밀어 두어야, 세 시간 띄워 놓고 새로고침해서
       받아 가는 일이 생기지 않는다. (넣어 둔 몫은 mark가 건드리지 않는다.) */
    setInterval(function(){
      if (document.visibilityState === 'visible') mark();
    }, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { pending, check, mark, rate, show, _st: () => st };
})();
