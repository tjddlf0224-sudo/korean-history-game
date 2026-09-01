/* ============ 미니게임 — 같은 문제 형식만 나오면 지루하다 ============

   왜 만들었나
   - 이 게임은 문항이 **전부 2지선다**다. 수업도 한 가지 형태만 하면 재미가
     없듯이, 물어보는 방식이 하나면 금세 물린다.
   - 그런데 636문항을 다른 형식으로 다시 쓰는 것은 감당이 안 된다.
     그래서 **이미 있는 데이터로 다른 형식을 만든다.**
       · 유물 도감(items.js) 64종 — 이름과 시대가 다 있다
       · 인물 도감(heroes_data.js) 190명 — 초상과 시대가 다 있다
     새로 쓴 문항은 한 줄도 없다.

   왜 미니게임인가
   - 계급이 오르면 하나씩 열린다(unlock.js). 올릴 이유가 생긴다.
   - 이기면 금이 나온다. 하루 세 번은 그냥, 더 하고 싶으면 광고를 본다.
     **광고를 강요하지 않는다** — 더 벌고 싶은 사람만 본다.

   붙이는 법
     <script src="assets/minigames.js"></script>   (items.js·heroes.js·unlock.js 뒤)
     Mini.open()
*/
window.Mini = (function(){
  const KEY = 'khg_mini';
  const FREE_PER_DAY = 3;
  const today = () => Math.floor(Date.now() / 86400000);

  function load(){
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) return v; } catch(e){}
    return { day: 0, used: 0, adUsed: 0 };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  let st = load();

  function roll(){ if (st.day !== today()){ st.day = today(); st.used = 0; st.adUsed = 0; save(st); } }
  function freeLeft(){ roll(); return Math.max(0, FREE_PER_DAY - st.used); }
  function adLeft(){ roll(); return Math.max(0, 3 - st.adUsed); }

  /* ---------------- 데이터에서 문제를 만든다 ---------------- */
  function shuffle(a){
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  /* 유물 짝 맞추기 — 유물 이름과 시대를 잇는다.
     "이게 언제 것인지"는 기출에서 늘 묻는 것인데, 2지선다로는 잘 안 물어진다. */
  function makeMatch(){
    if (!window.Items || !Items.DB) return null;
    const owned = (Items.owned && Items.owned()) || [];
    // 주운 것 위주로 낸다 — 본 적 없는 것만 나오면 찍기가 된다
    const ids = (owned.length >= 4 ? owned : Object.keys(Items.DB));
    const pick = shuffle(ids).slice(0, 4).map(id => ({
      id, name: Items.DB[id].name, era: Items.DB[id].era }));
    if (pick.length < 4) return null;
    // 시대가 겹치면 답이 둘이 되어 버린다 — 겹치면 다시 뽑는다
    if (new Set(pick.map(p => p.era)).size < 4) return null;
    return { kind: 'match', left: pick, right: shuffle(pick) };
  }

  /* 초상 알아맞히기 — 얼굴을 보고 이름을 고른다.
     190명을 모아 놓고 정작 얼굴과 이름을 이어 본 적이 없다. */
  function makeFace(){
    const H = window.HERO_DATA;
    if (!H) return null;
    const all = Object.keys(H).filter(k => H[k].p);
    if (all.length < 4) return null;
    const four = shuffle(all).slice(0, 4);
    const ans = four[0];
    return { kind: 'face', img: 'assets/portraits/' + H[ans].p,
             answer: H[ans].n, opts: shuffle(four.map(k => H[k].n)) };
  }

  const GAMES = {
    mg_match: { name: '유물 짝 맞추기', gate: 'mg_match', make: makeMatch,
                hint: '유물과 그 시대를 이어 보세요' },
    mg_face:  { name: '초상 알아맞히기', gate: 'mg_face', make: makeFace,
                hint: '얼굴을 보고 이름을 골라 보세요' },
  };

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `

    /* ---- 놀이 고르는 칸 ----
       가로로 긴 단추 두 개를 위아래로 쌓으면 무엇이 다른지 안 보인다.
       그림·이름·한 줄 설명을 담은 **같은 크기 카드 두 장**을 나란히 둔다. */
    #mg-ov .mg-pick { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
    #mg-ov .mg-card { display:flex; flex-direction:column; align-items:center; gap:7px;
      padding:14px 10px 13px; border-radius:13px; border:1px solid #3b2f1e;
      background:#241b11; color:#efe4cd; font-size:14px; text-align:center;
      position:relative; overflow:hidden; }
    #mg-ov .mg-card .ic { width:30px; height:30px; color:#c9a24a; }
    #mg-ov .mg-card .ht { font-size:11px; color:#8d7f66; line-height:1.55; }
    #mg-ov .mg-card.on { border-color:#6b5730; background:#2b2013; }
    #mg-ov .mg-card.on .ic { color:#f0c96b; }
    #mg-ov .mg-card:disabled { opacity:.5; }
    #mg-ov .mg-card .lk { position:absolute; top:8px; right:9px; width:14px; height:14px;
      color:#8d7f66; }
    /* 오늘 남은 횟수 — 읽는 값이라 알약으로 */
    #mg-ov .mg-left { display:flex; justify-content:center; gap:7px; }
    #mg-ov .mg-left .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px;
      border-radius:999px; border:1px solid #46381f; background:rgba(0,0,0,.28);
      font-size:11.5px; color:#a8997e; }
    #mg-ov .mg-left .chip b { color:#f0c96b; font-weight:700; font-variant-numeric:tabular-nums; }
    #mg-ov .msg { min-height:19px; text-align:center; font-size:13.5px; color:#c9a24a; }

    /* 짝 맞추기 */
    .mg-pair { display:flex; gap:9px; }
    .mg-col { flex:1; display:flex; flex-direction:column; gap:7px; }
    .mg-col button { font-size:13px; padding:11px 8px; }
    .mg-col button.sel { border-color:#8fd0e8; color:#8fd0e8; }
    .mg-col button.ok { border-color:#7aa86a; color:#9dbd92; opacity:.55; }
    .mg-col button.bad { border-color:#c9452f; }

    /* 초상 */
    .mg-face { text-align:center; }
    .mg-face img { width:132px; height:auto; filter:drop-shadow(0 6px 14px rgba(0,0,0,.55)); }
    .mg-opts { display:flex; flex-direction:column; gap:8px; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function panel(html){
    css();
    let d = document.getElementById('mg-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'mg-ov';
      layer().appendChild(d);
      d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
    }
    d.innerHTML = '<div class="panel">' + html + '</div>';
    d.classList.add('show');
    return d;
  }
  function close(){ const d = document.getElementById('mg-ov'); if (d) d.classList.remove('show'); }

  /* ---------------- 보상 ---------------- */
  function reward(score, total){
    const g = Math.round(20 + 40 * (score / total));   // 20~60
    if (window.Gold) Gold.earn(g, '미니게임');
    return g;
  }

  /* ---------------- 목록 ---------------- */
  const MG_ICON = {
    mg_match: "<path d='M4 4h7v7H4z'/><path d='M13 13h7v7h-7z'/><path d='M13 4h7v7h-7z' " +
              "stroke-dasharray='2.6 2.4'/><path d='M4 13h7v7H4z' stroke-dasharray='2.6 2.4'/>",
    mg_face:  "<circle cx='12' cy='9' r='4.2'/><path d='M4.6 20.4a7.6 7.6 0 0 1 14.8 0'/>" +
              "<path d='M9.6 8.6h.01M14.4 8.6h.01'/>",
  };
  const MG_LOCK = "<path d='M6.5 10.5h11v9h-11z'/><path d='M9 10.5V8a3 3 0 0 1 6 0v2.5'/>";
  function mgSvg(d, cls){
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }

  function open(){
    const rows = '<div class="mg-pick">' + Object.entries(GAMES).map(([id, g]) => {
      const ok = !window.Unlock || Unlock.has(g.gate);
      const gate = (window.Unlock && Unlock.GATES.find(x => x.opens.some(o => o[0] === g.gate)));
      const hint = ok ? g.hint : (gate ? gate.name + '이 되면 열립니다' : '아직 잠겨 있습니다');
      return `<button class="mg-card${ok ? ' on' : ''}" data-g="${id}"${ok ? '' : ' disabled'}>` +
        (ok ? '' : mgSvg(MG_LOCK, 'lk')) +
        mgSvg(MG_ICON[id] || MG_ICON.mg_match, 'ic') +
        `<span>${g.name}</span><span class="ht">${hint}</span></button>`;
    }).join('') + '</div>';
    const d = panel('<h3>미니게임</h3>' +
      '<div class="sub">이기면 금이 나옵니다. 문제는 그대가 모은 유물과 인물에서 나옵니다.</div>' +
      `<div class="mg-left"><span class="chip">오늘 남은 무료 <b>${freeLeft()}</b></span>` +
      (adLeft() > 0 ? `<span class="chip">광고 몫 <b>${adLeft()}</b></span>` : '') + '</div>' +
      rows +
      (freeLeft() <= 0 && adLeft() > 0
        ? '<button id="mg-ad">광고 보고 한 번 더</button>' : '') +
      '<div class="msg" id="mg-m"></div><button class="x" id="mg-x" aria-label="닫기">✕</button>');
    d.querySelectorAll('[data-g]').forEach(b => {
      b.onclick = () => start(b.dataset.g);
    });
    const ad = d.querySelector('#mg-ad');
    if (ad) ad.onclick = async () => {
      ad.disabled = true; ad.textContent = '광고 준비 중…';
      const ok = window.Ads ? await Ads.rewarded() : false;
      if (!ok){ ad.disabled = false; ad.textContent = '광고 보고 한 번 더';
                d.querySelector('#mg-m').textContent = '광고를 끝까지 보지 않으셨습니다.'; return; }
      st.adUsed++; st.used = Math.max(0, st.used - 1); save(st);
      open();
    };
    d.querySelector('#mg-x').onclick = close;
  }

  function start(id){
    const g = GAMES[id];
    if (!g) return;
    if (window.Unlock && !Unlock.has(g.gate)){ Unlock.deny(g.gate); return; }
    if (freeLeft() <= 0){
      panel('<h3>오늘은 여기까지</h3>' +
        '<div class="sub">무료 도전을 다 썼다.<br>광고를 보면 한 번 더 할 수 있다.</div>' +
        '<button id="mg-x">닫기</button>');
      document.getElementById('mg-x').onclick = open;
      return;
    }
    const q = g.make();
    if (!q){
      panel('<h3>' + g.name + '</h3>' +
        '<div class="sub">아직 문제를 만들 만큼 모으지 못했다.<br>' +
        '유물을 줍고 사람을 만나면 열린다.</div>' +
        '<button id="mg-x">닫기</button>');
      document.getElementById('mg-x').onclick = open;
      return;
    }
    st.used++; save(st);
    if (q.kind === 'match') playMatch(q); else playFace(q);
  }

  /* ---------------- 짝 맞추기 ---------------- */
  function playMatch(q){
    let sel = null, done = 0, miss = 0;
    const d = panel('<h3>유물 짝 맞추기</h3>' +
      '<div class="sub">유물과 그 시대를 이어 보라</div>' +
      '<div class="mg-pair">' +
      '<div class="mg-col" id="mg-l">' +
        q.left.map((x, i) => `<button data-i="${i}">${x.name}</button>`).join('') + '</div>' +
      '<div class="mg-col" id="mg-r">' +
        q.right.map((x, i) => `<button data-i="${i}">${x.era}</button>`).join('') + '</div>' +
      '</div><div class="msg" id="mg-m"></div><button id="mg-x">그만두기</button>');
    const msg = t => { d.querySelector('#mg-m').textContent = t || ''; };
    d.querySelector('#mg-x').onclick = open;

    d.querySelectorAll('#mg-l button').forEach(b => b.onclick = () => {
      if (b.classList.contains('ok')) return;
      d.querySelectorAll('#mg-l button').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); sel = +b.dataset.i;
    });
    d.querySelectorAll('#mg-r button').forEach(b => b.onclick = () => {
      if (sel === null || b.classList.contains('ok')) return;
      const hit = q.left[sel].id === q.right[+b.dataset.i].id;
      const lb = d.querySelector(`#mg-l button[data-i="${sel}"]`);
      if (hit){
        lb.classList.remove('sel'); lb.classList.add('ok'); b.classList.add('ok');
        sel = null; done++;
        if (window.Juice) Juice.correct(true);
        if (done === q.left.length) finish(done, q.left.length, miss);
      } else {
        miss++; b.classList.add('bad');
        setTimeout(() => b.classList.remove('bad'), 500);
        msg('그 시대가 아닙니다.');
        if (window.Juice) Juice.wrong();
      }
    });
  }

  /* ---------------- 초상 알아맞히기 ---------------- */
  function playFace(q){
    const d = panel('<h3>초상 알아맞히기</h3>' +
      '<div class="sub">얼굴을 보고 이름을 고르라</div>' +
      `<div class="mg-face"><img src="${q.img}" alt=""></div>` +
      '<div class="mg-opts">' +
      q.opts.map(n => `<button data-n="${n}">${n}</button>`).join('') + '</div>' +
      '<div class="msg" id="mg-m"></div><button id="mg-x">그만두기</button>');
    d.querySelector('#mg-x').onclick = open;
    d.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
      const ok = b.dataset.n === q.answer;
      b.classList.add(ok ? 'ok' : 'bad');
      if (window.Juice) ok ? Juice.correct(true) : Juice.wrong();
      d.querySelectorAll('[data-n]').forEach(x => { x.disabled = true; });
      setTimeout(() => finish(ok ? 1 : 0, 1, ok ? 0 : 1), 700);
    });
  }

  function finish(score, total, miss){
    const g = reward(score, total);
    panel('<h3>' + (score === total ? '다 맞히셨습니다' : '끝') + '</h3>' +
      `<div class="sub">${score} / ${total}${miss ? ` · 틀린 횟수 ${miss}` : ''}</div>` +
      `<div style="text-align:center;font-size:26px;color:#f0c96b;font-weight:700">금 +${g}</div>` +
      '<button class="hi" id="mg-again">더 하기</button>' +
      '<button id="mg-x">닫기</button>');
    document.getElementById('mg-again').onclick = open;
    document.getElementById('mg-x').onclick = close;
  }

  return { open, start, freeLeft, adLeft, GAMES, _makeMatch: makeMatch, _makeFace: makeFace };
})();
