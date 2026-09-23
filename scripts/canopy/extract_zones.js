// 챕터 파일에서 const ZONES = {...} 를 떼어 실행해 JSON으로 뽑는다
const fs = require('fs');
const base = '/Users/yunsismac/Korean-History-Game/www/';
const out = {};
for (const f of process.argv.slice(2)){
  const t = fs.readFileSync(base + f, 'utf8');
  const i = t.indexOf('const ZONES = {');
  if (i < 0){ out[f] = {error:'no ZONES'}; continue; }
  let s = t.indexOf('{', i), d = 0, j = s, str = null, esc = false;
  for (; j < t.length; j++){
    const c = t[j], n = t[j+1];
    if (str){ if (esc) esc = false; else if (c === '\\') esc = true; else if (c === str) str = null; continue; }
    if (c === '/' && n === '/'){ j = t.indexOf('\n', j); continue; }
    if (c === '/' && n === '*'){ j = t.indexOf('*/', j) + 1; continue; }
    if (c === '"' || c === "'" || c === '`'){ str = c; continue; }
    if (c === '{') d++; else if (c === '}'){ d--; if (d === 0) break; }
  }
  const BG_W = 1376, BG_H = 768; try { out[f] = eval('(' + t.slice(s, j+1) + ')'); } catch(e){ out[f] = {error: String(e)}; }
}
console.log(JSON.stringify(out));
