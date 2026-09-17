/* ============ 동료 — 차돌이와 바우 (전 챕터 공용) ============

   누구인가 (기획: 2026-09-02, 결정: 2026-09-18 · SESSION_LOG.md)
   - 차돌이: 선사 1화에서 따라붙은 구석기 꼬마. 반짝이는 걸 보면 주머니에
     넣는다. 말이 서툴다가 시대를 건널수록 는다. 속으로는 혼자 남겨질까 두렵다.
   - 바우: 고대 1화에서 합류하는 신라 청년. 할아버지 대까지 성골이던 집안
     (진지왕 폐위로 진골이 됨). 투박하고 힘이 세며, 가끔 경전 구절이 튀어나온다.
   - 결말: 셋이 현대까지 함께 간다. 옷은 한 벌로 끝까지 간다.

   챕터에 붙이는 법
     1) <script src="assets/companions.js"> — **챕터 본문 스크립트보다 먼저.**
        NPC_DATA를 적을 때 Party.say()를 쓰기 때문이다.
     2) World.render()에서 주인공을 그리기 직전에
          if (window.Party) Party.draw(ctx, this, camX, camY, ZOOM);
        (주인공보다 먼저 그려야 동료가 주인공 뒤에 선다)
     3) 대사에 끼워 넣기
          Party.say('chadol', 'sly', '헤헤. 이거 반짝반짝.')
        → { who:'npc', name:'차돌이', img:…, t:… } 한 줄이 된다.
     4) 합류시키기: NPC_DATA의 대화에 partyJoin:'chadol' 을 적는다.
        그 대화(퀴즈까지)를 끝내면 동료가 되고, 지도의 그 인물은 사라진다.

   그림이 아직 없을 때
   - HAS_ART가 false면 걷기 그림 대신 챕터의 실루엣(drawCharacter)으로,
     대화창 초상 대신 아이콘으로 그린다. 그림이 들어오면 true로만 바꾼다.
*/
window.Party = (function(){
  const KEY = 'khg_party';
  const HAS_ART = { chadol: true, bau: true };

  const WHO = {
    chadol: {
      name: '차돌이', h: 74,
      look: { role: 'commoner', body: '#8a5a32', accent: '#d9c3a0' },
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="currentColor" stroke="none"><path d="M6 15l3-8 5-2 4 5-1 7-6 2z"/></svg>',
      faces: ['smile', 'sly', 'cry', 'shock'],
    },
    bau: {
      name: '바우', h: 112,
      look: { role: 'general', body: '#2f3d6b', accent: '#8a3a6a' },
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3.2"/><path d="M5 21c0-5 3-8 7-8s7 3 7 8"/><path d="M9 4l-2-3M15 4l2-3"/></svg>',
      faces: ['smile', 'stance', 'oops', 'resolve'],
    },
  };
  const ORDER = ['chadol', 'bau'];   // 따라오는 차례(주인공 바로 뒤가 차돌이)

  /* 챕터마다 "이 챕터를 연다면 이미 합류해 있어야 하는 동료".
     목록에서 아무 챕터나 골라 시작할 수 있으므로, 합류 장면을 건너뛰고
     들어온 사람에게도 대사가 어색하지 않게 한다. 합류 챕터 자신은 빼 둔다
     (그 챕터에서는 합류 장면을 거쳐야 한다). */
  const JOIN_AT = { chadol: 'seonsa1.html', bau: 'godae1.html' };
  const CHAPTER_SEQ = ['prologue.html','seonsa1.html','godae1.html','gaya.html','tongil.html','godae2.html','godae3.html',
    'goryeo1.html','goryeo2.html','byeokrando.html','goryeo3.html','ch0.html','ch1.html','ch2.html','ch2b.html','ch3.html',
    'ch4.html','ch5.html','ch5b.html','ch6.html','imjin.html','imjin2.html','hugi1.html','hugi2.html','hugi3.html',
    'gaehang1.html','gaehang_ch2.html','gaehang_ch3.html','gaehang4.html','gaehang5.html','ilje1.html','ilje2.html',
    'ilje_ch7.html','hyeondae1.html','hyeondae2.html','hyeondae3.html','sesi.html','ending.html'];
  function here(){ return (location.pathname.split('/').pop() || '').toLowerCase(); }

  function load(){
    try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; }
    catch(e){ return {}; }
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }

  function joined(id){
    if (load()[id]) return true;
    const cur = CHAPTER_SEQ.indexOf(here()), at = CHAPTER_SEQ.indexOf(JOIN_AT[id]);
    return cur >= 0 && at >= 0 && cur > at;
  }
  function members(){ return ORDER.filter(joined); }

  /* ---------------- 대사 ---------------- */
  function portrait(id, face){
    const w = WHO[id];
    if (!HAS_ART[id]) return null;
    const f = w.faces.indexOf(face) >= 0 ? face : w.faces[0];
    return `assets/portraits/${id}_${f}.png`;
  }
  function say(id, face, t, extra){
    const w = WHO[id];
    const b = { who: 'npc', name: w.name, icon: w.icon, t: t, party: id };
    const img = portrait(id, face);
    if (img) b.img = img;
    return Object.assign(b, extra || {});
  }

  /* ---------------- 합류 ---------------- */
  function hideJoinedNpcs(){
    if (typeof ZONES === 'undefined') return;
    for (const z in ZONES){
      const npcs = ZONES[z].npcs;
      if (!npcs) continue;
      for (let i = npcs.length - 1; i >= 0; i--){
        if (WHO[npcs[i].id] && joined(npcs[i].id)) npcs.splice(i, 1);
      }
    }
  }
  function join(id){
    if (!WHO[id]) return;
    const v = load();
    if (v[id]) return;
    v[id] = Date.now(); save(v);
    hideJoinedNpcs();
    trail.length = 0;
    if (typeof playFanfare === 'function') setTimeout(() => playFanfare(WHO[id].name + ' 합류!'), 900);
  }

  // 대화가 끝나면(퀴즈까지) partyJoin을 확인한다. Dialog는 챕터가 만든
  // 전역 상수라 처음 그릴 때 한 번 감싼다.
  let hooked = false;
  function hook(){
    if (hooked || typeof Dialog === 'undefined' || !Dialog.afterQuiz) return;
    hooked = true;
    // 아직 합류하지 않은 동료의 대사는 뺀다(합류 장면을 건너뛰고 말을 건 경우).
    // 챕터의 open()이 data를 정한 뒤에 걸러서 첫 줄부터 다시 그린다.
    const origOpen = Dialog.open;
    Dialog.open = function(key, npc){
      const r = origOpen.apply(this, arguments);
      const beats = this.data && this.data.beats;
      // 합류 장면 자신의 대사는 남긴다(아직 합류 전이니까)
      const keep = b => !b.party || joined(b.party) || b.party === this.data.partyJoin;
      if (beats && !beats.every(keep)){
        this.data = Object.assign({}, this.data, { beats: beats.filter(keep) });
        this.idx = 0;
        this.render();
      }
      return r;
    };
    const orig = Dialog.afterQuiz;
    Dialog.afterQuiz = function(){
      const id = this.data && this.data.partyJoin;
      const r = orig.apply(this, arguments);
      if (id) join(id);
      return r;
    };
    hideJoinedNpcs();
  }

  /* ---------------- 따라 걷기 ---------------- */
  // 주인공이 지나온 자리를 기록해 두고, 그 자취를 몇 걸음 늦게 밟게 한다.
  const trail = [];
  const GAP = 34;           // 동료 사이 간격(월드 좌표 px)
  let lastZone = null;
  const imgs = {};
  function frameImg(id, dir, i){
    const k = id + dir + i;
    if (!imgs[k]){
      const im = new Image();
      im.src = `assets/companions/${id}/${dir}_${i}.png` + (typeof ART_V === 'string' ? ART_V : '');
      imgs[k] = im;
    }
    return imgs[k];
  }
  const DIR = { u:'up', d:'down', l:'left', r:'right' };

  function record(world){
    const p = { x: world.px, y: world.py, f: world.facing };
    if (world.zone !== lastZone){ trail.length = 0; lastZone = world.zone; }
    const last = trail[0];
    if (last && Math.hypot(last.x - p.x, last.y - p.y) > 80) trail.length = 0; // 순간이동(출구)
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) >= 2) trail.unshift(p);
    if (trail.length > 400) trail.length = 400;
  }
  // 자취를 따라 dist만큼 떨어진 점
  function pointBehind(dist){
    let acc = 0;
    for (let i = 1; i < trail.length; i++){
      const a = trail[i - 1], b = trail[i];
      const seg = Math.hypot(a.x - b.x, a.y - b.y);
      if (acc + seg >= dist){
        const t = (dist - acc) / seg;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, f: b.f, ok: true };
      }
      acc += seg;
    }
    const tail = trail[trail.length - 1];
    return tail ? { x: tail.x, y: tail.y, f: tail.f, ok: acc > 0 } : null;
  }

  function draw(ctx, world, camX, camY, zoom){
    hook();
    const list = members();
    if (!list.length) return;
    record(world);
    list.forEach((id, n) => {
      const w = WHO[id];
      let p = pointBehind(GAP * (n + 1));
      // 아직 자취가 없으면(방금 들어옴) 주인공 곁에 나란히 선다
      if (!p || !p.ok) p = { x: world.px - 26 * (n + 1), y: world.py + 6, f: world.facing };
      const sx = (p.x - camX) * zoom, sy = (p.y - camY) * zoom;
      if (HAS_ART[id]){
        const dir = DIR[p.f] || 'down';
        const seq = [0, 1, 0, 2];
        const idx = world.moving ? seq[Math.floor(performance.now() / 140 + n) % seq.length] : 0;
        const img = frameImg(id, dir, idx);
        if (img.complete && img.naturalWidth){
          ctx.fillStyle = 'rgba(0,0,0,.22)';
          ctx.beginPath(); ctx.ellipse(sx, sy + 23, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
          const H = w.h, W = H * (img.naturalWidth / img.naturalHeight);
          ctx.drawImage(img, sx - W / 2, sy + 27 - H, W, H);   // 발끝을 주인공과 같은 높이에
          return;
        }
      }
      if (typeof drawCharacter === 'function'){
        ctx.save(); ctx.scale(zoom, zoom);
        drawCharacter(p.x - camX, p.y - camY, p.f || 'd', w.look);
        ctx.restore();
      }
    });
  }

  // 화면이 가려져 그리기가 멈춰 있어도 대화가 열릴 수 있다 — 불러온 직후에도 건다.
  window.addEventListener('load', hook);
  document.addEventListener('DOMContentLoaded', hook);

  return { say, join, joined, members, draw, WHO, _hook: hook };
})();
