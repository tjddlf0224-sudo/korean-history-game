#!/usr/bin/env python3
"""전 챕터 회귀 검사.

이 세션에서 실제로 터졌던 버그들을 그대로 검사 항목으로 만들었다.
새 챕터를 만들거나 틀을 고친 뒤에는 반드시 이걸 돌린다.

  python3 check_all.py

검사 항목과 그 근거가 된 실제 사고:
  문법            — 정규식 치환이 Dialog 뒷부분까지 먹어 파일이 깨진 적 있음
  공통 기능       — 0화만 DPR·화자색·다음목표·장소라벨·캐시 5가지가 빠져 있었음
  퀴즈 UI         — gaehang_ch2를 틀로 삼았다가 퀴즈 오버레이가 없는 걸 뒤늦게 발견
  링크            — ch0_phaser.html을 지웠더니 캐시된 index에서 404
  퀴즈 출처       — src를 손으로 적으면 틀리고, 틀려도 티가 안 남
  좌표 정합       — 배경을 바꾸고 배리어만 고쳤다가 도착 지점이 벽 안이라 갇힘
  그림 존재       — 없으면 오류가 아니라 '생성 대기' 목록으로 뽑는다
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.abspath(os.path.join(HERE, '..', '..'))

MUST_HAVE = {
    'DPR 대응': 'setTransform(dpr',
    '화자 색 구분': 'alt-speaker',
    '다음 목표': 'updateHudGoal',
    '장소 라벨': 'zone-label',
    '구역 배너': 'zone-banner',
    '캐시 무효화': 'ART_V',
    '확대 차단': 'gesturestart',
    '줌 폴백': 'vv.scale',
    '퀴즈 엔진': 'const Quiz = {',
    '퀴즈 UI': 'id="quiz-overlay"',
    '배경 폴백': '배경 그림 준비 중',
    'NPC 폴백': "drawCharacter(px, py, 'd', look)",
}

fails, warns = [], []


def chapters():
    out = []
    for f in sorted(os.listdir(WWW)):
        if not f.endswith('.html') or f in ('index.html',):
            continue
        s = open(os.path.join(WWW, f), encoding='utf-8').read()
        if 'const ZONES = {' in s and 'const World = {' in s:
            out.append((f, s))
    return out


def check_syntax(f, s):
    js = '\n;\n'.join(re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', s, re.S))
    p = '/tmp/_chk_all.js'
    open(p, 'w', encoding='utf-8').write(js)
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode:
        fails.append(f'{f}  문법 오류: {r.stderr.splitlines()[0][:70]}')


def check_features(f, s):
    missing = [name for name, needle in MUST_HAVE.items() if needle not in s]
    if missing:
        fails.append(f'{f}  공통 기능 누락: {", ".join(missing)}')


def check_quiz_src(f, s):
    total = len(re.findall(r"^\s*(?:\{ )?q: ?'", s, re.M))
    withsrc = len(re.findall(r'src:\s*\[', s))
    empty = len(re.findall(r'src:\s*\[\s*\]', s))
    if empty:
        fails.append(f'{f}  기출 출처가 빈 문항 {empty}개')
    if total and withsrc < total:
        warns.append(f'{f}  출처 없는 문항 {total - withsrc}개 (문항 {total})')
    return withsrc - empty


def check_assets(f, s):
    """그림 파일 존재 — 없으면 실패가 아니라 '생성 대기'."""
    need = set(re.findall(r"assets/(?:scenes|portraits)/[\w.\-]+\.png", s))
    miss = [p for p in need if not os.path.exists(os.path.join(WWW, p))]
    return miss


def check_links(f, s):
    for href in set(re.findall(r'href="([\w\-]+\.html)"', s)) | set(re.findall(r"href: '([\w\-]+\.html)'", s)):
        if not os.path.exists(os.path.join(WWW, href)):
            fails.append(f'{f}  깨진 링크: {href}')


def check_spawn_inside_barrier(f, s):
    """도착 지점·시작 지점이 배리어 안이면 갇힌다(4화에서 실제로 발생)."""
    zones = {}
    for m in re.finditer(r"^  (\w+): \{\n(?:.*\n)*?    exits: \[", s, re.M):
        zid = m.group(1)
        blk = s[m.start():m.end()]
        sp = re.search(r'spawn: \{ x: (\d+), y: (\d+) \}', blk)
        bars = [tuple(map(int, b)) for b in re.findall(
            r'\{ x0:(\d+), y0:(\d+), x1:(?:BG_W|(\d+)), y1:(?:BG_H|(\d+)) \}',
            blk.replace('BG_W', '1376').replace('BG_H', '768'))]
        zones[zid] = (tuple(map(int, sp.groups())) if sp else None, bars)
    pad = 16
    for zid, (sp, bars) in zones.items():
        if not sp:
            continue
        for b in bars:
            if b[0] - pad <= sp[0] <= b[2] + pad and b[1] - pad <= sp[1] <= b[3] + pad:
                fails.append(f'{f}  [{zid}] 시작 지점 {sp}이 배리어 {b} 안 — 갇힘')
    for m in re.finditer(r"to:'(\w+)', spawn:\{x:(\d+),y:(\d+)\}", s):
        zid, x, y = m.group(1), int(m.group(2)), int(m.group(3))
        if zid not in zones:
            fails.append(f'{f}  없는 구역으로 가는 출구: {zid}')
            continue
        for b in zones[zid][1]:
            if b[0] - pad <= x <= b[2] + pad and b[1] - pad <= y <= b[3] + pad:
                fails.append(f'{f}  [{zid}] 도착 지점 ({x},{y})이 배리어 {b} 안 — 갇힘')


def main():
    chs = chapters()
    print(f'챕터 {len(chs)}개 검사\n')
    allmiss, nq = set(), 0
    for f, s in chs:
        check_syntax(f, s)
        check_features(f, s)
        nq += check_quiz_src(f, s)
        check_links(f, s)
        check_spawn_inside_barrier(f, s)
        allmiss |= set(check_assets(f, s))
    idx = open(os.path.join(WWW, 'index.html'), encoding='utf-8').read()
    check_links('index.html', idx)
    listed = set(re.findall(r"href: '([\w\-]+\.html)'", idx))
    for f, _ in chs:
        if f not in listed:
            warns.append(f'{f}  챕터 목록(index)에 없음')

    print(f'퀴즈 총 {nq}문항 (출처 표기 완료)\n')
    if fails:
        print(f'■ 실패 {len(fails)}건')
        for x in fails:
            print('   ❌', x)
    else:
        print('■ 실패 0건 ✅')
    if warns:
        print(f'\n■ 경고 {len(warns)}건')
        for x in warns:
            print('   ⚠️ ', x)
    if allmiss:
        print(f'\n■ 아직 없는 그림 {len(allmiss)}개 (폴백으로 플레이는 됨)')
        for p in sorted(allmiss):
            print('   ·', p)
    print('\n※ 이건 파일 텍스트만 본다. 실제로 걸어서 NPC에 닿는지, 대사와 퀴즈가'
          '\n   끝까지 도는지는 브라우저에서 www/_smoke.html을 열어 확인할 것.')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
