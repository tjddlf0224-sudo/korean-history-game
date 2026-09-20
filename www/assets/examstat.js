/* ============ 기출변형 정답률 — 시대별로 쌓아 둔다 ============

   왜 (2026-09-20, 성일님)
   - "기출변형을 풀었을 때 정답률을 기록해서, 챕터 선택 화면의 기출변형
     근처에 보이게 해 줘. 80% 넘으면 보상을 주고(기력이나 유물)."

   기출변형은 챕터가 아니라 **시대 단위**다(exam_practice.html?era=N).
   그래서 기록도 시대별로 둔다 — 목록 화면의 시대 머리에 붙은 '기출변형'
   단추 밑에 그 시대 정답률이 뜬다.

   무엇을 정답률로 치나
   - **첫 시도**만 센다. 이 화면은 틀리면 다시 고를 수 있는데, 다시 골라
     맞힌 것까지 정답으로 치면 정답률이 늘 100%가 된다.
   - 한 판이 아니라 **누적**이다. 조선 전기는 문항이 140개라 한 판을 끝까지
     다 푸는 사람이 드물다. 중간에 그만둬도 푼 만큼은 남아야 한다.

   보상 — 시대마다 한 번
   - 정답률 80% 이상이면 기력 2와 금 50. (유물은 주지 않는다. 유물은
     지도를 걸어 다니다 찾는 것이라, 문제를 풀어 받으면 그 뜻이 깨진다.)
   - 문항을 조금만 풀고 받는 것을 막으려고 최소 10문항(문항이 그보다 적은
     시대는 그 시대 문항 수)을 채워야 한다.

   기록: localStorage khg_exam_rate = { "<시대번호>": { n, c, got } }
     n=푼 문항, c=첫 시도에 맞힌 문항, got=보상 받았나
   khg_로 시작하므로 클라우드 저장(save.js)이 계정에 같이 싣는다.
*/
window.ExamStat = (function(){
  const KEY = 'khg_exam_rate';
  const GOAL = 80;                          // 보상 기준 정답률(%)
  const MIN_N = 10;                         // 이만큼은 풀어야 인정
  const REWARD = { energy: 2, gold: 50 };

  function load(){
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && typeof v === 'object') return v;
    } catch(e){}
    return {};
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }

  function get(era){
    const v = load()[String(era)];
    return v && typeof v === 'object' ? v : null;
  }

  /* 문항 하나를 풀 때마다 — ok는 '첫 시도에 맞혔나' */
  function note(era, ok){
    const all = load(), k = String(era);
    const s = all[k] || { n: 0, c: 0, got: false };
    s.n++; if (ok) s.c++;
    all[k] = s; save(all);
    return s;
  }

  /* 정답률(%) — 아직 푼 것이 없으면 null */
  function pct(era){
    const s = get(era);
    if (!s || !s.n) return null;
    return Math.round(s.c / s.n * 100);
  }

  /* 보상을 받을 때가 됐으면 주고 내용을 돌려준다. 시대마다 한 번뿐. */
  function claim(era, poolSize){
    const all = load(), k = String(era);
    const s = all[k];
    if (!s || s.got) return null;
    const need = Math.min(MIN_N, poolSize || MIN_N);
    if (s.n < need) return null;
    if (Math.round(s.c / s.n * 100) < GOAL) return null;
    s.got = true; save(all);
    if (window.Energy && Energy.add) Energy.add(REWARD.energy);
    if (window.Gold && Gold.earn) Gold.earn(REWARD.gold, '기출 정답률');
    return Object.assign({}, REWARD);
  }

  return { note, pct, get, claim, GOAL, MIN_N, REWARD };
})();
