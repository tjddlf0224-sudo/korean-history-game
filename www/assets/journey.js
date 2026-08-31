/* ============ 여정 — 왜 시대를 하나씩 건너는가 (전 챕터 + 목록 화면 공용) ============

   왜 만들었나
   - 독서실에서 잠들어 선사로 떨어지는 것까지는 있었는데, 그 뒤가 없었다.
     왜 36화를 순서대로 거쳐야 하는지, 어떻게 깨어나는지가 이야기에 없었다.
   - 규칙 하나로 꿴다: **한 시대를 다 겪으면 그 시대의 유물이 손에 들어오고,
     그것이 다음 시대로 가는 열쇠가 된다.** 아홉 개를 다 모으면 깨어난다.

   왜 챕터가 아니라 시대 단위인가
   - 챕터마다 열쇠를 두면 36개가 필요한데, 그 챕터의 사건에 딱 맞는 유물이
     없는 챕터가 여럿이다(사화·임오군란처럼 '물건'이 남지 않은 사건).
     시대 단위로 묶으면 아홉 개 모두 그 시대를 대표하는 유물로 채울 수 있다.
   - 시대 구분은 index.html의 챕터 목록과 같다. 다른 구분을 쓰면 헷갈린다.

   붙이는 법
     <script src="assets/journey.js"></script>   (items.js·badges.js 뒤)
     챕터를 끝낼 때  Journey.onChapterEnd()
*/
window.Journey = (function(){

  /* 시대 → 그 시대의 챕터들, 그리고 열쇠가 되는 유물 */
  const ERAS = [
    { id:'seonsa', name:'선사·초기국가', key:'bipahyeong',
      line:'청동검을 쥐자 손끝이 저릿하다. 돌의 시대가 저물고 있다.',
      chapters:['seonsa1.html'] },
    { id:'godae', name:'고대', key:'manpasikjeok',
      line:'피리 소리가 바다를 잠재운다. 세 나라가 하나로 접힌다.',
      chapters:['godae1.html','gaya.html','tongil.html','godae2.html','godae3.html'] },
    { id:'goryeo', name:'고려', key:'palmandaejanggyeong',
      line:'경판을 짚자 팔만 장의 글자가 한꺼번에 울린다.',
      chapters:['goryeo1.html','goryeo2.html','byeokrando.html','goryeo3.html'] },
    { id:'joseon_early', name:'조선 전기', key:'hunminjeongeum',
      line:'"나랏말싸미…" 처음으로, 글자가 눈에 들어온다.',
      chapters:['ch0.html','ch1.html','ch2.html','ch2b.html','ch3.html',
                'ch4.html','ch5.html','ch5b.html','ch6.html'] },
    { id:'joseon_late', name:'조선 후기', key:'daedongyeojido',
      line:'지도를 펴자 산줄기가 길을 낸다. 어디로든 갈 수 있을 것 같다.',
      chapters:['imjin.html','imjin2.html','hugi1.html','hugi2.html','hugi3.html'] },
    { id:'gaehang', name:'근대·개항기', key:'daehanguksae',
      line:'국새가 무겁다. 지키려 한 것과 지키지 못한 것이 함께 눌러온다.',
      chapters:['gaehang1.html','gaehang_ch2.html','gaehang_ch3.html',
                'gaehang4.html','gaehang5.html'] },
    { id:'ilje', name:'일제강점기', key:'gimiseoneon',
      line:'접힌 자국이 깊다. 이 종이가 얼마나 많은 손을 거쳤는지 알 것 같다.',
      chapters:['ilje1.html','ilje2.html','ilje_ch7.html'] },
    { id:'hyeondae', name:'현대', key:'yugilo',
      line:'두 사람의 서명 위에 손을 얹는다. 아직 끝나지 않은 시간이다.',
      chapters:['hyeondae1.html','hyeondae2.html','hyeondae3.html'] },
    { id:'sesi', name:'시대 통합', key:'sangpyeongtongbo',
      line:'엽전 꾸러미가 짤랑인다. 어느 시대에나 사람들은 이렇게 살았다.',
      chapters:['sesi.html'] },
  ];

  const done = f => (window.Badges ? Badges.has('ch_complete_' + f) : false);

  function eraOf(file){ return ERAS.find(e => e.chapters.indexOf(file) >= 0) || null; }
  function eraDone(e){ return e.chapters.every(done); }
  function keysHeld(){ return ERAS.filter(e => window.Items && Items.has(e.key)); }
  function allDone(){ return ERAS.every(eraDone); }

  /* 진행도 — 목록 화면과 엔딩이 함께 쓴다 */
  function progress(){
    const chs = ERAS.reduce((a, e) => a.concat(e.chapters), []);
    return {
      chapters: { done: chs.filter(done).length, total: chs.length },
      eras:     { done: ERAS.filter(eraDone).length, total: ERAS.length },
      keys: ERAS.map(e => ({ id:e.id, name:e.name, key:e.key,
                             got: !!(window.Items && Items.has(e.key)), done: eraDone(e) })),
    };
  }

  /* ---------------- 챕터를 끝냈을 때 ----------------
     그 시대를 다 겪었다면 열쇠를 손에 쥐여 주고, 아홉 개가 다 모였으면
     깨어날 때가 되었음을 알린다. */
  function onChapterEnd(){
    const file = location.pathname.split('/').pop();
    const e = eraOf(file);
    if (!e || !eraDone(e)) return null;
    if (!window.Items || Items.has(e.key)) return checkEnding();
    // 탐색으로 미리 주웠으면 그대로 두고, 아니면 여기서 준다
    Items.give(e.key);
    setTimeout(() => keyScene(e), 700);
    return e;
  }

  function checkEnding(){
    if (!allDone()) return null;
    try { if (localStorage.getItem('khg_ending_seen')) return null; } catch(e){}
    setTimeout(() => { location.href = 'ending.html'; }, 1200);
    return 'ending';
  }

  /* ---------------- 열쇠를 얻는 장면 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    .jn-key { position:absolute; inset:0; z-index:90; display:flex; align-items:center;
      justify-content:center; background:rgba(8,6,3,.86); font-family:"Gowun Batang",serif;
      opacity:1; transition:opacity .5s; }
    /* 애니메이션으로만 보이게 하지 않는다 — 애니메이션 시계가 가지 않는
       환경에서는 화면에 아무것도 안 뜬다(실제로 겪었다). JS로 띄웠다 지운다. */
    .jn-key .box { text-align:center; padding:0 8%; max-width:34em; }
    .jn-key .era { font-size:12px; letter-spacing:.26em; color:#a89676; }
    .jn-key .ic { margin:14px auto 10px; width:104px; height:104px; display:grid; place-content:center; }
    .jn-key .ic img { width:100%; height:100%; object-fit:contain; opacity:1;
      filter:drop-shadow(0 0 26px rgba(240,201,107,.65)); }
    @keyframes jn-rise { 0%{opacity:0; transform:translateY(18px) scale(.7)} 100%{opacity:1; transform:none} }
    .jn-key .nm { font-size:24px; font-weight:700; color:#f0c96b;
      text-shadow:0 0 24px rgba(240,201,107,.55); }
    .jn-key .ln { font-size:15px; color:#e6dbc2; line-height:1.9; margin-top:12px; text-wrap:balance; }
    .jn-key .cnt { font-size:12.5px; color:#b8a888; margin-top:16px; letter-spacing:.08em; }
    @media (prefers-reduced-motion:reduce){ .jn-key, .jn-key .ic img { animation-duration:.01ms !important; } }`;
    document.head.appendChild(st);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  /* 이름 끝 글자에 받침이 있으면 '을', 없으면 '를'.
     "선사·초기국가 을(를)"처럼 나오면 문장이 통째로 어색해진다(boss.js와 같은 처리). */
  function objJosa(name){
    const ch = (name || '').trim().slice(-1);
    const code = ch.charCodeAt(0);
    if (!(code >= 0xAC00 && code <= 0xD7A3)) return '을';
    return (code - 0xAC00) % 28 ? '을' : '를';
  }

  function keyScene(e){
    css();
    const d = (window.Items && Items.DB[e.key]) || { name:e.key };
    const n = keysHeld().length;
    const ov = document.createElement('div');
    ov.className = 'jn-key';
    ov.innerHTML = '<div class="box">' +
      `<div class="era">${e.name}${objJosa(e.name)} 지나다</div>` +
      `<div class="ic"><img src="assets/items/${e.key}.png" alt=""></div>` +
      `<div class="nm">${d.name}</div>` +
      `<div class="ln">${e.line}</div>` +
      `<div class="cnt">시대의 열쇠 ${n} / ${ERAS.length}</div>` +
      '</div>';
    layer().appendChild(ov);
    if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
    if (navigator.vibrate) navigator.vibrate([40, 60, 90]);
    setTimeout(() => { ov.style.opacity = '0'; }, 5400);
    setTimeout(() => { ov.remove(); checkEnding(); }, 6000);
  }

  return { ERAS, eraOf, eraDone, allDone, progress, onChapterEnd, keyScene, _done: done };
})();
