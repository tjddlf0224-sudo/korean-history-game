/* ============ 금(金) — 시대를 관통하는 화폐 (전 챕터 공용) ============

   왜 만들었나
   - 지금은 잘해도 남는 것이 경험치와 도감뿐이다. 모으는 재미는 있는데
     **쓰는 재미**가 없다. 무엇을 살지 고르는 순간이 있어야 잘하려는 이유가 생긴다.
   - 설계안(_research/artifact_system_design.md)의 ④ 금 항목을 구현한 것이다.

   설계안과 달라진 곳 — 힌트를 팔지 않는다
   - 원안은 "선택지 하나 지우기"였는데, 이 게임 문항은 **전부 2지선다**라
     하나를 지우면 곧 정답이다. 돈으로 정답을 사는 꼴이라 학습이 무너진다.
   - 그래서 정답에 닿는 것은 팔지 않고, **탐색과 리듬**만 판다.
       · 유물 탐지 — 못 찾은 유물 자리를 잠깐 비춘다(정답과 무관)
       · 콤보 지키기 — 다음 오답 한 번은 콤보가 안 끊긴다(정답과 무관)
       · 군자금 후원 — 일제강점기, 금붙이를 지닌 채 임시정부에 내놓는다

   스스로 붙는다
   - 챕터 36개를 하나하나 고치지 않으려고, 이미 있는 전역 함수(Juice.correct,
     Items.give, Badges.earn, Boss.start)를 감싸서 획득 지점을 만든다.
     챕터에는 <script src="assets/gold.js"> 한 줄만 추가하면 된다.

   붙이는 법
     <script src="assets/gold.js"></script>   (juice.js·items.js 뒤)
*/
window.Gold = (function(){
  const KEY = 'khg_gold';

  const PRICE = { scan: 12, scanWithMap: 8, shield: 20, fund: 50 };

  /* 화폐 유물을 지니면 돈이 더 잘 붙는다 — 유물에 쓰임새를 주기 위한 것 */
  const COIN_ITEMS = ['deongiswe', 'geonwonjungbo', 'sangpyeongtongbo'];

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === 'object') return v;
    } catch(e){}
    return { gold: 0, shield: 0, funded: false };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  let st = load();

  function get(){ return st.gold; }

  function bonus(){
    if (!window.Items) return 1;
    let n = 0;
    for (const id of COIN_ITEMS) if (Items.has(id)) n++;
    return 1 + n * 0.1;
  }

  function earn(n, why){
    const amt = Math.max(1, Math.round(n * bonus()));
    st.gold += amt; save(st);
    render(); float('+' + amt, why);
    return amt;
  }

  function spend(n){
    if (st.gold < n) return false;
    st.gold -= n; save(st); render(); float('-' + n, '');
    return true;
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #gold-btn { position:absolute; z-index:41; display:flex; align-items:center; gap:4px;
      height:38px; padding:0 10px; border-radius:19px; background:rgba(26,20,12,.82);
      border:1px solid #4a3c26; color:#f0c96b; font-family:"Gowun Batang",serif;
      font-size:13.5px; font-variant-numeric:tabular-nums; cursor:pointer; }
    #gold-btn svg { width:17px; height:17px; flex:none; }
    #gold-btn:active { transform:scale(.96); }
    .gold-float { position:absolute; z-index:92; font-family:"Gowun Batang",serif;
      font-size:15px; font-weight:700; color:#f0c96b; text-shadow:0 2px 6px rgba(0,0,0,.6);
      pointer-events:none; animation:gold-rise 1.1s ease-out forwards; }
    @keyframes gold-rise { 0%{opacity:0; transform:translateY(6px)} 18%{opacity:1}
      100%{opacity:0; transform:translateY(-26px)} }

    #gold-ov { position:absolute; inset:0; z-index:93; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.88); font-family:"Gowun Batang",serif; }
    #gold-ov.show { display:flex; }
    #gold-ov .panel { width:min(92%,460px); background:#1a140c; border:1px solid #4a3c26;
      border-radius:16px; padding:18px; display:flex; flex-direction:column; gap:12px; }
    #gold-ov h3 { margin:0; font-size:17px; color:#f0c96b; text-align:center; }
    #gold-ov .bal { text-align:center; font-size:13px; color:#b8a888; margin-top:-6px; }
    #gold-ov .row { display:flex; gap:11px; align-items:center; background:#241c12;
      border:1px solid #3a2c1a; border-radius:11px; padding:11px 13px; text-align:left; }
    #gold-ov .row .ic { flex:none; width:26px; height:26px; color:#c9a24a; }
    #gold-ov .row .tx { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
    /* span은 인라인이라 그냥 두면 이름과 설명이 한 줄로 붙는다 */
    #gold-ov .row .nm { display:block; font-size:14px; color:#f5ecd8; }
    #gold-ov .row .ds { display:block; font-size:11.5px; color:#8d7f66; line-height:1.55; }
    #gold-ov .row button { flex:none; background:#2a2013; border:1px solid #4a3c26;
      color:#f0c96b; border-radius:8px; padding:7px 12px; font-family:inherit;
      font-size:12.5px; cursor:pointer; font-variant-numeric:tabular-nums; }
    #gold-ov .row button:disabled { opacity:.4; cursor:default; }
    #gold-ov .msg { min-height:18px; text-align:center; font-size:12.5px; color:#c9a24a; }
    #gold-ov .close { background:#2a2013; border:1px solid #4a3c26; color:#f5ecd8;
      border-radius:11px; padding:11px; font-family:inherit; font-size:14px; cursor:pointer; }
    @media (prefers-reduced-motion:reduce){ .gold-float { animation-duration:.01ms !important; } }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"' +
    ' stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/>' +
    '<rect x="9.2" y="9.2" width="5.6" height="5.6" rx="0.8"/></svg>';

  function float(text, why){
    const L = layer(), btn = document.getElementById('gold-btn');
    if (!btn) return;
    const lb = L.getBoundingClientRect(), bb = btn.getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'gold-float';
    d.textContent = why ? `${text} 금` : `${text} 금`;
    d.style.left = (bb.left - lb.left) + 'px';
    d.style.top = (bb.top - lb.top - 4) + 'px';
    L.appendChild(d);
    setTimeout(() => d.remove(), 1200);
  }

  function render(){
    const b = document.getElementById('gold-btn');
    if (b) b.querySelector('span').textContent = st.gold;
  }

  /* 버튼은 우측 세로 정렬대(#side-dock)에 끼운다 — 없으면 만들지 않는다.
     예전에 모듈마다 제멋대로 absolute로 붙였다가 서로 겹친 적이 있다. */
  function mount(){
    css();
    if (document.getElementById('gold-btn')) return;
    // 챕터에서는 우측 세로 정렬대에, 목록 화면에서는 상단 알약 줄에 붙인다.
    // 둘 다 없을 때만 제 자리를 잡는다 — 예전에 모듈마다 제멋대로 absolute로
    // 붙였다가 서로 겹친 적이 있다.
    const dock = document.getElementById('side-dock') ||
                 document.getElementById('topbar-actions');
    const b = document.createElement('button');
    b.id = 'gold-btn'; b.type = 'button';
    b.setAttribute('aria-label', '금');
    b.innerHTML = ICON + '<span>' + st.gold + '</span>';
    b.onclick = open;
    if (dock){ b.style.position = 'static'; dock.appendChild(b); }
    else { b.style.right = '10px'; b.style.top = '10px'; layer().appendChild(b); }
    render();
  }

  /* ---------------- 상점 ---------------- */
  function rows(){
    const hasMap = !!(window.Items && Items.has('daedongyeojido'));
    const scan = hasMap ? PRICE.scanWithMap : PRICE.scan;
    const out = [];
    // 유물 탐지는 재상부터 — 지도를 다 걸어 본 사람에게 주는 편의다
    if (!window.Unlock || Unlock.has('scan')) out.push(
      { id:'scan', nm:'유물 탐지', price:scan,
        ds:'이 구역에서 아직 못 찾은 유물 자리가 잠시 빛난다.' +
           (hasMap ? ' 대동여지도를 지녀 값이 싸다.' : '') });
    out.push(
      { id:'shield', nm:'콤보 지키기', price:PRICE.shield,
        ds:'다음에 한 번 틀려도 콤보가 끊기지 않는다.' +
           (st.shield ? ` (지금 ${st.shield}개)` : '') });
    // 군자금 후원은 상점에서 뺐다 — 선사시대에서도 임시정부에 후원할 수
    // 있었기 때문이다. 이제 금붙이를 지니고 임시정부 청사에 서 있을 때만
    // 가방에서 꺼내 쓸 수 있다(items.js의 USE).
    return out;
  }

  function open(){
    // 상점은 중인부터. 금은 그전에도 쌓이지만 쓸 곳이 그때 열린다.
    if (window.Unlock && !Unlock.has('shop')){ Unlock.deny('shop'); return; }
    css(); mountOv();
    const ov = document.getElementById('gold-ov');
    document.getElementById('gold-bal').textContent = `지닌 금 ${st.gold}`;
    const box = document.getElementById('gold-rows');
    box.innerHTML = rows().map(r =>
      `<div class="row"><span class="ic">${ICON}</span>` +
      `<span class="tx"><span class="nm">${r.nm}</span>` +
      `<span class="ds">${r.ds}</span></span>` +
      `<button data-id="${r.id}" data-p="${r.price}"` +
      `${st.gold < r.price ? ' disabled' : ''}>${r.price} 금</button></div>`).join('');
    box.querySelectorAll('button').forEach(b => { b.onclick = () => buy(b.dataset.id, +b.dataset.p); });
    document.getElementById('gold-msg').textContent = '';
    ov.classList.add('show');
  }

  function mountOv(){
    if (document.getElementById('gold-ov')) return;
    const d = document.createElement('div');
    d.id = 'gold-ov';
    d.innerHTML = '<div class="panel"><h3>금으로 할 수 있는 것</h3>' +
      '<div class="bal" id="gold-bal"></div>' +
      '<div id="gold-rows" style="display:flex;flex-direction:column;gap:9px"></div>' +
      '<div class="msg" id="gold-msg"></div>' +
      '<button class="close" id="gold-close">닫기</button></div>';
    layer().appendChild(d);
    d.querySelector('#gold-close').onclick = () => d.classList.remove('show');
    d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
  }

  function say(t){ const m = document.getElementById('gold-msg'); if (m) m.textContent = t; }

  function buy(id, price){
    if (!spend(price)){ say('금이 모자란다.'); return; }
    if (id === 'scan'){
      const n = scanSpots();
      say(n ? `이 구역에 아직 ${n}곳이 남아 있다.` : '이 구역에는 남은 것이 없다.');
      document.getElementById('gold-ov').classList.remove('show');
    } else if (id === 'shield'){
      st.shield++; save(st); say('콤보를 한 번 지켜 준다.');
    }
    open();
  }

  /* ---------------- 유물 탐지 ----------------
     ZONES·World는 챕터가 const로 선언한다 — window.X로는 안 잡히므로
     typeof로 확인한다(이 프로젝트에서 여섯 번 걸린 함정이다). */
  function scanSpots(){
    if (typeof ZONES === 'undefined' || typeof World === 'undefined') return 0;
    const z = ZONES[World.zone];
    if (!z || !z.spots) return 0;
    const left = z.spots.filter(sp => !(window.Items && Items.has(sp.item)));
    if (!left.length) return 0;
    const L = layer();
    left.forEach(sp => {
      const d = document.createElement('div');
      d.className = 'gold-float';
      d.textContent = '◈';
      d.style.cssText += 'font-size:22px;animation:none;opacity:.95;';
      d.dataset.scanX = sp.x; d.dataset.scanY = sp.y;
      L.appendChild(d);
      setTimeout(() => d.remove(), 4200);
      const tick = () => {
        if (!d.isConnected) return;
        // 지도 좌표 → 화면 좌표. 챕터가 쓰는 카메라 값을 그대로 읽는다.
        const cv = document.getElementById('game');
        if (cv && typeof World !== 'undefined'){
          const r = cv.getBoundingClientRect(), lb = L.getBoundingClientRect();
          const sx = r.width / (typeof BG_W !== 'undefined' ? BG_W : 1376);
          const sy = r.height / (typeof BG_H !== 'undefined' ? BG_H : 768);
          d.style.left = (r.left - lb.left + sp.x * sx - 8) + 'px';
          d.style.top = (r.top - lb.top + sp.y * sy - 22) + 'px';
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
    return left.length;
  }


  /* ---------------- 콤보 지키기 ---------------- */
  function useShield(){
    if (st.shield <= 0) return false;
    st.shield--; save(st);
    return true;
  }
  /* 상자나 광고로 방패를 받을 때 쓴다 */
  function addShield(n){ st.shield += (n || 1); save(st); return st.shield; }

  /* ---------------- 이미 있는 함수에 붙는다 ---------------- */
  function wire(){
    if (window.Juice && !Juice._goldWired){
      const oc = Juice.correct;
      Juice.correct = function(firstTry){
        oc.apply(this, arguments);
        if (firstTry) earn(2, '정답');
      };
      Juice._goldWired = true;
    }
    if (window.Items && !Items._goldWired){
      const og = Items.give;
      Items.give = function(id){
        const had = Items.has(id);
        const r = og.apply(this, arguments);
        if (!had && Items.has(id)) earn(8, '유물');
        return r;
      };
      Items._goldWired = true;
    }
    if (window.Badges && !Badges._goldWired){
      const oe = Badges.earn;
      Badges.earn = function(id){
        const had = Badges.has(id);
        const r = oe.apply(this, arguments);
        if (!had && String(id).indexOf('ch_complete_') === 0) earn(25, '챕터 완주');
        return r;
      };
      Badges._goldWired = true;
    }
    if (window.Boss && !Boss._goldWired){
      const os = Boss.start;
      Boss.start = function(opt){
        const o = Object.assign({}, opt);
        const ow = o.onWin;
        o.onWin = function(){ earn(30, '보스'); if (ow) return ow.apply(this, arguments); };
        return os.call(this, o);
      };
      Boss._goldWired = true;
    }
  }

  function init(){ mount(); wire(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { get, earn, spend, open, mount, useShield, addShield, scanSpots,
           get shields(){ return st.shield; } };
})();
