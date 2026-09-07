# -*- coding: utf-8 -*-
"""시대별 영역을, 이미 있는 지도 도해에 얹는다.

   왜 새 지도를 만들지 않고 얹나
   - 챕터의 지도는 대부분 **지점 하나**를 찍는 것이다(중원고구려비가 어디인가).
     그 자리에 그 시대의 영역까지 칠하면, "비석이 저기 있다"와 "그때 나라가
     여기까지였다"를 한 그림에서 함께 읽는다. 도해를 하나 더 늘리지 않는다.
   - 대사는 건드리지 않는다. chart의 areas만 더한다.

   경계의 근거는 iCloud
   `앱 개발/한국사 게임/참고자료/역사지도/역사지도_자료.md` 에 출처와 함께 있다.
   좌표는 scripts/build_era_maps.py 가 실제 위경도에서 찍어 낸다.

   chart.js가 영역을 육지로 잘라 내므로(clip-path) 바다로 넘겨 그려도 된다.

   쓰는 법
     python3 scripts/apply_era_maps.py            # 무엇이 바뀌는지 본다
     python3 scripts/apply_era_maps.py --apply
"""
import argparse
import io
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_era_maps import ERAS, js_areas

WWW = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

# (챕터, 지도 제목, 넣을 영역, 짧은 메모)
JOBS = [
    ('godae1.html', '근초고왕의 정복', 'baekje_geunchogo',
     '371년 최대 영역 — 남 영산강 · 동 낙동강 서쪽 · 북 대방고지'),
    ('godae1.html', '중원(충주) 고구려비', 'goguryeo_jangsu',
     '장수왕 남진 — 남 아산만·남양만~죽령. 이 비석이 그 증거다'),
    ('godae2.html', '발해가 일어난 자리', 'nambukguk',
     '남북국 — 발해 북 흑룡강·동 연해주, 신라 북계 대동강~원산만'),
    ('ch2b.html', '국경을 새로 긋다', 'joseon_bukbang',
     '4군 6진으로 압록강~두만강 선을 확보'),
    ('goryeo2.html', '강동 6주', 'goryeo_gangdong',
     '서희의 강동 6주 — 압록강 하류 동쪽 280리. 그 전 서북 경계는 청천강이었다'),
]


def find_chart(s, title):
    """그 제목을 가진 map 도해의 'type:'map'' 위치를 찾는다."""
    for m in re.finditer(r"chart:\{ type:'map',", s):
        # 이 도해가 닫히는 자리까지 훑어 제목을 확인한다
        seg = s[m.start():m.start() + 900]
        tm = re.search(r"title:'([^']*)'", seg)
        if tm and tm.group(1) == title:
            return m
    return None


def insert_areas(s, title, key, memo):
    m = find_chart(s, title)
    if not m:
        return s, '지도를 못 찾음'
    seg_start = m.end()
    if s[seg_start:seg_start + 400].find('areas:') >= 0:
        return s, '이미 영역이 있음'
    body = js_areas(ERAS[key])
    ins = ('\n          /* %s\n'
           '             근거: 참고자료/역사지도/역사지도_자료.md (출처 URL 포함)\n'
           '             좌표: scripts/build_era_maps.py 가 실제 위경도에서 찍는다.\n'
           '             바다로 넘겨 그려도 chart.js가 육지로 잘라 낸다. */\n'
           '          %s' % (memo, body))
    return s[:seg_start] + ins + s[seg_start:], None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    a = ap.parse_args()
    os.chdir(WWW)

    for ch, title, key, memo in JOBS:
        if title is None or key not in ERAS:
            print('%-14s %-22s → 건너뜀(영역 정의가 아직 없다)' % (ch, title or '-'))
            continue
        s = io.open(ch, encoding='utf-8').read()
        s2, err = insert_areas(s, title, key, memo)
        if err:
            print('%-14s %-22s → %s' % (ch, title, err)); continue
        print('%-14s %-22s → 영역 %d개 넣음' % (ch, title, len(ERAS[key])))
        if a.apply:
            io.open(ch, 'w', encoding='utf-8').write(s2)
    if not a.apply:
        print('\n--apply 를 주면 실제로 넣는다.')


if __name__ == '__main__':
    main()
