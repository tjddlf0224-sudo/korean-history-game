/* ============ 물어보기 — 게임 안에서 뜨는 확인창 ============

   왜 만들었나
   - 이 게임은 세로로 든 화면에서도 가로로 보이게 #wrap 을 통째로 90도 돌린다.
     그런데 브라우저가 띄우는 confirm() 은 **웹페이지가 아니라 운영체제의 창**이라
     그 회전을 따르지 않는다. 가로로 하고 있는데 확인창만 세로로 떴다.
   - 그래서 확인창도 #wrap 안에 직접 그린다. 그러면 화면과 같이 돈다.

   덤으로 얻는 것
   - 생김새를 게임에 맞출 수 있다. 되돌릴 수 없는 것은 단추 색을 달리해 둔다.
   - 글을 마음대로 쓸 수 있다(운영체제 창은 줄바꿈도 마음대로 못 한다).

   쓰는 법
     const yes = await Ask.confirm('정말 지울까요?', { ok:'지우기', danger:true });
*/
window.Ask = (function(){
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #ask-ov { position:absolute; inset:0; z-index:96; display:none;
      align-items:center; justify-content:center; padding:18px;
      background:rgba(6,4,2,.76);
      -webkit-backdrop-filter:blur(7px); backdrop-filter:blur(7px); }
    #ask-ov.show { display:flex; }
    #ask-box { width:100%; max-width:390px; border-radius:16px; overflow:hidden;
      border:1px solid #4a3c26;
      background:linear-gradient(180deg,#241b11 0%,#171108 100%);
      box-shadow:0 22px 56px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,238,205,.06);
      animation:ask-in .26s cubic-bezier(.2,.9,.25,1) both; }
    @media (prefers-reduced-motion:reduce){ #ask-box { animation:none; } }
    @keyframes ask-in { from { opacity:.4; transform:translateY(10px) scale(.98); }
      to { opacity:1; transform:none; } }
    #ask-box .bar { height:2px;
      background:linear-gradient(90deg,transparent,rgba(201,162,74,.35) 18%,
        rgba(240,201,107,.72) 50%,rgba(201,162,74,.35) 82%,transparent); }
    #ask-box .msg { padding:20px 20px 18px; font-family:"Gowun Batang",serif;
      font-size:14.5px; line-height:1.95; color:#efe4cd; text-align:center; }
    #ask-box .msg .sub { display:block; margin-top:7px; font-size:12.5px; color:#9c8d73; }
    /* 두 단추는 크기를 똑같이 — 한쪽만 커 보이면 그쪽으로 손이 간다 */
    #ask-box .row { display:grid; grid-template-columns:1fr 1fr; gap:9px;
      padding:0 16px 16px; }
    #ask-box button { width:100%; box-sizing:border-box; margin:0; padding:12px 10px;
      border-radius:11px; border:1px solid #3b2f1e; background:#241b11; color:#efe4cd;
      font-family:"Gowun Batang",serif; font-size:14px; cursor:pointer;
      transition:transform .12s ease, background .16s, border-color .16s; }
    #ask-box button:active { transform:scale(.97); background:#2f2417; border-color:#6a5433; }
    #ask-box button.go { border-color:#6b5730; background:#31260f; color:#f0c96b; font-weight:700; }
    #ask-box button.go.danger { border-color:#7a4436; background:#33190f; color:#e8a691; }`;
    document.head.appendChild(s);
  }
  /* 반드시 #wrap 안에 붙여야 한다 — 바깥에 붙이면 회전을 따라오지 않는다 */
  function layer(){ return document.getElementById('wrap') || document.body; }

  function confirm(message, opt){
    opt = opt || {};
    css();
    let d = document.getElementById('ask-ov');
    if (!d){ d = document.createElement('div'); d.id = 'ask-ov'; layer().appendChild(d); }
    else if (d.parentNode !== layer()) layer().appendChild(d);
    d.innerHTML =
      '<div id="ask-box"><div class="bar"></div>' +
      `<div class="msg">${message}${opt.sub ? `<span class="sub">${opt.sub}</span>` : ''}</div>` +
      '<div class="row">' +
      `<button type="button" id="ask-no">${opt.cancel || '취소'}</button>` +
      `<button type="button" id="ask-yes" class="go${opt.danger ? ' danger' : ''}">${opt.ok || '확인'}</button>` +
      '</div></div>';
    d.classList.add('show');

    return new Promise(res => {
      function done(v){
        d.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        res(v);
      }
      function onKey(ev){ if (ev.key === 'Escape') done(false); }
      d.querySelector('#ask-yes').onclick = () => done(true);
      d.querySelector('#ask-no').onclick = () => done(false);
      // 바깥을 눌러도 닫힌다 — 다만 '취소'로 닫는다(되돌릴 수 없는 쪽으로 새지 않게)
      d.onclick = ev => { if (ev.target === d) done(false); };
      document.addEventListener('keydown', onKey);
    });
  }

  return { confirm };
})();
