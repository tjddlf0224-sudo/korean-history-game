/* ============ 정답 순간의 손맛 — 콤보·피버·효과음 (전 챕터 공용) ============

   왜 만들었나
   - 지인들이 "재미없다"고 했을 때, 문제는 문제 자체보다 **맞힌 순간에
     아무 일도 안 일어난다**는 데 있었다. 챕터 퀴즈 623문항이 전부 2지선다인데
     정답 연출은 팡파레 한 개뿐이었다.
   - 사장님이 만든 전산회계 오락실·보카 바리스타는 둘 다 이 자리에 돈을 썼다.
     콤보→피버, 화면 플래시, 코인이 지갑으로 날아가는 연출, 콤보 구간별 칭찬 문구,
     그리고 **오디오 파일 없이 오실레이터로 합성한 효과음**. 여기 옮겨 온 것들이다.

   설계 원칙
   - **새 리소스 0개.** 효과음은 WebAudio로 합성하고 그림은 CSS로 그린다.
     36개 챕터에 스크립트 한 줄만 붙이면 되게 한다.
   - **찍기에 상을 주지 않는다.** 콤보는 *첫 시도에* 맞혔을 때만 오른다.
     오답을 눌렀다가 다시 맞힌 것은 콤보가 끊긴다(rank.js의 XP 정책과 같은 결).
   - 화면에 얹는 것은 전부 `#wrap` 안에. 세로로 든 휴대폰에서 `body.rot #wrap`이
     rotate(90deg)로 가로모드를 만들기 때문에, 밖에 붙이면 연출만 90도 틀어진다.

   챕터에 붙이는 법
     1) <script src="assets/juice.js"></script>   (rank.js 뒤에)
     2) Quiz.pick() 정답 분기에  Juice.correct(!this._missed)
        오답 분기에            Juice.wrong()
     3) XP를 줄 때 Juice.xpMul()을 곱한다 (피버 중 2배)
*/
window.Juice = (function(){

  const FEVER_AT = 5;        // 몇 콤보부터 피버인가
  let combo = 0, best = 0, fever = false;

  /* ---------------- 효과음 (파일 없이 합성) ----------------
     audio.js의 음소거 설정을 그대로 따른다. 별도 SFX 스위치를 두면
     "음악은 껐는데 소리가 난다"는 혼란이 생긴다. */
  let ctx = null;
  function ac(){
    if (window.BGM && BGM.isMuted && BGM.isMuted()) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch(e){ return null; }
  }
  function tone(freq, dur, type, peak, delay, slideTo){
    const c = ac(); if (!c) return;
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = type || 'sine';
    const t0 = c.currentTime + (delay || 0);
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak == null ? 0.14 : peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  // 콤보가 쌓일수록 음이 올라간다 — 같은 소리를 반복해 듣는 지루함을 없애고,
  // 연속으로 맞히고 있다는 사실을 소리만으로도 알게 한다.
  function sfxCorrect(n){
    const base = 620 + Math.min(n, 8) * 55;
    tone(base, 0.10, fever ? 'square' : 'sine', 0.13, 0);
    tone(base * 1.5, 0.13, fever ? 'square' : 'sine', 0.10, 0.055);
  }
  function sfxWrong(){
    tone(200, 0.20, 'sawtooth', 0.10, 0, 110);
  }
  function sfxFever(){                       // 도–미–솔–도 아르페지오
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.065));
  }

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 콤보 — 상시 카운터가 아니라 맞힌 순간에만 튀어오른다.
       퀴즈 카드가 화면을 거의 다 덮는 구조라 한쪽에 세워 두면 카드와 겹쳐
       지저분해진다(실제로 겹쳤다). 대신 소리 피치·칭찬 문구·피버 테두리가
       콤보가 쌓이고 있다는 사실을 계속 알려 준다.
       위치는 화면 맨 위 띠 — 가운데에 두면 정답 해설을 읽는 동안 그 위를
       덮는다(이것도 실제로 덮었다). */
    #jc-combo { position:absolute; z-index:29; left:0; right:0; top:2.5%;
      pointer-events:none; font-family:"Gowun Batang",serif; opacity:0; text-align:center; }
    #jc-combo .n { font-size:40px; font-weight:700; line-height:1;
      color:#f0c96b; text-shadow:0 2px 0 #2b1d0e, 0 0 20px rgba(240,201,107,.6); }
    #jc-combo .l { font-size:12px; letter-spacing:.22em; color:#e8dcc2;
      text-shadow:0 1px 4px rgba(0,0,0,.9); margin-left:7px; }
    #jc-combo.pop { animation:jc-pop 1.05s cubic-bezier(.2,.9,.3,1); }
    @keyframes jc-pop { 0%{opacity:0; transform:scale(.6)} 18%{opacity:1; transform:scale(1.25)}
      32%{transform:scale(1)} 66%{opacity:1} 100%{opacity:0; transform:translateY(-12px)} }

    /* 피버 — 화면 테두리가 금빛으로 타오른다.
       배경이 나무 마루처럼 밝은 구역에서는 옅은 금빛이 그대로 묻히므로,
       어두운 비네트를 먼저 깔고 그 위에 금빛을 올려 밝기와 무관하게 보이게 한다. */
    #jc-fever { position:absolute; inset:0; z-index:25; pointer-events:none; display:none;
      box-shadow:inset 0 0 42px 10px rgba(60,26,0,.5), inset 0 0 90px 22px rgba(255,158,30,.55); }
    #jc-fever.on { display:block; animation:jc-breathe 1.15s ease-in-out infinite; }
    @keyframes jc-breathe { 0%,100%{opacity:.7} 50%{opacity:1} }
    #jc-combo.fever .n { color:#ffd970; text-shadow:0 2px 0 #4a2600, 0 0 28px rgba(255,180,60,.95); }

    /* 정답/오답 순간의 화면 플래시 */
    #jc-flash { position:absolute; inset:0; z-index:27; pointer-events:none; opacity:0; }
    #jc-flash.ok  { animation:jc-flash .34s ease-out; background:radial-gradient(circle at 50% 55%,rgba(150,220,160,.42),transparent 68%); }
    #jc-flash.bad { animation:jc-flash .34s ease-out; background:radial-gradient(circle at 50% 55%,rgba(220,110,95,.40),transparent 68%); }
    @keyframes jc-flash { 0%{opacity:0} 22%{opacity:1} 100%{opacity:0} }

    /* 엽전이 신분 HUD로 날아간다 */
    .jc-coin { position:absolute; z-index:28; width:17px; height:17px; border-radius:50%;
      pointer-events:none; background:radial-gradient(circle at 35% 32%,#f7dd93,#c79a3a 62%,#8a651c);
      box-shadow:0 0 9px rgba(240,201,107,.75); }
    .jc-coin::after { content:''; position:absolute; left:5.5px; top:5.5px; width:6px; height:6px;
      background:#7a5a18; border-radius:1px; }

    /* 콤보 구간별 칭찬 문구 */
    #jc-praise { position:absolute; z-index:28; left:0; right:0; top:13.5%; text-align:center;
      pointer-events:none; font-family:"Gowun Batang",serif; font-size:23px; font-weight:700;
      color:#f5ecd8; text-shadow:0 2px 0 #2b1d0e, 0 0 20px rgba(0,0,0,.7); opacity:0; }
    #jc-praise.go { animation:jc-praise 1.05s cubic-bezier(.2,.9,.3,1); }
    @keyframes jc-praise { 0%{opacity:0; transform:scale(.72) translateY(10px)}
      24%{opacity:1; transform:scale(1.1) translateY(0)} 60%{opacity:1; transform:scale(1)}
      100%{opacity:0; transform:translateY(-14px)} }

    @media (prefers-reduced-motion:reduce){
      #jc-combo.pop,#jc-fever.on,#jc-flash.ok,#jc-flash.bad,#jc-praise.go,.jc-coin
        { animation-duration:.01ms !important; }
    }`;
    document.head.appendChild(st);
  }

  function layer(){ return document.getElementById('wrap') || document.body; }

  function mount(){
    css();
    const L = layer();
    if (!document.getElementById('jc-fever')){
      const f = document.createElement('div'); f.id = 'jc-fever'; L.appendChild(f);
    }
    if (!document.getElementById('jc-flash')){
      const f = document.createElement('div'); f.id = 'jc-flash'; L.appendChild(f);
    }
    if (!document.getElementById('jc-combo')){
      const c = document.createElement('div'); c.id = 'jc-combo';
      c.innerHTML = '<b class="n">0</b><span class="l">연 속</span>';
      L.appendChild(c);
    }
    if (!document.getElementById('jc-praise')){
      const p = document.createElement('div'); p.id = 'jc-praise'; L.appendChild(p);
    }
  }

  /* ---------------- 칭찬 문구 ----------------
     구간마다 풀을 나눠 두고 그 안에서 무작위로 고른다. 같은 말이 반복되면
     금세 눈에 안 들어오기 때문이다. 사극 말투로 통일했다. */
  const PRAISE = [
    { at: 3,  pool: ['제법이로다', '옳거니', '잘 아는구나'] },
    { at: 5,  pool: ['훌륭하다!', '과연!', '대단하구나!'] },
    { at: 8,  pool: ['놀랍도다!', '가히 으뜸이라!', '이 정도라니!'] },
    { at: 12, pool: ['천하에 둘도 없다!', '경이롭도다!', '이는 신묘하다!'] },
  ];
  function praiseFor(n){
    let hit = null;
    for (const p of PRAISE) if (n >= p.at) hit = p;
    if (!hit || n !== hit.at) {
      // 구간 진입 순간에만 띄운다. 매 정답마다 띄우면 화면이 시끄럽다.
      // 단, 아주 긴 연속(15,20,25…)에서는 다시 한 번 칭찬한다.
      if (!(n >= 15 && n % 5 === 0)) return null;
      hit = PRAISE[PRAISE.length - 1];
    }
    return hit.pool[Math.floor(Math.random() * hit.pool.length)];
  }
  function showPraise(t){
    const el = document.getElementById('jc-praise'); if (!el || !t) return;
    el.textContent = t;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }

  /* ---------------- 엽전 날리기 ----------------
     신분 HUD(#rank-hud) 쪽으로 빨려 들어간다. 보상이 어디에 쌓이는지를
     눈으로 잇는 장치라, 목적지가 없으면 아예 그리지 않는다. */
  function coins(n){
    const L = layer(), hud = document.getElementById('rank-hud');
    if (!hud) return;
    const lb = L.getBoundingClientRect(), hb = hud.getBoundingClientRect();
    const tx = hb.left - lb.left + hb.width / 2, ty = hb.top - lb.top + hb.height / 2;
    const sx = lb.width / 2, sy = lb.height * 0.55;
    for (let i = 0; i < n; i++){
      const c = document.createElement('i');
      c.className = 'jc-coin';
      c.style.left = (sx - 8) + 'px'; c.style.top = (sy - 8) + 'px';
      L.appendChild(c);
      const spread = (Math.random() - 0.5) * 90;
      c.animate([
        { transform:'translate(0,0) scale(.5)', opacity:0 },
        { transform:`translate(${spread}px,${-40 - Math.random()*30}px) scale(1)`, opacity:1, offset:.28 },
        { transform:`translate(${tx-sx}px,${ty-sy}px) scale(.45)`, opacity:0 },
      ], { duration: 620 + i*55, easing:'cubic-bezier(.35,.1,.4,1)' })
       .onfinish = () => c.remove();
    }
  }

  function flash(kind){
    const el = document.getElementById('jc-flash'); if (!el) return;
    el.className = ''; void el.offsetWidth; el.className = kind;
  }

  function renderCombo(){
    const el = document.getElementById('jc-combo'); if (!el) return;
    if (combo < 2) return;                       // 2연속부터 띄운다
    el.querySelector('.n').textContent = combo;
    el.classList.toggle('fever', fever);
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  /* ---------------- 바깥에서 부르는 것 ---------------- */

  /* 정답. firstTry가 false면(오답 눌렀다 맞힌 것) 콤보를 쌓지 않는다. */
  function correct(firstTry){
    mount();
    if (firstTry){
      combo++;
      if (combo > best) best = combo;
      if (!fever && combo >= FEVER_AT){
        fever = true;
        const f = document.getElementById('jc-fever'); if (f) f.classList.add('on');
        sfxFever();
        showPraise('피 버');
        if (navigator.vibrate) navigator.vibrate([25, 35, 25, 35, 45]);
      } else {
        sfxCorrect(combo);
        showPraise(praiseFor(combo));
        if (navigator.vibrate) navigator.vibrate(fever ? 24 : 16);
      }
    } else {
      sfxCorrect(1);
    }
    flash('ok');
    coins(firstTry ? Math.min(3 + combo, 8) : 2);
    renderCombo();
  }

  /* 오답. 콤보와 피버가 함께 끊긴다.
     단, 동료의 학식(識)이 있으면 챕터당 한 번은 버틴다. */
  function wrong(){
    mount();
    // 학식(동료 능력)이 먼저, 그다음이 금으로 산 콤보 지키기.
    // 공짜인 쪽을 먼저 쓰게 하는 것이 순서로도 맞다.
    if (combo >= 2 && ((window.Heroes && Heroes.trySik()) ||
                       (window.Gold && Gold.useShield()))){
      sfxWrong();
      flash('bad');
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      return;                       // 콤보·피버를 그대로 둔다
    }
    const had = combo;
    combo = 0;
    if (fever){
      fever = false;
      const f = document.getElementById('jc-fever'); if (f) f.classList.remove('on');
    }
    sfxWrong();
    flash('bad');
    if (navigator.vibrate) navigator.vibrate([55, 40, 55]);
    if (had >= 2) showPraise('연속 ' + had + ' 끊김');
    renderCombo();
  }

  /* 챕터·퀴즈 묶음을 벗어날 때 조용히 접는다(연출만 정리, 기록은 남긴다). */
  function reset(){
    combo = 0; fever = false;
    const f = document.getElementById('jc-fever'); if (f) f.classList.remove('on');
    const c = document.getElementById('jc-combo'); if (c) c.classList.remove('pop', 'fever');
  }

  /* 피버 중에는 경험치가 두 배. Quiz에서 Rank.addXp에 곱해 쓴다. */
  function xpMul(){ return fever ? 2 : 1; }

  return { correct, wrong, reset, mount, xpMul,
           get combo(){ return combo; },
           get best(){ return best; },
           get fever(){ return fever; } };
})();
