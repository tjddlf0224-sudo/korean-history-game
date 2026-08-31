#!/usr/bin/env python3
"""iOS 네이티브 프로젝트에 우리 설정을 다시 입힌다.

왜 스크립트인가
  `ios/` 폴더는 .gitignore에 있다(원래 그렇게 잡혀 있었다). 그래서 Info.plist를
  손으로 고쳐 두면 `npx cap add ios`를 다시 할 때 통째로 사라진다.
  손으로 고친 것을 기억에 의존하지 않도록, 고칠 내용을 여기 적어 두고 돌린다.

  npx cap add ios  뒤에는 **반드시** 이걸 돌릴 것:
      python3 www/assets/tools/ios_setup.py

무엇을 하나
  1) 가로 모드로만 돌게 잠근다.
     이 게임은 가로 전용이다. 웹에서는 화면이 세로면 CSS로 90도 돌려
     보여 주는데(index.html의 `classList.toggle('rot', portrait)`),
     앱에서는 iOS가 직접 돌리는 편이 낫다 — 상태바·안전영역이 제자리를
     찾고, 회전 코드를 아예 안 타게 된다.
  2) 아이패드도 같이 잠근다(~ipad 키를 안 고치면 아이패드에서만 세로가 열린다).
  3) 구글 로그인용 URL 스킴을 넣는다.
     GoogleService-Info.plist 의 REVERSED_CLIENT_ID 를 Info.plist 의
     CFBundleURLSchemes 에 넣어야 구글 로그인 창이 앱으로 되돌아온다.
     이걸 빠뜨리면 로그인 창은 뜨는데 끝나고 앱으로 안 돌아온다.
     GoogleService-Info.plist 가 아직 없으면 이 단계는 건너뛴다.

같은 값이 이미 들어 있으면 아무것도 하지 않는다(여러 번 돌려도 안전).
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
PLIST = os.path.join(ROOT, 'ios', 'App', 'App', 'Info.plist')

LANDSCAPE = ('<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n'
             '\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>')


def set_array(s, key, value):
    """<key>…</key> 다음에 오는 <array>를 통째로 갈아 끼운다."""
    pat = re.compile(r'(<key>' + re.escape(key) + r'</key>\s*)<array>.*?</array>', re.S)
    if not pat.search(s):
        return s, False
    new = pat.sub(lambda m: m.group(1) + value, s, count=1)
    return new, new != s


GSI = os.path.join(ROOT, 'ios', 'App', 'App', 'GoogleService-Info.plist')

URL_TYPES = """<key>CFBundleURLTypes</key>
\t<array>
\t\t<dict>
\t\t\t<key>CFBundleURLSchemes</key>
\t\t\t<array>
\t\t\t\t<string>%s</string>
\t\t\t</array>
\t\t</dict>
\t</array>
\t"""


def add_google_scheme(s):
    """GoogleService-Info.plist 의 REVERSED_CLIENT_ID 를 URL 스킴으로 넣는다."""
    if not os.path.exists(GSI):
        return s, 'GoogleService-Info.plist 가 없어 건너뜀 (구글 로그인 준비 전)'
    g = open(GSI, encoding='utf-8').read()
    m = re.search(r'<key>REVERSED_CLIENT_ID</key>\s*<string>([^<]+)</string>', g)
    if not m:
        return s, 'REVERSED_CLIENT_ID 를 못 찾음 — GoogleService-Info.plist 를 확인하라'
    scheme = m.group(1)
    if scheme in s:
        return s, '이미 들어 있음: ' + scheme
    if '<key>CFBundleURLTypes</key>' in s:
        return s, ('CFBundleURLTypes 가 이미 있다 — 손으로 확인할 것. 넣을 값: ' + scheme)
    # 최상위 dict의 첫 key 앞에 끼워 넣는다
    m2 = re.search(r'(<dict>\s*\n\t)', s)
    if not m2:
        return s, 'Info.plist 모양이 예상과 달라 못 넣음'
    return s[:m2.end(1)] + (URL_TYPES % scheme) + s[m2.end(1):], '넣음: ' + scheme


def main():
    if not os.path.exists(PLIST):
        sys.exit('ios 프로젝트가 없다. 먼저 `npx cap add ios` 를 하라.\n  ' + PLIST)

    s = open(PLIST, encoding='utf-8').read()
    changed = []
    for key in ('UISupportedInterfaceOrientations',
                'UISupportedInterfaceOrientations~ipad'):
        s, did = set_array(s, key, LANDSCAPE)
        if did:
            changed.append(key)

    s, note = add_google_scheme(s)

    if changed:
        print('가로 모드로 잠갔다:', ', '.join(changed))
    else:
        print('이미 가로 전용이다 — 바꿀 것 없음')
    print('구글 로그인 URL 스킴:', note)
    open(PLIST, 'w', encoding='utf-8').write(s)

    # 확인해서 보여 준다
    for key in ('UISupportedInterfaceOrientations',
                'UISupportedInterfaceOrientations~ipad'):
        m = re.search(r'<key>' + re.escape(key) + r'</key>\s*(<array>.*?</array>)', s, re.S)
        got = re.findall(r'UIInterfaceOrientation(\w+)', m.group(1)) if m else []
        print(f'  {key}: {got or "키 없음"}')


if __name__ == '__main__':
    main()
