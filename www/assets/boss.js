/* ============ 보스전 (전 챕터 공용) ============
   보카바리스타 탐험 전투의 구조를 한국사 게임에 옮긴 것.
   몬스터 자리에 그 시대의 인물(보스 NPC)이 서고, 무기 대신 "아는 것"으로 싸운다.

   설계 근거
   - 진단: 이 게임은 "왜 계속 하는가"(신분·경험치)는 생겼지만 "지금 이 순간이
     재밌는가"가 비어 있었다. 실제로 같은 소재의 선례(한국사 RPG 난세의 영웅)가
     "교육에 치우쳐 게이머가 오지 않았다"며 2기에서 장르를 갈아탔다.
   - Prodigy Math(세계 최대 학습 RPG)의 핵심은 한 줄이다:
       정답 → 공격이 나간다 / 오답 → 그 턴을 잃는다.
     문제 풀이가 곧 게임 행동이라 학습과 재미가 분리되지 않는다. 그 구조를 쓴다.
   - 사용자가 4지선다를 거부했으므로 **문제 난이도는 그대로 2지선다**를 쓴다.
     대신 결과에 게임적 의미를 붙여 긴장을 만든다(HP·연속정답 배율·반격).

   보카바리스타에서 가져온 것
   - 아레나 레이아웃(적 우상단/나 좌하단, 각자 HP바), 타격 연출(화면 흔들림 +
     임팩트 플래시 + 파티클 + 데미지 팝업), 크리티컬, 햅틱, 연출 스킵 탭.

   쓰는 법 (챕터 파일에서)
     Boss.start({
       name: '연개소문',
       img: 'assets/portraits/yeongaesomun.png',
       hp: 5,                       // 맞혀야 하는 문제 수(=보스 체력 칸)
       questions: [{q, opts, answer, feedback}],   // 기존 퀴즈와 같은 형식
       onWin: (r) => {...}, onLose: (r) => {...}   // r = {hit, total, best}
     });
*/
window.Boss = (function(){

  let S = null;          // 현재 전투 상태
  let injected = false;

  /* ---------------- 화면 ---------------- */
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    #boss-ov { position:fixed; inset:0; z-index:95; display:none;
      flex-direction:column; background:#0d0a06; font-family:"Gowun Batang",serif;
      color:#f5ecd8; }
    #boss-ov.show { display:flex; }

    /* 무대 — 배경은 그 챕터 지도를 흐리게 깔아 "여기서 싸운다" 느낌을 준다 */
    .bs-arena { flex:1 1 auto; position:relative; overflow:hidden;
      background:#1a140c center/cover no-repeat; }
    .bs-arena::after { content:''; position:absolute; inset:0; pointer-events:none;
      background:radial-gradient(ellipse 84% 76% at 50% 46%, transparent 46%, rgba(6,4,2,.72) 100%); }
    .bs-arena.shake { animation:bs-shake .28s; }
    @keyframes bs-shake { 0%,100%{transform:translate(0,0);} 20%{transform:translate(-7px,3px);}
      40%{transform:translate(6px,-4px);} 60%{transform:translate(-4px,-2px);} 80%{transform:translate(4px,3px);} }

    /* 배치는 보카바리스타 탐험 전투를 따른다: 내 캐릭터는 왼쪽 아래에서
       뒤통수를 보이고(어깨 너머 시점), 상대는 오른쪽에 더 위(=멀리) 선다.
       내가 등을 보여야 "내가 저기 서 있다"는 느낌이 나고, 상대가 위에
       있어야 거리감이 생긴다. */
    .bs-sprite { position:absolute; z-index:5; filter:drop-shadow(0 8px 7px rgba(0,0,0,.55)); }
    /* 초상이 없는 보스 — 먹으로 친 듯한 실루엣에 이름을 얹는다 */
    .bs-silhouette { width:100%; aspect-ratio:3/4; border-radius:46% 46% 12% 12%;
      background:linear-gradient(180deg,#2a2118 0%,#171208 100%);
      border:1px solid rgba(201,162,74,.45); display:flex; align-items:flex-end;
      justify-content:center; padding-bottom:12%;
      box-shadow:0 0 30px rgba(0,0,0,.6), inset 0 12px 30px rgba(0,0,0,.5); }
    .bs-silhouette span { font-family:"Gowun Batang",serif; font-size:15px; font-weight:700;
      color:#e9c979; letter-spacing:.14em; text-shadow:0 2px 8px rgba(0,0,0,.9); }
    /* 보스를 조금 내렸다 — 예전 bottom:22%/height:56% 는 머리 꼭대기가
       무대 높이의 22%에 걸려, 왼쪽 위 체력창(top:5% + 약 54px) 아래로
       들어가 얼굴이 가려졌다("Hp박스에 얼굴이 가려지지 않게").
       bottom:6%/height:54% 면 머리가 무대의 40% 자리에서 시작해
       가로모드(무대 약 200px)에서 20px 넘게 여유가 생긴다.
       하반신이 아래 문제창 쪽으로 내려오는 것은 괜찮다고 하셨다. */
    .bs-enemy { bottom:6%; right:max(11%, calc(env(safe-area-inset-right) + 14px)); height:60%; }  /* 새 그림(2026-09-18)은 무기 자리 여백이 있어 조금 키웠다 */
    .bs-enemy img { height:100%; width:auto; object-fit:contain; display:block;
      animation:bs-breathe 2.8s ease-in-out infinite; transform-origin:50% 100%; }
    /* 보스는 자세가 두 장이다(2026-09-18): 평소(숨쉬기)와 공격(오답일 때).
       두 장은 같은 캔버스에 발을 맞춰 그려 두어서 바꿔 끼워도 자리가 튀지 않는다. */
    .bs-enemy .bs-atk { display:none; }
    .bs-enemy.attacking .bs-idle { display:none; }
    .bs-enemy.attacking .bs-atk { display:block; animation:none; }
    @keyframes bs-breathe { 0%,100%{transform:scale(1,1);} 50%{transform:scale(1.012,.982) translateY(1px);} }
    .bs-self { bottom:3%; left:max(11%, calc(env(safe-area-inset-left) + 14px)); height:55%; }  /* 전투 그림은 위에 갓 자리 여백이 있어 조금 키웠다 */
    /* 동료(차돌이·바우) — 주인공 뒤, 한 발 물러선 자리. 노치가 왼쪽에 오는
       가로모드에서 bau가 안전 영역 계산 없이 left:3%라 카메라 홈에
       가려졌다(제보: "동료 바우가 노치에 가려져"). */
    .bs-mate { position:absolute; z-index:4; width:auto; pointer-events:none;
      filter:drop-shadow(0 6px 6px rgba(0,0,0,.5)) brightness(.9); }
    .bs-mate-bau { bottom:8%; left:max(3%, calc(env(safe-area-inset-left) + 6px)); height:52%; }
    .bs-mate-chadol { bottom:2%; left:27%; height:33%; z-index:6; }
    .bs-self img { height:100%; width:auto; object-fit:contain; display:block;
      animation:bs-bob 3.8s ease-in-out infinite; }
    @keyframes bs-bob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
    .bs-sprite.lunge { animation:bs-lunge .3s ease-out; }
    @keyframes bs-lunge { 50%{ transform:translateX(var(--lx,26px)) scale(1.04); } }
    .bs-sprite.hit { animation:bs-hit .3s; }
    @keyframes bs-hit { 0%,100%{opacity:1;} 25%,75%{opacity:.25;} }

    /* 이름 + 체력 */
    .bs-info { position:absolute; z-index:6; width:38%; max-width:230px;
      background:rgba(16,11,5,.74); border:1px solid rgba(240,201,107,.42);
      border-radius:10px; padding:5px 10px; }
    /* 내 정보가 왼쪽 위, 상대가 오른쪽 위 — 각자 자기 캐릭터 쪽 위에 붙는다 */
    .bs-info-p { top:5%; left:max(5%, calc(env(safe-area-inset-left) + 8px)); }
    .bs-info-e { top:5%; right:max(5%, calc(env(safe-area-inset-right) + 8px)); }
    .bs-info .nm { font-size:13px; font-weight:700; color:#f0c96b; margin-bottom:3px; }
    .bs-hp { height:9px; border-radius:999px; background:rgba(0,0,0,.6);
      border:1px solid rgba(240,201,107,.3); overflow:hidden; }
    .bs-hp i { display:block; height:100%; border-radius:999px;
      background:linear-gradient(90deg,#b6483c,#e0705f); transition:width .45s cubic-bezier(.2,.8,.3,1); }
    .bs-info-p .bs-hp i { background:linear-gradient(90deg,#c9962e,#f0c96b); }
    .bs-hptxt { font-size:10px; color:#c9bda6; margin-top:2px; text-align:right;
      font-variant-numeric:tabular-nums; }

    /* 연속 정답 배율 — 정보창이 위쪽 양옆을 쓰므로 가운데 위에 둔다 */
    .bs-combo { position:absolute; top:5%; left:50%; transform:translateX(-50%);
      z-index:7; text-align:center;
      font-weight:700; color:#f0c96b; text-shadow:0 2px 8px rgba(0,0,0,.8);
      opacity:0; transition:opacity .2s; }
    .bs-combo.on { opacity:1; }
    .bs-combo .x { font-size:26px; }
    .bs-combo .l { font-size:10px; color:#e8dcc2; display:block; }

    /* 타격 연출 */
    .bs-flash { position:absolute; inset:0; z-index:6; pointer-events:none;
      background:rgba(255,255,255,.5); animation:bs-flash .13s ease-out forwards; }
    @keyframes bs-flash { to { opacity:0; } }
    .bs-part { position:absolute; width:9px; height:9px; border-radius:50%; background:#fff7e6;
      pointer-events:none; z-index:9; box-shadow:0 0 7px 2px rgba(240,201,107,.9);
      animation:bs-part .5s ease-out forwards; }
    .bs-part.crit { width:12px; height:12px; background:#f0c96b; }
    @keyframes bs-part { to { transform:translate(var(--dx),var(--dy)) scale(.3); opacity:0; } }
    .bs-pop { position:absolute; z-index:10; font-weight:700; font-size:24px; color:#fff7e6;
      text-shadow:0 2px 8px rgba(0,0,0,.85); pointer-events:none;
      animation:bs-pop 1s cubic-bezier(.2,.8,.3,1) forwards; }
    .bs-pop.crit { color:#f0c96b; font-size:30px; }
    .bs-pop.miss { color:#9a9080; font-size:19px; }
    @keyframes bs-pop { 0%{opacity:0; transform:translateY(10px) scale(.7);}
      20%{opacity:1; transform:translateY(0) scale(1.15);} 35%{transform:scale(1);}
      100%{opacity:0; transform:translateY(-34px);} }

    /* 아래 — 대사 + 문제 */
    .bs-bottom { flex:none; background:#1a140c; border-top:1px solid #4a3c26;
      /* 가로로 든 아이폰은 노치·둥근 모서리가 양옆에 온다 — 양쪽 모두 안전 여백을 둔다(2026-09-18 제보: 왼쪽 글자가 노치에 가림) */
      padding:12px max(16px, calc(env(safe-area-inset-left) + 8px), calc(env(safe-area-inset-right) + 8px)) calc(14px + env(safe-area-inset-bottom));
      max-height:52%; overflow-y:auto; }
    .bs-msg { font-size:14px; line-height:1.6; color:#e8dcc2; min-height:22px; margin-bottom:10px; }
    .bs-msg b { color:#f0c96b; }
    .bs-q { font-size:16px; font-weight:700; line-height:1.55; color:#f9f1de; margin-bottom:11px; }
    .bs-opts { display:flex; flex-direction:column; gap:8px; }
    .bs-opt { padding:13px 15px; border-radius:11px; border:1px solid #51432c; background:#2a2013;
      color:#f5ecd8; font-size:15.5px; text-align:left; font-family:inherit; cursor:pointer;
      line-height:1.5; }
    .bs-opt:active { transform:scale(.985); }
    .bs-opt.correct { background:#253d2c; border-color:#7faf8b; }
    .bs-opt.wrong { background:#3d2622; border-color:#d96b5f; }
    .bs-opt:disabled { opacity:.55; cursor:default; }

    /* 결과 — 나무 현판 옷(시안 A). 예전엔 이 화면만 옛 어두운 판이라 밋밋했다
       (제보: "이것도 너무 밋밋해"). 월계관 배지는 제미나이로 새로 뽑았다. */
    .bs-end { position:absolute; inset:0; z-index:20; display:flex; align-items:center;
      justify-content:center; background:rgba(8,6,3,.86); overflow:visible; }
    .bs-end .card { position:relative; width:min(84vw,380px); text-align:center;
      padding:38px 22px 24px; box-sizing:border-box;
      background:linear-gradient(180deg,#fffaf0,#f1e2c3); border-radius:4px;
      border-style:solid; border-width:40px 44px 40px 44px;
      border-image:url(assets/ui/frame.webp) 195 205 195 205 fill / 40px 44px 40px 44px stretch;
      box-shadow:0 18px 60px rgba(0,0,0,.7);
      animation:bs-card .5s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes bs-card { 0%{opacity:0; transform:scale(.9) translateY(10px);} 100%{opacity:1; transform:none;} }
    .bs-badge { position:relative; width:128px; height:136px; margin:-20px auto 4px;
      background:url(assets/ui/badge_wreath.webp) center/contain no-repeat;
      display:flex; align-items:center; justify-content:center; }
    .bs-end.win .bs-badge { filter:drop-shadow(0 0 16px rgba(240,201,107,.7)); }
    .bs-end.lose .bs-badge { filter:grayscale(1) brightness(.6) drop-shadow(0 0 8px rgba(0,0,0,.5)); }
    .bs-end .ttl { font-size:23px; font-weight:700; color:#6b3a12; letter-spacing:.04em; }
    .bs-end .sub { font-size:13.5px; color:#7d6243; line-height:1.7; }
    .bs-end button { margin-top:18px; background:linear-gradient(180deg,#ffe38a,#f2b83e);
      border:2px solid #b27c1f; color:#4a2e08; font-weight:700;
      border-radius:11px; padding:12px 26px; font-family:inherit; font-size:14px; cursor:pointer;
      box-shadow:0 3px 0 #9a6614; }
    .bs-end.lose button { background:linear-gradient(180deg,#e8dcc2,#c9bda6);
      border-color:#8a7a5c; color:#3b2a17; box-shadow:0 3px 0 #6d6250; }
    /* 승리 순간 배지에서 금빛 조각이 터져 나온다 */
    .bs-burst { position:absolute; left:50%; top:50%; width:8px; height:8px; margin:-4px;
      border-radius:50%; background:#f7dd93; box-shadow:0 0 6px 1px rgba(240,201,107,.8);
      pointer-events:none; }

    @media (prefers-reduced-motion:reduce){
      .bs-arena.shake,.bs-sprite.lunge,.bs-sprite.hit,.bs-part,.bs-pop,.bs-end .card
      { animation-duration:.01ms !important; }
    }`;
    document.head.appendChild(st);
  }

  function mount(){
    if (document.getElementById('boss-ov')) return;
    const d = document.createElement('div');
    d.id = 'boss-ov';
    d.innerHTML =
      '<div class="bs-arena" id="bs-arena">' +
        '<div class="bs-info bs-info-e"><div class="nm" id="bs-ename"></div>' +
          '<div class="bs-hp"><i id="bs-ehp"></i></div><div class="bs-hptxt" id="bs-ehptxt"></div></div>' +
        '<div class="bs-info bs-info-p"><div class="nm" id="bs-pname"></div>' +
          '<div class="bs-hp"><i id="bs-php"></i></div><div class="bs-hptxt" id="bs-phptxt"></div></div>' +
        '<div class="bs-combo" id="bs-combo"><span class="x"></span><span class="l">연속 정답</span></div>' +
        '<div class="bs-sprite bs-enemy" id="bs-e"></div>' +
        '<div class="bs-sprite bs-self" id="bs-p"></div>' +
      '</div>' +
      '<div class="bs-bottom">' +
        '<div class="bs-msg" id="bs-msg"></div>' +
        '<div class="bs-q" id="bs-q"></div>' +
        '<div class="bs-opts" id="bs-opts"></div>' +
      '</div>';
    // #wrap 안에 붙인다. 세로로 든 휴대폰에서 #wrap이 rotate(90deg)로
    // 가로모드를 만드는데, 밖에 붙이면 전투 화면만 90도 틀어진다.
    (document.getElementById('wrap') || document.body).appendChild(d);
  }

  /* ---------------- 연출 ---------------- */
  function shake(level){
    const a = document.getElementById('bs-arena');
    a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake');
    setTimeout(() => a.classList.remove('shake'), 300);
    // 무대(캔버스)까지 같이 흔들고 당긴다. 전투 칸만 흔들리면 그 칸 안의 일로 보인다.
    if (window.Fx) Fx.impact(level || 1);
  }
  function hitFx(anchorId, crit){
    const arena = document.getElementById('bs-arena'), el = document.getElementById(anchorId);
    if (!arena || !el) return;
    const fl = document.createElement('div'); fl.className = 'bs-flash';
    arena.appendChild(fl); setTimeout(() => fl.remove(), 150);
    const cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight * 0.42;
    for (let i = 0; i < (crit ? 9 : 6); i++){
      const p = document.createElement('div');
      p.className = 'bs-part' + (crit ? ' crit' : '');
      const ang = Math.random() * Math.PI * 2, dist = 24 + Math.random() * 34;
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * dist - 12) + 'px');
      arena.appendChild(p); setTimeout(() => p.remove(), 540);
    }
  }
  function pop(who, text, kind){
    const arena = document.getElementById('bs-arena');
    const el = document.getElementById(who === 'e' ? 'bs-e' : 'bs-p');
    const d = document.createElement('div');
    d.className = 'bs-pop' + (kind ? ' ' + kind : '');
    d.textContent = text;
    d.style.left = (el.offsetLeft + el.offsetWidth * 0.35) + 'px';
    d.style.top  = (el.offsetTop  + el.offsetHeight * 0.2) + 'px';
    arena.appendChild(d); setTimeout(() => d.remove(), 1000);
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------------- 상태 표시 ---------------- */
  function bars(){
    const e = Math.max(0, S.eHp) / S.eMax, p = Math.max(0, S.pHp) / S.pMax;
    document.getElementById('bs-ehp').style.width = (e * 100) + '%';
    document.getElementById('bs-php').style.width = (p * 100) + '%';
    document.getElementById('bs-ehptxt').textContent = Math.max(0, S.eHp) + ' / ' + S.eMax;
    document.getElementById('bs-phptxt').textContent = Math.max(0, S.pHp) + ' / ' + S.pMax;
    const c = document.getElementById('bs-combo');
    c.classList.toggle('on', S.combo >= 2);
    c.querySelector('.x').textContent = '×' + S.combo;
  }
  function msg(html){ document.getElementById('bs-msg').innerHTML = html; }

  /* ---------------- 문제 ---------------- */
  function ask(){
    const q = S.questions[S.qIdx % S.questions.length];
    S.cur = q;
    // 선택지 순서를 섞어 위치를 외우지 못하게 한다
    S.order = q.opts.map((_, i) => i);
    for (let i = S.order.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [S.order[i], S.order[j]] = [S.order[j], S.order[i]];
    }
    document.getElementById('bs-q').textContent = q.q;
    const box = document.getElementById('bs-opts');
    box.innerHTML = '';
    S.btns = S.order.map((orig, i) => {
      const b = document.createElement('button');
      b.className = 'bs-opt';
      b.textContent = (i + 1) + '. ' + q.opts[orig];
      b.onclick = () => answer(i);
      box.appendChild(b);
      return b;
    });
  }

  /* 동료 한마디 — 차돌이·바우가 합류해 있으면 전투 중에 한 줄씩 끼어든다(2026-09-19).
     같은 줄만 반복되면 금방 질리니 몇 개 중에서 고른다. */
  const CHEER = {
    combo:  [['chadol', '형아 최고! 한 번 더!'], ['chadol', '(깡충깡충) 맞았다, 맞았어!'], ['bau', '그 기세요! 밀어붙이시오!']],
    hurt:   [['bau', '(앞을 막아선다) 괜찮소, 다음이 있소!'], ['chadol', '형아, 힘내요!']],
    last:   [['bau', '한 번만 더 버티시오. 내가 뒤에 있소.'], ['chadol', '(형아 손을 꼭 잡는다) …할 수 있어요.']],
  };
  function cheer(kind){
    if (!window.Party || !Party.members) return '';
    const who = Party.members();
    const pool = CHEER[kind].filter(([id]) => who.indexOf(id) >= 0);
    if (!pool.length) return '';
    const [id, t] = pool[Math.floor(Math.random() * pool.length)];
    return `<br><span style="color:#b9d4a8">${Party.WHO[id].name}</span> <span style="color:#d8ccb5">${t}</span>`;
  }

  async function answer(i){
    if (S.busy) return;
    S.busy = true;
    S.btns.forEach(b => b.disabled = true);
    const correct = S.order[i] === S.cur.answer;
    const ep = document.getElementById('bs-e'), pp = document.getElementById('bs-p');

    if (correct){
      S.btns[i].classList.add('correct');
      S.combo++;
      // 연속 정답이 쌓이면 한 방이 세진다 — 계속 맞히고 싶게 만드는 장치
      const crit = S.combo >= 3;
      const dmg = 1 + (S.combo >= 5 ? 2 : S.combo >= 3 ? 1 : 0);
      pp.style.setProperty('--lx', '26px');
      pp.classList.add('lunge'); await wait(160);
      S.eHp -= dmg;
      // 데미지가 오르면 화면도 같이 세진다. 숫자만 커지고 화면이 그대로면
      // '세졌다'가 느껴지지 않는다. 마지막 일격(체력을 깎아 0)이면 결정타.
      shake(S.eHp <= 0 ? 3 : (crit ? 2 : 1)); hitFx('bs-e', crit); ep.classList.add('hit');
      pop('e', '-' + dmg + (crit ? '!' : ''), crit ? 'crit' : null);

      if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_hit');
      if (navigator.vibrate) navigator.vibrate(crit ? 45 : 25);
      msg(S.cur.feedback[1] + (S.combo >= 3 ? `<br><b>${S.combo}연속! 일격이 무거워진다.</b>` : '') + (S.combo === 3 ? cheer('combo') : ''));
      // 잘 맞힐수록 전투가 빨라진다. 콤보가 3이든 0이든 똑같이 기다리면
      // 잘하고 있는데 화면이 안 따라와 리듬이 끊긴다 — **속도 자체가 보상**이다.
      // 오답 쪽(900ms)은 줄이지 않는다. 해설을 읽어야 하는 순간이라서다.
      bars(); await wait(S.combo >= 3 ? 460 : 640);
      pp.classList.remove('lunge'); ep.classList.remove('hit');
      if (S.eHp <= 0) return finish(true);
    } else {
      S.btns[i].classList.add('wrong');
      // 정답도 같이 보여 준다 — 틀린 채로 넘어가면 학습이 되지 않는다
      const ci = S.order.indexOf(S.cur.answer);
      if (ci >= 0) S.btns[ci].classList.add('correct');
      S.combo = 0;
      ep.style.setProperty('--lx', '-26px');
      ep.classList.add('attacking', 'lunge'); await wait(180);
      // 담력을 가진 동료가 한 번은 대신 맞는다
      if (S.guard && !S.guardUsed){
        S.guardUsed = true;
        pop('p', '버팀', 'crit');
        msg(S.cur.feedback[0] + '<br><b>동료의 담력이 한 번 버티게 했다.</b>');
        bars(); await wait(900);
        ep.classList.remove('lunge', 'attacking');
        S.qIdx++; S.busy = false; ask();
        return;
      }
      S.pHp -= 1;
      shake(2); hitFx('bs-p', false); pp.classList.add('hit');
      pop('p', '-1');
      // 목숨이 하나 남으면 화면 가장자리가 붉게 뛴다 — 숫자를 안 봐도 알게 한다
      if (window.Fx) Fx.danger(S.pHp <= 1);
      if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
      msg(S.cur.feedback[0] + (S.pHp === 1 ? cheer('last') : S.pHp > 0 ? cheer('hurt') : ''));
      bars(); await wait(900);
      ep.classList.remove('lunge', 'attacking'); pp.classList.remove('hit');
      if (S.pHp <= 0) return finish(false);
    }
    S.qIdx++;
    S.busy = false;
    ask();
  }


  /* ---------------- 챕터의 퀴즈로 보스전을 세운다 ----------------
     보스마다 문제를 새로 쓰면 36챕터에 180문항을 더 써야 한다.
     대신 **그 챕터에서 이미 푼 문제 중에서** 골라 낸다 — 보스전은 그 화에서
     배운 것을 시험하는 자리이므로, 복습이 되는 편이 오히려 맞다.

     같은 순서로 다시 나오면 외워서 넘기게 되므로 섞어서 뽑는다. */
  function fromChapter(npcData, n){
    const pool = [];
    for (const k in (npcData || {})){
      const d = npcData[k];
      if (d && d.quizSeq) for (const q of d.quizSeq) if (q && q.opts) pool.push(q);
      if (d && d.quiz && d.quiz.opts) pool.push(d.quiz);
    }
    for (let i = pool.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n || 5);
  }

  /* ---------------- 끝 ---------------- */
  /* 이름 끝 글자에 받침이 있으면 '을', 없으면 '를'.
     "최만리을(를)"처럼 나오면 사극 말투가 통째로 어색해진다. */
  function objJosa(name){
    const ch = (name || '').trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (!(code >= 0xAC00 && code <= 0xD7A3)) return '을';   // 한글이 아니면 무난한 쪽
    return (code - 0xAC00) % 28 ? '을' : '를';
  }

  /* 승리 배지에서 금빛 조각이 사방으로 터진다 */
  function burst(el){
    for (let i = 0; i < 14; i++){
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
      const r = 60 + Math.random() * 50;
      const p = document.createElement('i');
      p.className = 'bs-burst';
      el.appendChild(p);
      p.animate([
        { transform:'translate(0,0) scale(.4)', opacity:0 },
        { transform:`translate(${(Math.cos(a) * r * .4).toFixed(1)}px,${(Math.sin(a) * r * .4).toFixed(1)}px) scale(1.15)`, opacity:1, offset:.3 },
        { transform:`translate(${(Math.cos(a) * r).toFixed(1)}px,${(Math.sin(a) * r).toFixed(1)}px) scale(.4)`, opacity:0 },
      ], { duration:650 + Math.random() * 250, easing:'cubic-bezier(.2,.7,.3,1)' })
       .onfinish = () => p.remove();
    }
  }

  function finish(won){
    // 위험 표시를 반드시 끈다. 안 끄면 전투가 끝난 뒤 지도 위에까지 붉게 남는다.
    if (window.Fx) Fx.danger(false);
    const end = document.createElement('div');
    end.className = 'bs-end ' + (won ? 'win' : 'lose');
    end.innerHTML =
      '<div class="card">' +
        '<div class="bs-badge"><div class="ttl">' + (won ? '승리' : '패배') + '</div></div>' +
        '<div class="sub">' + (won
          ? `${S.name}${objJosa(S.name)} 논파했습니다.<br>맞힌 문제 ${S.hit}개 · 최고 연속 ${S.best}`
          : '아직 이릅니다. 대사를 다시 듣고 오면 이길 수 있습니다.') + '</div>' +
        '<button id="bs-close">' + (won ? '계속' : '돌아가기') + '</button>' +
      '</div>';
    // 예전엔 무대(.bs-arena)에만 붙여서, 아래 문제창(.bs-bottom)이 안 가려지고
    // 뒤에 비쳐 보였다(제보: "승리 창이 뒤로 가 있네") — 무대 밑까지 다 덮도록
    // 전투창 전체(#boss-ov)에 붙인다.
    document.getElementById('boss-ov').appendChild(end);
    if (won){
      if (window.Rank) Rank.addXp(60 + S.best * 5, '보스전 승리');
      const badge = end.querySelector('.bs-badge');
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (badge && !reduce) setTimeout(() => burst(badge), 350);
    }
    document.getElementById('bs-close').onclick = () => {
      document.getElementById('boss-ov').classList.remove('show');
      end.remove();
      const cb = won ? S.onWin : S.onLose;
      const result = { hit: S.hit, total: S.questions.length, best: S.best };
      S = null;
      cb && cb(result);
    };
  }

  /* ---------------- 시작 ---------------- */
  function start(opt){
    css(); mount();
    if (window.Fx) Fx.danger(false);      // 지난 전투의 흔적을 지우고 시작한다
    const qs = (opt.questions || []).filter(q => q && q.opts && q.opts.length >= 2);
    if (!qs.length){ opt.onWin && opt.onWin(); return; }

    S = {
      name: opt.name || '상대',
      questions: qs, qIdx: 0, cur: null, order: [], btns: [],
      eHp: opt.hp || qs.length, eMax: opt.hp || qs.length,
      pHp: opt.lives || 3, pMax: opt.lives || 3,
      combo: 0, best: 0, hit: 0, busy: false,
      onWin: opt.onWin, onLose: opt.onLose,
    };
    // 최고 연속·명중 수를 세기 위해 combo 증가를 가로챈다
    Object.defineProperty(S, 'combo', {
      get(){ return this._c || 0; },
      set(v){ this._c = v; if (v > this.best) this.best = v; if (v > 0) this.hit++; },
    });
    S.combo = 0; S.best = 0; S.hit = 0;

    const ov = document.getElementById('boss-ov');
    const arena = document.getElementById('bs-arena');
    if (opt.bg) arena.style.backgroundImage = `url('${opt.bg}')`;

    document.getElementById('bs-ename').textContent = S.name;
    document.getElementById('bs-pname').textContent =
      (window.Rank ? Rank.get().tier.name : '나');
    // 초상이 아직 없는 인물도 있다(최만리처럼 새로 세운 보스). 그럴 때
    // 자리를 비워 두면 허공에 대고 싸우는 꼴이라, 이름을 새긴 실루엣을 세운다.
    // 공격 자세는 같은 이름 + _atk.png. 없으면(아직 안 뽑은 보스) 평소 그림으로 덤빈다.
    const v = (typeof ART_V === 'string') ? ART_V : '';
    const eEl = document.getElementById('bs-e');
    eEl.classList.remove('attacking');
    eEl.innerHTML =
      opt.img ? `<img class="bs-idle" src="${opt.img}${v}" alt="">`
              : `<div class="bs-silhouette"><span>${S.name}</span></div>`;
    if (opt.img && /\/boss\/[^/]+\.png$/.test(opt.img)){
      const atk = new Image();
      atk.className = 'bs-atk'; atk.alt = '';
      atk.onload = () => { if (S && eEl.isConnected) eEl.appendChild(atk); };
      atk.src = opt.img.replace(/\.png$/, '_atk.png') + v;
    }
    // 전투용 그림(battle.png)을 쓴다 — 오른쪽으로 3/4쯤 돌아 주먹을 쥔 자세라
    // 왼쪽을 보는 보스와 마주 선다(2026-09-18). 예전엔 걷기 그림의 옆모습
    // (right_1)을 세웠는데 "걸을 때 옆모습을 갖다 쓰니 어색하다"는 지적을 받았다.
    // 신분(옷)마다 한 장씩 있다. 7장 모두 같은 캔버스(267×447)에 발끝을 맞춰
    // 그려 두어서, 갓을 쓰든 안 쓰든 몸 크기가 같게 나온다.
    //
    // ?v= 를 반드시 붙인다. 챕터는 ART_V로 스프라이트 캐시를 갱신하는데
    // 여기만 그게 없어서, 파일을 고쳐도 브라우저가 옛 그림을 계속 썼다
    // (좌우 파일 이름을 바로잡은 뒤에도 주인공이 보스 반대쪽을 보고 있었다).
    document.getElementById('bs-p').innerHTML =
      `<img src="${opt.playerImg || battleImg()}" alt="">`;

    // 이야기 동료(차돌이·바우)도 전투용 그림을 세운다(2026-09-18, 예전엔 걷기 옆모습).
    arena.querySelectorAll('.bs-mate').forEach(n => n.remove());
    (window.Party ? Party.members() : []).forEach(id => {
      const im = document.createElement('img');
      im.className = 'bs-mate bs-mate-' + id; im.alt = '';
      im.src = `assets/companions/${id}/battle.png` + (typeof ART_V === 'string' ? ART_V : '');
      arena.appendChild(im);
    });

    // 담력(膽)을 가진 동료(도감 인물)가 있으면 한 번은 대신 맞아 준다.
    // 도감 인물은 화면에 세우지 않는다 — 전투용 아트를 따로 뽑아야 하는데
    // 그 비용에 비해 얻는 것이 적다.
    S.guard = (window.Heroes ? Heroes.power('dam') : 0) > 0;
    S.guardUsed = false;

    bars();
    { const c = (S.name || '').trim().slice(-1).charCodeAt(0);
      const ga = (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '이' : '가';   // 연개소문이 · 최만리가
      msg(`<b>${S.name}</b>${ga} 앞을 막아섰다. 아는 것으로 답하라.`); }
    ask();
    ov.classList.add('show');
  }

  // 지금 신분에 맞는 전투 그림. 챕터마다 currentSuit()가 있다(없으면 후드티).
  function battleImg(){
    let suit = null;
    try { if (typeof currentSuit === 'function') suit = currentSuit(); } catch(e){}
    const v = (typeof ART_V === 'string') ? ART_V : '';
    return (suit ? `assets/player/${suit}/battle.png` : 'assets/player/battle.png') + v;
  }

  return { start, fromChapter, _state: () => S };
})();
