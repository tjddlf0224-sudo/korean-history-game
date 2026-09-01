/* ============ 해금 — 계급이 오르면 할 수 있는 것이 늘어난다 ============

   왜 만들었나
   - 처음부터 모든 단추가 다 켜져 있으면 두 가지가 나쁘다.
     ① 처음 온 사람에게 화면이 복잡하다. ② 레벨을 올릴 이유가 약하다.
   - 신분(rank.js)은 이미 있는데 오르면 문구만 바뀌었다. **오르면 실제로
     할 수 있는 일이 늘어야** 올리고 싶어진다.

   무엇을 잠그고 무엇을 안 잠그나
   - **배우는 것은 절대 안 잠근다.** 대화·퀴즈·유물 줍기·복습은 처음부터 다 된다.
   - 잠그는 것은 **편의와 곁가지**뿐이다. 없어도 게임은 끝까지 된다.
   - **자동 이동(AUTO)은 처음부터 열어 둔다.** 한때 양반(16)에 뒀었다 —
     직접 걸으며 지도를 익힌 뒤에 건너뛰게 하려던 것이었는데, 그건 만든 쪽 생각이다.
     걷는 게 답답한 사람에게 열다섯 판을 걷게 하는 건 진입 장벽일 뿐이고,
     자동 이동은 배우는 것을 건너뛰지 않는다(대화·퀴즈는 그대로 다 한다).

   붙이는 법
     <script src="assets/unlock.js"></script>   (rank.js 뒤)
*/
window.Unlock = (function(){

  /* 계급 → 그 계급에서 열리는 것들. rank.js의 TIERS와 minLv를 그대로 따른다. */
  const GATES = [
    /* 칸이 좁으니 설명하지 않고 **이름만** 적는다. 무엇이 열리는지만 알면 된다.
       노비는 잠긴 것이 없어서 opens가 비고, 대신 처음부터 되는 것을 같은
       모양으로 적어 둔다(빈 칸으로 두면 아무것도 못 하는 것처럼 보인다). */
    { tier:'nobi',    lv:1,  name:'노비',
      opens:[], desc:'· 기출 학습<br>· 출석 · 상자<br>· 오답 복습<br>· 왕조 계보' },
    { tier:'yangin',  lv:6,  name:'양인',
      opens:[ ['heroes',   '인물 도감'],
              ['mg_match', '유물 짝 맞추기'] ] },
    { tier:'jungin',  lv:11, name:'중인',
      opens:[ ['shop',     '상점 열림'] ] },
    { tier:'yangban', lv:16, name:'양반',
      opens:[ ['mg_face',  '초상 알아맞히기'] ] },
    { tier:'jaesang', lv:21, name:'재상',
      opens:[ ['scan',     '유물 탐지'] ] },
    { tier:'wang',    lv:26, name:'왕',
      opens:[ ['box2',     '상자 하루 두 번'] ] },
  ];

  function level(){
    try {
      if (window.Rank && Rank.get) return Rank.get().level || 1;
    } catch(e){}
    return 1;
  }

  function has(id){
    const lv = level();
    for (const g of GATES)
      for (const [k] of g.opens)
        if (k === id) return lv >= g.lv;
    return true;                 // 목록에 없는 것은 잠그지 않는다
  }

  function gateOf(id){
    for (const g of GATES) for (const [k] of g.opens) if (k === id) return g;
    return null;
  }

  /* 다음에 열리는 것 — 올릴 이유를 보여 주는 게 이 기능의 핵심이다 */
  function next(){
    const lv = level();
    for (const g of GATES) if (g.lv > lv && g.opens.length) return g;
    return null;
  }

  /* 잠긴 것을 눌렀을 때 — 왜 안 되는지, 언제 열리는지 알려 준다 */
  function deny(id){
    const g = gateOf(id);
    if (!g) return;
    toast(`${g.name}이 되면 열립니다 (Lv.${g.lv})`);
  }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    .ul-toast { position:absolute; z-index:97; left:50%; bottom:12%; transform:translateX(-50%);
      background:rgba(26,20,12,.96); border:1px solid #4a3c26; color:#f0c96b;
      font-family:"Gowun Batang",serif; font-size:13.5px; padding:11px 18px;
      border-radius:20px; white-space:nowrap; }
    /* ---- 계급 사다리 ----
       칸 여섯 개를 위아래로 쌓으면 가로 화면(세로 390)을 다 먹고 굴러야 한다.
       계급은 **차례**이니 출석의 엽전 길처럼 가로로 눕힌다. 하나를 고르면
       그 계급에서 무엇이 열리는지 아래에 펼친다. */
    #ul-ov .ul-road { position:relative; display:flex; gap:3px; padding:4px 0 2px; }
    #ul-ov .ul-road .road, #ul-ov .ul-road .road i { position:absolute;
      left:8.33%; right:8.33%; height:2px; border-radius:2px; }
    #ul-ov .ul-road .road { background:#33281a; }
    #ul-ov .ul-road .road i { right:auto; background:linear-gradient(90deg,#8a6f34,#f0c96b);
      box-shadow:0 0 8px rgba(240,201,107,.35); }
    #ul-ov .st { flex:1; min-width:0; position:relative; z-index:2; display:flex;
      flex-direction:column; align-items:center; gap:6px; margin:0; padding:0;
      border:0; background:none; cursor:pointer; }
    #ul-ov .st .bd { width:38px; height:38px; border-radius:50%; display:flex;
      align-items:center; justify-content:center; font-size:12px; color:#8d7f66;
      border:1.5px solid #443722; background:radial-gradient(circle at 35% 28%,#2c2215,#1a1309);
      box-shadow:inset 0 1px 0 rgba(255,238,205,.05); transition:transform .14s ease; }
    #ul-ov .st .nm { font-size:11px; color:#7d7059; }
    #ul-ov .st.on .bd { border-color:#8a6f34; color:#f0c96b;
      background:radial-gradient(circle at 35% 28%,#4a3717,#2b1f0c); }
    #ul-ov .st.on .nm { color:#c9bda6; }
    #ul-ov .st.here .bd { border-color:#f0c96b; color:#ffe6ac; font-weight:700;
      background:radial-gradient(circle at 35% 28%,#5a4318,#33240c);
      box-shadow:0 0 0 3px rgba(240,201,107,.13), 0 0 16px rgba(240,201,107,.3); }
    #ul-ov .st.here .nm { color:#f0c96b; }
    #ul-ov .st.sel .bd { transform:scale(1.12); }
    #ul-ov .st .bd svg { width:15px; height:15px; }

    /* 고른 계급의 속 */
    #ul-ov .ul-det { border:1px solid #3b2f1e; border-radius:13px; padding:12px 14px;
      background:#221a10; }
    #ul-ov .ul-det .dh { display:flex; justify-content:space-between; align-items:baseline;
      gap:10px; margin-bottom:7px; }
    #ul-ov .ul-det .dn { font-size:15px; color:#f0c96b; }
    #ul-ov .ul-det .dl { font-size:11.5px; color:#8d7f66; }
    #ul-ov .ul-det .it { font-size:12.5px; color:#b8a888; line-height:1.85; }
    #ul-ov .ul-det.locked .it { color:#8a7f6b; }
    /* 지금 계급과 다음 계급까지 얼마나 남았는지 */
    #ul-ov .ul-now { display:flex; justify-content:center; gap:7px; }
    #ul-ov .ul-now .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px;
      border-radius:999px; border:1px solid #46381f; background:rgba(0,0,0,.28);
      font-size:11.5px; color:#a8997e; }
    #ul-ov .ul-now .chip b { color:#f0c96b; font-weight:700; font-variant-numeric:tabular-nums; }
