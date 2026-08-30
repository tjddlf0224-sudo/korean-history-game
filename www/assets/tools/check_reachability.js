/* 배포 전 도달가능성 검사 — 36개 챕터 전부에 대해, 실제 게임의 canStand()
   판정을 그대로 옮겨서 스폰 지점부터 BFS로 걸어 보고
     (1) 모든 NPC에게 말을 걸 수 있는지
     (2) 모든 출구에 실제로 들어갈 수 있는지
     (3) 스폰 지점 자체가 서 있을 수 있는 칸인지
   를 확인한다. "배리어가 실제 물체보다 크게 잡혀서 멀쩡한 마당이 막혀
   있던" 류의 버그(서경·청해진에서 실제로 발생)를 눈대중 없이 잡아내는 게 목적.

   실행: node www/assets/tools/check_reachability.js
*/
const fs = require('fs');
const path = require('path');

const WWW = path.join(__dirname, '..', '..');
const SKIP = new Set(['index.html', '_smoke.html', 'ch0_phaser.html', 'exam_practice.html']);

/* 게임 쪽 상수·판정과 반드시 같아야 하는 값들 (chapter HTML에서 그대로 읽어옴) */
function extractConsts(src){
  const m = src.match(/const BG_W = (\d+), BG_H = (\d+), ZOOM = ([\d.]+);/);
  if (!m) return null;
  return { BG_W: +m[1], BG_H: +m[2], ZOOM: +m[3] };
}

/* `const ZONES = { ... };` 블록만 중괄호 균형으로 잘라내 그대로 평가한다.
   (정규식으로 통째로 잡으려 하면 대사 안의 중괄호·따옴표에 걸려 깨진다) */
function extractZones(src, C){
  const start = src.indexOf('const ZONES = {');
  if (start < 0) return null;
  const open = src.indexOf('{', start);
  let depth = 0, i = open, inStr = null, esc = false;
  for (; i < src.length; i++){
    const c = src[i];
    if (inStr){
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}'){ depth--; if (depth === 0) { i++; break; } }
  }
  const body = src.slice(open, i);
  try {
    // 일부 챕터는 ZONES 안에서 BG_W/BG_H를 직접 참조하므로 같이 넘겨준다.
    // eslint-disable-next-line no-new-func
    return new Function('BG_W', 'BG_H', 'ZOOM', 'return (' + body + ');')(C.BG_W, C.BG_H, C.ZOOM);
  } catch (e){
    return { __error: e.message };
  }
}

/* 게임의 isBarrierPx()/canStand()를 그대로 옮긴 것. 여기가 어긋나면 검사가
   의미 없어지므로, 챕터 파일 쪽 로직을 고치면 이쪽도 같이 고쳐야 한다. */
function makeCanStand(zone, C){
  const barriers = zone.barriers || [];
  const npcs = zone.npcs || [];
  function isBarrierPx(x, y){
    if (x < 6 || y < 6 || x >= C.BG_W - 6 || y >= C.BG_H - 6) return true;
    for (const b of barriers){
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return true;
    }
    return false;
  }
  return function canStand(x, y, ignoreNpcs){
    const pad = 16;
    if (isBarrierPx(x - pad, y - pad) || isBarrierPx(x + pad, y - pad) ||
        isBarrierPx(x - pad, y + pad) || isBarrierPx(x + pad, y + pad)) return false;
    if (!ignoreNpcs){
      for (const n of npcs){ if (Math.hypot(n.x - x, n.y - y) < 34) return false; }
    }
    return true;
  };
}

/* 스폰에서 시작해 8px 격자로 BFS. NPC는 몸으로 막고 서 있으므로 "이동" 판정에는
   NPC 충돌을 넣되, 도달 여부를 볼 때는 NPC 바로 옆 칸까지 갈 수 있으면 된다. */
