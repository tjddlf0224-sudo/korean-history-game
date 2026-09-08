# -*- coding: utf-8 -*-
"""배리어 편집기(아티팩트)에 넣을 데이터를 만든다.

   왜 만드나
   - 배리어는 예전에 measure_barriers.py 가 배경 그림의 진한 윤곽선을 뭉쳐
     뽑은 것이고, 그 도구 주석은 **"결과를 그대로 믿지 말고 눈으로 최종
     검증하라"** 고 못박아 두었다. 그 단계를 건너뛴 채 숫자(닿을 수 없는 칸
     수)만 보고 사각형을 깎았더니, 건물이 뚫렸다가 다시 길이 막혔다.
   - 그림을 읽는 일은 사람이 훨씬 잘한다. 그래서 **보고 고치는 자리**를 만든다.

   무엇을 내나
   - 구역마다: 배경 그림(작게 줄여 data URI로 심는다), 배리어 사각형,
     NPC·스폰·출구 자리, 원본 크기.
   - 아티팩트는 다른 서버의 그림을 못 불러온다(CSP). 그래서 그림을 파일에
     함께 심어야 한다 — 대신 폭 520px JPEG로 줄여 용량을 맞춘다.

   쓰는 법
     python3 scripts/make_barrier_editor.py            # 크기만 재 본다
     python3 scripts/make_barrier_editor.py --out zones.json
"""
import argparse
import base64
import io as _io
import json
import os
import re
from glob import glob

from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(BASE, 'www')
THUMB_W = 520
QUALITY = 55


def split_objects(s):
    """최상위 { ... } 항목만 나눈다. 안에 look:{...} 같은 중첩이 있어도 된다.
       예전에는 [^{}]* 로 잡아서, 중첩이 있는 NPC 항목을 통째로 놓쳤다 —
       그 바람에 NPC 검사가 조용히 건너뛰어졌다."""
    out, d, st = [], 0, None
    for i, ch in enumerate(s):
        if ch == '{':
            if d == 0: st = i
            d += 1
        elif ch == '}':
            d -= 1
            if d == 0: out.append(s[st:i + 1])
    return out

def num(s, key, default=None):
    m = re.search(key + r'\s*:\s*(-?[\d.]+)', s)
    return float(m.group(1)) if m else default


def balanced(s, i, o='{', c='}'):
    d = 0
    while i < len(s):
        if s[i] == o: d += 1
        elif s[i] == c:
            d -= 1
            if d == 0: return i
        i += 1
    return -1


def find_image(path):
    """구역의 img는 .png로 적혀 있지만 실제 파일은 .webp/.jpg 인 경우가 많다."""
    full = os.path.join(WWW, path)
    if os.path.exists(full): return full
    stem = os.path.splitext(full)[0]
    for ext in ('.webp', '.jpg', '.png', '.jpeg'):
        if os.path.exists(stem + ext): return stem + ext
    return None


def thumb(path):
    im = Image.open(path).convert('RGB')
    w = THUMB_W
    h = round(im.height * w / im.width)
    buf = _io.BytesIO()
    im.resize((w, h), Image.LANCZOS).save(buf, 'JPEG', quality=QUALITY, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def parse(path):
    s = _io.open(path, encoding='utf-8').read()
    if 'const ZONES' not in s: return []
    bw = num(s, r'const BG_W', 1376)
    bh = num(s, r'const BG_H', 768)
    i = s.find('const ZONES = {')
    end = balanced(s, s.find('{', i))
    body = s[s.find('{', i) + 1:end]

    out = []
    for m in re.finditer(r'\n  (\w+):\s*\{', body):
        k = balanced(body, body.index('{', m.end() - 1))
        blk = body[m.end():k]
        if 'barriers:' not in blk: continue

        def arr(field, pat):
            mm = re.search(field + r':\s*\[', blk)
            if not mm: return []
            e = balanced(blk, blk.index('[', mm.end() - 1), '[', ']')
            return re.findall(pat, blk[mm.end():e])

        bars = []
        mb = re.search(r'barriers:\s*\[', blk)
        e = balanced(blk, blk.index('[', mb.end() - 1), '[', ']')
        for bm in re.finditer(r'\{([^{}]*)\}', blk[mb.end():e]):
            t = bm.group(1)
            v = [num(t, kk) for kk in ('x0', 'y0', 'x1', 'y1')]
            if None not in v: bars.append([round(x) for x in v])

        npcs = []
        mn = re.search(r'npcs:\s*\[', blk)
        if mn:
            e2 = balanced(blk, blk.index('[', mn.end() - 1), '[', ']')
            for nm in [type('M',(),{'group':lambda self,i,t=t: t})() for t in split_objects(blk[mn.end():e2])]:
                t = nm.group(1)
                x, y = num(t, r'\bx'), num(t, r'\by')
                idm = re.search(r"id:\s*'([^']*)'", t)
                nmm = re.search(r"name:\s*'([^']*)'", t)
                if x is not None and y is not None:
                    npcs.append({'id': idm.group(1) if idm else '?',
                                 'name': nmm.group(1) if nmm else '',
                                 'x': round(x), 'y': round(y)})

        exits = []
        me = re.search(r'exits:\s*\[', blk)
        if me:
            e3 = balanced(blk, blk.index('[', me.end() - 1), '[', ']')
            for em in re.finditer(r'rect:\s*\{([^{}]*)\}', blk[me.end():e3]):
                t = em.group(1)
                v = [num(t, kk) for kk in ('x0', 'y0', 'x1', 'y1')]
                if None not in v: exits.append([round(x) for x in v])

        sp = re.search(r'spawn:\s*\{([^{}]*)\}', blk)
        spawn = None
        if sp:
            x, y = num(sp.group(1), 'x'), num(sp.group(1), 'y')
            if x is not None: spawn = [round(x), round(y)]

        lab = re.search(r"label:\s*'([^']*)'", blk)
        img = re.search(r"img:\s*'([^']*)'", blk)
        out.append({
            'chapter': os.path.basename(path), 'zone': m.group(1),
            'label': lab.group(1) if lab else m.group(1),
            'w': round(bw), 'h': round(bh),
            'img': img.group(1) if img else None,
            'barriers': bars, 'npcs': npcs, 'exits': exits, 'spawn': spawn,
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out')
    a = ap.parse_args()

    zones = []
    for f in sorted(glob(os.path.join(WWW, '*.html'))):
        zones += parse(f)

    missing = 0
    total_b64 = 0
    for z in zones:
        p = find_image(z['img']) if z['img'] else None
        if not p:
            z['thumb'] = None; missing += 1; continue
        z['thumb'] = thumb(p)
        total_b64 += len(z['thumb'])

    print('구역 %d개 · 배경 못 찾음 %d개' % (len(zones), missing))
    print('그림 데이터 %.1fMB (한 장 평균 %.0fKB)'
          % (total_b64 / 1024 / 1024, total_b64 / max(1, len(zones) - missing) / 1024))
    print('배리어 합계 %d개' % sum(len(z['barriers']) for z in zones))

    if a.out:
        js = json.dumps(zones, ensure_ascii=False, separators=(',', ':'))
        _io.open(a.out, 'w', encoding='utf-8').write(js)
        print('저장: %s (%.1fMB)' % (a.out, len(js) / 1024 / 1024))


if __name__ == '__main__':
    main()
