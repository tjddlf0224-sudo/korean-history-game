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
  /* 배지 이름 — **영문 id를 절대 화면에 내보내지 않는다.**
     예전에는 정의가 없으면 id를 그대로 띄웠다. 그래서 고인돌을 세우면
     `배지 획득: did_goindol`, 챕터를 끝내면
     `배지 획득: ch_complete_seonsa1.html` 이 떴다(실제 제보).
     정의를 빠뜨리는 일은 앞으로도 생길 수 있으니, 규칙으로 받쳐 둔다. */
  label(id){
    const def = BADGE_DEFS[id];
    if (def && def.name) return def.name;
    if (String(id).indexOf('ch_complete_') === 0) return '챕터 완주';
    return '새 배지';
  },
  earn(id, meta){
    if (!id || Badges.has(id)) return false;
    try {
      const all = Badges.load();
      all[id] = Object.assign({ at: Date.now() }, meta || {});
      localStorage.setItem(Badges.STORAGE_KEY, JSON.stringify(all));
    } catch(e){}
    // 챕터 안에서 획득했다면(playFanfare가 있는 화면) 바로 알려준다.
    if (typeof playFanfare === 'function'){
      playFanfare('<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l4 6 4-6"/><circle cx="12" cy="15" r="6"/><circle cx="12" cy="15" r="2.5"/></svg> 배지 획득: ' + Badges.label(id));
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
  /* 아래는 '해 보기'(Deed)·유물·조우로 얻는 배지들이다. 이름은 챕터에
     이미 적혀 있는 label·tag에서 가져왔다 — 새로 지어내면 챕터의 말과
     어긋난다. 그림은 지정하지 않는다(index.html이 badge_mapae.png로 받친다). */
  did_goindol: { name: '고인돌을 세운 사람',
    desc: '덮개돌 하나에 밧줄 수십 가닥. 사람을 부리는 자가 있었다는 뜻을 손으로 알았습니다.' },
  did_sunsubi: { name: '순수비를 새기다',
    desc: '진흥왕이 다녀간 자리에 비석을 세워 보았습니다.' },
  did_cheonghae: { name: '청해진의 배',
    desc: '장보고의 진에서 배를 띄워 보았습니다.' },
  did_gongsan: { name: '공산에 서다',
    desc: '왕을 살리고 죽은 이의 자리에 서 보았습니다.' },
  did_deongiswe: { name: '덩이쇠를 두드리다',
    desc: '가야의 쇠를 달궈 두드려 보았습니다.' },
  did_daewangam: { name: '대왕암을 바라보다',
    desc: '죽어서도 나라를 지키겠다던 바위섬을 바라보았습니다.' },
  did_gwageo: { name: '과거를 치르다',
    desc: '광종이 새로 연 시험에 붓을 들어 보았습니다.' },
  did_janggyeong: { name: '경판을 새기다',
    desc: '팔만 장을 새긴 그 일의 한 획을 그어 보았습니다.' },
  did_jeonmin: { name: '문서를 돌려주다',
    desc: '전민변정도감에서 빼앗긴 땅문서를 주인에게 돌렸습니다.' },
  did_byeokran: { name: '벽란도의 뱃짐',
    desc: '고려의 국제 항구에서 짐을 부려 보았습니다.' },
  did_doseong: { name: '도성의 성돌',
    desc: '한양 도성에 돌 하나를 놓아 보았습니다.' },
  did_gyemija: { name: '활자를 고르다',
    desc: '금속활자 한 알을 집어 판에 앉혀 보았습니다.' },
  did_ganui: { name: '간의대의 밤',
    desc: '별의 높이를 재어 보았습니다.' },
  did_nongsa: { name: '농사를 지어 보다',
    desc: '노농에게 배운 대로 흙을 갈아 보았습니다.' },
  did_chilsa: { name: '수령칠사',
    desc: '고을의 일곱 가지 일을 직접 보아 넘겼습니다.' },
  did_sago: { name: '실록을 말리다',
    desc: '물에 젖은 사고의 책장을 한 장씩 펴 말렸습니다.' },
  did_hyangyak: { name: '향약을 읽다',
    desc: '덕업상권·과실상규를 소리 내어 읽어 보았습니다.' },
  did_tongsinsa: { name: '통신사의 짐',
    desc: '바다를 건널 짐을 꾸려 보았습니다.' },
  did_uibyeong: { name: '의병에 이름을 올리다',
    desc: '관군이 아닌 사람들의 명부에 이름을 적었습니다.' },
  did_namhan: { name: '남한산성의 겨울',
    desc: '언 손으로 성벽을 지켜 보았습니다.' },
  did_hwaseong: { name: '화성의 돌',
    desc: '거중기로 돌을 올려 보았습니다.' },
  did_sampjeong: { name: '삼정의 장부',
    desc: '전정·군정·환곡의 장부를 들춰 보았습니다.' },
  did_cheokhwabi: { name: '척화비를 세우다',
    desc: '“화친을 말하는 자는 나라를 팔아먹는 자”를 새겼습니다.' },
  did_gunpo: { name: '군란의 쌀',
    desc: '열세 달 만에 받은 쌀에 무엇이 섞여 있었는지 보았습니다.' },
  did_jeonggang: { name: '정강을 적다',
    desc: '갑신정변의 개혁 조목을 옮겨 적어 보았습니다.' },
  did_jipgangso: { name: '집강소에 앉다',
    desc: '폐정개혁의 조목을 한 줄씩 읽어 보았습니다.' },
  did_jigye: { name: '지계를 받다',
    desc: '광무개혁의 토지 문서를 손에 쥐어 보았습니다.' },
  did_mulsan: { name: '국산품을 사다',
    desc: '“내 살림 내 것으로”를 장바구니로 겪었습니다.' },
  did_gwangbokgun: { name: '광복군에 들다',
    desc: '임시정부의 군대에 이름을 올렸습니다.' },
  did_sintak: { name: '거리에 나가다',
    desc: '신탁통치를 두고 갈린 거리를 걸어 보았습니다.' },
  did_sailgu: { name: '광장에 서다',
    desc: '사월의 광장에 서 보았습니다.' },
  did_chilsa_nambuk: { name: '남북이 함께 낸 말',
    desc: '같은 날 같은 내용이 남과 북에서 함께 나온 방송을 들었습니다.' },
  did_songpyeon: { name: '송편을 빚다',
    desc: '한가위에 손으로 반달을 만들어 보았습니다.' },
  beom_gungya: { name: '호랑이를 물리다',
    desc: '후원의 풀숲에서 물러서지 않았습니다. 잡는 것은 착호갑사의 일입니다.' },
  waejang_down: { name: '적장 앞에서',
    desc: '말이 통하지 않아도 아는 것으로 맞섰습니다.' },
  use_manpasikjeok: { name: '만파식적을 불다',
    desc: '만 개의 물결을 잠재우는 피리를 입에 대었습니다.' },
  use_gimiseoneon: { name: '독립선언서를 읽다',
    desc: '“오등은 자에 아 조선의 독립국임을 선언하노라.”' },
  use_eohakhoe: { name: '우리말을 숨기다',
    desc: '큰사전 원고를 품에 넣고 벽을 등졌습니다.' },
  fund_independence: { name: '군자금을 내다',
    desc: '영수증도 받지 않고 금붙이를 내놓았습니다.' },
  seodaemun_out: { name: '서대문을 나서다',
    desc: '갇혔던 문을 걸어 나왔습니다.' },
  journey_complete: { name: '선사에서 현대까지',
    desc: '서른여섯 화를 모두 걸어 끝까지 왔습니다.' },
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
