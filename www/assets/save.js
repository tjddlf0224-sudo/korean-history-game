/* ============ 계정 저장 — 기록은 기기가 아니라 계정을 따라간다 ============

   왜
   - 2026-09-18 "같은 구글 계정으로 로그인했는데 양반에서 다시 노비가 됐네"
     → 진행 기록이 기기(localStorage)에만 있었다.
   - 2026-09-19 "기기 기준 말고 계정 기준으로 데이터가 연동되게 해줘"
     → 첫판(v143)은 기기 기록을 계정에 올리기만 해서, 새 아이디로 로그인하면
       이 기기 기록이 그 계정에 그대로 복사됐다.

   어떻게 — '이 기기 기록의 주인'을 적어 둔다 (khg_owner, 기기 전용)
   - 주인은 'guest'(비로그인) 또는 계정 uid.
   - 로그인했는데 주인이 **같은 계정**이면: 서버와 맞춘다. 다른 기기에서 더 새로
     저장된 것이 있으면 받아 오고, 이 기기가 더 새로우면 올린다.
   - 주인이 **다른 계정**이면: 이 기기 기록은 그 사람 것이다(이미 그 계정에 저장돼
     있다). 묻지 않고 이 계정의 기록으로 바꾼다. 계정에 기록이 없으면 처음부터.
   - 주인이 **비로그인**이고 해 둔 게 있으면: 한 번만 묻는다 —
     "지금 기록을 이 계정으로 가져갈까요?"
   - 로그아웃하면: 마지막으로 계정에 올린 뒤 기기 기록을 비우고 처음 상태로.
     같은 기기를 다른 사람이 써도 기록이 섞이지 않는다.
   - 로그인이 저절로 풀린 경우(onAuthStateChanged가 null)는 비우지 않는다 —
     토큰 문제 같은 일로 기록이 날아가면 안 된다. 올리지만 않는다.

   무엇을 싣나
   - khg_로 시작하는 게임 기록 키 전부(새 모듈이 생겨도 저절로 따라온다).
   - 기기 설정·진단용은 뺀다(LOCAL_ONLY). 소리 설정(ths_*)은 khg_가 아니라 원래 빠진다.
   - Firestore khg_save/<uid> = { data:JSON문자열, xp, at, v } — 규칙은 firestore.rules.

   붙이는 법(index.html): auth.js·board.js 뒤에 <script src="assets/save.js"></script>
   로그인은 목록 화면(index)에만 있으므로, 챕터에서 한 것은 목록으로 돌아올 때·
   앱을 내릴 때·1분마다 올라간다.
*/
window.CloudSave = (function(){
  const COL = 'khg_save';
  const VER = 2;
  const OWNER = 'khg_owner';        // 이 기기 기록의 주인
  const SYNC_AT = 'khg_sync_at';    // 이 기기가 서버와 마지막으로 맞춘 시각(서버 문서의 at)
  const SYNC_SIG = 'khg_sync_sig';  // 그때의 기록 서명 — 그 뒤로 이 기기에서 바뀌었는지 본다
  // 기기마다 따로 두는 것 — 옮기면 오히려 이상해지거나, 통계가 두 번 잡힌다
  const LOCAL_ONLY = new Set([
    OWNER, SYNC_AT, SYNC_SIG,
    'khg_err', 'khg_loop_err', 'khg_guide', 'khg_tm', 'khg_tm_id', 'khg_qstats',
    'khg_offline', 'khg_diff',
  ]);
  const MAX_BYTES = 900000;         // Firestore 문서 한 장이 1MB — 여유를 둔다

  let uid = null;
  let ready = false;                // 이번 로그인에서 서버와 맞추기가 끝났나(끝나기 전엔 안 올린다)
  let lastAt = 0;
  let busy = false;

  function db(){ try { return (window.Auth && Auth.db) || null; } catch(e){ return null; } }
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch(e){} }

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
    for (const k of syncKeys()) o[k] = lsGet(k);
    return JSON.stringify(o);
  }
  // 짧은 서명(같은 기록인지만 가린다)
  function sig(str){
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return str.length + ':' + (h >>> 0).toString(36);
  }
  function localXp(){ try { return (window.Rank && Rank.get().xp) || 0; } catch(e){ return 0; } }
  function hasProgress(){ return localXp() > 0 || syncKeys().some(k => /^khg_(badges|heroes|items|gold|srs|progress)$/.test(k)); }
  function changedSinceSync(){ return sig(snapshot()) !== (lsGet(SYNC_SIG) || ''); }

  function markSynced(at, dataStr){
    lsSet(SYNC_AT, String(at || 0));
    lsSet(SYNC_SIG, sig(dataStr));
  }

  async function upload(force){
    const d = db();
    if (!d || !uid || !ready || busy) return false;
    if (lsGet(OWNER) !== uid) return false;            // 남의 기록은 올리지 않는다
    const data = snapshot();
    if (!force && sig(data) === (lsGet(SYNC_SIG) || '')) return true;   // 바뀐 게 없다
    if (data.length > MAX_BYTES){ console.warn('[CloudSave] 기록이 너무 커서 올리지 못함', data.length); return false; }
    const doc = { data: data, xp: Math.round(localXp()), at: Date.now(), v: VER };
    busy = true;
    try {
      await d.collection(COL).doc(uid).set(doc);
      markSynced(doc.at, data);
      lastAt = doc.at;
      refresh();
      return true;
    } catch(e){ console.warn('[CloudSave] 올리기 실패', e); return false; }
    finally { busy = false; }
  }

  /* 기기 기록을 통째로 갈아 끼운다(dataStr이 없으면 처음 상태) → 새로 연다 */
  function replaceLocal(dataStr, owner, at){
    let o = {};
    if (dataStr){ try { o = JSON.parse(dataStr) || {}; } catch(e){ o = {}; } }
    try {
      for (const k of syncKeys()) localStorage.removeItem(k);
      for (const k of Object.keys(o)){
        if (k.indexOf('khg_') === 0 && !LOCAL_ONLY.has(k) && typeof o[k] === 'string') localStorage.setItem(k, o[k]);
      }
    } catch(e){ return false; }
    lsSet(OWNER, owner);
    markSynced(at || 0, snapshot());
    setTimeout(() => location.reload(), 300);
    return true;
  }

  let failed = false, trying = false;
  async function onLogin(u){
    uid = u.uid; ready = false; failed = false;
    const d = db(); if (!d) return;
    let snap = null;
    trying = true; refresh();
    try {
      // 연결이 붙지 않으면 get()이 끝나지 않는다 — 15초에 끊고 알린다(로그인 창을 다시 열면 재시도)
      snap = await Promise.race([
        d.collection(COL).doc(uid).get(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
      ]);
    }
    catch(e){ console.warn('[CloudSave] 읽기 실패 — 이번엔 맞추지 않음', e); failed = true; trying = false; refresh(); return; }
    trying = false;
    if (!window.Auth || !Auth.user || Auth.user.uid !== uid) return;     // 그새 로그아웃
    const c = (snap && snap.exists) ? snap.data() : null;
    const cData = (c && typeof c.data === 'string') ? c.data : null;
    const cAt = c ? (+c.at || 0) : 0;
    const owner = lsGet(OWNER) || 'guest';

    if (owner === uid){
      // 같은 계정 — 다른 기기에서 더 새로 저장된 게 있나
      const mySyncAt = +(lsGet(SYNC_AT) || 0);
      if (cData && cAt > mySyncAt){
        if (!changedSinceSync()){ replaceLocal(cData, uid, cAt); return; }   // 여기선 그 뒤로 안 했다 → 받는다
        // 양쪽 다 바뀌었다 — 더 많이 한 쪽(경험치)을 남긴다
        if ((+c.xp || 0) > localXp()){ replaceLocal(cData, uid, cAt); return; }
      }
      ready = true; lastAt = cAt;
      await upload(false);
      refresh();
      return;
    }

    if (owner !== 'guest'){
      // 다른 계정이 쓰던 기록 — 이 계정 것으로 바꾼다(없으면 처음부터)
      replaceLocal(cData, uid, cAt);
      return;
    }

    // 비로그인 기록 — 계정에 있는 것과 똑같으면(예: 이 기기에서 올린 것) 묻지 않고 잇는다
    if (cData && sig(cData) === sig(snapshot())){
      lsSet(OWNER, uid); markSynced(cAt, cData); ready = true; lastAt = cAt; refresh();
      return;
    }
    if (!hasProgress()){
      if (cData){ replaceLocal(cData, uid, cAt); return; }
      lsSet(OWNER, uid); ready = true;
      await upload(true);
      refresh();
      return;
    }
    ask(c, cData, cAt);
  }

  /* ---------------- 비로그인 기록을 가져갈지 묻는 창 ---------------- */
  function when(ms){
    if (!ms) return '';
    const dt = new Date(ms);
    return (dt.getMonth() + 1) + '월 ' + dt.getDate() + '일 ' +
      String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
  }
  function ask(c, cData, cAt){
    css();
    let d = document.getElementById('cs-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'cs-ov';
      (document.getElementById('wrap') || document.body).appendChild(d);
    }
    const mine = Math.round(localXp()).toLocaleString();
    d.innerHTML = '<div class="panel">' +
      '<h3>지금 기록을 이 계정으로 가져갈까요?</h3>' +
      '<div class="row"><span>로그인 전에 한 기록</span><b>경험치 ' + mine + '</b></div>' +
      (cData
        ? '<div class="row"><span>이 계정에 저장된 기록</span><b>경험치 ' + Math.round(+c.xp || 0).toLocaleString() + '</b></div>' +
          '<div class="when">' + when(cAt) + ' 저장</div>' +
          '<button class="p load" id="cs-acc">계정 기록으로 하기</button>' +
          '<button class="p keep" id="cs-take">지금 기록 가져가기</button>' +
          '<div class="note">지금 기록을 가져가면 계정에 저장된 기록이 지금 기록으로 바뀝니다.</div>'
        : '<div class="row"><span>이 계정에 저장된 기록</span><b>없음</b></div>' +
          '<button class="p load" id="cs-take">지금 기록 가져가기</button>' +
          '<button class="p keep" id="cs-acc">이 계정은 처음부터</button>' +
          '<div class="note">처음부터를 고르면 로그인 전에 한 기록은 이 기기에서 지워집니다.</div>') +
      '</div>';
    d.classList.add('show');
    document.getElementById('cs-acc').onclick = () => {
      d.querySelectorAll('button').forEach(b => b.disabled = true);
      replaceLocal(cData, uid, cAt);
    };
    document.getElementById('cs-take').onclick = async () => {
      d.classList.remove('show');
      lsSet(OWNER, uid); ready = true;
      await upload(true);
      refresh();
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
    #cs-ov h3 { margin:0 0 4px; font-size:17px; color:#f0c96b; text-align:center; text-wrap:balance; }
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

  /* ---------------- 로그아웃 · 계정 삭제 ---------------- */
  // auth.js가 로그아웃하기 **전에** 부른다 — 마지막 기록을 계정에 올린다
  async function beforeSignOut(){
    try { await upload(true); } catch(e){}
  }
  // 로그아웃·계정 삭제 **뒤에** 부른다 — 기기 기록을 비우고 처음 상태로
  function afterSignOut(){
    uid = null; ready = false; lastAt = 0;
    replaceLocal(null, 'guest', 0);
  }

  function status(){
    if (!uid) return '';
    if (failed) return '계정 기록을 불러오지 못했습니다. 인터넷을 확인하고 이 창을 다시 열어 주세요.';
    if (!ready) return '계정 기록과 맞추는 중…';
    const t = lastAt || +(lsGet(SYNC_AT) || 0);
    return '기록이 이 계정에 저장됩니다' + (t ? ' · 마지막 저장 ' + when(t) : '');
  }
  function refresh(){ try { if (window.Auth && Auth.render) Auth.render(); } catch(e){} }

  function start(){
    if (!window.Auth || !Auth.enabled) return;
    let prevUid = null;
    Auth.onChange(u => {
      const id = u ? u.uid : null;
      if (id === prevUid) return;
      prevUid = id;
      if (u) onLogin(u);
      else { uid = null; ready = false; refresh(); }   // 저절로 풀린 경우 — 비우지 않는다
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) upload(false); });
    window.addEventListener('pagehide', () => upload(false));
    setInterval(() => upload(false), 60000);
  }
  start();

  // 로그인 창을 열 때 — 맞추기가 실패했거나 멈춰 있으면 다시 한 번
  function retry(){
    if (uid && !ready && !trying && window.Auth && Auth.user && Auth.user.uid === uid) onLogin(Auth.user);
  }

  return { upload: () => upload(false), status, retry, beforeSignOut, afterSignOut, COL };
})();
