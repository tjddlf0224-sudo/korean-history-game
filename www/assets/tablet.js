/* ============ 아이패드: 휴대폰처럼 그리고 통째로 키운다 ============
   왜 (2026-09-18, 성일님 "아이패드는 아이패드용으로 최적화")
   - 이 게임의 모든 화면(지도 위 인물·HUD·조이스틱·대화창·보스전·도감·기출)은
     가로로 든 휴대폰(짧은 변 약 390px)을 기준으로 픽셀 크기를 정해 두었다.
   - 아이패드(짧은 변 820~1032px)에서는 그 크기 그대로 나오니 모든 것이 반쯤으로
     쪼그라들어 보였다. 36챕터의 요소 수십 개를 하나하나 키우는 대신,
     **페이지를 짧은 변 약 500px짜리 휴대폰처럼 배치하고 브라우저가 화면에 맞게
     확대**하게 한다(뷰포트 meta의 width). 터치 좌표도 브라우저가 같은 배율로
     바꿔 주므로 따로 손댈 것이 없다.
   - 캔버스는 devicePixelRatio만큼 크게 그리는데, 확대한 만큼 뭉개지지 않게
     그 배율을 곱해서 알려 준다.
   붙이는 법: <meta name="viewport"> 바로 뒤에 <script src="assets/tablet.js"></script>
   (다른 스크립트보다 먼저 — 배치가 시작되기 전에 뷰포트를 정해야 한다)
   시험: 주소에 ?tablet=1 을 붙이면 데스크톱에서도 켠다. */
(function(){
  try {
    var qs = new URLSearchParams(location.search).get('tablet');
    var sw = Math.min(screen.width, screen.height);
    var lw = Math.max(screen.width, screen.height);
    var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 1;
    if (!(qs === '1' || (touch && sw >= 700))) return;
    var BASE = 500;                                    // 짧은 변을 이만큼으로 본다
    var S = Math.max(1, Math.min(2.4, sw / BASE));
    var meta = document.querySelector('meta[name=viewport]');
    if (!meta){ meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    /* 창의 실제 폭으로 계산한다(2026-09-18). 아이패드는 네 방향을 다 지원해야 해서
       (App Store 업로드 규정 — 멀티태스킹) 화면 분할·Stage Manager로 창이 화면보다
       좁아질 수 있다. 확대 배율 × 배치 폭 = 창 폭이므로, 현재 배율이 반영된
       visualViewport로 창 폭을 구하면 몇 번 다시 계산해도 같은 값이 나온다. */
    var last = '';
    function winWidth(){
      var vv = window.visualViewport;
      var w = vv ? vv.width * vv.scale : 0;
      if (!(w > 0)){
        var land = window.matchMedia ? matchMedia('(orientation: landscape)').matches : (innerWidth > innerHeight);
        w = land ? lw : sw;
      }
      return w;
    }
    function apply(){
      var ww = winWidth();
      var W = Math.round(ww / S);
      // 좁은 창(화면 분할 1/3 등)에선 너무 작게 배치하지 않는다 — 460px 밑으로는 확대를 줄인다
      if (W < 460) W = Math.round(Math.min(ww, 460));
      var c = 'width=' + W + ', user-scalable=no, viewport-fit=cover';
      if (c !== last){ last = c; meta.setAttribute('content', c); }
    }
    apply();
    window.addEventListener('orientationchange', function(){ setTimeout(apply, 50); });
    if (window.matchMedia) matchMedia('(orientation: landscape)').addEventListener('change', apply);
    if (window.visualViewport) visualViewport.addEventListener('resize', function(){ setTimeout(apply, 30); });
    // 확대한 만큼 캔버스 해상도도 올린다. 엔진에 따라 devicePixelRatio에 확대 배율이
    // 이미 들어가 있기도 해서(WebKit 모바일 에뮬레이션은 3.28, 곱하면 5.4가 됐다)
    // 곱하지 않고 "아이패드 기본 2배 × 확대 배율" 이상만 보장한다.
    var desc = Object.getOwnPropertyDescriptor(Window.prototype, 'devicePixelRatio') ||
               Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    var realGet = desc && desc.get ? function(){ return desc.get.call(window); } : function(){ return 1; };
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true,
      get: function(){ return Math.max(realGet() || 1, 2 * S); } });
    document.documentElement.classList.add('tablet');
    window.__tabletScale = S;
  } catch (e) {}
})();
