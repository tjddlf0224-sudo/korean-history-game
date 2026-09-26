/* ============ 안드로이드 '뒤로' 버튼 ============

   왜 (2026-09-27 안드로이드 에뮬레이터 점검)
   - iOS엔 뒤로 버튼이 없어서 여태 아무 처리도 안 했다. 안드로이드에서 눌러 보니
     **아무 일도 안 일어났다** — 창을 닫지도, 목록으로 가지도, 앱을 나가지도 못했다.
   - 안드로이드 사람들은 뒤로 버튼으로 창을 닫고, 화면을 빠져나오고, 마지막엔 앱을 나간다.

   하는 일(위에서부터 먼저 걸리는 하나만)
     1. 확인창(Ask)이 떠 있으면 '취소'
     2. 닫기(✕) 단추가 보이는 창이 떠 있으면 그 단추를 누른다(맨 위에 뜬 것부터)
     3. 챕터·기출 등 다른 화면이면 "챕터 목록으로 나갈까요?" 물은 뒤 목록으로
        (게임 안 메뉴의 '챕터 목록으로 나가기'와 같다 — 진행은 원래대로 남는다)
     4. 챕터 목록이면 앱을 내린다(홈으로. 다시 누르면 그 자리로 돌아온다)

   붙이는 곳: 모든 화면 <head>, tablet.js 바로 뒤. iOS·웹에서는 아무것도 안 한다. */
(function(){
  var C = window.Capacitor;
  if (!C || !C.getPlatform || C.getPlatform() !== 'android') return;
  var App = C.Plugins && C.Plugins.App;
  if (!App || !App.addListener) return;

  var CLOSERS = '#ask-no, [id$="-x"], .close, .dlg-close, .gloss-close, .quiz-close, [aria-label="닫기"]';
  function visible(el){
    if (!el || !el.getClientRects().length) return false;
    var s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0;
  }
  function z(el){
    var n = 0;
    for (var e = el; e && e !== document.body; e = e.parentElement){
      var v = parseInt(getComputedStyle(e).zIndex, 10); if (!isNaN(v)) n = Math.max(n, v);
    }
    return n;
  }
  function page(){ return (location.pathname.split('/').pop() || 'index.html').split('?')[0]; }

  var asking = false;
  App.addListener('backButton', function(){
    // 1) 확인창
    var ask = document.getElementById('ask-ov');
    if (ask && ask.classList.contains('show')){
      var b = ask.querySelector('#ask-no') || ask.querySelector('#ask-yes');
      if (b) b.click();
      return;
    }
    // 2) 닫기 단추가 보이는 창 — 가장 위에 뜬 것
    var list = Array.prototype.filter.call(document.querySelectorAll(CLOSERS), visible);
    if (list.length){
      list.sort(function(a, b){ return z(b) - z(a); });
      list[0].click();
      return;
    }
    if (asking) return;
    // 3) 목록이 아닌 화면
    var p = page();
    if (p !== 'index.html' && p !== ''){
      asking = true;
      var go = function(yes){ asking = false; if (yes) location.href = 'index.html'; };
      if (window.Ask && Ask.confirm) Ask.confirm('챕터 목록으로 나갈까요?', { ok: '나가기', cancel: '계속하기', sub: '지금까지 한 것은 그대로 남습니다.' }).then(go);
      else go(window.confirm('챕터 목록으로 나갈까요?'));
      return;
    }
    // 4) 챕터 목록 — 앱을 내린다
    try { (App.minimizeApp ? App.minimizeApp() : App.exitApp()); } catch (e) {}
  });
})();
