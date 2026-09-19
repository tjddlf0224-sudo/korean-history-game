/* ============ 한지 현판 옷 — 창들이 같은 옷을 입는다 (2026-09-19) ============

   왜
   - 성일님: "전체적으로 디자인이 밋밋해. 게임답게 좀 더 다채로우면 좋겠어."
     → 제미나이로 시안을 뽑아 **시안 A(나무 현판 + 단청 + 한지)**로 정했다.
     시안: _source_art/ui_concepts_2026-09-19/
   - 어두운 갈색 판 위에 가는 선 그림이던 창들을, 나무 틀·단청 기둥·한지 바탕·
     나무 현판 제목·색 그림 아이콘으로 바꾼다.

   그림 조각(assets/ui/*.webp) — 제미나이로 뽑아 초록 배경을 빼고 잘랐다
   (scripts/cut_ui_sheet.py). frame.webp는 9조각(border-image)으로 늘려 쓴다.

   왜 JS로 넣나
   - 창마다 모듈이 **열 때** 제 스타일을 head 끝에 붙인다. 같은 세기의 규칙이면
     나중에 붙은 쪽이 이기므로, 이 옷은 **늘 head 맨 끝에 있도록** 지켜본다.

   어디에 입히나 — SKIN 목록에 있는 판들. 새 창을 붙이면 여기에 한 줄 더하면 된다.

   붙이는 법: 다른 모듈들 뒤에 <script src="assets/uiskin.js"></script>
*/
(function(){
  const U = 'assets/ui/';
  // 현판 옷을 입힐 판(창 본체)
  const PANELS = [
    '#menu-panel',
    '.dy-ov .panel', '#mg-ov .panel', '#qs-ov .panel', '#ul-ov .panel',
  ];
  const P = PANELS.join(', ');
  const each = suf => PANELS.map(p => p + suf).join(', ');

  const css = `
  /* ================= 판 ================= */
  ${P} {
    position:relative; isolation:isolate; overflow:visible;
    background:none !important; border:0 !important; border-radius:0 !important;
    box-shadow:none !important;
    padding:40px 34px 30px !important;
    color:#3b2a17; font-family:"Gowun Batang",serif;
    filter:drop-shadow(0 22px 40px rgba(0,0,0,.55));
  }
  /* 나무 틀 + 한지 — 한 장 그림을 아홉 조각으로 늘린다. 모서리의 단청은 그대로 둔다 */
  ${each('::before')} {
    content:'' !important; position:absolute !important; inset:0 !important;
    z-index:-1 !important; display:block !important; height:auto !important;
    background:none !important; pointer-events:none;
    border-style:solid; border-width:56px 60px 56px 60px;
    border-image:url(${U}frame.webp) 195 205 195 205 fill / 56px 60px 56px 60px stretch;
  }
  /* 판 안쪽 스크롤은 틀 안에서만 — 판 자체는 넘치게 두고 안쪽 내용이 스크롤된다 */
  ${P} { max-height:none !important; }
  #menu-panel { overflow:visible !important; }

  /* ================= 제목 — 나무 현판 ================= */
  .dy-ov h3, #mg-ov h3, #qs-ov h3, #ul-ov h3, #menu-panel #mn-head h3 {
    align-self:center; margin:-58px auto 2px !important; min-width:150px;
    padding:9px 44px 11px !important; box-sizing:border-box; text-align:center;
    background:url(${U}plaque.webp) center/100% 100% no-repeat;
    color:#fff1cf !important; font-family:"Gugi","Gowun Batang",serif !important;
    font-size:19px !important; letter-spacing:.08em;
    text-shadow:0 2px 0 #3d220c, 0 0 6px rgba(0,0,0,.35);
  }
  .dy-ov .sub, #mg-ov .sub, #qs-ov .sub, #ul-ov .sub {
    color:#6d5536 !important; font-size:13px !important; }

  /* ================= 닫기 — 둥근 나무 단추 ================= */
  .dy-ov .x, #mg-ov .x, #qs-ov .x, #ul-ov .x, #menu-panel #mn-head #menu-close-btn {
    position:absolute !important; top:-10px !important; right:-10px !important; left:auto !important;
    width:42px !important; height:42px !important; padding:0 !important; margin:0 !important;
    border:0 !important; border-radius:50% !important; font-size:0 !important; color:transparent !important;
    background:url(${U}xbtn.webp) center/contain no-repeat !important;
    filter:drop-shadow(0 3px 3px rgba(0,0,0,.4)); z-index:3; }
  #menu-panel #mn-head #menu-close-btn::before { display:none !important; }
  .dy-ov .x:active, #mg-ov .x:active, #qs-ov .x:active, #ul-ov .x:active,
  #menu-panel #mn-head #menu-close-btn:active { transform:scale(.92); }

  /* ================= 단추 ================= */
  ${each(' button:not(.x):not(.mtile)')} {
    background:linear-gradient(180deg,#fffaf0 0%,#f3e4c6 100%) !important;
    border:2px solid #a8814f !important; border-radius:14px !important;
    color:#4a3319 !important; font-weight:700;
    box-shadow:0 3px 0 #8a6538, inset 0 1px 0 #fff !important; }
  ${each(' button.hi:not(.x)')} {
    background:linear-gradient(180deg,#ffe38a 0%,#f2b83e 100%) !important;
    border-color:#b27c1f !important; color:#4a2e08 !important;
    box-shadow:0 3px 0 #9a6614, inset 0 1px 0 #fff4c4, 0 0 14px rgba(242,184,62,.35) !important; }
  ${each(' button:not(.x):active')} { transform:translateY(2px) !important;
    box-shadow:0 1px 0 #8a6538 !important; }
  ${each(' button:disabled')} { filter:grayscale(.6); opacity:.55 !important; }
  #qs-ov .panel .q button:disabled { filter:none; opacity:.8 !important; }
  .dy-ov .msg, #mg-ov .msg, #qs-ov .msg, #ul-ov .msg { color:#9a5b1e !important; font-weight:700; }

  /* ================= 묶음 이름 — 색 리본 ================= */
  .mn-sec h4, #mg-ov .sec, #qs-ov .sec, #ul-ov .sec {
    color:#fff !important; letter-spacing:.14em !important; font-size:12px !important;
    font-weight:700 !important; text-shadow:0 1px 0 rgba(0,0,0,.35); }
  .mn-sec h4 { margin:0 0 6px !important; }
  .mn-sec h4, #mg-ov .sec, #qs-ov .sec, #ul-ov .sec {
    background:url(${U}rib_red.webp) left center/auto 100% no-repeat;
    padding:3px 30px 4px 12px !important; min-height:20px; line-height:1.2; }
  .mn-sec h4::after, #mg-ov .sec::after, #qs-ov .sec::after, #ul-ov .sec::after {
    background:linear-gradient(90deg,rgba(138,101,56,.45),transparent) !important;
    margin-left:14px; }
  .mn-sec[data-sec="익히기"] h4 { background-image:url(${U}rib_blue.webp); }
  .mn-sec[data-sec="기록"] h4 { background-image:url(${U}rib_gold.webp); }
  .mn-sec[data-sec="설정"] h4 { background-image:url(${U}rib_blue.webp); filter:hue-rotate(-75deg) saturate(.9); }

  /* ================= 메뉴 ================= */
  #menu-panel #mn-head { border-bottom:0 !important; padding:0 0 6px !important;
    flex-direction:column; align-items:stretch; }
  #menu-panel #mn-readout { position:absolute; top:-2px; right:40px; margin:0; }
  #menu-panel #mn-readout .chip { background:linear-gradient(180deg,#6b4424,#4f2f15) !important;
    border:1.5px solid #3a220e !important; color:#f6e3bf !important; padding:4px 11px 4px 30px !important;
    position:relative; box-shadow:inset 0 1px 0 rgba(255,220,170,.25); }
  #menu-panel #mn-readout .chip b { color:#ffe08a !important; }
  #menu-panel #mn-readout .chip::before { content:''; position:absolute; left:4px; top:50%;
    width:22px; height:22px; margin-top:-11px; background:url(${U}coin.webp) center/contain no-repeat; }
  #menu-panel #mn-readout .chip + .chip::before { background-image:url(${U}stamina.webp); }
  #menu-panel #mn-secs { padding:0 !important; gap:6px 22px !important; }
  #menu-panel .mn-grid { gap:8px !important; }
  #menu-panel { padding:34px 30px 22px !important; }
  #menu-panel .mtile {
    min-height:70px !important; gap:2px !important; padding:5px 4px 6px !important;
    background:linear-gradient(180deg,#fffbf2 0%,#f4e6c9 100%) !important;
    border:2px solid #b58d5c !important; border-radius:16px !important;
    box-shadow:0 3px 0 #9b7447, inset 0 1px 0 #fff !important;
    color:#4a3319 !important; font-weight:700 !important; font-size:13px !important;
    overflow:visible !important; white-space:nowrap !important; }
  #menu-panel .mn-grid { grid-auto-rows:1fr; }
  #menu-panel .mtile::before { width:38px !important; height:38px !important;
    filter:drop-shadow(0 2px 2px rgba(80,50,20,.3)) !important; }
  #menu-panel .mtile:active { transform:translateY(2px) scale(.97) !important;
    box-shadow:0 1px 0 #9b7447 !important; }
  #menu-panel .mtile.hot::after { top:-5px !important; right:-5px !important; width:13px !important;
    height:13px !important; background:radial-gradient(circle at 35% 30%,#ff8d7a,#d8412c) !important;
    border:2px solid #fff6e4; box-shadow:0 1px 3px rgba(0,0,0,.35) !important; }
  #menu-panel #menu-reset { color:#8a3a2a !important; }
  /* 오늘 몫을 다 한 칸 — 흐리게 + 초록 '완료' 표. 할 것이 있는 칸(붉은 점)과 한눈에 갈린다 */
  #menu-panel .mtile.done { background:linear-gradient(180deg,#efe6d4,#ddd0b5) !important;
    border-color:#bfae90 !important; box-shadow:0 2px 0 #a8977a !important; color:#9a8a70 !important; }
  #menu-panel .mtile.done::before { filter:grayscale(1) opacity(.45) !important; }
  #menu-panel .mtile.done::after { content:'완료' !important; position:absolute; top:-6px !important; right:-6px !important;
    width:auto !important; height:auto !important; padding:2px 7px !important; border-radius:999px !important;
    background:#3f8a4f !important; color:#fff !important; font-size:10.5px; font-weight:700; letter-spacing:.04em;
    border:2px solid #fff6e4; box-shadow:0 1px 3px rgba(0,0,0,.3) !important; }
  #menu-panel #bgm-mute-toggle.muted::before { filter:grayscale(1) opacity(.55) !important; }
  #menu-panel > button:not(.mtile), #menu-panel > a:not(.mtile) {
    display:block; margin:8px auto 0 !important; width:auto !important; min-width:220px;
    text-align:center !important; padding:7px 22px !important; font-size:13px !important;
    background:linear-gradient(180deg,#fffaf0,#f3e4c6) !important; border:2px solid #a8814f !important;
    border-radius:22px !important; color:#4a3319 !important; font-weight:700;
    box-shadow:0 3px 0 #8a6538 !important; }
  #menu-modal.show #menu-panel { animation:sk-in .34s cubic-bezier(.2,.9,.25,1.2) both !important; }
  @keyframes sk-in { from { opacity:0; transform:translateY(14px) scale(.94); } to { opacity:1; transform:none; } }

  /* ================= 출석 ================= */
  .dy-ov .dy-track { gap:6px !important; padding:6px 0 4px !important; }
  .dy-ov .dy-track .road { background:repeating-linear-gradient(90deg,#b08a5a 0 6px,#8d6a3f 6px 9px) !important;
    height:5px !important; border-radius:3px; }
  .dy-ov .dy-track .road i { height:5px !important; background:linear-gradient(90deg,#e9b44c,#ffd86b) !important; }
  .dy-ov .dy-day .coin { width:54px !important; height:54px !important; border-radius:14px !important;
    background:linear-gradient(180deg,#fffbf2,#f1e2c3) !important; border:2px solid #b58d5c !important;
    box-shadow:0 3px 0 #9b7447 !important; color:#4a3319 !important; font-weight:700; }
  .dy-ov .dy-day .coin img.rw { position:absolute; inset:5px 5px 11px; width:calc(100% - 10px);
    height:calc(100% - 16px); object-fit:contain; filter:drop-shadow(0 1px 1px rgba(80,50,20,.3)); }
  .dy-ov .dy-day .coin .v { position:absolute; right:3px; bottom:1px; font-size:11px !important;
    color:#4a3319; text-shadow:0 0 2px #fff, 0 0 2px #fff; }
  .dy-ov .dy-day .nm { color:#6d5536 !important; font-weight:700; font-size:11px !important; }
  .dy-ov .dy-day.today .coin { border-color:#e0a526 !important;
    background:linear-gradient(180deg,#fff6d8,#ffe29a) !important;
    box-shadow:0 3px 0 #b27c1f, 0 0 0 3px rgba(255,214,102,.5), 0 0 18px rgba(255,190,60,.55) !important; }
  .dy-ov .dy-day.today .nm { color:#b06d0c !important; }
  /* 받은 날 — 붉은 도장이 쾅 */
  .dy-ov .dy-day.done .coin img.rw { opacity:.45; }
  .dy-ov .dy-day.done .v { display:none; }
  .dy-ov .dy-day.done .ck { display:block !important; position:absolute; width:30px !important; height:30px !important;
    padding:5px; box-sizing:border-box; border-radius:50%; background:rgba(196,54,34,.92); color:#fff !important;
    border:2px solid #fff3e0; transform:rotate(-12deg); box-shadow:0 2px 4px rgba(0,0,0,.3); }
  .dy-ov .dy-day.pop .ck { animation:sk-stamp .5s cubic-bezier(.2,1.4,.4,1) both; }
  @keyframes sk-stamp { 0%{ transform:scale(2.2) rotate(-30deg); opacity:0; } 60%{ opacity:1; }
    100%{ transform:scale(1) rotate(-12deg); } }
  .dy-ov .dy-day .chest { display:none !important; }
  .dy-ov .dy-prize { background:linear-gradient(180deg,#6b4424,#4f2f15) !important;
    border:2px solid #3a220e !important; border-radius:16px !important;
    box-shadow:inset 0 1px 0 rgba(255,220,170,.25), 0 2px 0 rgba(0,0,0,.2); }
  .dy-ov .dy-prize .p { color:#f6e3bf !important; }
  .dy-ov .dy-prize .p b { color:#ffe08a !important; }
  .dy-ov .dy-prize .p svg { display:none; }
  .dy-ov .dy-prize .p img { width:26px; height:26px; object-fit:contain; }
  .dy-spark { background:#ffcf4a !important; box-shadow:0 0 6px #ffb800; }

  /* ================= 상자 ================= */
  .dy-ov .dy-chest { padding:0 !important; gap:0 !important; }
  .dy-ov .dy-loot:empty { display:none; }
  .dy-ov .dy-chest .art { width:130px !important; height:96px !important; border-radius:0 !important;
    background:radial-gradient(ellipse at 50% 60%,rgba(255,214,102,.55),transparent 65%) !important; }
  .dy-ov .dy-chest .art img { width:104px; height:auto; filter:drop-shadow(0 8px 8px rgba(80,50,20,.35));
    animation:sk-float 2.6s ease-in-out infinite; }
  @keyframes sk-float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }
  .dy-ov .dy-chest.shake .art img { animation:dy-shake .55s ease-in-out; }
  .dy-ov .dy-chest .art svg { display:none; }
  .dy-ov .dy-loot { color:#b0400f !important; font-family:"Gugi","Gowun Batang",serif; font-size:19px !important; }
  .dy-ov .dy-ways button { padding:9px 5px 10px !important; }
  .dy-ov .dy-ways button img { width:34px; height:34px; object-fit:contain; }
  .dy-ov .dy-ways button svg { width:26px !important; height:26px !important; color:#8a5a22; }
  .dy-ov .dy-ways .cap { color:#7d6243 !important; font-weight:400; }
  .dy-ov .dy-ways button.hi .cap { color:#6b4410 !important; }

  /* ================= 알약(읽는 값) — 나무 알약 ================= */
  #qs-ov .chip, #mg-ov .chip, #ul-ov .chip {
    background:linear-gradient(180deg,#7a4e2a,#5a3519) !important; border:1.5px solid #3a220e !important;
    color:#f6e3bf !important; box-shadow:inset 0 1px 0 rgba(255,220,170,.25); }
  #qs-ov .chip b, #mg-ov .chip b, #ul-ov .chip b { color:#ffe08a !important; }

  /* ================= 할 일 ================= */
  #qs-ov .qs-body { max-height:min(58vh,236px); overflow-y:auto; -webkit-overflow-scrolling:touch;
    display:flex; flex-direction:column; gap:7px; padding:2px 4px 4px; margin:0 -4px; }
  body.rot #qs-ov .qs-body { max-height:min(58vw,236px); }
  #qs-ov .q { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important;
    border:2px solid #b58d5c !important; border-radius:14px !important;
    box-shadow:0 2px 0 #9b7447 !important; }
  #qs-ov .q .nm { color:#3b2a17 !important; font-weight:700; }
  #qs-ov .q .hint, #qs-ov .q .n { color:#7d6243 !important; }
  #qs-ov .q .bar { background:#e3d1ad !important; box-shadow:inset 0 1px 2px rgba(80,50,20,.25); }
  #qs-ov .q .bar i { background:linear-gradient(90deg,#e9a93c,#ffd86b) !important; }
  #qs-ov .q .dot { border-color:#b58d5c !important; background:#fff8ea !important; color:#fff !important; }
  #qs-ov .q.done .dot { background:#3f8a4f !important; border-color:#2d6b3a !important; }
  #qs-ov .panel .q button:not(.x) { min-width:70px; padding:7px 10px !important; font-size:13px !important;
    background:linear-gradient(180deg,#7a4e2a,#5a3519) !important; color:#ffe08a !important;
    border-color:#3a220e !important; box-shadow:0 2px 0 #2f1a09 !important; }
  #qs-ov .panel .q.done:not(.got) button:not(.x) { background:linear-gradient(180deg,#ffe38a,#f2b83e) !important;
    color:#4a2e08 !important; border-color:#b27c1f !important; animation:sk-beat 1.6s ease-in-out infinite; }
  @keyframes sk-beat { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.06); } }

  /* ================= 미니게임 ================= */
  #mg-ov .mg-card { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important;
    border:2px solid #b58d5c !important; border-radius:16px !important; color:#3b2a17 !important;
    box-shadow:0 3px 0 #9b7447 !important; position:relative; }
  #mg-ov .mg-card svg.ic { display:none; }
  #mg-ov .mg-card img.art { width:64px; height:64px; object-fit:contain;
    filter:drop-shadow(0 2px 2px rgba(80,50,20,.3)); }
  #mg-ov .mg-card .ht { color:#7d6243 !important; }
  #mg-ov .mg-card:disabled { filter:grayscale(.75); opacity:.7 !important; }
  #mg-ov .mg-card svg.lk { position:absolute; top:6px; right:6px; width:26px; height:26px; padding:4px;
    box-sizing:border-box; border-radius:50%; background:#b98a3a; color:#fff; }
  #mg-ov .mg-col button, #mg-ov .mg-opts button { color:#3b2a17 !important; }

  /* ================= 계급 ================= */
  #ul-ov .ul-road .road { background:repeating-linear-gradient(90deg,#b08a5a 0 6px,#8d6a3f 6px 9px) !important;
    height:5px !important; }
  #ul-ov .ul-road .road i { height:5px !important; background:linear-gradient(90deg,#e9b44c,#ffd86b) !important; }
  #ul-ov .panel .ul-road button.st:not(.x) { background:none !important; border:0 !important; box-shadow:none !important; padding:0 !important; }
  #ul-ov .st .bd { position:relative; width:56px !important; height:56px !important; border-radius:14px !important;
    background:linear-gradient(180deg,#fffbf2,#f1e2c3) !important; border:2px solid #b58d5c !important;
    box-shadow:0 3px 0 #9b7447 !important; display:flex; align-items:center; justify-content:center; }
  #ul-ov .st .bd img.hat { width:46px; height:40px; object-fit:contain; }
  #ul-ov .st .bd svg { position:absolute; right:-5px; top:-5px; width:20px !important; height:20px !important;
    padding:3px; box-sizing:border-box; border-radius:50%; color:#fff !important; background:#9b7447; }
  #ul-ov .st.on .bd svg { background:#3f8a4f; }
  #ul-ov .st:not(.on) .bd img.hat { filter:grayscale(.8) opacity(.6); }
  #ul-ov .st.here .bd { border-color:#e0a526 !important; background:linear-gradient(180deg,#fff6d8,#ffe29a) !important;
    box-shadow:0 3px 0 #b27c1f, 0 0 0 3px rgba(255,214,102,.5), 0 0 16px rgba(255,190,60,.5) !important; }
  #ul-ov .st.sel .bd { outline:2px dashed #b06d0c; outline-offset:3px; }
  #ul-ov .st .nm { color:#4a3319 !important; font-weight:700; }
  #ul-ov .st.here .nm { color:#b06d0c !important; }
  #ul-ov .ul-det { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important;
    border:2px solid #b58d5c !important; border-radius:14px !important; box-shadow:0 2px 0 #9b7447 !important; }
  #ul-ov .ul-det .dn { color:#3b2a17 !important; font-family:"Gugi","Gowun Batang",serif; }
  #ul-ov .ul-det .dl, #ul-ov .ul-det .it { color:#6d5536 !important; }

  @media (prefers-reduced-motion:reduce){
    #qs-ov .q.done:not(.got) button { animation:none !important; }
    .dy-ov .dy-chest .art img, #menu-modal.show #menu-panel { animation:none !important; } }
  `;

  /* ---------- 2차: 목록이 안쪽에서 스크롤되는 창들 ----------
     판 자체는 넘치지 않고(최대 높이 유지) 안쪽 목록이 스크롤되므로, 틀은 ::before로 씌운다. */
  const P2 = ['#bd-ov .panel', '#srs-ov .panel', '#auth-ov .panel', '#cs-ov .panel',
              '#ask-box', '#badges-panel', '#kings-panel', '#eng-ov .panel', '#gold-ov .panel'];
  const e2 = suf => P2.map(p => p + suf).join(', ');
  /* 창 전체가 스크롤되는 창(인물·유물 도감) — 틀을 판의 테두리로 직접 그려야 스크롤해도 제자리다 */
  const P3 = ['#hero-ov .panel', '#bag-ov .panel'];
  const e3 = suf => P3.map(p => p + suf).join(', ');
  const css2 = `
  ${P2.join(', ')} {
    position:relative; isolation:isolate; overflow:visible !important;
    background:none !important; border:0 !important; border-radius:0 !important; box-shadow:none !important;
    padding:36px 30px 24px !important; color:#3b2a17 !important;
    filter:drop-shadow(0 22px 40px rgba(0,0,0,.55)); animation:sk-in .34s cubic-bezier(.2,.9,.25,1.2) both; }
  ${e2('::before')} {
    content:'' !important; position:absolute !important; inset:0 !important; z-index:-1 !important;
    display:block !important; height:auto !important; background:none !important; pointer-events:none;
    border-style:solid; border-width:56px 60px 56px 60px;
    border-image:url(${U}frame.webp) 195 205 195 205 fill / 56px 60px 56px 60px stretch; }
  #ask-box .bar { display:none !important; }

  ${P3.join(', ')} {
    background:none !important; border-radius:0 !important; box-shadow:0 22px 40px rgba(0,0,0,.45) !important;
    border-style:solid !important; border-width:40px 44px 40px 44px !important;
    border-image:url(${U}frame.webp) 195 205 195 205 fill / 40px 44px 40px 44px stretch !important;
    padding:4px 4px 8px !important; color:#3b2a17 !important; }

  /* 제목 — 현판 */
  #bd-ov h3, #srs-ov h3, #auth-ov h3, #cs-ov h3, #hero-ov h3, #bag-ov h3,
  #badges-panel .kp-head h2, #kings-panel .kp-head h2 {
    display:block; width:max-content; max-width:90%; margin:-52px auto 6px !important;
    padding:8px 40px 10px !important; background:url(${U}plaque.webp) center/100% 100% no-repeat;
    color:#fff1cf !important; font-family:"Gugi","Gowun Batang",serif !important;
    font-size:18px !important; letter-spacing:.06em; text-shadow:0 2px 0 #3d220c; white-space:nowrap; }
  #hero-ov h3, #bag-ov h3 { margin-top:0 !important; }
  #badges-panel .kp-head, #kings-panel .kp-head { flex-direction:column; align-items:center !important;
    border-bottom:0 !important; padding:0 !important; margin-bottom:6px; }
  .kp-sub, #bd-ov .sub, #srs-ov .sub, #auth-ov .sub, #auth-ov .me, #cs-ov .note, #cs-ov .when,
  #hero-ov .cntline, #bag-ov .cntline { color:#6d5536 !important; }

  /* 닫기 — 둥근 나무 */
  #badges-close, #kings-close, #hero-ov .pnl-x button, #bag-ov .pnl-x button {
    position:absolute !important; top:-12px !important; right:-12px !important;
    width:42px !important; height:42px !important; padding:0 !important; border:0 !important;
    border-radius:50% !important; font-size:0 !important; color:transparent !important;
    background:url(${U}xbtn.webp) center/contain no-repeat !important;
    filter:drop-shadow(0 3px 3px rgba(0,0,0,.4)); z-index:4; }
  #badges-close svg, #kings-close svg, #hero-ov .pnl-x button *, #bag-ov .pnl-x button * { display:none; }
  #hero-ov .pnl-x button, #bag-ov .pnl-x button { top:-30px !important; right:-34px !important; }

  /* 단추 */
  ${e2(' button:not(.g):not(.a):not(.del):not(.hi):not(.go):not(.load)')}, #srs-ov .go, #hero-ov .close, #bag-ov .close {
    background:linear-gradient(180deg,#fffaf0,#f3e4c6) !important; border:2px solid #a8814f !important;
    border-radius:14px !important; color:#4a3319 !important; font-weight:700;
    box-shadow:0 3px 0 #8a6538, inset 0 1px 0 #fff !important; }
  #badges-close, #kings-close { box-shadow:none !important; border:0 !important; }
  ${e2(' button.hi')}, ${e2(' button.go')}, ${e2(' button.load')}, #ask-box #ask-yes {
    background:linear-gradient(180deg,#ffe38a,#f2b83e) !important; border-color:#b27c1f !important;
    color:#4a2e08 !important; box-shadow:0 3px 0 #9a6614, inset 0 1px 0 #fff4c4 !important; }
  #ask-box #ask-yes.danger { background:linear-gradient(180deg,#f3a08c,#d4553d) !important;
    border-color:#8d2a1a !important; color:#fff !important; box-shadow:0 3px 0 #7a2415 !important; }
  #ask-box .msg { color:#3b2a17 !important; }
  #ask-box .msg b { color:#9a3f16 !important; }
  #auth-ov .del { color:#a0402c !important; }
  #auth-ov .close { background:none !important; border:0 !important; box-shadow:none !important;
    color:#7d6243 !important; font-weight:400; }
  #auth-ov .err { color:#a0402c !important; }
  #auth-ov .nick input { background:#fffaf0 !important; border:2px solid #b58d5c !important; color:#3b2a17 !important; }

  /* 목록 줄 — 크림 카드 */
  #bd-ov .row, #srs-ov .row, #cs-ov .row {
    background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important; border:2px solid #c9a878 !important;
    border-radius:12px !important; box-shadow:0 2px 0 #b08a5a !important; }
  #cs-ov .row { padding:8px 12px; }
  #bd-ov .row.me { background:linear-gradient(180deg,#fff2c4,#ffd97a) !important; border-color:#d49a2a !important; }
  #bd-ov .nm, #srs-ov .q, #cs-ov .row span, #cs-ov .row b { color:#3b2a17 !important; }
  #bd-ov .no, #bd-ov .tr, #srs-ov .meta, #bd-ov .empty, #srs-ov .empty { color:#7d6243 !important; }
  #bd-ov .sc { color:#9a5b1e !important; font-weight:700; }
  #bd-ov .row.top1 .no { color:#c28a12 !important; }
  #srs-ov .box { border-color:#b58d5c !important; background:#fff8ea !important; }
  #srs-ov .row.due .box { background:#f2b83e !important; }
  #srs-ov .row.due { border-color:#e0a526 !important; }

  /* 인물·유물 도감 */
  #hero-ov .dg-tab, #bag-ov .dg-tab { background:linear-gradient(180deg,#fffaf0,#f3e4c6) !important;
    border:2px solid #b58d5c !important; color:#6d5536 !important; }
  #hero-ov .dg-tab.on, #bag-ov .dg-tab.on { background:linear-gradient(180deg,#ffe38a,#f2b83e) !important;
    border-color:#b27c1f !important; color:#4a2e08 !important; }
  #hero-ov .era, #bag-ov .era { color:#fff !important; border-bottom:0 !important; display:inline-block;
    background:url(${U}rib_red.webp) left center/auto 100% no-repeat; padding:3px 30px 4px 12px !important;
    font-weight:700; text-shadow:0 1px 0 rgba(0,0,0,.35); letter-spacing:.08em !important; }
  #hero-ov .cell, #bag-ov .cell { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important;
    border:2px solid #c9a878 !important; border-radius:12px !important; box-shadow:0 2px 0 #b08a5a !important; }
  #hero-ov .cell .nm, #bag-ov .cell .nm { color:#3b2a17 !important; }
  #hero-ov .cell.locked .nm, #bag-ov .cell.locked .nm { color:#9d8a6c !important; }
  #hero-ov .cell .f, #bag-ov .cell .f { background:#efe0c0 !important; }
  #hero-ov .party, #bag-ov .party { background:rgba(181,141,92,.14) !important; border-color:#c9a878 !important; }
  #hero-ov .party *, #hero-ov .detail *:not(button):not(img) { color:#3b2a17; }
  #hero-ov .detail, #bag-ov .detail { background:linear-gradient(180deg,#fffbf2,#f1e2c3) !important;
    border:2px solid #b58d5c !important; color:#3b2a17 !important; }

  /* 배지함 */
  #badges-panel .badge-item { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important;
    border:2px solid #c9a878 !important; border-radius:12px !important; box-shadow:0 2px 0 #b08a5a !important; }
  #badges-panel .badge-item *, #badges-body h3, #badges-body h4, #badges-body .era-h { color:#3b2a17 !important; }

  /* 고침(2차 확인 후) */
  #kings-modal { z-index:42 !important; } #badges-modal { z-index:42 !important; }
  #badges-panel #badges-close, #kings-panel #kings-close {
    background:url(${U}xbtn.webp) center/contain no-repeat !important; border:0 !important;
    box-shadow:none !important; font-size:0 !important; }
  #hero-ov .panel .pnl-x button, #bag-ov .panel .pnl-x button {
    top:-2px !important; right:-4px !important; width:38px !important; height:38px !important;
    background:url(${U}xbtn.webp) center/contain no-repeat !important; border:0 !important; box-shadow:none !important; }
  .mn-sec h4, #mg-ov .sec, #qs-ov .sec, #ul-ov .sec, #hero-ov .era, #bag-ov .era, #badges-panel .badge-era {
    background-size:100% 100% !important; width:max-content; max-width:100%; box-sizing:border-box; }
  #badges-panel .badge-era { display:block; color:#fff !important; font-size:12px !important;
    background:url(${U}rib_red.webp) left center/100% 100% no-repeat; padding:3px 30px 4px 12px !important;
    text-shadow:0 1px 0 rgba(0,0,0,.35); border:0 !important; }
  #badges-panel .badge-era::after { display:none !important; }
  #hero-ov .party .slot { background:#fff8ea !important; border:2px dashed #b58d5c !important; }
  #hero-ov .party .slot .e { color:#b58d5c !important; }
  #hero-ov .party .info { color:#6d5536 !important; }
  #hero-ov .party .info b { color:#9a5b1e !important; }
  #kings-panel .kp-king .kp-nm { color:#3b2a17 !important; font-weight:700 !important; }
  #kings-panel .kp-king .kp-yr { color:#7d6243 !important; }

  /* 왕조 계보 — 글자만 먹색으로(도식은 그대로) */
  #kings-panel, #kings-panel #kings-body { color:#3b2a17; }
  #kings-panel .kp-king .kp-name, #kings-panel .kp-legend, #kings-panel .kp-legend * { color:#3b2a17 !important; }
  #kings-panel .kp-king .kp-year, #kings-panel .kp-king .kp-a { color:#6d5536 !important; }
  `;

  /* ---------- 3차: 목록 화면(index) — 한지 바탕 ---------- */
  const css3 = !document.getElementById('era-list') ? '' : `
  html, body { background:#2a1d10 !important; }
  #wrap { background:
      radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(90,55,20,.28) 100%),
      url(${U}hanji.webp) center/cover no-repeat, #f3e7cc !important; }
  #app { color:#3b2a17; }
  /* 로고 PNG 가장자리에 반투명 흰 기가 있어 한지 위에서 흐린 네모로 보였다 — 곱하기로 섞어 지운다 */
  h1 img { mix-blend-mode:multiply; filter:brightness(.8) saturate(1.4) contrast(1.1); }
  .subtitle { color:#7d6243 !important; }
  #menu-btn { width:40px !important; height:40px !important; border-radius:50% !important;
    background:radial-gradient(circle at 35% 30%,#a8733f,#6b4424) !important; border:2px solid #3a220e !important;
    color:#fff1cf !important; box-shadow:0 3px 0 #2f1a09, inset 0 1px 0 rgba(255,220,170,.35) !important; }
  #streak-pill { background:linear-gradient(180deg,#7a4e2a,#5a3519) !important; border:1.5px solid #3a220e !important; }
  #streak-pill span { color:#ffe08a !important; }
  #auth-btn { background:linear-gradient(180deg,#7a4e2a,#5a3519) !important; border:1.5px solid #3a220e !important;
    color:#ffe08a !important; }
  /* 시대 */
  .era-title { color:#fff !important; font-family:"Gugi","Gowun Batang",serif; font-weight:400 !important;
    font-size:15px !important; letter-spacing:.04em; display:inline-block;
    background:url(${U}rib_red.webp) left center/100% 100% no-repeat; padding:4px 46px 6px 12px;
    text-shadow:0 1px 0 rgba(0,0,0,.4); border-bottom:0 !important; }
  .era-section:nth-of-type(8n+2) .era-title { background-image:url(${U}rib_blue.webp); }
  .era-section:nth-of-type(8n+3) .era-title { background-image:url(${U}rib_gold.webp); }
  .era-section:nth-of-type(8n+5) .era-title { background-image:url(${U}rib_blue.webp); filter:hue-rotate(-75deg); }
  .era-section:nth-of-type(8n+6) .era-title { background-image:url(${U}rib_gold.webp); }
  .era-section:nth-of-type(8n+7) .era-title { background-image:url(${U}rib_blue.webp); }
  .era-year { color:#6d5536 !important; font-weight:700; }
  .era-pct { color:#9a5b1e !important; font-weight:700; }
  .era-dot { background:#d9533b !important; border-color:#f3e7cc !important; box-shadow:0 0 0 2px #8a5a2b !important; }
  .era-track-line { height:5px !important; background:repeating-linear-gradient(90deg,#b08a5a 0 6px,#8d6a3f 6px 9px) !important;
    border-radius:3px; }
  .era-track-dot.start { background:#8a5a2b !important; }
  .era-track-dot.end { background:#f3e7cc !important; border-color:#8a5a2b !important; }
  .era-track-dot.current { background:#ffe08a !important; border-color:#d98a12 !important;
    box-shadow:0 0 0 3px rgba(255,214,102,.45), 0 0 14px rgba(255,170,40,.7) !important; }
  .era-exam-btn { text-shadow:none !important; background:linear-gradient(180deg,#7a4e2a,#5a3519);
    border:2px solid #3a220e; border-radius:12px; padding:5px 4px 6px; box-shadow:0 3px 0 #2f1a09; }
  .era-exam-btn .eb-title { color:#ffe08a !important; font-size:13.5px !important; }
  .era-exam-btn .eb-sub { color:#f6e3bf !important; }
  .era-exam-btn .eb-icon { color:#ffe08a !important; }
  .era-mascot { filter:drop-shadow(0 4px 4px rgba(80,50,20,.35)); }
  /* 챕터 카드 — 나무 테두리 이야기책 */
  .chapter-card { border:3px solid #8a5a2b !important; border-radius:14px !important;
    box-shadow:0 4px 0 #5a3519, 0 6px 14px rgba(60,35,10,.3) !important; }
  .chapter-card.recent { border-color:#e0a526 !important;
    box-shadow:0 4px 0 #9a6614, 0 0 0 3px rgba(255,214,102,.6), 0 0 22px 6px rgba(255,190,60,.55) !important; }
  .chapter-card.recent::before { border-bottom-color:#e0a526 !important; }
  .chapter-card.locked { filter:grayscale(.8) brightness(.8) !important; }
  .chapter-card.locked .ccard-lock { width:34px !important; height:38px !important; background:url(${U}lock.webp) center/contain no-repeat !important;
    border:0 !important; top:6px !important; right:6px !important; filter:none; }
  .chapter-card.locked .ccard-lock svg { display:none; }
  /* 이달의 시대 띠 */
  #sn-band { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important; border:2px solid #b58d5c !important;
    box-shadow:0 3px 0 #9b7447 !important; }
  #sn-band .k { color:#9a5b1e !important; }
  #sn-band .v { color:#3b2a17 !important; font-weight:700; }
  #sn-band .mark { background:linear-gradient(180deg,#7a4e2a,#5a3519) !important; border-color:#3a220e !important; color:#ffe08a !important; }
  #sn-band .bar { background:#e3d1ad !important; }
  #sn-band .bar i { background:linear-gradient(90deg,#e9a93c,#ffd86b) !important; }
  #sn-band .rt { color:#7d6243 !important; }
  #sn-band .rt b { color:#9a5b1e !important; }
  .plan-note { color:#7d6243 !important; }
  `;

  /* ---------- 4차: 챕터 화면(게임 안) ----------
     속말(.inner-voice)은 inner.js의 밝은 회청색 창을 그대로 둔다 — 성일님이 맞춘 것이다. */
  const css4 = !document.getElementById('dlg-overlay') ? '' : `
  /* 대화창 — 한지 판에 나무 틀. 창이 스크롤될 수 있어 틀은 판 테두리에 직접 */
  #dlg-frame:not(.inner-voice) #dlg-panel, #quiz-panel, #gloss-panel, #intro-panel, #map-panel, #game-menu-panel {
    background:none !important; border-radius:0 !important; box-shadow:0 12px 30px rgba(0,0,0,.45) !important;
    border-style:solid !important; border-width:26px 30px 26px 30px !important;
    border-image:url(${U}frame.webp) 195 205 195 205 fill / 26px 30px 26px 30px stretch !important;
    color:#3b2a17 !important; isolation:isolate; }
  #dlg-frame:not(.inner-voice) #dlg-panel { padding:4px 4px 2px 104px !important; min-height:80px !important; }
  #quiz-panel, #gloss-panel, #intro-panel, #game-menu-panel { padding:4px 6px 4px !important; }
  #map-panel { padding:6px 8px !important; }
  /* 말하는 사람에 따라 한지에 옅은 물을 들인다(나=옥빛, 끼어드는 사람=쪽빛) */
  #dlg-frame.me-speaker #dlg-panel::after, #dlg-frame.alt-speaker #dlg-panel::after {
    content:''; position:absolute; inset:0; z-index:-1; pointer-events:none; border-radius:6px; }
  #dlg-frame.me-speaker #dlg-panel::after { background:rgba(77,138,115,.16); }
  #dlg-frame.alt-speaker #dlg-panel::after { background:rgba(53,112,140,.16); }
  #dlg-frame:not(.inner-voice) .dlg-name { color:#8a3b12 !important; font-family:"Gugi","Gowun Batang",serif; font-weight:400 !important; }
  #dlg-frame.me-speaker .dlg-name { color:#2f6b52 !important; }
  #dlg-frame.alt-speaker .dlg-name { color:#255a78 !important; }
  #dlg-frame:not(.inner-voice) .dlg-tag { color:#7d6243 !important; }
  #dlg-frame:not(.inner-voice) .dlg-box, #dlg-frame:not(.inner-voice) #dlg-text { color:#3b2a17 !important; }
  #dlg-frame:not(.inner-voice) .dlg-next, #dlg-frame:not(.inner-voice) .dlg-prev { color:#8a5a2b !important; font-weight:700; }
  #dlg-frame:not(.inner-voice) .photo-credit { color:#8d7552 !important; }
  .dlg-portrait { border:3px solid #8a5a2b !important; background-color:#f3e4c4 !important;
    box-shadow:0 3px 0 #5a3519, 0 10px 18px rgba(0,0,0,.35) !important; }
  #dlg-frame.me-speaker .dlg-portrait { border-color:#3f7a62 !important; box-shadow:0 3px 0 #2a5543, 0 10px 18px rgba(0,0,0,.35) !important; }
  #dlg-frame.alt-speaker .dlg-portrait { border-color:#35708c !important; box-shadow:0 3px 0 #244e63, 0 10px 18px rgba(0,0,0,.35) !important; }
  .dlg-close, .quiz-close, .gloss-close, #map-close {
    width:34px !important; height:34px !important; border:0 !important; font-size:0 !important; color:transparent !important;
    background:url(${U}xbtn.webp) center/contain no-repeat !important; top:-20px !important; right:-22px !important;
    filter:drop-shadow(0 2px 2px rgba(0,0,0,.4)); }
  .dlg-close *, .quiz-close *, .gloss-close *, #map-close * { display:none !important; }
  /* 대화창 ✕ — 폰에서는 노치 여백만큼 오른쪽 단추 줄이 안으로 들어와 ✕와 겹쳤다(눌러도 안 꺼짐 제보).
     틀 윗변 안쪽 모서리에 두고, 대화 묶음을 단추 줄보다 위에 올린다. */
  #dlg-frame .dlg-close { top:-19px !important; right:10px !important; width:40px !important; height:40px !important; z-index:5 !important; }
  #dlg-overlay { z-index:30 !important; }
  /* 오른쪽 단추 속 그림에 붙은 그림자가 네모로 보였다 */
  #bag-btn svg, #hero-btn svg, #auto-btn svg { box-shadow:none !important; filter:none !important; }
  /* 퀴즈·풀이·지도 창은 안쪽이 스크롤돼 밖으로 내민 단추가 잘린다 — 안쪽 모서리에 둔다 */
  .quiz-close, .gloss-close, #map-close { top:0 !important; right:0 !important; width:32px !important; height:32px !important; }

  /* 퀴즈 */
  .quiz-q { color:#3b2a17 !important; font-weight:700; }
  .quiz-opt { background:linear-gradient(180deg,#fffaf0,#f3e4c6) !important; border:2px solid #b58d5c !important;
    color:#3b2a17 !important; font-weight:700; box-shadow:0 3px 0 #8a6538 !important; }
  .quiz-opt:active { transform:translateY(2px); box-shadow:0 1px 0 #8a6538 !important; }
  .quiz-opt.correct { background:linear-gradient(180deg,#e4f5e2,#b9e0b4) !important; border-color:#3f8a4f !important;
    box-shadow:0 3px 0 #2d6b3a !important; }
  .quiz-opt.wrong { background:linear-gradient(180deg,#fbe1da,#f0b2a4) !important; border-color:#c4442e !important;
    box-shadow:0 3px 0 #8d2a1a !important; }
  #quiz-panel * { --qtxt:#3b2a17; }
  #quiz-panel .quiz-src, #quiz-panel .quiz-tag, #quiz-panel small { color:#7d6243 !important; }
  .gloss-title { color:#8a3b12 !important; } .gloss-body { color:#3b2a17 !important; }
  .gloss-term { color:#9a4a12 !important; }
  #game-menu-panel h3 { color:#8a3b12 !important; font-family:"Gugi","Gowun Batang",serif !important; }
  #game-menu-panel a, #game-menu-panel button { background:linear-gradient(180deg,#fffaf0,#f3e4c6) !important;
    border:2px solid #b58d5c !important; color:#3b2a17 !important; box-shadow:0 2px 0 #8a6538 !important; }
  #intro-panel, #intro-text { color:#3b2a17 !important; }
  #map-panel * { color:inherit; }

  /* 오른쪽 세로 단추들 — 둥근 나무 */
  #gold-btn, #eng-btn { background:linear-gradient(180deg,#7a4e2a,#5a3519) !important; border:2px solid #3a220e !important;
    color:#ffe08a !important; box-shadow:0 2px 0 #2f1a09, inset 0 1px 0 rgba(255,220,170,.3) !important; }
  #gold-btn svg, #eng-btn svg { display:none !important; }
  #gold-btn::before, #eng-btn::before { content:''; width:20px; height:20px; flex:none;
    background:url(${U}coin.webp) center/contain no-repeat; }
  #eng-btn::before { background-image:url(${U}stamina.webp); }
  #bag-btn, #hero-btn, #auto-btn { background:radial-gradient(circle at 35% 30%,#a8733f,#6b4424) !important;
    border:2px solid #3a220e !important; color:#fff1cf !important;
    box-shadow:0 2px 0 #2f1a09, inset 0 1px 0 rgba(255,220,170,.35) !important; }
  #auto-btn.on, #auto-btn.active { background:radial-gradient(circle at 35% 30%,#ffe38a,#e0a526) !important; color:#4a2e08 !important; }
  /* 조이스틱 — 나무 원판에 놋쇠 손잡이 */
  #stick-base { background:radial-gradient(circle at 50% 45%,rgba(168,115,63,.55),rgba(90,53,25,.55) 70%) !important;
    border:3px solid rgba(58,34,14,.75) !important; box-shadow:inset 0 0 0 5px rgba(255,220,170,.12), 0 3px 8px rgba(0,0,0,.35); }
  #stick-knob { background:radial-gradient(circle at 35% 30%,#fff1b0,#d9a441 55%,#8a5a1a) !important;
    box-shadow:0 3px 6px rgba(0,0,0,.45), inset 0 -2px 3px rgba(0,0,0,.25); }
  #minimap-canvas { border:3px solid #8a5a2b !important; border-radius:10px !important;
    box-shadow:0 3px 0 #5a3519, 0 4px 10px rgba(0,0,0,.4) !important; }
  #zone-label { color:#fff1cf !important; }
  #next-chapter-btn { background:linear-gradient(180deg,#ffe38a,#f2b83e) !important; border:2px solid #b27c1f !important;
    color:#4a2e08 !important; font-weight:700; box-shadow:0 3px 0 #9a6614, 0 0 16px rgba(255,190,60,.6) !important; }
  #act-btn { background:radial-gradient(circle at 35% 30%,#ffe38a,#e0a526 60%,#a8701a) !important;
    border:3px solid #7a4e12 !important; box-shadow:0 4px 0 #6b4410, 0 6px 12px rgba(0,0,0,.4) !important; }
  `;

  /* ---------- 노치 — 모든 창이 양옆 안전 영역 안에 들어오게 (2026-09-19 성일님) ----------
     가로로 든 아이폰은 노치·둥근 모서리가 왼쪽 또는 오른쪽에 온다. 어느 쪽인지 모르니
     두 값 중 큰 쪽을 양옆에 똑같이 비운다. 닫기 단추가 틀 밖으로 12px 튀어나오므로 그만큼 더. */
  const SAFE = 'max(env(safe-area-inset-left), env(safe-area-inset-right), 8px)';
  const css5 = `
  ${P}, ${P2.join(', ')}, ${P3.join(', ')} {
    max-width:calc(100% - 2 * ${SAFE} - 28px) !important; box-sizing:border-box; }
  #dlg-stack { max-width:min(640px, calc(100% - 2 * ${SAFE} - 28px)) !important; }
  #quiz-panel, #gloss-panel, #intro-panel, #map-panel, #game-menu-panel {
    max-width:min(640px, calc(100% - 2 * ${SAFE} - 28px)) !important;
    margin-left:auto !important; margin-right:auto !important; }
  #gloss-panel { max-width:min(320px, calc(100% - 2 * ${SAFE} - 28px)) !important; }
  `;

  /* ---------- 리본 다시(2026-09-19 성일님 "챕터 이름 나타내는 게 별로야. 구려") ----------
     리본 그림을 글자 길이에 맞춰 늘리니 꼬리까지 글자가 걸치고 모양이 찌그러졌다.
     그림을 버리고 CSS로 그린다: 단색 띠 + 왼쪽 단청 세 줄 + 오른쪽 제비꼬리. 글자 길이에 딱 맞는다. */
  const RIB = ['.era-title', '.mn-sec h4', '#mg-ov .sec', '#qs-ov .sec', '#ul-ov .sec',
               '#hero-ov .era', '#bag-ov .era', '#badges-panel .badge-era'];
  const css6 = `
  ${RIB.join(', ')} {
    --rb:#c2412b; --rb2:#9c2c1a;
    display:inline-flex !important; align-items:center; width:max-content; max-width:100%;
    box-sizing:border-box; position:relative;
    background:linear-gradient(180deg,var(--rb) 0%,var(--rb2) 100%) !important; background-size:auto !important;
    padding:4px 26px 5px 17px !important; min-height:0 !important; line-height:1.25 !important;
    color:#fff !important; font-weight:700 !important; letter-spacing:.06em !important;
    text-shadow:0 1px 0 rgba(0,0,0,.3) !important; border:0 !important; border-radius:3px 0 0 3px;
    clip-path:polygon(0 0,100% 0,calc(100% - 11px) 50%,100% 100%,0 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 0 rgba(0,0,0,.15) !important; filter:none !important; }
  /* 왼쪽 단청 세 줄 */
  ${RIB.map(r => r + '::before').join(', ')} {
    content:'' !important; position:absolute; left:0; top:0; bottom:0; width:10px;
    background:linear-gradient(90deg,#2f7a5a 0 3px,#f4d35e 3px 6px,#2d5f9a 6px 10px) !important; }
  .mn-sec h4::after, #mg-ov .sec::after, #qs-ov .sec::after, #ul-ov .sec::after { display:none !important; }
  .era-title { font-family:"Gugi","Gowun Batang",serif !important; font-weight:400 !important;
    font-size:16px !important; padding:5px 30px 6px 19px !important; }
  /* 색 — 묶음마다 다르게(오방색) */
  .mn-sec[data-sec="익히기"] h4, .era-section:nth-of-type(8n+2) .era-title,
  .era-section:nth-of-type(8n+6) .era-title { --rb:#3a6fb0; --rb2:#274f85; }
  .mn-sec[data-sec="기록"] h4, .era-section:nth-of-type(8n+3) .era-title,
  .era-section:nth-of-type(8n+7) .era-title { --rb:#d99a1e; --rb2:#a8720c; }
  .mn-sec[data-sec="설정"] h4, .era-section:nth-of-type(8n+4) .era-title,
  .era-section:nth-of-type(8n+8) .era-title { --rb:#3d8a5f; --rb2:#28674a; }
  .era-title.clk { cursor:pointer; }
  `;

  /* ---------- 고침 2026-09-19 (실기기 제보) ----------
     1) 주인공 초상 — 보스전용 고해상도 그림(battle.png)의 상반신을 잡는다
     2) 닫기 ✕는 틀 바깥 모서리에 — 안쪽이 스크롤되는 창은 판을 한 겹 감싸(.sk-hold)
        ✕를 그 감싼 쪽으로 옮긴다(아래 hoist). 판 안에 두면 스크롤 영역에 잘려 안쪽으로 밀렸다.
     3) 기력·금 창 — 현판 옷 + 인삼 그림 칸 + 모서리 ✕ */
  const css7 = `
  /* 주인공 초상 — NPC 초상과 같은 전신 그림(assets/player/<신분>/portrait.png)이라 같은 방식(cover·위쪽)으로 */
  .dlg-portrait.me-pic { background-size:cover !important; background-position:center top !important;
    background-repeat:no-repeat !important; image-rendering:auto !important; }
  .sk-hold { position:relative; display:flex; flex-direction:column; min-height:0; box-sizing:border-box; }
  #hero-ov > .sk-hold > .panel, #bag-ov > .sk-hold > .panel, .sk-hold > #quiz-panel, .sk-hold > #gloss-panel, .sk-hold > #map-panel {
    width:100% !important; max-width:none !important; margin:0 !important; flex:1 1 auto; min-height:0; }
  #hero-ov > .sk-hold { width:min(92%,560px); max-height:88%; max-width:calc(100% - 2 * ${SAFE} - 28px); }
  #bag-ov > .sk-hold { width:min(90%,520px); max-height:84%; max-width:calc(100% - 2 * ${SAFE} - 28px); }
  #quiz-overlay > .sk-hold, #gloss-overlay > .sk-hold, #map-overlay > .sk-hold {
    width:100%; max-width:min(640px, calc(100% - 2 * ${SAFE} - 28px)); max-height:80%;
    margin:0 auto calc(16px + env(safe-area-inset-bottom)); }
  #gloss-overlay > .sk-hold { max-width:min(320px, calc(100% - 2 * ${SAFE} - 28px)); }
  #map-overlay > .sk-hold { max-height:92%; }
  .sk-hold > .sk-x, .sk-hold > .sk-x.quiz-close, .sk-hold > .sk-x.gloss-close, .sk-hold > #map-close {
    position:absolute !important; top:-14px !important; right:-14px !important; left:auto !important;
    width:42px !important; height:42px !important; margin:0 !important; padding:0 !important;
    border:0 !important; border-radius:50% !important; font-size:0 !important; color:transparent !important;
    background:url(${U}xbtn.webp) center/contain no-repeat !important; box-shadow:none !important;
    filter:drop-shadow(0 3px 3px rgba(0,0,0,.4)); z-index:6; cursor:pointer; }
  .sk-hold > .sk-x * { display:none !important; }
  .sk-hold > .sk-x:active { transform:scale(.92); }
  #hero-ov .pnl-x, #bag-ov .pnl-x { display:none !important; }

  /* 기력 · 금 */
  #eng-ov h3, #gold-ov h3 { display:block; width:max-content; max-width:90%; margin:-52px auto 4px !important;
    padding:8px 40px 10px !important; background:url(${U}plaque.webp) center/100% 100% no-repeat;
    color:#fff1cf !important; font-family:"Gugi","Gowun Batang",serif !important; font-size:18px !important;
    letter-spacing:.06em; text-shadow:0 2px 0 #3d220c; }
  #eng-ov .dots { gap:10px !important; margin:4px 0 2px !important; }
  #eng-ov .dot { width:46px !important; height:46px !important; border-radius:12px !important;
    background:url(${U}stamina.webp) center/78% no-repeat, linear-gradient(180deg,#fffbf2,#f1e2c3) !important;
    border:2px solid #b58d5c !important; box-shadow:0 3px 0 #9b7447 !important;
    filter:grayscale(1) opacity(.45); }
  #eng-ov .dot.on { filter:none; border-color:#3f8a4f !important; box-shadow:0 3px 0 #2d6b3a, 0 0 10px rgba(80,170,100,.35) !important; }
  #eng-ov .sub, #gold-ov .bal { color:#6d5536 !important; }
  #eng-ov .msg, #gold-ov .msg { color:#9a5b1e !important; font-weight:700; }
  #eng-ov #eng-x, #gold-ov #gold-close {
    position:absolute !important; top:-10px !important; right:-10px !important; width:42px !important; height:42px !important;
    padding:0 !important; border:0 !important; border-radius:50% !important; font-size:0 !important; color:transparent !important;
    background:url(${U}xbtn.webp) center/contain no-repeat !important; box-shadow:none !important;
    filter:drop-shadow(0 3px 3px rgba(0,0,0,.4)); z-index:4; margin:0 !important; }
  #eng-ov #eng-gold::before { content:''; display:inline-block; width:20px; height:20px; margin-right:6px; vertical-align:-4px;
    background:url(${U}coin.webp) center/contain no-repeat; }
  #gold-ov .row { background:linear-gradient(180deg,#fffbf2,#f4e6c9) !important; border:2px solid #c9a878 !important;
    border-radius:12px !important; box-shadow:0 2px 0 #b08a5a !important; }
  #gold-ov .row .nm { color:#3b2a17 !important; font-weight:700; }
  #gold-ov .row .ds { color:#7d6243 !important; }
  #gold-ov .row .ic { color:#9a5b1e !important; }
  #gold-ov .row button { background:linear-gradient(180deg,#ffe38a,#f2b83e) !important; border:2px solid #b27c1f !important;
    color:#4a2e08 !important; box-shadow:0 2px 0 #9a6614 !important; }
  `;

  /* 안쪽이 스크롤되는 창의 ✕를 틀 바깥으로 — 판을 한 겹 감싸고 ✕를 그리로 옮긴다.
     창을 열 때마다 새로 그리는 모듈(도감)이 있어 DOM이 바뀔 때마다 다시 본다.
     ✕ 요소를 옮기기만 하므로 붙어 있던 클릭 처리는 그대로 산다. */
  const HOIST = [
    ['#hero-ov > .panel', '#hero-x'], ['#bag-ov > .panel', '#bag-x'],
    ['#quiz-panel', '.quiz-close'], ['#gloss-panel', '.gloss-close'], ['#map-panel', '#map-close'],
  ];
  function hoist(){
    for (const [ps, xs] of HOIST){
      document.querySelectorAll(ps).forEach(p => {
        let hold = p.parentElement;
        if (!hold || !hold.classList.contains('sk-hold')){
          hold = document.createElement('div'); hold.className = 'sk-hold';
          p.parentNode.insertBefore(hold, p); hold.appendChild(p);
        }
        const x = p.querySelector(xs);
        if (x){ x.classList.add('sk-x'); hold.appendChild(x); }
      });
    }
  }

  const st = document.createElement('style');
  st.id = 'uiskin';
  st.textContent = css + css2 + css3 + css4 + css5 + css6 + css7;
  function last(){
    const h = document.head;
    if (h && h.lastElementChild !== st) h.appendChild(st);
  }
  last();
  // 모듈이 창을 열 때 제 스타일을 뒤에 붙이면, 이 옷을 다시 맨 끝으로
  try {
    new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes){
        if (n !== st && (n.nodeName === 'STYLE' || n.nodeName === 'LINK')){ last(); return; }
      }
    }).observe(document.head, { childList: true });
  } catch(e){}
  /* 닫기는 손을 떼는 즉시 — 대사를 넘기다 곧바로 ✕를 누르면 '더블탭 확대 막기'(300ms)가
     click을 삼켜 안 닫혔다. pointerup에서 바로 닫는다. */
  document.addEventListener('pointerup', e => {
    const x = e.target && e.target.closest && e.target.closest('.dlg-close');
    if (x && window.Dialog && Dialog.close){ e.preventDefault(); Dialog.close(); }
  }, true);
  const runHoist = () => { try { hoist(); } catch(e){} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runHoist); else runHoist();
  try {
    let t = 0;
    new MutationObserver(() => { if (!t) t = setTimeout(() => { t = 0; runHoist(); }, 120); })
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch(e){}
  // 그림은 미리 받아 둔다(처음 열 때 빈 칸이 번쩍이지 않게)
  ['frame', 'plaque', 'xbtn', 'rib_red', 'rib_blue', 'rib_gold', 'coin', 'stamina'].forEach(n => {
    const i = new Image(); i.src = U + n + '.webp';
  });
})();
