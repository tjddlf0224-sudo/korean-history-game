/* ============ 챕터 잠금 — 앞 화를 마쳐야 다음 화가 열린다 ============

   왜 (2026-09-19, 성일님)
   - "모든 챕터 열지 말고, 선사시대 빼고 잠궈. 선사시대 챕터 완료하면 다음 챕터
     열게 해줘. 잠겨 있는 챕터 열고 싶으면 광고 보면 어디든 열 수 있게 해줘."

   규칙
   - 선사·초기국가(선사 1화)와 시대 통합(열두 달 세시풍속)은 처음부터 열려 있다.
   - 나머지는 **챕터 목록 순서(ORDER)대로** 바로 앞 화를 끝까지 마치면 열린다.
     '마쳤다'는 챕터가 끝날 때 이미 남기는 배지 ch_complete_<파일>로 판단한다
     (따로 기록을 만들면 두 곳이 어긋난다).
   - 보상형 광고를 끝까지 보면 **어느 챕터든** 하나가 영구히 열린다.
   - 이미 하던 사람은 손해 보지 않게, 이 장치가 처음 돌 때 마친 챕터·그다음 화·
     마지막으로 하던 챕터를 열어 둔다(khg_unlock 이 아직 없을 때 한 번).
   - 기출변형·복습·미니게임은 잠그지 않는다 — 챕터(이야기)만 잠근다.

   기록: localStorage khg_unlock = { v:1, open:[파일, ...] } — khg_로 시작하므로
   클라우드 저장(save.js)이 계정에 같이 싣는다.

   붙이는 곳
   - index.html: 카드에 자물쇠를 달고, 누르면 광고로 열기를 묻는다.
   - 각 챕터 파일 <head>: 잠긴 챕터에 주소로 바로 들어오면(이달의 시대 띠,
     다음 화 단추, 즐겨찾기 등) 목록으로 돌려보내며 여는 방법을 묻는다.
   ORDER는 index.html의 ERAS 카드 순서와 같아야 한다(check_all.py가 대조).
*/
window.ChapterLock = (function(){
  const KEY = 'khg_unlock';
  const ORDER = [
    'seonsa1.html',
    'godae1.html', 'gaya.html', 'tongil.html', 'godae2.html', 'godae3.html',
    'goryeo1.html', 'goryeo2.html', 'byeokrando.html', 'goryeo3.html',
    'ch0.html', 'ch1.html', 'ch2.html', 'ch2b.html', 'ch3.html', 'ch4.html', 'ch5.html', 'ch5b.html', 'ch6.html',
    'imjin.html', 'imjin2.html', 'hugi1.html', 'hugi2.html', 'hugi3.html',
    'gaehang1.html', 'gaehang_ch2.html', 'gaehang_ch3.html', 'gaehang4.html', 'gaehang5.html',
    'ilje1.html', 'ilje2.html', 'ilje_ch7.html',
    'hyeondae1.html', 'hyeondae2.html', 'hyeondae3.html',
    'sesi.html',
  ];
  /* 처음부터 늘 열려 있는 화. 선사 1화는 시작점이라, 세시풍속은 앞 화를 마쳐야
     열리는 줄거리 순서가 아니라 해마다 도는 시대 통합이라 열어 둔다(2026-09-21 성일님). */
  const ALWAYS = new Set(['seonsa1.html', 'sesi.html']);

  function badges(){
    try { return JSON.parse(localStorage.getItem('khg_badges') || '{}') || {}; } catch(e){ return {}; }
  }
  function done(href, b){ return !!(b || badges())['ch_complete_' + href]; }

  function load(){
    let v = null;
    try { v = JSON.parse(localStorage.getItem(KEY)); } catch(e){}
    if (v && Array.isArray(v.open)) return v;
    // 처음 — 이미 하던 기록을 살려 연다
    const b = badges(), open = [];
    ORDER.forEach((h, i) => {
      if (done(h, b)){ open.push(h); if (ORDER[i + 1]) open.push(ORDER[i + 1]); }
    });
    try { const last = localStorage.getItem('khg_lastChapter'); if (last && ORDER.includes(last)) open.push(last); } catch(e){}
    v = { v: 1, open: [...new Set(open)] };
    save(v);
    return v;
  }
  function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }

  function isOpen(href){
    href = String(href || '').split('/').pop().split('?')[0].split('#')[0];
    const i = ORDER.indexOf(href);
    if (i < 0) return true;                     // 목록에 없는 쪽(기출·프롤로그 등)은 안 잠근다
    if (ALWAYS.has(href)) return true;
    const b = badges();
    if (done(href, b)) return true;
    if (i > 0 && done(ORDER[i - 1], b)) return true;
    return load().open.includes(href);
  }
  function unlock(href){
    const v = load();
    if (!v.open.includes(href)){ v.open.push(href); save(v); }
  }
  /* 무엇을 마치면 열리나 — 안내 문구용 */
  function prevOf(href){ const i = ORDER.indexOf(href); return i > 0 ? ORDER[i - 1] : null; }

  /* 광고를 보고 연다. 열었으면 true */
  async function askUnlock(href, label, prevLabel){
    const msg = '<b>' + (label || '이 챕터') + '</b>는 아직 잠겨 있습니다.<br>' +
      (prevLabel ? '앞 화 <b>' + prevLabel + '</b>를 마치면 열립니다.<br>' : '') +
      '<br>광고를 끝까지 보면 지금 바로 열 수 있습니다.';
    const yes = (window.Ask && Ask.confirm)
      ? await Ask.confirm(msg, { ok: '광고 보고 열기', cancel: '나중에' })
      : window.confirm(msg.replace(/<[^>]+>/g, ''));
    if (!yes) return false;
    let ok = false;
    // 웹에는 광고가 없다 — 위의 확인으로 대신한다(Ads.rewarded의 웹 대체 창까지 두 번 묻지 않게)
    try { ok = (window.Ads && Ads.isNative && Ads.isNative()) ? await Ads.rewarded() : true; } catch(e){ ok = false; }
    if (!ok){
      if (window.Ask && Ask.confirm) await Ask.confirm('광고를 끝까지 보지 않아 열리지 않았습니다.<br>다시 시도해 주세요.', { ok: '확인', cancel: false });
      return false;
    }
    unlock(href);
    return true;
  }

  /* 챕터 파일에서: 잠겨 있으면 목록으로 돌려보낸다(목록이 여는 방법을 묻는다).
     기력 입장료도 여기서 받는다 — 목록에서 들어오든 '다음 화' 단추로 들어오든
     주소를 직접 치든 한 곳을 지나게 하려는 것이다. energy.js가 이 파일보다
     먼저 실려 있어야 한다(챕터 <head> 차례: chapterlock → energy → guard()). */
  function guard(){
    try {
      const me = location.pathname.split('/').pop();
      if (!isOpen(me)){ location.replace('index.html#locked=' + encodeURIComponent(me)); return; }
      if (window.Energy && Energy.payEntry && !Energy.payEntry(me)){
        location.replace('index.html#needeng=' + encodeURIComponent(me));
      }
    } catch(e){}
  }

  return { ORDER, isOpen, unlock, askUnlock, prevOf, guard };
})();
