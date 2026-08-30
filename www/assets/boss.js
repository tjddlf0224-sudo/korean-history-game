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
       onWin: () => {...}, onLose: () => {...}
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
    .bs-enemy { bottom:26%; right:8%; width:34%; max-width:230px; }
    .bs-enemy img { width:100%; object-fit:contain; display:block;
      animation:bs-bob 3.2s ease-in-out infinite; }
    .bs-self { bottom:2%; left:8%; width:30%; max-width:175px; }
    .bs-self img { width:100%; object-fit:contain; display:block;
      animation:bs-bob 3.8s ease-in-out infinite; }
    @keyframes bs-bob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
    .bs-sprite.lunge { animation:bs-lunge .3s ease-out; }
    @keyframes bs-lunge { 50%{ transform:translateX(var(--lx,26px)) scale(1.04); } }
    .bs-sprite.hit { animation:bs-hit .3s; }
    @keyframes bs-hit { 0%,100%{opacity:1;} 25%,75%{opacity:.25;} }

    /* 이름 + 체력 */
    .bs-info { position:absolute; z-index:6; width:38%; max-width:230px;
      background:rgba(16,11,5,.74); border:1px solid rgba(240,201,107,.42);
      border-radius:10px; padding:7px 10px; }
    /* 내 정보가 왼쪽 위, 상대가 오른쪽 위 — 각자 자기 캐릭터 쪽 위에 붙는다 */
    .bs-info-p { top:5%; left:5%; }
    .bs-info-e { top:5%; right:5%; }
    .bs-info .nm { font-size:13px; font-weight:700; color:#f0c96b; margin-bottom:5px; }
    .bs-hp { height:9px; border-radius:999px; background:rgba(0,0,0,.6);
      border:1px solid rgba(240,201,107,.3); overflow:hidden; }
    .bs-hp i { display:block; height:100%; border-radius:999px;
      background:linear-gradient(90deg,#b6483c,#e0705f); transition:width .45s cubic-bezier(.2,.8,.3,1); }
    .bs-info-p .bs-hp i { background:linear-gradient(90deg,#c9962e,#f0c96b); }
    .bs-hptxt { font-size:10px; color:#c9bda6; margin-top:3px; text-align:right;
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
      padding:12px 16px calc(14px + env(safe-area-inset-bottom));
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

    /* 결과 */
    .bs-end { position:absolute; inset:0; z-index:20; display:flex; align-items:center;
      justify-content:center; background:rgba(8,6,3,.86); }
    .bs-end .card { width:min(84vw,400px); text-align:center; padding:28px 24px;
      background:linear-gradient(180deg,#241c12,#1a140c); border:1px solid rgba(240,201,107,.55);
      border-radius:14px; box-shadow:0 18px 60px rgba(0,0,0,.7);
      animation:bs-card .5s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes bs-card { 0%{opacity:0; transform:scale(.9) translateY(10px);} 100%{opacity:1; transform:none;} }
    .bs-end .ttl { font-size:30px; font-weight:700; color:#f0c96b; margin-bottom:8px;
      text-shadow:0 0 24px rgba(240,201,107,.5); }
    .bs-end .sub { font-size:13.5px; color:#c9bda6; line-height:1.7; }
    .bs-end button { margin-top:20px; background:#2a2013; border:1px solid #4a3c26; color:#f5ecd8;
      border-radius:11px; padding:12px 26px; font-family:inherit; font-size:14px; cursor:pointer; }

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
    document.body.appendChild(d);
  }

  /* ---------------- 연출 ---------------- */
  function shake(){
    const a = document.getElementById('bs-arena');
    a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake');
    setTimeout(() => a.classList.remove('shake'), 300);
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
      shake(); hitFx('bs-e', crit); ep.classList.add('hit');
      pop('e', '-' + dmg + (crit ? '!' : ''), crit ? 'crit' : null);
      if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
      if (navigator.vibrate) navigator.vibrate(crit ? 45 : 25);
      msg(S.cur.feedback[1] + (S.combo >= 3 ? `<br><b>${S.combo}연속! 일격이 무거워진다.</b>` : ''));
      bars(); await wait(700);
      pp.classList.remove('lunge'); ep.classList.remove('hit');
      if (S.eHp <= 0) return finish(true);
    } else {
      S.btns[i].classList.add('wrong');
      // 정답도 같이 보여 준다 — 틀린 채로 넘어가면 학습이 되지 않는다
      const ci = S.order.indexOf(S.cur.answer);
      if (ci >= 0) S.btns[ci].classList.add('correct');
      S.combo = 0;
      ep.style.setProperty('--lx', '-26px');
      ep.classList.add('lunge'); await wait(180);
      S.pHp -= 1;
      shake(); hitFx('bs-p', false); pp.classList.add('hit');
      pop('p', '-1');
      if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
      msg(S.cur.feedback[0]);
      bars(); await wait(900);
      ep.classList.remove('lunge'); pp.classList.remove('hit');
      if (S.pHp <= 0) return finish(false);
    }
    S.qIdx++;
    S.busy = false;
    ask();
  }

  /* ---------------- 끝 ---------------- */
  function finish(won){
    const arena = document.getElementById('bs-arena');
    const end = document.createElement('div');
    end.className = 'bs-end';
    end.innerHTML =
      '<div class="card">' +
        '<div class="ttl">' + (won ? '승리' : '패배') + '</div>' +
        '<div class="sub">' + (won
          ? `${S.name}을(를) 논파했다.<br>맞힌 문제 ${S.hit}개 · 최고 연속 ${S.best}`
          : '아직 이르다. 대사를 다시 듣고 오면 이길 수 있다.') + '</div>' +
        '<button id="bs-close">' + (won ? '계속' : '돌아가기') + '</button>' +
      '</div>';
    arena.appendChild(end);
    if (won && window.Rank) Rank.addXp(60 + S.best * 5, '보스전 승리');
    document.getElementById('bs-close').onclick = () => {
      document.getElementById('boss-ov').classList.remove('show');
      end.remove();
      const cb = won ? S.onWin : S.onLose;
      S = null;
      cb && cb();
    };
  }

  /* ---------------- 시작 ---------------- */
  function start(opt){
    css(); mount();
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
    document.getElementById('bs-e').innerHTML =
      opt.img ? `<img src="${opt.img}" alt="">` : '';
    // 뒷모습(up_1)을 쓴다. 정면을 쓰면 상대가 아니라 화면을 보고 서 있는
    // 꼴이라 대치 구도가 안 산다. 스프라이트 시트 2행이 이미 뒷면이라
    // 새로 그릴 필요가 없다.
    document.getElementById('bs-p').innerHTML =
      `<img src="${opt.playerImg || 'assets/player/up_1.png'}" alt="">`;

    bars();
    msg(`<b>${S.name}</b>이(가) 앞을 막아섰다. 아는 것으로 답하라.`);
    ask();
    ov.classList.add('show');
  }

  return { start, _state: () => S };
})();
