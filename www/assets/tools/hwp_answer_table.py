#!/usr/bin/env python3
"""HWP 5.0(정답표) 파일에서 「문항번호 → 정답(1~5)」 표를 뽑는다.

한능검 6~56회 정답표가 PDF가 아니라 HWP로만 배포돼 있어서 만든 도구.
HWP 5.0은 OLE 복합문서라 olefile로 열 수 있고, 두 가지 경로가 있다.
  1) PrvText 스트림 — 본문 미리보기(UTF-16LE 평문). 가장 간단하지만
     길이 제한이 있어 뒷부분(대개 45번 이후)이 잘린다.
  2) BodyText/SectionN — zlib(raw deflate)로 압축된 레코드 스트림.
     레코드를 순회하며 텍스트 레코드(tag 67)만 골라 이어붙이면 전문이 나온다.
정답이 50개 다 안 나오면 자동으로 2번으로 넘어간다.

사용법:
    python3 hwp_answer_table.py <파일.hwp> [--json]
"""
import argparse
import json
import os
import re
import struct
import zlib

import olefile

CIRCLED = {'①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5}
HWPTAG_PARA_TEXT = 67  # 0x43 — 본문 텍스트 레코드


def read_prvtext(ole):
    if not ole.exists('PrvText'):
        return ''
    return ole.openstream('PrvText').read().decode('utf-16-le', errors='replace')


def read_bodytext(ole):
    """BodyText/SectionN 레코드를 순회하며 텍스트만 이어붙인다."""
    hdr = ole.openstream('FileHeader').read()
    compressed = bool(int.from_bytes(hdr[36:40], 'little') & 1)

    chunks = []
    for entry in ole.listdir():
        if len(entry) != 2 or entry[0] != 'BodyText':
            continue
        data = ole.openstream('/'.join(entry)).read()
        if compressed:
            data = zlib.decompress(data, -15)  # raw deflate
        pos = 0
        while pos + 4 <= len(data):
            header = struct.unpack_from('<I', data, pos)[0]
            tag = header & 0x3FF
            size = (header >> 20) & 0xFFF
            pos += 4
            if size == 0xFFF:  # 확장 크기: 다음 4바이트가 실제 크기
                size = struct.unpack_from('<I', data, pos)[0]
                pos += 4
            payload = data[pos:pos + size]
            pos += size
            if tag == HWPTAG_PARA_TEXT:
                text = payload.decode('utf-16-le', errors='ignore')
                # 제어문자(0x00~0x1F)는 표 칸 구분 등으로 쓰이므로 공백으로 치환
                chunks.append(''.join(c if ord(c) >= 32 else ' ' for c in text))
    return '\n'.join(chunks)


def parse_answers(text):
    """정답표 표기가 회차마다 달라서 두 형식을 모두 받는다.
      (a) 원 숫자형: '<1><③><2>'   — 대부분의 회차
      (b) 맨 숫자형: '<1><4><1>'   — 16·44회 등. 번호·정답·배점이 전부 맨 숫자라
          '번호,정답,배점' 3연속으로 읽어야 정답과 배점을 구분할 수 있다.
    """
    answers = {}
    for m in re.finditer(r'(?<!\d)(\d{1,2})\s*[<>\s]*\s*([①-⑤])', text):
        num = int(m.group(1))
        if 1 <= num <= 50 and num not in answers:
            answers[num] = CIRCLED[m.group(2)]
    if len(answers) >= 50:
        return answers

    for m in re.finditer(r'<\s*(\d{1,2})\s*>\s*<\s*([1-5])\s*>\s*<\s*([1-3])\s*>', text):
        num = int(m.group(1))
        if 1 <= num <= 50 and num not in answers:
            answers[num] = int(m.group(2))
    return answers


OVERRIDES = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         'data', 'hwp_answer_overrides.json')


def load_override(path):
    """정답표가 이미지(WMF)로만 들어 있어 자동 추출이 불가능한 회차 대비.
    파일명에서 회차를 뽑아 수기 판독해둔 값을 쓴다."""
    m = re.search(r'(\d{1,2})\s*회', os.path.basename(path))
    if not m or not os.path.exists(OVERRIDES):
        return None
    with open(OVERRIDES, encoding='utf-8') as f:
        data = json.load(f)
    entry = data.get(m.group(1))
    if not entry:
        return None
    return {i + 1: v for i, v in enumerate(entry['answers'])}


def extract(path):
    ole = olefile.OleFileIO(path)
    try:
        answers = parse_answers(read_prvtext(ole))
        if len(answers) < 50:
            merged = dict(parse_answers(read_bodytext(ole)))
            merged.update(answers)  # PrvText 쪽이 더 신뢰도 높아 우선
            answers = merged
        if len(answers) < 50:
            ov = load_override(path)
            if ov:
                return ov
        return answers
    finally:
        ole.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('hwp')
    ap.add_argument('--json', action='store_true')
    args = ap.parse_args()

    answers = extract(args.hwp)
    missing = [n for n in range(1, 51) if n not in answers]
    if args.json:
        print(json.dumps({'answers': answers, 'missing': missing}, ensure_ascii=False))
    else:
        print(f'{args.hwp}: {len(answers)}개' + (f' / 누락 {missing}' if missing else ' (1~50 완전)'))
        for n in range(1, 51):
            if n in answers:
                print(f'{n:2d}: {answers[n]}', end='   ')
                if n % 10 == 0:
                    print()
        print()


if __name__ == '__main__':
    main()
