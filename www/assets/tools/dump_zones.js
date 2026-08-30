/* 각 챕터의 ZONES 정의를 JSON으로 뽑아낸다(파이썬 쪽 배경그림 대조 검사에서 씀).
   실행: node www/assets/tools/dump_zones.js > /tmp/zones.json */
const fs = require('fs');
const path = require('path');
const WWW = path.join(__dirname, '..', '..');
const SKIP = new Set(['index.html', '_smoke.html', 'ch0_phaser.html', 'exam_practice.html']);

function extractConsts(src){
  const m = src.match(/const BG_W = (\d+), BG_H = (\d+), ZOOM = ([\d.]+);/);
  return m ? { BG_W: +m[1], BG_H: +m[2], ZOOM: +m[3] } : null;
}
function extractZones(src, C){
  const start = src.indexOf('const ZONES = {');
  if (start < 0) return null;
  const open = src.indexOf('{', start);
  let depth = 0, i = open, inStr = null, esc = false;
  for (; i < src.length; i++){
    const c = src[i];
    if (inStr){
      if (esc){ esc = false; continue; }
      if (c === '\\'){ esc = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`'){ inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}'){ depth--; if (depth === 0){ i++; break; } }
  }
  try {
    return new Function('BG_W','BG_H','ZOOM','return (' + src.slice(open, i) + ');')(C.BG_W, C.BG_H, C.ZOOM);
  } catch (e){ return null; }
}

const out = {};
for (const f of fs.readdirSync(WWW).filter(f => f.endsWith('.html') && !SKIP.has(f)).sort()){
  const src = fs.readFileSync(path.join(WWW, f), 'utf8');
  const C = extractConsts(src);
  if (!C) continue;
  const Z = extractZones(src, C);
  if (!Z) continue;
  // 필요한 필드만 추리기(대사·아이콘 등 큰 값은 제외)
  const zones = {};
  for (const zid of Object.keys(Z)){
    const z = Z[zid];
    zones[zid] = {
      img: z.img || null,
      label: z.label || null,
      spawn: z.spawn || null,
      barriers: z.barriers || [],
      npcs: (z.npcs || []).map(n => ({ id:n.id, name:n.name, x:n.x, y:n.y })),
      exits: (z.exits || []).map(e => ({ to:e.to, label:e.label, rect:e.rect, spawn:e.spawn })),
    };
  }
  out[f] = { consts: C, zones };
}
process.stdout.write(JSON.stringify(out, null, 1));
