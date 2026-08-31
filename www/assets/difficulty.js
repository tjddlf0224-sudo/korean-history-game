/* ============ 난이도 — 2지선다에서 4지선다로 ============

   왜 필요한가
   - 이 게임 문항은 전부 2지선다다. **찍어도 절반이 맞는다.** 밑바탕이 동전
     던지기면 콤보를 아무리 키워도 맞힌 것이 실력인지 운인지 알 수 없다.
   - 그렇다고 처음부터 4지선다로 두면 아직 모르는 사람에게는 너무 어렵다.
     그래서 **잘하기 시작하면 올려 준다.**

   올리는 규칙
   - 최근 30문항의 **첫 시도 정답률**이 80% 이상이면 승급을 제안한다.
   - 제안은 축하 장면과 함께 뜨고, **고르는 것은 사용자다** — "올린다"와
     "지금이 좋다". 거절하면 20문항 뒤에 다시 묻는다(매번 물으면 성가시다).
   - 언제든 되돌릴 수 있다(같은 창에서 내리기).

   4지선다는 어떻게 만드나 — 새 문항을 쓰지 않는다
   - 문항마다 오답 선택지를 두 개 더 쓰는 것은 636문항 × 2 = 감당이 안 된다.
   - 대신 **같은 챕터의 다른 문항이 쓰는 오답**을 빌려 온다. 그것들은 이미
     "그럴듯한 오답"으로 골라 둔 말이라, 같은 시대·같은 결의 낱말이 나온다.
   - 정답과 같은 말, 이미 쓰인 말은 걸러 낸다. 두 개를 못 채우면 그 문항은
     그냥 2지선다로 둔다(억지로 채우면 말이 안 되는 보기가 섞인다).

   붙이는 법
     <script src="assets/difficulty.js"></script>   (juice.js 뒤)
*/
window.Difficulty = (function(){
  const KEY = 'khg_diff';
  const WINDOW = 30;        // 정답률을 재는 최근 문항 수
  const UP_AT = 0.8;        // 이 비율을 넘으면 제안
  const COOLDOWN = 20;      // 거절한 뒤 다시 묻기까지

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === 'object') return v;
    } catch(e){}
    return { level: 2, hist: [], askedAt: -999, n: 0 };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  let st = load();

  function level(){ return st.level; }
  function rate(){
    if (!st.hist.length) return 0;
    return st.hist.reduce((a, b) => a + b, 0) / st.hist.length;
  }

  function record(ok){
    st.n++;
    st.hist.push(ok ? 1 : 0);
    if (st.hist.length > WINDOW) st.hist.shift();
    save(st);
    maybeOffer();
  }

  function maybeOffer(){
    if (st.level !== 2) return;
    if (st.hist.length < WINDOW) return;
    if (st.n - st.askedAt < COOLDOWN) return;
    if (rate() < UP_AT) return;
    st.askedAt = st.n; save(st);
    offer();
  }

  /* ---------------- 보기 늘리기 ----------------
     원본 data를 절대 고치지 않는다 — SRS·중복검사·도감이 같은 객체를 보고
     있어서, 여기서 손대면 그쪽이 어긋난다. 사본을 만들어 넘긴다. */
  function pool(){
    // 챕터의 NPC_DATA에서 모든 보기를 긁는다. const로 선언돼 있어 window로는
    // 안 잡히므로 typeof로 확인한다(이 프로젝트에서 여러 번 걸린 함정이다).
    const out = [];
    try {
      if (typeof NPC_DATA === 'undefined') return out;
      for (const k in NPC_DATA){
        const d = NPC_DATA[k];
        const qs = (d && d.quizSeq) || [];
        for (const q of qs) if (q && q.opts) out.push(...q.opts);
        // 대사 안에 박힌 문항도 있다(0화 같은 손으로 만든 챕터)
        for (const b of ((d && d.beats) || [])) if (b && b.quiz && b.quiz.opts) out.push(...b.quiz.opts);
      }
    } catch(e){}
    return out;
  }

  let POOL = null;
  function expand(data){
    if (st.level < 4 || !data || !data.opts || data.opts.length !== 2) return data;
    if (POOL === null) POOL = pool();
    const answer = data.opts[data.answer];
    const used = new Set(data.opts.map(s => String(s).trim()));
    const cand = [];
    for (const s of POOL){
      const t = String(s).trim();
      if (used.has(t)) continue;
      used.add(t);
      cand.push(t);
    }
    if (cand.length < 2) return data;             // 못 채우면 그냥 둔다
    // 길이가 비슷한 것을 고른다 — 유독 긴 보기 하나만 있으면 그게 정답처럼 보인다
    const len = answer.length;
    cand.sort((a, b) => Math.abs(a.length - len) - Math.abs(b.length - len));
    const near = cand.slice(0, Math.max(6, Math.min(12, cand.length)));
    for (let i = near.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [near[i], near[j]] = [near[j], near[i]];
    }
    const opts = data.opts.concat(near.slice(0, 2));
    return Object.assign({}, data, { opts, answer: data.answer });
  }

  /* ---------------- 승급 제안 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #df-ov { position:absolute; inset:0; z-index:96; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.92); font-family:"Gowun Batang",serif; }
    #df-ov.show { display:flex; }
    #df-ov .panel { width:min(92%,420px); background:#1a140c; border:1px solid #c9a24a;
      border-radius:16px; padding:24px 20px; display:flex; flex-direction:column; gap:12px;
      text-align:center; }
    #df-ov .tag { font-size:12px; letter-spacing:.26em; color:#a89676; }
    #df-ov .big { font-size:23px; font-weight:700; color:#f0c96b;
      text-shadow:0 0 24px rgba(240,201,107,.5); }
    #df-ov .rate { font-size:34px; font-weight:700; color:#f5ecd8;
      font-variant-numeric:tabular-nums; line-height:1.2; }
    #df-ov .ln { font-size:14px; color:#e6dbc2; line-height:1.85; }
    #df-ov .sm { font-size:12px; color:#8d7f66; line-height:1.7; }
    #df-ov button { padding:13px; border-radius:11px; font-family:inherit; font-size:15px;
      cursor:pointer; border:1px solid #4a3c26; background:#2a2013; color:#f5ecd8; }
    #df-ov button.hi { background:#3a2c1a; border-color:#c9a24a; color:#f0c96b; font-weight:700; }
    /* 축하 반짝임 — 애니메이션이 안 도는 환경도 있어서, 없어도 내용은 다 보인다 */
    #df-ov .spark { font-size:30px; letter-spacing:.3em; color:#f0c96b; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function offer(){
    css();
    let d = document.getElementById('df-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'df-ov';
      layer().appendChild(d);
    }
    const pct = Math.round(rate() * 100);
    d.innerHTML = '<div class="panel">' +
      '<div class="spark">✦ ✦ ✦</div>' +
      '<div class="tag">실 력 이  올 랐 다</div>' +
      `<div class="rate">${pct}%</div>` +
      `<div class="sm">최근 ${WINDOW}문항 첫 시도 정답률</div>` +
      '<div class="big">보기를 넷으로 늘려 볼까?</div>' +
      '<div class="ln">둘 중 하나를 고르는 것은 이제 쉬울 것이다.<br>' +
      '넷 중 하나를 고르면 실제 시험과 더 가까워진다.</div>' +
      '<button class="hi" id="df-up">넷으로 올린다</button>' +
      '<button id="df-stay">지금이 좋다</button>' +
      '<div class="sm">언제든 되돌릴 수 있다.</div></div>';
    d.classList.add('show');
    d.querySelector('#df-up').onclick = () => {
      st.level = 4; save(st); d.classList.remove('show'); done();
    };
    d.querySelector('#df-stay').onclick = () => { d.classList.remove('show'); };
    if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
    if (navigator.vibrate) navigator.vibrate([40, 60, 90]);
  }

  function done(){
    css();
    const d = document.getElementById('df-ov');
    d.innerHTML = '<div class="panel">' +
      '<div class="spark">✦</div>' +
      '<div class="big">이제 넷 중에 고른다</div>' +
      '<div class="ln">어려워지면 언제든 다시 둘로 내릴 수 있다.<br>' +
      '메뉴에서 <b>난이도</b>를 누르면 된다.</div>' +
      '<button class="hi" id="df-ok">알겠다</button></div>';
    d.classList.add('show');
    d.querySelector('#df-ok').onclick = () => d.classList.remove('show');
  }

  /* 사용자가 직접 여는 창 (메뉴에서) */
  function open(){
    css();
    let d = document.getElementById('df-ov');
    if (!d){ d = document.createElement('div'); d.id = 'df-ov'; layer().appendChild(d); }
    const pct = Math.round(rate() * 100);
    d.innerHTML = '<div class="panel">' +
      '<div class="tag">난 이 도</div>' +
      `<div class="big">지금은 ${st.level}지선다</div>` +
      (st.hist.length ? `<div class="sm">최근 ${st.hist.length}문항 첫 시도 정답률 ${pct}%</div>` : '') +
      (st.level === 2
        ? '<button class="hi" id="df-up">넷으로 올린다</button>'
        : '<button id="df-down">둘로 내린다</button>') +
      '<button id="df-x">닫기</button></div>';
    d.classList.add('show');
    const up = d.querySelector('#df-up'), dn = d.querySelector('#df-down');
    if (up) up.onclick = () => { st.level = 4; save(st); d.classList.remove('show'); done(); };
    if (dn) dn.onclick = () => { st.level = 2; save(st); d.classList.remove('show'); };
    d.querySelector('#df-x').onclick = () => d.classList.remove('show');
  }

  /* ---------------- 이미 있는 것에 붙는다 ---------------- */
  function wire(){
    // 정답률은 Juice가 이미 "첫 시도인지"를 알고 있으므로 거기서 받는다.
    if (window.Juice && !Juice._diffWired){
      const oc = Juice.correct, ow = Juice.wrong;
      Juice.correct = function(firstTry){ oc.apply(this, arguments); record(!!firstTry); };
      Juice.wrong = function(){ ow.apply(this, arguments); record(false); };
      Juice._diffWired = true;
    }
    // 보기 늘리기는 퀴즈가 열리는 자리에서. Quiz는 챕터가 const로 선언한다.
    try {
      if (typeof Quiz !== 'undefined' && Quiz && !Quiz._diffWired){
        const oo = Quiz._openOne;
        if (typeof oo === 'function'){
          Quiz._openOne = function(data, onDone){ return oo.call(this, expand(data), onDone); };
          Quiz._diffWired = true;
        }
      }
    } catch(e){}
  }

  function init(){ wire(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { level, rate, record, expand, open, offer, wire,
           get answered(){ return st.n; } };
})();
