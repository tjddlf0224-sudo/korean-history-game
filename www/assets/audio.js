/* 배경음악 재생 모듈. window.BGM으로 노출한다(top-level const는 window에
   안 붙는다는 걸 badges.js에서 이미 한 번 겪었으므로 처음부터 window.BGM = 로
   선언). 존 루프는 두 채널을 번갈아 써서 크로스페이드하고, 팡파레 같은 짧은
   효과음은 따로 겹쳐 재생한다.

   ■ <audio>를 버리고 Web Audio(AudioContext)로 바꿨다 (2026-09-18, 첫 iOS 빌드 전)
   iOS는 HTML5 <audio>가 소리를 내는 순간 잠금화면·제어센터에 Now Playing
   플레이어를 등록하고, 그건 WebKit의 WebContent 프로세스가 하는 일이라
   앱에서는 지울 수 없다. pause()도, src를 내리는 것(예전 이 파일의 guard)도
   소용없다 — 보카바리스타가 5차까지 싸운 끝에 낸 결론이고 전산회계 오락실도
   같은 방식으로 옮겼다(~/AccountingMaster-Projects/.../www/bgm.js).
   AudioContext는 Now Playing에 등록하지 않는다.

   ■ 파일은 fetch가 아니라 XHR로 받는다
   Capacitor의 capacitor:// 스킴 핸들러가 fetch로 오는 mp3만 못 돌려줬다
   (전산회계 오락실에서 시뮬레이터로 실측). XHR은 되지만 status가 0으로 온다 —
   0도 성공으로 친다. 이 판정식을 건드리지 말 것.

   ■ 메모리
   디코딩된 PCM은 크다(48kHz 스테레오 f32 기준 1분 ≈ 23MB, 가장 긴 곡 155초).
   받자마자 모노로 합쳐 절반으로 줄이고, 배경음악은 **최근 두 곡만** 들고 있는다
   (크로스페이드에 두 곡이 필요해서). 효과음은 짧아서 따로 계속 둔다.

   브라우저 자동재생 정책 때문에 사용자 제스처 전에는 소리가 막힌다 — 첫
   pointerdown/keydown/touchstart에서 unlock()하고, 그 전에 들어온 play()
   요청은 pending에 두었다가 그때 재생한다. 아직 없는 파일을 요청해도 조용히
   실패할 뿐 게임이 멎지 않는다. */
