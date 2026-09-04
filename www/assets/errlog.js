/* ============ 오류 기록과 열어 보기 ============

   왜 만들었나
   - 실기기(아이폰)에서 "맵이 까매졌다"는 제보를 받았다. 화면은 순수 검정,
     HUD와 단추만 남아 있었다. 게임 루프가 그리는 도중 예외를 한 번 맞고
     죽은 자리였다(예전 loop은 본문 맨 끝에서 다음 프레임을 예약했다).
   - 그런데 **무엇이 터졌는지 알 방법이 없었다.** 아이폰 사파리에서는
     콘솔도 localStorage도 볼 수 없다. 원인을 찾느라 한참을 헤맸다.
   - 그래서 오류를 기기에 남기고, 주소에 ?err=1 만 붙이면 화면에서
     바로 읽을 수 있게 한다. 이 저장소가 이미 쓰는 ?debug=1 과 같은 방식이다.

   무엇을 담나
   - 언제 / 어느 챕터 / 어느 구역 / 메시지 / 파일:줄 / 호출 흐름(700자까지)
   - **최근 8건만.** 같은 오류가 매 프레임 나도 한 줄로 합친다(횟수만 센다).
   - 사람에 관한 것은 담지 않는다. 어디로도 보내지 않는다 — 기기에만 남는다.

   붙이는 법
     <script src="assets/errlog.js"></script>   (다른 스크립트보다 먼저)
*/
window.ErrLog = (function(){
  const KEY = 'khg_err';
  const CAP = 8;

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }

  function write(list){
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-CAP))); } catch(e){}
  }

  /* 같은 오류가 매 프레임 나면 8칸이 순식간에 같은 줄로 채워진다.
     메시지·위치가 같으면 새 줄을 만들지 않고 횟수만 올린다. */
  function add(rec){
    const list = read();
    const last = list[list.length - 1];
    if (last && last.msg === rec.msg && last.at2 === rec.at2){
      last.n = (last.n || 1) + 1;
      last.last = rec.when;
      write(list);
      return;
    }
    rec.n = 1;
    list.push(rec);
    write(list);
  }

  function note(msg, where, stack){
    add({ when: new Date().toISOString(),
          chapter: location.pathname.split('/').pop() || '(index)',
          zone: (function(){ try { return World.zone; } catch(e){ return null; } })(),
          msg: String(msg || '').slice(0, 300),
          at2: String(where || '').slice(0, 160),
          stack: String(stack || '').slice(0, 700) });
  }

  window.addEventListener('error', (e) => {
    // 그림·소리 파일이 404인 경우(ErrorEvent가 아니라 대상이 있는 이벤트)
    if (e.target && e.target !== window && e.target.tagName){
      note('자원을 못 읽음: ' + e.target.tagName,
           (e.target.currentSrc || e.target.src || '').slice(-120), '');
      return;
    }
    note(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno,
         e.error && e.error.stack);
  }, true);

  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    note('처리 못한 거절: ' + ((r && r.message) || r), '', r && r.stack);
  });

  /* ---------------- ?err=1 로 열어 보기 ---------------- */
  function show(){
    const list = read();
    let loopErr = null;
    try { loopErr = JSON.parse(localStorage.getItem('khg_loop_err') || 'null'); } catch(e){}

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const rows = list.slice().reverse().map(r =>
      '<div class="row"><div class="hd">' + esc(r.when.slice(5, 19).replace('T', ' ')) +
      ' · ' + esc(r.chapter) + (r.zone ? ' · ' + esc(r.zone) : '') +
      (r.n > 1 ? ' · <b>' + r.n + '번</b>' : '') + '</div>' +
      '<div class="msg">' + esc(r.msg) + '</div>' +
      (r.at2 ? '<div class="at">' + esc(r.at2) + '</div>' : '') +
      (r.stack ? '<pre>' + esc(r.stack) + '</pre>' : '') + '</div>').join('');

    const el = document.createElement('div');
    el.id = 'errlog-ov';
    el.innerHTML =
      '<div class="panel">' +
      '<div class="top"><b>기록된 오류 ' + list.length + '건</b>' +
      '<button id="errlog-copy">복사</button><button id="errlog-clear">지우기</button>' +
      '<button id="errlog-close">닫기</button></div>' +
      (loopErr ? '<div class="row loop"><div class="hd">게임 루프가 멈춘 자리</div>' +
        '<div class="msg">' + esc(loopErr.msg) + '</div>' +
        '<div class="at">' + esc(loopErr.chapter) + ' · ' + esc(loopErr.zone) + '</div>' +
        (loopErr.stack ? '<pre>' + esc(loopErr.stack) + '</pre>' : '') + '</div>' : '') +
      (rows || '<div class="row"><div class="msg">기록된 오류가 없습니다.</div></div>') +
      '</div>';

    const st = document.createElement('style');
    st.textContent = `
    #errlog-ov { position:fixed; inset:0; z-index:99999; background:rgba(6,5,3,.94);
      font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;
      overflow-y:auto; -webkit-overflow-scrolling:touch; padding:12px; box-sizing:border-box; }
    #errlog-ov .panel {
      /* 가로로 누우면 게임 높이가 390px뿐이라 긴 창은 위아래가 잘렸다.
         높이 미디어쿼리는 못 쓴다 — 세로로 든 휴대폰에서는 #wrap을 90도
         돌려 쓰므로 화면 높이(844)와 게임 높이(390)가 다르다.
         부모 기준 %로 잡고, 넘치면 창 안에서 스크롤되게 한다. */
      max-height:100%; overflow-y:auto; -webkit-overflow-scrolling:touch;
      box-sizing:border-box; max-width:720px; margin:0 auto; color:#f0e6d2; font-size:12.5px; }
    #errlog-ov .top { position:sticky; top:0; display:flex; align-items:center; gap:6px;
      padding:8px 0 10px; background:rgba(6,5,3,.94); }
    #errlog-ov .top b { flex:1; font-size:14px; color:#f0c96b; }
    #errlog-ov button { font:inherit; padding:6px 10px; border-radius:8px;
      border:1px solid #4a3c26; background:#2a2013; color:#f0e6d2; cursor:pointer; }
    #errlog-ov .row { border:1px solid #3a2c1a; border-radius:10px; padding:9px 10px;
      margin-bottom:8px; background:#171208; }
    #errlog-ov .row.loop { border-color:#a8503c; background:#210f0a; }
    #errlog-ov .hd { color:#c9a24a; font-size:11px; margin-bottom:4px; }
    #errlog-ov .msg { color:#f7dd93; line-height:1.45; word-break:break-word; }
    #errlog-ov .at { color:#8a7a5c; font-size:11px; margin-top:3px; word-break:break-all; }
    #errlog-ov pre { margin:6px 0 0; padding:7px; border-radius:7px; background:#0e0a05;
      color:#b9a884; font-size:10.5px; line-height:1.4; white-space:pre-wrap;
      word-break:break-all; max-height:180px; overflow-y:auto; }`;

    document.head.appendChild(st);
    document.body.appendChild(el);

    document.getElementById('errlog-close').onclick = () => el.remove();
    document.getElementById('errlog-clear').onclick = () => {
      try { localStorage.removeItem(KEY); localStorage.removeItem('khg_loop_err'); } catch(e){}
      el.remove();
    };
    document.getElementById('errlog-copy').onclick = () => {
      const txt = JSON.stringify({ loop: loopErr, errors: list }, null, 1);
      // 클립보드가 막힌 환경(비보안 컨텍스트 등)에서는 선택할 수 있게 펼쳐 준다
      const done = () => { const b = document.getElementById('errlog-copy');
                           if (b) b.textContent = '복사됨'; };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done, () => prompt('복사해 주세요', txt));
      } else prompt('복사해 주세요', txt);
    };
  }

  function maybeShow(){
    if (new URLSearchParams(location.search).get('err') !== '1') return;
    if (document.body) show();
    else document.addEventListener('DOMContentLoaded', show);
  }
  maybeShow();

  return { note, read, show, clear(){ try { localStorage.removeItem(KEY); } catch(e){} } };
})();
