#!/usr/bin/env python3
"""챕터마다 '처음 시작 자리'에서 실제로 걸어서 갈 수 있는 곳만 따라가며 검사한다.

왜 (2026-09-27): 기존 검사들은 구역마다 시작점 + '다른 구역에서 넘어올 때 내리는 자리'를
모두 출발점으로 삼았다. 그러면 A→B 출구가 벽에 막혀 있어도, B→A로 되돌아올 때 내리는
자리가 벽 너머에 있으면 그 벽 너머가 '갈 수 있는 곳'으로 잡혀 문제가 가려진다(정주성
세도 구역이 실제로 그랬다 — 성벽이 통째로 막혀 챕터를 못 끝내는데 검사는 통과).
여기서는 챕터 시작 구역·시작 자리에서만 출발해, 실제로 밟은 출구를 통해서만 다른 구역을
연다(warpTo로 옮겨 주는 곳은 WARPS에 적어 둔다).

규칙은 게임과 같다: 발자국 pad 10(네 귀퉁이), 화면 가장자리 6px, NPC 둘레 34px는 못 섬,
출구는 주인공 좌표가 사각형 안에 들어가면 넘어간다. NPC는 48px 안, 유물은 128px 안.
실행: cd www && python3 assets/tools/check_zone_graph.py   (node 필요)"""
import json, os, re, subprocess, sys
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.dirname(os.path.dirname(HERE))
W, H, PAD, ST = 1376, 768, 10, 8
# 출구가 아니라 연출이 옮겨 주는 곳: (챕터, 출발 구역) → [(도착 구역, x, y)]
WARPS = {('ilje1.html', 'tapgol'): [('seodaemun', 690, 350)],
         ('ilje1.html', 'seodaemun'): [('tapgol', 688, 470)]}

EXTRACT = r"""
const fs=require('fs'); const out={};
for (const f of process.argv.slice(2)){
  const t=fs.readFileSync(f,'utf8'); const i=t.indexOf('const ZONES = {'); if(i<0) continue;
  let s=t.indexOf('{',i),d=0,j=s,str=null,esc=false;
  for(;j<t.length;j++){const c=t[j],n=t[j+1];
    if(str){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===str)str=null;continue;}
    if(c==='/'&&n==='/'){j=t.indexOf('\n',j);continue;}
    if(c==='/'&&n==='*'){j=t.indexOf('*/',j)+1;continue;}
    if(c==='"'||c==="'"||c==='`'){str=c;continue;}
    if(c==='{')d++;else if(c==='}'){d--;if(d===0)break;}}
  const BG_W=1376,BG_H=768; try{ out[f]=eval('('+t.slice(s,j+1)+')'); }catch(e){ out[f]={__err:String(e)}; }
  const m=t.match(/zone:\s*'(\w+)',\s*px:/); out[f].__start=m?m[1]:null;
}
console.log(JSON.stringify(out));
"""

def main():
    files = sorted(f for f in os.listdir(WWW) if f.endswith('.html') and not f.startswith('_'))
    js = os.path.join('/tmp', 'khg_extract_zones.js'); open(js, 'w').write(EXTRACT)
    data = json.loads(subprocess.check_output(['node', js] + [os.path.join(WWW, f) for f in files]))
    bad = 0
    for path, zones in data.items():
        f = os.path.basename(path)
        if '__err' in zones or not zones.get('__start'): continue
        start = zones.pop('__start')
        seen = {z: set() for z in zones}
        todo = deque([(start, zones[start]['spawn']['x'], zones[start]['spawn']['y'])])
        used_exit = set()
        while todo:
            zn, sx, sy = todo.popleft(); z = zones[zn]
            rects = [(b['x0'], b['y0'], b['x1'], b['y1']) for b in z['barriers']]; npcs = z.get('npcs', [])
            blocked = lambda x, y: x < 6 or y < 6 or x >= W-6 or y >= H-6 or any(a <= x <= c and b <= y <= e for a, b, c, e in rects)
            stand = lambda x, y: all(not blocked(x+dx, y+dy) for dx in (-PAD, PAD) for dy in (-PAD, PAD)) and all((n['x']-x)**2+(n['y']-y)**2 >= 34*34 for n in npcs)
            # 내리는 자리 근처(40px)에서 설 수 있는 칸
            best = None
            for x in range(sx-40, sx+41, ST):
                for y in range(sy-40, sy+41, ST):
                    if stand(x, y) and (best is None or (x-sx)**2+(y-sy)**2 < best[0]): best = ((x-sx)**2+(y-sy)**2, x, y)
            if not best:
                print(f'✗ {f}#{zn}: 내리는 자리 ({sx},{sy}) 근처에 설 곳이 없음'); bad += 1; continue
            q = deque([(best[1], best[2])]); S = seen[zn]; S.add((best[1], best[2]))
            while q:
                x, y = q.popleft()
                for dx, dy in ((ST, 0), (-ST, 0), (0, ST), (0, -ST)):
                    n = (x+dx, y+dy)
                    if n not in S and 0 <= n[0] < W and 0 <= n[1] < H and stand(*n): S.add(n); q.append(n)
            for k, e in enumerate(z.get('exits') or []):
                r = e['rect']
                if (zn, k) in used_exit: continue
                if any(r['x0'] <= x <= r['x1'] and r['y0'] <= y <= r['y1'] for x, y in S):
                    used_exit.add((zn, k))
                    if e['to'] in zones: todo.append((e['to'], e['spawn']['x'], e['spawn']['y']))
            for (tz, wx, wy) in WARPS.get((f, zn), []):
                if (zn, 'w'+tz) not in used_exit: used_exit.add((zn, 'w'+tz)); todo.append((tz, wx, wy))
        for zn, z in zones.items():
            S = seen[zn]
            if not S: print(f'✗ {f}#{zn}: 구역에 아예 못 들어감'); bad += 1; continue
            near = lambda px, py, rad: any((x-px)**2+(y-py)**2 <= rad*rad for x, y in S)
            for n in z.get('npcs', []):
                if not near(n['x'], n['y'], 48): print(f"✗ {f}#{zn}: NPC {n.get('name', n['id'])} 앞에 설 자리 없음"); bad += 1
            for s in z.get('spots') or []:
                if not near(s['x'], s['y'], 128): print(f"✗ {f}#{zn}: 유물 {s['id']} 못 주움"); bad += 1
            for k, e in enumerate(z.get('exits') or []):
                if (zn, k) not in used_exit: print(f"✗ {f}#{zn}: 출구 → {e['to']} 에 못 들어감"); bad += 1
                sp = e['spawn']; r2 = None
                tz = zones.get(e['to'])
                if tz:
                    for e2 in tz.get('exits') or []:
                        rr = e2['rect']
                        if rr['x0'] <= sp['x'] <= rr['x1'] and rr['y0'] <= sp['y'] <= rr['y1']:
                            print(f"✗ {f}#{zn}→{e['to']}: 내리는 자리 ({sp['x']},{sp['y']})가 도착 구역의 출구 안이라 곧바로 다시 넘어감"); bad += 1
    print('문제 없음' if not bad else f'문제 {bad}건')
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
