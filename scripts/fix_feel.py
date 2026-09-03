# -*- coding: utf-8 -*-
"""실기기 제보 네 가지를 고친다.

   ① 고인돌 '해 보기'가 엉뚱한 곳에서 떴다
      Deed가 (960,174) — 물가 빈 공터에 놓여 있었다. 정작 고인돌은
      배리어 {1047,516 → 1201,639}가 감싼 (1124,578)이다.
      브라우저에서 World.canStand로 실제 격자를 재 보니, 고인돌 서쪽
      x≈1020까지가 설 수 있는 자리다. 거기서 고인돌까지 94px이므로
      range 140이면 고인돌 앞에 섰을 때만 뜬다.

   ② 이동이 너무 빠르다
      speed 165 → 135 (화면상 165*1.6=264px/s → 216px/s).
      전 챕터가 같은 값을 쓰고 있었다.

   ③ 대화창을 연타해도 그만큼 안 넘어간다
      - 진짜 원인은 **눌러도 아무 일이 없는 자리**였다. 도해를 대화창
        밖(#dlg-stack)으로 꺼낸 뒤, 도해를 눌러도 넘어가지 않았다.
        도해는 대사 셋 중 하나에 붙으니 절반이 헛손질이 됐다.
      - click 대신 pointerup을 쓴다. 손을 뗀 즉시 넘어가고, 연타한
        만큼 센다. 누른 채 움직였으면(도해를 스크롤한 것) 넘기지 않는다.
      - 단추·용어(gloss)는 제 일을 하게 비켜 준다.

   ④ 한 번 본 '해 보기'를 다시 볼 수 없다
      done이면 단추를 아예 감췄다. 다시 읽고 싶다는 제보.
      이제 다시 뜨고 다시 볼 수 있게 하되 **보상은 처음 한 번만** 준다
      (금을 반복해서 캘 수 있으면 그것만 하게 된다).

   쓰는 법
     python3 scripts/fix_feel.py
"""
import io, glob, os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')


