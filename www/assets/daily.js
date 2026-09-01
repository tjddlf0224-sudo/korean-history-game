/* ============ 출석과 시대 상자 — "오늘 할 일"을 만드는 것 ============

   왜 만들었나
   - 앱을 켰을 때 **오늘 뭘 하면 되는지가 없었다.** 스트릭은 있는데 스트릭을
     잇는 조건이 화면에 없다. 목표가 없으면 사람은 안 켠다.
   - 광고는 "보라"고 해서 보는 게 아니라 **원하는 게 있을 때** 본다.
     그래서 광고를 이 두 자리에만 둔다 — 오늘의 보상을 두 배로, 상자를 한 번 더.

   출석 (보카 바리스타와 같은 7일 트랙)
   - 하루 한 번 금과 기력. 7일째는 상자 하나를 더 준다.
   - 하루를 거르면 트랙이 1일로 돌아간다. 다만 **연속 기록(스트릭)은 건드리지
     않는다** — 그건 streak.js의 몫이고, 두 곳에서 같은 걸 세면 어긋난다.

   시대 상자 (난세표류기의 뽑기를 이 게임에 맞게)
   - 하루 1회 무료. 더 열고 싶으면 광고 1회, 그다음은 금.
   - **유물과 인물은 넣지 않는다.** 그건 지도에서 찾고 대화해서 얻어야 학습이
     된다. 뽑기로 주면 걷고 말 거는 이유가 사라진다.
     대신 **그걸 돕는 것**(탐지권·콤보 보험·기력·금)을 넣는다.

   붙이는 법
     <script src="assets/ads.js"></script>
     <script src="assets/daily.js"></script>   (gold.js·energy.js 뒤)
     Daily.openAttendance()  /  Daily.openBox()
*/
window.Daily = (function(){
  const KEY = 'khg_daily';

  const today = () => Math.floor(Date.now() / 86400000);

  /* 7일 트랙 보상 — 7일째가 눈에 띄게 커야 일주일을 채운다 */
  const TRACK = [
    { gold: 20, eng: 1 },
    { gold: 25, eng: 1 },
    { gold: 30, eng: 1 },
    { gold: 35, eng: 2 },
    { gold: 40, eng: 2 },
    { gold: 50, eng: 2 },
    { gold: 80, eng: 3, box: 1 },
  ];

  /* 상자에서 나오는 것 — 무게가 클수록 자주 나온다 */
  const LOOT = [
    { w: 34, id: 'gold',   n: 30, nm: '금 30' },
    { w: 22, id: 'gold',   n: 60, nm: '금 60' },
    { w: 18, id: 'energy', n: 1,  nm: '기력 1' },
    { w: 12, id: 'energy', n: 2,  nm: '기력 2' },
    { w: 9,  id: 'shield', n: 1,  nm: '콤보 지키기 1' },
    { w: 5,  id: 'gold',   n: 150, nm: '금 150' },
  ];

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === 'object') return v;
    } catch(e){}
    return { day: 0, step: 0, doubled: 0, boxDay: 0, boxUsed: 0, adBox: 0 };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  let st = load();

  function claimedToday(){ return st.day === today(); }

  /* 오늘 받을 칸(0~6). 어제 받았으면 다음 칸, 아니면 처음부터. */
  function stepToday(){
    if (claimedToday()) return st.step;
    return (st.day === today() - 1) ? (st.step + 1) % 7 : 0;
  }

  function claim(double){
    if (claimedToday()) return null;
    const i = stepToday();
    const r = TRACK[i];
    const mul = double ? 2 : 1;
    if (window.Gold) Gold.earn(r.gold * mul, '출석');
    if (window.Energy) Energy.add((r.eng || 0) * mul);
    if (r.box) st.boxUsed = 0;                 // 7일째엔 상자를 한 번 더 열 수 있다
    st.day = today(); st.step = i; st.doubled = double ? today() : st.doubled;
    save(st);
    return { i, gold: r.gold * mul, eng: (r.eng || 0) * mul, box: !!r.box };
  }

  /* ---------------- 상자 ---------------- */
  function boxLeft(){
    if (st.boxDay !== today()){ st.boxDay = today(); st.boxUsed = 0; st.adBox = 0; save(st); }
    // 왕이 되면 하루 두 번
    const cap = (window.Unlock && Unlock.has('box2')) ? 2 : 1;
    return Math.max(0, cap - st.boxUsed);
  }
  function adBoxLeft(){ boxLeft(); return Math.max(0, 1 - st.adBox); }

  function roll(){
    const total = LOOT.reduce((a, x) => a + x.w, 0);
    let r = Math.random() * total;
    for (const x of LOOT){ r -= x.w; if (r <= 0) return x; }
    return LOOT[0];
  }

  function grant(x){
    if (x.id === 'gold' && window.Gold) Gold.earn(x.n, '상자');
    else if (x.id === 'energy' && window.Energy) Energy.add(x.n);
    else if (x.id === 'shield' && window.Gold && Gold.addShield) Gold.addShield(x.n);
    return x;
  }

  function openFree(){
    if (boxLeft() <= 0) return null;
    st.boxUsed++; save(st);
    return grant(roll());
  }
  async function openByAd(){
    if (adBoxLeft() <= 0) return null;
    const ok = window.Ads ? await Ads.rewarded() : false;
    if (!ok) return null;
    st.adBox++; save(st);
    return grant(roll());
  }
  function openByGold(cost){
    if (!window.Gold || !Gold.spend(cost)) return null;
    return grant(roll());
  }
  const GOLD_BOX = 80;

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    /* 판·제목·단추·닫기 공통 모양은 panelskin.js 로 옮겼다 */

    /* ---- 이레 길 ----
       네모 일곱 개를 나란히 두는 대신, **길 위에 놓인 엽전 일곱 닢**으로 본다.
       지나온 자리는 길이 금빛으로 채워지고, 오늘 자리는 혼자 밝다.
       어디까지 왔고 다음이 무엇인지가 글자를 읽기 전에 보인다. */
    .dy-track { position:relative; display:flex; gap:3px; padding:4px 0 2px; }
    /* 엽전을 꿰는 줄 — 가운데 높이에 깔고, 지나온 만큼만 금빛으로 덮는다 */
    .dy-track .road, .dy-track .road i { position:absolute; left:7.14%; right:7.14%;
      top:31px; height:2px; border-radius:2px; }
    .dy-track .road { background:#33281a; }
    .dy-track .road i { right:auto; background:linear-gradient(90deg,#8a6f34,#f0c96b);
      box-shadow:0 0 8px rgba(240,201,107,.35); transition:width .5s cubic-bezier(.2,.9,.25,1); }
    .dy-day { flex:1; position:relative; z-index:2; display:flex; flex-direction:column;
      align-items:center; gap:6px; min-width:0; }
    .dy-day .nm { font-size:10px; color:#7d7059; letter-spacing:.02em; }
    .dy-day .coin { position:relative; width:40px; height:40px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      border:1.5px solid #443722; background:radial-gradient(circle at 35% 28%,#2c2215,#1a1309);
      font-size:12.5px; color:#8d7f66; font-variant-numeric:tabular-nums;
      box-shadow:inset 0 1px 0 rgba(255,238,205,.05); }
    /* 받은 날 — 금빛으로 채우고 갈고리표를 놓는다(도장은 쓰지 않는다) */
    .dy-day.done .coin { border-color:#8a6f34; color:#f0c96b;
      background:radial-gradient(circle at 35% 28%,#4a3717,#2b1f0c); }
    .dy-day.done .v { display:none; }
    .dy-day.done .ck { display:block; }
    .dy-day .ck { display:none; width:17px; height:17px; }
    /* 오늘 — 한 자리만 밝게. 여기를 누르면 된다는 신호다 */
    .dy-day.today .coin { border-color:#f0c96b; color:#ffe6ac; font-weight:700;
      background:radial-gradient(circle at 35% 28%,#5a4318,#33240c);
      box-shadow:0 0 0 3px rgba(240,201,107,.13), 0 0 16px rgba(240,201,107,.3);
      animation:dy-beat 2.1s ease-in-out infinite; }
    .dy-day.today .nm { color:#f0c96b; }
    @keyframes dy-beat { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.07); } }
    @media (prefers-reduced-motion:reduce){ .dy-day.today .coin { animation:none; } }
    /* 이레째 — 상자가 걸린 날. 작은 표를 달아 둔다 */
    .dy-day.sp .coin { border-color:#c9a24a; }
    .dy-day .chest { position:absolute; right:-4px; bottom:-3px; width:17px; height:17px;
      border-radius:50%; background:#2b1f0c; border:1px solid #c9a24a;
      display:flex; align-items:center; justify-content:center; color:#f0c96b; }
    .dy-day .chest svg { width:10px; height:10px; }
    /* 받는 순간 엽전이 튀어 오른다 */
    .dy-day.pop .coin { animation:dy-pop .5s cubic-bezier(.2,.9,.25,1); }
    @keyframes dy-pop { 0%{ transform:scale(1); } 35%{ transform:scale(1.28); } 100%{ transform:scale(1); } }
    .dy-spark { position:absolute; left:50%; top:50%; width:6px; height:6px; margin:-3px 0 0 -3px;
      border-radius:50%; background:#f0c96b; pointer-events:none;
      animation:dy-spark .62s ease-out forwards; }
    @keyframes dy-spark { 0%{ opacity:1; transform:translate(0,0) scale(1); }
      100%{ opacity:0; transform:translate(var(--dx),var(--dy)) scale(.3); } }

    /* 오늘 받을 몫을 크게 한 번 더 보여 준다 — 누르기 전에 무엇을 받는지 */
    .dy-prize { display:flex; align-items:center; justify-content:center; gap:14px;
      padding:11px 14px; border-radius:13px; border:1px solid #46381f;
      background:linear-gradient(180deg,rgba(58,44,26,.55),rgba(26,20,12,.35)); }
    .dy-prize .p { display:flex; align-items:center; gap:7px; font-size:13px; color:#b8a888; }
    .dy-prize .p b { font-size:18px; color:#f0c96b; font-weight:700;
      font-variant-numeric:tabular-nums; }
    .dy-prize .p svg { width:16px; height:16px; color:#c9a24a; }


    /* ---- 시대 상자 ----
       글자만 있던 자리에 **상자를 하나 놓는다.** 열면 상자가 흔들리고
       빛이 터진 다음 나온 것이 뜬다 — 무엇을 하는 화면인지 그림이 먼저 말한다. */
    .dy-chest { display:flex; flex-direction:column; align-items:center; gap:8px;
      padding:6px 0 2px; }
    .dy-chest .art { position:relative; width:88px; height:88px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      background:radial-gradient(circle at 50% 45%,rgba(240,201,107,.16),transparent 68%); }
    .dy-chest .art svg { width:56px; height:56px; color:#e0bd76;
      filter:drop-shadow(0 6px 16px rgba(0,0,0,.55)); }
    .dy-chest.shake .art svg { animation:dy-shake .55s ease-in-out; }
    @keyframes dy-shake { 0%,100%{ transform:rotate(0) } 20%{ transform:rotate(-7deg) }
      45%{ transform:rotate(6deg) } 70%{ transform:rotate(-4deg) } }
    @media (prefers-reduced-motion:reduce){ .dy-chest.shake .art svg { animation:none; } }
    /* 나온 것 — 이름 한 줄이지만 크게, 한가운데 */
    .dy-loot { min-height:26px; text-align:center; font-size:17px; font-weight:700;
      color:#f0c96b; letter-spacing:.02em; }
    .dy-loot.pop { animation:dy-lootin .45s cubic-bezier(.2,.9,.25,1) both; }
    @keyframes dy-lootin { from { opacity:0; transform:translateY(7px) scale(.94); }
      to { opacity:1; transform:none; } }
    /* 여는 방법 세 가지를 같은 크기로 나란히 */
    .dy-ways { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .dy-ov .dy-ways button { display:flex; flex-direction:column; align-items:center; gap:6px;
      margin:0; padding:11px 5px; font-size:12.5px; line-height:1.35; border-radius:12px;
      text-align:center; }
    .dy-ov .dy-ways button svg { width:19px; height:19px; }
    .dy-ov .dy-ways .cap { font-size:10.5px; color:#8d7f66; }
    .dy-ov .dy-ways button.hi .cap { color:#5c4718; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function ov(id, html){
    css();
    let d = document.getElementById(id);
    if (!d){
      d = document.createElement('div');
      d.id = id; d.className = 'dy-ov';
      layer().appendChild(d);
      d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
    }
    d.innerHTML = '<div class="panel">' + html + '</div>';
    d.classList.add('show');
    return d;
  }

  /* ---------------- 출석 창 ---------------- */
  const SVG_CHECK = '<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  const SVG_CHEST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10H3z"/><path d="M3 13h18"/>' +
    '<path d="M10 13v3h4v-3"/><path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/></svg>';
  const SVG_COIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
    '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="3.4"/></svg>';
  const SVG_ENG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linejoin="round"><path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/></svg>';

  /* 받는 순간 엽전에서 불티가 튄다 — 여덟 방향으로 흩어졌다 사라진다 */
  function sparks(el){
    if (!el) return;
    for (let i = 0; i < 8; i++){
      const a = (Math.PI * 2 * i) / 8, r = 26 + Math.random() * 12;
      const s = document.createElement('i');
      s.className = 'dy-spark';
      s.style.setProperty('--dx', (Math.cos(a) * r).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * r).toFixed(1) + 'px');
      (el.querySelector('.coin') || el).appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  }

  function openAttendance(popAt, note){
    const cur = stepToday(), done = claimedToday();
    // 받은 칸 수 — 오늘 몫을 받았으면 오늘 칸까지 포함한다
    const got = done ? cur + 1 : cur;
    const st7 = (window.Streak && Streak.load) ? (Streak.load().count || 0) : 0;
    const track = TRACK.map((r, i) => {
      const cls = (i < got ? ' done' : '') + (!done && i === cur ? ' today' : '') +
                  (r.box ? ' sp' : '') + (popAt === i ? ' pop' : '');
      return `<div class="dy-day${cls}">` +
        `<div class="coin"><span class="v">${r.gold}</span>${SVG_CHECK}` +
        (r.box ? `<i class="chest">${SVG_CHEST}</i>` : '') + '</div>' +
        `<div class="nm">${i + 1}일</div></div>`;
    }).join('');
    // 지나온 만큼만 길을 채운다(칸 가운데에서 칸 가운데까지)
    const walked = done ? got - 1 : cur;   // 길은 '서 있는 칸'까지 이어진다
    const fill = walked <= 0 ? 0 : Math.min(100, (walked / (TRACK.length - 1)) * 100);
    const now = TRACK[cur] || TRACK[0];

    const d = ov('dy-att',
      '<h3>출석</h3>' +
      `<div class="sub">${done ? '오늘 몫은 받으셨습니다. 내일 또 오시면 다음 칸입니다.'
                              : '오늘 몫을 받아 가세요.'}` +
        (st7 > 1 ? ` · 연속 ${st7}일` : '') + '</div>' +
      `<div class="dy-track"><div class="road"><i style="width:${fill}%"></i></div>${track}</div>` +
      (done ? '' :
        '<div class="dy-prize">' +
        `<span class="p">${SVG_COIN} 금 <b>${now.gold}</b></span>` +
        `<span class="p">${SVG_ENG} 기력 <b>${now.eng}</b></span>` +
        (now.box ? '<span class="p">' + SVG_CHEST + ' 상자 <b>+1</b></span>' : '') +
        '</div>' +
        '<div class="row2"><button class="hi" id="dy-c">받기</button>' +
        '<button id="dy-c2">광고 보고 두 배</button></div>') +
      `<div class="msg" id="dy-m">${note || ''}</div>` +
      '<button class="x" id="dy-x" aria-label="닫기">✕</button>');
    // 줄은 엽전 한가운데를 지나야 한다. 글꼴에 따라 높이가 달라지므로 재서 맞춘다.
    const c0 = d.querySelector('.dy-day .coin'), road = d.querySelector('.road');
    if (c0 && road) road.style.top = (c0.offsetTop + c0.offsetHeight / 2 - 1) + 'px';
    if (popAt != null) sparks(d.querySelectorAll('.dy-day')[popAt]);
    d.querySelector('#dy-x').onclick = () => d.classList.remove('show');
    const msg = t => { const m = d.querySelector('#dy-m'); if (m) m.textContent = t; };
    const b1 = d.querySelector('#dy-c'), b2 = d.querySelector('#dy-c2');
    if (b1) b1.onclick = () => {
      const at = stepToday();
      const r = claim(false);
      const t = r ? `금 ${r.gold} · 기력 ${r.eng}${r.box ? ' · 상자 한 번 더' : ''} 받았습니다` : '';
      msg(t);
      setTimeout(() => openAttendance(at, t), 900);
    };
    if (b2) b2.onclick = async () => {
      b2.disabled = true; b2.textContent = '광고 준비 중…';
      const ok = window.Ads ? await Ads.rewarded() : false;
      if (!ok){ b2.disabled = false; b2.textContent = '광고 보고 두 배';
                msg('광고를 끝까지 보지 않으셨습니다.'); return; }
      const at = stepToday();
      const r = claim(true);
      const t = r ? `두 배! 금 ${r.gold} · 기력 ${r.eng} 받았습니다` : '';
      msg(t);
      setTimeout(() => openAttendance(at, t), 900);
    };
  }

  /* ---------------- 상자 창 ---------------- */
  const SVG_AD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/>' +
    '<path d="M10.2 9.4l4.8 2.6-4.8 2.6z"/></svg>';
  const SVG_BIGCHEST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/>' +
    '<path d="M3.5 13.5h17"/><path d="M9.6 13.5v3.2h4.8v-3.2z"/>' +
    '<path d="M5.6 9.5V7A2.5 2.5 0 0 1 8.1 4.5h7.8A2.5 2.5 0 0 1 18.4 7v2.5"/>' +
    '<path d="M12 4.5v5"/></svg>';

  function openBox(lootName){
    const free = boxLeft(), ad = adBoxLeft();
    const d = ov('dy-box',
      '<h3>시대 상자</h3>' +
      '<div class="sub">금·기력·콤보 지키기가 들어 있습니다.</div>' +
      `<div class="dy-chest" id="dy-ch"><div class="art">${SVG_BIGCHEST}</div></div>` +
      `<div class="dy-loot${lootName ? ' pop' : ''}" id="dy-l">${lootName || ''}</div>` +
      '<div class="dy-ways">' +
      `<button class="hi" id="dy-f"${free ? '' : ' disabled'}>${SVG_BIGCHEST}` +
      `<span>무료</span><span class="cap">${free ? '오늘 ' + free + '번' : '다 쓰셨어요'}</span></button>` +
      `<button id="dy-a"${ad ? '' : ' disabled'}>${SVG_AD}` +
      `<span>광고</span><span class="cap">${ad ? '한 번 더' : '다 쓰셨어요'}</span></button>` +
      `<button id="dy-g">${SVG_COIN}<span>금</span><span class="cap">${GOLD_BOX}으로</span></button>` +
      '</div>' +
      '<div class="msg" id="dy-bm"></div>' +
      '<button class="x" id="dy-bx" aria-label="닫기">✕</button>');
    d.querySelector('#dy-bx').onclick = () => d.classList.remove('show');
    const msg = t => { const m = d.querySelector('#dy-bm'); if (m) m.textContent = t || ''; };
    // 열면 상자가 흔들리고, 빛이 터진 다음에 나온 것을 보여 준다
    const show = x => {
      if (!x){ msg('열지 못했습니다.'); return; }
      const ch = d.querySelector('#dy-ch');
      if (ch){ ch.classList.add('shake'); sparks(ch.querySelector('.art')); }
      msg('');
      setTimeout(() => openBox(x.nm), 1300);
    };
    d.querySelector('#dy-f').onclick = () => show(openFree());
    d.querySelector('#dy-g').onclick = () => {
      const x = openByGold(GOLD_BOX);
      show(x); if (!x) msg('금이 모자랍니다.');
    };
    d.querySelector('#dy-a').onclick = async () => {
      const b = d.querySelector('#dy-a');
      b.disabled = true; b.textContent = '광고 준비 중…';
      const x = await openByAd();
      if (!x){ b.disabled = false; b.textContent = '광고 보고 한 번 더';
               msg('광고를 끝까지 보지 않으셨습니다.'); return; }
      show(x);
    };
  }

  /* 오늘 아직 안 한 것이 있으면 true — 목록 화면에서 점을 찍는 데 쓴다 */
  function pending(){ return (!claimedToday()) || boxLeft() > 0; }

  return { openAttendance, openBox, claim, claimedToday, stepToday,
           boxLeft, adBoxLeft, openFree, openByAd, openByGold, pending, TRACK };
})();
