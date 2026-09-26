#!/usr/bin/env python3
"""안드로이드 네이티브 설정 — `npx cap add android` 직후(또는 android/를 새로 만든 뒤) 한 번 돌린다.

android/ 폴더는 .gitignore라 저장소에 안 남는다. 그래서 손으로 고친 설정이 날아가지 않게
여기에 모아 둔다. 여러 번 돌려도 같은 결과(이미 들어가 있으면 건너뜀).

왜 (2026-09-27 안드로이드 에뮬레이터 점검에서 확인)
 1. AdMob 앱 ID가 매니페스트에 없으면 **JS가 뜨기도 전에 앱이 바로 죽는다**
    (MobileAdsInitProvider: "Missing application ID"). 보카바리스타에서도 같은 사고가 있었다.
    ⚠️ 지금 값은 Google 공식 '테스트' 앱 ID다. 한국사 게임 안드로이드 앱을 AdMob에 등록해
    실제 앱 ID(ca-app-pub-7418287954060066~XXXX)를 받으면 아래 ADMOB_APP_ID를 바꾸고,
    www/assets/ads.js 의 REAL.android 광고단위도 새로 받은 것으로 채운 뒤 TEST_ON.android를 false로.
 2. iOS는 가로 전용이다. 안드로이드도 가로(양방향)로 고정한다 — 세로로 들면 화면이 무너진다.
 3. 상태 표시줄·내비게이션 바가 늘 떠 있어서(흰 띠) 게임 화면이 위아래로 약 20%씩 줄었다.
    iOS처럼 전체 화면으로 쓴다 — 가장자리에서 쓸어내리면 잠깐 나타난다. 카메라 구멍 쪽
    빈 띠는 게임 배경과 어울리게 검게(테마 windowBackground — decor만 칠하면 SystemBars가 흰색으로 되돌린다).
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAN = os.path.join(ROOT, 'android/app/src/main/AndroidManifest.xml')
ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713'   # Google 공식 테스트 앱 ID — 출시 전 교체

if not os.path.exists(MAN):
    sys.exit('android/ 가 없다 — 먼저 npx cap add android')
t = open(MAN, encoding='utf-8').read()
changed = []

if 'com.google.android.gms.ads.APPLICATION_ID' not in t:
    meta = ('\n        <!-- AdMob 앱 ID: 없으면 시작하자마자 죽는다. 지금은 Google 테스트 ID — 출시 전 교체'
            ' (scripts/android_setup.py 참고) -->\n'
            '        <meta-data\n'
            '            android:name="com.google.android.gms.ads.APPLICATION_ID"\n'
            f'            android:value="{ADMOB_APP_ID}" />\n    </application>')
    t = t.replace('\n    </application>', meta, 1)
    changed.append('AdMob APPLICATION_ID')

if 'android:screenOrientation' not in t:
    t = t.replace('android:name=".MainActivity"',
                  'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"', 1)
    changed.append('가로 고정')

open(MAN, 'w', encoding='utf-8').write(t)

# 카메라 구멍 쪽 빈 띠: Capacitor SystemBars가 창 배경을 테마의 windowBackground(흰색)로 되돌린다
# (setStyle). decor에 검정을 칠해도 덮어써져 흰 띠가 남았다 → 테마 자체를 검정으로.
STY = os.path.join(ROOT, 'android/app/src/main/res/values/styles.xml')
s = open(STY, encoding='utf-8').read()
if 'android:windowBackground' not in s:
    s = s.replace('<item name="windowActionBar">false</item>',
                  '<item name="windowActionBar">false</item>\n        <item name="android:windowBackground">@android:color/black</item>', 1)
    open(STY, 'w', encoding='utf-8').write(s)
    changed.append('창 배경 검정')
# 안드로이드 12+ 시작 화면(SplashScreen API)은 아이콘 + 배경색만 쓴다. 배경을 시작 그림과 같은 먹색으로.
# (그림·아이콘 자체는 scripts/make_launch_assets.py 가 만든다)
s = open(STY, encoding='utf-8').read()
if 'windowSplashScreenBackground' not in s:
    s = s.replace('<item name="android:background">@drawable/splash</item>',
                  '<item name="android:background">@drawable/splash</item>\n        <item name="windowSplashScreenBackground">#0A0806</item>', 1)
    open(STY, 'w', encoding='utf-8').write(s)
    changed.append('시작 화면 배경색')

ACT = os.path.join(ROOT, 'android/app/src/main/java/com/yunsis/koreanhistorygame/MainActivity.java')
act = open(ACT, encoding='utf-8').read()
if 'hideSystemBars' not in act:
    act = """package com.yunsis.koreanhistorygame;

import android.graphics.Color;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/* 전체 화면(iOS와 같게) — scripts/android_setup.py가 쓴다. 손으로 고치면 다시 돌릴 때 사라지지 않게 그 파일도 고칠 것. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();   // 광고·키보드·잠깐 나타났던 바가 사라진 뒤 다시 숨긴다
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }
}
"""
    open(ACT, 'w', encoding='utf-8').write(act)
    changed.append('전체 화면(MainActivity)')
print('바꾼 것:', ', '.join(changed) if changed else '없음(이미 적용됨)')

# 아이콘·시작 그림(기본값이면 Capacitor 로고가 나온다)
import subprocess
subprocess.run([sys.executable, os.path.join(ROOT, 'scripts/make_launch_assets.py')], check=True)
