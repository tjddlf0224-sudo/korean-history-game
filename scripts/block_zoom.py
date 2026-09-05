# -*- coding: utf-8 -*-
"""확대(핀치줌·더블탭줌)가 새는 구멍을 막는다.

   제보: "또 확대되네… 확대 안 되게 막는 건 안 되는거야?"
        "새로고침을 눌러도 확대가 안 풀리네."

   먼저 알아 둘 것 — meta 태그로는 안 된다
   iOS Safari는 접근성 정책상 viewport meta의 user-scalable=no 와
   maximum-scale 을 **무시한다**(iOS 10부터). 그래서 JS로 막아야 한다.
   이미 세 겹이 걸려 있었다:
     ① gesturestart/change/end preventDefault   (37개 전부)
     ② touchmove 에서 손가락 2개면 preventDefault (37개 전부)
     ③ touchend 300ms 안에 두 번이면 preventDefault(더블탭) (37개 전부)

   빠져 있던 것
     ④ **touchstart 에서 손가락 2개면 preventDefault** — 0개.
        touchmove 만 막으면 두 손가락이 *닿는 순간*은 통과한다. 기기에 따라
        그때 이미 확대가 시작된다. 이게 가장 큰 구멍이다.
     ⑤ viewport 에 shrink-to-fit=no — 0개.
     ⑥ html 에 -webkit-text-size-adjust:100% — 3개뿐.
        (없으면 사파리가 글자 크기를 제멋대로 키워 레이아웃이 밀린다)

   막지 못하는 것 — 정직하게 적어 둔다
   사파리 주소창의 AA 메뉴에서 켠 **페이지 확대**나, 설정 →
   손쉬운 사용 → 확대/축소는 **웹페이지가 어떤 수단으로도 못 막는다.**
   그건 사이트별로 저장되어 새로고침해도 안 풀린다. 그 경우는
   AA 메뉴에서 100%로 되돌려야 한다.

   손대지 않는 것
   개인정보처리방침처럼 글만 있는 페이지는 그대로 둔다 — 글을 읽는
   페이지에서 확대를 막으면 그건 접근성을 해치는 짓이다.

   쓰는 법
     python3 scripts/block_zoom.py
"""
import glob
import io
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

# 이 코드가 있는 페이지 = 게임 화면. 글만 있는 페이지에는 안 넣는다.
ANCHOR = """document.addEventListener('touchmove', function(e){
  if (e.touches.length > 1) e.preventDefault();          // 두 손가락 = 핀치
}, { passive: false });"""

ADD_JS = """document.addEventListener('touchstart', function(e){
  // touchmove만 막으면 두 손가락이 **닿는 순간**은 통과한다. 기기에 따라
  // 그때 이미 확대가 시작돼 되돌릴 수 없었다(실제 제보). 시작부터 막는다.
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
""" + ANCHOR

OLD_META = ('<meta name="viewport" content="width=device-width, initial-scale=1.0, '
            'maximum-scale=1.0, user-scalable=no, viewport-fit=cover">')
NEW_META = ('<meta name="viewport" content="width=device-width, initial-scale=1.0, '
            'maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover">')

OLD_HTML_CSS = '  html, body { margin: 0; padding: 0;'
NEW_HTML_CSS = ('  /* 사파리가 글자 크기를 제멋대로 키워 레이아웃을 밀지 않게 한다 */\n'
                '  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }\n'
                '  html, body { margin: 0; padding: 0;')


def main():
    os.chdir(BASE)
    files = [f for f in sorted(glob.glob('*.html'))
             if ANCHOR in io.open(f, encoding='utf-8').read()]
    print('게임 화면 %d개를 손본다' % len(files))

    n_js = n_meta = n_css = 0
    for f in files:
        s = io.open(f, encoding='utf-8').read()
        o = s

        if "touchstart', function(e){\n  // touchmove만" not in s:
            s = s.replace(ANCHOR, ADD_JS, 1); n_js += 1
        if OLD_META in s:
            s = s.replace(OLD_META, NEW_META, 1); n_meta += 1
        if 'text-size-adjust' not in s and OLD_HTML_CSS in s:
            s = s.replace(OLD_HTML_CSS, NEW_HTML_CSS, 1); n_css += 1

        if s != o:
            io.open(f, 'w', encoding='utf-8').write(s)

    print('④ touchstart 다중 터치 차단 : %d개' % n_js)
    print('⑤ shrink-to-fit=no          : %d개' % n_meta)
    print('⑥ text-size-adjust:100%%     : %d개' % n_css)

    # 안 건드린 페이지를 밝혀 둔다
    rest = [f for f in sorted(glob.glob('*.html')) if f not in files]
    print('\n손대지 않은 페이지(글 읽는 곳 — 확대를 막으면 안 된다):')
    print('  ' + ', '.join(rest) if rest else '  없음')


if __name__ == '__main__':
    main()
