#!/usr/bin/env python3
"""앱 번들(ios/App/App/public)에서 **게임이 안 쓰는 것**을 덜어낸다.

왜 이렇게 하나
  앱스토어 용량은 작을수록 좋다. 그런데 지우고 싶은 것들(도구 스크립트, 타일
  원본, 죽은 프로토타입)은 **저장소에는 남겨야 한다** — 그림을 다시 만들 때
  쓰는 입력이기 때문이다.
  그래서 `www/`는 그대로 두고, 번들로 복사된 사본에서만 덜어낸다.

  `npx cap sync` 는 www 를 통째로 복사하므로, **sync 뒤에 이걸 돌려야 한다.**
  npm run sync 가 알아서 이어서 돌린다.

무엇을 덜어내나 (전부 '게임이 실행 중에 안 여는 것'만)
  · assets/tools, assets/tiles, assets/tiles_gemini, assets/props, assets/map
      → 그림을 만들 때 쓰는 원본과 파이썬 도구. 게임 코드가 참조하지 않는다.
  · *.py, *.md
      → 번들에 들어갈 이유가 없다.
  · ch0_phaser.html
      → 어디서도 링크되지 않는 죽은 프로토타입(챕터 목록에도 없다).
  · _smoke.html, _bosstest.html 같은 앞에 _ 붙은 시험용 페이지

덜어내기 전에 **정말 참조가 없는지 다시 확인**한다. 목록을 손으로 적어 두면
언젠가 쓰이기 시작한 것을 모르고 지우게 된다.
"""
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'www')
PUB = os.path.join(ROOT, 'ios', 'App', 'App', 'public')

DIRS = ['assets/tools', 'assets/tiles', 'assets/tiles_gemini', 'assets/props', 'assets/map']
FILES = ['ch0_phaser.html']


def referenced(name):
    """게임 코드(html·js)가 이 이름을 **실제로 불러오는가**.

    주석에 적힌 것은 세지 않는다. 처음엔 이름만 찾았더니 goryeo1.html 의
    `// assets/tools/place_npcs.py 로 …` 라는 **주석** 때문에 도구 폴더를
    남겨 버렸다. src=/href=/url()/따옴표 안에 든 것만 진짜 참조로 본다.
    """
    e = re.escape(name)
    # 줄바꿈을 넘지 못하게 한다. 안 그러면 앞줄의 따옴표와 이어 붙어
    # 다음 줄 주석까지 '참조'로 잡힌다(실제로 그렇게 잡혔다).
    pat = re.compile(r"""(?:src\s*=\s*["']|href\s*=\s*["']|url\(\s*["']?|["'])[^"'()\n]*""" + e)
    for base, _dirs, files in os.walk(WWW):
        # 도구 폴더끼리 서로 참조하는 건 세지 않는다
        if any(d.replace('/', os.sep) in base for d in DIRS):
            continue
        for f in files:
            if not f.endswith(('.html', '.js')):
                continue
            try:
                if pat.search(open(os.path.join(base, f), encoding='utf-8',
                                   errors='ignore').read()):
                    return os.path.join(base, f)[len(WWW) + 1:]
            except Exception:
                pass
    return None


def size(path):
    if os.path.isfile(path):
        return os.path.getsize(path)
    t = 0
    for b, _d, fs in os.walk(path):
        for f in fs:
            try:
                t += os.path.getsize(os.path.join(b, f))
            except Exception:
                pass
    return t


def main():
    if not os.path.isdir(PUB):
        print('번들이 없다 — 먼저 npx cap sync ios')
        return 1
    freed = 0
    for d in DIRS:
        p = os.path.join(PUB, d)
        if not os.path.isdir(p):
            continue
        who = referenced(os.path.basename(d) + '/')
        if who:
            print('  남김 %-22s ← %s 가 쓴다' % (d, who))
            continue
        s = size(p)
        shutil.rmtree(p)
        freed += s
        print('  덜어냄 %-20s %6.1fMB' % (d, s / 1048576))
    for f in FILES:
        p = os.path.join(PUB, f)
        if not os.path.exists(p):
            continue
        who = referenced(f)
        if who and who != f:
            print('  남김 %-22s ← %s 가 링크한다' % (f, who))
            continue
        s = size(p)
        os.remove(p)
        freed += s
        print('  덜어냄 %-20s %6.1fMB' % (f, s / 1048576))
    # 앞에 _ 붙은 시험용 페이지와 문서·스크립트
    for base, _dirs, files in os.walk(PUB):
        for f in files:
            if f.startswith('_') and f.endswith('.html') or f.endswith(('.py', '.md')):
                p = os.path.join(base, f)
                s = size(p)
                os.remove(p)
                freed += s
    print('  덜어낸 합계 %.1fMB' % (freed / 1048576))
    tot = size(PUB) / 1048576
    print('  번들 %.1fMB' % tot)
    return 0


if __name__ == '__main__':
    sys.exit(main())
