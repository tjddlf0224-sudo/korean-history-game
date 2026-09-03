/* ============ 대화창 도해 (전 챕터 공용) ============

   왜 만들었나
   - 대사 1148개 중 **92%가 글자뿐**이었다. 도표는 4%, 사진은 4.4%.
     열 챕터는 시각 자료가 아예 하나도 없었다. 읽을 것만 계속 나오면
     학습자는 읽기를 그만둔다 — 문제를 틀려서가 아니라 안 읽어서 못 푼다.
   - 그런데 도해를 그리는 drawChart()가 **36개 챕터에 복사**돼 있었고
     판본이 셋으로 갈려 있었다(열한 챕터는 'kings'를 못 그렸다). 종류를
     하나 더하려면 서른여섯 곳을 고쳐야 했다. 그래서 여기로 모은다.

   두 가지 방법으로 붙인다
     1) chart: { type:'bar', ... }    — 그때그때 데이터를 넘긴다(기존 방식)
     2) visual: 'sinseokgi_tools'     — 미리 만들어 둔 도해를 이름으로 부른다
        같은 그림을 여러 챕터가 함께 쓸 때 쓴다. VISUALS에 등록한다.

   이 게임이 가진 것을 쓴다
   - 초상 300장, 유물 그림 65장, 장면 119장이 이미 있다. 새로 그리지 말고
     'faces'·'relic'으로 불러 쓴다. 없는 그림을 만들려 들면 일이 끝나지 않는다.

   붙이는 법
     <script src="assets/chart.js"></script>   (챕터 본문 <script> 앞)
*/
window.Chart = (function(){

  /* 챕터가 const로 선언한 ART_V(캐시 무효화 꼬리표)를 쓴다.
     window.ART_V로는 안 잡힌다 — autowalk.js가 World를 부르는 것과 같다. */
  function v(){ try { return typeof ART_V !== 'undefined' ? ART_V : ''; } catch(e){ return ''; } }
  function esc(s){ return String(s == null ? '' : s); }

  /* 한반도 윤곽 — assets/map/data/korea_outline.geojson 의 실제 좌표를
     더글러스-포이커로 성기게 줄인 것(419점 → 1.5KB). 가로 100 × 세로 150 눈금. */
  const KOREA_PATH = 'M37.6,87.1 38.1,85 44.1,79.2 57.7,78.8 59.6,78 62.5,73.8 66,80.9 76.2,95.1 77.4,98.5 78.2,103.5 77,110.2 77.2,114.4 78,115.2 79.6,114.5 79.5,116.1 77.4,123.2 74.5,128.2 71.1,129.4 64.4,129.5 63.1,130.8 63.5,133.1 58.5,132.1 57.7,130.7 53.1,131.8 52,132.8 53.5,134.5 53.1,135.5 51.9,135.9 50.3,133.6 48.6,133.8 48.4,135.1 49.7,137 47.5,139.5 45.3,138.2 46.6,136.4 46.4,134.9 41.4,139.9 39.4,138.8 36.2,141.9 35.5,139 32.3,136.2 32.9,135.5 36.1,135.8 35.3,134.9 37,133.8 34.6,133.8 32.7,128.6 35.6,123.1 37.3,122 35.5,121.5 35.5,120.8 38.8,118.9 39.3,117.3 37.8,116.5 38.5,115 36.3,112.6 36.5,108.5 35.5,104.3 34.1,105 31.2,104.3 30.9,103.1 31.7,101.5 35.5,99.4 39.8,100.3 41,102.2 42.3,101 39.2,96.4 39.9,94.8 37.9,92.4 38,90.8 36.6,88.2 37.6,87.1ZM62.5,73.8 59.6,78 57.7,78.8 44.1,79.2 38.1,85 37.6,87.1 33.9,85.6 30.2,87.7 29.3,85.7 27.7,85.7 25.3,83.9 22.6,86.6 19.4,88 18.7,86.2 14.1,84.8 17.8,82.8 9.9,81.6 12.5,80 12.6,78.3 15.2,74.9 18.7,73.2 22.2,72.8 16.7,71 16.5,69.9 20.1,63.3 19.4,59.6 15.7,58.6 11.1,55.9 10.5,57.6 9.1,58.2 8,55.4 5,53.6 5.5,50.5 12.7,44.8 14.2,44.8 14.7,43.8 20.2,41.7 24.7,38.4 28.4,37.8 35.6,30.7 37.2,26.2 41.5,24 43,24.6 45.4,27.9 52.7,29.4 57.3,29.2 59.3,30.2 61.3,26.7 57.9,22.7 57.8,20.7 70.3,19.9 74.2,17.1 75.9,14 77.5,13.6 78.9,14.5 81.4,13.5 83.7,5.3 86.9,5.1 89.1,6.4 89.2,8.8 92.8,11.5 95.5,15.7 92.3,15.8 89.1,17.6 82.2,25.1 81.2,26.9 82.4,31.5 81.6,38.6 76.3,40.6 73,44.4 67.2,47.1 64.4,50 61.5,51.5 56.7,52.2 51,55.5 50.4,56.9 50.7,60.6 50.3,61.9 48.9,62 48.5,64.6 54.1,66.6 62.5,73.8Z';

  /* ---------------- 스타일 ----------------
     새로 더한 종류만 여기서 칠한다. 기존 다섯 종(bar·flow·tree·kings·표)은
     챕터마다 이미 CSS가 있어서, 여기서 또 칠하면 미묘하게 달라진다. */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    /* --- 제목 --- 무엇을 보여 주는 그림인지 먼저 밝힌다.
       제목 없이 '짐승 떼를 따라간다'만 뜨면 뜬금없다(실제 신고). */
    .ch-title { padding:7px 12px 0; font-family:"Gowun Batang",serif; font-size:10.5px;
      letter-spacing:.26em; color:#a89676; display:flex; align-items:center; gap:8px; }
    .ch-title::after { content:''; flex:1; height:1px;
      background:linear-gradient(90deg,rgba(240,201,107,.35),transparent); }

    /* --- 연표 --- 가로로 흐르는 시간 위에 사건을 얹는다 */
    .ch-tl { position:relative; display:flex; padding:14px 8px 8px; gap:2px; }
    .ch-tl::before { content:''; position:absolute; left:12px; right:12px; top:22px;
      height:2px; background:rgba(255,255,255,.22); }
    .ch-tl .m { flex:1 1 0; min-width:0; position:relative; text-align:center; padding-top:14px; }
    .ch-tl .m::before { content:''; position:absolute; left:50%; top:2px; width:9px; height:9px;
      margin-left:-4.5px; border-radius:50%; background:#6f6250;
      border:2px solid rgba(255,255,255,.3); }
    .ch-tl .m.on::before { background:#f0c96b; border-color:#fff3d4;
      box-shadow:0 0 10px rgba(240,201,107,.75); }
    .ch-tl .y { font-size:10px; color:#a89676; font-variant-numeric:tabular-nums; }
    .ch-tl .t { font-size:11.5px; color:#e6dbc2; line-height:1.35; margin-top:1px; }
    .ch-tl .m.on .y { color:#f0c96b; }
    .ch-tl .m.on .t { color:#fff3d4; font-weight:700; }

    /* --- 비교 --- 한능검이 가장 자주 묻는 꼴이다. 나란히 놓아야 차이가 보인다 */
    .ch-cmp { display:flex; gap:6px; padding:8px; align-items:stretch; }
    .ch-cmp .col { flex:1 1 0; min-width:0; border-radius:7px; padding:7px 8px;
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.16); }
    .ch-cmp .col.hi { background:rgba(240,201,107,.14); border-color:rgba(240,201,107,.5); }
    .ch-cmp .h { font-size:12px; font-weight:700; color:#f0c96b; text-align:center;
      padding-bottom:4px; margin-bottom:5px; border-bottom:1px solid rgba(255,255,255,.16); }
    .ch-cmp li { font-size:11.5px; color:#e6dbc2; line-height:1.6; list-style:none;
      padding-left:9px; position:relative; }
    .ch-cmp li::before { content:'·'; position:absolute; left:1px; color:#a89676; }
    .ch-cmp ul { margin:0; padding:0; }

    /* --- 유물·인물 --- 이미 있는 그림 365장을 불러 쓴다 */
    .ch-cards { display:flex; gap:6px; padding:8px; flex-wrap:wrap; justify-content:center; }
    .ch-cards .c { flex:1 1 0; min-width:64px; max-width:110px; text-align:center; }
    .ch-cards .c img { width:100%; aspect-ratio:1/1; object-fit:contain; display:block;
      border-radius:7px; background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.14); }
    .ch-cards.face .c img { object-fit:cover; }
    .ch-cards .n { font-size:11.5px; color:#f0c96b; margin-top:4px; line-height:1.3; }
    .ch-cards .s { font-size:10.5px; color:#a89676; line-height:1.4; }
    .ch-cards .c.dim img { filter:grayscale(1) brightness(.5); }

    /* --- 사료 --- 옛 글을 그대로 보여 준다. 한능검은 사료를 자주 낸다 */
    .ch-quote { padding:11px 13px; }
    .ch-quote .q { font-size:12.5px; line-height:1.85; color:#efe4cd;
      border-left:3px solid rgba(240,201,107,.6); padding-left:11px; }
    .ch-quote .q b { color:#f0c96b; }
    .ch-quote .from { font-size:10.5px; color:#a89676; text-align:right; margin-top:6px; }

    /* --- 숫자 --- 말로 "많다"고 하는 것보다 숫자 하나가 세다 */
    .ch-stat { display:flex; gap:8px; padding:10px 8px; justify-content:center; }
    .ch-stat .s { flex:1 1 0; text-align:center; }
    .ch-stat .v { font-size:21px; font-weight:700; color:#f0c96b; line-height:1.1;
      font-variant-numeric:tabular-nums; }
    .ch-stat .l { font-size:10.5px; color:#a89676; margin-top:3px; line-height:1.35; }

    /* --- 신분 구조 --- 위가 좁고 아래가 넓다는 것 자체가 내용이다 */
    .ch-pyr { padding:9px 8px; display:flex; flex-direction:column; align-items:center; gap:3px; }
    .ch-pyr .t { border-radius:5px; padding:4px 10px; text-align:center; font-size:11.5px;
      color:#e6dbc2; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.16); }
    .ch-pyr .t.hi { background:rgba(240,201,107,.18); border-color:rgba(240,201,107,.55);
      color:#fff3d4; font-weight:700; }
    .ch-pyr .t s { display:block; font-size:10px; color:#a89676; text-decoration:none; }

    /* --- 맞섬 --- 누가 누구와 붙었는지 한 줄로 */
    .ch-vs { display:flex; align-items:center; gap:8px; padding:10px 8px; }
    .ch-vs .side { flex:1 1 0; text-align:center; border-radius:7px; padding:7px 6px;
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.16); }
    .ch-vs .side .n { font-size:12.5px; font-weight:700; color:#f0c96b; }
    .ch-vs .side .s { font-size:10.5px; color:#a89676; line-height:1.45; margin-top:2px; }
    .ch-vs .x { flex:none; font-size:12px; color:#d98a7a; font-weight:700; letter-spacing:.1em; }
    .ch-vs .side.win { border-color:rgba(240,201,107,.55); background:rgba(240,201,107,.14); }

    /* --- 지도 --- 역사에서 '어디'는 '무엇'만큼 중요하다.
       한반도 윤곽은 실제 좌표(map/data/korea_outline.geojson)를 성기게 줄여 넣었다. */
    .ch-map { display:flex; align-items:center; gap:10px; padding:8px 10px; }
    .ch-map svg { flex:none; width:94px; height:auto; }
    /* 범례가 없으면 지도만 있는 것이니 가운데로 크게 — 옆이 비면 허전하다 */
    .ch-map.solo { justify-content:center; }
    .ch-map.solo svg { width:150px; }
    .ch-map .land { fill:rgba(240,201,107,.13); stroke:rgba(240,201,107,.5); stroke-width:1.1;
      stroke-linejoin:round; }
    .ch-map .pin { fill:#6f6250; stroke:rgba(255,255,255,.35); stroke-width:1; }
    .ch-map .pin.on { fill:#f0c96b; stroke:#fff3d4; }
    .ch-map .pn { font-size:6.6px; fill:#cdbfa4; font-family:"Gowun Batang",serif; }
    .ch-map .pn.on { fill:#fff3d4; font-weight:700; }
    .ch-map .leg { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
    .ch-map .leg .r { font-size:11px; color:#cdbfa4; line-height:1.4; display:flex; gap:6px; }
    .ch-map .leg .r b { color:#f0c96b; font-weight:700; flex:none; }
    .ch-map .leg .r.on { color:#fff3d4; }

    /* --- 차례 --- 만드는 순서·거치는 단계
       처음엔 금색 번호 동그라미로 그렸다가 물렸다. 이 게임에서 금색으로
       채운 동그라미는 '누르는 것'이고, 번호 붙은 짧은 항목 셋은 영락없이
       문제 보기다 — 실제로 눌러 보려 했다는 신고를 받았다.
       그래서 **세로선으로 잇고** 번호는 작은 글자로 낮춘다. 누를 것이
       아니라 '흐르는 것'으로 보이게 한다. */
    .ch-steps { padding:9px 12px; display:flex; flex-direction:column; }
    .ch-steps .st { position:relative; display:flex; gap:10px; align-items:flex-start;
      font-size:11.5px; padding:3px 0 8px; }
    .ch-steps .st:last-child { padding-bottom:1px; }
    /* 마디를 잇는 세로선 — 마지막 마디 아래로는 긋지 않는다 */
    .ch-steps .st::before { content:''; position:absolute; left:3.2px; top:12px; bottom:-1px;
      width:1.5px; border-radius:1px; background:rgba(240,201,107,.55); }
    .ch-steps .st:last-child::before { display:none; }
    .ch-steps .no { flex:none; width:8px; height:8px; margin-top:4.5px; border-radius:50%;
      background:#e0bd76; box-shadow:0 0 0 2.5px rgba(240,201,107,.16); }
    .ch-steps .tx { flex:1; color:#e6dbc2; line-height:1.5; }
    .ch-steps .tx b { color:#f0c96b; }
    .ch-steps .tx s { color:#a89676; text-decoration:none; }

    /* --- 그림표 --- 여러 나라·여러 항목을 한눈에. 비교보다 촘촘하다 */
    .ch-grid { padding:8px; }
    .ch-grid table { width:100%; border-collapse:collapse; font-size:11px; }
    .ch-grid th { color:#f0c96b; font-weight:700; padding:4px 5px; text-align:left;
      border-bottom:1px solid rgba(255,255,255,.18); white-space:nowrap; }
    .ch-grid td { color:#e6dbc2; padding:4px 5px; line-height:1.45;
      border-bottom:1px solid rgba(255,255,255,.08); }
    .ch-grid tr.hi td, .ch-grid tr.hi th { background:rgba(240,201,107,.12); color:#fff3d4; }

    /* --- 짚기 --- 그림 한 장에 이름표를 달아 어디가 무엇인지 짚는다 */
    .ch-call { padding:8px; }
    .ch-call .im { position:relative; width:100%; border-radius:8px; overflow:hidden;
      background:rgba(0,0,0,.25); }
    .ch-call .im img { width:100%; display:block; }
    .ch-call .tag { position:absolute; transform:translate(-50%,-50%); font-size:10px;
      padding:2px 7px; border-radius:999px; white-space:nowrap;
      background:rgba(26,20,12,.92); border:1px solid #c9a24a; color:#f0c96b; }`;
    document.head.appendChild(s);
  }

  /* ---------------- 새로 더한 종류 ---------------- */
  const NEW = {
    /* 연표 — { marks:[{y:'BC 2333', t:'고조선 세움', on:true}, ...] } */
    timeline(c){
      return '<div class="ch-tl">' + (c.marks || []).map(m =>
        `<div class="m${m.on ? ' on' : ''}">` +
        `<div class="y">${esc(m.y)}</div><div class="t">${esc(m.t)}</div></div>`).join('') + '</div>';
    },

    /* 비교 — { cols:[{h:'구석기', hi:true, items:['뗀석기','이동']}, ...] } */
    compare(c){
      return '<div class="ch-cmp">' + (c.cols || []).map(col =>
        `<div class="col${col.hi ? ' hi' : ''}"><div class="h">${esc(col.h)}</div><ul>` +
        (col.items || []).map(i => `<li>${esc(i)}</li>`).join('') + '</ul></div>').join('') + '</div>';
    },

    /* 유물 — { items:[{img:'bandal', n:'반달 돌칼', s:'벼 이삭을 자른다'}] }
       img는 assets/items/<img>.png 를 가리킨다. dim:true면 흐리게(아직 못 본 것). */
    relic(c){
      return '<div class="ch-cards">' + (c.items || []).map(i =>
        `<div class="c${i.dim ? ' dim' : ''}">` +
        `<img src="assets/items/${esc(i.img)}.png${v()}" alt="">` +
        `<div class="n">${esc(i.n)}</div>` +
        (i.s ? `<div class="s">${esc(i.s)}</div>` : '') + '</div>').join('') + '</div>';
    },

    /* 인물 — { people:[{img:'yisunsin', n:'이순신', s:'삼도수군통제사'}] }
       img는 assets/portraits/<img>.png 를 가리킨다. */
    faces(c){
      return '<div class="ch-cards face">' + (c.people || []).map(p =>
        `<div class="c${p.dim ? ' dim' : ''}">` +
        `<img src="assets/portraits/${esc(p.img)}.png${v()}" alt="">` +
        `<div class="n">${esc(p.n)}</div>` +
        (p.s ? `<div class="s">${esc(p.s)}</div>` : '') + '</div>').join('') + '</div>';
    },

    /* 사료 — { text:'...', from:'삼국사기' }. text 안의 <b>는 그대로 살린다. */
    quote(c){
      return '<div class="ch-quote"><div class="q">' + (c.text || '') + '</div>' +
        (c.from ? `<div class="from">— ${esc(c.from)}</div>` : '') + '</div>';
    },

    /* 숫자 — { items:[{v:'8만 장', l:'팔만대장경 경판'}] } */
    stat(c){
      return '<div class="ch-stat">' + (c.items || []).map(i =>
        `<div class="s"><div class="v">${esc(i.v)}</div><div class="l">${esc(i.l)}</div></div>`)
        .join('') + '</div>';
    },

    /* 신분 — { tiers:[{t:'왕', s:'', hi:true}, {t:'귀족'}, ...] } 위에서 아래로.
       칸 너비를 아래로 갈수록 넓혀 삼각형처럼 보이게 한다. */
    pyramid(c){
      const n = (c.tiers || []).length || 1;
      return '<div class="ch-pyr">' + (c.tiers || []).map((t, i) =>
        `<div class="t${t.hi ? ' hi' : ''}" style="width:${Math.round(38 + (i / Math.max(1, n - 1)) * 56)}%">` +
        `${esc(t.t)}${t.s ? `<s>${esc(t.s)}</s>` : ''}</div>`).join('') + '</div>';
    },

    /* 지도 — { pins:[{x:52, y:30, n:'부여', on:true}], legend:[{k:'부여', v:'만주'}] }
       눈금은 가로 100 · 세로 150. 한반도 밖(만주·요동)도 찍을 수 있게 넉넉히 둔다. */
    map(c){
      const pins = (c.pins || []).map(function(p){
        return '<circle class="pin' + (p.on ? ' on' : '') + '" cx="' + p.x + '" cy="' + p.y +
          '" r="' + (p.on ? 3.4 : 2.6) + '"/>' +
          (p.n ? '<text class="pn' + (p.on ? ' on' : '') + '" x="' + (p.x + 4.5) +
                 '" y="' + (p.y + 2.4) + '">' + esc(p.n) + '</text>' : '');
      }).join('');
      const leg = (c.legend || []).map(function(l){
        return '<div class="r' + (l.on ? ' on' : '') + '"><b>' + esc(l.k) + '</b><span>' +
               esc(l.v) + '</span></div>';
      }).join('');
      // 부여·고구려는 한반도 밖(만주)에 있다. north:true면 위쪽을 더 보여 준다.
      const box = c.north ? '-20 -48 140 212' : '-14 -10 128 168';
      return '<div class="ch-map' + (leg ? '' : ' solo') + '">' +
        '<svg viewBox="' + box + '" xmlns="http://www.w3.org/2000/svg">' +
        '<path class="land" d="' + KOREA_PATH + '"/>' + pins + '</svg>' +
        (leg ? '<div class="leg">' + leg + '</div>' : '') + '</div>';
    },

    /* 차례 — { steps:[{t:'거푸집을 빚는다', s:'흙이나 돌로'}] } */
    steps(c){
      return '<div class="ch-steps">' + (c.steps || []).map(function(st){
        return '<div class="st"><i class="no"></i><div class="tx"><b>' + esc(st.t) + '</b>' +
          (st.s ? ' <s>— ' + esc(st.s) + '</s>' : '') + '</div></div>';
      }).join('') + '</div>';
    },

    /* 그림표 — { head:['나라','정치','제천'], rows:[['부여','사출도','영고']], hi:0 } */
    grid(c){
      const head = '<tr>' + (c.head || []).map(function(h){ return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>';
      const rows = (c.rows || []).map(function(r, i){
        return '<tr class="' + (c.hi === i ? 'hi' : '') + '">' + r.map(function(x, j){
          return j === 0 ? '<th>' + esc(x) + '</th>' : '<td>' + esc(x) + '</td>';
        }).join('') + '</tr>';
      }).join('');
      return '<div class="ch-grid"><table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
    },

    /* 짚기 — { img:'assets/scenes/xx.png', tags:[{x:30, y:40, t:'움집'}] } x·y는 % */
    callout(c){
      return '<div class="ch-call"><div class="im"><img src="' + esc(c.img) + v() + '" alt="">' +
        (c.tags || []).map(function(t){
          return '<span class="tag" style="left:' + t.x + '%;top:' + t.y + '%">' + esc(t.t) + '</span>';
        }).join('') + '</div></div>';
    },

    /* 맞섬 — { left:{n:'신라', s:'당과 연합', win:true}, right:{n:'백제', s:'왜와 연합'} } */
    vs(c){
      const side = (x, k) => x ? `<div class="side${x.win ? ' win' : ''}"><div class="n">${esc(x.n)}</div>` +
        (x.s ? `<div class="s">${esc(x.s)}</div>` : '') + '</div>' : '';
      return '<div class="ch-vs">' + side(c.left) +
        `<div class="x">${esc(c.mid || 'VS')}</div>` + side(c.right) + '</div>';
    },
  };

  /* ---------------- 예전부터 있던 종류 ----------------
     서른여섯 챕터에 흩어져 있던 것을 그대로 옮겼다(가장 완전한 판본 기준).
     생김새가 바뀌면 안 되므로 코드도 손대지 않았다. */
  const OLD = {
    bar(c){
      // 데이터가 이미 퍼센트면 c.max:100을 준다 — 안 주면 이 묶음 안에서
      // 제일 큰 값이 100%처럼 보인다(실제로 지적받은 문제).
      const max = c.max || Math.max.apply(null, c.bars.map(b => b.v));
      return c.bars.map(b =>
        '<div class="bar-row"><div class="bar-label">' + b.label + '</div>'
        + '<div class="bar-track"><i class="bar-fill" style="width:' + Math.round(b.v / max * 100) + '%"></i></div>'
        + '<div class="bar-val">' + (b.text || b.v) + '</div></div>').join('');
    },
    flow(c){
      return '<div class="flow">' + c.steps.map((s, i) =>
        (i ? '<div class="flow-arrow">▶</div>' : '')
        + '<div class="flow-step"><b>' + s.t + '</b>' + (s.s || '') + '</div>').join('') + '</div>';
    },
    tree(c){
      return '<div class="tree"><div class="tree-root">' + c.root + '</div><div class="tree-branch">'
        + c.cols.map(col => '<div class="tree-col">' + col.map(n =>
            '<div class="tree-node"><b>' + n.t + '</b>' + (n.s ? '<span>' + n.s + '</span>' : '') + '</div>'
          ).join('') + '</div>').join('') + '</div></div>';
    },
    kings(c){
      const badge = (k) => !k ? '<div class="king-badge kb-spacer"></div>' :
        '<div class="king-badge' + (k.active ? ' active' : '') + '">'
        + (k.dynasty ? '<div class="kb-dynasty">' + k.dynasty + '</div>' : '')
        + '<div class="kb-name">' + k.name + '</div>'
        + (k.note ? '<div class="kb-note">' + k.note + '</div>' : '') + '</div>';
      let out = '<div class="kings-row">' + c.main.map(badge).join('') + '</div>';
      if (c.cross && c.cross.length){
        out += '<div class="kings-row kings-cross">' + c.cross.map(badge).join('') + '</div>';
      }
      return out;
    },
  };

  /* 이름으로 부르는 도해를 여기 쌓는다. 여러 챕터가 같은 그림을 쓸 때만 등록한다 —
     한 챕터에서만 쓰는 것은 그 챕터가 chart:{...}로 직접 넘기는 편이 낫다. */
  const VISUALS = {};
  function define(name, spec){ VISUALS[name] = spec; }

  function draw(c){
    if (!c) return '';
    css();
    // 문자열이면 이름표다 — 등록해 둔 도해를 꺼낸다
    if (typeof c === 'string'){
      const s = VISUALS[c];
      if (!s) return '';
      return draw(s);
    }
    const head = c.title ? '<div class="ch-title">' + esc(c.title) + '</div>' : '';
    const f = NEW[c.type] || OLD[c.type];
    if (f) return head + f(c);
    // type이 없으면 표로 본다(예전부터 그랬다)
    if (c.head && c.rows){
      return head + '<table><thead><tr>' + c.head.map(h => '<th>' + h + '</th>').join('')
        + '</tr></thead><tbody>'
        + c.rows.map(r => '<tr>' + r.map(x => '<td>' + x + '</td>').join('') + '</tr>').join('')
        + '</tbody></table>';
    }
    return '';
  }

  return { draw, define, VISUALS, types: Object.keys(NEW).concat(Object.keys(OLD)) };
})();

/* 챕터들은 drawChart(c)를 그대로 부른다. 이름을 바꾸지 않는다 —
   서른여섯 파일의 호출부를 건드릴 이유가 없다. */
window.drawChart = function(c){ return Chart.draw(c); };
