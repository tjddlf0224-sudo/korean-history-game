# -*- coding: utf-8 -*-
"""뷰포트가 0으로 잡히면 화면이 검게 굳던 것을 막는다.

   무엇이 잘못돼 있었나
       function getViewportSize(){
         const vv = window.visualViewport;
         if (vv && (vv.scale || 1) <= 1.01) return { w: vv.width, h: vv.height };
         return { w: window.innerWidth, h: window.innerHeight };
       }

   화면이 숨겨진 채 페이지가 열리면 visualViewport가 0×0을 준다.
   그 값이 applyOrientation()에 그대로 들어가면 두 가지가 한꺼번에 어긋난다:
     ① canvas.width = 0 → 아무것도 안 그려진다(검은 화면).
     ② portrait = (0 > 0) = false → body.rot 이 벗겨져 세로 모드가 풀린다.

   0은 '아직 모른다'는 뜻이므로 값으로 받아들이지 않는다. 다음 순서로 물러난다:
     visualViewport → window.inner* → documentElement.client* → screen
   전부 0이면 아예 손대지 않는다(예전 크기를 지키는 편이 0으로 뭉개는 것보다 낫다).

   쓰는 법
     python3 scripts/guard_viewport.py
"""
import io, glob, os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

OLD = """function getViewportSize(){
  const vv = window.visualViewport;
  // 핀치줌이 걸리면 vv.width/height가 확대 배율만큼 줄어든다. 그 값을 그대로 쓰면
  // #wrap이 축소되면서 화면이 "확대된 채로" 굳어 되돌릴 수 없었다(실제 발생).
  // 줌이 걸린 동안은 레이아웃 뷰포트를 써서 레이아웃이 줌을 따라가지 않게 한다.
  if (vv && (vv.scale || 1) <= 1.01) return { w: vv.width, h: vv.height };
  return { w: window.innerWidth, h: window.innerHeight };
}"""

NEW = """function getViewportSize(){
  const vv = window.visualViewport;
  // 핀치줌이 걸리면 vv.width/height가 확대 배율만큼 줄어든다. 그 값을 그대로 쓰면
  // #wrap이 축소되면서 화면이 "확대된 채로" 굳어 되돌릴 수 없었다(실제 발생).
  // 줌이 걸린 동안은 레이아웃 뷰포트를 써서 레이아웃이 줌을 따라가지 않게 한다.
  //
  // 0은 값이 아니라 "아직 모른다"는 뜻이다. 화면이 숨겨진 채 페이지가 열리면
  // visualViewport가 0×0을 주는데, 그 값이 그대로 들어가면 canvas.width가 0이 돼
  // 아무것도 안 그려지고(검은 화면), portrait 판정(0 > 0 = false)까지 뒤집혀
  // 세로 모드가 풀린다. 그래서 0이면 다음 것으로 물러난다.
  const cands = [];
  if (vv && (vv.scale || 1) <= 1.01) cands.push([vv.width, vv.height]);
  cands.push([window.innerWidth, window.innerHeight]);
  const de = document.documentElement;
  if (de) cands.push([de.clientWidth, de.clientHeight]);
  if (window.screen) cands.push([screen.width, screen.height]);
  for (const [w, h] of cands) if (w > 0 && h > 0) return { w, h };
  return null;   // 전부 0 — 예전 크기를 그대로 둔다
}"""

OLD_CALL = """  const { w: iw, h: ih } = getViewportSize();
  const portrait = ih > iw;"""

NEW_CALL = """  const vp = getViewportSize();
  if (!vp) return;          // 크기를 모르는 동안은 손대지 않는다
  const { w: iw, h: ih } = vp;
  const portrait = ih > iw;"""


def main():
    os.chdir(BASE)
    done, skip = 0, []
    for f in sorted(glob.glob('*.html')):
        s = io.open(f, encoding='utf-8').read()
        if 'function getViewportSize()' not in s:
            continue
        if 'cands.push' in s:
            skip.append(f + ' (이미 고침)')
            continue
        if OLD not in s:
            skip.append(f + ' (getViewportSize 본문이 다르다)')
            continue
        if OLD_CALL not in s:
            skip.append(f + ' (호출부가 다르다)')
            continue
        s = s.replace(OLD, NEW, 1).replace(OLD_CALL, NEW_CALL, 1)
        io.open(f, 'w', encoding='utf-8').write(s)
        done += 1
    print('뷰포트 0 방어 붙인 챕터: %d개' % done)
    for x in skip:
        print('  건너뜀:', x)


if __name__ == '__main__':
    main()
