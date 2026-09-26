// ============================================================
//  Ads — AdMob 래퍼 (리워드형 중심 + 학습량에 따른 전면)
//  보카 바리스타의 shared/ads.js 를 그대로 가져와 이름만 바꿨다.
//
//  광고단위: iOS는 이 앱 전용(2026-09-01 발급) → 실광고.
//     안드로이드는 전용 단위가 아직 없다 → 테스트 광고(아래 TEST_ON). 남의 앱 단위로
//     실제 광고를 부르면 AdMob 정책 위반이다.
//
//  2026-09-19 성일님 요청 세 가지
//   1) 개인 맞춤 광고 — 추적(ATT) 권한을 요청하는 쪽으로 바꾼다.
//      (이 파일만으로는 안 끝난다. ios/App/App/Info.plist에
//       NSUserTrackingUsageDescription을 넣어야 하고, 개인정보처리방침·
//       App Store Connect의 "앱 개인정보" 추적 선언도 "추적함"으로
//       같이 바꿔야 한다 — 실제 동작과 어긋나면 심사에서 걸린다.)
//   2) 앱을 켜자마자(이 스크립트가 실려 페이지가 열릴 때) 추적 권한을 먼저
//      묻고 SDK를 미리 초기화해 둔다 — 첫 광고 요청이 그만큼 안 느려진다.
//   3) 전면 광고를 되살리되, 예전 사고를 반복하지 않는다: **준비(prepare)와
//      보여주기(show)를 서로 다른 화면으로 떼어 놓는다.** 챕터를 몇 개
//      마칠 때마다(카운트만) '보여줄 때가 됐다'는 표만 남기고, 실제로 보여
//      주는 건 **가장 안전하고 정적인 화면인 챕터 목록(index.html)에 다시
//      도착했을 때, 화면이 가라앉은 뒤** 한 번이다. 대화·퀴즈·보스전 위에는
//      절대 얹지 않는다.
// ============================================================

