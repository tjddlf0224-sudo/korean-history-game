/* ============ 로그인 (구글 · 애플) ============

   왜 필요한가
   - 랭킹을 서버에 두려면 "누구의 점수인지"가 있어야 한다. 기기 안에만 두면
     폰을 바꾸는 순간 사라지고, 남과 겨룰 수도 없다.

   왜 이 방식인가 — 보카 바리스타와 같은 구조
   - 앱에서는 네이티브 플러그인(@capacitor-firebase/authentication)이 구글·애플
     로그인 창을 띄워 **자격증명만** 받아 오고, 실제 로그인은 웹 SDK가 한다
     (capacitor.config.json의 skipNativeAuth: true).
     그래야 Firestore 규칙의 request.auth 와 결이 맞는다.
   - 웹(브라우저)에서는 플러그인이 없으므로 팝업 로그인으로 떨어진다.
     한 벌의 코드로 앱과 웹을 다 덮는다.

   설정이 없으면 조용히 꺼진다
   - firebase_config.js가 비어 있으면 로그인 단추를 아예 만들지 않는다.
     게임은 로그인 없이도 끝까지 되어야 하므로, 여기서 오류를 내면 안 된다.

   붙이는 법 (index.html)
     <script src="vendor/firebase/firebase-app-compat.js"></script>
     <script src="vendor/firebase/firebase-auth-compat.js"></script>
     <script src="vendor/firebase/firebase-firestore-compat.js"></script>
     <script src="assets/firebase_config.js"></script>
     <script src="assets/auth.js"></script>
*/
window.Auth = (function(){

  const cfg = window.FIREBASE_CONFIG || {};
  const ready = !!(cfg.apiKey && cfg.projectId);

  let auth = null, db = null, user = null;
  const listeners = [];

  function init(){
    if (!ready || typeof firebase === 'undefined') return false;
    try {
      firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      auth.onAuthStateChanged(u => {
        user = u;
        render();
        listeners.forEach(f => { try { f(u); } catch(e){} });
      });
      // 팝업이 막혀 리다이렉트로 다녀온 경우, 실패했으면 그 까닭을 보여 준다.
      // 성공은 위의 onAuthStateChanged가 알아서 받는다.
      auth.getRedirectResult().catch(e => {
        // 로그인 창이 아직 안 떠 있을 수 있으니, 띄우고 그 자리에 적는다
        redirectErr = msgOf(e);
        const box = document.getElementById('auth-err');
        if (box) box.textContent = redirectErr;
      });
      return true;
    } catch(e){
      console.warn('파이어베이스 초기화 실패 — 로그인 없이 진행', e);
      return false;
    }
  }

  /* 네이티브 플러그인이 있으면 그걸 쓰고, 없으면 웹 팝업 */
  function nativePlugin(){
    return (window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.FirebaseAuthentication) || null;
  }

  /* 웹에서는 팝업으로 연다. 그런데 **사파리는 팝업을 자주 막는다** —
     특히 아이폰에서 홈 화면에 담아 쓰는 경우, 팝업 자체가 열리지 않는다.
     그때 그냥 실패로 끝내면 로그인할 길이 없어지므로, 같은 창을 그대로
     넘겨 보내는 방식(redirect)으로 갈아탄다. 돌아오면 completeRedirect()가
     받는다. 사용자가 스스로 닫은 경우는 갈아타지 않는다 — 취소한 것이다. */
  function blockedPopup(e){
    const c = (e && (e.code || e.message)) || '';
    return /popup-blocked|operation-not-supported|web-storage-unsupported/i.test(c);
  }
  async function webSignIn(provider){
    try {
      await auth.signInWithPopup(provider);
    } catch(e){
      if (!blockedPopup(e)) throw e;
      await auth.signInWithRedirect(provider);
      // 여기서 화면이 넘어간다. 아래 줄은 실행되지 않는다.
    }
  }

  async function signInGoogle(){
    const np = nativePlugin();
    if (np){
      const r = await np.signInWithGoogle({ scopes: ['profile', 'email'] });
      const c = (r && r.credential) || {};
      await auth.signInWithCredential(
        firebase.auth.GoogleAuthProvider.credential(c.idToken, c.accessToken));
    } else {
      await webSignIn(new firebase.auth.GoogleAuthProvider());
    }
  }

  async function signInApple(){
    const np = nativePlugin();
    if (np){
      const r = await np.signInWithApple({ scopes: ['name', 'email'] });
      const c = (r && r.credential) || {};
      const p = new firebase.auth.OAuthProvider('apple.com');
      // rawNonce를 같이 넘겨야 한다 — 안 넘기면 애플이 토큰을 거부한다.
      await auth.signInWithCredential(p.credential({ idToken: c.idToken, rawNonce: c.nonce }));
    } else {
      await webSignIn(new firebase.auth.OAuthProvider('apple.com'));
    }
  }

  async function signOut(){
    const np = nativePlugin();
    try { if (np) await np.signOut(); } catch(e){}
    await auth.signOut();
  }

  /* ============ 계정 삭제 ============
     애플 심사 요구사항이다(5.1.1(v)): 앱 안에서 계정을 만들 수 있으면
     앱 안에서 지울 수도 있어야 한다. 없으면 심사에서 떨어진다.

     지우는 것: 파이어베이스 계정, 랭킹에 올린 내 문서(khg_rank/<uid>).
     안 지우는 것: 이 기기의 게임 기록(localStorage) — 계정과 무관하게
     기기에 있는 것이고, 지우고 싶으면 메뉴의 '진행 기록 초기화'가 따로 있다.
     학습 통계(khg_qstats)는 익명 집계라 사람과 연결되지 않는다.

     '최근 로그인' 문제: 파이어베이스는 보안상 로그인한 지 오래된 계정의
     삭제를 거부한다(auth/requires-recent-login). 그때는 방금 다시 로그인하고
     눌러 달라고 안내한다 — 여기서 몰래 재인증을 돌리면 더 헷갈린다. */
  async function deleteAccount(){
    if (!auth || !user) throw new Error('로그인 상태가 아닙니다');
    const uid = user.uid;
    // 랭킹 문서부터 지운다 — 계정을 먼저 지우면 권한이 사라져 못 지운다
    try { if (db) await db.collection('khg_rank').doc(uid).delete(); }
    catch(e){ /* 규칙이 삭제를 막고 있으면 계정만 지운다. 문서는 콘솔에서 지울 수 있다. */ }
    await user.delete();
  }

  /* ---------------- 화면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #auth-btn { display:inline-flex; align-items:center; gap:6px; height:34px;
      padding:0 13px; border-radius:17px; background:rgba(26,20,12,.82);
      border:1px solid #4a3c26; color:#f0c96b; font-family:"Gowun Batang",serif;
      font-size:13px; cursor:pointer; }
    #auth-btn:active { transform:scale(.97); }
    #auth-btn img { width:20px; height:20px; border-radius:50%; }

    #auth-ov .del { display:none; margin-top:2px; background:none; border:0;
      color:#a05a4a; font-family:inherit; font-size:12px; cursor:pointer;
      text-decoration:underline; text-underline-offset:3px; padding:4px; }
    #auth-ov.in .del { display:block; }
    #auth-ov { position:absolute; inset:0; z-index:9000; display:none;
      align-items:center; justify-content:center; background:rgba(8,6,3,.9);
      font-family:"Gowun Batang",serif; }
    #auth-ov.show { display:flex; }
    #auth-ov .panel { width:min(90%,380px); background:#1a140c; border:1px solid #4a3c26;
      border-radius:16px; padding:22px 20px; display:flex; flex-direction:column; gap:12px; }
    #auth-ov h3 { margin:0; font-size:18px; color:#f0c96b; text-align:center; }
    #auth-ov .sub { text-align:center; font-size:12.5px; color:#b8a888;
      line-height:1.7; margin:-4px 0 6px; }
    #auth-ov button.p { display:flex; align-items:center; justify-content:center; gap:8px;
      padding:13px; border-radius:11px; font-family:inherit; font-size:15px; cursor:pointer;
      border:1px solid transparent; }
    #auth-ov .g { background:#f5f2ea; color:#241c12; }
    #auth-ov .a { background:#000; color:#fff; border-color:#4a4a4a; }
    #auth-ov .out { background:#2a2013; color:#f5ecd8; border-color:#4a3c26; }
    #auth-ov .close { background:none; border:0; color:#8d7f66; font-family:inherit;
      font-size:13.5px; cursor:pointer; padding:6px; }
    #auth-ov .err { min-height:17px; text-align:center; font-size:12.5px; color:#e8836e; }
    #auth-ov .me { text-align:center; font-size:13.5px; color:#e6dbc2; }`;
    document.head.appendChild(s);
  }

  const G_ICON = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.4a4.6 4.6 0 01-2 3.02v2.5h3.23c1.9-1.74 2.97-4.3 2.97-7.35z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0012 22z"/><path fill="#FBBC05" d="M6.4 13.89a6 6 0 010-3.78V7.53H3.07a10 10 0 000 8.94l3.33-2.58z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.95 2.99 14.7 2 12 2A10 10 0 003.07 7.53L6.4 10.1C7.2 7.75 9.4 5.98 12 5.98z"/></svg>';
  const A_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.3 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1.1 2.6-2.2.8-1.2 1.2-2.4 1.2-2.5 0 0-2.2-.9-2.2-3.4z"/><path d="M14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z"/></svg>';

  function mount(){
    if (!ready) return;              // 설정이 없으면 단추도 만들지 않는다
    css();
    if (document.getElementById('auth-ov')) return;
    const d = document.createElement('div');
    d.id = 'auth-ov';
    d.innerHTML = '<div class="panel">' +
      '<h3>기록을 지키기</h3>' +
      '<div class="sub" id="auth-sub">로그인하면 다른 기기에서도 이어서 하고,<br>' +
      '랭킹에 이름을 올릴 수 있습니다.</div>' +
      '<div class="me" id="auth-me"></div>' +
      '<button class="p g" id="auth-g">' + G_ICON + ' 구글로 계속하기</button>' +
      '<button class="p a" id="auth-a">' + A_ICON + ' Apple로 계속하기</button>' +
      '<button class="p out" id="auth-out">로그아웃</button>' +
      '<button class="del" id="auth-del">계정 삭제</button>' +
      '<div class="err" id="auth-err"></div>' +
      '<button class="close" id="auth-x">닫기</button></div>';
    // **#wrap 안에** 넣는다 — 밖이면 세로 모드에서 rotate(90deg)를 못 물려받아
    // 로그인 창만 90도 틀어져 뜬다(이달의 시대·랭킹에서 겪은 것과 같은 함정).
    (document.getElementById('wrap') || document.body).appendChild(d);

    const err = t => { document.getElementById('auth-err').textContent = t || ''; };
    const wrap = fn => async () => {
      err('');
      try { await fn(); close(); }
      catch(e){ err(msgOf(e)); }
    };
    document.getElementById('auth-g').onclick = wrap(signInGoogle);
    document.getElementById('auth-a').onclick = wrap(signInApple);
    document.getElementById('auth-out').onclick = wrap(signOut);
    // 계정 삭제는 두 번 눌러야 한다 — 한 번에 지워지는 삭제는 사고를 만든다
    const delBtn = document.getElementById('auth-del');
    let delArmed = 0;
    delBtn.onclick = async () => {
      err('');
      if (Date.now() - delArmed > 6000){
        delArmed = Date.now();
        delBtn.textContent = '정말 지우시겠습니까? 한 번 더 누르면 지웁니다';
        setTimeout(() => { if (Date.now() - delArmed >= 6000){
          delBtn.textContent = '계정 삭제'; } }, 6200);
        return;
      }
      delArmed = 0;
      delBtn.textContent = '지우는 중…';
      try {
        await deleteAccount();
        delBtn.textContent = '계정 삭제';
        err('계정을 지웠습니다. 이 기기의 게임 기록은 남아 있습니다.');
        render();
      } catch(e){
        delBtn.textContent = '계정 삭제';
        if (/requires-recent-login/i.test((e && e.code) || '')){
          err('보안을 위해 방금 로그인한 상태에서만 지울 수 있습니다.\n로그아웃 후 다시 로그인하고 눌러 주세요.');
        } else err(msgOf(e));
      }
    };
    document.getElementById('auth-x').onclick = close;
    d.onclick = e => { if (e.target === d) close(); };
  }

  /* 오류 문구는 그대로 보여 주면 무슨 소린지 모른다 — 흔한 것만 우리말로 */
  function msgOf(e){
    const c = (e && (e.code || e.message)) || '';
    if (/popup-closed|canceled|cancelled|1001/i.test(c)) return '로그인을 취소했습니다.';
    if (/network/i.test(c)) return '인터넷 연결을 확인해 주세요.';
    if (/operation-not-allowed/i.test(c)) return '이 로그인 방식이 아직 켜져 있지 않습니다(콘솔에서 켜야 합니다).';
    if (/account-exists-with-different-credential/i.test(c))
      return '같은 이메일이 다른 방식으로 이미 가입돼 있습니다.';
    return '로그인에 실패했습니다: ' + (e && e.message ? e.message : c);
  }

  let redirectErr = '';
  function open(){
    mount(); render();
    const box = document.getElementById('auth-err');
    if (box && redirectErr){ box.textContent = redirectErr; redirectErr = ''; }
    const d = document.getElementById('auth-ov'); if (d) d.classList.add('show');
  }
  function close(){ const d = document.getElementById('auth-ov'); if (d) d.classList.remove('show'); }

  function render(){
    const b = document.getElementById('auth-btn');
    if (b){
      b.innerHTML = user
        ? (user.photoURL ? `<img src="${user.photoURL}" alt="">` : '') +
          (nameOf(user))
        : '로그인';
    }
    const me = document.getElementById('auth-me');
    if (me) me.textContent = user ? `${nameOf(user)} 님으로 로그인돼 있습니다` : '';
    for (const id of ['auth-g', 'auth-a']){
      const el = document.getElementById(id);
      if (el) el.style.display = user ? 'none' : 'flex';
    }
    const out = document.getElementById('auth-out');
    if (out) out.style.display = user ? 'flex' : 'none';
    // 계정 삭제는 로그인 상태에서만 보인다(.in 이 붙어야 CSS가 내보인다)
    const ov = document.getElementById('auth-ov');
    if (ov) ov.classList.toggle('in', !!user);
    const sub = document.getElementById('auth-sub');
    if (sub) sub.style.display = user ? 'none' : 'block';
  }

  function nameOf(u){
    return (u && (u.displayName || (u.email || '').split('@')[0])) || '이름 없음';
  }

  /* 챕터 목록 같은 데 단추를 하나 붙여 준다 */
  function attach(container){
    if (!ready || !container) return null;
    css();
    if (document.getElementById('auth-btn')) return document.getElementById('auth-btn');
    const b = document.createElement('button');
    b.id = 'auth-btn'; b.type = 'button';
    b.onclick = open;
    container.appendChild(b);
    render();
    return b;
  }

  function onChange(f){ listeners.push(f); if (user) f(user); }

  const started = init();

  return {
    get enabled(){ return ready && started; },
    get user(){ return user; },
    get db(){ return db; },
    signInGoogle, signInApple, signOut, open, close, attach, onChange, mount,
  };
})();
