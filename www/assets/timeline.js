/* ============ 연표 맞추기 (전 챕터 공용) ============

   왜 만들었나
   - 챕터 퀴즈 623문항이 **전부 2지선다**다. 내용이 아무리 좋아도 형식이
     하나뿐이면 단조롭다는 진단을 받았다.
   - 한국사에서 가장 흔하게 묻는 것이 "순서"다. 기출에도 사건 배열 문제가
     꾸준히 나온다. 2지선다로는 절대 다룰 수 없는 형식이다.

   데이터를 새로 쓰지 않는다
   - 이미 넣어 둔 속보(newsflash.js)가 그 챕터의 사건을 연대순으로 갖고 있다.
     그걸 섞어서 다시 세우게 하면 된다. 새 문항을 한 줄도 안 써도 된다.
   - 그래서 속보를 등록한 순서가 곧 정답이다. 등록할 때 연대순으로 넣어야 한다.

   조작
   - 드래그는 손이 작은 화면에서 어렵다. **이른 것부터 차례로 누른다**.
     틀리면 그 자리에서 알려 주고 다시 고르게 한다 — 순서를 외우는 게 아니라
     맞춰 가는 과정에서 배우게 하려는 것.

   쓰는 법
     <script src="assets/timeline.js"></script>   (newsflash.js 뒤)
     Timeline.play(onDone)      // 이 챕터의 속보로 문제를 만든다
*/
window.Timeline = (function(){

  const MIN = 3, MAX = 4;      // 너무 많으면 화면에 안 들어가고 지루하다

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    #tl-ov { position:absolute; inset:0; z-index:93; display:none; flex-direction:column;
      align-items:center; justify-content:center; background:rgba(8,6,3,.9);
      font-family:"Gowun Batang",serif; padding:4% 6%; }
    #tl-ov.show { display:flex; }
    #tl-ov .ttl { font-size:12px; letter-spacing:.26em; color:#a89676; flex:none; }
    #tl-ov .ask { font-size:clamp(15px,2.8vw,19px); font-weight:700; color:#f0c96b;
      margin:6px 0 14px; text-align:center; text-wrap:balance; flex:none; }

    /* 고른 것들이 쌓이는 줄 */
    #tl-ov .track { display:flex; align-items:center; gap:6px; flex-wrap:wrap;
      justify-content:center; margin-bottom:12px; min-height:26px; flex:none; }
    #tl-ov .track .p { font-size:12px; color:#e8dcc2; background:#3a2c1a;
      border:1px solid #c9a24a; border-radius:99px; padding:3px 11px; }
    #tl-ov .track .arw { color:#6a5a3c; font-size:12px; }

    #tl-ov .cards { display:flex; flex-direction:column; gap:8px; width:min(100%,560px);
      overflow-y:auto; flex:1 1 auto; }
    #tl-ov .card { display:flex; gap:11px; align-items:flex-start; text-align:left;
      background:#241c12; border:1px solid #4a3c26; border-radius:12px; padding:11px 13px;
      color:#f5ecd8; font-family:inherit; cursor:pointer; transition:border-color .15s, opacity .2s; }
    #tl-ov .card:hover { border-color:#c9a24a; }
    #tl-ov .card .ic { flex:none; width:24px; height:24px; }
    #tl-ov .card .hl { font-size:14px; font-weight:700; line-height:1.5; }
    #tl-ov .card .sb { font-size:11.5px; color:#b8a888; line-height:1.55; margin-top:2px; }
    #tl-ov .card.done { opacity:.28; pointer-events:none; }
    #tl-ov .card.wrong { animation:tl-shake .4s; border-color:#c9452f; }
    @keyframes tl-shake { 10%,90%{transform:translateX(-3px)} 30%,70%{transform:translateX(5px)}
      50%{transform:translateX(-5px)} }
    #tl-ov .card .when { font-size:11px; color:#c9a24a; margin-top:3px; display:none; }
    #tl-ov .card.reveal .when { display:block; }

    #tl-ov .msg { font-size:13px; color:#b8a888; margin-top:12px; min-height:20px;
      text-align:center; flex:none; }
    #tl-ov .msg b { color:#f0c96b; }
    @media (prefers-reduced-motion:reduce){ #tl-ov .card.wrong { animation:none; } }`;
    document.head.appendChild(st);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function mount(){
    css();
    if (document.getElementById('tl-ov')) return;
    const d = document.createElement('div');
    d.id = 'tl-ov';
    d.innerHTML = '<div class="ttl">연 표 맞 추 기</div>' +
      '<div class="ask">먼저 일어난 일부터 차례로 짚어 보게.</div>' +
      '<div class="track" id="tl-track"></div>' +
      '<div class="cards" id="tl-cards"></div>' +
      '<div class="msg" id="tl-msg"></div>';
    layer().appendChild(d);
  }

  /* 속보 표에서 연달아 이어지는 사건을 뽑는다. 등록 순서가 곧 연대순이다. */
  function pick(){
    const t = (window.News && News._table && News._table()) || {};
    const keys = Object.keys(t);
    if (keys.length < MIN) return null;
    const n = Math.min(MAX, keys.length);
    // 앞뒤로 이어지는 구간을 무작위로 잘라 낸다 — 매번 같은 문제가 되지 않게
    const start = Math.floor(Math.random() * (keys.length - n + 1));
    return keys.slice(start, start + n).map(k => t[k]);
  }

  function shuffle(a){
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  /* onDone(cleared) — 다 맞히면 true. 문제를 만들 수 없으면 곧장 true. */
  function play(onDone){
    const seq = pick();
    if (!seq){ onDone && onDone(true); return false; }
    mount();

    const order = seq.slice();                 // 정답 순서
    const cards = shuffle(seq);
    let idx = 0, missed = false;

    const ov = document.getElementById('tl-ov');
    const track = document.getElementById('tl-track');
    const box = document.getElementById('tl-cards');
    const msg = document.getElementById('tl-msg');
    track.innerHTML = ''; msg.textContent = '';

    box.innerHTML = cards.map((c, i) =>
      `<button class="card" data-i="${i}"><span class="ic">` +
      (window.Icons ? Icons.svg(c.icon, 24) : '') + '</span>' +
      `<span><span class="hl">${c.headline}</span>` +
      `<span class="when">${c.when || ''}</span></span></button>`).join('');

    box.querySelectorAll('.card').forEach(btn => {
      btn.onclick = () => {
        const c = cards[+btn.dataset.i];
        if (c === order[idx]){
          btn.classList.add('done', 'reveal');
          if (idx) track.insertAdjacentHTML('beforeend', '<span class="arw">→</span>');
          track.insertAdjacentHTML('beforeend',
            `<span class="p">${(c.when || '').split('·')[0].trim()}</span>`);
          idx++;
          if (window.Juice) Juice.correct(!missed);
          if (idx >= order.length){
            msg.innerHTML = missed ? '<b>순서를 맞췄다.</b>' : '<b>한 번에 맞췄다.</b>';
            if (window.Rank) Rank.addXp(missed ? 10 : 25, '연표 맞추기');
            setTimeout(() => { ov.classList.remove('show'); onDone && onDone(true); }, 1400);
          } else {
            msg.textContent = '';
          }
        } else {
          missed = true;
          btn.classList.remove('wrong'); void btn.offsetWidth; btn.classList.add('wrong');
          msg.innerHTML = '그보다 <b>먼저</b> 일어난 일이 남아 있네.';
          if (window.Juice) Juice.wrong();
        }
      };
    });

    ov.classList.add('show');
    return true;
  }

  return { play, mount };
})();
