/* ============ 속보 (전 챕터 공용) ============

   왜 만들었나
   - 경제 타임머신(사장님이 만든 수업용 게임)에서 가져왔다. 거기서는 특정 턴에
     "리먼 브라더스 파산 신청!" 같은 속보가 터지면서 그 시대에 지금 무슨 일이
     벌어지는지를 몸으로 알린다.
   - 지금 이 게임은 조용히 진행되기만 한다. 임진왜란 챕터를 걸어도 전쟁이
     일어났다는 감각이 없다. 대사로만 알려 주기 때문이다.

   시대마다 소식이 오는 길이 다르다
   - 신문은 1883년 한성순보가 처음이다. 그 앞 시대에 "호외"가 뜨면 어긋난다.
   - 그래서 세 갈래로 나눴다. 선사·고대는 **입에서 입으로**(말이 돌다),
     고려·조선은 **방(榜)과 파발**, 개항기 뒤로는 **신문 호외**.
     띠의 이름·색·아이콘이 함께 바뀐다.

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

  /* 소식이 오는 길. 챕터가 News.set(table, mode)로 고른다.
       word   선사~남북국 — 사람들의 입으로 옮는다
       notice 고려~조선   — 관아에 방이 붙고 파발이 달린다
       press  개항기~현대 — 신문이 호외를 찍는다 (1883 한성순보 이후) */
  const MEDIA = {
    word:   { tag:'말 이  돌 다', cls:'nf-word' },
    notice: { tag:'방 이  붙 다', cls:'nf-notice' },
    press:  { tag:'호 외',        cls:'nf-press' },
  };

  let TABLE = {}, MODE = 'notice';
  const fired = new Set();
  let queue = [], showing = false;

  function set(table, mode){
    TABLE = table || {};
    if (mode && MEDIA[mode]) MODE = mode;
  }

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
    /* 시간이 되면 사라지는 게 아니라 **눌러야 사라진다** — 이 게임은 어디서도
       시간으로 재촉하지 않는다는 원칙을 여기도 따른다. #nf-wrap은 손대지
       않게(조이스틱을 덮지 않게) pointer-events:none 이지만, 띠 자체는
       auto로 켜서 누를 수 있게 한다. */
    .nf { width:min(92%,520px); background:linear-gradient(180deg,#241a10f5,#16110af5);
      border:1px solid #c9a24a; border-radius:12px; overflow:hidden; cursor:pointer;
      box-shadow:0 10px 34px rgba(0,0,0,.6); font-family:"Gowun Batang",serif;
      pointer-events:auto; transform:translateY(-130%);
      animation:nf-in .6s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes nf-in {
      0%{transform:translateY(-130%)} 70%{transform:translateY(6%)} 100%{transform:translateY(0)} }
    .nf.leaving { animation:nf-out .34s cubic-bezier(.4,0,1,1) forwards; }
    @keyframes nf-out { to { transform:translateY(-130%); opacity:0; } }

    /* 머리띠 — 매체에 따라 색이 다르다 */
    .nf .top { display:flex; align-items:center; gap:9px; padding:6px 12px; }
    .nf.nf-press  .top { background:linear-gradient(90deg,#8c2a1e,#b6483c); }  /* 신문 호외 */
    .nf.nf-notice .top { background:linear-gradient(90deg,#5a4423,#7d6234); }  /* 방·파발 */
    .nf.nf-word   .top { background:linear-gradient(90deg,#3f4a35,#5c6a4a); }  /* 입소문 */
    .nf .tag { font-size:11px; font-weight:700; letter-spacing:.22em; color:#ffe9d6;
      border:1px solid rgba(255,233,214,.55); border-radius:4px; padding:1px 7px; white-space:nowrap; }
    .nf .when { font-size:11.5px; color:#f0dcc6; letter-spacing:.06em; }
    .nf .dot { width:6px; height:6px; border-radius:50%; background:#ffe9d6; margin-left:auto;
      animation:nf-blink .9s ease-in-out infinite; }
    @keyframes nf-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

    .nf .body { padding:12px 14px 13px; display:flex; gap:12px; align-items:flex-start; }
    .nf .ic { flex:none; width:32px; height:32px; }
    .nf .txt { flex:1; min-width:0; }
    .nf .hl { font-size:16.5px; font-weight:700; color:#f7dd93; line-height:1.45;
      text-wrap:balance; text-shadow:0 1px 6px rgba(0,0,0,.7); }
    .nf .sub { font-size:12.5px; color:#cdbfa4; line-height:1.6; margin-top:4px; }
    .nf .hint { font-size:10.5px; color:#8d7f66; margin-top:7px; text-align:right; }

    @media (prefers-reduced-motion:reduce){ .nf, .nf.leaving { animation-duration:.01ms !important; } }`;
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
    const m = MEDIA[n.mode || MODE] || MEDIA.notice;
    const el = document.createElement('div');
    el.className = 'nf ' + m.cls;
    el.innerHTML =
      '<div class="top"><span class="tag">' + m.tag + '</span>' +
        (n.when ? `<span class="when">${n.when}</span>` : '') +
        '<span class="dot"></span></div>' +
      '<div class="body"><div class="ic">' +
        (window.Icons ? Icons.svg(n.icon, 32) : (n.icon || '')) + '</div>' +
        '<div class="txt"><div class="hl">' + n.headline + '</div>' +
        (n.sub ? '<div class="sub">' + n.sub + '</div>' : '') +
        '<div class="hint">눌러서 닫기</div>' +
      '</div></div>';
    wrap().appendChild(el);
    sfx();
    if (navigator.vibrate) navigator.vibrate([50, 60, 50]);
    el.addEventListener('click', () => {
      let done = false;
      const next = () => {
        if (done) return; done = true;
        el.remove();
        showing = false;
        if (queue.length) render(queue.shift());
      };
      el.classList.add('leaving');
      el.addEventListener('animationend', next, { once: true });
      // 화면이 숨어 있으면(탭 전환 등) CSS 애니메이션이 멈춰 animationend가
      // 영영 안 온다 — 실패-안전으로 짧은 시간 뒤엔 무조건 지운다.
      setTimeout(next, 500);
    });
  }

  /* 이 자리에 걸린 속보가 있으면 띄운다. 없으면 조용히 넘어간다. */
  function fire(trigger){
    const n = TABLE[trigger];
    if (!n || fired.has(trigger)) return false;
    fired.add(trigger);
    if (showing) queue.push(n); else render(n);
    return true;
  }

  return { set, fire, MEDIA, _table: () => TABLE, _mode: () => MODE };
})();
