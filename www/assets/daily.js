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
    return Math.max(0, 1 - st.boxUsed);
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
    .dy-ov { position:absolute; inset:0; z-index:94; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.9); font-family:"Gowun Batang",serif; }
    .dy-ov.show { display:flex; }
    .dy-ov .panel { width:min(94%,460px); background:#1a140c; border:1px solid #4a3c26;
      border-radius:16px; padding:20px 18px; display:flex; flex-direction:column; gap:12px; }
    .dy-ov h3 { margin:0; font-size:18px; color:#f0c96b; text-align:center; }
    .dy-ov .sub { text-align:center; font-size:12.5px; color:#b8a888; line-height:1.7; margin-top:-5px; }
    .dy-ov button { padding:12px; border-radius:11px; font-family:inherit; font-size:14.5px;
      cursor:pointer; border:1px solid #4a3c26; background:#2a2013; color:#f5ecd8; }
    .dy-ov button.hi { background:#3a2c1a; border-color:#c9a24a; color:#f0c96b; }
    .dy-ov button:disabled { opacity:.38; cursor:default; }
    .dy-ov .msg { min-height:18px; text-align:center; font-size:13px; color:#c9a24a; }

    .dy-track { display:flex; gap:5px; }
    .dy-track .d { flex:1; border:1px solid #3a2c1a; border-radius:9px; padding:8px 2px;
      text-align:center; background:#241c12; }
    .dy-track .d.done { opacity:.42; }
    .dy-track .d.today { border-color:#f0c96b; background:#3a2c1a; }
    .dy-track .d.sp { border-color:#c9a24a; }
    .dy-track .n { font-size:10.5px; color:#8d7f66; }
    .dy-track .g { font-size:12px; color:#f0c96b; font-variant-numeric:tabular-nums; }

    .dy-loot { text-align:center; font-size:20px; color:#f0c96b; min-height:30px;
      font-weight:700; }`;
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
  function openAttendance(){
    const cur = stepToday(), done = claimedToday();
    const track = TRACK.map((r, i) =>
      `<div class="d${i < cur ? ' done' : ''}${i === cur ? ' today' : ''}${r.box ? ' sp' : ''}">` +
      `<div class="n">${i + 1}일</div><div class="g">${r.gold}</div></div>`).join('');
    const d = ov('dy-att',
      '<h3>출석</h3>' +
      `<div class="sub">${done ? '오늘 몫은 받았다. 내일 또 오면 다음 칸이다.'
                              : '오늘 몫을 받아 가라.'}</div>` +
      `<div class="dy-track">${track}</div>` +
      (done ? '' : '<button class="hi" id="dy-c">받기</button>' +
                   '<button id="dy-c2">광고 보고 두 배로 받기</button>') +
      '<div class="msg" id="dy-m"></div>' +
      '<button id="dy-x">닫기</button>');
    d.querySelector('#dy-x').onclick = () => d.classList.remove('show');
    const msg = t => { const m = d.querySelector('#dy-m'); if (m) m.textContent = t; };
    const b1 = d.querySelector('#dy-c'), b2 = d.querySelector('#dy-c2');
    if (b1) b1.onclick = () => {
      const r = claim(false);
      if (r) msg(`금 ${r.gold}, 기력 ${r.eng}${r.box ? ' + 상자 한 번 더' : ''}`);
      setTimeout(openAttendance, 900);
    };
    if (b2) b2.onclick = async () => {
      b2.disabled = true; b2.textContent = '광고 준비 중…';
      const ok = window.Ads ? await Ads.rewarded() : false;
      if (!ok){ b2.disabled = false; b2.textContent = '광고 보고 두 배로 받기';
                msg('광고를 끝까지 보지 않았다.'); return; }
      const r = claim(true);
      if (r) msg(`두 배! 금 ${r.gold}, 기력 ${r.eng}`);
      setTimeout(openAttendance, 900);
    };
  }

  /* ---------------- 상자 창 ---------------- */
  function openBox(){
    const free = boxLeft(), ad = adBoxLeft();
    const d = ov('dy-box',
      '<h3>시대 상자</h3>' +
      '<div class="sub">금·기력·콤보 지키기가 들어 있다.<br>' +
      '<span style="font-size:11.5px;color:#8d7f66">유물과 인물은 안 들어 있다 — ' +
      '그건 지도에서 찾고 말을 걸어야 얻는다.</span></div>' +
      '<div class="dy-loot" id="dy-l"></div>' +
      `<button class="hi" id="dy-f"${free ? '' : ' disabled'}>` +
      `${free ? '오늘의 무료 상자' : '오늘 무료 상자는 다 썼다'}</button>` +
      `<button id="dy-a"${ad ? '' : ' disabled'}>` +
      `${ad ? '광고 보고 한 번 더' : '광고 몫도 다 썼다'}</button>` +
      `<button id="dy-g">금 ${GOLD_BOX}으로 한 번 더</button>` +
      '<div class="msg" id="dy-bm"></div>' +
      '<button id="dy-bx">닫기</button>');
    d.querySelector('#dy-bx').onclick = () => d.classList.remove('show');
    const loot = t => { const l = d.querySelector('#dy-l'); if (l) l.textContent = t || ''; };
    const msg = t => { const m = d.querySelector('#dy-bm'); if (m) m.textContent = t || ''; };
    const show = x => { if (x){ loot(x.nm); msg(''); setTimeout(openBox, 1300); }
                        else msg('열지 못했다.'); };
    d.querySelector('#dy-f').onclick = () => show(openFree());
    d.querySelector('#dy-g').onclick = () => {
      const x = openByGold(GOLD_BOX);
      show(x); if (!x) msg('금이 모자란다.');
    };
    d.querySelector('#dy-a').onclick = async () => {
      const b = d.querySelector('#dy-a');
      b.disabled = true; b.textContent = '광고 준비 중…';
      const x = await openByAd();
      if (!x){ b.disabled = false; b.textContent = '광고 보고 한 번 더';
               msg('광고를 끝까지 보지 않았다.'); return; }
      show(x);
    };
  }

  /* 오늘 아직 안 한 것이 있으면 true — 목록 화면에서 점을 찍는 데 쓴다 */
  function pending(){ return (!claimedToday()) || boxLeft() > 0; }

  return { openAttendance, openBox, claim, claimedToday, stepToday,
           boxLeft, adBoxLeft, openFree, openByAd, openByGold, pending, TRACK };
})();
