/* ============ 스트릭(연속 학습) 시스템 — 전 챕터 + 챕터 목록 화면 공용 ============
   badges.js와 같은 패턴: localStorage에 저장, window.Streak로 어디서든 접근.
   "출석"이 아니라 "챕터 완주 / 기출문제 풀이 완료" 같은 실제 학습 행동에만
   checkIn()을 걸어서, 그냥 메뉴만 열어도 스트릭이 느는 일이 없게 한다.

   광고 결합 지점(StreakAds)은 함수만 분리해 뒀다 — 지금은 광고 없이 즉시
   지급하는 목업이고, Capacitor+AdMob 전환 시 이 안쪽만 실제 보상형 광고
   SDK 호출로 바꾸면 된다(무엇을 언제 왜 주는지는 이미 정해져 있음). */
window.Streak = {
  STORAGE_KEY: 'khg_streak',

  load(){
    try {
      const raw = JSON.parse(localStorage.getItem(Streak.STORAGE_KEY));
      if (raw && typeof raw === 'object') return raw;
    } catch(e){}
    return { count: 0, longest: 0, lastDate: null, freezes: 0 };
  },
  _save(s){ try { localStorage.setItem(Streak.STORAGE_KEY, JSON.stringify(s)); } catch(e){} },

  _today(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  _daysBetween(a, b){ return Math.round((new Date(b) - new Date(a)) / 86400000); },

  /* 챕터를 완주했거나 기출문제 세션을 끝냈을 때 호출한다. 오늘 이미
     체크인했으면 아무 일도 안 하고(하루에 여러 번 깨도 +1만), 어제
     이후 하루 이상 비었으면 프리즈로 메꿀 수 있는 만큼 메꾸고, 그래도
     모자라면 스트릭이 1로 리셋된다. */
  checkIn(){
    const s = Streak.load();
    const today = Streak._today();
    if (s.lastDate === today) return { changed:false, broken:false, s };

    let broken = false;
    if (!s.lastDate){
      s.count = 1;
    } else {
      const gap = Streak._daysBetween(s.lastDate, today);
      if (gap === 1){
        s.count += 1;
      } else if (gap > 1){
        const missed = gap - 1;
        if (s.freezes >= missed){
          s.freezes -= missed;
          s.count += 1;
        } else {
          s.count = 1;
          broken = true;
        }
      }
      // gap <= 0(기기 시계 이상 등)은 그냥 오늘 날짜만 갱신하고 넘어간다.
    }
    s.longest = Math.max(s.longest || 0, s.count);
    s.lastDate = today;
    Streak._save(s);
    if (window.Badges){
      if (s.count >= 3) Badges.earn('streak_3');
      if (s.count >= 7) Badges.earn('streak_7');
      if (s.count >= 30) Badges.earn('streak_30');
      if (s.count >= 100) Badges.earn('streak_100');
    }
    return { changed:true, broken, s };
  },

  /* 어제까지는 이어져 있었는데 오늘 아직 활동이 없어 "오늘 안 하면
     끊기는" 상태인지 — 챕터 목록 화면에서 경고 표시용. */
  isAtRisk(){
    const s = Streak.load();
    if (!s.lastDate || !s.count) return false;
    return Streak._daysBetween(s.lastDate, Streak._today()) >= 1;
  },

  addFreeze(n){
    const s = Streak.load();
    s.freezes = (s.freezes || 0) + (n || 1);
    Streak._save(s);
    return s.freezes;
  },

  clear(){ try { localStorage.removeItem(Streak.STORAGE_KEY); } catch(e){} },
};

/* 스트릭 프리즈를 얻는 두 길 — 보상형 광고, 또는 금.
   예전엔 광고 SDK 연결 전 임시 코드라 "광고 보고 받기" 단추가 **광고 없이 바로 지급**했다
   (광고 수익이 새고, 문구도 거짓이었다). 이제 광고는 Ads.rewarded()를 끝까지 봐야 준다.
   금값은 한 화 수입(약 140)보다 조금 높게 잡았다 — 쌓이기만 하던 금의 쓸 곳이다.
   프리즈는 최대 MAX_FREEZE개까지만 쟁여 둔다(무한히 사 두면 스트릭이 의미를 잃는다). */
window.StreakAds = {
  MAX_FREEZE: 3,
  GOLD_COST: 200,

  canHold(){ return (Streak.load().freezes || 0) < StreakAds.MAX_FREEZE; },

  /* 광고를 끝까지 보면 프리즈 1개. 준 개수 또는 null(못 받음) */
  async byAd(){
    if (!StreakAds.canHold()) return null;
    const ok = window.Ads ? await Ads.rewarded() : false;
    if (!ok) return null;
    return Streak.addFreeze(1);
  },

  /* 금으로 프리즈 1개. 준 개수 또는 null(금 부족·가득) */
  byGold(){
    if (!StreakAds.canHold()) return null;
    if (!window.Gold || !Gold.spend(StreakAds.GOLD_COST)) return null;
    return Streak.addFreeze(1);
  },
};
