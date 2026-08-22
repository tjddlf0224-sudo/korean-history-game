/* ============ 조선 8도 지도 오버레이 (전 챕터 공용 컴포넌트) ============
   화면이 어두워지고 → 지도가 뜨고 → 지점을 눌러 선택하면 → 콜백으로 넘어간다.
   지금은 2화 "국경으로 가기"에 쓰지만, 앞으로 다른 챕터에서도 그대로 재사용한다.

   쓰는 법:
     GameMap.open({
       title: '북방 국경',
       caption: '김종서 장군이 있는 국경의 끝을 짚어보게.',
       era: 'early',            // 도 이름 표기 시대(아래 PROVINCES 참고)
       markers: ['hamgil'],     // 선택 가능한 지점 id 목록(생략하면 전부)
       answer: 'hamgil',        // 정답 지점(있으면 오답 시 다시 고르게 함)
       wrongMsg: '그쪽이 아닐세. 두만강 쪽을 다시 보게.',
       onPick: (id) => { ... }  // 정답을 고르면 호출
     });

   지도 이미지는 assets/map/joseon8do.png (세로형 760x1212).
   조선 본토뿐 아니라 요동·만주·연해주·일본 북단까지 함께 그려져 있고,
   주변국 이름은 era에 따라 갈린다(early=명·여진, late=청).
   한반도 전체를 한 화면에 욱여넣으면 지명·강 이름이 읽을 수 없을 만큼 작아지므로,
   가로 폭에 맞춰 '확대'해서 일부만 보여주고 위아래로 스크롤/드래그하게 한다.
   focus 옵션으로 처음 보여줄 위치를 지정한다(예: focus:'north' → 북방 국경). */

/* 지도 규격·라벨·지점 좌표는 draw_joseon_map.py가 내보낸 map_points.json이
   단일 출처다(손으로 두 곳을 맞추면 반드시 어긋나므로). 지도를 다시 그리면
   그 스크립트가 PNG와 JSON을 같이 갱신한다. */
let MAP_W = 760, MAP_H = 980;
let PROVINCES = [];
let MAP_MARKERS = {};
let ISLANDS = [];
let COUNTRIES = [];   // 주변국 이름 — 시대별로 갈린다(명/여진 ↔ 청)
let CITIES = [];      // 세종 대 주요 고을

async function loadMapPoints(){
  if (PROVINCES.length) return;
  // 지도를 다시 그리면 좌표가 통째로 바뀐다. 캐시된 옛 JSON을 쓰면 라벨이
  // 엉뚱한 자리에 찍히므로 버전 쿼리를 붙여 확실히 새로 받는다.
  const res = await fetch('assets/map/map_points.json?v=2');
  const d = await res.json();
  MAP_W = d.size[0]; MAP_H = d.size[1];
  PROVINCES = d.provinces.map(p => ({ id:p.id, x:p.x, y:p.y,
    name: { early: p.early, late: p.late } }));
  MAP_MARKERS = {};
  for (const m of d.markers) MAP_MARKERS[m.id] = { x:m.x, y:m.y, label:m.label };
  ISLANDS = d.islands || [];
  COUNTRIES = d.countries || [];
  CITIES = d.cities || [];
}

