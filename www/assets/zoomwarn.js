/* ============ 사파리 확대가 켜졌을 때 알려 주기 ============

   무슨 일이 있었나
   - 실기기 제보: "갑자기 왜 화면이 이래. NPC한테 말을 못 거네. 단추가 겹쳐져서"
     화면이 통째로 확대되고 단추가 겹쳐 게임이 사실상 멈췄다.
   - 원인은 **사파리 주소창 AA 메뉴의 페이지 확대**였다. 사용자가 작은 '가'를
     눌러 100%로 되돌리자 바로 정상이 됐다.

   왜 막지 못하나
   - viewport meta의 user-scalable=no·maximum-scale 은 iOS 10부터 접근성
     정책으로 **무시된다**. 핀치줌은 JS로 막을 수 있지만(gesturestart·
     touchstart·touchmove·더블탭), **AA 메뉴의 페이지 확대는 사이트별로
     저장되는 사파리 설정이라 웹페이지가 어떤 수단으로도 못 막는다.**
   - 게다가 새로고침해도 안 풀린다. 그래서 사용자는 게임이 고장 난 줄 안다.

   그래서 막는 대신 **알려 준다**
   - 확대가 걸린 것을 감지하면 위쪽에 한 줄 띄운다.
   - 이 게임은 #wrap 을 화면 크기에 맞춰 직접 스케일하고, 세로로 든 휴대폰
     에서는 90도 돌려 쓴다. 그래서 알림도 #wrap 안에 넣는다 —
     바깥에 두면 사용자가 든 방향과 글자 방향이 어긋난다.

   어떻게 재나
   - AA 페이지 확대가 걸리면 레이아웃 뷰포트가 줄어든다. 즉
     window.innerWidth 가 작아지는데 screen 크기는 그대로다. 그 비를 쓴다.
   - **가로만 본다.** 세로(innerHeight)는 사파리 툴바가 접혔다 펴졌다 하며
     늘 변해서 오탐이 난다.
   - 데스크톱은 screen 이 모니터 크기라 이 셈이 성립하지 않는다. 그래서
     **iOS에서만** 돈다.
   - 1.15배부터 알린다. 그보다 작은 차이는 기기·툴바 오차일 수 있다.

   막는 것이 아니라 알리는 것이므로, 틀렸을 때의 피해는 "쓸데없는 한 줄"뿐
   이어야 한다. 그래서 닫을 수 있게 하고, 한 번 닫으면 다시 안 띄운다.
*/
(function(){
  'use strict';

  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) ||
              (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);  // iPadOS
  if (!isIOS) return;

  var THRESHOLD = 1.15;   // 이보다 크게 확대됐을 때만 알린다
  var dismissed = false;
  var el = null;

  function zoomFactor(){
    var w = window.innerWidth;
    if (!w || !window.screen) return 1;
    var sw = screen.width, sh = screen.height;
    if (!sw || !sh) return 1;
    // iOS의 screen 은 방향이 바뀌어도 값이 안 바뀐다. 그래서 지금 방향에
    // 맞는 쪽을 골라 쓴다.
    var landscape = (window.matchMedia &&
                     window.matchMedia('(orientation: landscape)').matches);
    var expect = landscape ? Math.max(sw, sh) : Math.min(sw, sh);
    return expect / w;
  }

  function css(){
    if (document.getElementById('zw-style')) return;
    var s = document.createElement('style');
    s.id = 'zw-style';
    s.textContent =
      '#zw-bar { position:absolute; left:8px; right:8px; top:8px; z-index:120;' +
      ' display:none; align-items:center; gap:8px; padding:9px 12px;' +
      ' border-radius:10px; background:rgba(38,26,14,.96); border:1px solid #c9a24a;' +
      ' color:#f5ecd8; font-family:"Gowun Batang",serif; font-size:13px; line-height:1.5;' +
      ' box-shadow:0 6px 18px rgba(0,0,0,.5); }' +
      '#zw-bar.on { display:flex; }' +
      '#zw-bar b { color:#f0c96b; }' +
      '#zw-bar .x { flex:none; width:24px; height:24px; border-radius:50%;' +
      ' border:1px solid #6b5636; background:rgba(20,15,8,.9); color:#e0d5bd;' +
      ' font-size:13px; line-height:1; cursor:pointer; font-family:inherit; }';
    document.head.appendChild(s);
  }

  function bar(){
    if (el) return el;
    css();
    // #wrap 안에 넣는다 — 바깥에 두면 글자 방향이 게임과 어긋난다
    var host = document.getElementById('wrap') || document.body;
    el = document.createElement('div');
    el.id = 'zw-bar';
    el.innerHTML = '<div>사파리 화면 확대가 켜져 있어 화면이 어긋납니다.<br>' +
      '주소창의 <b>AA</b> 를 눌러 <b>100%</b> 로 되돌려 주세요.</div>' +
      '<button class="x" aria-label="닫기">✕</button>';
    el.querySelector('.x').addEventListener('click', function(e){
      e.stopPropagation();
      dismissed = true;
      el.classList.remove('on');
    });
    host.appendChild(el);
    return el;
  }

  function check(){
    if (dismissed) return;
    var z = zoomFactor();
    if (z > THRESHOLD) bar().classList.add('on');
    else if (el) el.classList.remove('on');
  }

  // 확대는 언제든 바뀔 수 있다. 크기가 바뀌는 순간마다 다시 잰다.
  window.addEventListener('resize', check);
  window.addEventListener('orientationchange', function(){ setTimeout(check, 300); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', check);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(check, 400); });
  else setTimeout(check, 400);

  // 손으로 확인할 때 쓴다: ZoomWarn.factor()
  window.ZoomWarn = { factor: zoomFactor, check: check,
                      reset: function(){ dismissed = false; check(); } };
})();
