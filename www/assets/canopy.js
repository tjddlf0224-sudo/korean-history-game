/* ============ 나무 덮개 — 인물이 나뭇잎 아래로 지나가게 ============

   왜 (2026-09-23, 성일님)
   - "나무 위를 캐릭터가 지나갈 때 나뭇잎과 가지 위로 지나가서 어색하다.
     그렇다고 나무를 통째로 막으면 그것도 이상하다 — 나무 아래로 지나가게."
   - 배경이 한 장짜리 그림이라 인물은 늘 그 위에 그려진다.

   방법
   - 배경 그림에서 나무(잎·가지·줄기)만 원본 픽셀 그대로 오려 낸 조각
     (assets/canopy/*.webp, 목록은 assets/canopy/data.js)을 인물과 함께 그린다.
     새로 그린 그림이 없어서, 인물이 없을 때는 붙였는지도 알 수 없다.
   - 나무는 밑동만 작게 배리어로 막고 잎 아래는 걸어 들어갈 수 있게 연다.
   - 앞뒤는 발 높이로 가린다(멀리 있는 것부터 그리기): 조각마다 base(밑동의 y)가
     있고, 발이 그보다 위(북쪽)인 인물은 나무 뒤, 아래면 나무 앞에 그려진다.
     그래서 render가 부르는 NPC·동료·주인공 그리기를 잠깐 모아 두었다가, 주인공
     차례에 나무 조각과 함께 발 높이 순으로 한꺼번에 그린다. 이름표·느낌표는
     render가 그 다음에 그리므로 늘 맨 위다.
   - 인물끼리도 발 높이 순이 된다(예전엔 NPC → 동료 → 주인공 순으로 고정).
     동료는 예전처럼 주인공 바로 뒤로 둔다.

   붙이는 곳: 챕터 파일 끝쪽, data.js 다음(World·drawPlayerSprite·ctx·ZOOM이 있은 뒤).
   조각 좌표·크기는 게임 좌표(1376×768)이고 그림은 배경과 같은 2배 해상도다. */
window.Canopy = (function(){
  const PAGE = location.pathname.split('/').pop() || 'index.html';
  const zones = (window.CANOPY_DATA || {})[PAGE];
  const none = { active: false };
  if (!zones || typeof World === 'undefined' || typeof drawPlayerSprite !== 'function') return none;

  const V = typeof ART_V !== 'undefined' ? ART_V : '';
  const cache = {};
  function img(src){
    if (!cache[src]){ const im = new Image(); im.src = src + V; cache[src] = im; }
    return cache[src];
  }
  // 먼저 받아 둔다 — 처음 지나갈 때 한 박자 늦게 덮이지 않게
  for (const z in zones) zones[z].forEach(t => img(t.src));

  const FEET = 14;   // 그리는 자리(py)에서 발까지 — 그림자 타원 높이쯤
  let inRender = false, queue = [];
  const origNpc = drawNpcSprite, origPlayer = drawPlayerSprite;
  const origParty = window.Party && Party.draw;

  function flush(camX, camY){
    const list = [];
    queue.forEach((q, i) => {
      let y;
      if (q.k === 'npc') y = camY + q.a[1] / ZOOM + FEET;
      else if (q.k === 'party') y = World.py + FEET - 0.01;   // 주인공 바로 뒤
      else y = World.py + FEET;
      list.push({ y, i, q });
    });
    (zones[World.zone] || []).forEach((t, i) => list.push({ y: t.base, i: -1 - i, t }));
    list.sort((a, b) => a.y - b.y || a.i - b.i);
    for (const it of list){
      if (it.t){
        const t = it.t, im = img(t.src);
        if (im.complete && im.naturalWidth)
          ctx.drawImage(im, (t.x - camX) * ZOOM, (t.y - camY) * ZOOM, t.w * ZOOM, t.h * ZOOM);
      } else if (it.q.k === 'npc') origNpc.apply(null, it.q.a);
      else if (it.q.k === 'party') origParty.apply(Party, it.q.a);
      else origPlayer.apply(null, it.q.a);
    }
    queue = [];
  }
  // 주인공을 못 그리고 끝난 판(예외 등)에서도 모아 둔 인물은 그려 준다
  function drain(){
    const q = queue; queue = [];
    for (const it of q){
      if (it.k === 'npc') origNpc.apply(null, it.a);
      else if (it.k === 'party') origParty.apply(Party, it.a);
      else origPlayer.apply(null, it.a);
    }
  }

  try {
    const origRender = World.render;
    World.render = function(){
      inRender = true; queue = [];
      try { return origRender.apply(this, arguments); }
      finally { inRender = false; if (queue.length) drain(); }
    };
    window.drawNpcSprite = function(){
      if (!inRender) return origNpc.apply(this, arguments);
      queue.push({ k: 'npc', a: [...arguments] });
    };
    if (origParty){
      Party.draw = function(){
        if (!inRender) return origParty.apply(this, arguments);
        queue.push({ k: 'party', a: [...arguments] });
      };
    }
    window.drawPlayerSprite = function(px, py){
      if (!inRender) return origPlayer.apply(this, arguments);
      queue.push({ k: 'player', a: [...arguments] });
      // render는 (World.px - camX) * ZOOM 자리에 주인공을 그린다 — 거꾸로 카메라를 구한다
      try { flush(World.px - px / ZOOM, World.py - py / ZOOM); } catch (e) { drain(); }
    };
  } catch (e) {}

  return { active: true };
})();