window.BGM = (function(){
  const MUTE_KEY = 'ths_bgm_muted';
  const VOL_KEY = 'ths_bgm_vol';
  const BGM_KEEP = 2;

  let muted = false, volume = 0.55;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
    const v = parseFloat(localStorage.getItem(VOL_KEY));
    if (!isNaN(v)) volume = v;
  } catch (e) {}

  let current = null;
  let unlocked = false;
  let pending = null;

  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null;
  function ac(){
    if (!ctx && AC){
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = targetVol();
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    return ctx;
  }

  function pathFor(id){ return 'assets/audio/' + id + '.mp3'; }
  function targetVol(){ return muted ? 0 : volume; }

  /* ---------- 받기·풀기 ---------- */
  const bgmCache = new Map();   // id → AudioBuffer (최근 순서 유지)
  const sfxCache = new Map();
  const loading = new Map();    // id → Promise

  function loadArrayBuffer(url){
    return new Promise((res, rej) => {
      const x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.responseType = 'arraybuffer';
      x.onload = () => {
        const ok = (x.status === 200 || x.status === 0);   // capacitor:// 는 0
        if (ok && x.response && x.response.byteLength) res(x.response);
        else rej(new Error('XHR ' + x.status + ' ' + url));
      };
      x.onerror = () => rej(new Error('XHR error ' + url));
      x.send();
    });
  }
  function decode(ab){
    return new Promise((res, rej) => {
      // 구형 사파리는 콜백형만 지원하던 시절이 있어 양쪽 다 받는다
      const p = ctx.decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  // 스테레오를 모노로 합쳐 메모리를 절반으로
  function toMono(buf){
    if (buf.numberOfChannels < 2) return buf;
    const n = buf.length, m = ctx.createBuffer(1, n, buf.sampleRate);
    const out = m.getChannelData(0), ch = buf.numberOfChannels;
    for (let c = 0; c < ch; c++){
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] += d[i] / ch;
    }
    return m;
  }
  function getBuffer(id, isSfx){
    const cache = isSfx ? sfxCache : bgmCache;
    if (cache.has(id)){
      const b = cache.get(id); cache.delete(id); cache.set(id, b);   // 최근으로
      return Promise.resolve(b);
    }
    if (loading.has(id)) return loading.get(id);
    if (!ac()) return Promise.reject(new Error('no AudioContext'));
    const p = loadArrayBuffer(pathFor(id)).then(decode).then(buf => {
      buf = toMono(buf);
      cache.set(id, buf);
      if (!isSfx){
        // 지금 울리는 두 채널이 쓰는 곡은 남기고 오래된 것부터 버린다
        for (const k of bgmCache.keys()){
          if (bgmCache.size <= BGM_KEEP) break;
          if (k !== id && k !== chA.id && k !== chB.id) bgmCache.delete(k);
        }
      }
      loading.delete(id);
      return buf;
    }).catch(e => { loading.delete(id); throw e; });
    loading.set(id, p);
    return p;
  }

  /* ---------- 채널(크로스페이드용 둘) ---------- */
  function mkChannel(){ return { id: null, src: null, gain: null }; }
  const chA = mkChannel(), chB = mkChannel();
  let active = chA, inactive = chB;

  function stopChannel(ch){
    if (ch.src){ try { ch.src.stop(0); } catch (e) {} try { ch.src.disconnect(); } catch (e) {} }
    if (ch.gain){ try { ch.gain.disconnect(); } catch (e) {} }
    ch.src = null; ch.gain = null; ch.id = null;
  }
  function ramp(g, to, ms){
    const t = ctx.currentTime;
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(to, t + Math.max(0.03, ms / 1000));
    } catch (e) { g.gain.value = to; }
  }

  function play(id, opts){
    opts = opts || {};
    if (!id || current === id) return;
    current = id;
    if (!unlocked){ pending = { id: id, opts: opts }; return; }
    const fadeMs = opts.fadeMs != null ? opts.fadeMs : 900;
    getBuffer(id, false).then(buf => {
      if (current !== id || !ctx) return;          // 받는 사이 다른 곡으로 바뀜
      const nextCh = inactive, prevCh = active;
      stopChannel(nextCh);
      const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(g);
      s.start(0);
      nextCh.id = id; nextCh.src = s; nextCh.gain = g;
      ramp(g, 1, fadeMs);
      if (prevCh.gain){
        const old = { src: prevCh.src, gain: prevCh.gain };
        ramp(old.gain, 0, fadeMs);
        setTimeout(() => {
          if (prevCh.src === old.src) stopChannel(prevCh);
        }, fadeMs + 80);
      }
      active = nextCh; inactive = prevCh;
    }).catch(() => {});
  }

  function stop(fadeMs){
    current = null;
    const ch = active;
    if (!ch.gain || !ctx) return;
    const ms = fadeMs != null ? fadeMs : 600, s = ch.src;
    ramp(ch.gain, 0, ms);
    setTimeout(() => { if (ch.src === s) stopChannel(ch); }, ms + 80);
  }

  function playOnce(id){
    if (!id || !unlocked) return;
    getBuffer(id, true).then(buf => {
      if (!ctx) return;
      const s = ctx.createBufferSource(); s.buffer = buf; s.connect(master);
      s.onended = () => { try { s.disconnect(); } catch (e) {} };
      s.start(0);
    }).catch(() => {});
  }

  function applyVolume(){ if (master && ctx) ramp(master, targetVol(), 60); }

  function setMuted(v){
    muted = !!v;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    applyVolume();
  }
  function isMuted(){ return muted; }
  function toggleMuted(){ setMuted(!muted); return muted; }

  function setVolume(v){
    volume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
    applyVolume();
  }
  function getVolume(){ return volume; }

  function unlock(){
    const c = ac();
    if (c && c.state !== 'running'){ const p = c.resume(); if (p && p.catch) p.catch(() => {}); }
    if (unlocked) return;
    unlocked = true;
    if (pending){
      const p = pending; pending = null; current = null;
      play(p.id, p.opts);
    }
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => {
    window.addEventListener(ev, unlock, { once: true, passive: true });
  });

  /* ---------- 앱/탭 이탈·복귀 ----------
     AudioContext라 잠금화면에 남을 일은 없지만, 백그라운드에서 소리가 계속
     나거나 배터리를 먹는 건 막아야 한다. WKWebView는 앱이 백그라운드로 갈 때
     visibilitychange가 안 올 수 있어서 Capacitor appStateChange와
     네이티브(SceneDelegate)의 직접 호출까지 겹으로 건다. */
  let away = false;
  function release(){
    if (away) return; away = true;
    if (ctx && ctx.state === 'running'){ try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  }
  function resume(){
    if (!away) return; away = false;
    if (!ctx) return;
    const p = ctx.resume();
    // 자동재생이 막히면 다음 터치 한 번에 다시 깨운다
    if (p && p.catch) p.catch(() => {});
    setTimeout(() => {
      if (ctx && ctx.state !== 'running'){
        const h = () => {
          ['touchstart', 'pointerdown', 'click'].forEach(e => document.removeEventListener(e, h, true));
          const q = ctx.resume(); if (q && q.catch) q.catch(() => {});
        };
        ['touchstart', 'pointerdown', 'click'].forEach(e => document.addEventListener(e, h, true));
      }
    }, 300);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') release(); else resume();
  });
  window.addEventListener('pagehide', release);
  window.addEventListener('pageshow', resume);
  function bindAppState(){
    try {
      const App = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App;
      if (App && App.addListener && !bindAppState.done){
        bindAppState.done = true;
        App.addListener('appStateChange', st => (st && st.isActive) ? resume() : release());
      }
    } catch (e) {}
  }
  bindAppState();
  document.addEventListener('DOMContentLoaded', bindAppState);
  // 네이티브 SceneDelegate가 백그라운드 직전/포그라운드 직후에 직접 부른다
  window.__khgReleaseAudio = release;
  window.__khgResumeAudio = resume;

  return { play, stop, playOnce, setMuted, isMuted, toggleMuted, setVolume, getVolume, unlock };
})();
