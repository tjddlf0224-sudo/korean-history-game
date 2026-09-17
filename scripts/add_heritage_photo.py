# -*- coding: utf-8 -*-
"""내려받은 사진을 게임 규격(긴 쪽 최대 1600px, JPEG 품질 84)으로 넣는다.
   python3 scripts/add_heritage_photo.py SRC heritage_이름.jpg [--max 1600]"""
import argparse, os
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('name')
ap.add_argument('--max', type=int, default=1600)
a = ap.parse_args()
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'assets', 'scenes', a.name)
im = Image.open(a.src).convert('RGB')
before = im.size
if max(im.size) > a.max:
    im.thumbnail((a.max, a.max), Image.LANCZOS)
im.save(out, 'JPEG', quality=84, optimize=True)
print(f'{a.name}  {before[0]}x{before[1]} → {im.size[0]}x{im.size[1]}  {os.path.getsize(out)//1024}KB')
