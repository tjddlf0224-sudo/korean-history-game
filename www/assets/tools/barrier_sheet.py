#!/usr/bin/env python3
"""배리어를 재기 위한 눈금 얹은 배경 그림 만들기.

배경 그림 위에 100px 눈금과 좌표 숫자, NPC 자리, 시작 지점, 그리고 이미 적어
둔 배리어를 겹쳐 그린다. 이걸 보면서 스펙에 사각형을 적으면 눈대중이 줄어든다.

measure_barriers.py는 어두운 윤곽선으로 가구를 찾아 주는 도구라 실내 맵에
맞고, 이 도구는 야외 맵처럼 '어디까지가 걸어다닐 땅인가'를 사람이 보고
정해야 하는 경우에 쓴다.

  python3 barrier_sheet.py                 # 배리어 없는 챕터 전부
  python3 barrier_sheet.py imjin gaya      # 특정 챕터만
결과는 /tmp/bs_<챕터>.png
"""
import json
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.abspath(os.path.join(HERE, '..', '..'))
SPECS = os.path.join(HERE, 'specs')
BG_W, BG_H = 1376, 768


def sheet(spec, zone):
    src = os.path.join(WWW, zone['img'])
    im = (Image.open(src).convert('RGB').resize((BG_W, BG_H), Image.LANCZOS)
          if os.path.exists(src) else Image.new('RGB', (BG_W, BG_H), (40, 36, 30)))
    d = ImageDraw.Draw(im, 'RGBA')

    for x in range(0, BG_W + 1, 100):
        d.line([(x, 0), (x, BG_H)], fill=(255, 255, 255, 70), width=1)
        d.text((x + 3, 3), str(x), fill=(255, 255, 0, 255))
    for y in range(0, BG_H + 1, 100):
        d.line([(0, y), (BG_W, y)], fill=(255, 255, 255, 70), width=1)
        d.text((3, y + 3), str(y), fill=(255, 255, 0, 255))

    for b in zone.get('barriers', []):
        d.rectangle([b[0], b[1], b[2], b[3]], fill=(255, 0, 0, 60), outline=(255, 0, 0, 200))

    sp = zone.get('spawn')
    if sp:
        d.ellipse([sp[0] - 12, sp[1] - 12, sp[0] + 12, sp[1] + 12],
                  fill=(0, 160, 255, 180), outline=(255, 255, 255, 255), width=2)
        d.text((sp[0] + 15, sp[1] - 6), 'spawn', fill=(0, 200, 255, 255))

    for n in zone.get('npcs', []):
        x, y = n['x'], n['y']
        # 말 걸 수 있는 거리(108px)를 같이 그린다 — 이 원 안에 걸어갈 수 있어야 한다
        d.ellipse([x - 108, y - 108, x + 108, y + 108], outline=(0, 255, 120, 110), width=2)
        d.ellipse([x - 10, y - 10, x + 10, y + 10], fill=(0, 255, 120, 220))
        d.text((x + 13, y - 6), f"{n['name']} ({x},{y})", fill=(180, 255, 200, 255))
    return im


def main():
    want = sys.argv[1:]
    made = 0
    for f in sorted(os.listdir(SPECS)):
        if not f.endswith('.json'):
            continue
        spec = json.load(open(os.path.join(SPECS, f), encoding='utf-8'))
        if want and spec['id'] not in want:
            continue
        if not want and any(z.get('barriers') for z in spec['zones']):
            continue
        for i, z in enumerate(spec['zones']):
            p = f"/tmp/bs_{spec['id']}{'' if len(spec['zones']) == 1 else '_' + z['id']}.png"
            sheet(spec, z).save(p)
            print(f"{spec['id']:12s} {z['label']:20s} → {p}")
            made += 1
    print(f'{made}장')


if __name__ == '__main__':
    main()