def main():
    os.chdir(BASE)

    # ---------- ① 고인돌 자리 ----------
    p = 'seonsa1.html'
    s = io.open(p, encoding='utf-8').read()
    OLD = "  id: 'goindol_seonsa', zone: 'seonsa', x: 960, y: 174, range: 175,"
    NEW = ("  /* 고인돌은 배리어 {1047,516 → 1201,639}가 감싼 자리다. 예전 좌표\n"
           "     (960,174)는 물가 빈 공터여서 아무것도 없는 데서 단추가 떴다(제보).\n"
           "     World.canStand로 재 보니 서쪽 x≈1020까지 설 수 있고 거기서 94px,\n"
           "     그래서 range 140이면 고인돌 앞에 섰을 때만 뜬다. */\n"
           "  id: 'goindol_seonsa', zone: 'seonsa', x: 1124, y: 578, range: 140,")
    if OLD in s:
        io.open(p, 'w', encoding='utf-8').write(s.replace(OLD, NEW, 1))
        print('① 고인돌 자리 (960,174) → (1124,578) range 140')
    elif 'x: 1124, y: 578' in s:
        print('① 고인돌 자리 — 이미 고쳐져 있다')
    else:
        print('!! ① 고인돌 좌표를 못 찾았다')

    # ---------- ② 이동 속도 ----------
    OLD_SP = ("  facing: 'd', speed: 165, "
              "// 화면상 속도 = speed*ZOOM(1.6) ≈ 264px/s로 전 챕터 동일")
    NEW_SP = ("  facing: 'd', speed: 135, "
              "// 화면상 speed*ZOOM(1.6) ≈ 216px/s로 전 챕터 동일\n"
              "  // 265px/s는 \"너무 빠르다\"는 제보를 받았다. 지도를 눈으로 읽으며\n"
              "  // 걸을 수 있는 속도로 낮췄다.")
    n = 0
    for f in sorted(glob.glob('*.html')):
        t = io.open(f, encoding='utf-8').read()
        if OLD_SP in t:
            io.open(f, 'w', encoding='utf-8').write(t.replace(OLD_SP, NEW_SP, 1)); n += 1
    print('② 이동 속도 165 → 135: %d개 챕터' % n)

    # ---------- ③ 대화 연타 ----------
    OLD_H = ("document.getElementById('dlg-panel').addEventListener('click', () => Dialog.next());\n"
             "document.getElementById('dlg-portrait').addEventListener('click', () => Dialog.next());")
    NEW_H = """/* 대화 넘기기 — 어디를 눌러도 넘어가고, 연타하면 연타한 만큼 넘어간다.

   예전에는 #dlg-panel과 초상에만 click을 걸었다. 그런데 도해를 대화창
   밖(#dlg-stack)으로 꺼낸 뒤로 **도해를 눌러도 아무 일이 없었다.**
   도해는 대사 셋 중 하나에 붙으니 절반이 헛손질이 됐고, 그래서 "연타해도
   느리다"는 제보가 나왔다. 이제 묶음 전체가 넘기는 자리다.

   click 대신 pointerup을 쓴다 — 손을 뗀 즉시 넘어가고 연타를 그대로 센다.
   다만 도해가 길면 안에서 스크롤되므로, **누른 채 움직였으면 넘기지 않는다.**
   단추(이전·닫기)와 용어 풀이는 제 일을 하게 비켜 준다. */
(function(){
  const stack = document.getElementById('dlg-stack');
  if (!stack) return;
  const SKIP = 'button, a, .gloss-term, input, textarea, select';
  let sx = 0, sy = 0, live = false;
  stack.addEventListener('pointerdown', (e) => {
    live = !(e.target.closest && e.target.closest(SKIP));
    sx = e.clientX; sy = e.clientY;
  });
  stack.addEventListener('pointercancel', () => { live = false; });
  stack.addEventListener('pointerup', (e) => {
    if (!live) return;
    live = false;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 12) return;   // 스크롤한 것
    Dialog.next();
  });
})();"""
    n = 0
    for f in sorted(glob.glob('*.html')):
        t = io.open(f, encoding='utf-8').read()
        if OLD_H in t:
            io.open(f, 'w', encoding='utf-8').write(t.replace(OLD_H, NEW_H, 1)); n += 1
    print('③ 대화 연타 — 묶음 전체 + pointerup: %d개 챕터' % n)

    # ---------- ④ 해 보기 다시 보기 ----------
    p = 'assets/deed.js'
    s = io.open(p, encoding='utf-8').read()

    OLD_T = """    for (const s of LIST){
      if (s.zone !== W.zone || done(s.id)) continue;
      if (Math.hypot(W.px - s.x, W.py - s.y) <= (s.range || 160)){
        b.textContent = s.label || '해 보기';"""
    NEW_T = """    for (const s of LIST){
      if (s.zone !== W.zone) continue;
      if (Math.hypot(W.px - s.x, W.py - s.y) <= (s.range || 160)){
        // 한 번 본 것도 다시 볼 수 있다("다시 보고 싶은데"는 실제 제보다).
        // 보상은 처음 한 번뿐이므로 반복해서 금을 캘 수는 없다.
        const seen = done(s.id);
        b.textContent = (s.label || '해 보기') + (seen ? ' · 다시 보기' : '');
        b.classList.toggle('seen', seen);"""
    if OLD_T in s:
        s = s.replace(OLD_T, NEW_T, 1)
        print('④ 해 보기 — 다시 뜨게 함')
    elif "' · 다시 보기'" in s:
        print('④ 해 보기 — 이미 고쳐져 있다')
    else:
        print('!! ④ tick 자리를 못 찾았다')

    OLD_R = """      for (const ln of (spec.lines || [])) await step(d, ln);
      mark(spec.id);
      if (spec.gold && window.Gold) Gold.earn(spec.gold, spec.tag || '한 일');
      if (spec.badge && window.Badges) Badges.earn(spec.badge);
      if (spec.item && window.Items && Items.give) Items.give(spec.item);
      if (spec.onDone) spec.onDone();"""
    NEW_R = """      // 두 번째부터는 이야기만 보여 준다 — 보상은 처음 한 번뿐이다
      const first = !done(spec.id);
      for (const ln of (spec.lines || [])) await step(d, ln);
      mark(spec.id);
      if (first){
        if (spec.gold && window.Gold) Gold.earn(spec.gold, spec.tag || '한 일');
        if (spec.badge && window.Badges) Badges.earn(spec.badge);
        if (spec.item && window.Items && Items.give) Items.give(spec.item);
        if (spec.onDone) spec.onDone();
      }"""
    if OLD_R in s:
        s = s.replace(OLD_R, NEW_R, 1)
        print('④ 보상은 처음 한 번만')
    elif 'const first = !done(spec.id)' in s:
        print('④ 보상 처리 — 이미 고쳐져 있다')
    else:
        print('!! ④ run 자리를 못 찾았다')

    OLD_CSS = "    #dd-btn.on { display:block; }"
    NEW_CSS = ("    #dd-btn.on { display:block; }\n"
               "    /* 이미 본 것은 흐리게 — 새로 할 일과 구별된다 */\n"
               "    #dd-btn.seen { border-color:#5d7a67; color:#93ab9b;\n"
               "      background:rgba(18,22,17,.9); font-weight:400; }")
    if OLD_CSS in s and '#dd-btn.seen' not in s:
        s = s.replace(OLD_CSS, NEW_CSS, 1)
        print('④ 다시 보기 단추는 흐리게')

    io.open(p, 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    main()