const GameMap = {
  el: null, canvas: null, ctx: null, img: null,
  opts: null, hotspots: [], hover: null, wrongAt: 0,

  _ensureDom(){
    if (this.el) return;
    const ov = document.createElement('div');
    ov.className = 'ov center';
    ov.id = 'map-overlay';
    ov.innerHTML = `
      <div id="map-panel">
        <canvas id="map-canvas"></canvas>
        <div class="map-side">
          <div class="map-title" id="map-title"></div>
          <div class="map-caption" id="map-caption"></div>
          <div class="map-fb" id="map-fb"></div>
          <div id="map-cancel" style="display:none;margin-top:12px;align-self:flex-start;
               padding:8px 16px;border-radius:999px;border:1px solid #c9a24a;
               background:#3a2c1a;color:#f5ecd8;font-size:13px;cursor:pointer">돌아가기</div>
        </div>
      </div>`;
    (document.getElementById('wrap') || document.body).appendChild(ov);
    this.el = ov;
    this.canvas = ov.querySelector('#map-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault(); this._scrollBy(e.deltaY);
    }, { passive: false });
    // 드래그(마우스·터치 공통)로 지도 세로 스크롤. 살짝만 움직이면 '클릭'으로 본다.
    // 좌표는 반드시 _pos()를 거친다 — 세로모드에서 #wrap이 90도 회전돼 있어서
    // 화면 X/Y와 캔버스 로컬 x/y가 서로 뒤바뀌기 때문(아래 _pos 주석 참고).
    let dragY = null, moved = 0;
    const start = (e) => { dragY = this._pos(e).y; moved = 0; };
    const move = (e) => {
      if (dragY === null) return;
      const y = this._pos(e).y;
      const dy = dragY - y; dragY = y; moved += Math.abs(dy);
      this._scrollBy(dy);
    };
    const end = () => { this._dragMoved = moved; dragY = null; };
    this.canvas.addEventListener('pointerdown', start);
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
  },

  async open(opts){
    this._ensureDom();
    await loadMapPoints();
    this.opts = Object.assign({ era:'early', markers:null, answer:null }, opts);
    this.hover = null; this.wrongAt = 0;
    document.getElementById('map-title').textContent = opts.title || '지도';
    document.getElementById('map-caption').textContent = opts.caption || '';
    document.getElementById('map-fb').textContent = '';
    // 허브 모드(목적지 고르기)에서는 그냥 되돌아갈 수 있어야 한다. 퀴즈 모드는
    // 정답을 짚어야 넘어가는 게 목적이므로 취소 버튼을 두지 않는다.
    const cancel = document.getElementById('map-cancel');
    cancel.style.display = this.opts.onCancel ? 'block' : 'none';
    cancel.onclick = () => { this.close(); this.opts.onCancel && this.opts.onCancel(); };

    if (!this.img){
      this.img = new Image();
      this.img.src = 'assets/map/joseon8do.png?v=2';
      this.img.onload = () => this._draw();
    }
    this.el.classList.add('show');
    if (typeof World !== 'undefined') World.paused = true;
    this._resize();
    this._applyFocus();
    this._draw();
  },

  close(){
    if (this.el) this.el.classList.remove('show');
    if (typeof World !== 'undefined') World.paused = false;
  },

  _resize(){
    // 지도를 '가로 폭에 맞춰' 확대한다 → 지명과 강 이름이 읽을 만큼 커진다.
    // 세로는 화면에 담기지 않으므로 잘라 보여주고 위아래로 스크롤한다.
    const panel = this.el.querySelector('#map-panel');
    const wrap = document.getElementById('wrap') || document.body;
    const viewW = Math.max(180, Math.round(panel.clientWidth * 0.56));
    const viewH = Math.max(140, wrap.clientHeight - 44);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    this.viewW = viewW; this.viewH = viewH;
    this.canvas.style.width = viewW + 'px';
    this.canvas.style.height = viewH + 'px';
    this.canvas.width = Math.round(viewW * dpr);
    this.canvas.height = Math.round(viewH * dpr);

    this.scale = this.canvas.width / MAP_W;      // 가로 꽉 채우는 배율
    this.fullH = MAP_H * this.scale;             // 확대된 지도의 전체 높이
    this.maxScroll = Math.max(0, this.fullH - this.canvas.height);
    this.scrollY = Math.min(this.scrollY || 0, this.maxScroll);
  },

  /* 처음 보여줄 세로 위치. focus로 지점 id나 'north'/'south'를 줄 수 있다. */
  _applyFocus(){
    const f = this.opts.focus;
    if (f === undefined || f === null){ this.scrollY = 0; return; }
    if (f === 'north'){ this.scrollY = 0; return; }
    if (f === 'south'){ this.scrollY = this.maxScroll; return; }
    const m = MAP_MARKERS[f];
    if (m){
      this.scrollY = Math.max(0, Math.min(this.maxScroll,
        m.y * this.scale - this.canvas.height / 2));
    }
  },

  /* 표시할 지점 목록.
     - 허브 모드(destinations): 각 목적지의 marker만 띄우고, 라벨은 목적지 이름으로
       덮어쓴다(예: hamgil 지점을 '6진 진영으로'라고 보여줌).
     - 퀴즈 모드(markers+answer): 기존 방식 그대로. */
  _activeMarkers(){
    const dests = this.opts.destinations;
    if (dests && dests.length){
      return dests.filter(d => MAP_MARKERS[d.marker])
                  .map(d => ({ id: d.marker, ...MAP_MARKERS[d.marker],
                               label: d.label || MAP_MARKERS[d.marker].label }));
    }
    const ids = this.opts.markers || Object.keys(MAP_MARKERS);
    return ids.filter(id => MAP_MARKERS[id]).map(id => ({ id, ...MAP_MARKERS[id] }));
  },

  _draw(){
    if (!this.ctx) return;
    const ctx = this.ctx, s = this.scale;
    const oy = -(this.scrollY || 0);   // 세로 스크롤 오프셋
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(0, oy);

    if (this.img && this.img.complete && this.img.naturalWidth){
      ctx.drawImage(this.img, 0, 0, this.canvas.width, this.fullH);
    } else {
      ctx.fillStyle = '#2b2015';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#8a7a5a';
      ctx.font = `${Math.round(14*s*2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('지도 이미지 준비 중', this.canvas.width/2, this.canvas.height/2);
    }

    const era = this.opts.era === 'late' ? 'late' : 'early';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    /* 라벨이 캔버스 밖으로 잘리지 않게 x를 안쪽으로 당긴다. 지도 가장자리에
       놓이는 라벨(요동의 '명' 등)은 원래 위치가 맞는데도 절반이 잘려 나간다. */
    const clampX = (x, w) => Math.max(w / 2 + 2, Math.min(this.canvas.width - w / 2 - 2, x));
    const label = (t, x, y, fs, fill, halo) => {
      ctx.font = `bold ${fs}px "Gowun Batang", serif`;
      const cx = clampX(x, ctx.measureText(t).width);
      ctx.lineWidth = Math.max(2, fs * 0.3);
      ctx.strokeStyle = halo;
      ctx.strokeText(t, cx, y);
      ctx.fillStyle = fill;
      ctx.fillText(t, cx, y);
    };

    // 주변국 이름 — 조선 땅 이름보다 크고 흐리게 깔아 '남의 나라'로 읽히게 한다.
    // 시대에 맞는 이름만 그린다(세종 대라면 명·여진, 조선 후기라면 청).
    const cf = Math.max(11, Math.round(19 * s));
    for (const c of COUNTRIES){
      const t = c[era];
      if (!t) continue;
      label(t, c.x * s, c.y * s, cf, 'rgba(96,92,84,.92)', 'rgba(238,238,234,.85)');
    }

    // 도 이름 라벨
    const fs = Math.max(9, Math.round(15 * s));
    for (const p of PROVINCES){
      label(p.name[era], p.x * s, p.y * s, fs, '#4a3822', 'rgba(250,244,230,.92)');
    }

    // 주요 고을 — 작은 점 + 이름. 한양·평양은 조금 크게.
    const gf = Math.max(8, Math.round(11 * s));
    for (const c of CITIES){
      const x = c.x * s, y = c.y * s;
      const r = (c.big ? 3.4 : 2.3) * Math.max(1, s * 0.9);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = '#6b3a3a'; ctx.fill();
      ctx.lineWidth = Math.max(1, s); ctx.strokeStyle = 'rgba(250,244,230,.9)'; ctx.stroke();
      // 점은 실제 위치, 글자는 lx/ly(겹침 피하려 흩어 놓은 자리)에 그린다.
      const lx = (c.lx !== undefined ? c.lx : c.x) * s;
      const ly = (c.ly !== undefined ? c.ly : c.y) * s;
      label(c.name, lx, ly - r - gf * 0.72, gf, '#3f3020', 'rgba(250,244,230,.95)');
    }

    // 섬 이름 — 도 이름보다 작게. 독도·울릉도·제주도는 반드시 표기한다.
    const isf = Math.max(8, Math.round(11 * s));
    ctx.font = `bold ${isf}px "Gowun Batang", serif`;
    for (const it of ISLANDS){
      const x = it.x * s, y = it.y * s;
      ctx.lineWidth = Math.max(2, isf * 0.3);
      ctx.strokeStyle = 'rgba(250,244,230,.95)';
      ctx.strokeText(it.name, x, y);
      ctx.fillStyle = '#3f3020';
      ctx.fillText(it.name, x, y);
    }

    // 선택 가능한 지점
    this.hotspots = [];
    const t = Date.now() / 500;
    const pulse = 1 + Math.sin(t) * 0.12;
    for (const m of this._activeMarkers()){
      const x = m.x * s, y = m.y * s;
      const r = Math.max(7, 11 * s) * (this.hover === m.id ? 1.25 : pulse);
      this.hotspots.push({ id:m.id, x, y: y + oy, r: Math.max(r, 16 * s) });

      ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(217,164,65,.22)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = '#d9a441'; ctx.fill();
      ctx.lineWidth = Math.max(1.5, 2*s); ctx.strokeStyle = '#3a2c1a'; ctx.stroke();

      const lf = Math.max(9, Math.round(13 * s));
      ctx.font = `bold ${lf}px "Gowun Batang", serif`;
      ctx.lineWidth = Math.max(2, lf * 0.3);
      ctx.strokeStyle = 'rgba(20,14,8,.75)';
      ctx.strokeText(m.label, x, y - r - lf * 0.75);
      ctx.fillStyle = '#f5ecd8';
      ctx.fillText(m.label, x, y - r - lf * 0.75);
    }

    ctx.restore();

    // 위/아래로 더 볼 게 남았다는 힌트
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const hf = Math.max(10, Math.round(13 * s));
    ctx.font = `bold ${hf}px sans-serif`;
    ctx.fillStyle = 'rgba(20,14,8,.45)';
    if (this.scrollY > 4) ctx.fillText('▲', this.canvas.width / 2, hf);
    if (this.scrollY < this.maxScroll - 4)
      ctx.fillText('▼', this.canvas.width / 2, this.canvas.height - hf);

    if (this.el.classList.contains('show')) requestAnimationFrame(() => this._draw());
  },

  _scrollBy(dy){
    this.scrollY = Math.max(0, Math.min(this.maxScroll, (this.scrollY || 0) + dy));
  },

  /* 화면 좌표(clientX/Y) → 캔버스 로컬 좌표.

     세로모드에서는 #wrap에 `rotate(90deg) translateY(-100%)`가 걸려 있고,
     getBoundingClientRect()는 회전된 요소의 "축정렬 바운딩 박스"를 돌려준다.
     그래서 회전을 무시하고 (clientX-left, clientY-top)으로 계산하면 축이
     통째로 뒤바뀐다 — 실제로 세로 스크롤이 좌우 드래그로만 먹고, 마커를
     눌러도 아무 반응이 없던 원인이 이것이다.

     wrap 로컬 (x,y)는 화면 (H-y, x)로 간다(H=wrap 높이). 캔버스 로컬 원점은
     화면상 (rect.right, rect.top)에 놓이고, 로컬 +x는 화면 아래쪽,
     로컬 +y는 화면 왼쪽을 향한다. 그 역변환이 아래 rot 분기다. */
  _pos(e){
    const r = this.canvas.getBoundingClientRect();
    const rot = document.body.classList.contains('rot');
    const lx = rot ? (e.clientY - r.top)  : (e.clientX - r.left);
    const ly = rot ? (r.right - e.clientX) : (e.clientY - r.top);
    const cssW = rot ? r.height : r.width;   // 회전 시 화면상 '높이'가 캔버스 폭
    const dpr = this.canvas.width / (cssW || 1);
    return { x: lx * dpr, y: ly * dpr };
  },

  _hit(p){
    for (const h of this.hotspots){
      if (Math.hypot(h.x - p.x, h.y - p.y) <= h.r * 2.0) return h.id;
    }
    return null;
  },

  _onMove(e){ this.hover = this._hit(this._pos(e)); },

  _onClick(e){
    if (this._dragMoved > 6){ this._dragMoved = 0; return; }  // 스크롤 드래그였음
    const id = this._hit(this._pos(e));
    if (!id) return;
    const fb = document.getElementById('map-fb');
    if (this.opts.answer && id !== this.opts.answer){
      // 오답이면 알려주고 다시 고르게 한다(퀴즈의 재시도 UX와 같은 원칙).
      fb.textContent = this.opts.wrongMsg || '그곳이 아닐세. 다시 짚어보게.';
      fb.className = 'map-fb wrong';
      return;
    }
    fb.textContent = '';
    this.close();
    // 허브 모드면 고른 목적지 정보를 함께 넘긴다.
    const dest = (this.opts.destinations || []).find(d => d.marker === id) || null;
    if (this.opts.onPick) this.opts.onPick(id, dest);
  },
};
