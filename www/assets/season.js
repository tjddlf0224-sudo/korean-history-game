/* ============ 이달의 시대 — 달마다 한 시대에 불이 켜진다 ============

   왜 만들었나
   - 36챕터가 한꺼번에 펼쳐져 있으면 "다 해야 한다"는 부담만 남고, 오늘 무엇을
     할지는 오히려 안 정해진다. 열어 놓은 뷔페 앞에서 굶는 것과 같다.
   - 인기 게임들이 시즌을 두는 이유가 여기 있다. **범위를 좁혀 주면** 오늘 할 일이
     생기고, 달이 바뀌면 다시 새것이 된다. 콘텐츠를 더 만들지 않고도 그렇게 된다.
   - 한능검은 시대별로 나오므로, 한 달에 한 시대를 훑는 것은 공부 순서로도 맞다.

   설계에서 지킨 것
   - **새로 세지 않는다.** 어느 챕터를 끝냈는지는 badges.js가 이미 안다.
     journey.js가 시대별 챕터 목록을 이미 갖고 있다. 여기서는 읽기만 한다.
     같은 것을 두 곳에서 세면 반드시 어긋난다(퀘스트에서 겪었다).
   - **달은 계산으로 정한다.** 어딘가에 적어 두면 기기마다 달라진다.
     연·월에서 바로 시대를 고르므로 누구에게나 같은 달에 같은 시대가 열린다.
   - **못 지나가게 막지 않는다.** 이달의 시대가 아니어도 다 할 수 있다.
     이달의 시대는 **덤을 얹어 주는 것**이지 통행증이 아니다.

   붙이는 법
     <script src="assets/season.js"></script>   (journey.js·gold.js 뒤)
*/
window.Season = (function(){
  const KEY = 'khg_season';

  /* **지금은 꺼 둔다.** (2026-09-01)
     사용자가 실기기에서 보고 "뭔가 구리다"고 했다. 두 가지가 겹쳤다 —
     ① 창을 #wrap 밖(document.body)에 붙여서 세로 모드에서 90도 틀어져 떴다.
        (내가 fx.js 주석에 적어 둔 함정에 그대로 걸렸다.)
     ② 챕터 이름을 목록 화면에서 읽어 오는데, 챕터 화면에서는 그 목록이 없어
        'seonsa1' 같은 **파일 이름**이 그대로 보였다.
     기능 자체를 지우지는 않는다. 나중에 다시 붙일 수 있게 스위치만 내린다.
     켤 때는 위 둘을 먼저 고칠 것. */
  const OFF = true;
  const BONUS = 2;                 // 이달의 시대 챕터를 끝내면 금을 이만큼 곱해 준다

  function load(){
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) return v; } catch(e){}
    return { claimed: {} };        // '2026-08:goryeo' → true
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  function eras(){
    // '시대 통합'은 시대가 아니라 묶음이라 이달의 시대에서 뺀다
    if (!window.Journey) return [];
    return Journey.ERAS.filter(e => e.id !== 'sesi');
  }

  /* 이번 달의 시대 — 연·월로 바로 정한다. 저장하지 않는다. */
  function tag(d){
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function current(d){
    const list = eras();
    if (!list.length) return null;
    d = d || new Date();
    // 달을 통째로 세어 나눈다 — 해가 바뀌어도 순서가 이어진다
    const n = d.getFullYear() * 12 + d.getMonth();
    return list[n % list.length];
  }

  function isThisMonth(file){
    const e = current();
    return !!(e && e.chapters.indexOf(file) >= 0);
  }

  function progress(){
    const e = current();
    if (!e) return null;
    const done = e.chapters.filter(f =>
      window.Badges && Badges.has('ch_complete_' + f)).length;
    return { era: e, done, total: e.chapters.length, all: done === e.chapters.length };
  }

  /* 이달의 시대를 다 끝내면 한 번 주는 상 */
  function REWARD(){ const p = progress(); return p ? 40 + p.total * 10 : 0; }
  function claimKey(){ const e = current(); return e ? tag() + ':' + e.id : ''; }
  function claimed(){ return !!load().claimed[claimKey()]; }
  function claim(){
    const p = progress();
    if (!p || !p.all || claimed()) return 0;
    const s = load(); s.claimed[claimKey()] = true; save(s);
    const g = REWARD();
    if (window.Gold) Gold.earn(g, '이달의 시대');
    return g;
  }

  /* 남은 날 — 다음 달 1일까지 */
  function daysLeft(){
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.max(1, Math.ceil((next - now) / 86400000));
  }

  /* ---------------- 챕터를 끝냈을 때 덤 ---------------- */
  function onChapterDone(file){
    if (OFF) return 0;
    if (!isThisMonth(file)) return 0;
    // 챕터 완주 금(25)에 얹어 주는 몫. 곱하기 대신 차액만 준다 —
    // 원래 주던 곳(gold.js)을 건드리지 않으려는 것이다.
    const extra = 25 * (BONUS - 1);
    if (window.Gold) Gold.earn(extra, '이달의 시대 덤');
    return extra;
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #sn-band { display:flex; align-items:center; gap:12px; padding:12px 14px;
      background:linear-gradient(90deg,#241a0e,#1c1509); border:1px solid #6b5223;
      border-radius:13px; margin:0 0 16px; font-family:"Gowun Batang",serif; cursor:pointer; }
    #sn-band .mark { width:38px; height:38px; flex:none; border-radius:9px; display:flex;
      align-items:center; justify-content:center; background:#3a2c14; border:1px solid #7a5f2a;
      font-size:19px; color:#f0c96b; }
    #sn-band .txt { flex:1; min-width:0; }
    #sn-band .k { display:block; font-size:10.5px; letter-spacing:.24em; color:#a28c5c; }
    #sn-band .v { display:block; font-size:14.5px; color:#f3e6c8; margin-top:3px; }
    #sn-band .bar { height:5px; border-radius:3px; background:#3a2c1a; overflow:hidden;
      margin-top:7px; }
    #sn-band .bar i { display:block; height:100%; background:#c9a24a; }
    #sn-band .rt { flex:none; text-align:right; font-size:11px; color:#a28c5c; line-height:1.6; }
    #sn-band .rt b { display:block; font-size:15px; color:#f0c96b;
      font-variant-numeric:tabular-nums; }
    #sn-band.ready { border-color:#c9a24a; }
    #sn-band.ready .rt b { color:#7dd87d; }

    #sn-ov { position:fixed; inset:0; z-index:97; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.92); font-family:"Gowun Batang",serif; }
    #sn-ov.show { display:flex; }
    #sn-ov .panel { width:min(92%,420px); max-height:86%; overflow-y:auto; background:#1a140c;
      border:1px solid #c9a24a; border-radius:16px; padding:22px 20px;
      display:flex; flex-direction:column; gap:12px; }
    #sn-ov h3 { margin:0; text-align:center; font-size:17px; color:#f0c96b; }
    #sn-ov .sub { text-align:center; font-size:12px; color:#a28c5c; line-height:1.7; }
    #sn-ov .row { display:flex; align-items:center; gap:9px; padding:9px 11px;
      background:#241c12; border:1px solid #3a2c1a; border-radius:10px; font-size:13px;
      color:#e8dcc2; }
    #sn-ov .row .st { flex:none; width:17px; text-align:center; color:#6d6250; }
    #sn-ov .row.ok .st { color:#7dd87d; }
    #sn-ov .row .nm { flex:1; min-width:0; }
    #sn-ov .why { font-size:11.5px; color:#8d7f66; line-height:1.85; }
    #sn-ov button { padding:12px; border-radius:11px; font-family:inherit; font-size:14.5px;
      cursor:pointer; border:1px solid #4a3c26; background:#2a2013; color:#f5ecd8; }
    #sn-ov button.hi { background:#3a2c1a; border-color:#c9a24a; color:#f0c96b; font-weight:700; }
    #sn-ov button:disabled { opacity:.5; cursor:default; }`;
    document.head.appendChild(s);
  }

  function label(){
    const p = progress();
    if (!p) return null;
    return { name: p.era.name, done: p.done, total: p.total,
             all: p.all, got: claimed(), days: daysLeft() };
  }

  /* 챕터 목록 맨 위에 띠 하나. 오늘 무엇을 할지 여기서 정해진다. */
  /* anchor를 주면 그 **바로 위**에 놓는다. 안 주면 host의 맨 앞이다 —
     맨 앞은 제목줄보다도 위라서, 목록 위에 놓으려면 anchor를 줘야 한다. */
  function mountBand(host, anchor){
    if (OFF) return;
    css();
    const p = progress();
    if (!p) return;
    host = host || (anchor && anchor.parentNode) || document.body;
    let b = document.getElementById('sn-band');
    if (!b){
      b = document.createElement('div');
      b.id = 'sn-band';
      b.onclick = open;
      host.insertBefore(b, anchor || host.firstChild);
    }
    const pct = Math.round(p.done / p.total * 100);
    const rdy = p.all && !claimed();
    b.classList.toggle('ready', rdy);
    b.innerHTML =
      '<span class="mark">季</span>' +
      '<span class="txt"><span class="k">이 달 의  시 대</span>' +
      `<span class="v">${p.era.name} · ${p.done}/${p.total}편</span>` +
      `<span class="bar"><i style="width:${pct}%"></i></span></span>` +
      `<span class="rt"><b>${rdy ? '상 받기' : (claimed() ? '완료' : p.total - p.done + '편')}</b>` +
      `${rdy || claimed() ? '' : daysLeft() + '일 남음'}</span>`;
  }

  function open(){
    if (OFF) return;
    css();
    const p = progress();
    if (!p) return;
    let d = document.getElementById('sn-ov');
    if (!d){ d = document.createElement('div'); d.id = 'sn-ov'; document.body.appendChild(d); }
    const rows = p.era.chapters.map(f => {
      const ok = window.Badges && Badges.has('ch_complete_' + f);
      const nm = title(f);
      return `<div class="row${ok ? ' ok' : ''}"><span class="st">${ok ? '✓' : '·'}</span>` +
             `<span class="nm">${nm}</span></div>`;
    }).join('');
    const rdy = p.all && !claimed();
    d.innerHTML = '<div class="panel">' +
      `<h3>이달의 시대 — ${p.era.name}</h3>` +
      `<div class="sub">${daysLeft()}일 남았다 · 이 시대 챕터는 금을 두 배로 준다</div>` +
      rows +
      (rdy ? `<button class="hi" id="sn-claim">다 끝냈다 · 금 ${REWARD()} 받기</button>`
           : (claimed() ? '<button disabled>상을 받았다</button>' : '')) +
      '<div class="why">달이 바뀌면 다음 시대에 불이 켜진다. ' +
      '이달의 시대가 아니어도 다른 챕터는 그대로 다 할 수 있다.</div>' +
      '<button id="sn-close">닫기</button></div>';
    d.classList.add('show');
    const c = d.querySelector('#sn-claim');
    if (c) c.onclick = () => { const g = claim(); c.textContent = `금 ${g}을 받았다`;
                               c.disabled = true; mountBand(); };
    d.querySelector('#sn-close').onclick = () => d.classList.remove('show');
  }

  /* 챕터 이름 — 목록 화면에 있으면 거기서 읽고, 없으면 파일명을 쓴다 */
  function title(f){
    try {
      const a = document.querySelector(`a[href="${f}"], a[href$="/${f}"]`);
      if (a){
        const n = a.querySelector('.c-name, .name, h3');
        const num = a.querySelector('.c-num, .num');
        if (n) return (num ? num.textContent.trim() + ' · ' : '') + n.textContent.trim();
      }
      if (window.ERAS){
        for (const e of ERAS) for (const c of e.cards)
          if (c.href === f) return c.num + ' · ' + c.name;
      }
    } catch(e){}
    return f.replace('.html', '');
  }

  return { current, isThisMonth, progress, claim, claimed, REWARD,
           onChapterDone, mountBand, open, label, daysLeft, tag, _eras: eras };
})();

/* ---- 챕터를 끝내면 덤을 얹는다. 원래 주던 곳은 건드리지 않는다. ---- */
(function(){
  if (!window.Badges || !Badges.earn) return;
  const orig = Badges.earn;
  Badges.earn = function(id){
    const r = orig.apply(this, arguments);
    // **처음 받은 배지일 때만** 덤을 준다. earn은 이미 가진 배지면 false를 돌려준다 —
    // 이걸 안 보면 그 챕터를 다시 깰 때마다 덤이 또 나온다.
    try {
      if (r === true && typeof id === 'string' && id.indexOf('ch_complete_') === 0)
        Season.onChapterDone(id.slice('ch_complete_'.length));
    } catch(e){}
    return r;
  };
})();
