/* ============ 속마음 대사 표시 (전 챕터 공용) ============

   왜 만들었나 (2026-09-19, 사용자 요청)
   - 주인공의 속말을 `(속으로) …` 로 적어 왔는데, 말풍선 안에 지시문이 그대로
     남아 있으니 "표시를 하면서 속말을 한다"는 느낌이라 어색했다.
   - 그래서 **글자로 알리지 않고 화면으로 알린다**. 대화창을 회색조로 바꾸고,
     글씨를 기울이고, 왼쪽에 점선을 그어 '입 밖으로 낸 말이 아니다'를 보인다.
     초상도 채도를 뺀다. 이름 옆에는 작은 '속마음' 표만 붙인다.

   데이터는 그대로 둔다
   - 챕터의 대사에는 `(속으로)` 를 그대로 남긴다(작법 점검 도구들이 이 표시로
     속말을 찾는다). 화면에 그릴 때만 떼어 낸다.
   - `(탑 몸돌을 쓸어 본다 · 속으로)` 처럼 동작이 섞인 것은 동작만 남긴다.

   붙이는 법: 챕터에 <script src="assets/inner.js?v=…"></script> 한 줄.
   Dialog는 챕터가 만드는 전역 상수라 companions.js와 같은 방식으로 한 번 감싼다.
*/
window.Inner = (function(){
  const CSS = `
  /* 속마음 — 색을 빼고 기울여서 '들리지 않는 말'로 보이게 한다 */
  /* 2026-09-19: 처음 색이 너무 어두워 "아예 죽은 것 같다"는 지적을 받아 한 단계 밝혔다.
     속말은 조용한 것이지 가라앉은 것이 아니다 — 밝은 회청색 + 또렷한 흰 글씨. */
  #dlg-frame.inner-voice #dlg-panel { background:#4a505cee; border-color:#b9c0cb; }
  #dlg-frame.inner-voice .dlg-name { color:#f0f3f8; font-weight:500; }
  #dlg-frame.inner-voice .dlg-portrait { filter:grayscale(.45) brightness(1.04);
    border-color:#b9c0cb; box-shadow:0 10px 22px rgba(0,0,0,.45), 0 0 0 2px #b9c0cb; }
  #dlg-frame.inner-voice #dlg-text { font-style:italic; color:#fbfcfe;
    border-left:2px dashed #c3cad5; padding-left:12px; }
  .inner-badge { display:inline-block; margin-left:7px; padding:1px 7px; border-radius:999px;
    font-style:normal; font-size:11px; font-weight:500; letter-spacing:.04em;
    color:#2b2f36; background:#d5dae2; border:1px solid #eef1f5; vertical-align:2px; }
  `;
  let styled = false, hooked = false;

  function injectCss(){
    if (styled) return; styled = true;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* 대사 앞머리의 속말 표시를 읽는다.
     '(속으로)'          → 속말이고, 지울 말머리는 그 괄호 전체
     '(…한다 · 속으로)'  → 속말이고, 동작만 남긴다
     그 밖               → 속말이 아니다 */
  function parse(t){
    const m = /^\s*\(([^)]*)\)/.exec(t || '');
    if (!m || !/속으로/.test(m[1])) return null;
    const rest = m[1].replace(/\s*[·,]?\s*속으로\s*/, '').trim();
    return { keep: rest ? '(' + rest + ')' : '' };
  }

  function apply(beat){
    const frame = document.getElementById('dlg-frame');
    const textEl = document.getElementById('dlg-text');
    if (!frame || !textEl) return;
    const info = beat && beat.who === 'me' ? parse(beat.t) : null;
    frame.classList.toggle('inner-voice', !!info);
    if (!info) return;
    // 화면에서만 말머리를 떼어 낸다(데이터는 그대로)
    textEl.innerHTML = textEl.innerHTML.replace(/^\s*\([^)]*\)\s*/,
      info.keep ? info.keep + ' ' : '');
    const nameEl = document.getElementById('dlg-name');
    if (nameEl && !nameEl.querySelector('.inner-badge')){
      nameEl.insertAdjacentHTML('beforeend', '<span class="inner-badge">속마음</span>');
    }
  }

  function hook(){
    if (hooked || typeof Dialog === 'undefined' || !Dialog.render) return;
    hooked = true;
    injectCss();
    const orig = Dialog.render;
    Dialog.render = function(){
      const r = orig.apply(this, arguments);
      try { apply(this.data && this.data.beats && this.data.beats[this.idx]); } catch(e){}
      return r;
    };
  }

  window.addEventListener('load', hook);
  document.addEventListener('DOMContentLoaded', hook);
  return { hook, _parse: parse };
})();
