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

  /* ---------- 선 그림. 24×24.
     mask가 아니라 background-image로 얹으므로 색을 마음껏 쓴다.
     G=금 R=적 B=청 N=녹 C=백. 단청 오방색을 낮춘 색들이다. ---------- */
  const G = '%23f0c96b', GD = '%23c9a24a', R = '%23d98a7a',
        B = '%237fa8c4', N = '%238fbf9a', C = '%23efe4cd', D = '%232b1f0c';

  const I = {
    // 출석 — 달력에 갈고리표. 오늘 온 것을 적는 자리다.
    att: "<rect x='3.2' y='5.2' width='17.6' height='15.6' rx='2.6' fill='" + D + "' stroke='" + GD + "' stroke-width='1.5'/>" +
         "<path d='M3.2 10h17.6' stroke='" + GD + "' stroke-width='1.5'/>" +
         "<path d='M8 3v4M16 3v4' stroke='" + G + "' stroke-width='2' stroke-linecap='round'/>" +
         "<path d='M8.6 15.4l2.3 2.3 4.5-4.6' stroke='" + N + "' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/>",

    // 상자 — 뚜껑은 금, 몸은 어둡게, 자물쇠 한 점.
    box: "<path d='M4.4 8.6h15.2v10.6a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6z' fill='" + D + "' stroke='" + GD + "' stroke-width='1.5'/>" +
         "<path d='M5.4 4.6h13.2a1.6 1.6 0 0 1 1.6 1.6v2.4H3.8V6.2a1.6 1.6 0 0 1 1.6-1.6z' fill='" + GD + "' stroke='" + G + "' stroke-width='1.3'/>" +
         "<rect x='10.2' y='11.8' width='3.6' height='4.4' rx='.8' fill='" + G + "'/>",

    // 할 일 — 종이에 갈고리표 둘. 하나는 이미 했고 하나는 남았다.
    quest: "<rect x='4.8' y='4.4' width='14.4' height='16.6' rx='2.2' fill='" + D + "' stroke='" + GD + "' stroke-width='1.5'/>" +
           "<rect x='9' y='2.6' width='6' height='3.4' rx='1.1' fill='" + G + "'/>" +
           "<path d='M8.4 11.6l1.7 1.7 3.4-3.4' stroke='" + N + "' stroke-width='1.9' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
           "<path d='M8.4 16.6h7.2' stroke='" + C + "' stroke-width='1.6' stroke-linecap='round' opacity='.5'/>",

    // 미니게임 — 주사위 둘. 앞은 금, 뒤는 어둡게 겹친다.
    mini: "<rect x='2.6' y='7.4' width='11.6' height='11.6' rx='2.6' fill='" + D + "' stroke='" + GD + "' stroke-width='1.4'/>" +
          "<circle cx='6.2' cy='11' r='1.25' fill='" + C + "'/><circle cx='10.6' cy='15.4' r='1.25' fill='" + C + "'/>" +
          "<rect x='10.4' y='3.4' width='11' height='11' rx='2.5' fill='" + G + "' stroke='" + GD + "' stroke-width='1.2'/>" +
          "<circle cx='13.8' cy='6.8' r='1.15' fill='" + D + "'/><circle cx='18' cy='11' r='1.15' fill='" + D + "'/>" +
          "<circle cx='15.9' cy='8.9' r='1.15' fill='" + D + "'/>",

    // 오답 복습 — 되돌아오는 화살표 안에서 ✗가 ○로 바뀐다.
    srs: "<path d='M20.2 12a8.2 8.2 0 1 1-2.6-6' stroke='" + GD + "' stroke-width='1.9' fill='none' stroke-linecap='round'/>" +
         "<path d='M20.6 3.6v5.2h-5.2' stroke='" + G + "' stroke-width='1.9' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
         "<path d='M8.4 9.4l4.2 4.2M12.6 9.4l-4.2 4.2' stroke='" + R + "' stroke-width='1.8' stroke-linecap='round'/>",

    // 왕조 계보 — 왕관에 붉고 푸른 보석.
    kings: "<path d='M3.6 18.4h16.8' stroke='" + GD + "' stroke-width='2' stroke-linecap='round'/>" +
           "<path d='M3.8 18.4L2.6 7.6l5.4 3.9L12 5.2l4 6.3 5.4-3.9-1.2 10.8z' fill='" + G + "' stroke='" + GD + "' stroke-width='1.2' stroke-linejoin='round'/>" +
           "<circle cx='12' cy='13.6' r='1.5' fill='" + R + "'/>" +
           "<circle cx='6.9' cy='14.4' r='1.1' fill='" + B + "'/><circle cx='17.1' cy='14.4' r='1.1' fill='" + B + "'/>",

    // 배지함 — 붉은 띠에 금빛 메달.
    badge: "<path d='M8.4 2.6l3.6 5.4 3.6-5.4' stroke='" + R + "' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
           "<circle cx='12' cy='15.2' r='6.1' fill='" + G + "' stroke='" + GD + "' stroke-width='1.3'/>" +
           "<circle cx='12' cy='15.2' r='2.5' fill='" + D + "'/>",

    // 계급 — 세 겹 갈매기. 위로 갈수록 밝아진다.
    rank: "<path d='M5 19.6l7-4.8 7 4.8' stroke='" + GD + "' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round' opacity='.55'/>" +
          "<path d='M5 14.6l7-4.8 7 4.8' stroke='" + GD + "' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/>" +
          "<path d='M5 9.6l7-4.8 7 4.8' stroke='" + G + "' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/>",

    // 급제자 명단 — 금잔에 어두운 받침.
    board: "<path d='M8 3.4h8v5.2a4 4 0 0 1-8 0z' fill='" + G + "' stroke='" + GD + "' stroke-width='1.2'/>" +
           "<path d='M8 5.4H5.2a2.9 2.9 0 0 0 2.8 3.7M16 5.4h2.8a2.9 2.9 0 0 1-2.8 3.7' stroke='" + GD + "' stroke-width='1.5' fill='none' stroke-linecap='round'/>" +
           "<path d='M12 12.6v3.2' stroke='" + GD + "' stroke-width='1.8' stroke-linecap='round'/>" +
           "<path d='M8.4 20.6h7.2l-1-4.6h-5.2z' fill='" + D + "' stroke='" + GD + "' stroke-width='1.3' stroke-linejoin='round'/>",

    // 로그인 — 사람. 얼굴은 밝게, 어깨는 푸르게.
    auth: "<circle cx='12' cy='8' r='3.9' fill='" + C + "' stroke='" + GD + "' stroke-width='1.3'/>" +
          "<path d='M4.4 20.8a7.6 7.6 0 0 1 15.2 0z' fill='" + B + "' stroke='" + GD + "' stroke-width='1.3' stroke-linejoin='round'/>",

    // 배경음악 — 나팔은 금, 소리는 푸르게 퍼진다.
    bgm: "<path d='M4.4 9.4h3.3L12 5.6v12.8l-4.3-3.8H4.4z' fill='" + G + "' stroke='" + GD + "' stroke-width='1.3' stroke-linejoin='round'/>" +
         "<path d='M15.6 9.2c1.4 1.3 1.4 4.3 0 5.6' stroke='" + B + "' stroke-width='1.8' fill='none' stroke-linecap='round'/>" +
         "<path d='M18.2 6.6c2.7 2.7 2.7 8.1 0 10.8' stroke='" + B + "' stroke-width='1.8' fill='none' stroke-linecap='round' opacity='.7'/>",

    // 배경음악 끔 — 소리 자리에 붉은 ✗.
    mute: "<path d='M4.4 9.4h3.3L12 5.6v12.8l-4.3-3.8H4.4z' fill='" + GD + "' stroke='" + GD + "' stroke-width='1.3' stroke-linejoin='round' opacity='.75'/>" +
          "<path d='M15.8 9.6l4.6 4.6M20.4 9.6l-4.6 4.6' stroke='" + R + "' stroke-width='2' stroke-linecap='round'/>",

    // 기록 초기화 — 되돌릴 수 없는 것이라 붉게 둔다.
    reset: "<path d='M4.2 6.8h15.6' stroke='" + R + "' stroke-width='1.9' stroke-linecap='round'/>" +
           "<path d='M9.4 6.8V5a1.2 1.2 0 0 1 1.2-1.2h2.8A1.2 1.2 0 0 1 14.6 5v1.8' stroke='" + R + "' stroke-width='1.6' fill='none' stroke-linecap='round'/>" +
           "<path d='M6.2 6.8l.9 12.4a1.6 1.6 0 0 0 1.6 1.5h6.6a1.6 1.6 0 0 0 1.6-1.5l.9-12.4z' fill='" + D + "' stroke='" + R + "' stroke-width='1.5' stroke-linejoin='round'/>" +
           "<path d='M10 10.6v6M14 10.6v6' stroke='" + R + "' stroke-width='1.5' stroke-linecap='round' opacity='.7'/>",

    close: "<path d='M6 6l12 12M18 6L6 18' stroke='%23bfae90' stroke-width='2' stroke-linecap='round'/>",
  };

  /* 그림 하나를 CSS가 쓸 수 있는 주소로 감싼다. 색은 그림이 스스로 갖는다. */
  function ico(d){
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'>" + d + "</svg>";
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
    #menu-panel #mn-head #menu-close-btn::before { content:''; width:13px; height:13px;
      background:${ico(I.close)} center/contain no-repeat; }
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
    /* mask로 씌우면 색이 하나로 뭉개진다. background-image로 얹어 그림이
       제 색을 그대로 갖게 한다(로그인·배경음악처럼 안을 다시 쓰는 단추에도
       안 지워지는 건 마찬가지다). */
    #menu-panel .mtile::before { content:''; flex:none; width:25px; height:25px;
      background:var(--i) center/contain no-repeat;
      filter:drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
    #menu-panel .mtile:active { transform:scale(.96); background:#2f2417; border-color:#6a5433; }
    /* 안에서 다시 그린 그림·사진은 감춘다 — 아이콘은 바깥에서 씌우고 있다 */
    #menu-panel .mtile > svg, #menu-panel .mtile img { display:none; }
    /* 받을 것이 있는 칸에 점 하나 */
    #menu-panel .mtile.hot::after { content:''; position:absolute; top:8px; right:8px;
      width:7px; height:7px; border-radius:50%; background:#e8836e;
      box-shadow:0 0 0 3px rgba(232,131,110,.16); }
    /* 되돌릴 수 없는 것 하나만 색을 달리해 둔다 */
    #menu-panel #menu-reset { color:#c9b3a8; }

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
