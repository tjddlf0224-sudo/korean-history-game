/* ============ 유물 탐색·인벤토리 (전 챕터 공용) ============
   보카바리스타의 채집처럼, 지도를 돌아다니다 그 시대의 유물을 줍는다.

   설계 의도
   - 걷기가 게임이 아니라는 진단에 대한 답. 지도에 숨긴 것이 있으면 걷는 데
     이유가 생긴다.
   - 주운 유물은 그냥 소지품이 아니라 **도감**이다. 유물마다 기출에서 어떻게
     나오는지를 붙여, 수집욕이 곧 개념 복습이 되게 한다.
   - 챕터가 바뀌어도 유지된다(localStorage). 시대를 넘나드는 이 게임 설정과 맞고,
     뒤 시대에서 앞 시대 유물을 쓰는 이벤트도 가능해진다.

   챕터에 붙이는 법
     1) <script src="assets/items.js"></script>
     2) ZONES의 구역에 spots 배열 추가:
          spots: [ { id:'x', x:420, y:300, label:'낡은 항아리',
                     item:'jumeokdokki', text:'…' } ]
     3) World.checkNpc() 끝에 Items.checkSpot(this) 한 줄
     4) Stage.interact()에서 Items.nearSpot이 있으면 Items.search() 먼저
*/
window.Items = (function(){
  const KEY = 'khg_items';

  /* ---------------- 유물 도감 ----------------
     art: assets/items/<id>.png (아직 없으면 이모지 폴백)
     exam: 기출에서 이게 어떻게 나오는지 — 도감의 핵심 */
  const DB = {
    jumeokdokki: { name:'주먹도끼', era:'구석기', emoji:'🪨',
      desc:'뗀석기 가운데 가장 널리 쓰인 만능 도구. 자르고, 찍고, 파는 데 모두 썼다.',
      exam:'구석기 하면 뗀석기 — 주먹도끼·찍개·슴베찌르개. 연천 전곡리에서 나온 것이 유명하다.' },
    bitsalmunui:  { name:'빗살무늬 토기', era:'신석기', emoji:'🏺',
      desc:'겉면에 빗살처럼 줄을 그은 토기. 밑이 뾰족해 강가나 바닷가 모래에 꽂아 세웠다.',
      exam:'신석기의 상징. 농경이 시작되며 곡식을 저장할 그릇이 필요해졌다는 근거로 나온다.' },
    bandal:       { name:'반달 돌칼', era:'청동기', emoji:'🌙',
      desc:'반달 모양 간석기. 구멍에 끈을 꿰어 손에 걸고 곡식의 이삭을 땄다.',
      exam:'청동기 시대 벼농사의 증거. 청동기는 무기·제기에 쓰고 농기구는 여전히 돌이었다.' },
    bipahyeong:   { name:'비파형 동검', era:'청동기', emoji:'🗡️',
      desc:'악기 비파를 닮은 청동 검. 만주와 한반도 북부에 걸쳐 출토된다.',
      exam:'미송리식 토기·탁자식 고인돌과 함께 **고조선의 세력 범위**를 보여주는 유물.' },
    misongni:     { name:'미송리식 토기', era:'청동기', emoji:'⚱️',
      desc:'몸통이 부풀고 목이 잘록하며 손잡이가 달린 토기. 평북 의주 미송리에서 처음 나왔다.',
      exam:'비파형 동검·탁자식 고인돌과 묶어 고조선 문화권을 묻는 문제로 나온다.' },
  };

  /* ---------------- 저장 ---------------- */
  function load(){
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') return raw;
    } catch(e){}
    return { have: {}, spots: {} };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  function has(id){ return !!load().have[id]; }
  function taken(spotKey){ return !!load().spots[spotKey]; }
  function owned(){ const h = load().have; return Object.keys(DB).filter(k => h[k]); }

  function give(id, spotKey){
    const s = load();
    if (spotKey) s.spots[spotKey] = 1;
    const isNew = !s.have[id];
    s.have[id] = 1;
    save(s);
    return isNew;
  }

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 가방 버튼 — 미니맵 아래 */
    #bag-btn { position:absolute; z-index:24; right:calc(10px + env(safe-area-inset-right));
      bottom:calc(10px + env(safe-area-inset-bottom)); width:46px; height:46px; border-radius:50%;
      border:1px solid #4a3c26; background:#241c12ee; color:#f0c96b; font-size:20px;
      display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0;
      box-shadow:0 4px 14px rgba(0,0,0,.5); }
    #bag-btn:active { transform:scale(.94); }
    #bag-btn .cnt { position:absolute; right:-2px; top:-2px; min-width:17px; height:17px;
      border-radius:999px; background:#b6483c; color:#fff; font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center; padding:0 4px; }

    /* 유물 획득 연출 */
    /* #wrap 기준으로 덮는다. fixed로 두면 회전이 없는 가로 화면에서
       다시 뷰포트 기준이 되어 #wrap과 어긋난다. */
    .it-get { position:absolute; inset:0; z-index:88; display:flex; align-items:center;
      justify-content:center; pointer-events:none; }
    .it-get .card { text-align:center; font-family:"Gowun Batang",serif;
      background:rgba(26,20,12,.94); border:1px solid rgba(240,201,107,.6); border-radius:14px;
      padding:22px 26px; box-shadow:0 14px 44px rgba(0,0,0,.6);
      animation:it-card 2.6s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes it-card { 0%{opacity:0; transform:scale(.8) translateY(12px);}
      12%{opacity:1; transform:scale(1.06) translateY(0);} 20%{transform:scale(1);}
      82%{opacity:1;} 100%{opacity:0; transform:translateY(-10px);} }
    .it-get .ic { font-size:52px; line-height:1; margin-bottom:8px; display:block; }
    .it-get .ic img { width:78px; height:78px; object-fit:contain; }
    .it-get .eb { font-size:11px; letter-spacing:.2em; color:#b8a888; }
    .it-get .nm { font-size:24px; font-weight:700; color:#f0c96b; margin:5px 0 3px;
      text-shadow:0 0 22px rgba(240,201,107,.55); }
    .it-get .er { font-size:12px; color:#c9bda6; }
    .it-get .glow { position:absolute; inset:-30px; border-radius:50%; pointer-events:none;
      background:radial-gradient(circle,rgba(240,201,107,.55),transparent 62%);
      animation:it-glow 1s ease forwards; }
    @keyframes it-glow { 0%{opacity:0; transform:scale(.4);} 30%{opacity:.9;}
      100%{opacity:0; transform:scale(1.8);} }
    .it-spark { position:absolute; width:8px; height:8px; background:#f0c96b; opacity:0; z-index:89;
      clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
      animation:it-spark .9s cubic-bezier(.2,.7,.3,1) forwards; pointer-events:none; }
    @keyframes it-spark { 0%{opacity:0; transform:rotate(var(--a)) translate(0,0) scale(.3);}
      15%{opacity:1;} 100%{opacity:0; transform:rotate(var(--a)) translate(84px,0) scale(1) rotate(200deg);} }

    /* 가방(도감) */
    #bag-ov { position:absolute; inset:0; z-index:92; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.84); font-family:"Gowun Batang",serif; }
    #bag-ov.show { display:flex; }
    #bag-ov .panel { width:min(90%,520px); max-height:84%; overflow-y:auto;
      background:#1a140c; border:1px solid #4a3c26; border-radius:16px; padding:18px; }
    #bag-ov h3 { margin:0 0 4px; font-size:17px; color:#f0c96b; text-align:center; }
    #bag-ov .cntline { text-align:center; font-size:12px; color:#b8a888; margin-bottom:14px; }
    #bag-ov .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(84px,1fr)); gap:9px; }
    #bag-ov .cell { background:#241c12; border:1px solid #3a2c1a; border-radius:11px;
      padding:10px 6px; text-align:center; cursor:pointer; }
    #bag-ov .cell.locked { opacity:.35; cursor:default; }
    #bag-ov .cell .ic { font-size:26px; display:block; margin-bottom:5px; }
    #bag-ov .cell .ic img { width:38px; height:38px; object-fit:contain; }
    #bag-ov .cell .nm { font-size:11.5px; color:#e8dcc2; line-height:1.35; }
    #bag-ov .detail { margin-top:14px; padding:14px; background:#241c12; border-radius:12px;
      border:1px solid #3a2c1a; display:none; }
    #bag-ov .detail.show { display:block; }
    #bag-ov .detail .dn { font-size:16px; font-weight:700; color:#f0c96b; }
    #bag-ov .detail .de { font-size:11px; color:#b8a888; margin-bottom:8px; }
    #bag-ov .detail .dd { font-size:13.5px; color:#f5ecd8; line-height:1.7; }
    #bag-ov .detail .dx { margin-top:9px; padding-top:9px; border-top:1px solid #3a2c1a;
      font-size:12.5px; color:#c9bda6; line-height:1.7; }
    #bag-ov .detail .dx b { color:#e9c979; }
    #bag-ov .close { display:block; width:100%; margin-top:14px; background:#2a2013;
      border:1px solid #4a3c26; color:#f5ecd8; border-radius:11px; padding:11px;
      font-family:inherit; font-size:14px; cursor:pointer; }
    @media (prefers-reduced-motion:reduce){
      .it-get .card,.it-get .glow,.it-spark { animation-duration:.01ms !important; }
    }`;
    document.head.appendChild(st);
  }

  /* 화면에 얹는 것은 전부 #wrap 안에 붙인다. 세로로 든 휴대폰에서는
     body.rot #wrap 이 rotate(90deg)로 가로모드를 만드는데, #wrap 밖에 붙이면
     그 회전을 안 물려받아 연출만 90도 틀어진 채 뜬다(미니맵과 같은 이유). */
  function layer(){ return document.getElementById('wrap') || document.body; }

  function iconHtml(id, big){
    const d = DB[id]; if (!d) return '';
    // 아트가 준비되면 자동으로 그림으로 바뀐다. 없으면 이모지로 버틴다.
    return `<span class="ic"><img src="assets/items/${id}.png" alt=""
      onerror="this.parentNode.textContent='${d.emoji}'"></span>`;
  }

  /* ---------------- 획득 연출 ---------------- */
  function celebrate(id){
    css();
    const d = DB[id];
    const ov = document.createElement('div');
    ov.className = 'it-get';
    ov.innerHTML = `<div class="card"><div class="glow"></div>${iconHtml(id, true)}` +
      `<div class="eb">유 물 을  얻 었 다</div>` +
      `<div class="nm">${d.name}</div><div class="er">${d.era}</div></div>`;
    layer().appendChild(ov);
    for (let i = 0; i < 10; i++){
      const p = document.createElement('i');
      p.className = 'it-spark';
      p.style.left = '50%'; p.style.top = '46%';
      p.style.setProperty('--a', (i * 36) + 'deg');
      p.style.animationDelay = (Math.random() * .15) + 's';
      layer().appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
    if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
    setTimeout(() => ov.remove(), 2700);
  }

  /* ---------------- 탐색 ---------------- */
  let nearSpot = null;

  function spotKey(zone, id){ return zone + ':' + id; }

  /* World.checkNpc() 끝에서 부른다. NPC보다 가까운 탐색 지점이 있으면
     그쪽을 잡고, 행동 버튼의 뜻을 [탐색]으로 바꾼다. */
  function checkSpot(world){
    // 지도에 표식을 두지 않는다. 유물은 직접 돌아다니다 발견하는 것이라,
    // 유일한 단서는 가까이 갔을 때 행동 버튼이 돋보기로 바뀌는 것뿐이다.
    // 그래서 대화 반경(108.8)보다 조금 넉넉하게 잡아, 스쳐 지나가도 걸리게 한다.
    const RANGE = 128;
    const zone = ZONES[world.zone];
    const list = (zone && zone.spots) || [];
    let best = RANGE, found = null;
    for (const s of list){
      if (taken(spotKey(world.zone, s.id))) continue;   // 이미 주운 건 무시
      const d = Math.hypot(s.x - world.px, s.y - world.py);
      if (d < best){ best = d; found = s; }
    }
    nearSpot = found;

    // NPC 옆에 유물을 숨긴 자리도 있다. 둘 다 잡히면 **더 가까운 쪽**이 이긴다.
    // (대화를 무조건 우선하면, 좁은 지도에서는 영영 못 줍는 유물이 생긴다.)
    spotWins = false;
    if (found){
      const n = world.nearNpc;
      spotWins = !n || best < Math.hypot(n.x - world.px, n.y - world.py);
    }

    const btn = document.getElementById('act-btn');
    if (!btn) return;
    if (spotWins){
      btn.classList.add('show');
      setActIcon(btn, 'search');
      btn.dataset.mode = 'search';
    } else if (btn.dataset.mode === 'search'){
      btn.dataset.mode = '';
      setActIcon(btn, '');
      if (!world.nearNpc) btn.classList.remove('show');
    }
  }

  /* 행동 버튼은 챕터마다 말풍선 아이콘을 갖고 있다. 탐색 상태일 때만
     돋보기로 갈아 끼우고, 원래 모양은 처음 한 번 기억해 두었다 되돌린다. */
  let actTalkHtml = null;
  const ACT_SEARCH_HTML =
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="10.5" cy="10.5" r="6.2" stroke="#2b1d0e" stroke-width="1.6" fill="#2b1d0e" fill-opacity="0.06"/>' +
    '<path d="M15.2 15.2 L20 20" stroke="#2b1d0e" stroke-width="1.9" stroke-linecap="round"/>' +
    '<path d="M8.2 9.4a2.5 2.5 0 0 1 2.5-2.2" stroke="#2b1d0e" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function setActIcon(btn, mode){
    if (actTalkHtml === null) actTalkHtml = btn.innerHTML;
    const want = mode === 'search' ? ACT_SEARCH_HTML : actTalkHtml;
    if (btn.innerHTML !== want) btn.innerHTML = want;
  }

  /* Stage.interact()가 NPC보다 먼저 이걸 물어본다. 처리했으면 true. */
  function trySearch(world){
    if (!nearSpot || world.nearNpc) return false;
    const s = nearSpot;
    const k = spotKey(world.zone, s.id);
    if (taken(k)) return false;
    const isNew = give(s.item, k);
    nearSpot = null;
    renderBag();
    if (isNew) celebrate(s.item);
    if (window.Rank) Rank.addXp(15, '유물 발견');
    const btn = document.getElementById('act-btn');
    if (btn){ btn.dataset.mode = ''; setActIcon(btn, ''); btn.classList.remove('show'); }
    return true;
  }

  /* ---------------- 가방 UI ---------------- */
  function mount(){
    css();
    if (!document.getElementById('bag-btn')){
      const b = document.createElement('button');
      b.id = 'bag-btn';
      b.innerHTML = '🎒<span class="cnt">0</span>';
      b.onclick = openBag;
      layer().appendChild(b);
    }
    if (!document.getElementById('bag-ov')){
      const d = document.createElement('div');
      d.id = 'bag-ov';
      d.innerHTML = '<div class="panel"><h3>유물 도감</h3>' +
        '<div class="cntline" id="bag-cnt"></div>' +
        '<div class="grid" id="bag-grid"></div>' +
        '<div class="detail" id="bag-detail"></div>' +
        '<button class="close" id="bag-close">닫기</button></div>';
      layer().appendChild(d);
      d.querySelector('#bag-close').onclick = () => d.classList.remove('show');
      d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
    }
    renderBag();
  }

  function renderBag(){
    const btn = document.getElementById('bag-btn');
    if (btn) btn.querySelector('.cnt').textContent = owned().length;
  }

  function openBag(){
    mount();
    const all = Object.keys(DB);
    const mine = owned();
    document.getElementById('bag-cnt').textContent = `${mine.length} / ${all.length} 종`;
    const g = document.getElementById('bag-grid');
    g.innerHTML = '';
    for (const id of all){
      const got = mine.includes(id);
      const c = document.createElement('div');
      c.className = 'cell' + (got ? '' : ' locked');
      c.innerHTML = got
        ? iconHtml(id) + `<div class="nm">${DB[id].name}</div>`
        : `<span class="ic">❔</span><div class="nm">???</div>`;
      if (got) c.onclick = () => showDetail(id);
      g.appendChild(c);
    }
    document.getElementById('bag-detail').classList.remove('show');
    document.getElementById('bag-ov').classList.add('show');
  }

  function showDetail(id){
    const d = DB[id], el = document.getElementById('bag-detail');
    el.innerHTML = `<div class="dn">${d.name}</div><div class="de">${d.era}</div>` +
      `<div class="dd">${d.desc}</div>` +
      `<div class="dx"><b>시험에는</b> ${d.exam}</div>`;
    el.classList.add('show');
  }

  return { DB, has, owned, give, checkSpot, trySearch,
           mount, openBag, renderBag,
           get nearSpot(){ return nearSpot; } };
})();
