/* ============ 클라우드 저장 — 로그인하면 다른 기기에서도 이어서 ============

   왜 (2026-09-18, 성일님 제보 "같은 구글 계정으로 로그인했는데 양반에서 다시 노비가 됐네")
   - 진행 기록은 전부 기기 안(localStorage)에 있었다. 로그인은 랭킹 이름표일 뿐,
     기록을 옮겨 주지 않았다. 로그인 창의 "다른 기기에서도 이어서"는 빈말이었다.

   어떻게
   - 이 기기의 게임 기록 키(khg_…)를 통째로 JSON 한 덩어리로 묶어
     Firestore khg_save/<uid> 문서 하나에 둔다. 모듈마다 따로 올리지 않는다 —
     새 모듈이 생겨도 키 이름만 khg_로 시작하면 저절로 따라온다.
   - 기기 설정·진단용 키(소리·안내 본 것·오류 기록·통계 대기열)는 빼고 둔다.
   - "누가 더 앞섰나"는 rank.js의 누적 경험치로 잰다(랭킹 점수와 같은 잣대).

   덮어쓰기 사고를 막는 규칙
   - 로그인하면 먼저 서버 것을 읽는다. **서버 쪽이 더 앞서 있으면 묻는다**
     (불러오기 / 이 기기 것 유지). 묻기 전에는 아무것도 올리지 않는다.
   - 이 기기가 같거나 앞서 있으면 조용히 올린다.
   - 그 뒤로는 화면이 숨을 때(앱을 내리거나 끌 때)와 1분마다, 바뀐 게 있으면 올린다.
     단, 서버가 이 기기보다 앞선 것을 알고 있는 동안에는 올리지 않는다 —
     "이 기기 것 유지"를 고른 경우만 예외.

   Firestore 규칙(짝): khg_save/{uid} 는 본인만 읽고 쓴다. 필드 data(문자열)·xp·at·v.
   붙이는 법(index.html): auth.js·board.js 뒤에 <script src="assets/save.js"></script>
*/
window.CloudSave = (function(){
  const COL = 'khg_save';
  const VER = 1;
  // 기기마다 따로 두는 것 — 옮기면 오히려 이상해지거나, 통계가 두 번 잡힌다
  const LOCAL_ONLY = new Set([
    'khg_err', 'khg_loop_err', 'khg_guide', 'khg_tm', 'khg_tm_id', 'khg_qstats',
    'khg_offline', 'khg_diff',
  ]);
  const MAX_BYTES = 900000;   // Firestore 문서 한 장이 1MB — 여유를 둔다

  let uid = null;
  let cloud = null;           // 마지막으로 본 서버 문서 { xp, at }
  let decided = false;        // 이번 로그인에서 비교·선택이 끝났나
  let lastSent = '';
  let lastAt = 0;

  function db(){ try { return (window.Auth && Auth.db) || null; } catch(e){ return null; } }

  function syncKeys(){
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if (k && k.indexOf('khg_') === 0 && !LOCAL_ONLY.has(k)) out.push(k);
      }
    } catch(e){}
    return out.sort();
  }
  function snapshot(){
    const o = {};
    for (const k of syncKeys()){ try { o[k] = localStorage.getItem(k); } catch(e){} }
    return JSON.stringify(o);
  }
  function localXp(){ try { return (window.Rank && Rank.get().xp) || 0; } catch(e){ return 0; } }

  async function upload(force){
    const d = db();
    if (!d || !uid || !decided) return false;
    // 서버가 더 앞선 걸 아는 동안에는 올리지 않는다(선택으로 '유지'한 경우는 force)
    if (!force && cloud && (cloud.xp || 0) > localXp()) return false;
    const data = snapshot();
    if (!force && data === lastSent) return true;
    if (data.length > MAX_BYTES){ console.warn('[CloudSave] 기록이 너무 커서 올리지 못함', data.length); return false; }
    const doc = { data: data, xp: Math.round(localXp()), at: Date.now(), v: VER };
    try {
      await d.collection(COL).doc(uid).set(doc);
      lastSent = data; lastAt = doc.at; cloud = { xp: doc.xp, at: doc.at };
      refresh();
      return true;
    } catch(e){ console.warn('[CloudSave] 올리기 실패', e); return false; }
  }

  /* 서버 기록을 이 기기에 깐다 — 동기화 대상 키만 지우고 서버 것으로 채운 뒤 새로 연다 */
  function applyCloud(dataStr){
    let o = null;
    try { o = JSON.parse(dataStr); } catch(e){}
    if (!o || typeof o !== 'object') return false;
    try {
      for (const k of syncKeys()) localStorage.removeItem(k);
      for (const k of Object.keys(o)){
        if (k.indexOf('khg_') === 0 && !LOCAL_ONLY.has(k) && typeof o[k] === 'string') localStorage.setItem(k, o[k]);
      }
    } catch(e){ return false; }
    lastSent = dataStr;
    setTimeout(() => location.reload(), 350);
    return true;
  }

  async function onLogin(u){
    uid = u.uid; decided = false; cloud = null;
    const d = db(); if (!d) return;
    let snap = null;
    try { snap = await d.collection(COL).doc(uid).get(); }
    catch(e){ console.warn('[CloudSave] 읽기 실패', e); return; }
    if (!u || !window.Auth || !Auth.user || Auth.user.uid !== uid) return;   // 그새 로그아웃
    const c = snap && snap.exists ? snap.data() : null;
    cloud = c ? { xp: +c.xp || 0, at: +c.at || 0 } : null;
    const mine = localXp();
    if (c && typeof c.data === 'string' && (+c.xp || 0) > mine){
      ask(c, mine);                  // 서버가 앞섰다 — 묻는다
    } else {
      decided = true;
      await upload(true);            // 처음이거나 이 기기가 앞섰다 — 올린다
    }
    refresh();
  }

  function onLogout(){ uid = null; cloud = null; decided = false; lastSent = ''; refresh(); }

  /* ---------------- 물어보는 창 ---------------- */
  function when(ms){
    if (!ms) return '';
    const dt = new Date(ms);
    return (dt.getMonth() + 1) + '월 ' + dt.getDate() + '일 ' +
      String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
  }
  function ask(c, mine){
    css();
    let d = document.getElementById('cs-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'cs-ov';
      (document.getElementById('wrap') || document.body).appendChild(d);
    }
    d.innerHTML = '<div class="panel">' +
      '<h3>저장된 기록이 있습니다</h3>' +
      '<div class="row"><span>이 계정에 저장된 기록</span><b>경험치 ' + Math.round(+c.xp || 0).toLocaleString() + '</b></div>' +
      '<div class="when">' + when(+c.at) + ' 저장</div>' +
      '<div class="row"><span>이 기기의 기록</span><b>경험치 ' + Math.round(mine).toLocaleString() + '</b></div>' +
      '<button class="p load" id="cs-load">저장된 기록 불러오기</button>' +
      '<button class="p keep" id="cs-keep">이 기기 기록 쓰기</button>' +
      '<div class="note">이 기기 기록을 쓰면 계정에 저장된 기록이 이 기기 것으로 바뀝니다.</div>' +
      '</div>';
    d.classList.add('show');
    document.getElementById('cs-load').onclick = () => {
      document.getElementById('cs-load').textContent = '불러오는 중…';
      decided = true;
      if (!applyCloud(c.data)){ document.getElementById('cs-load').textContent = '불러오지 못했습니다'; }
    };
    document.getElementById('cs-keep').onclick = async () => {
      decided = true; d.classList.remove('show');
      await upload(true);
    };
  }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #cs-ov { position:absolute; inset:0; z-index:9100; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.92); font-family:"Gowun Batang",serif;
      padding:10px; box-sizing:border-box; }
    #cs-ov.show { display:flex; }
    #cs-ov .panel { max-height:100%; overflow-y:auto; box-sizing:border-box; width:min(90%,380px);
      background:#1a140c; border:1px solid #4a3c26; border-radius:16px; padding:20px;
      display:flex; flex-direction:column; gap:10px; }
    #cs-ov h3 { margin:0 0 4px; font-size:18px; color:#f0c96b; text-align:center; }
    #cs-ov .row { display:flex; justify-content:space-between; gap:10px; font-size:14px; color:#e6dbc2; }
    #cs-ov .row b { color:#f5ecd8; font-variant-numeric:tabular-nums; }
    #cs-ov .when { font-size:12px; color:#9d8f74; margin-top:-6px; }
    #cs-ov .p { padding:13px; border-radius:11px; font-family:inherit; font-size:15px; cursor:pointer;
      border:1px solid #4a3c26; }
    #cs-ov .load { background:#f0c96b; color:#241c12; border-color:#f0c96b; margin-top:6px; }
    #cs-ov .keep { background:#2a2013; color:#f5ecd8; }
    #cs-ov .note { font-size:12px; color:#9d8f74; text-align:center; line-height:1.6; }`;
    document.head.appendChild(s);
  }

  function status(){
    if (!uid) return '';
    if (!decided) return '계정 기록과 비교하는 중…';
    if (lastAt) return '기록이 계정에 저장됩니다 · 마지막 저장 ' + when(lastAt);
    return '기록이 계정에 저장됩니다';
  }
  function refresh(){ try { if (window.Auth && Auth.render) Auth.render(); } catch(e){} }

  function start(){
    if (!window.Auth || !Auth.enabled) return;
    let prevUid = null;
    Auth.onChange(u => {
      const id = u ? u.uid : null;
      if (id === prevUid) return;
      prevUid = id;
      if (u) onLogin(u); else onLogout();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) upload(false); });
    window.addEventListener('pagehide', () => upload(false));
    setInterval(() => upload(false), 60000);
  }
  start();

  return { upload: () => upload(false), status, COL };
})();
