/* ============ 랭킹 — 남들은 어디까지 갔나 ============

   왜 만들었나
   - 혼자 하는 공부는 어디쯤 왔는지 알 길이 없다. 남의 점수가 보이면
     "나도 저기까지" 하는 이유가 하나 더 생긴다.
   - 다만 이 게임에서 순위는 **곁가지**다. 안 올려도 게임은 끝까지 되고,
     로그인하지 않아도 아무것도 막히지 않는다.

   무엇을 점수로 삼나 — 새로 세지 않는다
   - rank.js의 **누적 경험치**를 그대로 쓴다. 문제를 맞히고 챕터를 끝낼 때마다
     이미 쌓이는 값이라, 랭킹용 점수를 따로 만들면 두 곳이 어긋난다.
   - 그래서 "많이 푼 사람이 위"가 된다. 빨리 푼 사람이 아니라. 그게 맞다 —
     이건 공부하는 게임이고, 시간 제한은 어디에도 걸지 않는다.

   보안 (Firestore 규칙과 짝을 이룬다)
   - 쓰기는 **로그인한 사람이 자기 문서에만**. 남의 점수는 건드릴 수 없다.
   - 이름 20자, 점수 상한이 규칙에 박혀 있다. 클라이언트를 못 믿기 때문이다.
   - 읽기는 누구나. 통계(khg_qstats)와 달리 순위는 공개해야 뜻이 있다.

   붙이는 법
     <script src="assets/board.js"></script>   (auth.js·rank.js 뒤)
     Board.open()  으로 연다
*/
window.Board = (function(){
  const COL = 'khg_rank';
  const TOP = 30;

  function db(){
    try { return (window.Auth && Auth.db) || null; } catch(e){ return null; }
  }
  function me(){
    try { return (window.Auth && Auth.user) || null; } catch(e){ return null; }
  }
  function myScore(){
    try { return (window.Rank && Rank.get().xp) || 0; } catch(e){ return 0; }
  }
  function myTier(){
    try { const g = Rank.get(); return { level: g.level, tier: g.tier && g.tier.name }; }
    catch(e){ return { level: 1, tier: '노비' }; }
  }

  /* 내 점수를 올린다. 로그인 안 했으면 아무 일도 안 한다(조용히). */
  async function push(){
    const d = db(), u = me();
    if (!d || !u) return false;
    const g = myTier();
    const name = (u.displayName || '이름 없는 나그네').slice(0, 20);
    try {
      await d.collection(COL).doc(u.uid).set({
        name: name,
        score: Math.max(0, Math.min(2000000, Math.round(myScore()))),
        level: g.level,
        tier: g.tier || '',
        at: Date.now(),
      });
      return true;
    } catch(e){ return false; }
  }

  async function top(n){
    const d = db();
    if (!d) return [];
    try {
      const q = await d.collection(COL).orderBy('score', 'desc').limit(n || TOP).get();
      const out = [];
      q.forEach(doc => out.push(Object.assign({ uid: doc.id }, doc.data())));
      return out;
    } catch(e){ return []; }
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #bd-ov { position:fixed; inset:0; z-index:97; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.93); font-family:"Gowun Batang",serif; }
    #bd-ov.show { display:flex; }
    #bd-ov .panel { width:min(92%,430px); max-height:86%; display:flex; flex-direction:column;
      background:#1a140c; border:1px solid #c9a24a; border-radius:16px; padding:20px 18px; }
    #bd-ov h3 { margin:0 0 3px; text-align:center; font-size:17px; color:#f0c96b; }
    #bd-ov .sub { text-align:center; font-size:12px; color:#a28c5c; margin-bottom:14px;
      line-height:1.7; }
    #bd-ov .list { overflow-y:auto; display:flex; flex-direction:column; gap:5px; }
    #bd-ov .row { display:flex; align-items:center; gap:10px; padding:9px 11px;
      background:#241c12; border:1px solid #3a2c1a; border-radius:9px; font-size:13.5px; }
    #bd-ov .row.me { border-color:#c9a24a; background:#2e2415; }
    #bd-ov .no { flex:none; width:24px; text-align:right; color:#a28c5c;
      font-variant-numeric:tabular-nums; }
    #bd-ov .row.top1 .no { color:#f0c96b; font-weight:700; }
    #bd-ov .nm { flex:1; min-width:0; color:#e8dcc2; overflow:hidden;
      text-overflow:ellipsis; white-space:nowrap; }
    #bd-ov .tr { flex:none; font-size:11.5px; color:#8d7f66; }
    #bd-ov .sc { flex:none; color:#f0c96b; font-variant-numeric:tabular-nums; }
    #bd-ov .empty { text-align:center; color:#8d7f66; font-size:13px; padding:26px 8px;
      line-height:1.9; }
    #bd-ov button { margin-top:12px; padding:12px; border-radius:11px; font-family:inherit;
      font-size:14.5px; cursor:pointer; border:1px solid #4a3c26; background:#2a2013;
      color:#f5ecd8; }
    #bd-ov button.hi { background:#3a2c1a; border-color:#c9a24a; color:#f0c96b; font-weight:700; }`;
    document.head.appendChild(s);
  }

  function row(r, i, mine){
    const cls = 'row' + (mine ? ' me' : '') + (i === 0 ? ' top1' : '');
    return `<div class="${cls}"><span class="no">${i + 1}</span>` +
           `<span class="nm">${esc(r.name || '이름 없는 나그네')}</span>` +
           `<span class="tr">${esc(r.tier || '')}</span>` +
           `<span class="sc">${(r.score || 0).toLocaleString()}</span></div>`;
  }
  function esc(t){
    return String(t).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function open(){
    css();
    let d = document.getElementById('bd-ov');
    if (!d){ d = document.createElement('div'); d.id = 'bd-ov'; document.body.appendChild(d); }
    d.innerHTML = '<div class="panel"><h3>과거 급제자 명단</h3>' +
      '<div class="sub">불러오는 중…</div><div class="list"></div>' +
      '<button id="bd-close">닫기</button></div>';
    d.classList.add('show');
    d.querySelector('#bd-close').onclick = () => d.classList.remove('show');

    const u = me();
    if (u) await push();                     // 열 때 내 점수를 올린다
    const list = await top(TOP);
    const sub = d.querySelector('.sub');
    const box = d.querySelector('.list');

    if (!window.Auth || !Auth.enabled){
      sub.textContent = '';
      box.innerHTML = '<div class="empty">랭킹은 아직 준비 중입니다.</div>';
      return;
    }
    if (!u){
      sub.textContent = '누적 경험치로 겨룹니다';
      box.innerHTML = '<div class="empty">로그인하면 이름을 올릴 수 있습니다.<br>' +
        '<b>올리지 않아도 게임은 끝까지 됩니다.</b></div>' +
        list.map((r, i) => row(r, i, false)).join('');
      return;
    }
    sub.textContent = '누적 경험치로 겨룹니다 · 빨리 푼 사람이 아니라 많이 푼 사람이 위입니다';
    if (!list.length){
      box.innerHTML = '<div class="empty">아직 아무도 없습니다. 그대가 처음입니다.</div>';
      return;
    }
    box.innerHTML = list.map((r, i) => row(r, i, r.uid === u.uid)).join('');
    // 내가 30위 밖이면 내 자리를 따로 붙여 준다
    if (!list.some(r => r.uid === u.uid)){
      const g = myTier();
      box.innerHTML += '<div class="empty" style="padding:10px 0 4px">…</div>' +
        row({ name: u.displayName || '나', tier: g.tier, score: myScore() }, TOP, true);
    }
  }

  return { open, push, top, COL };
})();
