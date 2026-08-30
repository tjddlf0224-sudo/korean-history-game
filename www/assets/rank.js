/* ============ 신분·경험치 시스템 (전 챕터 + 기출문제 공용) ============
   badges.js·streak.js와 같은 패턴: localStorage에 저장하고 window.Rank로 노출.

   설계 의도
   - 시대별이 아니라 게임 전체를 관통하는 하나의 성장 축이다. 36화를 계속 하게
     만드는 장기 목표가 지금까지 없었다(스트릭은 하루 단위라 다른 축).
   - 찍기가 이득이 되면 안 되므로 오답은 0점, 첫 시도 정답에 가장 큰 점수를 준다.
     같은 36화를 깨도 꼼꼼히 푼 사람이 훨씬 빨리 올라간다.
   - 승급 연출은 실제 신분 상승 경로(군공·납속·속량, 잡과, 문과…)를 보여준다.
     보상 화면이 곧 기출 빈출 개념(면천·납속책·속량)을 깔아 주는 자리가 된다.

   ※ 마지막 단계(왕)만은 실제로 오를 수 있는 길이 없다. 세습이기 때문이다.
     그래서 그 카드에서는 그 사실 자체를 밝힌다 — 게임의 보상이 끝나는 자리에서
     신분제의 벽이라는 핵심 개념이 남게 하려는 의도다.
*/
window.Rank = (function(){
  const KEY = 'khg_rank';

  /* 신분 사다리. 각 단계는 레벨 5개 구간을 차지한다(1~5 노비 … 26~30 왕). */
  const TIERS = [
    { id:'nobi',    name:'노비',  minLv:1,
      path:'', // 시작 신분이라 승급 설명 없음
      note:'천인. 매매·상속의 대상이었고, 나라의 역(役)과 세(稅) 바깥에 있었다.' },
    { id:'yangin',  name:'양인',  minLv:6,
      path:'군공(軍功)을 세워 면천되었다.',
      note:'노비가 신분을 벗는 길은 군공·납속(納粟)·속량(贖良)뿐이었고, 그마저 드문 일이었다.' },
    { id:'jungin',  name:'중인',  minLv:11,
      path:'잡과(雜科)에 급제하였다.',
      note:'역관·의관·율관 같은 기술직. 실무를 쥐었으나 문과 관직의 길은 사실상 막혀 있었다.' },
    { id:'yangban', name:'양반',  minLv:16,
      path:'문과(文科)에 급제하였다.',
      note:'중인에서 양반으로 오르는 일은 극히 드물었다. 신분은 대체로 태어날 때 정해졌다.' },
    { id:'jaesang', name:'재상',  minLv:21,
      path:'여러 관직을 거쳐 정1품에 올랐다.',
      note:'의정부 정승. 과거로 시작한 사람이 오를 수 있는 가장 높은 자리였다.' },
    { id:'wang',    name:'왕',    minLv:26,
      path:'— 그리고 그대는 왕이 되었다.',
      note:'다만 실제 조선에서 이런 일은 없었다. 왕위는 세습이었고, 신분은 태어날 때 정해졌다. 그것이 이 시대의 가장 큰 벽이었다.' },
  ];

  const MAX_LV = 30;
  /* 레벨 n → n+1 에 필요한 경험치. 뒤로 갈수록 완만하게 늘어난다. */
  function needFor(lv){ return 100 + (lv - 1) * 20; }
  function totalToReach(lv){ let s = 0; for (let i = 1; i < lv; i++) s += needFor(i); return s; }

  function load(){
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object' && typeof raw.xp === 'number') return raw;
    } catch(e){}
    return { xp: 0 };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  function levelFromXp(xp){
    let lv = 1;
    while (lv < MAX_LV && xp >= totalToReach(lv + 1)) lv++;
    return lv;
  }
  function tierFor(lv){
    let t = TIERS[0];
    for (const x of TIERS) if (lv >= x.minLv) t = x;
    return t;
  }

  /* 현재 상태 — HUD가 쓰는 값들을 한 번에 준다. */
  function get(){
    const s = load();
    const lv = levelFromXp(s.xp);
    const base = totalToReach(lv);
    const need = lv >= MAX_LV ? 0 : needFor(lv);
    return {
      xp: s.xp, level: lv, maxLevel: MAX_LV,
      tier: tierFor(lv),
      intoLevel: s.xp - base,
      needForNext: need,
      ratio: need ? Math.min(1, (s.xp - base) / need) : 1,
    };
  }

  /* 경험치 획득. reason은 화면에 뜨는 짧은 설명(예: "첫 시도 정답").
     레벨/신분이 오르면 연출을 띄우고, 무엇이 올랐는지 돌려준다. */
  function addXp(amount, reason){
    amount = Math.max(0, Math.round(amount || 0));
    if (!amount) return null;
    const before = get();
    const s = load();
    s.xp += amount;
    save(s);
    const after = get();

    Effects.floatXp(amount, reason);
    Effects.pulseHud();

    const leveled = after.level > before.level;
    const promoted = after.tier.id !== before.tier.id;
    if (promoted)      setTimeout(() => Effects.promote(after.tier, after.level), 520);
    else if (leveled)  setTimeout(() => Effects.levelUp(after.level), 420);

    renderHud();
    return { leveled, promoted, from: before, to: after };
  }

  /* ---------------- HUD ----------------
     각 화면에 <div id="rank-hud"></div>만 두면 여기서 채운다. */
  function renderHud(){
    const el = document.getElementById('rank-hud');
    if (!el) return;
    const r = get();
    el.innerHTML =
      '<div class="rk-tier">' + r.tier.name + '</div>' +
      '<div class="rk-body">' +
        '<div class="rk-lv">Lv.' + r.level + '</div>' +
        '<div class="rk-bar"><i style="width:' + (r.ratio * 100).toFixed(1) + '%"></i></div>' +
      '</div>';
  }

  /* ---------------- 연출 ----------------
     스타일은 챕터들이 이미 쓰는 팡파레(금색 #f0c96b, 별 불티, 스프링 이징)에
     맞춘다. CSS는 이 모듈이 직접 주입해서 36개 파일에 복붙하지 않아도 되게 한다. */
  const Effects = (function(){
    let injected = false;
    function css(){
      if (injected) return; injected = true;
      const s = document.createElement('style');
      s.textContent = `
      #rank-hud { position:absolute; top:calc(6px + env(safe-area-inset-top));
        left:calc(10px + env(safe-area-inset-left)); z-index:24; pointer-events:none;
        display:flex; align-items:center; gap:7px; font-family:"Gowun Batang",serif;
        transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
      #rank-hud.rk-pulse { transform:scale(1.09); }
      #rank-hud .rk-tier { font-size:13px; font-weight:700; color:#f0c96b; padding:2px 9px;
        border-radius:999px; background:rgba(30,22,10,.72); border:1px solid rgba(240,201,107,.55);
        text-shadow:0 1px 3px rgba(0,0,0,.8); }
      #rank-hud .rk-body { display:flex; flex-direction:column; gap:2px; }
      #rank-hud .rk-lv { font-size:10px; color:#e8dcc2; text-shadow:0 1px 3px rgba(0,0,0,.8); line-height:1; }
      #rank-hud .rk-bar { width:74px; height:5px; border-radius:999px; background:rgba(0,0,0,.55);
        border:1px solid rgba(240,201,107,.3); overflow:hidden; }
      #rank-hud .rk-bar i { display:block; height:100%; border-radius:999px;
        background:linear-gradient(90deg,#c9962e,#f0c96b 60%,#fff3d0);
        transition:width .5s cubic-bezier(.2,.8,.3,1); position:relative; }
      #rank-hud .rk-bar i::after { content:''; position:absolute; inset:0;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);
        transform:translateX(-100%); animation:rk-shine 1.6s ease-in-out infinite; }
      @keyframes rk-shine { 0%{transform:translateX(-100%);} 60%,100%{transform:translateX(220%);} }

      /* 떠오르는 +XP */
      .rk-float { position:fixed; left:50%; top:38%; transform:translate(-50%,0); z-index:70;
        pointer-events:none; font-family:"Gowun Batang",serif; font-weight:700; text-align:center;
        color:#fff7e6; text-shadow:0 2px 10px rgba(0,0,0,.75), 0 0 18px rgba(240,201,107,.9);
        animation:rk-float 1.15s cubic-bezier(.2,.8,.3,1) forwards; }
      .rk-float .n { font-size:26px; display:block; }
      .rk-float .r { font-size:12px; color:#e8dcc2; opacity:.95; }
      @keyframes rk-float { 0%{opacity:0; transform:translate(-50%,14px) scale(.7);}
        20%{opacity:1; transform:translate(-50%,0) scale(1.12);}
        35%{transform:translate(-50%,0) scale(1);}
        100%{opacity:0; transform:translate(-50%,-52px) scale(1);} }

      /* 레벨업 */
      .rk-ov { position:fixed; inset:0; z-index:80; display:flex; align-items:center;
        justify-content:center; pointer-events:none; }
      .rk-lvup { position:relative; display:flex; align-items:center; justify-content:center; }
      .rk-lvup .ring { position:absolute; width:120px; height:120px; border-radius:50%;
        border:2px solid rgba(240,201,107,.9); animation:rk-ring .9s cubic-bezier(.2,.7,.3,1) forwards; }
      .rk-lvup .ring:nth-child(2){ animation-delay:.12s; }
      @keyframes rk-ring { 0%{transform:scale(.25); opacity:0;} 25%{opacity:1;}
        100%{transform:scale(2.3); opacity:0;} }
      .rk-lvup .txt { position:relative; z-index:1; font-family:"Gowun Batang",serif; font-weight:700;
        font-size:19px; color:#fff7e6; padding:11px 26px; border-radius:999px; white-space:nowrap;
        background:rgba(40,28,10,.62); border:1px solid rgba(240,201,107,.6);
        text-shadow:0 2px 8px rgba(0,0,0,.6), 0 0 16px rgba(240,201,107,.85);
        animation:rk-pop 1.25s cubic-bezier(.34,1.56,.64,1) forwards; }
      @keyframes rk-pop { 0%{opacity:0; transform:scale(.6) translateY(8px);}
        30%{opacity:1; transform:scale(1.1) translateY(0);}
        50%{transform:scale(1);} 80%{opacity:1;}
        100%{opacity:0; transform:scale(1) translateY(-12px);} }
      .rk-spark { position:absolute; width:8px; height:8px; background:#f0c96b; opacity:0;
        clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
        animation:rk-spark 1s cubic-bezier(.2,.7,.3,1) forwards; }
      @keyframes rk-spark { 0%{opacity:0; transform:rotate(var(--a)) translate(0,0) scale(.3);}
        15%{opacity:1;} 100%{opacity:0; transform:rotate(var(--a)) translate(96px,0) scale(1) rotate(200deg);} }

      /* 승급식 — 두루마리가 펼쳐지고 낙관이 찍힌다 */
      .rk-cer { position:fixed; inset:0; z-index:90; display:flex; align-items:center;
        justify-content:center; background:rgba(8,6,3,0); animation:rk-dim .5s ease forwards; }
      @keyframes rk-dim { to { background:rgba(8,6,3,.82); } }
      .rk-cer .card { position:relative; width:min(84vw,420px); padding:26px 24px 22px;
        border-radius:14px; text-align:center; font-family:"Gowun Batang",serif;
        background:linear-gradient(180deg,#241c12,#1a140c);
        border:1px solid rgba(240,201,107,.55);
        box-shadow:0 18px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(240,201,107,.12) inset;
        transform-origin:center top; animation:rk-unfurl .75s cubic-bezier(.2,.9,.25,1) forwards; }
      @keyframes rk-unfurl { 0%{opacity:0; transform:scaleY(.06) translateY(-10px);}
        45%{opacity:1;} 70%{transform:scaleY(1.03);} 100%{opacity:1; transform:scaleY(1);} }
      .rk-cer .eyebrow { font-size:11px; letter-spacing:.22em; color:#b8a888; opacity:0;
        animation:rk-in .5s ease .55s forwards; }
      .rk-cer .tier { font-size:40px; font-weight:700; color:#f0c96b; margin:8px 0 2px; opacity:0;
        text-shadow:0 0 26px rgba(240,201,107,.55); animation:rk-tier .8s cubic-bezier(.34,1.56,.64,1) .62s forwards; }
      @keyframes rk-tier { 0%{opacity:0; transform:scale(.55);} 60%{opacity:1; transform:scale(1.12);}
        100%{opacity:1; transform:scale(1);} }
      .rk-cer .lv { font-size:12px; color:#e8dcc2; opacity:0; animation:rk-in .5s ease .8s forwards; }
      .rk-cer .path { margin:16px 0 0; font-size:15px; color:#fff7e6; line-height:1.6; opacity:0;
        animation:rk-in .55s ease .95s forwards; }
      .rk-cer .note { margin:9px 0 0; font-size:12.5px; color:#b8a888; line-height:1.7; opacity:0;
        animation:rk-in .55s ease 1.15s forwards; }
      .rk-cer .tap { margin-top:18px; font-size:11px; color:#8d8270; opacity:0;
        animation:rk-in .5s ease 1.5s forwards; }
      @keyframes rk-in { to { opacity:1; } }
      /* 낙관(도장) — 쿵 찍히는 느낌 */
      .rk-cer .seal { position:absolute; right:16px; bottom:14px; width:52px; height:52px;
        border-radius:7px; border:2.5px solid #b6483c; color:#b6483c; display:flex;
        align-items:center; justify-content:center; font-size:15px; font-weight:700; line-height:1.15;
        opacity:0; transform:rotate(-13deg) scale(2.6); animation:rk-seal .45s cubic-bezier(.3,1.4,.4,1) 1.28s forwards; }
      @keyframes rk-seal { 0%{opacity:0; transform:rotate(-13deg) scale(2.6);}
        60%{opacity:.95; transform:rotate(-13deg) scale(.92);}
        100%{opacity:.95; transform:rotate(-13deg) scale(1);} }
      .rk-cer .glow { position:absolute; inset:-40px; border-radius:50%; pointer-events:none;
        background:radial-gradient(circle,rgba(240,201,107,.5),transparent 62%);
        opacity:0; animation:rk-glow 1.1s ease .6s forwards; }
      @keyframes rk-glow { 0%{opacity:0; transform:scale(.4);} 35%{opacity:.85;}
        100%{opacity:0; transform:scale(1.7);} }
      /* 금빛 조각이 흩날림 */
      .rk-fall { position:fixed; top:-14px; z-index:88; width:7px; height:11px; border-radius:2px;
        background:linear-gradient(180deg,#f7dc93,#c9962e); opacity:.9; pointer-events:none;
        animation:rk-fall linear forwards; }
      @keyframes rk-fall { to { transform:translateY(112vh) rotate(var(--sp)); opacity:0; } }
      @media (prefers-reduced-motion:reduce){
        .rk-float,.rk-lvup .txt,.rk-lvup .ring,.rk-spark,.rk-fall,.rk-cer .card,
        .rk-cer .seal,.rk-cer .glow { animation-duration:.01ms !important; }
      }`;
      document.head.appendChild(s);
    }

    function floatXp(n, reason){
      css();
      const d = document.createElement('div');
      d.className = 'rk-float';
      d.innerHTML = '<span class="n">+' + n + '</span>' +
                    (reason ? '<span class="r">' + reason + '</span>' : '');
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1250);
    }

    function pulseHud(){
      const el = document.getElementById('rank-hud');
      if (!el) return;
      el.classList.remove('rk-pulse');
      void el.offsetWidth;               // 리플로우로 애니메이션 재시작
      el.classList.add('rk-pulse');
      setTimeout(() => el.classList.remove('rk-pulse'), 200);
    }

    function levelUp(lv){
      css();
      if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
      if (navigator.vibrate) navigator.vibrate(30);
      const ov = document.createElement('div');
      ov.className = 'rk-ov';
      const box = document.createElement('div');
      box.className = 'rk-lvup';
      box.innerHTML = '<span class="ring"></span><span class="ring"></span>' +
        [0,45,90,135,180,225,270,315].map(a =>
          `<span class="rk-spark" style="--a:${a}deg"></span>`).join('') +
        '<span class="txt">Lv.' + lv + ' 달성</span>';
      ov.appendChild(box);
      document.body.appendChild(ov);
      setTimeout(() => ov.remove(), 1400);
    }

    function promote(tier, lv){
      css();
      if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
      if (navigator.vibrate) navigator.vibrate([40, 60, 90]);

      const ov = document.createElement('div');
      ov.className = 'rk-cer';
      ov.innerHTML =
        '<div class="card">' +
          '<div class="glow"></div>' +
          '<div class="eyebrow">신 분 이 올 랐 다</div>' +
          '<div class="tier">' + tier.name + '</div>' +
          '<div class="lv">Lv.' + lv + '</div>' +
          (tier.path ? '<div class="path">' + tier.path + '</div>' : '') +
          '<div class="note">' + tier.note + '</div>' +
          '<div class="tap">화면을 누르면 계속</div>' +
          '<div class="seal">' + tier.name + '</div>' +
        '</div>';
      document.body.appendChild(ov);

      // 금빛 조각
      for (let i = 0; i < 26; i++){
        const p = document.createElement('i');
        p.className = 'rk-fall';
        p.style.left = (Math.random() * 100) + 'vw';
        p.style.setProperty('--sp', (Math.random() * 720 - 360) + 'deg');
        p.style.animationDuration = (1.9 + Math.random() * 1.6) + 's';
        p.style.animationDelay = (Math.random() * 0.7) + 's';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4200);
      }

      const close = () => { ov.remove(); document.removeEventListener('pointerdown', close); };
      setTimeout(() => document.addEventListener('pointerdown', close), 1600);
      setTimeout(close, 9000);           // 안 누르고 놔둬도 언젠가는 닫힌다
    }

    return { floatXp, pulseHud, levelUp, promote, css };
  })();

  /* NPC가 내 신분에 따라 다르게 맞이한다.
     NPC마다 대사를 따로 쓰면 대사량이 다섯 배가 되므로, NPC의 신분(look.role,
     이미 133명 전원에 붙어 있다) × 내 신분으로 첫인사만 고른다. 본문 대사는
     그대로 재사용한다. */
  const GREET = {
    king: {
      nobi:'게 누구냐. 어인 일로 예까지 들었느냐.',
      yangin:'낯선 자로구나. 무슨 일로 왔는가.',
      jungin:'그래, 무슨 일로 나를 찾았는가.',
      yangban:'어서 오시게. 마침 이야기 상대가 필요하던 참이오.',
      jaesang:'경이 왔는가. 가까이 오시오.',
      wang:'…그대와 나, 같은 자리에 있는 셈이군.',
    },
    scholar: {
      nobi:'…글은 아느냐? 아니어도 좋다. 듣기만 하여도 남는 것이 있지.',
      yangin:'배우려는 마음이 있다면 신분이 무슨 대수겠는가.',
      jungin:'실무를 아는 이와 말하는 건 언제나 즐겁소.',
      yangban:'오, 같이 글을 아는 이를 만나니 반갑소.',
      jaesang:'대감께서 이런 곳까지 걸음하시다니.',
      wang:'전하께서 어인 일로 예까지…',
    },
    general: {
      nobi:'비켜서 있거라. …아니, 기왕 왔으니 들어나 보아라.',
      yangin:'몸은 성한가. 이 시절엔 그것부터가 일일세.',
      jungin:'자네 같은 이가 뒤를 받쳐 주어야 군이 도는 법이지.',
      yangban:'오셨는가. 마침 전황을 이야기하던 참일세.',
      jaesang:'대감, 조정의 뜻을 여쭙고 싶던 참이오.',
      wang:'전하, 어인 일로 진중까지 납시었습니까.',
    },
    commoner: {
      nobi:'자네도 고생이 많구먼. 우리 처지가 다 그렇지.',
      yangin:'같은 양인끼리 뭐 어려울 게 있겠소.',
      jungin:'나으리 같은 분이 우리 사정을 알아주셔야 할 텐데.',
      yangban:'(고개를 숙이며) 나으리, 어인 걸음이십니까.',
      jaesang:'(황급히 엎드리며) 대감마님을 뵙습니다.',
      wang:'(땅에 엎드려 감히 얼굴을 들지 못한다)',
    },
  };
  function greetingFor(npcRole){
    const tier = get().tier.id;
    const set = GREET[npcRole] || GREET.commoner;
    return set[tier] || null;
  }

  function reset(){ save({ xp: 0 }); renderHud(); }

  return { get, addXp, renderHud, greetingFor, reset, TIERS, MAX_LV,
           _effects: Effects };
})();
