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

  const st = document.createElement('style');
  st.id = 'uiskin';
  st.textContent = css;
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
  // 그림은 미리 받아 둔다(처음 열 때 빈 칸이 번쩍이지 않게)
  ['frame', 'plaque', 'xbtn', 'rib_red', 'rib_blue', 'rib_gold', 'coin', 'stamina'].forEach(n => {
    const i = new Image(); i.src = U + n + '.webp';
  });
})();