window.Ads = (function () {
  // 플랫폼마다 따로 정한다(2026-09-27 점검). 예전엔 테스트 모드 스위치 하나로 묶여 있어서,
  // 안드로이드를 지키려고 켜 둔 테스트 모드 때문에 **이미 출시된 iOS 빌드도 테스트 광고만**
  // 나왔다(수익 0). iOS는 이 앱 전용 단위가 있으니 실광고, 안드로이드는 이 앱 전용 단위를
  // 아직 안 받았으니(예전 REAL.android는 보카바리스타 것 — 쓰면 정책 위반) 테스트 광고.
  // ⚠️ 안드로이드 출시 전: AdMob에서 한국사 게임 Android 앱을 등록 → 앱 ID는
  //    scripts/android_setup.py의 ADMOB_APP_ID, 광고단위는 아래 REAL.android에 넣고 false로.
  var TEST_ON = { ios: false, android: true };
  function useTest() { return TEST_ON[platform()] !== false; }

  // Google 공식 테스트 광고단위 (계정 없이 동작)
  var TEST = {
    ios:     { rewarded: 'ca-app-pub-3940256099942544/1712485313', interstitial: 'ca-app-pub-3940256099942544/4411468910' },
    android: { rewarded: 'ca-app-pub-3940256099942544/5224354917', interstitial: 'ca-app-pub-3940256099942544/1033173712' },
  };
  var REAL = {
    ios:     { rewarded: 'ca-app-pub-7418287954060066/6516779176', interstitial: 'ca-app-pub-7418287954060066/1264452497' }, // 2026-09-01 한국사 게임 전용
    android: { rewarded: '', interstitial: '' },   // 아직 없음(보카바리스타 단위를 여기 넣지 말 것)
  };

  /* 광고가 떠 있는 동안 게임 배경음악을 쉰다(2026-09-27 안드로이드 점검: 광고 영상 소리와
     배경음악이 겹쳐 나왔다). audio.js가 앱을 내릴 때 쓰는 것과 같은 스위치를 쓴다. */
  function muteGame(){ try { window.__khgReleaseAudio && window.__khgReleaseAudio(); } catch (e) {} }
  function unmuteGame(){ try { window.__khgResumeAudio && window.__khgResumeAudio(); } catch (e) {} }

  function admob() { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) || null; }
  function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function platform() { return (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android') ? 'android' : 'ios'; }
  // [보강 2026-08-18] REAL에 해당 플랫폼 ID가 아직 없으면(예: Android 미발급) 테스트 광고단위로 폴백.
  // 빈 문자열을 그대로 넘기면 prepareRewardVideoAd가 실패해 부활 기능이 조용히 죽는다.
  function unit(kind) {
    var id = ((useTest() ? TEST : REAL)[platform()] || {})[kind];
    if (!id) id = (TEST[platform()] || {})[kind];
    return id;
  }
  // 이 플랫폼이 아직 실제 광고단위가 없어 테스트 광고로 도는 중인지 — isTesting 플래그에 반영해야
  // AdMob 정책 위반(실제 광고를 테스트 없이 호출)이나 "no fill"을 피할 수 있다.
  function isTestUnit(kind) {
    if (useTest()) return true;
    return !((REAL[platform()] || {})[kind]);
  }

  // [심사] 추적(ATT) — 개인 맞춤 광고를 쓰려면 iOS 14+에서 이 권한을 먼저 물어야 한다.
  // 이미 물은 적이 있으면(허용·거부 상관없이) iOS가 스스로 다시 안 띄운다 — 페이지마다
  // 불러도 안전하다. 거부해도 게임·광고 자체는 그대로 되고, SDK가 알아서 비개인화 광고로
  // 돌린다(우리가 따로 분기할 필요 없음).
  var _trackAsked = false;
  function requestTracking() {
    var A = admob();
    if (!A || !isNative() || !A.requestTrackingAuthorization || _trackAsked) return Promise.resolve();
    _trackAsked = true;
    return A.requestTrackingAuthorization().catch(function (e) { console.warn('[Ads] 추적 권한 요청 실패', e); });
  }

  var _inited = false;
  function init() {
    var A = admob();
    if (!A || !isNative() || _inited) return Promise.resolve();
    _inited = true;
    return requestTracking()
      .then(function () { return A.initialize({ initializeForTesting: useTest() }); })
      .catch(function (e) { console.warn('[Ads] init 실패', e); _inited = false; });
  }

  // 리워드 광고: 끝까지 시청 시 true. 웹/미지원/실패 시 폴백 or false.
  // 2026-09-27: showRewardVideoAd()는 **보상을 받았을 때만** 끝난다(플러그인 v8 원본 확인).
  // 예전엔 그걸 기다렸기 때문에, 광고를 끝까지 안 보고 닫으면 약속이 영영 안 끝나서
  // 버튼을 누른 화면이 그대로 멈췄다. 이제는 '광고가 닫혔다/못 띄웠다' 알림에서 끝낸다.
  // 같은 광고를 두 번 연달아 부르면(버튼 두 번 누르기) 첫 번째 결과를 같이 돌려준다.
  var _rewardBusy = null;
  function rewarded() {
    var A = admob();
    if (!A || !isNative()) return _webFallback();
    if (_rewardBusy) return _rewardBusy;
    var earned = false, handles = [], done = false;
    _rewardBusy = new Promise(function (resolve) {
      function fin() {
        if (done) return; done = true;
        handles.forEach(function (h) { try { h && h.remove && h.remove(); } catch (e) {} });
        _rewardBusy = null;
        unmuteGame();
        resolve(earned);
      }
      init()
        .then(function () {
          return Promise.all([
            A.addListener('onRewardedVideoAdReward', function () { earned = true; }),
            A.addListener('onRewardedVideoAdDismissed', function () { fin(); }),
            A.addListener('onRewardedVideoAdFailedToShow', function () { fin(); }),
          ]);
        })
        .then(function (hs) { handles = hs; return A.prepareRewardVideoAd({ adId: unit('rewarded'), isTesting: isTestUnit('rewarded') }); })
        .then(function () {
          // 보상을 받으면 끝나는 약속 — 기다리지 않는다(닫힘 알림이 끝을 맡는다)
          muteGame();
          A.showRewardVideoAd().then(function () { earned = true; }, function (e) { console.warn('[Ads] show 실패', e); fin(); });
        })
        .catch(function (e) { console.warn('[Ads] rewarded 실패', e); fin(); });
    });
    return _rewardBusy;
  }

  // 전면 광고. 2026-07엔 prepare(수 초 걸림) → show를 한 화면에서 바로 이어 부르다,
  // 로드가 끝났을 땐 이미 다음 화면(새 영업일+VIP 입력)으로 넘어가 있어 그 위로
  // 광고가 덮친 사고가 있었다. 2026-09-19부터는 **부르는 자리를 가린다** —
  // dueInterstitial()로 "때가 됐다"는 표만 남기고, 실제 show는 반드시 아래
  // maybeShowInterstitial()이 안전한 화면(챕터 목록)에서만 한다. 이 함수를
  // 다른 화면(대화·퀴즈·보스전 안)에서 직접 부르지 말 것.
  // 2026-09-27: showInterstitial()은 광고를 '띄울 때' 끝난다. 닫힐 때까지 '보여 주는 중'으로
  // 두어야 겹쳐 뜨지 않는다 — 닫힘/못 띄움 알림에서 푼다.
  var _showingInterstitial = false;
  function interstitial() {
    var A = admob();
    if (!A || !isNative() || _showingInterstitial) return Promise.resolve(false);
    _showingInterstitial = true;
    var handles = [], done = false;
    return new Promise(function (resolve) {
      function fin(ok) {
        if (done) return; done = true;
        handles.forEach(function (h) { try { h && h.remove && h.remove(); } catch (e) {} });
        _showingInterstitial = false;
        unmuteGame();
        resolve(ok);
      }
      init()
        .then(function () {
          return Promise.all([
            A.addListener('interstitialAdDismissed', function () { fin(true); }),
            A.addListener('interstitialAdFailedToShow', function () { fin(false); }),
          ]);
        })
        .then(function (hs) { handles = hs; return A.prepareInterstitial({ adId: unit('interstitial'), isTesting: isTestUnit('interstitial') }); })
        .then(function () { muteGame(); return A.showInterstitial(); })
        .catch(function (e) { console.warn('[Ads] interstitial 실패', e); fin(false); });
    });
  }

  // N회마다 1번 전면(로컬 카운터). 예: interstitialEvery('dayclear', 3)
  // 지금 당장 보여주는 함수라 대화·퀴즈 화면 안에서는 쓰지 않는다 — noteLearned() 참고.
  function interstitialEvery(key, n) {
    try {
      var k = 'vb_adcnt_' + key, c = (+(localStorage.getItem(k) || 0)) + 1;
      localStorage.setItem(k, String(c));
      if (c % n === 0) { interstitial(); return true; }
    } catch (e) {}
    return false;
  }

  // ---- 학습량에 따른 전면 광고(성일님, 2026-09-19: "많이 학습하면 한 번씩,
  // 적절한 타이밍") ----
  var LEARN_KEY = 'khg_lrn_count', DUE_KEY = 'khg_ad_due', LEARN_EVERY = 3;   // 챕터 3개 완주마다 1번

  // 챕터를 마칠 때 부른다(Stage.endChapter, 챕터 화면 안). 여기서는 **절대 보여주지
  // 않는다** — 세기만 하고, 문턱을 넘으면 "다음에 목록으로 돌아가면 보여 달라"는
  // 표만 남긴다. 화면이 아직 챕터 완료 연출(end-screen) 중이라 여기서 곧장
  // 보여주면 그 위에 덮치는, 2026-07과 같은 사고가 난다.
  function noteLearned() {
    try {
      var c = (+(localStorage.getItem(LEARN_KEY) || 0)) + 1;
      localStorage.setItem(LEARN_KEY, String(c));
      if (c % LEARN_EVERY === 0) localStorage.setItem(DUE_KEY, '1');
    } catch (e) {}
  }

  // 챕터 목록(index.html)이 자리 잡은 뒤 한 번 부른다. 표가 없으면 조용히
  // 넘어간다. 다른 창(로그인·메뉴 등)이 열려 있으면 그 위로 덮이니 미룬다 —
  // 다음에 목록으로 돌아올 때 다시 시도된다(표를 그대로 남겨 둠).
  function maybeShowInterstitial() {
    if (!isNative()) return;
    try {
      if (localStorage.getItem(DUE_KEY) !== '1') return;
      if (document.querySelector('.show')) return;   // 뭔가 이미 열려 있다 — 나중에
      localStorage.removeItem(DUE_KEY);
    } catch (e) { return; }
    setTimeout(function () { interstitial(); }, 1200);
  }

  // 웹에는 광고가 붙지 않는다(앱에서만 재생된다). 그래도 보상 흐름은
  // 그대로 돌아가야 하므로 여기서 한 번 묻고 넘어간다.
  // window.confirm은 쓰지 않는다 — 운영체제 창이라 화면 회전을 안 따라온다.
  function _webFallback() {
    if (window.Ask && Ask.confirm)
      return Ask.confirm('이대로 보상을 받을까요?', { ok:'받기', cancel:'그만두기' });
    return Promise.resolve(window.confirm('이대로 보상을 받을까요?'));
  }

  // 부팅 시 한 번 — 추적 권한을 먼저 묻고 SDK를 미리 초기화해 둔다. 이 스크립트는
  // 목록·챕터 화면 전부에 실리므로, 페이지를 열 때마다 이 한 번이면 된다(2026-09-19).
  if (isNative()) init();

  return { init: init, rewarded: rewarded, interstitial: interstitial, interstitialEvery: interstitialEvery,
           noteLearned: noteLearned, maybeShowInterstitial: maybeShowInterstitial, isNative: isNative };
})();