`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  let tT = null;
  function toast(t){
    css();
    const L = layer();
    let d = document.querySelector('.ul-toast');
    if (!d){ d = document.createElement('div'); d.className = 'ul-toast'; L.appendChild(d); }
    d.textContent = t;
    clearTimeout(tT);
    tT = setTimeout(() => d.remove(), 2200);
  }

  const UL_CHECK = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' " +
    "stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>" +
    "<path d='M5 12.5l4.5 4.5L19 7'/></svg>";
  const UL_LOCK = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' " +
    "stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" +
    "<rect x='6' y='10.5' width='12' height='9' rx='1.6'/><path d='M9 10.5V8a3 3 0 0 1 6 0v2.5'/></svg>";

  function open(){
    css();
    let d = document.getElementById('ul-ov');
    if (!d){ d = document.createElement('div'); d.id = 'ul-ov'; layer().appendChild(d);
             d.onclick = e => { if (e.target === d) d.classList.remove('show'); }; }
    const lv = level(), nx = next();
    // 처음 보여 줄 칸은 **다음 계급** — 무엇을 바라고 올리는지가 궁금한 자리다
    let sel = nx ? GATES.findIndex(g => g.tier === nx.tier)
                 : GATES.reduce((a, g, i) => (lv >= g.lv ? i : a), 0);

    function paint(){
      const here = GATES.reduce((a, g, i) => (lv >= g.lv ? i : a), 0);
      const fill = here <= 0 ? 0 : Math.min(100, (here / (GATES.length - 1)) * 100);
      const road = GATES.map((g, i) => {
        const on = lv >= g.lv;
        return `<button class="st${on ? ' on' : ''}${i === here ? ' here' : ''}` +
          `${i === sel ? ' sel' : ''}" data-i="${i}">` +
          `<span class="bd">${on ? UL_CHECK : UL_LOCK}</span>` +
          `<span class="nm">${g.name}</span></button>`;
      }).join('');
      const g = GATES[sel], on = lv >= g.lv;
      const items = g.opens.length ? g.opens.map(([, n]) => '· ' + n).join('<br>')
                                   : (g.desc || '');
      d.innerHTML = '<div class="panel"><h3>계급과 해금</h3>' +
        `<div class="ul-now"><span class="chip">지금 <b>${GATES[here].name}</b> · Lv.${lv}</span>` +
        (nx ? `<span class="chip">${nx.name}까지 <b>${Math.max(0, nx.lv - lv)}</b></span>` : '') +
        '</div>' +
        `<div class="ul-road"><div class="road" id="ul-rd"><i style="width:${fill}%"></i></div>${road}</div>` +
        `<div class="ul-det${on ? '' : ' locked'}"><div class="dh"><span class="dn">${g.name}</span>` +
        `<span class="dl">Lv.${g.lv}${on ? ' · 열림' : ' · 아직'}</span></div>` +
        `<div class="it">${items}</div></div>` +
        '<button class="x" id="ul-x" aria-label="닫기">✕</button></div>';
      // 줄은 표 한가운데를 지나야 한다. 글꼴에 따라 높이가 달라지니 재서 맞춘다.
      const b0 = d.querySelector('.st .bd'), rd = d.querySelector('#ul-rd');
      if (b0 && rd) rd.style.top = (b0.offsetTop + b0.offsetHeight / 2 - 1) + 'px';
      d.querySelectorAll('[data-i]').forEach(b => {
        b.onclick = () => { sel = +b.dataset.i; paint(); };
      });
      d.querySelector('#ul-x').onclick = () => d.classList.remove('show');
    }
    // 재기 전에 먼저 보여야 한다 — 숨어 있는 동안엔 높이가 0이라 줄이 어긋난다
    d.classList.add('show');
    paint();
  }

  return { has, next, deny, open, level, GATES };
})();
