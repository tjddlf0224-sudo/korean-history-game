/* ============ 속보 (전 챕터 공용) ============

   왜 만들었나
   - 경제 타임머신(사장님이 만든 수업용 게임)에서 가져왔다. 거기서는 특정 턴에
     "리먼 브라더스 파산 신청!" 같은 속보가 터지면서 그 시대에 지금 무슨 일이
     벌어지는지를 몸으로 알린다.
   - 지금 이 게임은 조용히 진행되기만 한다. 임진왜란 챕터를 걸어도 전쟁이
     일어났다는 감각이 없다. 대사로만 알려 주기 때문이다.

   언제 뜨는가
   - 챕터의 막이 넘어갈 때(대화를 끝냈을 때) 그 시점에 맞는 속보를 띄운다.
     기준은 `NEWS[챕터][트리거]` 하나뿐이라 챕터가 쓰기 쉬워야 한다.
   - 한 챕터에서 같은 속보는 한 번만. localStorage에 남기지 않는다 —
     다시 플레이하면 다시 보는 편이 낫다(사건이니까).

   챕터에 붙이는 법
     1) <script src="assets/newsflash.js"></script>
     2) 그 챕터의 속보를 등록:  News.set({ 'sejong_1': {...}, ... })
     3) 터뜨릴 자리에서:        News.fire('sejong_1')
*/
window.News = (function(){

  let TABLE = {};
  const fired = new Set();
  let queue = [], showing = false;

  function set(table){ TABLE = table || {}; }

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 화면 위에서 내려오는 호외(號外) 띠. 게임을 멈추지 않는다 —
       읽는 사이에도 걸어다닐 수 있어야 흐름이 끊기지 않는다. */
    #nf-wrap { position:absolute; left:0; right:0; top:0; z-index:34; pointer-events:none;
      display:flex; justify-content:center; padding-top:calc(8px + env(safe-area-inset-top)); }
    .nf { width:min(92%,520px); background:linear-gradient(180deg,#241a10f5,#16110af5);
      border:1px solid #c9a24a; border-radius:12px; overflow:hidden;
      box-shadow:0 10px 34px rgba(0,0,0,.6); font-family:"Gowun Batang",serif;
      transform:translateY(-130%); animation:nf-in 5.4s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes nf-in {
      0%{transform:translateY(-130%)} 9%{transform:translateY(6%)} 13%{transform:translateY(0)}
      88%{transform:translateY(0); opacity:1} 100%{transform:translateY(-130%); opacity:0} }

    /* 머리띠 — 붉은 호외 라벨이 흐른다 */
    .nf .top { display:flex; align-items:center; gap:9px; padding:6px 12px;
      background:linear-gradient(90deg,#8c2a1e,#b6483c); }
    .nf .tag { font-size:11px; font-weight:700; letter-spacing:.28em; color:#ffe9d6;
      border:1px solid rgba(255,233,214,.55); border-radius:4px; padding:1px 7px; white-space:nowrap; }
    .nf .when { font-size:11.5px; color:#ffd9c6; letter-spacing:.06em; }
    .nf .dot { width:6px; height:6px; border-radius:50%; background:#ffe9d6; margin-left:auto;
      animation:nf-blink .9s ease-in-out infinite; }
    @keyframes nf-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

    .nf .body { padding:12px 14px 13px; display:flex; gap:12px; align-items:flex-start; }
    .nf .ic { font-size:30px; line-height:1.1; flex:none; }
    .nf .txt { flex:1; min-width:0; }
    .nf .hl { font-size:16.5px; font-weight:700; color:#f7dd93; line-height:1.45;
      text-wrap:balance; text-shadow:0 1px 6px rgba(0,0,0,.7); }
    .nf .sub { font-size:12.5px; color:#cdbfa4; line-height:1.6; margin-top:4px; }

    @media (prefers-reduced-motion:reduce){ .nf { animation-duration:.01ms !important; } }`;
    document.head.appendChild(st);
  }

  /* 화면에 얹는 것은 #wrap 안에 — 세로로 든 휴대폰에서 #wrap이 90도 돌기 때문 */
  function layer(){ return document.getElementById('wrap') || document.body; }

  function wrap(){
    css();
    let w = document.getElementById('nf-wrap');
    if (!w){
      w = document.createElement('div'); w.id = 'nf-wrap';
      layer().appendChild(w);
    }
    return w;
  }

  /* 속보 소리 — 파일 없이 합성한다(juice.js와 같은 방식).
     둥, 두둥 하는 낮은 두 번의 타격. */
  function sfx(){
    if (window.BGM && BGM.isMuted && BGM.isMuted()) return;
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)();
      [[0, 320], [0.16, 240]].forEach(([d, f]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle';
        const t = c.currentTime + d;
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.3);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.connect(g).connect(c.destination);
        o.start(t); o.stop(t + 0.36);
      });
    } catch(e){}
  }

  function render(n){
    showing = true;
    const el = document.createElement('div');
    el.className = 'nf';
    el.innerHTML =
      '<div class="top"><span class="tag">호 외</span>' +
        (n.when ? `<span class="when">${n.when}</span>` : '') +
        '<span class="dot"></span></div>' +
      '<div class="body"><div class="ic">' + (n.icon || '📜') + '</div>' +
        '<div class="txt"><div class="hl">' + n.headline + '</div>' +
        (n.sub ? '<div class="sub">' + n.sub + '</div>' : '') +
      '</div></div>';
    wrap().appendChild(el);
    sfx();
    if (navigator.vibrate) navigator.vibrate([50, 60, 50]);
    setTimeout(() => {
      el.remove();
      showing = false;
      if (queue.length) render(queue.shift());
    }, 5500);
  }

  /* 이 자리에 걸린 속보가 있으면 띄운다. 없으면 조용히 넘어간다. */
  function fire(trigger){
    const n = TABLE[trigger];
    if (!n || fired.has(trigger)) return false;
    fired.add(trigger);
    if (showing) queue.push(n); else render(n);
    return true;
  }

  return { set, fire, _table: () => TABLE };
})();
