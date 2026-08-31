/* ============ 학습 기록 수집 — 감이 아니라 근거로 고치기 위해 ============

   왜 만들었나
   - 지금 난이도는 짐작으로 정해져 있다. 어느 문항이 실제로 어려운지, 사람들이
     어디서 막히고 어디서 지루해하는지 **아무 근거가 없다.**
   - 전산회계 오락실은 수업에서 학생들과 푼 데이터로 난이도를 고친다. 이 게임은
     수업 밖 사람들이 쓰니, 플레이에서 직접 모아야 한다.

   무엇을 모으나 — 배움에 관한 것만
   - 문항별: 몇 번 나왔나 / 첫 시도에 맞혔나 / 몇 번 틀렸나 / 푸는 데 걸린 시간
   - 챕터별: 들어왔나 / 끝냈나 / 중간에 나갔다면 어디서
   - 그때의 난이도(2지선다/4지선다)
   **이름·이메일·연락처 같은 것은 담지 않는다.** 로그인했으면 그 uid를, 아니면
   기기마다 한 번 만든 무작위 아이디를 쓴다. 누구인지가 아니라 **무엇이 어려운지**를
   보려는 것이다.

   어떻게 보내나 — 쓰기를 아낀다
   - 문항마다 바로 보내면 하루에도 수만 번 쓰게 된다. 그래서 **기기에 쌓아 두고**
     챕터가 끝나거나 앱이 내려갈 때 한 번에 보낸다.
   - 문항 통계는 increment로 더한다(읽지 않고 더하기만 하므로 싸고 충돌이 없다).
   - 파이어베이스 설정이 없으면 **조용히 쌓아만 둔다**(최대 500건). 설정이
     들어오면 그때부터 보낸다. 오프라인에서도 게임은 아무 지장이 없다.

   붙이는 법
     <script src="assets/telemetry.js"></script>   (auth.js 뒤)
*/
window.Telemetry = (function(){
  const KEY = 'khg_tm';
  const IDKEY = 'khg_tm_id';
  const CAP = 500;              // 못 보낸 채로 쌓일 수 있는 최대치

  function deviceId(){
    let v = null;
    try { v = localStorage.getItem(IDKEY); } catch(e){}
    if (!v){
      v = 'd_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      try { localStorage.setItem(IDKEY, v); } catch(e){}
    }
    return v;
  }

  function load(){
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.q) return v; } catch(e){}
    return { q: {}, ch: {}, n: 0 };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  let buf = load();

  function chapter(){ return location.pathname.split('/').pop() || 'index.html'; }

  /* ---------------- 쌓기 ---------------- */
  function bumpQ(id, field, by){
    const q = buf.q[id] || (buf.q[id] = { seen: 0, first: 0, wrong: 0, ms: 0, lv4: 0 });
    q[field] = (q[field] || 0) + (by == null ? 1 : by);
    buf.n++;
    if (buf.n > CAP * 4) trim();
    save(buf);
  }
  function bumpCh(field, by){
    const c = buf.ch[chapter()] || (buf.ch[chapter()] = { enter: 0, done: 0, quit: 0 });
    c[field] = (c[field] || 0) + (by == null ? 1 : by);
    save(buf);
  }
  function trim(){
    // 너무 쌓이면 오래된 것부터 버린다 — 저장소를 무한정 먹으면 안 된다
    const keys = Object.keys(buf.q);
    if (keys.length > CAP) for (const k of keys.slice(0, keys.length - CAP)) delete buf.q[k];
    buf.n = 0; save(buf);
  }

  /* ---------------- 보내기 ---------------- */
  function db(){ return (window.Auth && Auth.db) || null; }
  function who(){
    try { if (window.Auth && Auth.user) return Auth.user.uid; } catch(e){}
    return deviceId();
  }

  let sending = false;
  async function flush(){
    const D = db();
    if (!D || sending) return false;
    const qs = Object.keys(buf.q), chs = Object.keys(buf.ch);
    if (!qs.length && !chs.length) return false;
    sending = true;
    const snapshot = JSON.parse(JSON.stringify(buf));
    try {
      const INC = firebase.firestore.FieldValue.increment;
      const batch = D.batch();
      // 문항 통계 — 누가 풀었는지는 담지 않는다. 문항이 어려운지만 본다.
      for (const id of qs){
        const v = snapshot.q[id];
        batch.set(D.collection('khg_qstats').doc(id.replace(/\//g, '_')), {
          seen: INC(v.seen || 0), first: INC(v.first || 0),
          wrong: INC(v.wrong || 0), ms: INC(v.ms || 0), lv4: INC(v.lv4 || 0),
        }, { merge: true });
      }
      // 챕터별 진행 — 사람 단위로 하나. 어디서 그만두는지를 본다.
      const uid = who();
      for (const c of chs){
        const v = snapshot.ch[c];
        batch.set(D.collection('khg_progress').doc(uid), {
          [c.replace(/\./g, '_')]: {
            enter: INC(v.enter || 0), done: INC(v.done || 0), quit: INC(v.quit || 0) },
          updatedAt: Date.now(),
        }, { merge: true });
      }
      await batch.commit();
      // 보낸 만큼만 지운다 — 보내는 사이에 쌓인 것은 남긴다
      for (const id of qs){
        const cur = buf.q[id], sent = snapshot.q[id];
        if (!cur) continue;
        let empty = true;
        for (const k of ['seen','first','wrong','ms','lv4']){
          cur[k] = (cur[k] || 0) - (sent[k] || 0);
          if (cur[k] > 0) empty = false; else cur[k] = 0;
        }
        if (empty) delete buf.q[id];
      }
      for (const c of chs) delete buf.ch[c];
      save(buf);
      return true;
    } catch(e){
      console.warn('[Telemetry] 보내기 실패 — 다음에 다시 보낸다', e);
      return false;
    } finally { sending = false; }
  }

  /* ---------------- 이미 있는 것에 붙는다 ---------------- */
  let cur = null, t0 = 0;

  function wire(){
    try {
      if (typeof Quiz !== 'undefined' && Quiz && !Quiz._tmWired){
        const oo = Quiz._openOne, op = Quiz.pick;
        if (typeof oo === 'function'){
          Quiz._openOne = function(data, onDone){
            cur = idOf(data); t0 = Date.now();
            if (cur){
              bumpQ(cur, 'seen');
              if (data && data.opts && data.opts.length > 2) bumpQ(cur, 'lv4');
            }
            return oo.call(this, data, onDone);
          };
        }
        if (typeof op === 'function'){
          Quiz.pick = function(i){
            const wasAnswered = this.answered;
            const right = this.order && this.data && this.order[i] === this.data.answer;
            const firstTry = right && !this._missed;
            const r = op.apply(this, arguments);
            if (!wasAnswered && cur){
              if (right){
                if (firstTry) bumpQ(cur, 'first');
                bumpQ(cur, 'ms', Math.min(120000, Date.now() - t0));
                cur = null;
              } else bumpQ(cur, 'wrong');
            }
            return r;
          };
        }
        Quiz._tmWired = true;
      }
    } catch(e){}

    // 챕터 완주 — 배지가 붙는 자리를 그대로 쓴다
    if (window.Badges && !Badges._tmWired){
      const oe = Badges.earn;
      Badges.earn = function(id){
        const r = oe.apply(this, arguments);
        if (String(id).indexOf('ch_complete_') === 0){ bumpCh('done'); flush(); }
        return r;
      };
      Badges._tmWired = true;
    }
  }

  function idOf(data){
    if (!data || !data.q) return null;
    // 문항 자체로 아이디를 만든다 — 문항이 어느 인물에게 옮겨 가도 통계가 이어진다
    const q = String(data.q).slice(0, 60).replace(/[^\w가-힣]/g, '');
    return chapter().replace(/\.html$/, '') + '_' + q;
  }

  /* 화면이 내려갈 때 한 번 보낸다 — 앱을 끄면 그대로 사라지는 것을 막는다 */
  function onHide(){ if (document.visibilityState === 'hidden') flush(); }

  function init(){
    wire();
    bumpCh('enter');
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    // 로그인하면 그때부터 uid로 붙는다
    if (window.Auth && Auth.onChange) Auth.onChange(() => flush());
    setTimeout(flush, 4000);   // 켜자마자 남아 있던 것 보내기
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { flush, wire, deviceId,
           get pending(){ return Object.keys(buf.q).length; },
           _buf: () => buf };
})();
