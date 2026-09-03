# -*- coding: utf-8 -*-
"""도해(그림·표) 글씨를 키운다.

   왜
   - 실기기 제보: "그래픽쪽 글씨 크기가 작아." 대사는 읽히는데 도해 안의
     글씨가 눈에 안 들어온다. 재 보니 대사는 14px인데 도해는 10~11.5px였다.
     세로로 든 휴대폰에서 게임 화면이 390px밖에 안 되니 더 작아 보인다.
   - 도해는 시험에 나오는 말을 담는 자리다. 안 읽히면 없는 것과 같다.

   무엇을 하나
   - 도해 글자 크기를 대체로 **+2px**(약 18~20%) 올린다.
   - 지도의 지명(`.ch-map .pn`)은 **SVG 좌표계** 값이라 px가 아니다.
     viewBox 가로 100단위를 94px에 그리므로 6.6은 화면에서 6.2px밖에 안 됐다.
     글자만 키우면 지도를 덮으니 **지도 자체를 함께 키운다**(94→112, 150→190).
   - 도해 높이는 여유가 있다. 세로 모드에서 게임 높이 390px 중 도해가
     쓰는 것은 160px 남짓이었다.

   쓰는 법
     python3 scripts/bump_chart_font.py
"""
import io, os, re

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 'www', 'assets', 'chart.js')

# (찾을 것, 바꿀 것) — 하나씩 눈으로 확인해 정한다. 일괄 곱셈은 안 쓴다.
EDITS = [
    # 제목
    ('.ch-title { padding:7px 12px 0; font-family:"Gowun Batang",serif; font-size:10.5px;',
     '.ch-title { padding:8px 12px 0; font-family:"Gowun Batang",serif; font-size:12.5px;'),
    # 연표
    ('.ch-tl .y { font-size:10px;',       '.ch-tl .y { font-size:12px;'),
    ('.ch-tl .t { font-size:11.5px;',     '.ch-tl .t { font-size:13.5px;'),
    # 견주기
    ('.ch-cmp .h { font-size:12px;',      '.ch-cmp .h { font-size:14px;'),
    ('.ch-cmp li { font-size:11.5px;',    '.ch-cmp li { font-size:13.5px;'),
    # 유물·인물 카드
    ('.ch-cards .n { font-size:11.5px;',  '.ch-cards .n { font-size:13.5px;'),
    ('.ch-cards .s { font-size:10.5px;',  '.ch-cards .s { font-size:12px;'),
    # 인용
    ('.ch-quote .q { font-size:12.5px;',  '.ch-quote .q { font-size:14.5px;'),
    ('.ch-quote .from { font-size:10.5px;', '.ch-quote .from { font-size:12px;'),
    # 숫자
    ('.ch-stat .v { font-size:21px;',     '.ch-stat .v { font-size:24px;'),
    ('.ch-stat .l { font-size:10.5px;',   '.ch-stat .l { font-size:12.5px;'),
    # 계급 피라미드
    ('.ch-pyr .t { border-radius:5px; padding:4px 10px; text-align:center; font-size:11.5px;',
     '.ch-pyr .t { border-radius:5px; padding:5px 10px; text-align:center; font-size:13.5px;'),
    ('.ch-pyr .t s { display:block; font-size:10px;',
     '.ch-pyr .t s { display:block; font-size:11.5px;'),
    # 맞세우기
    ('.ch-vs .side .n { font-size:12.5px;', '.ch-vs .side .n { font-size:14.5px;'),
    ('.ch-vs .side .s { font-size:10.5px;', '.ch-vs .side .s { font-size:12.5px;'),
    ('.ch-vs .x { flex:none; font-size:12px;', '.ch-vs .x { flex:none; font-size:14px;'),
    # 지도 — 글자와 지도를 함께 키운다(지명은 SVG 좌표계 값이다)
    ('.ch-map svg { flex:none; width:94px; height:auto; }',
     '.ch-map svg { flex:none; width:112px; height:auto; }'),
    ('.ch-map.solo svg { width:150px; }', '.ch-map.solo svg { width:190px; }'),
    ('.ch-map .pn { font-size:6.6px;',    '.ch-map .pn { font-size:8px;'),
    ('.ch-map .leg .r { font-size:11px;', '.ch-map .leg .r { font-size:13px;'),
    # 차례
    ('font-size:11.5px; padding:3px 0 8px; }', 'font-size:13.5px; padding:3px 0 9px; }'),
    # 표
    ('.ch-grid table { width:100%; border-collapse:collapse; font-size:11px; }',
     '.ch-grid table { width:100%; border-collapse:collapse; font-size:13px; }'),
    # 짚기 이름표
    ('.ch-call .tag { position:absolute; transform:translate(-50%,-50%); font-size:10px;',
     '.ch-call .tag { position:absolute; transform:translate(-50%,-50%); font-size:11.5px;'),
]


def main():
    s = io.open(P, encoding='utf-8').read()
    done, miss = 0, []
    for old, new in EDITS:
        if old in s:
            s = s.replace(old, new, 1); done += 1
        elif new in s:
            done += 1                      # 이미 고쳐져 있다
        else:
            miss.append(old[:60])
    io.open(P, 'w', encoding='utf-8').write(s)
    print('도해 글씨 키운 규칙: %d/%d' % (done, len(EDITS)))
    for m in miss:
        print('  못 찾음:', m)
    # 남은 작은 글씨가 있는지 알려 준다
    small = sorted(set(re.findall(r'font-size:(\d+(?:\.\d+)?)px', s)), key=float)
    print('현재 chart.js 글자 크기:', ' '.join(small))


if __name__ == '__main__':
    main()
