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

DIRS = ['assets/tools', 'assets/tiles', 'assets/tiles_gemini', 'assets/props', 'assets/map', 'data/chapters', 'css']
FILES = ['ch0_phaser.html', 'js/main.js', 'data/chapters_index.json']  # js·css·data/chapters = 첫 프로토타입, 어느 페이지도 안 부른다


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
        if who and who != f and not who.startswith('js' + os.sep):   # js/main.js는 같이 지우는 프로토타입
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
    freed += prune_unused_and_junk()
    freed += shrink_images()
    for base, dirs, files in os.walk(PUB, topdown=False):   # 덜어내고 빈 폴더
        if base != PUB and not os.listdir(base):
            os.rmdir(base)
    print('  덜어낸 합계 %.1fMB' % (freed / 1048576))
    tot = size(PUB) / 1048576
    print('  번들 %.1fMB' % tot)
    return 0


# ---------------------------------------------------------------------------
# 2026-09-18 추가 — "앱에 불필요한 파일이 섞이지 않았는지, 용량 줄일 수 있으면 줄여"
# 번들의 모든 파일을 게임 코드가 부르는지 이름으로 대조해서 찾은 것들.
# 동적으로 이름을 만들어 부르는 것(초상 _smile·_atk, 신분별 걷기 그림 등)은
# 이름 대조에 안 걸리므로 손으로 확인한 뒤 여기 적었다. 지우기 전에 한 번 더
# referenced()로 확인한다 — 나중에 쓰이기 시작하면 알아서 남는다.
UNUSED = [
    'assets/portraits/npc_sheet_v2.png', 'assets/portraits/npc_sheet_v3.png',
    'assets/portraits/npc_sheet_magenta.png',          # NPC 초상을 오려 낸 원본 시트
    'assets/scenes/ch0_scene_raw.webp', 'assets/scenes/ch0_scene_v2_raw.webp',  # 0화 배경 원본
    'assets/portraits/samil.png', 'assets/portraits/anyongbok.png', 'assets/portraits/suyang.png',
    'assets/portraits/extra_eobu.png', 'assets/portraits/extra_sanyang.png',
    'assets/portraits/extra_musa0.png', 'assets/portraits/extra_yeo.png',
    'assets/portraits/extra_yeoin0.png', 'assets/portraits/josik2.png',
    'assets/portraits/commoner2.png', 'assets/icons/exam_btn.png',
]
JUNK_NAMES = ('.DS_Store',)


def prune_unused_and_junk():
    freed = 0
    for rel in UNUSED:
        p = os.path.join(PUB, rel)
        if not os.path.exists(p):
            continue
        stem = os.path.splitext(os.path.basename(rel))[0]
        who = referenced(stem)
        if who:
            print('  남김 %-40s ← %s 가 쓴다' % (rel, who))
            continue
        freed += size(p)
        os.remove(p)
    for base, dirs, files in os.walk(PUB, topdown=False):
        for f in files:
            if f in JUNK_NAMES or f.endswith('.pyc'):
                p = os.path.join(base, f)
                freed += size(p)
                os.remove(p)
        for d in dirs:
            if d == '__pycache__':
                p = os.path.join(base, d)
                freed += size(p)
                shutil.rmtree(p, ignore_errors=True)
    print('  덜어냄 안 쓰는 그림·찌꺼기   %6.1fMB' % (freed / 1048576))
    return freed


# PNG를 256색 팔레트로 줄인다(알파 유지). 초상 324장이 24.1MB → 4.9MB였고,
# 나란히 놓고 봐도 구분이 거의 안 됐다(2026-09-18 확인). 배지는 화면에 44px로만
# 나오는데 원본이 900px·1MB라 먼저 384px로 줄인다.
# **번들에서만** 한다 — www(웹·원본)는 그대로 둔다.
SHRINK_DIRS = ['assets/portraits', 'assets/boss', 'assets/player', 'assets/companions',
               'assets/items', 'assets/mascots', 'assets/icons']
BADGE_MAX = 384


def shrink_images():
    try:
        from PIL import Image
    except ImportError:
        print('  (Pillow 없음 — 그림 줄이기 건너뜀)')
        return 0
    import io
    freed = 0
    for d in SHRINK_DIRS:
        for base, _dirs, files in os.walk(os.path.join(PUB, d)):
            for f in files:
                if not f.lower().endswith('.png'):
                    continue
                p = os.path.join(base, f)
                before = os.path.getsize(p)
                try:
                    im = Image.open(p)
                    im.load()
                    im = im.convert('RGBA')
                    if f.startswith('badge_') and max(im.size) > BADGE_MAX:
                        r = BADGE_MAX / max(im.size)
                        im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
                    q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE,
                                    dither=Image.Dither.FLOYDSTEINBERG)
                    buf = io.BytesIO()
                    q.save(buf, 'PNG', optimize=True)
                    if buf.tell() < before:
                        open(p, 'wb').write(buf.getvalue())
                        freed += before - buf.tell()
                except Exception as e:
                    print('  (줄이기 실패 %s: %s)' % (f, e))
    print('  그림 줄이기(256색·배지 384px) %6.1fMB' % (freed / 1048576))
    return freed


if __name__ == '__main__':
    sys.exit(main())
