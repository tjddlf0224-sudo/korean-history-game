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

   지도 이미지는 assets/map/joseon8do.png (세로형 760x980).
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

async function loadMapPoints(){
  if (PROVINCES.length) return;
  const res = await fetch('assets/map/map_points.json');
  const d = await res.json();
  MAP_W = d.size[0]; MAP_H = d.size[1];
  PROVINCES = d.provinces.map(p => ({ id:p.id, x:p.x, y:p.y,
    name: { early: p.early, late: p.late } }));
  MAP_MARKERS = {};
  for (const m of d.markers) MAP_MARKERS[m.id] = { x:m.x, y:m.y, label:m.label };
  ISLANDS = d.islands || [];
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
    // 드래그(마우스·터치 공통)로 위아래 스크롤. 살짝만 움직이면 '클릭'으로 본다.
    let dragY = null, moved = 0;
    const start = (y) => { dragY = y; moved = 0; };
    const move = (y) => {
      if (dragY === null) return;
      const dy = dragY - y; dragY = y; moved += Math.abs(dy);
      this._scrollBy(dy * (this.canvas.width / this.canvas.clientWidth));
    };
    const end = () => { this._dragMoved = moved; dragY = null; };
    this.canvas.addEventListener('pointerdown', (e) => start(e.clientY));
    this.canvas.addEventListener('pointermove', (e) => move(e.clientY));
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

    if (!this.img){
      this.img = new Image();
      this.img.src = 'assets/map/joseon8do.png';
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

  _activeMarkers(){
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

    // 도 이름 라벨
    const era = this.opts.era === 'late' ? 'late' : 'early';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.max(9, Math.round(15 * s));
    ctx.font = `bold ${fs}px "Gowun Batang", serif`;
    for (const p of PROVINCES){
      const x = p.x * s, y = p.y * s;
      const t = p.name[era];
      ctx.lineWidth = Math.max(2, fs * 0.28);
      ctx.strokeStyle = 'rgba(250,244,230,.92)';
      ctx.strokeText(t, x, y);
      ctx.fillStyle = '#4a3822';
      ctx.fillText(t, x, y);
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

  _pos(e){
    const r = this.canvas.getBoundingClientRect();
    const dpr = this.canvas.width / r.width;
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
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
    if (this.opts.onPick) this.opts.onPick(id);
  },
};
