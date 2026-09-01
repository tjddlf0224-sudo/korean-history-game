/* ============ 화면 정리 — 보이는 것은 적게, 기능은 메뉴 안에 ============

   왜 만들었나
   - 기능을 하나씩 붙이다 보니 목록 화면 맨 위에 단추가 **열한 개**가 되었다.
     급제·출석·할 일·미니게임·계급·상자·로그인·금·기력·스트릭·메뉴.
     하나씩 보면 다 필요한데 한꺼번에 보면 어지럽다. 처음 온 사람은
     "무엇부터 해야 하나"가 아니라 "이게 다 뭔가"부터 묻게 된다.
   - 그래서 **보이는 것을 둘로 줄이고**(스트릭·메뉴) 나머지는 메뉴 안에 넣는다.
     기능을 없애는 게 아니라 자리를 옮기는 것이다.

   숨기면 놓치는 문제 — 점 하나로 푼다
   - 출석·상자·할 일은 "오늘 받을 게 있다"를 점으로 알리고 있었다. 메뉴 안에
     넣으면 그 점이 안 보인다.
   - 그래서 **안에 점이 하나라도 있으면 메뉴 단추에 점을 찍는다.** 열어 보면
     어느 것인지 안에서 다시 점으로 알려 준다. 신호는 유지하고 자리만 줄인다.

   금·기력은 단추가 아니라 **읽는 값**이라, 메뉴 맨 위에 한 줄로 적는다.

   챕터 화면은 손대지 않는다 — 거기는 다섯 개뿐이고 전부 놀면서 쓰는 것들이다.

   붙이는 법
     <script src="assets/tidy.js"></script>   (다른 모듈들 뒤, index.html에만)
*/
window.Tidy = (function(){
  // 메뉴 안으로 옮길 것들. 순서가 곧 메뉴에 놓이는 순서다.
  const MOVE = [
    ['daily-att',    '출석'],
    ['daily-box',    '상자'],
    ['daily-quest',  '할 일'],
    ['daily-mini',   '미니게임'],
    ['daily-unlock', '계급'],
    ['board-btn',    '급제자 명단'],
    ['auth-btn',     null],          // 글자는 그대로 둔다(로그인/로그아웃이 바뀐다)
  ];
  const READOUT = ['gold-btn', 'eng-btn'];

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    /* 항목이 배로 늘었으니 패널이 화면을 넘지 않게 — 넘으면 안에서 굴린다.
       실제로 시뮬레이터에서 위아래가 잘려 제목과 닫기가 안 보였다. */
    #menu-panel { max-height:82vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }
    body.rot #menu-panel { max-height:82vw; }   /* 세로 모드에선 화면 세로가 vw다 */
    /* 옮긴 단추들은 2열로 접는다 — 한 줄씩 쌓으면 목록이 너무 길어진다 */
    #tidy-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:0 0 8px; }
    #menu-panel .moved { display:block; width:100%; box-sizing:border-box;
      text-align:center; height:auto; padding:11px 8px; margin:0;
      border-radius:10px; border:1px solid #4a3c26; background:#241c12;
      color:#f5ecd8; font-family:"Gowun Batang",serif; font-size:14px;
      cursor:pointer; position:relative; white-space:nowrap;
      overflow:hidden; text-overflow:ellipsis; }
    #menu-panel .moved.hot::after { content:''; position:absolute; top:6px; right:7px;
      width:7px; height:7px; border-radius:50%; background:#e8836e; }
    /* 금·기력은 읽는 값이라 단추가 아니라 한 줄로 */
    #menu-readout { display:flex; gap:14px; align-items:center; justify-content:center;
      padding:9px 0 13px; margin-bottom:11px; border-bottom:1px solid #3a2c1a;
      font-family:"Gowun Batang",serif; font-size:13.5px; color:#c9bda6; }
    #menu-readout b { color:#f0c96b; font-variant-numeric:tabular-nums; font-weight:700; }
    /* 메뉴 단추에 점 — 안에 받을 것이 있으면 */
    #menu-btn { position:relative; }
    #menu-btn.hot::after { content:''; position:absolute; top:0; right:0;
      width:7px; height:7px; border-radius:50%; background:#e8836e; }`;
    document.head.appendChild(s);
  }

  function panel(){ return document.getElementById('menu-panel'); }

  function tidy(){
    const p = panel();
    if (!p) return;
    css();
    const closeBtn = document.getElementById('menu-close-btn');

    // ① 읽는 값(금·기력)을 메뉴 맨 위 한 줄로
    let ro = document.getElementById('menu-readout');
    const golds = READOUT.map(id => document.getElementById(id)).filter(Boolean);
    if (golds.length && !ro){
      ro = document.createElement('div');
      ro.id = 'menu-readout';
      const h3 = p.querySelector('h3');
      p.insertBefore(ro, h3 ? h3.nextSibling : p.firstChild);
    }
    if (ro){
      const g = (window.Gold && Gold.get) ? Gold.get() : null;
      const e = (window.Energy && Energy.get) ? Energy.get() : null;
      ro.innerHTML =
        (g != null ? `금 <b>${(g.gold != null ? g.gold : g).toLocaleString()}</b>` : '') +
        (e != null ? `기력 <b>${(e.cur != null ? e.cur : e)}</b>` : '');
      golds.forEach(b => { b.style.display = 'none'; });   // 상단에서는 감춘다
    }

    // ② 단추들을 메뉴 안 2열 그리드로 옮긴다
    let grid = document.getElementById('tidy-grid');
    if (!grid){
      grid = document.createElement('div');
      grid.id = 'tidy-grid';
      p.insertBefore(grid, closeBtn || null);
    }
    for (const [id, label] of MOVE){
      const b = document.getElementById(id);
      if (!b || b.dataset.moved === '1') continue;
      if (label) b.textContent = label;
      b.classList.add('moved');
      b.dataset.moved = '1';
      grid.appendChild(b);
    }
  }

  /* 안에 받을 것이 있으면 메뉴 단추에 점 하나. 신호는 살리고 자리만 줄인다. */
  function paintDot(){
    const m = document.getElementById('menu-btn');
    if (!m) return;
    const any = MOVE.some(([id]) => {
      const b = document.getElementById(id);
      return b && b.classList.contains('hot');
    });
    m.classList.toggle('hot', any);
  }

  function init(){
    // 다른 모듈이 단추를 붙이는 시점이 제각각이라 잠깐 더 지켜본다
    let n = 0;
    const t = setInterval(() => {
      tidy(); paintDot();
      if (++n > 24) clearInterval(t);       // 약 6초
    }, 250);
    tidy(); paintDot();
    setInterval(paintDot, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { tidy, paintDot, MOVE };
})();
