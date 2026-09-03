# -*- coding: utf-8 -*-
"""한 프레임의 예외로 게임이 영구히 검게 남는 것을 막는다.

   무엇이 잘못돼 있었나
   - 36개 챕터가 전부 이렇게 생겼다:

         function loop(t){
           ... 그리기 ...
           requestAnimationFrame(loop);   // ← 본문 맨 끝
         }
         requestAnimationFrame(loop);

     rAF 재예약이 **본문 맨 끝**에 있다. 그래서 그리는 도중 예외가 한 번
     나면 다음 프레임이 예약되지 않고 루프가 그 자리에서 끝난다.
     HUD·단추는 DOM이라 그대로 남고 캔버스만 새까맣게 남는다.
     실제로 실기기에서 그렇게 됐다(선사 1화, 순수 #000000 — render()의
     첫 줄 fillRect(#242030)조차 안 칠해진 상태였다).

   어떻게 고치나
   - 본문을 frame(t)로 떼어 내고, loop(t)는 그것을 try/catch로 감싼 뒤
     **예외가 나든 말든 다음 프레임을 반드시 예약한다.**
   - 무엇이 터졌는지는 localStorage('khg_loop_err')에 한 번만 남긴다.
     같은 예외가 매 프레임 나도 로그는 한 줄이다(콘솔·저장소 도배 방지).
   - 캔버스가 0×0으로 굳는 경우도 스스로 되살린다. 화면이 숨겨진 채
     페이지가 열리면 visualViewport가 0을 주고, 그 값으로 canvas.width가
     0이 되면 아무것도 안 그려진다.

   쓰는 법
     python3 scripts/guard_loop.py
"""
import io, glob, os, re

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

WRAP = """/* 한 프레임이 던진 예외로 게임이 영구히 검게 남던 것을 막는다.
   예전에는 rAF 재예약이 본문 맨 끝에 있어서, 그리는 도중 예외가 한 번 나면
   다음 프레임이 예약되지 않고 루프가 끝났다. HUD는 DOM이라 남고 캔버스만
   새까맣게 남는다(실기기에서 그렇게 됐다). 이제는 예외를 삼키고 다음
   프레임을 반드시 예약한다. 한 프레임 건너뛰는 편이 게임이 멈추는 것보다 낫다.
   무엇이 터졌는지는 localStorage('khg_loop_err')에 한 번만 남겨 둔다. */
function loop(t){
  try { frame(t); }
  catch(e){
    if (!loop.reported){
      loop.reported = true;
      console.error('[loop]', e);
      try {
        localStorage.setItem('khg_loop_err', JSON.stringify({
          at: new Date().toISOString(),
          chapter: location.pathname.split('/').pop(),
          zone: (typeof World !== 'undefined' && World.zone) || null,
          msg: (e && e.message) || String(e),
          stack: ((e && e.stack) || '').slice(0, 700) }));
      } catch(_){}
    }
  }
  /* 캔버스가 0×0으로 굳으면 아무것도 안 그려져 화면이 검다. 화면이 숨겨진 채
     페이지가 열리면 visualViewport가 0을 주는데, 그때 잡힌 크기가 그대로
     남는 경우가 있다. 창이 실제 크기를 갖게 되면 스스로 다시 잡는다. */
  if (!canvas.width && (window.innerWidth | 0) > 0) applyOrientation();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);"""


def main():
    os.chdir(BASE)
    done, skip = 0, []
    for f in sorted(glob.glob('*.html')):
        s = io.open(f, encoding='utf-8').read()
        m = re.search(r'function loop\(t\)\{(.*?)\n\}\nrequestAnimationFrame\(loop\);',
                      s, re.S)
        if not m:
            continue
        if 'function frame(t)' in s:
            skip.append(f + ' (이미 고침)')
            continue
        body = m.group(1)
        # 본문 맨 끝의 재예약 한 줄만 떼어 낸다 — 나머지는 손대지 않는다
        nb, n = re.subn(r'\n\s*requestAnimationFrame\(loop\);\s*(?=$)', '', body)
        if n != 1:
            skip.append(f + ' (본문 끝 rAF를 못 찾음)')
            continue
        new = 'function frame(t){' + nb + '\n}\n\n' + WRAP
        io.open(f, 'w', encoding='utf-8').write(s[:m.start()] + new + s[m.end():])
        done += 1
    print('루프에 안전망 붙인 챕터: %d개' % done)
    for x in skip:
        print('  건너뜀:', x)


if __name__ == '__main__':
    main()
