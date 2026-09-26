/* ============ 챕터 단계 저장 — 나갔다 들어와도 이야기가 이어지게 ============

   왜 (2026-09-27 안드로이드 자동 플레이 점검)
   - 옛 엔진으로 만든 여섯 챕터(ch2·ch2b·ch3·ch4·ch5·ch5b)는 "몇 막째인지·누구와 끝냈는지"를
     Stage.state(메모리)에만 두고, 저장되는 건 '본 대화' 목록뿐이었다.
   - 그래서 챕터 중간에 목록으로 나갔다 오면(앱을 껐다 켜도) 막이 처음으로 돌아갔다.
     목표는 다시 "세종과 대화하기"가 되고, 사람은 대화를 처음부터 다시 해야 했으며,
     자동 이동은 '이미 본 대화'라 건너뛰어 두 구역을 끝없이 오갔다.
   - 뒤로 버튼 안내("지금까지 한 것은 그대로 남습니다")와도 어긋났다.

   하는 일
   - 페이지를 열 때 저장해 둔 Stage.state를 되살리고, 챕터가 Stage.onRestore를 두었으면 부른다
     (예: ch2 — 최만리가 이미 나타난 막이면 그 자리에 다시 세운다).
   - 바뀔 때마다(1.5초마다 비교) · 화면을 떠날 때 저장한다. 키: khg_stage_<파일명>
     (khg_ 로 시작하므로 클라우드 저장에도 같이 실린다)

   붙이는 곳: 위 여섯 챕터의 맨 끝(<body> 닫기 직전). */
(function(){
  if (typeof Stage === 'undefined' || !Stage || !Stage.state) return;
  var file = (location.pathname.split('/').pop() || '').split('?')[0];
  var KEY = 'khg_stage_' + file.replace(/\.html?$/, '');

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object'){
      for (var k in saved) if (Object.prototype.hasOwnProperty.call(Stage.state, k)) Stage.state[k] = saved[k];
      if (typeof Stage.onRestore === 'function') Stage.onRestore();
      if (typeof updateHudGoal === 'function') updateHudGoal();
    }
  } catch (e) {}

  var last = '';
  function save(){
    try {
      var s = JSON.stringify(Stage.state);
      if (s !== last){ localStorage.setItem(KEY, s); last = s; }
    } catch (e) {}
  }
  try { last = JSON.stringify(Stage.state); } catch (e) {}
  setInterval(save, 1500);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') save(); });
})();
