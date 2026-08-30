/* ============ 자동 이동 (전 챕터 공용) ============

   왜 만들었나
   - "NPC까지 찾아가는 건 자동으로 해도 되지만, NPC와의 대화는 공부에 필요한
     대화니까 내가 눌러야 한다"는 요청에서 나왔다.
   - 실제로 재 보니 이 게임은 한 문항까지 오는 데 여덟 번을 눌러야 하고,
     그중 상당수가 그냥 걷는 일이었다. 걷기는 배우는 일이 아니다.

   그래서 **이동만** 자동이다.
   - 목표(다음에 말 걸 NPC, 없으면 출구)까지 알아서 걸어간다.
   - NPC 앞에 닿으면 대화창을 열어 주고 거기서 자동은 멈춘다.
     대사 넘기기는 손으로 해야 한다 — 그게 학습이 일어나는 자리다.
   - 유물 탐색 지점은 목표로 삼지 않는다. 숨긴 것을 찾아다니는 재미를
     자동이 가져가 버리면 그 콘텐츠가 통째로 무의미해진다.

   챕터에 붙이는 법
     1) <script src="assets/autowalk.js"></script>
     2) 게임 루프에서 World.update(dt) **앞에** Auto.drive() 한 줄
     3) Auto.mount()
*/
window.Auto = (function(){

  const GRID = 16;          // 경로 탐색 격자
  const REACH_NPC = 92;     // 이만큼 가까우면 도착으로 본다(대화 반경 108.8보다 조금 안쪽)
  const REACH_PT  = 14;     // 웨이포인트 통과 판정

  let on = false, path = [], goal = null, goalKind = '', lastZone = '', stuck = 0, lastPos = null;

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 우측 한가운데 — 미니맵(위)과 행동 버튼(아래) 사이의 빈 자리 */
    #auto-btn { position:absolute; z-index:24; right:calc(12px + env(safe-area-inset-right));
      top:50%; transform:translateY(-50%); min-width:52px; height:40px; padding:0 12px;
      border-radius:20px; border:1px solid #4a3c26; background:#241c12dd; color:#b8a888;
      font-family:"Gowun Batang",serif; font-size:13px; font-weight:700; letter-spacing:.08em;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;
      box-shadow:0 4px 14px rgba(0,0,0,.5); transition:color .15s, border-color .15s, background .15s; }
    #auto-btn:active { transform:translateY(-50%) scale(.95); }
    #auto-btn.on { color:#f0c96b; border-color:#c9a24a; background:#3a2c1add;
      box-shadow:0 0 16px rgba(240,201,107,.35); }
    #auto-btn .dot { width:7px; height:7px; border-radius:50%; background:#6a5a3c; }
    #auto-btn.on .dot { background:#f0c96b; animation:auto-pulse 1.1s ease-in-out infinite; }
    @keyframes auto-pulse { 0%,100%{opacity:.45} 50%{opacity:1} }
    @media (prefers-reduced-motion:reduce){ #auto-btn.on .dot { animation:none; } }`;
    document.head.appendChild(st);
  }

  function layer(){ return document.getElementById('wrap') || document.body; }

  function mount(){
    css();
    if (document.getElementById('auto-btn')) return;
    const b = document.createElement('button');
    b.id = 'auto-btn';
    b.innerHTML = '<span class="dot"></span>AUTO';
    b.onclick = (e) => { e.stopPropagation(); toggle(); };
    layer().appendChild(b);
  }

  function render(){
    const b = document.getElementById('auto-btn');
    if (b) b.classList.toggle('on', on);
  }

  function toggle(){ on ? stop() : start(); }
  function start(){ on = true; path = []; goal = null; stuck = 0; render(); }
  function stop(){
    on = false; path = []; goal = null;
    if (typeof World !== 'undefined' && World.stick){ World.stick.dx = 0; World.stick.dy = 0; }
    render();
  }

  /* ---------------- 목표 고르기 ----------------
     1) 이 구역에서 아직 안 들은 대화가 남은 NPC
     2) 없으면 출구
     유물 지점은 일부러 뺀다(위 주석 참고). */
  function pickGoal(){
    const z = ZONES[World.zone];
    if (!z) return null;

    for (const n of (z.npcs || [])){
      let key = null;
      try { key = Stage.keyFor(n.id); } catch(e){}
      if (!key) continue;
      const seen = (typeof seenDialogKeys !== 'undefined') && seenDialogKeys.has(key);
      if (!seen) return { x:n.x, y:n.y, kind:'npc', id:n.id };
    }
    for (const e of (z.exits || [])){
      const r = e.rect;
      return { x:(r.x0 + r.x1) / 2, y:(r.y0 + r.y1) / 2, kind:'exit' };
    }
    return null;
  }

  /* ---------------- 길 찾기 ----------------
     배리어를 피해야 하므로 canStand로 격자 BFS를 돌린다. 목표가 바뀔 때만
     계산하고, 결과를 웨이포인트로 들고 간다(매 프레임 돌리면 무겁다). */
  function snap(v){ return Math.round(v / GRID) * GRID; }

  function findPath(sx, sy, tx, ty){
    const startK = snap(sx) + ',' + snap(sy);
    const goalX = snap(tx), goalY = snap(ty);
    const prev = new Map([[startK, null]]);
    let q = [[snap(sx), snap(sy)]];
    let best = null, bestD = Infinity;

    for (let step = 0; step < 6000 && q.length; step++){
      const [x, y] = q.shift();
      const d = Math.hypot(x - tx, y - ty);
      if (d < bestD){ bestD = d; best = [x, y]; }
      if (x === goalX && y === goalY) break;
      for (const [dx, dy] of [[GRID,0],[-GRID,0],[0,GRID],[0,-GRID]]){
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx > BG_W || ny > BG_H) continue;
        const k = nx + ',' + ny;
        if (prev.has(k)) continue;
        if (!World.canStand(nx, ny)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!best) return [];
    // 목표에 정확히 못 닿아도 가장 가까웠던 칸까지는 간다
    // (NPC·출구가 배리어 위에 있는 경우가 있다)
    const out = [];
    let cur = best;
    while (cur){
      out.push(cur);
      cur = prev.get(cur[0] + ',' + cur[1]);
    }
    out.reverse();
    return out;
  }

  /* ---------------- 매 프레임 ----------------
     World.update()가 stick을 읽어 움직이므로, 그 앞에서 stick을 채워 준다. */
  function drive(){
    // World·ZONES는 챕터가 const로 선언한다 — window.World로는 안 잡힌다.
    if (!on || typeof World === 'undefined') return;
    // 대화·퀴즈·보스전이 떠 있으면 손을 뗀다(World.update도 어차피 멈춘다)
    if (World.paused || World.transitioning || document.querySelector('.ov.show')) return;

    if (World.zone !== lastZone){ lastZone = World.zone; path = []; goal = null; }

    if (!goal){
      goal = pickGoal();
      if (!goal){ stop(); return; }
      goalKind = goal.kind;
      path = findPath(World.px, World.py, goal.x, goal.y);
      if (!path.length){ stop(); return; }
    }

    // 도착 판정
    const dGoal = Math.hypot(goal.x - World.px, goal.y - World.py);
    if (goalKind === 'npc' && dGoal < REACH_NPC){
      World.stick.dx = 0; World.stick.dy = 0;
      World.checkNpc();
      // 대화창을 열어 주고 자동은 멈춘다 — 대사 넘기기는 손으로
      if (World.nearNpc){ stop(); Stage.interact(); }
      else { path = []; goal = null; }
      return;
    }

    // 다음 웨이포인트로
    while (path.length && Math.hypot(path[0][0] - World.px, path[0][1] - World.py) < REACH_PT) path.shift();
    if (!path.length){ goal = null; return; }

    const [wx, wy] = path[0];
    const dx = wx - World.px, dy = wy - World.py;
    const len = Math.hypot(dx, dy) || 1;
    World.stick.dx = dx / len;
    World.stick.dy = dy / len;

    // 어딘가에 걸려 제자리걸음이면 길을 다시 찾는다
    if (lastPos && Math.hypot(World.px - lastPos[0], World.py - lastPos[1]) < 0.4){
      if (++stuck > 40){ stuck = 0; path = []; goal = null; }
    } else stuck = 0;
    lastPos = [World.px, World.py];
  }

  return { mount, drive, toggle, start, stop, get on(){ return on; } };
})();
