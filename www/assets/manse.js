/* ============ 만세와 투옥 — 지도 위에서 벌어지는 일 ============

   왜 만들었나
   - 지금까지 지도에서 할 수 있는 일은 걷기와 말 걸기와 유물 줍기뿐이었다.
     사건이 없으니 지도는 문제로 가는 복도였다.
   - 3·1 운동은 **읽는 것보다 하는 것**이 맞는 대목이다. 만세를 부르는 쪽에
     서 보면, 그 뒤에 무엇이 왔는지도 몸으로 알게 된다.

   무엇이 일어나나
     탑골공원에서 만세를 부른다 → 함성이 번진다 → 호루라기 → 끌려간다
     → 서대문형무소. 갇힌 이들의 이야기를 다 듣고 나면 나온다.

   **탈옥은 만들지 않았다.**
   - 서대문형무소에서 탈옥한 일은 없다. 없는 일을 게임 장치로 만들면
     그 자리의 무게가 가벼워진다.
   - 나가는 길은 이 게임이 원래 갖고 있던 설정 그대로다 — 그대는 이 시대의
     사람이 아니다. 간수의 명부에 그대 이름이 없다. 이야기를 다 들은 뒤,
     그대만 시간 밖으로 빠져나온다. 갇힌 이들은 그대로 남는다.
     그게 사실에 가깝고, 그래서 더 아프다.

   붙이는 법
     <script src="assets/manse.js"></script>   (fx.js 뒤)
     챕터에서: Manse.offerAt('tapgol')  — 그 구역에 있으면 만세 단추가 뜬다
*/
window.Manse = (function(){
  const KEY = 'khg_manse';

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; }
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }
  function done(k){ return !!load()[k]; }
  function mark(k){ const v = load(); v[k] = Date.now(); save(v); }

  /* 갇힌 이들 — 이야기를 다 들어야 나온다 */
  const PRISONERS = ['suin1', 'suin2', 'suin3'];
  function heard(){
    let n = 0;
    for (const id of PRISONERS) if (done('heard_' + id)) n++;
    return n;
  }

  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const s = document.createElement('style');
    s.textContent = `
    #ms-btn { position:absolute; left:50%; bottom:calc(96px + env(safe-area-inset-bottom));
      transform:translateX(-50%); z-index:58; padding:13px 26px; border-radius:999px;
      border:1px solid #c9a24a; background:rgba(26,20,12,.94); color:#f0c96b;
      font-family:"Gowun Batang",serif; font-size:16px; font-weight:700; cursor:pointer;
      box-shadow:0 6px 22px rgba(0,0,0,.55); display:none; }
    #ms-btn.on { display:block; animation:ms-breathe 1.9s ease-in-out infinite; }
    @keyframes ms-breathe { 0%,100%{ transform:translateX(-50%) scale(1); }
      50%{ transform:translateX(-50%) scale(1.045); } }

    #ms-ov { position:absolute; inset:0; z-index:94; display:none; align-items:center;
      justify-content:center; font-family:"Gowun Batang",serif; }
    #ms-ov.show { display:flex; }
    #ms-ov .veil { position:absolute; inset:0; background:#0b0906; }
    #ms-ov .txt { position:relative; z-index:2; width:min(88%,560px); text-align:center;
      font-size:17px; line-height:2.1; color:#f3e6c8; text-shadow:0 2px 14px rgba(0,0,0,.9); }
    #ms-ov .txt b { color:#f0c96b; }
    /* 함성은 글자를 키우는 것으로 보인다 — 소리를 그림으로 바꾼 것이다 */
    #ms-ov .shout { font-size:40px; font-weight:700; letter-spacing:.18em; color:#f7e7bd;
      text-shadow:0 0 30px rgba(240,201,107,.5); }
    #ms-ov .sm { font-size:13px; color:#a89676; margin-top:20px; }`;
    document.head.appendChild(s);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  function veil(){
    css();
    let d = document.getElementById('ms-ov');
    if (!d){
      d = document.createElement('div'); d.id = 'ms-ov';
      d.innerHTML = '<div class="veil"></div><div class="txt"></div>';
      layer().appendChild(d);
    }
    d.classList.add('show');
    return d.querySelector('.txt');
  }
  function hide(){ const d = document.getElementById('ms-ov'); if (d) d.classList.remove('show'); }

  /* 한 마디씩 보여 주고 기다린다. 누르면 넘어간다. */
  function line(el, html, ms){
    el.innerHTML = html;
    return new Promise(res => {
      let t = setTimeout(fin, ms || 2200);
      function fin(){ clearTimeout(t); document.removeEventListener('pointerdown', fin); res(); }
      document.addEventListener('pointerdown', fin);
    });
  }

  /* ---------------- 만세 ---------------- */
  async function shout(onJail){
    const el = veil();
    if (window.Fx) Fx.punch(.06, 400);
    await line(el, '<div class="shout">대 한 독 립 만 세</div>', 1700);
    if (window.Fx){ Fx.shake(9, 500); Fx.lines(420); }
    await line(el, '<div class="shout">대 한 독 립 만 세</div>' +
      '<div style="margin-top:14px">한 사람이 두 팔을 들자, 옆 사람이 들었다.<br>' +
      '앞줄에서 뒷줄로, 뒷줄에서 골목으로 번졌다.</div>', 2600);
    if (window.Fx) Fx.shake(14, 700);
    await line(el, '광장이 통째로 들썩였다.<br>' +
      '학생도 상인도 농사꾼도 늙은이도, 신분을 가리지 않았다.', 2600);
    await line(el, '<div style="color:#d98a7a">…호루라기 소리가 났다.</div>', 1900);
    if (window.Fx){ Fx.shake(18, 600); Fx.danger(true); }
    await line(el, '군홧발이 몰려왔다. 누군가 팔을 잡혔다.<br>' +
      '그대도 잡혔다.', 2400);
    if (window.Fx) Fx.danger(false);
    await line(el, '<div class="sm">덜컹, 하고 철문이 닫혔다.</div>', 1800);
    mark('shouted');
    hide();
    onJail && onJail();
  }

  /* ---------------- 나오는 길 ---------------- */
  async function release(onOut){
    const el = veil();
    await line(el, '세 사람의 이야기를 다 들었다.', 2000);
    await line(el, '간수가 명부를 몇 번이나 넘겼지만 그대의 이름은 없었다.<br>' +
      '<b>여기 없는 사람이 여기 있을 수는 없다.</b>', 3000);
    await line(el, '철문이 열린 것도 아니고, 담을 넘은 것도 아니다.<br>' +
      '그대는 그저 이 시간의 사람이 아니었을 뿐이다.', 2800);
    await line(el, '<div style="color:#a89676">…남은 이들은 남았다.</div>' +
      '<div class="sm">그대만 걸어 나온다.</div>', 2600);
    mark('released');
    if (window.Gold) Gold.earn(40, '서대문형무소');
    if (window.Badges) Badges.earn('seodaemun_out');
    hide();
    onOut && onOut();
  }

  /* ---------------- 지도 위 단추 ---------------- */
  function btn(){
    css();
    let b = document.getElementById('ms-btn');
    if (!b){
      b = document.createElement('button'); b.id = 'ms-btn';
      layer().appendChild(b);
    }
    return b;
  }

  /* 챕터에서 매 프레임 부른다. 지금 상황에 맞는 단추를 띄운다. */
  function tick(zone, opt){
    opt = opt || {};
    const b = btn();
    // 대사·퀴즈가 떠 있으면 가린다 — 그 위에 겹치면 안 된다
    const busy = !!document.querySelector('.ov.show, #dlg-overlay.show, #quiz-overlay.show, #ms-ov.show');
    if (busy){ b.classList.remove('on'); return; }

    if (zone === opt.squareZone && !done('shouted')){
      b.textContent = '함께 만세 부르기';
      b.onclick = () => { b.classList.remove('on'); shout(opt.onJail); };
      b.classList.add('on');
      return;
    }
    if (zone === opt.jailZone && !done('released')){
      const n = heard();
      if (n >= PRISONERS.length){
        b.textContent = '…걸어 나가기';
        b.onclick = () => { b.classList.remove('on'); release(opt.onOut); };
        b.classList.add('on');
      } else {
        b.classList.remove('on');
      }
      return;
    }
    b.classList.remove('on');
  }

  /* 수감자와 이야기를 마쳤다고 적는다(챕터의 대화 끝에서 부른다) */
  function heardFrom(id){ if (PRISONERS.indexOf(id) >= 0) mark('heard_' + id); }

  return { tick, shout, release, heardFrom, heard, done, mark,
           PRISONERS, _load: load };
})();
