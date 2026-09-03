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
  /* 이만큼 가까우면 도착으로 본다.
     예전엔 92였는데, 대화 반경(108.8) 바로 안쪽이라 **한참 떨어진 채로**
     말이 시작돼 어색했다. NPC 둘레 34px은 못 서고(canStand) 길찾기 격자가
     16px이니, 실제로 닿을 수 있는 가장 가까운 칸은 대략 50px 언저리다.
     그래서 52로 잡는다 — 눈에 보이기에 '앞에 서서' 말한다. */
  const REACH_NPC = 52;
  const TALK_RANGE = 108.8;   // 챕터의 INTERACT_RANGE와 같은 값
  const REACH_PT  = 14;     // 웨이포인트 통과 판정

  let on = false, path = [], goal = null, goalKind = '', lastZone = '', stuck = 0, lastPos = null;
  /* 이 구역에서 "가 봤지만 닿지 못한" 목표들. 배리어에 갇힌 NPC가 하나
     있으면 예전에는 그 앞에서 영원히 서 있었다("auto를 켜도 못 지나가네").
     한 번 못 닿아 본 목표는 건너뛰고 다음 목표로 간다. 구역이 바뀌면 잊는다. */
  let unreachable = new Set();

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 우측 정렬대 안. 켜져 있는 동안 순환 화살표가 계속 돈다
       (메이플키우기의 Full Auto 방식). */
    #auto-btn { width:44px; height:44px; padding:0;
      border-radius:50%; border:2px solid #4a3c26; background:#241c12ee; color:#8a7a5c;
      font-family:"Gowun Batang",serif; cursor:pointer;
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
      box-shadow:0 4px 14px rgba(0,0,0,.55); transition:color .18s, border-color .18s, background .18s; }
    #auto-btn .ring { width:21px; height:21px; display:block; }
    #auto-btn .ring svg { width:100%; height:100%; display:block; }
    #auto-btn .lbl { font-size:8.5px; font-weight:700; letter-spacing:.1em; line-height:1; }

    /* 켜짐 — 금빛으로 물들고 화살표가 돈다 */
    #auto-btn.on { color:#f7dd93; border-color:#e0b94a; background:#4a3410ee;
      box-shadow:0 0 18px rgba(240,201,107,.5), 0 4px 14px rgba(0,0,0,.55); }
    #auto-btn.on .ring { animation:auto-spin 1.6s linear infinite; }
    @keyframes auto-spin { to { transform:rotate(360deg); } }

    /* 켜진 동안 테두리 바깥으로 옅은 파문 — 지금 저절로 움직이는 중임을 알린다 */
    #auto-btn.on::after { content:''; position:absolute; inset:-4px; border-radius:50%;
      border:2px solid rgba(240,201,107,.55); animation:auto-wave 1.6s ease-out infinite; }
    @keyframes auto-wave { 0%{transform:scale(1); opacity:.75} 100%{transform:scale(1.45); opacity:0} }

    @media (prefers-reduced-motion:reduce){
      #auto-btn.on .ring, #auto-btn.on::after { animation:none; }
    }`;
    document.head.appendChild(st);
  }

  function layer(){ return document.getElementById('wrap') || document.body; }

  /* ---------------- 우측 버튼 정렬대 ----------------
     가방·인물·AUTO를 각 모듈이 따로 절대배치했더니, 세로로 든 휴대폰처럼
     화면이 짧아지면 서로 겹쳤다(실제로 겹쳤다). 하나의 세로 정렬대에
     담아 간격을 CSS가 지키게 한다. 먼저 만드는 모듈이 스타일도 넣는다. */
  function dock(){
    const L = document.getElementById('wrap') || document.body;
    let d = document.getElementById('side-dock');
    if (!d){
      d = document.createElement('div');
      d.id = 'side-dock';
      const st = document.createElement('style');
      st.textContent = `
      /* 세로로 든 휴대폰에서는 게임 화면 높이가 375px밖에 안 된다.
         가운데 정렬로 두면 위로는 미니맵, 아래로는 행동 버튼과 겹친다
         (둘 다 실제로 겹쳤다). 미니맵 바로 아래에서 시작해 아래로 쌓는다. */
      #side-dock { position:absolute; z-index:24; right:calc(10px + env(safe-area-inset-right));
        top:calc(128px + env(safe-area-inset-top)); display:flex; flex-direction:column;
        align-items:center; gap:5px; pointer-events:none; }
      #side-dock > * { pointer-events:auto; position:static !important;
        top:auto !important; right:auto !important; bottom:auto !important;
        transform:none !important; margin:0 !important; }
      #side-dock > *:active { transform:scale(.94) !important; }`;
      document.head.appendChild(st);
      L.appendChild(d);
    }
    return d;
  }



  function mount(){
    // 처음부터 열려 있다. 한때 양반(16)에 잠가 뒀었는데, 걷는 게 답답한 사람에게
    // 열다섯 판을 걷게 하는 건 진입 장벽일 뿐이다. 배우는 것(대사·퀴즈)은
    // 자동 이동으로도 건너뛰지 못하므로 잠글 이유가 없다.
    css();
    if (document.getElementById('auto-btn')) return;
    const b = document.createElement('button');
    b.id = 'auto-btn';
    // 순환 화살표 — 꼬리를 문 두 개의 호에 화살촉을 달았다
    b.innerHTML =
      '<span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M20.4 13.2a8.5 8.5 0 0 1-14.3 4.4"/>' +
      '<path d="M3.6 10.8a8.5 8.5 0 0 1 14.3-4.4"/>' +
      '<path d="M17.4 2.6v4.2h-4.2"/>' +
      '<path d="M6.6 21.4v-4.2h4.2"/>' +
      '</svg></span><span class="lbl">AUTO</span>';
    b.onclick = (e) => { e.stopPropagation(); toggle(); };
    b.style.order = '3';
    dock().appendChild(b);
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
      if (unreachable.has('npc:' + n.id)) continue;   // 가 봤는데 못 닿은 곳
      let key = null;
      try { key = Stage.keyFor(n.id); } catch(e){}
      if (!key) continue;
      const seen = (typeof seenDialogKeys !== 'undefined') && seenDialogKeys.has(key);
      if (!seen) return { x:n.x, y:n.y, kind:'npc', id:n.id };
    }
    for (let i = 0; i < (z.exits || []).length; i++){
      if (unreachable.has('exit:' + i)) continue;
      const r = z.exits[i].rect;
      return { x:(r.x0 + r.x1) / 2, y:(r.y0 + r.y1) / 2, kind:'exit', idx:i };
    }
    return null;
  }

  /* ---------------- 길 찾기 ----------------
     배리어를 피해야 하므로 canStand로 격자 BFS를 돌린다. 목표가 바뀔 때만
     계산하고, 결과를 웨이포인트로 들고 간다(매 프레임 돌리면 무겁다). */
  /* 지금 목표를 "이 구역에서는 못 닿는다"고 적어 둔다. 다음 pickGoal이
     건너뛴다. 구역이 바뀌면 잊으므로, 되돌아오면 다시 해 본다. */
  function markUnreachable(){
    if (!goal) return;
    if (goal.kind === 'npc' && goal.id != null) unreachable.add('npc:' + goal.id);
    else if (goal.kind === 'exit' && goal.idx != null) unreachable.add('exit:' + goal.idx);
  }

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

    if (World.zone !== lastZone){
      lastZone = World.zone; path = []; goal = null;
      unreachable = new Set();     // 구역이 바뀌면 다시 다 해 본다
    }

    if (!goal){
      goal = pickGoal();
      if (!goal){ stop(); return; }
      goalKind = goal.kind;
      path = findPath(World.px, World.py, goal.x, goal.y);
      // 길이 아예 안 나오면 그 목표는 접고 다음 목표로 — 멈추지 않는다
      if (!path.length){ markUnreachable(); goal = null; return; }
    }

    // 도착 판정
    const dGoal = Math.hypot(goal.x - World.px, goal.y - World.py);
    if (goalKind === 'npc' && dGoal < REACH_NPC){
      World.stick.dx = 0; World.stick.dy = 0;
      World.checkNpc();
      // 대화창만 열어 준다. Auto 자체는 끄지 않는다 — 대사·문제가 끝나면
      // (World.paused가 풀리면) 다음 목표를 스스로 찾아 다시 걷는다.
      // 끄고 싶으면 사람이 단추를 눌러야 한다("내가 끄지 않는 한 계속").
      if (World.nearNpc){ path = []; goal = null; Stage.interact(); }
      else { path = []; goal = null; }
      return;
    }

    // 다음 웨이포인트로
    while (path.length && Math.hypot(path[0][0] - World.px, path[0][1] - World.py) < REACH_PT) path.shift();
    if (!path.length){
      // 길이 끝났는데 아직 52까지 못 붙었다 — 뒤가 막힌 자리라 더는 못 간다.
      // 그래도 말이 닿는 거리면 여기서 건다. 안 그러면 같은 길을 무한히 다시 찾는다.
      if (goalKind === 'npc' && dGoal < TALK_RANGE){
        World.stick.dx = 0; World.stick.dy = 0;
        World.checkNpc();
        if (World.nearNpc){ path = []; goal = null; Stage.interact(); return; }
      }
      // 길 끝까지 갔는데도 말이 안 닿는다 — 배리어에 갇힌 목표다.
      // 접고 다음 목표로 간다(예전에는 여기서 같은 목표를 다시 골라
      //  영원히 제자리였다 — "auto를 켜도 못 지나가네").
      markUnreachable();
      goal = null; return;
    }

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
