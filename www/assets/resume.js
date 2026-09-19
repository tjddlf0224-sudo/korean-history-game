/* ============ 이어서 하기 — 마지막 목표가 있던 구역에서 다시 선다 (2026-09-19) ============

   왜
   - 성일님: "선사시대 챕터 하다가 중간에 끄고 다시 돌아와서 챕터를 할 때, 처음
     뗀석기 사냥꾼이 아니라 부여 사람이랑 얘기하는 거까지 했으면 거기서부터
     시작하게끔." 지금은 챕터를 다시 열면 늘 첫 구역 첫 자리에서 시작한다.

   어떻게
   - 대화를 **끝까지 마칠 때마다** 그 키를 이 기기에 남긴다(khg_progress,
     챕터 파일별). 새로 열 때 그 키들을 doneDialogKeys(또는 옛 챕터는
     seenDialogKeys)에 미리 채워 넣고, "다음 목표" 순서(GOAL_ORDER)를 앞에서부터
     훑어 아직 안 끝낸 첫 사람이 있는 **구역**으로 곧장 세운다.
   - 그 구역의 정확한 자리(spawn)로 세운다 — 이미 그 구역에 들어올 때 쓰는,
     걸어서 닿는 게 확인된 자리다. 임의 좌표를 새로 잡지 않는다.
   - 같은 구역 안에서 더 가까이 세우지는 않는다(구역을 몇 번씩 다시 거치는
     큰 수고만 던다 — 좁은 한 구역 안에서 걷는 정도는 남겨 둔다).
   - 이미 다 끝냈으면(다음 목표가 없으면) 손대지 않는다 — 원래 자리 그대로.

   khg_progress = { '<챕터 파일>': ['키', …] } — khg_로 시작해 계정 저장(save.js)에도 실린다.

   붙이는 법: 각 챕터 <head>의 chapterlock.js 뒤, 본문 스크립트(doneDialogKeys 등)보다 앞.
*/
window.Resume = (function(){
  const KEY = 'khg_progress';

  function chapterFile(){ return location.pathname.split('/').pop() || ''; }

  function loadAll(){
    try { const v = JSON.parse(localStorage.getItem(KEY)); return (v && typeof v === 'object') ? v : {}; }
    catch(e){ return {}; }
  }

  /* 지금 챕터에서 끝낸 것으로 알려진 키들 */
  function load(){
    const arr = loadAll()[chapterFile()];
    return Array.isArray(arr) ? arr : [];
  }

  /* 대화 하나가 끝났을 때(또는 옛 챕터는 열렸을 때) 이 키를 남긴다 */
  function mark(key){
    if (!key) return;
    try {
      const all = loadAll();
      const c = chapterFile();
      const arr = Array.isArray(all[c]) ? all[c] : [];
      if (arr.indexOf(key) < 0){ arr.push(key); all[c] = arr; localStorage.setItem(KEY, JSON.stringify(all)); }
    } catch(e){}
  }

  /* 챕터를 새로 열 때 한 번 — 아직 안 끝낸 첫 목표가 있는 구역으로 World를 세운다.
     order: GOAL_ORDER([id,label] 배열) 또는 id 문자열 배열.
     doneSet: 끝난 것으로 볼 Set(doneDialogKeys 또는 seenDialogKeys).
     keyFor(id): 그 사람의 지금 대화 키. ZONES: 구역별 npcs·spawn을 가진 그 챕터의 ZONES. */
  function resumeZone(World, ZONES, order, doneSet, keyFor){
    if (!World || !ZONES || !order || !doneSet) return;
    function zoneOf(id){
      for (const zid in ZONES) if ((ZONES[zid].npcs || []).some(n => n.id === id)) return zid;
      return null;
    }
    for (const row of order){
      const id = Array.isArray(row) ? row[0] : row;
      let k = null;
      try { k = keyFor(id); } catch(e){}
      if (!k || doneSet.has(k)) continue;
      const zid = zoneOf(id);
      if (!zid || zid === World.zone) return;    // 없거나 이미 그 구역이면 손대지 않는다
      const sp = ZONES[zid].spawn;
      if (!sp) return;
      World.zone = zid; World.px = sp.x; World.py = sp.y;
      return;
    }
  }

  return { load, mark, resumeZone };
})();
