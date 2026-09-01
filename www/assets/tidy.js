/* ============ 메뉴 — 보이는 것은 적게, 안은 가지런하게 ============

   왜 이렇게 되었나
   - 기능을 하나씩 붙이다 보니 목록 화면 맨 위 단추가 **열한 개**가 되었다.
     처음 온 사람은 "무엇부터 하지"가 아니라 "이게 다 뭐지"부터 묻게 된다.
     그래서 보이는 것은 둘(스트릭·메뉴)만 남기고 나머지는 메뉴 안으로 넣었다.
   - 그런데 안으로 넣고 보니 이번엔 **메뉴가 어지러웠다.** 가로로 긴 목록 단추와
     두 칸짜리 격자가 섞여 있어서, 크기도 정렬도 제각각이었다.

   그래서 다시 짠 것
   - 열두 개를 **네 묶음 × 세 칸**으로 나눈다. 오늘 / 익히기 / 기록 / 설정.
     칸은 전부 같은 크기다. 눈이 줄을 따라가면 되니까 훑기가 쉽다.
   - 글자만 있던 칸에 **선 그림(아이콘)**을 하나씩 얹는다. 글자를 읽기 전에
     모양으로 먼저 걸린다.
   - 화면이 가로로 넓으니 묶음을 두 줄로 앉힌다. 세로로 길게 늘어져
     스크롤하지 않아도 한눈에 다 들어온다.

   아이콘을 CSS 가면(mask)으로 넣는 까닭
   - 로그인 단추(auth.js)와 배경음악 단추(index.html)는 상태가 바뀔 때
     **innerHTML을 통째로 다시 쓴다.** 아이콘을 단추 안에 넣어 두면 그때 지워진다.
     그래서 아이콘은 ::before 의 mask 로 바깥에서 씌운다 — 안을 다시 써도 남는다.

   숨기면 놓치는 문제 — 점 하나로 푼다
   - 안에 받을 것이 하나라도 있으면 메뉴 단추에 점을 찍는다. 열면 어느 칸인지
     그 칸에 다시 점으로 알려 준다. 신호는 살리고 자리만 줄인다.

   금·기력은 누르는 것이 아니라 **읽는 값**이라 제목 옆에 알약으로 적는다.

   챕터 화면은 손대지 않는다 — 거기는 다섯 개뿐이고 전부 놀면서 쓰는 것들이다.

   붙이는 법
     <script src="assets/tidy.js"></script>   (다른 모듈들 뒤, index.html에만)
*/
window.Tidy = (function(){

  /* ---------- 선 그림. 24×24, 획만 있고 칠은 없다 ---------- */
  const I = {
    att:   "<rect x='3' y='5' width='18' height='16' rx='2.5'/><path d='M3 10h18M8 3v4M16 3v4'/><path d='M8.7 15.2l2.2 2.2 4.4-4.4'/>",
    box:   "<path d='M4.5 8.5h15v10.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V8.5z'/><path d='M4.5 12.5h15'/><path d='M10 12.5v3h4v-3'/><path d='M6 8.5V6.5A2.5 2.5 0 0 1 8.5 4h7A2.5 2.5 0 0 1 18 6.5v2'/>",
    quest: "<rect x='5' y='4.5' width='14' height='16.5' rx='2.2'/><path d='M9.2 4.5V3.4h5.6v1.1'/><path d='M8.8 12.2l2 2 4.4-4.4'/>",
    mini:  "<rect x='4' y='4' width='16' height='16' rx='3.4'/><circle cx='8.7' cy='8.7' r='1.5' fill='%23000' stroke='none'/><circle cx='12' cy='12' r='1.5' fill='%23000' stroke='none'/><circle cx='15.3' cy='15.3' r='1.5' fill='%23000' stroke='none'/>",
    srs:   "<path d='M20.2 12a8.2 8.2 0 1 1-2.5-5.9'/><path d='M20.5 3.6v5.2h-5.2'/><path d='M12 8.2v4.3l2.8 1.7'/>",
    kings: "<path d='M4 18.5h16'/><path d='M4 18.5L2.9 8.2l5.3 3.9L12 5.6l3.8 6.5 5.3-3.9-1.1 10.3'/>",
    badge: "<path d='M8 3l4 6 4-6'/><circle cx='12' cy='15' r='6'/><circle cx='12' cy='15' r='2.4'/>",
    rank:  "<path d='M5 9.6l7-4.8 7 4.8'/><path d='M5 14.6l7-4.8 7 4.8'/><path d='M5 19.6l7-4.8 7 4.8'/>",
    board: "<path d='M8.2 3.6h7.6v5.1a3.8 3.8 0 0 1-7.6 0V3.6z'/><path d='M8.2 5.4H5.4a2.8 2.8 0 0 0 2.8 3.6M15.8 5.4h2.8a2.8 2.8 0 0 1-2.8 3.6'/><path d='M12 12.5v3.4'/><path d='M8.6 20.4h6.8l-1-4.5h-4.8z'/>",
    auth:  "<circle cx='12' cy='8.2' r='3.9'/><path d='M4.4 20.6a7.6 7.6 0 0 1 15.2 0'/>",
    bgm:   "<path d='M4.5 9.5h3.2L12 5.8v12.4l-4.3-3.7H4.5z'/><path d='M15.6 9.4c1.3 1.2 1.3 4 0 5.2'/><path d='M18.2 6.9c2.6 2.6 2.6 8.6 0 11.2'/>",
    mute:  "<path d='M4.5 9.5h3.2L12 5.8v12.4l-4.3-3.7H4.5z'/><path d='M16 9.8l4.4 4.4M20.4 9.8L16 14.2'/>",
    reset: "<path d='M4.2 7h15.6'/><path d='M10 11v6M14 11v6'/><path d='M6.2 7l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h6.6a1.6 1.6 0 0 0 1.6-1.5L17.8 7'/><path d='M9.4 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2V7'/>",
    close: "<path d='M6 6l12 12M18 6L6 18'/>",
  };
  /* 가면으로 쓰려면 획이 불투명하기만 하면 된다 — 색은 바깥에서 입힌다 */
  function ico(d){
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' " +
      "stroke='%23000' stroke-width='1.55' stroke-linecap='round' stroke-linejoin='round'>" + d + "</svg>";
    return 'url("data:image/svg+xml,' + svg.replace(/#/g, '%23') + '")';
  }

  /* ---------- 무엇을 어느 묶음에 넣나 ----------
     [단추 id, 새로 붙일 글자(null이면 그대로 둔다), 그림 열쇠] */
  const SECTIONS = [
    ['오늘', [
      ['daily-att',       '출석',      'att'],
      ['daily-box',       '상자',      'box'],
      ['daily-quest',     '할 일',     'quest'],
    ]],
    ['익히기', [
      ['daily-mini',      '미니게임',   'mini'],
      ['menu-srs',        '오답 복습',  'srs'],
      ['menu-kings-open', '왕조 계보',  'kings'],
    ]],
    ['기록', [
      ['daily-unlock',    '계급',      'rank'],
      ['menu-badges-open','배지함',    'badge'],
      ['board-btn',       '급제자 명단','board'],
    ]],
    ['설정', [
      ['auth-btn',        null,        'auth'],   // 로그인/이름이 바뀐다
      ['bgm-mute-toggle', null,        'bgm'],    // 끄기/켜기가 바뀐다
      ['menu-reset',      '기록 초기화','reset'],
    ]],
  ];
  const ALL = SECTIONS.reduce((a, [, items]) => a.concat(items), []);
  const READOUT = ['gold-btn', 'eng-btn'];

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    /* ---- 덮개: 뒤를 흐리게 눌러 앞을 띄운다 ---- */
    #menu-modal { background:rgba(6,4,2,.76);
      -webkit-backdrop-filter:blur(7px) saturate(.9); backdrop-filter:blur(7px) saturate(.9); }
    #menu-modal.show #menu-panel { animation:mn-in .3s cubic-bezier(.2,.9,.25,1) both; }
    @keyframes mn-in { from { opacity:0; transform:translateY(12px) scale(.975); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion:reduce){ #menu-modal.show #menu-panel { animation:none; } }

    /* ---- 판 ---- */
    #menu-panel { max-width:600px; padding:0; border-radius:18px; overflow:hidden;
      border:1px solid #4a3c26;
      background:linear-gradient(180deg,#241b11 0%,#171108 100%);
      box-shadow:0 26px 64px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,238,205,.06);
      max-height:86vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }
    body.rot #menu-panel { max-height:86vw; }   /* 세로로 든 화면에선 화면 세로가 vw다 */
    /* 위쪽에 금박 한 줄 — 단청의 띠를 아주 얇게만 */
    #menu-panel::before { content:''; display:block; height:2px; flex:none;
      background:linear-gradient(90deg,transparent,rgba(201,162,74,.35) 18%,
        rgba(240,201,107,.72) 50%,rgba(201,162,74,.35) 82%,transparent); }

    /* ---- 머리: 제목 · 금/기력 · 닫기 ---- */
    #mn-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap;
      padding:13px 16px 12px; border-bottom:1px solid #33281a; }
    #menu-panel #mn-head h3 { margin:0; flex:none; font-family:"Gugi","Gowun Batang",serif;
      font-size:17px; line-height:1.2; color:#f0c96b; letter-spacing:.05em; }
    #mn-readout { margin-left:auto; display:flex; gap:7px; align-items:center; }
    #mn-readout .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px;
      border-radius:999px; border:1px solid #46381f; background:rgba(0,0,0,.28);
      font-family:"Gowun Batang",serif; font-size:11.5px; color:#a8997e; }
    #mn-readout .chip b { color:#f0c96b; font-weight:700; font-size:13px;
      font-variant-numeric:tabular-nums; }
    #menu-panel #mn-head #menu-close-btn { flex:none; width:31px; height:31px; padding:0; margin:0;
      border-radius:50%; border:1px solid #46381f; background:rgba(0,0,0,.28);
      font-size:0; color:transparent; display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:background .16s, border-color .16s; }
    #menu-panel #mn-head #menu-close-btn::before { content:''; width:12px; height:12px;
      background:#bfae90; -webkit-mask:${ico(I.close)} center/contain no-repeat;
      mask:${ico(I.close)} center/contain no-repeat; }
    #menu-panel #mn-head #menu-close-btn:active { background:#2e2416; border-color:#6a5433; }

    /* ---- 묶음: 넓으면 두 줄로 앉는다 ---- */
    #mn-secs { padding:14px 16px 17px; display:grid; gap:15px 20px;
      grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); }
    .mn-sec h4 { margin:0 0 8px; display:flex; align-items:center; gap:9px;
      font-family:"Gowun Batang",serif; font-weight:400; font-size:10.5px;
      letter-spacing:.34em; color:#8b7c63; }
    .mn-sec h4::after { content:''; flex:1; height:1px;
      background:linear-gradient(90deg,#3a2c1a,transparent); }
    .mn-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }

    /* ---- 칸: 열두 개가 전부 같은 크기다 ---- */
    #menu-panel .mtile { display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:7px; width:auto; min-height:82px; box-sizing:border-box;
      padding:12px 5px; margin:0; text-align:center; position:relative;
      border-radius:12px; border:1px solid #3b2f1e; background:#241b11;
      color:#efe4cd; font-family:"Gowun Batang",serif; font-size:12.5px; line-height:1.3;
      cursor:pointer; overflow:hidden; white-space:normal; word-break:keep-all;
      transition:transform .12s ease, background .16s, border-color .16s; }
    #menu-panel .mn-grid > button, #menu-panel .mn-grid > a { margin:0; }
    /* 열 때 칸이 왼쪽 위부터 차례로 들어온다 — 한꺼번에 나타나는 것보다
       어디를 보면 되는지 눈이 따라가기 쉽다 */
    #menu-modal.show .mtile { animation:mn-tile .26s ease-out both;
      animation-delay:calc(var(--n,0) * 16ms); }
    /* 시작값을 0으로 두지 않는다 — 어떤 까닭으로든 애니메이션이 멈추면
       칸이 통째로 안 보이게 된다. 흐리게라도 보이는 쪽이 안전하다. */
    @keyframes mn-tile { from { opacity:.35; transform:translateY(6px); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion:reduce){ #menu-modal.show .mtile { animation:none; } }
    #menu-panel .mtile::before { content:''; flex:none; width:22px; height:22px;
      background:linear-gradient(180deg,#e8c886,#c39c4c);
      -webkit-mask:var(--i) center/contain no-repeat; mask:var(--i) center/contain no-repeat; }
    #menu-panel .mtile:active { transform:scale(.96); background:#2f2417; border-color:#6a5433; }
    /* 안에서 다시 그린 그림·사진은 감춘다 — 아이콘은 바깥에서 씌우고 있다 */
    #menu-panel .mtile > svg, #menu-panel .mtile img { display:none; }
    /* 받을 것이 있는 칸에 점 하나 */
    #menu-panel .mtile.hot::after { content:''; position:absolute; top:8px; right:8px;
      width:7px; height:7px; border-radius:50%; background:#e8836e;
      box-shadow:0 0 0 3px rgba(232,131,110,.16); }
    /* 되돌릴 수 없는 것 하나만 색을 달리해 둔다 */
    #menu-panel #menu-reset { color:#c9b3a8; }
    #menu-panel #menu-reset::before { background:linear-gradient(180deg,#cf9782,#a56b57); }

    /* ---- 메뉴 단추에 점 — 안에 받을 것이 있으면 ---- */
    #menu-btn { position:relative; }
    #menu-btn.hot::after { content:''; position:absolute; top:0; right:0;
      width:7px; height:7px; border-radius:50%; background:#e8836e; }`;
    document.head.appendChild(s);
  }

  function panel(){ return document.getElementById('menu-panel'); }

  /* 머리와 묶음 뼈대를 한 번만 세운다 */
  function frame(p){
    if (document.getElementById('mn-secs')) return;
    const head = document.createElement('div');
    head.id = 'mn-head';
    const h3 = p.querySelector('h3');
    p.insertBefore(head, p.firstChild);
    if (h3) head.appendChild(h3);
    const ro = document.createElement('div');
    ro.id = 'mn-readout';
    head.appendChild(ro);
    const close = document.getElementById('menu-close-btn');
    if (close){ close.setAttribute('aria-label', '닫기'); head.appendChild(close); }

    const secs = document.createElement('div');
    secs.id = 'mn-secs';
    for (const [title] of SECTIONS){
      const sec = document.createElement('section');
      sec.className = 'mn-sec';
      sec.dataset.sec = title;
      sec.innerHTML = `<h4>${title}</h4><div class="mn-grid"></div>`;
      secs.appendChild(sec);
    }
    head.insertAdjacentElement('afterend', secs);
  }

  /* 금·기력은 읽는 값이라 제목 옆 알약으로 */
  function paintReadout(){
    const ro = document.getElementById('mn-readout');
    if (!ro) return;
    const g = (window.Gold && Gold.get) ? Gold.get() : null;
    const e = (window.Energy && Energy.get) ? Energy.get() : null;
    ro.innerHTML =
      (g != null ? `<span class="chip">금 <b>${(g.gold != null ? g.gold : g).toLocaleString()}</b></span>` : '') +
      (e != null ? `<span class="chip">기력 <b>${(e.cur != null ? e.cur : e)}</b></span>` : '');
    READOUT.forEach(id => { const b = document.getElementById(id); if (b) b.style.display = 'none'; });
  }

  function tidy(){
    const p = panel();
    if (!p) return;
    css(); frame(p);
    paintReadout();

    let order = 0;
    for (const [title, items] of SECTIONS){
      const grid = document.querySelector(`.mn-sec[data-sec="${title}"] .mn-grid`);
      if (!grid) continue;
      for (const [id, label, icon] of items){
        const b = document.getElementById(id);
        if (!b || b.dataset.moved === '1') continue;
        if (label) b.textContent = label;
        b.style.setProperty('--i', ico(I[icon]));
        b.style.setProperty('--n', String(order++));
        b.classList.add('mtile');
        b.dataset.moved = '1';
        grid.appendChild(b);
        // 배경음악은 누르는 즉시 그림이 바뀌어야 한다(2초 주기를 기다리지 않게)
        if (id === 'bgm-mute-toggle') b.addEventListener('click', () => setTimeout(paintBgm, 0));
      }
    }
  }

  /* 배경음악은 끈 상태와 켠 상태의 그림이 다르다 */
  function paintBgm(){
    const b = document.getElementById('bgm-mute-toggle');
    if (!b || !window.BGM || !BGM.isMuted) return;
    b.style.setProperty('--i', ico(BGM.isMuted() ? I.mute : I.bgm));
  }

  /* 안에 받을 것이 있으면 메뉴 단추에 점 하나. 신호는 살리고 자리만 줄인다. */
  function paintDot(){
    const m = document.getElementById('menu-btn');
    if (!m) return;
    const any = ALL.some(([id]) => {
      const b = document.getElementById(id);
      return b && b.classList.contains('hot');
    });
    m.classList.toggle('hot', any);
  }

  function init(){
    // 다른 모듈이 단추를 붙이는 시점이 제각각이라 잠깐 더 지켜본다
    let n = 0;
    const t = setInterval(() => {
      tidy(); paintDot(); paintBgm();
      if (++n > 24) clearInterval(t);       // 약 6초
    }, 250);
    tidy(); paintDot(); paintBgm();
    setInterval(() => { paintDot(); paintReadout(); paintBgm(); }, 2000);
    // 열 때는 값이 최신이어야 한다
    const mb = document.getElementById('menu-btn');
    if (mb) mb.addEventListener('click', () => { paintReadout(); paintBgm(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { tidy, paintDot, paintReadout, SECTIONS, ALL };
})();
