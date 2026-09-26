#!/usr/bin/env python3
"""앱 시작 화면(스플래시)과 안드로이드 아이콘을 게임 그림으로 만든다.

왜 (2026-09-27 시뮬레이터 점검)
 - iOS 시작 화면이 Capacitor 기본 그림(흰 바탕에 파란 X 로고)이었다. 앱을 켤 때마다
   게임과 상관없는 로고가 잠깐 보였다. ios/ 는 저장소에 안 올라가서 여태 몰랐다.
 - 안드로이드는 `npx cap add android`로 새로 만든 탓에 아이콘·시작 화면이 전부 기본값이었다.

하는 일(여러 번 돌려도 같은 결과)
 - 시작 화면: 어두운 바탕(#0a0806, 프롤로그 첫 화면과 같은 색) 가운데에 제목 글씨(title_logo.png)
   · iOS  : ios/App/App/Assets.xcassets/Splash.imageset/ 의 2732×2732 세 장
   · 안드로이드: res/drawable*/splash.png — 원래 있던 크기 그대로 다시 그린다
 - 안드로이드 아이콘: iOS 앱 아이콘(1024)에서 mipmap 5단계 + 적응형 아이콘 전경·배경색
실행: python3 scripts/make_launch_assets.py   (android/ 가 없으면 iOS만)"""
import glob, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = (10, 8, 6)
LOGO = Image.open(os.path.join(ROOT, 'www/assets/title_logo.png')).convert('RGBA')
# 제목 그림 가장자리에 아주 옅은 금빛 안개(알파 1~20)가 깔려 있어, 까만 바탕에선 네모 테두리가 비쳤다 → 걷어 낸다
LOGO.putalpha(LOGO.getchannel('A').point(lambda v: 0 if v < 24 else v))
ICON = Image.open(os.path.join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')).convert('RGBA')
ICON_BG = '#1B1223'   # 아이콘 가장자리 색 — 적응형 아이콘이 모양대로 잘려도 이어져 보이게


def splash(w, h):
    """가로 화면 기준: 제목이 짧은 변의 약 40% 높이가 아니라, 가로로 보이는 너비의 45%쯤."""
    im = Image.new('RGB', (w, h), BG)
    # 정사각(iOS)은 aspectFill로 가로 화면 비율(약 2.17:1)만큼만 보인다 → 보이는 폭 = w
    lw = int(min(w, h * 2.17) * 0.42)
    lh = int(LOGO.height * lw / LOGO.width)
    lg = LOGO.resize((lw, lh), Image.LANCZOS)
    im.paste(lg, ((w - lw) // 2, (h - lh) // 2), lg)
    return im


done = []
# iOS
for p in glob.glob(os.path.join(ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset/splash-*.png')):
    w, h = Image.open(p).size
    splash(w, h).save(p, optimize=True)
    done.append(os.path.relpath(p, ROOT))

RES = os.path.join(ROOT, 'android/app/src/main/res')
if os.path.isdir(RES):
    for p in glob.glob(os.path.join(RES, 'drawable*/splash.png')):
        w, h = Image.open(p).size
        splash(w, h).save(p, optimize=True)
        done.append(os.path.relpath(p, ROOT))
    # 아이콘: 옛 방식(네모·동그라미)과 적응형 전경
    LEGACY = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    for d, s in LEGACY.items():
        folder = os.path.join(RES, 'mipmap-' + d)
        if not os.path.isdir(folder): continue
        sq = ICON.resize((s, s), Image.LANCZOS)
        sq.save(os.path.join(folder, 'ic_launcher.png'))
        mask = Image.new('L', (s * 4, s * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
        rd = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        rd.paste(sq, (0, 0), mask.resize((s, s), Image.LANCZOS))
        rd.save(os.path.join(folder, 'ic_launcher_round.png'))
        # 적응형: 108dp 캔버스 중 가운데 72dp가 보인다(모양 마스크). 그림을 그 72dp에 꽉 채운다.
        fs = s * 108 // 48
        inner = s * 72 // 48
        fg = Image.new('RGBA', (fs, fs), (0, 0, 0, 0))
        fg.paste(ICON.resize((inner, inner), Image.LANCZOS), ((fs - inner) // 2, (fs - inner) // 2))
        fg.save(os.path.join(folder, 'ic_launcher_foreground.png'))
        done.append('mipmap-' + d)
    bgx = os.path.join(RES, 'values/ic_launcher_background.xml')
    open(bgx, 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">{ICON_BG}</color>\n</resources>\n')
print('만든 것:', len(done), '개\n ' + '\n '.join(done))
