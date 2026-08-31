/* ============ 먹 번짐 전환 ============

   왜 만들었나
   - 구역이 바뀔 때 검은 화면이 스르륵 덮였다 걷혔다. 페이드는 아무 성격이 없다 —
     어느 게임에나 있고, 이 게임의 것이 아니다.
   - 먹이 번져 덮으면 같은 600ms인데 이 게임의 것이 된다. 그림을 한 장도
     안 그리고, 챕터를 하나도 안 고치고 된다.

   어떻게 — 챕터를 하나도 안 고친다
   - 36개 챕터가 전부 같은 `#fade` 한 장을 쓰고 `.show` 를 붙였다 뗀다.
     그 한 장의 **생김새만** 밖에서 갈아끼운다. 타이밍(600ms)도 그대로 쓴다.
   - 먹 방울 여덟 개를 겹쳐 두고 그 크기를 키운다. 원 하나를 키우면 조리개처럼
     보이지만, 크기가 다른 방울이 저마다 다른 속도로 번지면 먹처럼 보인다.

   **두 번 갈아엎었다.**
   ① mask-image 여러 겹 + mask-size 애니메이션 → 값이 여덟 겹일 때 계산값이
      0% 그대로였다. 배경 그러데이션으로 바꿨다.
   ② 그런데도 0이었다. 원인은 CSS가 아니라 **퍼센트 단위**였다 —
      퍼센트는 그 요소의 상자를 기준으로 하는데 #fade 의 부모(#wrap)가
      상황에 따라 크기를 안 갖는다. 그때 300%가 0으로 풀린다.
      **vmax 로 바꿔** 화면 기준으로 만들었다. 상자와 무관해져 어디서든 같다.

   지킨 것
   - **덮이는 것은 확실하게.** 번지는 맛을 내려다 틈이 남으면 전환이 지저분해진다.
     방울이 다 자란 뒤에는 빈틈없이 검다(가장자리까지 닿도록 넉넉히 키운다).
   - prefers-reduced-motion 이면 손대지 않는다 — 예전처럼 그냥 페이드한다.

   붙이는 법
     <script src="assets/inkwipe.js"></script>
*/
window.InkWipe = (function(){
  let injected = false;

  function calm(){
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch(e){ return false; }
  }

  /* 방울: [가로%, 세로%, 다 자랐을 때 크기(vmax)]

     크기를 **퍼센트가 아니라 vmax 로 준다.** 퍼센트는 그 요소의 상자 크기에
     기대는데, #fade 는 부모(#wrap)가 상황에 따라 크기를 안 갖는 경우가 있어
     그때 300%가 0으로 풀린다. vmax 는 화면을 기준으로 하므로 상자와 무관하다. */
  const BLOTS = [
    [20, 28, 150], [74, 18, 130], [46, 64, 160], [88, 76, 125],
    [10, 80, 140], [60, 36, 120], [32, 50, 150], [94, 44, 115],
  ];

  function css(){
    if (injected) return; injected = true;
    if (calm()) return;

    const layers = BLOTS.map(([x, y]) =>
      `radial-gradient(circle at 50% 50%, #05040a 0 58%, rgba(5,4,10,0) 72%)`
    ).join(',');
    const pos = BLOTS.map(([x, y]) => `${x}% ${y}%`).join(',');
    const grown = BLOTS.map(([, , r]) => `${r}vmax ${r}vmax`).join(',');

    const s = document.createElement('style');
    s.textContent = `
    /* 먹 번짐 — #fade 의 생김새만 바꾼다. 클래스도 타이밍도 챕터 것을 그대로 쓴다. */
    /* 먹 방울이 먼저 번지고(0~0.4s), 그 뒤에 검은색이 채워 마무리한다(0.3~0.56s).
       이렇게 두 겹으로 두는 이유: **먹이 안 그려져도 전환은 반드시 덮인다.**
       그러데이션이 어떤 이유로든 안 먹히면 예전처럼 검게 덮이기만 할 뿐,
       전환이 사라져 구역이 툭 바뀌는 일은 없다. */
    #fade {
      background-color: rgba(5,4,10,0) !important;
      background-image: ${layers} !important;
      background-repeat: no-repeat !important;
      background-position: ${pos} !important;
      background-size: 0 0 !important;
      opacity: 1 !important;
      transition: background-size .42s cubic-bezier(.45,0,.35,1),
                  background-color .26s linear .3s !important;
    }
    #fade.show {
      background-size: ${grown} !important;
      background-color: rgba(5,4,10,1) !important;
    }`;
    document.head.appendChild(s);
  }

  function init(){
    if (document.getElementById('fade')) css();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { init, calm, BLOTS };
})();
