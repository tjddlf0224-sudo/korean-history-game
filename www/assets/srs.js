/* ============ 오답 복습 (전 챕터 + 기출문제 공용) ============

   왜 만들었나
   - 지금은 틀린 문제가 그 자리에서 끝난다. 다시 만날 일이 없으니 틀린 채로
     남는다. 학습 게임에서 이건 가장 큰 구멍이다.
   - 보카 바리스타가 쓰는 라이트너 상자를 가져왔다. 틀린 문제를 상자에 넣고,
     맞힐 때마다 위 칸으로 올리며 **다시 만나기까지의 간격을 늘린다**.
     다섯 칸을 다 오르면 졸업.

   간격 (일 단위)
     1칸 바로 다음날 · 2칸 3일 · 3칸 7일 · 4칸 16일 · 5칸 졸업
   날짜로 재는 이유는 이 게임이 하루에 몰아서 하는 물건이 아니기 때문이다.
   같은 날 다시 풀어도 상자가 오르지 않게 해, 벼락치기로 졸업시킬 수 없다.

   무엇을 저장하나
   - 문제 전문이 아니라 **문제를 찾아갈 열쇠**(챕터·대화키·문항 번호)와
     문제 문구만 담는다. 문항 데이터가 고쳐져도 복습이 깨지지 않는다.

   쓰는 법
     Srs.miss(ref, q)     틀렸을 때
     Srs.hit(ref)         맞혔을 때 (상자가 오른다)
     Srs.due()            오늘 복습할 것들
     Srs.openReview()     복습 화면
*/
window.Srs = (function(){
  const KEY = 'khg_srs';
  const GAP = [0, 1, 3, 7, 16];      // 상자 1~4의 간격(일). 5는 졸업.
  const MAX_BOX = 5;

  const today = () => Math.floor(Date.now() / 86400000);   // 날짜 단위

  function load(){
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') return raw;
    } catch(e){}
    return { items: {} };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  /* ref는 이 문제를 다시 찾아가는 열쇠다. 사람이 읽을 수 있게 만든다. */
  function refOf(chapter, key, idx){ return `${chapter}|${key}|${idx}`; }

  /* ---------------- 틀렸을 때 ---------------- */
  function miss(ref, q){
    if (!ref) return;
    const s = load(), t = today();
    const it = s.items[ref] || { box: 1, q: '', made: t, miss: 0 };
    it.box = 1;                       // 틀리면 맨 아래 칸으로 되돌아간다
    it.due = t + GAP[1];
    it.miss = (it.miss || 0) + 1;
    if (q) it.q = String(q).slice(0, 90);
    s.items[ref] = it;
    save(s);
  }

  /* ---------------- 맞혔을 때 ----------------
     같은 날 다시 풀어도 오르지 않는다 — 벼락치기로 졸업시킬 수 없게. */
  function hit(ref){
    if (!ref) return null;
    const s = load(), t = today();
    const it = s.items[ref];
    if (!it) return null;
    if (it.last === t) return null;
    it.last = t;
    it.box = Math.min(MAX_BOX, (it.box || 1) + 1);
    if (it.box >= MAX_BOX){ delete s.items[ref]; save(s); return 'graduated'; }
    it.due = t + GAP[it.box];
    s.items[ref] = it;
    save(s);
    return it.box;
  }

  function all(){ const s = load(); return Object.entries(s.items).map(([ref, v]) => ({ ref, ...v })); }
  function due(){ const t = today(); return all().filter(x => (x.due || 0) <= t); }
  function count(){ return all().length; }

  /* ---------------- 복습 화면 ----------------
     문제를 다시 풀어 주지는 않는다. 어디에 있는 문제인지 알려 주고 그 화로
     보내 준다 — 문항 데이터가 챕터 안에 있어서, 여기서 복제하면 원본이
     바뀔 때 어긋난다. */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    #srs-ov { position:absolute; inset:0; z-index:93; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.88); font-family:"Gowun Batang",serif; }
    #srs-ov.show { display:flex; }
    #srs-ov .panel { width:min(92%,540px); max-height:86%; display:flex; flex-direction:column;
      background:#1a140c; border:1px solid #4a3c26; border-radius:16px; padding:17px; }
    #srs-ov h3 { margin:0 0 3px; font-size:17px; color:#f0c96b; text-align:center; }
    #srs-ov .sub { text-align:center; font-size:12px; color:#b8a888; margin-bottom:13px; }
    #srs-ov .list { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:7px; }
    #srs-ov .row { display:flex; gap:10px; align-items:flex-start; background:#241c12;
      border:1px solid #3a2c1a; border-radius:10px; padding:10px 12px; }
    #srs-ov .row.due { border-color:#c9a24a; }
    #srs-ov .box { flex:none; width:26px; height:26px; border-radius:7px; display:grid;
      place-content:center; font-size:11.5px; font-weight:700; color:#1a140c; background:#6a5a3c; }
    #srs-ov .row.due .box { background:#f0c96b; }
    #srs-ov .txt { flex:1; min-width:0; }
    #srs-ov .q { font-size:13px; color:#f5ecd8; line-height:1.55; }
    #srs-ov .meta { font-size:11px; color:#8d7f66; margin-top:3px; }
    #srs-ov .go { flex:none; background:#2a2013; border:1px solid #4a3c26; color:#c9a24a;
      border-radius:8px; padding:5px 10px; font-family:inherit; font-size:11.5px; cursor:pointer; }
    #srs-ov .empty { text-align:center; color:#8d7f66; font-size:13.5px; padding:26px 0; line-height:1.8; }
    #srs-ov .close { display:block; width:100%; margin-top:13px; background:#2a2013;
      border:1px solid #4a3c26; color:#f5ecd8; border-radius:11px; padding:11px;
      font-family:inherit; font-size:14px; cursor:pointer; flex:none; }`;
    document.head.appendChild(st);
  }
  function layer(){ return document.getElementById('wrap') || document.body; }

  const CH_NAME = {
    'seonsa1.html':'선사 1화','godae1.html':'고대 1화','gaya.html':'고대 2화',
    'tongil.html':'고대 3화','godae2.html':'고대 4화','godae3.html':'고대 5화',
    'goryeo1.html':'고려 1화','goryeo2.html':'고려 2화','byeokrando.html':'고려 3화',
    'goryeo3.html':'고려 4화','ch0.html':'0화','ch1.html':'1화','ch2.html':'2화',
    'ch2b.html':'3화','ch3.html':'4화','ch4.html':'5화','ch5.html':'6화',
    'ch5b.html':'7화','ch6.html':'8화','imjin.html':'후기 1화','imjin2.html':'후기 2화',
    'hugi1.html':'후기 3화','hugi2.html':'후기 4화','hugi3.html':'후기 5화',
    'gaehang1.html':'개항 1화','gaehang_ch2.html':'개항 2화','gaehang_ch3.html':'개항 3화',
    'gaehang4.html':'개항 4화','gaehang5.html':'개항 5화','ilje1.html':'일제 1화',
    'ilje2.html':'일제 2화','ilje_ch7.html':'일제 7화','hyeondae1.html':'현대 1화',
    'hyeondae2.html':'현대 2화','hyeondae3.html':'현대 3화','sesi.html':'시대통합',
    'exam_practice.html':'기출문제',
  };

  function mount(){
    css();
    if (document.getElementById('srs-ov')) return;
    const d = document.createElement('div');
    d.id = 'srs-ov';
    d.innerHTML = '<div class="panel"><h3>오답 복습</h3>' +
      '<div class="sub" id="srs-sub"></div>' +
      '<div class="list" id="srs-list"></div>' +
      '<button class="close" id="srs-close">닫기</button></div>';
    layer().appendChild(d);
    d.querySelector('#srs-close').onclick = () => d.classList.remove('show');
    d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
  }

  function openReview(){
    mount();
    const t = today();
    const list = all().sort((a, b) => (a.due || 0) - (b.due || 0));
    const dueN = list.filter(x => (x.due || 0) <= t).length;
    document.getElementById('srs-sub').textContent =
      list.length ? `${list.length}문항 · 오늘 볼 것 ${dueN}` : '';
    const el = document.getElementById('srs-list');
    if (!list.length){
      el.innerHTML = '<div class="empty">틀린 문제가 없습니다.<br>' +
        '<span style="font-size:12px">틀린 문제는 여기 쌓여, 날이 지날수록<br>' +
        '간격을 두고 다시 나옵니다.</span></div>';
    } else {
      el.innerHTML = list.map(x => {
        const [ch, , ] = x.ref.split('|');
        const isDue = (x.due || 0) <= t;
        const left = (x.due || 0) - t;
        return `<div class="row${isDue ? ' due' : ''}">` +
          `<div class="box">${x.box || 1}칸</div>` +
          `<div class="txt"><div class="q">${x.q || '(문항)'}</div>` +
          `<div class="meta">${CH_NAME[ch] || ch}` +
          (isDue ? ' · <b style="color:#f0c96b">오늘 복습</b>' : ` · ${left}일 뒤`) +
          (x.miss > 1 ? ` · ${x.miss}번 틀림` : '') + '</div></div>' +
          `<button class="go" data-ch="${ch}">가기</button></div>`;
      }).join('');
      el.querySelectorAll('.go').forEach(b => {
        b.onclick = () => { location.href = b.dataset.ch; };
      });
    }
    document.getElementById('srs-ov').classList.add('show');
  }

  return { miss, hit, due, all, count, refOf, openReview, mount, _load: load };
})();
