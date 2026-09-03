/* ============ 배지 시스템 (전 챕터 + 챕터 목록 화면 공용) ============
   localStorage에 저장되고, 챕터 완주·인연 재회 등 다양한 곳에서
   Badges.earn()으로 준다. 챕터 목록 화면(index.html)의 배지함에서
   전체 목록을 보여준다. 이 파일 하나를 모든 챕터 + index.html이
   똑같이 불러 쓴다(assets/map/map_component.js와 같은 방식). */
// window.Badges로 명시해서 대입한다 — 최상위 const/let 선언은 window의
// 프로퍼티가 되지 않으므로(전 챕터에서 `if (window.Badges)`로 존재를
// 확인하는 방어 코드를 쓰고 있어, const로 선언하면 그 확인이 항상
// false가 되어버린다 — 실제로 이 때문에 배지가 전혀 안 쌓이는 버그가
// 났었다).
window.Badges = {
  STORAGE_KEY: 'khg_badges',
  load(){
    try { return JSON.parse(localStorage.getItem(Badges.STORAGE_KEY) || '{}'); }
    catch(e){ return {}; }
  },
  has(id){ return !!Badges.load()[id]; },
  earn(id, meta){
    if (!id || Badges.has(id)) return false;
    try {
      const all = Badges.load();
      all[id] = Object.assign({ at: Date.now() }, meta || {});
      localStorage.setItem(Badges.STORAGE_KEY, JSON.stringify(all));
    } catch(e){}
    // 챕터 안에서 획득했다면(playFanfare가 있는 화면) 바로 알려준다.
    if (typeof playFanfare === 'function'){
      const def = BADGE_DEFS[id];
      playFanfare('<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l4 6 4-6"/><circle cx="12" cy="15" r="6"/><circle cx="12" cy="15" r="2.5"/></svg> 배지 획득: ' + (def ? def.name : id));
    }
    return true;
  },
  count(){ return Object.keys(Badges.load()).length; },
  clear(){ try { localStorage.removeItem(Badges.STORAGE_KEY); } catch(e){} },

  /* 누적 정답 수 — 챕터 안 퀴즈든 기출문제 풀이든, 문제 하나를 맞힐 때마다
     +1. 한 판을 잘했는지가 아니라 "그동안 꾸준히 쌓아온 실력"을 보여주는
     숫자라 리셋되지 않고 계속 쌓인다(스트릭과는 다른 종류의 성취감). */
  CORRECT_KEY: 'khg_correct_count',
  correctCount(){
    try { return parseInt(localStorage.getItem(Badges.CORRECT_KEY) || '0', 10) || 0; }
    catch(e){ return 0; }
  },
  addCorrect(){
    let n = Badges.correctCount() + 1;
    try { localStorage.setItem(Badges.CORRECT_KEY, String(n)); } catch(e){}
    if (n >= 50) Badges.earn('correct_50');
    if (n >= 200) Badges.earn('correct_200');
    if (n >= 500) Badges.earn('correct_500');
    return n;
  }
};

/* 인연(재회) 플래그 — 배지 자체는 아니고 "이 사람을 만났다/도왔다"는
   가벼운 표시. 다른(대개 나중) 챕터에서 그 인연의 결실로 배지가 된다.
   예: ch2b에서 농부를 만나면 Bonds.set('nonong') → ch4에서 그 손자뻘
   호방을 만났을 때 Bonds.has('nonong')이면 특별한 대사+배지가 열린다. */
window.Bonds = {
  STORAGE_KEY: 'khg_bonds',
  load(){
    try { return JSON.parse(localStorage.getItem(Bonds.STORAGE_KEY) || '{}'); }
    catch(e){ return {}; }
  },
  has(id){ return !!Bonds.load()[id]; },
  set(id){
    try {
      const all = Bonds.load();
      all[id] = true;
      localStorage.setItem(Bonds.STORAGE_KEY, JSON.stringify(all));
    } catch(e){}
  },
  clear(){ try { localStorage.removeItem(Bonds.STORAGE_KEY); } catch(e){} }
};

/* 배지 도감(챕터 완주 배지 제외). 챕터 완주 배지는 index.html이 ERAS
   데이터로 직접 만들어 쓰므로(제목·화 번호가 이미 거기 있음) 여기엔
   안 담는다 — 여기엔 그 외의 배지(인연 등)만 정의한다. */
const BADGE_DEFS = {
  bond_nonong: { name: '잊지 않은 은혜', icon: 'assets/icons/badge_bond_nonong.png',
    desc: '들녘에서 만난 늙은 농부와의 인연이, 세월이 지나 그 손자뻘 되는 이에게 닿았습니다.' },
  streak_3: { name: '사흘의 시작', icon: 'assets/icons/badge_streak_3.png', desc: '3일 연속 학습 — 이제 막 리듬이 붙기 시작했습니다.' },
  streak_7: { name: '이레의 다짐', icon: 'assets/icons/badge_streak_7.png', desc: '7일 동안 하루도 거르지 않고 역사와 만났습니다.' },
  streak_30: { name: '서른 밤의 약속', icon: 'assets/icons/badge_streak_30.png', desc: '30일 연속 학습 — 한 달을 꼬박 역사와 함께했습니다.' },
  streak_100: { name: '백일의 기록', icon: 'assets/icons/badge_streak_100.png', desc: '100일 연속 학습 — 습관을 넘어 삶의 일부가 되었습니다.' },
  exam_perfect: { name: '만점 급제', icon: 'assets/icons/badge_exam_perfect.png', desc: '기출변형 풀이에서 단 한 문제도 틀리지 않았습니다.' },
  exam_allera: { name: '전 시대를 통달하다', icon: 'assets/icons/badge_exam_allera.png', desc: '아홉 시대 모두 기출변형 풀이를 마쳤습니다.' },
  all_chapters: { name: '시간여행 완주', icon: 'assets/icons/badge_all_chapters.png', desc: '타임슬립 한국사, 서른여섯 화를 모두 마쳤습니다.' },
  correct_50: { name: '처음 세운 탑', icon: 'assets/icons/badge_correct_50.png', desc: '문제 50개를 맞혔습니다 — 작은 답들이 쌓여 탑이 되기 시작했습니다.' },
  correct_200: { name: '흔들리지 않는 실력', icon: 'assets/icons/badge_correct_200.png', desc: '문제 200개를 맞혔습니다 — 이제 웬만해선 헷갈리지 않습니다.' },
  correct_500: { name: '역사를 꿰뚫다', icon: 'assets/icons/badge_correct_500.png', desc: '문제 500개를 맞혔습니다 — 한 시대를 통째로 꿰고 있다는 뜻입니다.' },
};
