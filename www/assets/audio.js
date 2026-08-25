/* 배경음악 재생 모듈. window.BGM으로 노출한다(top-level const는 window에
   안 붙는다는 걸 badges.js에서 이미 한 번 겪었으므로 처음부터 window.BGM = 로
   선언). 존 루프는 두 <audio> 채널을 번갈아 써서 크로스페이드하고, 팡파레
   같은 짧은 효과음은 별도의 세 번째 채널로 겹쳐 재생한다.

   브라우저 자동재생 정책 때문에 사용자 제스처 전에는 재생이 막힌다 — 첫
   pointerdown/keydown/touchstart에서 unlock()하고, 그 전에 들어온 play()
   요청은 pending에 저장해뒀다가 그때 재생한다. 아직 없는 파일(D1/D3/D4
   팡파레·보스전·엔딩곡)을 요청해도 그냥 조용히 실패할 뿐 게임이 멎지
   않는다. */
window.BGM = (function(){
  const MUTE_KEY = 'ths_bgm_muted';
  const VOL_KEY = 'ths_bgm_vol';

  let muted = localStorage.getItem(MUTE_KEY) === '1';
  let volume = parseFloat(localStorage.getItem(VOL_KEY));
  if (isNaN(volume)) volume = 0.55;

  let current = null;
  let unlocked = false;
  let pending = null;

  function mkChannel(loop){
    const el = new Audio();
    el.loop = loop;
    el.preload = 'auto';
    el.volume = 0;
    return el;
  }
  const chA = mkChannel(true), chB = mkChannel(true);
  let active = chA, inactive = chB;
  const sfxEl = mkChannel(false);

  function pathFor(id){ return 'assets/audio/' + id + '.mp3'; }
  function targetVol(){ return muted ? 0 : volume; }

  function fade(el, from, to, ms, done){
    const t0 = performance.now();
    (function step(now){
      const p = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      el.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    })(t0);
  }

  function play(id, opts){
    opts = opts || {};
    if (!id || current === id) return;
    current = id;
    if (!unlocked){ pending = { id: id, opts: opts }; return; }
    const fadeMs = opts.fadeMs != null ? opts.fadeMs : 900;
    const nextEl = inactive, prevEl = active;
    try {
      nextEl.pause();
      nextEl.src = pathFor(id);
      nextEl.currentTime = 0;
      nextEl.volume = 0;
      const p = nextEl.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
    fade(nextEl, 0, targetVol(), fadeMs);
    if (prevEl !== nextEl){
      fade(prevEl, prevEl.volume, 0, fadeMs, () => { prevEl.pause(); });
    }
    active = nextEl; inactive = prevEl;
  }

  function stop(fadeMs){
    current = null;
    fade(active, active.volume, 0, fadeMs != null ? fadeMs : 600, () => active.pause());
  }

  function playOnce(id){
    if (!id || !unlocked) return;
    try {
      sfxEl.pause();
      sfxEl.src = pathFor(id);
      sfxEl.currentTime = 0;
      sfxEl.volume = targetVol();
      const p = sfxEl.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function applyVolume(){ active.volume = targetVol(); }

  function setMuted(v){
    muted = !!v;
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    applyVolume();
  }
  function isMuted(){ return muted; }
  function toggleMuted(){ setMuted(!muted); return muted; }

  function setVolume(v){
    volume = Math.max(0, Math.min(1, v));
    localStorage.setItem(VOL_KEY, String(volume));
    applyVolume();
  }
  function getVolume(){ return volume; }

  function unlock(){
    if (unlocked) return;
    unlocked = true;
    [chA, chB].forEach(el => {
      const p = el.play();
      if (p && p.then) p.then(() => el.pause()).catch(() => {});
    });
    if (pending){
      const p = pending; pending = null; current = null;
      play(p.id, p.opts);
    }
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, unlock, { once: true, passive: true });
  });

  /* 잠금화면/제어센터 Now Playing 잔존 방지(전산회계 오락실 bgmguard.js와
     같은 대응). iOS는 <audio>가 pause()해도 미디어가 로드돼 있는 한
     Now Playing 위젯을 계속 띄운다 — 화면이 숨겨지면(백그라운드/잠금/
     탭 이탈) src를 아예 내려 리소스를 해제해야 위젯이 사라진다. 다시
     보이면 src를 복원(HTTP 캐시라 재로드 빠름)하고 재생 중이었다면
     이어서 재생한다(자동재생이 막히면 다음 터치에서 재개). */
  function resumeOnGesture(el){
    const h = () => {
      document.removeEventListener('touchstart', h, true);
      document.removeEventListener('click', h, true);
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    };
    document.addEventListener('touchstart', h, true);
    document.addEventListener('click', h, true);
  }
  function guardUnload(){
    [chA, chB, sfxEl].forEach(el => {
      try {
        const src = el.getAttribute('src');
        if (src){
          el.__guardSrc = src;
          el.__guardWasPlaying = !el.paused && !el.ended;
          el.pause();
          el.removeAttribute('src');
          el.load();
        }
      } catch (e) {}
    });
    if ('mediaSession' in navigator){
      try { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; } catch (e) {}
    }
  }
  function guardRestore(){
    [chA, chB, sfxEl].forEach(el => {
      try {
        if (!el.getAttribute('src') && el.__guardSrc){
          el.setAttribute('src', el.__guardSrc);
          el.__guardSrc = null;
          el.load();
          if (el.__guardWasPlaying){
            el.__guardWasPlaying = false;
            const p = el.play();
            if (p && p.catch) p.catch(() => resumeOnGesture(el));
          }
        }
      } catch (e) {}
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') guardUnload(); else guardRestore();
  });
  window.addEventListener('pagehide', guardUnload);
  window.addEventListener('pageshow', guardRestore);
  window.__bgmGuardRestore = guardRestore;

  return { play, stop, playOnce, setMuted, isMuted, toggleMuted, setVolume, getVolume, unlock };
})();
