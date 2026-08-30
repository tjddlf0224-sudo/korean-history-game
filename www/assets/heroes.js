/* ============ 인물 도감 (전 챕터 공용) ============

   왜 만들었나
   - 초상을 273장 만들어 두고 게임에서 170장만 쓰고 있었다. 103장이 놀았다.
   - 유물 도감이 "걷는 데 이유"를 만들었듯이, 인물 카드는 **대화를 끝까지
     제대로 푸는 데 이유**를 만든다.

   카드를 얻는 규칙
   - 그 인물의 **퀴즈가 있는 대화를 전부** 끝내면 카드를 얻는다.
     한 번에 못 맞혀도 결국 맞히면 준다 — 막히면 못 얻는 구조는 학습 게임에서
     벌이 된다.
   - 그 전부를 **첫 시도에** 맞혔으면 ★(각성)이 붙는다. 다시 와서 제대로
     풀 이유가 여기서 생긴다.

   챕터에 붙이는 법
     1) <script src="assets/heroes_data.js"></script>
        <script src="assets/heroes.js"></script>
     2) Heroes.mount()
     3) 대화가 끝날 때 Heroes.recordTalk(npcId, key, missed)
        (missed = 그 대화에서 한 번이라도 틀렸는가)
*/
window.Heroes = (function(){
  const KEY = 'khg_heroes';
  const DB = () => (window.HERO_DATA || {});

  /* ---------------- 저장 ----------------
     have: { heroKey: 1|2 }   1=카드, 2=★(각성)
     prog: { 'chapter:heroKey': { d:[끝낸 대화 키], m:true(한 번이라도 틀림) } } */
  function load(){
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') return raw;
    } catch(e){}
    return { have:{}, prog:{} };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  function owned(){ const h = load().have; return Object.keys(DB()).filter(k => h[k]); }
  function starred(){ const h = load().have; return Object.keys(DB()).filter(k => h[k] === 2); }
  function has(k){ return !!load().have[k]; }
  function total(){ return Object.keys(DB()).length; }

  /* npcId로 카드 키를 찾는다. 초상이 있으면 파일명, 없으면 id가 키다. */
  function keyForNpc(npcId, chapter){
    const db = DB();
    if (db[npcId] && db[npcId].ch[chapter]) return npcId;
    for (const k in db){
      const ch = db[k].ch[chapter];
      if (!ch) continue;
      // 대화 키는 항상 `<npcId>_...` 로 시작한다
      if (ch.some(t => t === npcId || t.indexOf(npcId + '_') === 0)) return k;
    }
    return null;
  }

  function chapterFile(){ return location.pathname.split('/').pop() || 'index.html'; }

  /* ---------------- 대화 하나가 끝날 때 ---------------- */
  function recordTalk(npcId, talkKey, missed){
    const ch = chapterFile();
    const k = keyForNpc(npcId, ch);
    if (!k) return null;
    const need = (DB()[k].ch[ch] || []);
    if (need.indexOf(talkKey) < 0) return null;   // 퀴즈 없는 대화는 세지 않는다

    const s = load();
    const pk = ch + ':' + k;
    const p = s.prog[pk] || { d:[], m:false };
    if (p.d.indexOf(talkKey) < 0) p.d.push(talkKey);
    if (missed) p.m = true;
    s.prog[pk] = p;

    // 이 챕터에서 필요한 대화를 다 했는가
    let got = null;
    if (need.every(t => p.d.indexOf(t) >= 0)){
      const grade = p.m ? 1 : 2;
      const before = s.have[k] || 0;
      if (grade > before){ s.have[k] = grade; got = { key:k, grade, isNew: before === 0 }; }
    }
    save(s);
    if (got) celebrate(got.key, got.grade);
    return got;
  }


  /* ---------------- 능력치 ----------------

     인물의 역할에서 특기를 정한다. 왕은 사람을 모으고(인망), 학자는 알고(학식),
     장수는 맞서고(담력), 백성은 물정에 밝다(안목). 억지스럽지 않고, 167명을
     손으로 하나씩 정하지 않아도 된다.

     효과는 일부러 작게 잡았다. 학습 게임에서 능력치가 세지면 "문제를 잘 풀어서"가
     아니라 "동료가 좋아서" 이기게 된다. 힌트 한 번, 방어 한 번, 경험치 15% —
     이 정도가 상한이다.

     ★(각성)이면 한 단계 세진다. 다시 와서 제대로 풀 이유가 여기에도 걸린다. */
  const ABIL = {
    king:     { id:'mang', name:'인망', han:'望', desc:'경험치를 더 얻는다' },
    scholar:  { id:'sik',  name:'학식', han:'識', desc:'틀려도 연속이 한 번 버틴다' },
    general:  { id:'dam',  name:'담력', han:'膽', desc:'보스전에서 한 번 버틴다' },
    commoner: { id:'an',   name:'안목', han:'眼', desc:'유물을 더 멀리서 알아본다' },
  };

  function abilOf(k){
    const d = DB()[k]; if (!d) return null;
    const a = ABIL[d.r] || ABIL.commoner;
    const grade = load().have[k] || 0;
    return Object.assign({}, a, { lv: grade === 2 ? 2 : 1 });
  }

  /* ---------------- 동료 편성 ----------------
     둘까지만 데려간다. 둘이면 "누구를 뺄까"를 고민하지만 넷이면 그냥 다 넣는다.
     고민이 사라지면 편성 화면이 무의미해진다. */
  const MAX_PARTY = 2;

  function party(){
    const s = load();
    return (s.party || []).filter(k => s.have[k]).slice(0, MAX_PARTY);
  }
  function inParty(k){ return party().indexOf(k) >= 0; }
  function toggleParty(k){
    const s = load();
    s.party = (s.party || []).filter(x => s.have[x]);
    const i = s.party.indexOf(k);
    if (i >= 0) s.party.splice(i, 1);
    else {
      if (!s.have[k]) return false;
      if (s.party.length >= MAX_PARTY) s.party.shift();   // 가장 먼저 넣은 사람이 빠진다
      s.party.push(k);
    }
    save(s);
    renderBtn();
    return true;
  }

  /* 데려간 동료들의 능력치 합. 다른 모듈이 이걸 물어본다. */
  function power(id){
    let v = 0;
    for (const k of party()){
      const a = abilOf(k);
      if (a && a.id === id) v += a.lv;
    }
    return v;
  }

  /* ---------------- 한 챕터에 한 번 쓰는 것 ----------------
     학식은 "틀려도 연속이 한 번 버틴다"인데, 이걸 매번 쓰면 콤보가 의미를
     잃는다. 그래서 챕터당 한 번만 쓰이고 그 사실을 화면에 알린다. */
  let sikUsed = false;
  function trySik(){
    if (sikUsed || power('sik') <= 0) return false;
    sikUsed = true;
    toast('학식 — 연속이 끊기지 않았다');
    return true;
  }
  function toast(t){
    css();
    const el = document.createElement('div');
    el.className = 'hr-toast';
    el.textContent = t;
    layer().appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 인물 카드 버튼 — 가방 아래 */
    #hero-btn { position:absolute; z-index:24; right:calc(10px + env(safe-area-inset-right));
      top:calc(188px + env(safe-area-inset-top)); width:46px; height:46px; border-radius:50%;
      border:1px solid #4a3c26; background:#241c12ee; color:#f0c96b; font-size:19px;
      display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0;
      box-shadow:0 4px 14px rgba(0,0,0,.5); }
    #hero-btn:active { transform:scale(.94); }
    #hero-btn .cnt { position:absolute; right:-2px; top:-2px; min-width:17px; height:17px;
      border-radius:999px; background:#6b4a8c; color:#fff; font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center; padding:0 4px; }

    /* 카드를 얻는 순간 */
    .hr-get { position:absolute; inset:0; z-index:88; display:flex; align-items:center;
      justify-content:center; pointer-events:none; font-family:"Gowun Batang",serif; }
    .hr-get .card { text-align:center; background:rgba(26,20,12,.95);
      border:1px solid rgba(240,201,107,.65); border-radius:14px; padding:20px 26px;
      box-shadow:0 14px 44px rgba(0,0,0,.65);
      animation:hr-card 2.6s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes hr-card { 0%{opacity:0; transform:scale(.8) translateY(12px);}
      12%{opacity:1; transform:scale(1.06) translateY(0);} 20%{transform:scale(1);}
      82%{opacity:1;} 100%{opacity:0; transform:translateY(-10px);} }
    .hr-get .face { width:96px; height:96px; border-radius:10px; overflow:hidden;
      margin:0 auto 9px; border:1px solid rgba(240,201,107,.5); background:#2a2118; }
    .hr-get .face img { width:100%; height:100%; object-fit:cover; object-position:top center; }
    .hr-get .eb { font-size:11px; letter-spacing:.2em; color:#b8a888; }
    .hr-get .nm { font-size:23px; font-weight:700; color:#f0c96b; margin:5px 0 3px;
      text-shadow:0 0 22px rgba(240,201,107,.55); }
    .hr-get .er { font-size:12px; color:#c9bda6; }
    .hr-get .star { font-size:14px; color:#ffd970; margin-top:6px; letter-spacing:.2em; }

    /* 도감 */
    #hero-ov { position:absolute; inset:0; z-index:92; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.86); font-family:"Gowun Batang",serif; }
    #hero-ov.show { display:flex; }
    #hero-ov .panel { width:min(92%,560px); max-height:88%; display:flex; flex-direction:column;
      background:#1a140c; border:1px solid #4a3c26; border-radius:16px; padding:16px; }
    #hero-ov h3 { margin:0 0 3px; font-size:17px; color:#f0c96b; text-align:center; }
    #hero-ov .cntline { text-align:center; font-size:12px; color:#b8a888; margin-bottom:12px; }
    #hero-ov .scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; flex:1; }
    #hero-ov .era { font-size:12px; color:#c9a24a; letter-spacing:.12em; margin:14px 0 7px;
      padding-bottom:4px; border-bottom:1px solid #3a2c1a; }
    #hero-ov .era:first-child { margin-top:0; }
    #hero-ov .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(72px,1fr)); gap:8px; }
    #hero-ov .cell { background:#241c12; border:1px solid #3a2c1a; border-radius:10px;
      padding:6px 4px 7px; text-align:center; cursor:pointer; position:relative; }
    #hero-ov .cell.locked { opacity:.32; cursor:default; }
    #hero-ov .cell .f { width:100%; aspect-ratio:1; border-radius:7px; overflow:hidden;
      background:#1a140c; margin-bottom:4px; display:grid; place-content:center; }
    #hero-ov .cell .f img { width:100%; height:100%; object-fit:cover; object-position:top center; }
    #hero-ov .cell .q { font-size:20px; color:#5d5040; }
    #hero-ov .cell .nm { font-size:11px; color:#e8dcc2; line-height:1.3; }
    #hero-ov .cell .st { position:absolute; right:3px; top:3px; font-size:11px; color:#ffd970;
      text-shadow:0 1px 4px rgba(0,0,0,.9); }
    #hero-ov .detail { margin-top:12px; padding:13px; background:#241c12; border-radius:11px;
      border:1px solid #3a2c1a; display:none; flex:none; }
    #hero-ov .detail.show { display:block; }
    #hero-ov .detail .dn { font-size:16px; font-weight:700; color:#f0c96b; }
    #hero-ov .detail .de { font-size:11px; color:#b8a888; margin-bottom:7px; }
    #hero-ov .detail .dd { font-size:13px; color:#f5ecd8; line-height:1.7; }
    #hero-ov .close { display:block; width:100%; margin-top:12px; background:#2a2013;
      border:1px solid #4a3c26; color:#f5ecd8; border-radius:11px; padding:11px;
      font-family:inherit; font-size:14px; cursor:pointer; flex:none; }
    /* 동료 자리 — 도감 위쪽에 붙는 띠 */
    #hero-ov .party { display:flex; gap:8px; align-items:center; justify-content:center;
      margin-bottom:11px; padding:9px; background:#241c12; border:1px solid #3a2c1a;
      border-radius:11px; flex:none; }
    #hero-ov .party .slot { width:52px; height:52px; border-radius:9px; border:1px dashed #4a3c26;
      background:#1a140c; display:grid; place-content:center; overflow:hidden; position:relative; }
    #hero-ov .party .slot img { width:100%; height:100%; object-fit:cover; object-position:top center; }
    #hero-ov .party .slot .e { font-size:17px; color:#4a3c26; }
    #hero-ov .party .info { flex:1; font-size:11.5px; color:#b8a888; line-height:1.55; }
    #hero-ov .party .info b { color:#f0c96b; }
    #hero-ov .cell.picked { border-color:#c9a24a; box-shadow:0 0 0 1px #c9a24a inset; }
    #hero-ov .cell .ab { position:absolute; left:3px; top:3px; font-size:10px; color:#c9a24a;
      text-shadow:0 1px 4px rgba(0,0,0,.9); }
    #hero-ov .detail .join { margin-top:9px; width:100%; background:#2a2013; border:1px solid #c9a24a;
      color:#f0c96b; border-radius:9px; padding:9px; font-family:inherit; font-size:13.5px; cursor:pointer; }

    /* 능력이 발동했을 때 알리는 띠 */
    .hr-toast { position:absolute; left:50%; top:16%; transform:translateX(-50%); z-index:30;
      background:rgba(26,20,12,.95); border:1px solid rgba(240,201,107,.6); border-radius:10px;
      padding:9px 16px; font-family:"Gowun Batang",serif; font-size:13.5px; color:#f0c96b;
      white-space:nowrap; pointer-events:none; animation:hr-toast 2.2s ease forwards; }
    @keyframes hr-toast { 0%{opacity:0; transform:translate(-50%,8px)} 12%{opacity:1; transform:translate(-50%,0)}
      80%{opacity:1} 100%{opacity:0; transform:translate(-50%,-8px)} }

    @media (prefers-reduced-motion:reduce){ .hr-get .card, .hr-toast { animation-duration:.01ms !important; } }`;
    document.head.appendChild(st);
  }

  /* 화면에 얹는 것은 #wrap 안에 — 세로로 든 휴대폰에서 #wrap이 90도 돌기 때문 */
  function layer(){ return document.getElementById('wrap') || document.body; }

  function faceHtml(k){
    const d = DB()[k];
    if (d && d.p) return `<img src="assets/portraits/${d.p}" alt="">`;
    return '<span class="q">?</span>';   // 초상이 없는 인물
  }

  function celebrate(k, grade){
    css();
    const d = DB()[k]; if (!d) return;
    const ov = document.createElement('div');
    ov.className = 'hr-get';
    ov.innerHTML = `<div class="card"><div class="face">${faceHtml(k)}</div>` +
      `<div class="eb">인 물 을  얻 었 다</div>` +
      `<div class="nm">${d.n}</div><div class="er">${d.e}</div>` +
      (grade === 2 ? '<div class="star">★ 한 번에 모두 맞혔다</div>' : '');
    layer().appendChild(ov);
    if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
    setTimeout(() => ov.remove(), 2700);
    renderBtn();
  }

  /* ---------------- 버튼·도감 ---------------- */
  function mount(){
    css();
    const L = layer();
    if (!document.getElementById('hero-btn')){
      const b = document.createElement('button');
      b.id = 'hero-btn';
      b.innerHTML = '👥<span class="cnt">0</span>';
      b.onclick = openBook;
      L.appendChild(b);
    }
    if (!document.getElementById('hero-ov')){
      const d = document.createElement('div');
      d.id = 'hero-ov';
      d.innerHTML = '<div class="panel"><h3>인물 도감</h3>' +
        '<div class="cntline" id="hero-cnt"></div>' +
        '<div class="party" id="hero-party"></div>' +
        '<div class="scroll" id="hero-list"></div>' +
        '<div class="detail" id="hero-detail"></div>' +
        '<button class="close" id="hero-close">닫기</button></div>';
      L.appendChild(d);
      d.querySelector('#hero-close').onclick = () => d.classList.remove('show');
      d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
    }
    renderBtn();
  }

  function markPicked(){
    document.querySelectorAll('#hero-list .cell[data-k]').forEach(c => {
      c.classList.toggle('picked', inParty(c.dataset.k));
    });
  }

  function renderBtn(){
    const el = document.querySelector('#hero-btn .cnt');
    if (el) el.textContent = owned().length;
  }

  function openBook(){
    css(); mount();
    const s = load(), db = DB();
    const got = owned().length, st = starred().length;
    document.getElementById('hero-cnt').textContent =
      `${got} / ${total()} 명` + (st ? ` · ★ ${st}` : '');

    // 시대별로 묶어 보여 준다(챕터 목록과 같은 순서)
    const byEra = [];
    for (const k in db){
      const e = db[k].e;
      let g = byEra.find(x => x.e === e);
      if (!g){ g = { e, items: [] }; byEra.push(g); }
      g.items.push(k);
    }
    const list = document.getElementById('hero-list');
    list.innerHTML = byEra.map(g =>
      `<div class="era">${g.e} · ${g.items.filter(k => s.have[k]).length}/${g.items.length}</div>` +
      '<div class="grid">' + g.items.map(k => {
        const d = db[k], grade = s.have[k] || 0;
        if (!grade) return `<div class="cell locked"><div class="f"><span class="q">?</span></div>` +
                           `<div class="nm">???</div></div>`;
        const ab = ABIL[d.r] || ABIL.commoner;
        return `<div class="cell${inParty(k) ? ' picked' : ''}" data-k="${k}">` +
               `<span class="ab">${ab.han}</span>` +
               (grade === 2 ? '<span class="st">★</span>' : '') +
               `<div class="f">${faceHtml(k)}</div><div class="nm">${d.n}</div></div>`;
      }).join('') + '</div>').join('');

    list.querySelectorAll('.cell[data-k]').forEach(c => {
      c.onclick = () => showDetail(c.dataset.k);
    });
    renderParty();
    document.getElementById('hero-detail').classList.remove('show');
    document.getElementById('hero-ov').classList.add('show');
  }

  function renderParty(){
    const el = document.getElementById('hero-party'); if (!el) return;
    const p = party();
    let slots = '';
    for (let i = 0; i < MAX_PARTY; i++){
      const k = p[i];
      slots += `<div class="slot">${k ? faceHtml(k) : '<span class="e">＋</span>'}</div>`;
    }
    // 지금 붙어 있는 효과를 그대로 읽어 준다
    const lines = [];
    for (const id of ['sik','dam','an','mang']){
      const v = power(id);
      if (!v) continue;
      const a = Object.values(ABIL).find(x => x.id === id);
      lines.push(`<b>${a.name}</b> ${a.desc}`);
    }
    el.innerHTML = slots +
      `<div class="info">${p.length ? lines.join('<br>') : '동료를 두 명까지 데려갈 수 있다.<br>인물을 눌러 정한다.'}</div>`;
  }

  function showDetail(k){
    const d = DB()[k], s = load();
    const el = document.getElementById('hero-detail');
    const chs = Object.keys(d.ch).length;
    const a = abilOf(k);
    el.innerHTML = `<div class="dn">${d.n}${s.have[k] === 2 ? ' <span style="color:#ffd970">★</span>' : ''}</div>` +
      `<div class="de">${d.e}</div>` +
      `<div class="dd">${chs > 1 ? `${chs}개 화에 나온다. ` : ''}` +
      (s.have[k] === 2 ? '모든 물음에 한 번에 답했다.' : '이야기를 끝까지 들었다.') + '</div>' +
      (a ? `<div class="dd" style="margin-top:6px"><b style="color:#c9a24a">${a.han} ${a.name}</b>` +
           `${a.lv > 1 ? ' <span style="color:#ffd970">Ⅱ</span>' : ''} — ${a.desc}</div>` : '') +
      `<button class="join" data-k="${k}">${inParty(k) ? '동행 그만두기' : '데리고 가기'}</button>`;
    el.classList.add('show');
    const btn = el.querySelector('.join');
    if (btn) btn.onclick = () => { toggleParty(k); renderParty(); showDetail(k); markPicked(); };
  }

  return { recordTalk, mount, openBook, has, owned, starred, total,
           keyForNpc, abilOf, party, inParty, toggleParty, power, trySik, ABIL, MAX_PARTY,
           _load: load };
})();
