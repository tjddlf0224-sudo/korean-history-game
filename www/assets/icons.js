/* ============ 속보·연표용 컬러 아이콘 (전 챕터 공용) ============

   왜 만들었나
   - 속보에 이모지를 쓰고 있었다. 이모지는 기기마다 그림이 달라(애플·안드로이드·
     윈도가 전부 다르다) 게임의 수채화 톤과 따로 논다.
   - 그렇다고 흑백 선 아이콘으로 바꾸면 속보의 생기가 사라진다. 그래서
     **게임 팔레트로 칠한 컬러 아이콘**을 직접 그렸다.

   팔레트는 게임이 이미 쓰는 색에서 가져왔다
     금 #d2a54c · 주칠 #a8412f · 청 #35708c · 옥 #4d8a73
     먹 #3a3126 · 한지 #e8dcc2 · 흙 #8a6b3d

   의미가 겹치는 이모지는 하나로 묶었다(📜📄📃📝📋 → 문서).
   50종을 32종으로 줄여도 뜻이 흐려지지 않는다.

   쓰는 법
     Icons.svg('sword', 30)   // 30px 크기의 SVG 문자열
     Icons.has('sword')
*/
window.Icons = (function(){

  const C = {
    gold:'#d2a54c', gold2:'#8a6b28', red:'#a8412f', red2:'#6e2a1d',
    blue:'#35708c', jade:'#4d8a73', ink:'#3a3126', paper:'#e8dcc2',
    earth:'#8a6b3d', wood:'#7a5a34', stone:'#9a958c', white:'#f2ecdd',
    dark:'#241c12',
  };

  /* 각 아이콘은 24×24 좌표계. 면(fill)으로 그려 이모지처럼 알록달록하되,
     외곽선을 먹색으로 둘러 게임의 손그림 느낌과 붙게 했다. */
  const P = {
    /* ── 무기·전쟁 ── */
    sword: `<path d="M11 3h2l.6 10.5-1.6 1.6-1.6-1.6z" fill="${C.stone}"/>
      <path d="M8.6 14.6h6.8v1.8H8.6z" fill="${C.gold}"/>
      <path d="M11.2 16.4h1.6V21h-1.6z" fill="${C.wood}"/>`,
    shield: `<path d="M12 3l7 2.6v6.2c0 4.3-2.9 7.2-7 8.6-4.1-1.4-7-4.3-7-8.6V5.6z" fill="${C.blue}"/>
      <path d="M12 5.6l4.8 1.8v4.4c0 2.9-2 4.9-4.8 5.9-2.8-1-4.8-3-4.8-5.9V7.4z" fill="${C.gold}" opacity=".55"/>`,
    boom: `<path d="M12 2l2.3 5.2L20 5l-2.4 5.4L23 12l-5.4 1.6L20 19l-5.7-2.2L12 22l-2.3-5.2L4 19l2.4-5.4L1 12l5.4-1.6L4 5l5.7 2.2z" fill="${C.red}"/>
      <circle cx="12" cy="12" r="3.4" fill="${C.gold}"/>`,
    blood: `<path d="M12 3c3.2 4.6 5.4 7.4 5.4 10.3A5.4 5.4 0 016.6 13.3C6.6 10.4 8.8 7.6 12 3z" fill="${C.red}"/>
      <path d="M10 12.5c-.4 1.4.2 2.6 1.3 3.2" stroke="${C.white}" stroke-width="1.3" fill="none" opacity=".7"/>`,
    fire: `<path d="M12.6 2c1.4 3.2-2.8 4.6-2.8 8.4a2.9 2.9 0 005.7 0c0-.8-.2-1.4-.2-1.4 2.6 2 4 4.9 4 7.8a7.3 7.3 0 01-14.6 0C4.7 9.9 8.4 7.4 12.6 2z" fill="${C.red}"/>
      <path d="M12 12c1.4 1.6 2.2 3 2.2 4.4a2.2 2.2 0 11-4.4 0c0-1.4.8-2.8 2.2-4.4z" fill="${C.gold}"/>`,
    chain: `<rect x="3" y="9.5" width="7.5" height="5" rx="2.5" fill="none" stroke="${C.stone}" stroke-width="2"/>
      <rect x="13.5" y="9.5" width="7.5" height="5" rx="2.5" fill="none" stroke="${C.stone}" stroke-width="2"/>
      <rect x="9.5" y="10.8" width="5" height="2.4" fill="${C.ink}"/>`,
    horse: `<path d="M4 19c0-4 1.6-6.6 4.4-8L9 6.6l2.6-2.2 1 2.4 3.6.6c2.4.4 3.8 2.3 3.8 4.6 0 1.6-.7 2.8-2 3.6l.6 3.4h-2.4l-.6-2.6c-.9.3-1.8.4-2.8.4l-.8 2.2H9.6l.4-2.6C8 15.4 7 17 7 19z" fill="${C.earth}"/>
      <circle cx="15.2" cy="8.6" r=".9" fill="${C.ink}"/>`,
    /* ── 나라·건물 ── */
    palace: `<path d="M2.5 8.5L12 4l9.5 4.5-1 1.6H3.5z" fill="${C.red}"/>
      <rect x="4.5" y="10.6" width="15" height="7.4" fill="${C.wood}"/>
      <path d="M2.5 18h19l-1 2.6H3.5z" fill="${C.stone}"/>
      <rect x="10.4" y="12.4" width="3.2" height="5.6" fill="${C.dark}"/>`,
    hall: `<path d="M2.5 9L12 3.6 21.5 9v1.6h-19z" fill="${C.blue}"/>
      <rect x="4.6" y="10.6" width="2.2" height="7" fill="${C.paper}"/>
      <rect x="10.9" y="10.6" width="2.2" height="7" fill="${C.paper}"/>
      <rect x="17.2" y="10.6" width="2.2" height="7" fill="${C.paper}"/>
      <path d="M2.5 17.6h19V20h-19z" fill="${C.stone}"/>`,
    school: `<rect x="3.5" y="9" width="17" height="10.5" fill="${C.wood}"/>
      <path d="M2 9.4L12 4l10 5.4-.8 1.5H2.8z" fill="${C.jade}"/>
      <rect x="9.6" y="13" width="4.8" height="6.5" fill="${C.dark}"/>
      <rect x="5.4" y="12.4" width="2.6" height="2.6" fill="${C.paper}"/>
      <rect x="16" y="12.4" width="2.6" height="2.6" fill="${C.paper}"/>`,
    mountain: `<path d="M1.5 19.5L8 7l4.2 7.4L14.6 10l7.9 9.5z" fill="${C.jade}"/>
      <path d="M8 7l3 5.4H5z" fill="${C.paper}"/>
      <path d="M14.6 10l2.6 3.2h-5z" fill="${C.paper}" opacity=".8"/>`,
    island: `<path d="M2 18.5c3.5-1.6 6-1.6 9.5 0s6.5 1.6 10 0v3H2z" fill="${C.blue}"/>
      <path d="M6 18.5c1-4 3-6 6-6s5 2 6 6z" fill="${C.earth}"/>
      <path d="M12 12.5V7" stroke="${C.wood}" stroke-width="1.6"/>
      <path d="M12 7c-2.4-1.6-4-1.2-4.6.4 1.8.2 3.2.6 4.6 1.4 1.4-.8 2.8-1.2 4.6-1.4C16 5.8 14.4 5.4 12 7z" fill="${C.jade}"/>`,
    /* ── 바다 ── */
    ship: `<path d="M3 16h18l-2.4 4.4H5.4z" fill="${C.wood}"/>
      <rect x="11.2" y="3" width="1.6" height="13" fill="${C.ink}"/>
      <path d="M12.8 4.4l6 5.6h-6z" fill="${C.paper}"/>
      <path d="M11.2 6l-5 4h5z" fill="${C.gold}"/>`,
    anchor: `<circle cx="12" cy="4.6" r="2.2" fill="none" stroke="${C.stone}" stroke-width="2"/>
      <rect x="11" y="6.6" width="2" height="13" fill="${C.stone}"/>
      <rect x="7.6" y="8.4" width="8.8" height="2" fill="${C.stone}"/>
      <path d="M4.4 13.5c0 4 3.4 6.4 7.6 6.4s7.6-2.4 7.6-6.4" fill="none" stroke="${C.stone}" stroke-width="2"/>`,
    wave: `<path d="M1.5 12.5c2.6-3 5.2-3 7.8 0s5.2 3 7.8 0 3.8-1.8 5.4-.6v8.6h-21z" fill="${C.blue}"/>
      <path d="M1.5 16c2.6-2.6 5.2-2.6 7.8 0s5.2 2.6 7.8 0 3.8-1.4 5.4-.4" fill="none" stroke="${C.paper}" stroke-width="1.4" opacity=".55"/>`,
    /* ── 문서·책 ── */
    scroll: `<path d="M5 4.5h14v15H5z" fill="${C.paper}"/>
      <rect x="3.2" y="3" width="3" height="18" rx="1.5" fill="${C.wood}"/>
      <rect x="17.8" y="3" width="3" height="18" rx="1.5" fill="${C.wood}"/>
      <path d="M8 8.5h8M8 12h8M8 15.5h5" stroke="${C.ink}" stroke-width="1.2" opacity=".55"/>`,
    book: `<path d="M3.5 4.8h7.6v15H3.5z" fill="${C.blue}"/>
      <path d="M12.9 4.8h7.6v15h-7.6z" fill="${C.jade}"/>
      <rect x="10.9" y="4" width="2.2" height="16.6" rx=".6" fill="${C.wood}"/>
      <path d="M5.6 8.4h3.4M5.6 11.4h3.4M15 8.4h3.4M15 11.4h3.4" stroke="${C.paper}" stroke-width="1.1" opacity=".8"/>`,
    books: `<rect x="3" y="7" width="4.4" height="13" rx=".7" fill="${C.red}"/>
      <rect x="8" y="4.6" width="4.4" height="15.4" rx=".7" fill="${C.blue}"/>
      <rect x="13" y="8.4" width="4.4" height="11.6" rx=".7" fill="${C.jade}"/>
      <rect x="17.6" y="10" width="3.6" height="10" rx=".7" fill="${C.gold}"/>`,
    paper: `<path d="M5 3h11l3.5 3.5V21H5z" fill="${C.paper}"/>
      <path d="M16 3l3.5 3.5H16z" fill="${C.stone}"/>
      <path d="M8 9h8M8 12.4h8M8 15.8h5.5" stroke="${C.ink}" stroke-width="1.2" opacity=".5"/>`,
    news: `<rect x="2.5" y="5" width="19" height="14.5" rx="1" fill="${C.paper}"/>
      <rect x="4.6" y="7.2" width="7.4" height="5" fill="${C.stone}" opacity=".6"/>
      <path d="M13.4 7.6h5.8M13.4 10h5.8M4.6 14.4h14.6M4.6 16.8h10" stroke="${C.ink}" stroke-width="1.1" opacity=".55"/>`,
    brush: `<rect x="15.5" y="2.4" width="2.6" height="10" rx="1" transform="rotate(35 16.8 7.4)" fill="${C.wood}"/>
      <path d="M9.6 12.6l3.4 2.4-2.6 3.6c-.8 1.2-2.6 1.4-3.6.4s-.8-2.8.4-3.6z" fill="${C.ink}"/>`,
    /* ── 인장·왕권 ── */
    crown: `<path d="M3.5 17.5L2 7l5.2 3.6L12 4l4.8 6.6L22 7l-1.5 10.5z" fill="${C.gold}"/>
      <rect x="3.5" y="18.4" width="17" height="2.4" rx=".7" fill="${C.gold2}"/>
      <circle cx="12" cy="12" r="1.4" fill="${C.red}"/>`,
    seal: `<rect x="5.5" y="9" width="13" height="11" rx="1" fill="${C.gold}"/>
      <rect x="7.4" y="11.4" width="9.2" height="6.4" fill="${C.red}"/>
      <path d="M8.6 4.6c1.6-1.6 5.2-1.6 6.8 0 1.2 1.2 1 3-.4 4.4H9c-1.4-1.4-1.6-3.2-.4-4.4z" fill="${C.gold2}"/>`,
    coin: `<circle cx="12" cy="12" r="8.6" fill="${C.gold}"/>
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="${C.gold2}" stroke-width="1.1"/>
      <rect x="9.4" y="9.4" width="5.2" height="5.2" fill="${C.dark}"/>`,
    /* ── 생활·문화 ── */
    rice: `<path d="M12 21V9" stroke="${C.jade}" stroke-width="1.8"/>
      <path d="M12 10c0-3 2.6-4.4 5-4.4-.8 3-2.2 5-5 5z" fill="${C.gold}"/>
      <path d="M12 14c0-3-2.6-4.4-5-4.4.8 3 2.2 5 5 5z" fill="${C.gold}"/>
      <path d="M12 18c0-2.6 2.2-3.8 4.2-3.8-.8 2.6-1.6 4.2-4.2 4.2z" fill="${C.gold}" opacity=".8"/>`,
    pot: `<path d="M8.4 5.6h7.2l-.6 2.2c2 1.2 3.2 3.2 3.2 5.6 0 3.6-2.8 6.4-6.2 6.4S5.8 17 5.8 13.4c0-2.4 1.2-4.4 3.2-5.6z" fill="${C.earth}"/>
      <path d="M7.4 12.4h9.2" stroke="${C.ink}" stroke-width="1.1" opacity=".45"/>
      <path d="M8 15.4h8" stroke="${C.ink}" stroke-width="1.1" opacity=".45"/>`,
    stone: `<path d="M4.4 14.4L7 6.4l6.6-2.2 6 5-1.4 8-7.4 2.6z" fill="${C.stone}"/>
      <path d="M7 6.4l6.6 3.6-1.4 8" fill="none" stroke="${C.ink}" stroke-width="1.1" opacity=".4"/>`,
    buddha: `<circle cx="12" cy="8" r="3.6" fill="${C.gold}"/>
      <path d="M5.4 20c0-3.6 2.9-6.4 6.6-6.4s6.6 2.8 6.6 6.4z" fill="${C.gold}"/>
      <circle cx="12" cy="8" r="6.2" fill="none" stroke="${C.gold2}" stroke-width="1.1" opacity=".7"/>`,
    music: `<path d="M9.4 17.4V5l9-1.6v11.2" fill="none" stroke="${C.wood}" stroke-width="1.8"/>
      <ellipse cx="7" cy="17.6" rx="3" ry="2.4" fill="${C.red}"/>
      <ellipse cx="16" cy="15.6" rx="3" ry="2.4" fill="${C.red}"/>`,
    bamboo: `<rect x="8.4" y="2.6" width="3.4" height="18.8" rx="1" fill="${C.jade}"/>
      <path d="M8.4 8h3.4M8.4 13h3.4M8.4 18h3.4" stroke="${C.ink}" stroke-width="1.1" opacity=".45"/>
      <path d="M11.8 7c2.6-1.6 4.6-1.4 6 .6-2 1-4 1-6 0z" fill="${C.jade}"/>
      <path d="M11.8 14c2.6-1.6 4.6-1.4 6 .6-2 1-4 1-6 0z" fill="${C.jade}"/>`,
    clock: `<circle cx="12" cy="12" r="8.6" fill="${C.paper}"/>
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="${C.wood}" stroke-width="1.8"/>
      <path d="M12 6.8V12l3.6 2.4" fill="none" stroke="${C.ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    rain: `<path d="M6.6 12.4a4.6 4.6 0 01.6-9.1 5.6 5.6 0 0110.6 1.4 3.9 3.9 0 01-.6 7.7z" fill="${C.stone}"/>
      <path d="M8 15.4l-1.4 3.8M12 15.4L10.6 19.2M16 15.4l-1.4 3.8" stroke="${C.blue}" stroke-width="1.8" stroke-linecap="round"/>`,
    snow: `<path d="M12 2.6v18.8M4 7.2l16 9.6M20 7.2L4 16.8" stroke="${C.blue}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M12 6l-2 2 2 2 2-2z" fill="${C.white}"/>`,
    /* ── 사람·뜻 ── */
    fist: `<path d="M6.4 10.4V7.2a1.7 1.7 0 013.4 0v3.2M9.8 10V6.2a1.7 1.7 0 013.4 0V10M13.2 10.4V7.6a1.7 1.7 0 013.4 0V13" fill="${C.earth}" stroke="${C.earth}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M16.6 11.4a1.7 1.7 0 013.4 0V15c0 3.6-2.6 6.6-6.6 6.6h-1.2c-2.8 0-4.4-1.4-5.8-3.2l-2.2-2.9a1.6 1.6 0 012.3-2.3l2 1.6" fill="${C.earth}" stroke="${C.earth}" stroke-width="1.6" stroke-linejoin="round"/>`,
    dove: `<path d="M2.5 13.5c3-4.5 7-6 11-5.5l4-3.5.5 4 4 1.5-4 2c-.5 5-4.5 8.5-9 8.5-2 0-3.5-.5-4.5-1.5 2.5-.5 4-2 4.5-4-3 .5-5-.5-6.5-1.5z" fill="${C.white}"/>
      <circle cx="15.4" cy="7.6" r=".9" fill="${C.ink}"/>`,
    hands: `<path d="M2.5 12.5l4-3.5 5 3 5-3 5 3.5-4.5 6h-10z" fill="${C.earth}"/>
      <path d="M11.5 12l1 3 1-3" fill="none" stroke="${C.paper}" stroke-width="1.3"/>`,
    speak: `<path d="M3 5.5h18v11H12l-5 4v-4H3z" fill="${C.paper}"/>
      <path d="M7 9.4h10M7 12.6h6.4" stroke="${C.ink}" stroke-width="1.3" opacity=".55"/>`,
    horn: `<path d="M3.5 10v4h3l10 5V5L6.5 10z" fill="${C.gold}"/>
      <path d="M19 8.5c1.6 1.5 1.6 5.5 0 7" fill="none" stroke="${C.gold2}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M9 19v2a1.6 1.6 0 003.2 0v-1" fill="none" stroke="${C.wood}" stroke-width="1.7"/>`,
    scale: `<path d="M12 3.5v17M6 20.5h12" stroke="${C.wood}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M4 7.5h16" stroke="${C.wood}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M4 7.5L1.8 12.5a2.4 2.4 0 004.4 0z" fill="${C.gold}"/>
      <path d="M20 7.5l2.2 5a2.4 2.4 0 01-4.4 0z" fill="${C.gold}"/>`,
    candle: `<rect x="9.6" y="9" width="4.8" height="11" rx=".8" fill="${C.paper}"/>
      <path d="M12 3.4c1.8 2.2 2.6 3.6 2.6 4.8a2.6 2.6 0 01-5.2 0c0-1.2.8-2.6 2.6-4.8z" fill="${C.gold}"/>
      <rect x="7.6" y="19.4" width="8.8" height="1.8" rx=".7" fill="${C.wood}"/>`,
    medal: `<circle cx="12" cy="14.6" r="6" fill="${C.gold}"/>
      <circle cx="12" cy="14.6" r="3.4" fill="none" stroke="${C.gold2}" stroke-width="1.2"/>
      <path d="M8 2.6l2.6 6M16 2.6l-2.6 6" stroke="${C.red}" stroke-width="2.4"/>`,
    party: `<path d="M3 20.5l5.5-13 8 8z" fill="${C.gold}"/>
      <circle cx="17.6" cy="5.4" r="1.4" fill="${C.red}"/>
      <circle cx="20.4" cy="10.4" r="1.2" fill="${C.blue}"/>
      <circle cx="13.6" cy="3" r="1.2" fill="${C.jade}"/>`,
    thread: `<ellipse cx="12" cy="12" rx="6.4" ry="8" fill="${C.paper}"/>
      <path d="M7.4 6.4c3 2.4 6.2 6.6 8.2 11.2M6.2 10c3 1.6 6.2 5 8.4 8.6M9.8 4.6c2.4 2.6 5 6.6 6.8 10.4"
        stroke="${C.red}" stroke-width="1.2" fill="none" opacity=".75"/>`,
    taegeuk: `<circle cx="12" cy="12" r="8.6" fill="${C.paper}"/>
      <path d="M12 3.4a4.3 4.3 0 000 8.6 4.3 4.3 0 010 8.6 8.6 8.6 0 000-17.2z" fill="${C.blue}"/>
      <path d="M12 3.4a4.3 4.3 0 010 8.6 4.3 4.3 0 000 8.6 8.6 8.6 0 010-17.2z" fill="${C.red}"/>`,
    yinyang: `<circle cx="12" cy="12" r="8.6" fill="${C.paper}"/>
      <path d="M12 3.4a4.3 4.3 0 000 8.6 4.3 4.3 0 010 8.6 8.6 8.6 0 000-17.2z" fill="${C.ink}"/>
      <circle cx="12" cy="7.7" r="1.2" fill="${C.paper}"/>
      <circle cx="12" cy="16.3" r="1.2" fill="${C.ink}"/>`,
    tear: `<circle cx="12" cy="11" r="8" fill="${C.gold}" opacity=".85"/>
      <circle cx="9.2" cy="9.6" r=".9" fill="${C.ink}"/>
      <circle cx="14.8" cy="9.6" r=".9" fill="${C.ink}"/>
      <path d="M8.6 15.6c1.8-1.4 5-1.4 6.8 0" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M9 11.4c-.4 2 .2 3.4 1 4.4" stroke="${C.blue}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    hammer: `<path d="M3.5 19.5l8-8 1.6 1.6-8 8z" fill="${C.wood}"/>
      <path d="M11 6.4l5-3.4 5.4 5-3.4 5-3.6-3.6-3.4-3z" fill="${C.stone}"/>`,
    /* 기본값 */
    dot: `<circle cx="12" cy="12" r="7" fill="${C.gold}"/>`,
  };

  /* 이모지 → 아이콘 이름. 뜻이 겹치는 것은 하나로 묶었다. */
  const FROM_EMOJI = {
    '⚔️':'sword', '🗡️':'sword', '🛡️':'shield', '💥':'boom', '🩸':'blood',
    '🔥':'fire', '⛓️':'chain', '🐎':'horse', '⚒️':'hammer',
    '🏯':'palace', '🏛️':'hall', '🏫':'school', '🏔️':'mountain', '🏝️':'island',
    '⛵':'ship', '⚓':'anchor', '🌊':'wave', '💨':'wave',
    '📜':'scroll', '📃':'scroll', '📄':'paper', '📋':'paper', '📝':'brush',
    '📖':'book', '📕':'book', '📗':'book', '📘':'book', '📙':'book', '📔':'book',
    '📚':'books', '📰':'news', '🖼️':'paper',
    '👑':'crown', '🪙':'coin', '💰':'coin', '🔴':'seal',
    '🌾':'rice', '🏺':'pot', '⚱️':'pot', '🪨':'stone', '🗿':'stone',
    '☸️':'buddha', '🎵':'music', '🎋':'bamboo', '🎍':'bamboo',
    '⏳':'clock', '🕰️':'clock', '🌧️':'rain', '❄️':'snow',
    '✊':'fist', '🕊️':'dove', '🤝':'hands', '🗣️':'speak', '📢':'horn',
    '⚖️':'scale', '🕯️':'candle', '🏅':'medal', '🎉':'party', '🧵':'thread',
    '🇰🇷':'taegeuk', '☯️':'yinyang', '😢':'tear',
  };

  function has(name){ return !!P[name]; }

  /* 이모지가 들어와도 알아서 바꿔 준다 — 챕터 데이터를 한꺼번에 못 고쳐도
     화면에는 아이콘이 나오게 하려는 것. */
  function resolve(nameOrEmoji){
    if (!nameOrEmoji) return 'dot';
    if (P[nameOrEmoji]) return nameOrEmoji;
    return FROM_EMOJI[nameOrEmoji] || 'dot';
  }

  function svg(nameOrEmoji, size){
    const k = resolve(nameOrEmoji);
    const s = size || 28;
    return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" style="display:block">` +
           P[k] + '</svg>';
  }

  return { svg, has, resolve, COLORS: C, names: () => Object.keys(P) };
})();