const STEP = 8;
function floodFill(zone, C, sx, sy){
  const canStand = makeCanStand(zone, C);
  const key = (x, y) => x + ',' + y;
  const seen = new Set();
  const start = [Math.round(sx / STEP) * STEP, Math.round(sy / STEP) * STEP];
  if (!canStand(start[0], start[1])) {
    // 스폰이 정확히 막혀 있으면 근처에서 설 수 있는 칸을 찾아 시작(게임에서도
    // 첫 프레임엔 그냥 서 있다가 조금 움직이면 빠져나오는 경우가 있다)
    let found = null;
    for (let r = STEP; r <= 64 && !found; r += STEP){
      for (let dx = -r; dx <= r && !found; dx += STEP){
        for (let dy = -r; dy <= r && !found; dy += STEP){
          const nx = start[0] + dx, ny = start[1] + dy;
          if (canStand(nx, ny)) found = [nx, ny];
        }
      }
    }
    if (!found) return { seen, canStand, spawnBlocked: true, spawnRescued: false };
    start[0] = found[0]; start[1] = found[1];
    var rescued = true;
  }
  const q = [start];
  seen.add(key(start[0], start[1]));
  while (q.length){
    const [x, y] = q.shift();
    for (const [dx, dy] of [[STEP,0],[-STEP,0],[0,STEP],[0,-STEP]]){
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx > C.BG_W || ny > C.BG_H) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      if (!canStand(nx, ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return { seen, canStand, spawnBlocked: !!rescued, spawnRescued: !!rescued };
}

/* NPC 상호작용 반경: 게임에서 checkNpc()가 쓰는 거리보다 넉넉히 잡되,
   "옆 칸까지 갈 수 있으면 말은 걸 수 있다"는 기준으로 48px를 쓴다. */
const NPC_REACH = 48;

const results = [];
const files = fs.readdirSync(WWW).filter(f => f.endsWith('.html') && !SKIP.has(f)).sort();

for (const f of files){
  const src = fs.readFileSync(path.join(WWW, f), 'utf8');
  const C = extractConsts(src);
  const problems = [];
  if (!C){ problems.push('BG_W/BG_H/ZOOM 상수를 찾지 못함'); results.push({ f, problems }); continue; }
  const ZONES = extractZones(src, C);

  if (!ZONES){ problems.push('ZONES 정의를 찾지 못함'); results.push({ f, problems }); continue; }
  if (ZONES.__error){ problems.push('ZONES 평가 실패: ' + ZONES.__error); results.push({ f, problems }); continue; }

  for (const zid of Object.keys(ZONES)){
    const zone = ZONES[zid];
    if (!zone) continue;

    /* 시작 지점: 그 구역 자체의 spawn이 원칙이지만, 출구로만 들어가는 구역은
       zone.spawn이 아예 없다(정상). 그 경우 이 구역으로 들어오는 출구의
       도착 지점을 시작점으로 삼아야 실제 플레이와 같은 판정이 된다. */
    let entry = zone.spawn, entryDesc = 'spawn';
    if (!entry){
      for (const oz of Object.keys(ZONES)){
        const ex = (ZONES[oz].exits || []).find(e => e.to === zid && e.spawn);
        if (ex){ entry = ex.spawn; entryDesc = `${oz}에서 들어오는 출구 '${ex.label}'의 도착점`; break; }
      }
    }
    if (!entry){ problems.push(`[${zid}] spawn도 없고 이 구역으로 들어오는 출구도 없음 — 도달 불가능한 구역`); continue; }

    const { seen, canStand, spawnRescued } = floodFill(zone, C, entry.x, entry.y);
    if (spawnRescued) problems.push(`[${zid}] 시작 지점(${entry.x},${entry.y}, ${entryDesc})이 막힌 칸 — 근처로 밀어내야 겨우 시작됨`);
    if (seen.size < 30) problems.push(`[${zid}] 걸어다닐 수 있는 공간이 거의 없음(${seen.size}칸) — 배리어가 지도를 통째로 덮었을 가능성`);

    // NPC 도달 확인
    for (const n of (zone.npcs || [])){
      let ok = false;
      for (const k of seen){
        const [x, y] = k.split(',').map(Number);
        if (Math.hypot(n.x - x, n.y - y) <= NPC_REACH) { ok = true; break; }
      }
      if (!ok) problems.push(`[${zid}] NPC '${n.name || n.id}'(${n.x},${n.y})에게 갈 수 없음`);
    }

    // 출구 도달 확인 — 출구 사각형 안의 칸 중 하나라도 BFS에 걸려야 한다
    for (const e of (zone.exits || [])){
      const r = e.rect;
      let ok = false;
      for (const k of seen){
        const [x, y] = k.split(',').map(Number);
        if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1){ ok = true; break; }
      }
      if (!ok) problems.push(`[${zid}] 출구 '${e.label}'(→${e.to}) 사각형에 걸어 들어갈 수 없음 rect=${JSON.stringify(r)}`);

      // 도착지 스폰이 그 구역에서 설 수 있는 자리인지
      const dest = ZONES[e.to];
      if (!dest) { problems.push(`[${zid}] 출구 '${e.label}'의 목적지 '${e.to}' 구역이 없음`); continue; }
      if (e.spawn){
        const destCanStand = makeCanStand(dest, C);
        if (!destCanStand(e.spawn.x, e.spawn.y)){
          problems.push(`[${zid}] 출구 '${e.label}' → ${e.to} 도착 지점(${e.spawn.x},${e.spawn.y})이 막힌 칸(벽/바다 속에 떨어짐)`);
        }
      }
    }
  }
  results.push({ f, problems });
}

let fail = 0;
for (const r of results){
  if (r.problems.length){
    fail += r.problems.length;
    console.log(`\n■ ${r.f}`);
    for (const p of r.problems) console.log('   - ' + p);
  }
}
console.log(`\n검사한 챕터: ${results.length}개 / 발견된 문제: ${fail}건`);
if (!fail) console.log('■ 이상 없음 ✅');
