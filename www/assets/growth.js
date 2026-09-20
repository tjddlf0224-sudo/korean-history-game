/* ============ 성장 기록 — 날짜별 정답률 곡선 + 챕터별 급제 등급 ============

   왜 (2026-09-20, 성일님)
   - "전산회계 오락실 앱을 참고해서 성장그래프도 만들고 랭크도 만들자.
     챕터별 정답률에 따른 랭크로 하면 될 것 같은데."

   전산회계 오락실과 다르게 잡은 곳
   - 그쪽 성장그래프는 **판마다 점수**를 점으로 찍는다(게임이라 점수가 실력).
     이 게임은 점수가 없고 공부가 목적이라, **날짜별 첫 시도 정답률**을 찍는다.
     "어제보다 오늘 더 맞히나"가 이 게임에서의 성장이다.
   - 그쪽 등급은 한 판 점수로 매번 다시 매긴다(올랐다 내렸다 한다).
     여기서는 챕터마다 쌓인 정답률로 매긴다 — 그 챕터를 얼마나 아는지가
     한 판 운에 흔들리면 안 된다.
   - 도표는 그쪽처럼 라이브러리 없이 SVG 문자열로 직접 그린다(이 프로젝트도
     외부 의존을 안 쓴다).

   신분(rank.js의 노비→왕)과는 다른 축이다
   - 신분은 **얼마나 했나**(경험치), 급제 등급은 **얼마나 맞히나**(정답률).
     이름이 겹치지 않게 등급은 과거 시험 이름(장원·갑과·을과·병과)을 쓴다.

   무엇을 세나 — 첫 시도만
   - juice.js의 Juice.correct(firstTry)·Juice.wrong()을 감싼다. 챕터 36곳과
     기출변형 화면이 모두 이 둘을 지나므로 여기 한 곳만 감싸면 된다.
       · Juice.wrong()      → 푼 문항 +1, 틀림
       · Juice.correct(true)→ 푼 문항 +1, 맞힘
       · Juice.correct(false) = 틀린 뒤 고쳐 맞힌 것이라 세지 않는다
         (세면 정답률이 늘 100%가 된다)

   기록: localStorage khg_growth = { d:{'2026-09-20':{n,c}}, ch:{'godae2.html':{n,c}} }
     khg_로 시작하므로 클라우드 저장(save.js)이 계정에 같이 싣는다.
*/
window.Growth = (function(){
  const KEY = 'khg_growth';
  const DAYS_KEEP = 120;      // 날짜 기록 보관 한도
  const CHART_DAYS = 14;      // 도표에 그리는 최근 날짜 수
  const MIN_N = 5;            // 이만큼은 풀어야 등급을 매긴다

  /* 과거 시험 등급 — 낮은 칸에 '낙방' 같은 말은 쓰지 않는다(공부하는 사람이 본다) */
  const TIERS = [
    { min: 95, name: '장원',   color: '#f0c96b' },
    { min: 90, name: '갑과',   color: '#e0b25a' },
    { min: 80, name: '을과',   color: '#b9cf9a' },
    { min: 70, name: '병과',   color: '#9ec6d8' },
    { min: 0,  name: '수학 중', color: '#a99c84' },
  ];

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === 'object') return { d: v.d || {}, ch: v.ch || {} };
    } catch(e){}
    return { d: {}, ch: {} };
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }

  function dayKey(t){
    const d = t ? new Date(t) : new Date();
    const p = n => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function here(){ return (location.pathname.split('/').pop() || '').split('?')[0]; }
  function isChapter(file){
    return !!(window.ChapterLock && ChapterLock.ORDER && ChapterLock.ORDER.indexOf(file) >= 0);
  }

  /* 문항 하나 — ok는 '첫 시도에 맞혔나' */
  function note(ok){
    const v = load(), k = dayKey();
    const day = v.d[k] || { n: 0, c: 0 };
    day.n++; if (ok) day.c++;
    v.d[k] = day;

    const file = here();
    if (isChapter(file)){
      const ch = v.ch[file] || { n: 0, c: 0 };
      ch.n++; if (ok) ch.c++;
      v.ch[file] = ch;
    }
    // 오래된 날짜는 버린다
    const keys = Object.keys(v.d).sort();
    while (keys.length > DAYS_KEEP) delete v.d[keys.shift()];
    save(v);
  }

  function pctOf(s){ return (s && s.n) ? Math.round(s.c / s.n * 100) : null; }
  function chapter(file){ return load().ch[file] || null; }
  function tierOf(pct){
    if (pct === null || pct === undefined) return null;
    return TIERS.find(t => pct >= t.min) || TIERS[TIERS.length - 1];
  }
  /* 챕터 등급 — 아직 적게 푼 챕터는 null(등급을 안 매긴다) */
  function chapterTier(file){
    const s = chapter(file);
    if (!s || s.n < MIN_N) return null;
    const p = pctOf(s);
    return Object.assign({ pct: p, n: s.n }, tierOf(p));
  }

  /* ---------------- 셈 ---------------- */
  function days(){
    const v = load();
    return Object.keys(v.d).sort().map(k => Object.assign({ day: k }, v.d[k]));
  }
  function totals(){
    const all = days();
    const n = all.reduce((a, x) => a + x.n, 0);
    const c = all.reduce((a, x) => a + x.c, 0);
    return { n, c, pct: n ? Math.round(c / n * 100) : null };
  }
  /* 최근 며칠 정답률 — 그 앞 같은 기간과 견준다 */
  function recent(k){
    const all = days();
    const last = all.slice(-k), prev = all.slice(-k * 2, -k);
    const sum = arr => arr.reduce((a, x) => ({ n: a.n + x.n, c: a.c + x.c }), { n: 0, c: 0 });
    const a = sum(last), b = sum(prev);
    return { now: pctOf(a), before: pctOf(b), n: a.n };
  }

  /* ---------------- 도표(SVG 문자열) ---------------- */
  function chartSVG(){
    const all = days().filter(d => d.n > 0).slice(-CHART_DAYS);
    if (!all.length) return '';
    const W = 320, H = 132, padL = 26, padR = 10, padT = 12, padB = 20;
    const n = all.length;
    const x = i => n <= 1 ? (padL + (W - padL - padR) / 2) : padL + i / (n - 1) * (W - padL - padR);
    const y = p => padT + (1 - p / 100) * (H - padT - padB);
    const pts = all.map((d, i) => ({ x: x(i), y: y(pctOf(d)), d }));

    // 가로 눈금 50·80·100 — 80은 급제 기준선이라 조금 더 진하게
    const grid = [100, 80, 50].map(v =>
      `<line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="${v === 80 ? 'rgba(240,201,107,.35)' : 'rgba(240,201,107,.13)'}" stroke-width="1"${v === 80 ? ' stroke-dasharray="3 3"' : ''}/>` +
      `<text x="2" y="${y(v) + 3.5}" fill="#8d7f66" font-size="8.5">${v}</text>`).join('');

    const line = pts.length > 1
      ? `<polyline points="${pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="none" stroke="#f0c96b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
      : '';
    const area = pts.length > 1
      ? `<polygon points="${pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')} ${pts[pts.length-1].x.toFixed(1)},${H - padB} ${pts[0].x.toFixed(1)},${H - padB}" fill="url(#gfill)"/>`
      : '';
    const dots = pts.map((p, i) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === pts.length - 1 ? 3.6 : 2.4}" fill="${i === pts.length - 1 ? '#fff6dd' : '#f0c96b'}" stroke="#2a2013" stroke-width="1"/>`).join('');
    const lastP = pctOf(all[all.length - 1]);
    const label = `<text x="${Math.min(W - padR, pts[pts.length-1].x + 6).toFixed(1)}" y="${Math.max(padT + 8, pts[pts.length-1].y - 7).toFixed(1)}" fill="#fff6dd" font-size="10" text-anchor="end">${lastP}%</text>`;
    const md = s => s.slice(5).replace('-', '.');
    const xLab = `<text x="${padL}" y="${H - 5}" fill="#8d7f66" font-size="8.5">${md(all[0].day)}</text>` +
      (n > 1 ? `<text x="${W - padR}" y="${H - 5}" fill="#8d7f66" font-size="8.5" text-anchor="end">${md(all[n-1].day)}</text>` : '');

    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">` +
      `<defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="rgba(240,201,107,.26)"/>` +
      `<stop offset="100%" stop-color="rgba(240,201,107,0)"/></linearGradient></defs>` +
      grid + area + line + dots + label + xLab + '</svg>';
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #grw-ov { position:absolute; inset:0; z-index:94; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.88); font-family:"Gowun Batang",serif;
      overflow-y:auto; padding:10px; box-sizing:border-box; }
    #grw-ov.show { display:flex; }
    #grw-ov .panel { max-height:100%; overflow-y:auto; -webkit-overflow-scrolling:touch;
      box-sizing:border-box; width:min(94%,460px); background:#1a140c; border:1px solid #4a3c26;
      border-radius:16px; padding:18px; display:flex; flex-direction:column; gap:12px; }
    #grw-ov h3 { margin:0; font-size:17px; color:#f0c96b; text-align:center; }
    #grw-ov .chips { display:flex; flex-wrap:wrap; gap:7px; justify-content:center; }
    #grw-ov .chip { background:#241c12; border:1px solid #3a2c1a; border-radius:999px;
      padding:5px 11px; font-size:11.5px; color:#cfc4a8; font-variant-numeric:tabular-nums; }
    #grw-ov .chip b { color:#f0c96b; font-weight:700; }
    #grw-ov .chip.up b { color:#b9cf9a; } #grw-ov .chip.down b { color:#e8a08c; }
    #grw-ov .card { background:#241c12; border:1px solid #3a2c1a; border-radius:12px; padding:12px; }
    #grw-ov .cap { font-size:11.5px; color:#8d7f66; text-align:center; margin-top:6px; line-height:1.6; }
    #grw-ov .chs { display:flex; flex-direction:column; gap:6px; }
    #grw-ov .ch { display:flex; align-items:center; gap:9px; background:#241c12;
      border:1px solid #3a2c1a; border-radius:10px; padding:8px 11px; }
    #grw-ov .ch .nm { flex:1; min-width:0; font-size:12.5px; color:#f5ecd8;
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    #grw-ov .ch .n { font-size:11px; color:#8d7f66; font-variant-numeric:tabular-nums; }
    #grw-ov .ch .tg { flex:none; font-size:11.5px; font-weight:700; border-radius:999px;
      padding:3px 9px; border:1px solid currentColor; }
    #grw-ov .empty { text-align:center; font-size:12.5px; color:#8d7f66; line-height:1.8; padding:8px 0; }
    #grw-ov .close { background:#2a2013; border:1px solid #4a3c26; color:#f5ecd8;
      border-radius:11px; padding:11px; font-family:inherit; font-size:14px; cursor:pointer; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  /* 챕터 이름 — 목록 화면에만 있는 ERAS를 빌려 쓰고, 없으면 파일 이름으로 */
  function chapterName(file){
    try {
      if (typeof ERAS !== 'undefined'){
        for (const e of ERAS) for (const c of (e.cards || []))
          if (c.href === file) return c.num + ' ' + c.name;
      }
    } catch(e){}
    return file.replace(/\.html$/, '');
  }

  function body(){
    const t = totals();
    if (!t.n) return '<div class="empty">아직 푼 문항이 없습니다.<br>챕터에서 문제를 풀면 날마다 정답률이 쌓입니다.</div>';
    const r7 = recent(7);
    const diff = (r7.now !== null && r7.before !== null) ? r7.now - r7.before : null;
    const chips = [
      `<span class="chip">푼 문항 <b>${t.n}</b></span>`,
      `<span class="chip">전체 정답률 <b>${t.pct}%</b></span>`,
      r7.now !== null ? `<span class="chip">최근 7일 <b>${r7.now}%</b></span>` : '',
      diff !== null ? `<span class="chip ${diff >= 0 ? 'up' : 'down'}">지난 7일 대비 <b>${diff >= 0 ? '+' : ''}${diff}%p</b></span>` : '',
    ].join('');

    const svg = chartSVG();
    const dayCount = days().filter(d => d.n > 0).length;
    const chart = dayCount >= 2
      ? `<div class="card">${svg}</div>`
      : `<div class="card">${svg}<div class="cap">아직 하루치뿐입니다 — 내일도 풀면 곡선이 그려집니다.</div></div>`;

    const v = load();
    const order = (window.ChapterLock && ChapterLock.ORDER) ? ChapterLock.ORDER : Object.keys(v.ch);
    const rows = order.filter(f => v.ch[f]).map(f => {
      const s = v.ch[f], p = pctOf(s), tg = (s.n >= MIN_N) ? tierOf(p) : null;
      return `<div class="ch"><span class="nm">${chapterName(f)}</span>` +
        `<span class="n">${p}% · ${s.n}문항</span>` +
        `<span class="tg" style="color:${tg ? tg.color : '#6f6553'}">${tg ? tg.name : '집계 중'}</span></div>`;
    }).join('');

    return chips ? `<div class="chips">${chips}</div>${chart}` +
      (rows ? `<div class="chs">${rows}</div>` : '') +
      `<div class="cap">등급은 그 챕터에서 <b>첫 시도</b>에 맞힌 비율입니다.<br>` +
      `장원 95 · 갑과 90 · 을과 80 · 병과 70</div>` : '';
  }

  function mountOv(){
    if (document.getElementById('grw-ov')) return;
    const d = document.createElement('div');
    d.id = 'grw-ov';
    d.innerHTML = '<div class="panel"><h3>성장 기록</h3><div id="grw-body"></div>' +
      '<button class="close" id="grw-x">닫기</button></div>';
    layer().appendChild(d);
    d.querySelector('#grw-x').onclick = close;
    d.onclick = e => { if (e.target === d) close(); };
  }
  function open(){
    css(); mountOv();
    document.getElementById('grw-body').innerHTML = body();
    document.getElementById('grw-ov').classList.add('show');
  }
  function close(){ const d = document.getElementById('grw-ov'); if (d) d.classList.remove('show'); }

  /* ---------------- 이미 있는 함수에 붙는다 ---------------- */
  function wire(){
    if (!window.Juice || Juice._growthWired) return;
    const oc = Juice.correct, ow = Juice.wrong;
    if (oc) Juice.correct = function(firstTry){
      try { if (firstTry) note(true); } catch(e){}
      return oc.apply(this, arguments);
    };
    if (ow) Juice.wrong = function(){
      try { note(false); } catch(e){}
      return ow.apply(this, arguments);
    };
    Juice._growthWired = true;
  }

  function init(){ try { wire(); } catch(e){ console.error('[growth] wire', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { note, open, close, totals, recent, days, chapter, chapterTier, pctOf, TIERS, MIN_N };
})();
