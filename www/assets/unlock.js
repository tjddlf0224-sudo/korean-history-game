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
    #ul-ov { position:absolute; inset:0; z-index:95; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.9); font-family:"Gowun Batang",serif; }
    #ul-ov.show { display:flex; }
    #ul-ov .panel { width:min(92%,430px); max-height:86%; overflow-y:auto; background:#1a140c;
      border:1px solid #4a3c26; border-radius:16px; padding:20px 18px;
      display:flex; flex-direction:column; gap:11px; }
    #ul-ov h3 { margin:0; font-size:17px; color:#f0c96b; text-align:center; }
    #ul-ov .g { border:1px solid #3a2c1a; border-radius:11px; padding:11px 13px;
      background:#241c12; }
    #ul-ov .g.on { border-color:#c9a24a; }
    #ul-ov .g.next { border-color:#8fd0e8; }
    #ul-ov .gh { display:flex; justify-content:space-between; align-items:baseline; }
    #ul-ov .nm { font-size:14.5px; color:#f5ecd8; }
    #ul-ov .lv { font-size:11.5px; color:#8d7f66; }
    #ul-ov .it { font-size:12.5px; color:#b8a888; margin-top:4px; line-height:1.7; }
    #ul-ov .g.on .nm { color:#f0c96b; }
    #ul-ov .g:not(.on) .it { color:#6f6555; }
    #ul-ov button { padding:11px; border-radius:11px; font-family:inherit; font-size:14px;
      cursor:pointer; border:1px solid #4a3c26; background:#2a2013; color:#f5ecd8; }`;
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

  function open(){
    css();
    let d = document.getElementById('ul-ov');
    if (!d){ d = document.createElement('div'); d.id = 'ul-ov'; layer().appendChild(d);
             d.onclick = e => { if (e.target === d) d.classList.remove('show'); }; }
    const lv = level(), nx = next();
    d.innerHTML = '<div class="panel"><h3>계급과 해금</h3>' +
      GATES.map(g => {
        const on = lv >= g.lv;
        const isNext = nx && nx.tier === g.tier;
        const items = g.opens.length
          ? g.opens.map(([, n]) => (on ? '· ' : '· ') + n).join('<br>')
          : (g.desc || '');
        return `<div class="g${on ? ' on' : ''}${isNext ? ' next' : ''}">` +
          `<div class="gh"><span class="nm">${g.name}</span>` +
          `<span class="lv">Lv.${g.lv}${on ? ' · 열림' : ''}</span></div>` +
          `<div class="it">${items}</div></div>`;
      }).join('') +
      '<button id="ul-x">닫기</button></div>';
    d.querySelector('#ul-x').onclick = () => d.classList.remove('show');
    d.classList.add('show');
  }

  return { has, next, deny, open, level, GATES };
})();
