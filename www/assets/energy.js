/* ============ 기력(氣) — 실패에 무게를 주는 것 ============

   왜 만들었나
   - 이 게임에는 **실패가 없었다.** 틀려도 해설을 보고 넘어갈 뿐 잃는 게 없다.
     잃을 게 없으면 이길 맛도 없다. 정답의 값을 만들려면 오답에 값이 있어야 한다.
   - 동시에 **광고를 볼 이유**를 만든다. 아쉬운 순간이 있어야 사람이 자발적으로
     광고를 본다. 아쉬움이 없으면 광고는 그냥 방해다.

   ⚠️ 넘지 않는 선 — 배우는 것 자체는 절대 막지 않는다
   - 이 게임은 시험 공부용이고, 사장님 학생들이 쓴다. 듀오링고처럼 하트가 없다고
     **새 챕터를 못 들어가게 하면 안 된다.** 공부를 볼모로 잡는 꼴이다.
   - 그래서 기력은 **접근이 아니라 "다시·빨리"를 판다**:
       · 보스에게 지고 **즉시** 다시 붙기       (없으면 기다리거나 그냥 진행)
       · 끊긴 **콤보 되살리기**                 (없으면 콤보만 0)
       · 기출문제 **추가 도전**                 (하루 무료 3회는 그대로)
     셋 다 안 써도 게임은 끝까지 된다. 조급한 사람만 값을 치른다.

   차오르는 규칙
   - 최대 5. 25분에 1씩 찬다(가득이면 시계가 멈춘다).
   - 시간은 저장된 "마지막 계산 시각"과의 차이로 구한다 — 앱이 꺼져 있어도 찬다.

   붙이는 법
     <script src="assets/ads.js"></script>
     <script src="assets/energy.js"></script>   (gold.js 뒤)
*/
window.Energy = (function(){
  const KEY = 'khg_energy';
  const MAX = 5;
  const REFILL_MS = 25 * 60 * 1000;      // 25분에 1
  const GOLD_PER = 40;                   // 금으로 살 때 1개 값

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === 'object') return v;
    } catch(e){}
    return { n: MAX, at: Date.now() };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  let st = load();

  /* 지난 시간만큼 채운다. 읽을 때마다 부르므로 따로 타이머가 필요 없다. */
  function tick(){
    if (st.n >= MAX){ st.at = Date.now(); save(st); return; }
    const gained = Math.floor((Date.now() - (st.at || 0)) / REFILL_MS);
    if (gained > 0){
      st.n = Math.min(MAX, st.n + gained);
      // 남은 자투리 시간은 버리지 않고 이어 간다 — 안 그러면 앱을 자주 켜는
      // 사람이 손해를 본다.
      st.at = (st.n >= MAX) ? Date.now() : (st.at + gained * REFILL_MS);
      save(st);
    }
  }

  function get(){ tick(); return st.n; }
  function full(){ return get() >= MAX; }

  /* 다음 한 개까지 남은 밀리초 */
  function nextIn(){
    tick();
    if (st.n >= MAX) return 0;
    return Math.max(0, REFILL_MS - (Date.now() - st.at));
  }

  function spend(n){
    tick();
    n = n || 1;
    if (st.n < n) return false;
    if (st.n >= MAX) st.at = Date.now();   // 가득에서 줄어드는 순간 시계가 돈다
    st.n -= n; save(st); render();
    return true;
  }

  function add(n){
    tick();
    st.n = Math.min(MAX, st.n + (n || 1));
    save(st); render();
    return st.n;
  }

  /* ---------------- 채우는 방법 ---------------- */
  async function refillByAd(){
    const ok = window.Ads ? await Ads.rewarded() : false;
    if (!ok) return false;
    add(2);
    return true;
  }
  function refillByGold(){
    if (!window.Gold || !Gold.spend(GOLD_PER)) return false;
    add(1);
    return true;
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #eng-btn { position:absolute; z-index:41; display:flex; align-items:center; gap:4px;
      height:38px; padding:0 10px; border-radius:19px; background:rgba(26,20,12,.82);
      border:1px solid #4a3c26; color:#8fd0e8; font-family:"Gowun Batang",serif;
      font-size:13.5px; font-variant-numeric:tabular-nums; cursor:pointer; }
    #eng-btn svg { width:16px; height:16px; flex:none; }
    #eng-btn.low { color:#e8836e; border-color:#7a3a2a; }
    #eng-ov { position:absolute; inset:0; z-index:93; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.88); font-family:"Gowun Batang",serif; }
    #eng-ov.show { display:flex; }
    #eng-ov .panel { width:min(92%,420px); background:#1a140c; border:1px solid #4a3c26;
      border-radius:16px; padding:20px 18px; display:flex; flex-direction:column; gap:11px; }
    #eng-ov h3 { margin:0; font-size:17px; color:#8fd0e8; text-align:center; }
    #eng-ov .dots { display:flex; justify-content:center; gap:7px; margin:2px 0 4px; }
    #eng-ov .dot { width:20px; height:20px; border-radius:50%; border:1px solid #4a3c26;
      background:#241c12; }
    #eng-ov .dot.on { background:#8fd0e8; border-color:#8fd0e8; }
    #eng-ov .sub { text-align:center; font-size:12.5px; color:#b8a888; line-height:1.7; }
    #eng-ov button { padding:12px; border-radius:11px; font-family:inherit; font-size:14.5px;
      cursor:pointer; border:1px solid #4a3c26; background:#2a2013; color:#f5ecd8; }
    #eng-ov button.hi { background:#2a3a44; border-color:#8fd0e8; color:#8fd0e8; }
    #eng-ov button:disabled { opacity:.4; cursor:default; }
    #eng-ov .msg { min-height:17px; text-align:center; font-size:12.5px; color:#c9a24a; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"' +
    ' stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L5 13h6l-1 9 8-11h-6z"/></svg>';

  function fmt(ms){
    const m = Math.ceil(ms / 60000);
    return m >= 60 ? `${Math.floor(m/60)}시간 ${m%60}분` : `${m}분`;
  }

  function render(){
    const b = document.getElementById('eng-btn');
    if (!b) return;
    const n = get();
    b.querySelector('span').textContent = n;
    b.classList.toggle('low', n === 0);
  }

  function mount(){
    css();
    if (document.getElementById('eng-btn')) return;
    const dock = document.getElementById('side-dock') ||
                 document.getElementById('topbar-actions');
    const b = document.createElement('button');
    b.id = 'eng-btn'; b.type = 'button';
    b.setAttribute('aria-label', '기력');
    b.innerHTML = ICON + '<span>' + get() + '</span>';
    b.onclick = open;
    if (dock){ b.style.position = 'static'; dock.appendChild(b); }
    else { b.style.right = '10px'; b.style.top = '54px'; layer().appendChild(b); }
    render();
  }

  function mountOv(){
    if (document.getElementById('eng-ov')) return;
    const d = document.createElement('div');
    d.id = 'eng-ov';
    d.innerHTML = '<div class="panel"><h3>기력</h3>' +
      '<div class="dots" id="eng-dots"></div>' +
      '<div class="sub" id="eng-sub"></div>' +
      '<button class="hi" id="eng-ad">광고 보고 기력 2 받기</button>' +
      '<button id="eng-gold">금 ' + GOLD_PER + '으로 기력 1</button>' +
      '<div class="msg" id="eng-msg"></div>' +
      '<button id="eng-x">닫기</button></div>';
    layer().appendChild(d);
    d.querySelector('#eng-x').onclick = close;
    d.onclick = e => { if (e.target === d) close(); };
    d.querySelector('#eng-ad').onclick = async () => {
      const btn = document.getElementById('eng-ad');
      btn.disabled = true; btn.textContent = '광고 준비 중…';
      const ok = await refillByAd();
      btn.disabled = false; btn.textContent = '광고 보고 기력 2 받기';
      say(ok ? '기력 2를 받았다.' : '광고를 끝까지 보지 않아 받지 못했다.');
      paint();
    };
    d.querySelector('#eng-gold').onclick = () => {
      say(refillByGold() ? '기력 1을 채웠다.' : '금이 모자란다.');
      paint();
    };
  }

  function say(t){ const m = document.getElementById('eng-msg'); if (m) m.textContent = t || ''; }

  function paint(){
    const n = get();
    const dots = document.getElementById('eng-dots');
    if (dots) dots.innerHTML = Array.from({length: MAX},
      (_, i) => `<span class="dot${i < n ? ' on' : ''}"></span>`).join('');
    const sub = document.getElementById('eng-sub');
    if (sub){
      sub.innerHTML = n >= MAX
        ? '가득 찼다.'
        : `다음 한 개까지 ${fmt(nextIn())}<br>` +
          '<span style="font-size:11.5px;color:#8d7f66">기력이 없어도 챕터는 그대로 진행된다.<br>' +
          '다시 붙거나 서두를 때만 쓴다.</span>';
    }
    const g = document.getElementById('eng-gold');
    if (g) g.disabled = !(window.Gold && Gold.get() >= GOLD_PER) || n >= MAX;
    const a = document.getElementById('eng-ad');
    if (a) a.disabled = n >= MAX;
    render();
  }

  function open(){ css(); mountOv(); paint(); document.getElementById('eng-ov').classList.add('show'); }
  function close(){ const d = document.getElementById('eng-ov'); if (d) d.classList.remove('show'); }

  /* 기력이 필요한 자리에서 부른다. 모자라면 충전 창을 띄우고 false. */
  function tryUse(n){
    if (spend(n || 1)) return true;
    open(); say('기력이 모자란다.');
    return false;
  }

  function init(){ mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { get, full, spend, add, tryUse, open, mount, nextIn,
           refillByAd, refillByGold, MAX };
})();
