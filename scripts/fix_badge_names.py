# -*- coding: utf-8 -*-
"""배지를 얻을 때 영문 id가 그대로 뜨던 것을 고친다.

   제보: "마지막에 뭐가 떴는데 영어로 코딩같은 게 떴었어" (고인돌 끝)

   원인 — badges.js
       playFanfare('… 배지 획득: ' + (def ? def.name : id));
   BADGE_DEFS에 없는 id면 **id를 그대로** 띄운다. 그래서 고인돌을 세우고
   나면 `배지 획득: did_goindol`, 챕터를 끝내면
   `배지 획득: ch_complete_seonsa1.html` 이 떴다.

   재 보니 쓰이는 배지 53개 중 **42개가 정의 없이** 쓰이고 있었다.
   챕터마다 '해 보기'가 하나씩 있으니 사실상 전 챕터에서 새고 있었다.

   고치는 방법 두 겹
   ① 33개 '해 보기' 배지와 나머지 9개에 이름·설명을 달아 준다.
      이름은 챕터에 이미 적혀 있는 Deed의 label·tag에서 가져온다
      (내가 새로 지어내면 챕터의 말과 어긋난다).
   ② `Badges.label(id)`을 만들어 **정의가 없어도 영문 id를 절대 안 보이게** 한다.
      `ch_complete_*`는 규칙으로 '챕터 완주'로 풀고, 그 밖의 모르는 id는
      '새 배지'로 부른다. 앞으로 정의를 빠뜨려도 화면은 한국어로 남는다.

   badge_* 아이콘 그림이 없는 것은 그림을 지정하지 않는다 —
   index.html이 `def.icon || 'assets/icons/badge_mapae.png'` 로 이미 받쳐 준다.

   쓰는 법
     python3 scripts/fix_badge_names.py
"""
import io, os, re

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')
P = os.path.join(BASE, 'assets', 'badges.js')

# (id, 이름, 설명) — 이름은 챕터의 Deed label/tag에서 가져왔다
DEFS = [
    # --- 해 보기(Deed) 33개 ---
    ('did_goindol',      '고인돌을 세운 사람',   '덮개돌 하나에 밧줄 수십 가닥. 사람을 부리는 자가 있었다는 뜻을 손으로 알았습니다.'),
    ('did_sunsubi',      '순수비를 새기다',     '진흥왕이 다녀간 자리에 비석을 세워 보았습니다.'),
    ('did_cheonghae',    '청해진의 배',        '장보고의 진에서 배를 띄워 보았습니다.'),
    ('did_gongsan',      '공산에 서다',        '왕을 살리고 죽은 이의 자리에 서 보았습니다.'),
    ('did_deongiswe',    '덩이쇠를 두드리다',    '가야의 쇠를 달궈 두드려 보았습니다.'),
    ('did_daewangam',    '대왕암을 바라보다',    '죽어서도 나라를 지키겠다던 바위섬을 바라보았습니다.'),
    ('did_gwageo',       '과거를 치르다',       '광종이 새로 연 시험에 붓을 들어 보았습니다.'),
    ('did_janggyeong',   '경판을 새기다',       '팔만 장을 새긴 그 일의 한 획을 그어 보았습니다.'),
    ('did_jeonmin',      '문서를 돌려주다',     '전민변정도감에서 빼앗긴 땅문서를 주인에게 돌렸습니다.'),
    ('did_byeokran',     '벽란도의 뱃짐',       '고려의 국제 항구에서 짐을 부려 보았습니다.'),
    ('did_doseong',      '도성의 성돌',        '한양 도성에 돌 하나를 놓아 보았습니다.'),
    ('did_gyemija',      '활자를 고르다',       '금속활자 한 알을 집어 판에 앉혀 보았습니다.'),
    ('did_ganui',        '간의대의 밤',        '별의 높이를 재어 보았습니다.'),
    ('did_nongsa',       '농사를 지어 보다',     '노농에게 배운 대로 흙을 갈아 보았습니다.'),
    ('did_chilsa',       '수령칠사',          '고을의 일곱 가지 일을 직접 보아 넘겼습니다.'),
    ('did_sago',         '실록을 말리다',       '물에 젖은 사고의 책장을 한 장씩 펴 말렸습니다.'),
    ('did_hyangyak',     '향약을 읽다',        '덕업상권·과실상규를 소리 내어 읽어 보았습니다.'),
    ('did_tongsinsa',    '통신사의 짐',        '바다를 건널 짐을 꾸려 보았습니다.'),
    ('did_uibyeong',     '의병에 이름을 올리다',  '관군이 아닌 사람들의 명부에 이름을 적었습니다.'),
    ('did_namhan',       '남한산성의 겨울',      '언 손으로 성벽을 지켜 보았습니다.'),
    ('did_hwaseong',     '화성의 돌',         '거중기로 돌을 올려 보았습니다.'),
    ('did_sampjeong',    '삼정의 장부',        '전정·군정·환곡의 장부를 들춰 보았습니다.'),
    ('did_cheokhwabi',   '척화비를 세우다',      '“화친을 말하는 자는 나라를 팔아먹는 자”를 새겼습니다.'),
    ('did_gunpo',        '군란의 쌀',         '열세 달 만에 받은 쌀에 무엇이 섞여 있었는지 보았습니다.'),
    ('did_jeonggang',    '정강을 적다',        '갑신정변의 개혁 조목을 옮겨 적어 보았습니다.'),
    ('did_jipgangso',    '집강소에 앉다',       '폐정개혁의 조목을 한 줄씩 읽어 보았습니다.'),
    ('did_jigye',        '지계를 받다',        '광무개혁의 토지 문서를 손에 쥐어 보았습니다.'),
    ('did_mulsan',       '국산품을 사다',       '“내 살림 내 것으로”를 장바구니로 겪었습니다.'),
    ('did_gwangbokgun',  '광복군에 들다',       '임시정부의 군대에 이름을 올렸습니다.'),
    ('did_sintak',       '거리에 나가다',       '신탁통치를 두고 갈린 거리를 걸어 보았습니다.'),
    ('did_sailgu',       '광장에 서다',        '사월의 광장에 서 보았습니다.'),
    ('did_chilsa_nambuk', '남북이 함께 낸 말',   '같은 날 같은 내용이 남과 북에서 함께 나온 방송을 들었습니다.'),
    ('did_songpyeon',    '송편을 빚다',        '한가위에 손으로 반달을 만들어 보았습니다.'),
    # --- 그 밖 9개 ---
    ('beom_gungya',      '호랑이를 물리다',      '후원의 풀숲에서 물러서지 않았습니다. 잡는 것은 착호갑사의 일입니다.'),
    ('waejang_down',     '적장 앞에서',        '말이 통하지 않아도 아는 것으로 맞섰습니다.'),
    ('use_manpasikjeok', '만파식적을 불다',      '만 개의 물결을 잠재우는 피리를 입에 대었습니다.'),
    ('use_gimiseoneon',  '독립선언서를 읽다',     '“오등은 자에 아 조선의 독립국임을 선언하노라.”'),
    ('use_eohakhoe',     '우리말을 숨기다',      '큰사전 원고를 품에 넣고 벽을 등졌습니다.'),
    ('fund_independence', '군자금을 내다',      '영수증도 받지 않고 금붙이를 내놓았습니다.'),
    ('seodaemun_out',    '서대문을 나서다',      '갇혔던 문을 걸어 나왔습니다.'),
    ('journey_complete', '선사에서 현대까지',     '서른여섯 화를 모두 걸어 끝까지 왔습니다.'),
]

OLD_FANFARE = """      const def = BADGE_DEFS[id];
      playFanfare('<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l4 6 4-6"/><circle cx="12" cy="15" r="6"/><circle cx="12" cy="15" r="2.5"/></svg> 배지 획득: ' + (def ? def.name : id));"""

NEW_FANFARE = """      playFanfare('<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l4 6 4-6"/><circle cx="12" cy="15" r="6"/><circle cx="12" cy="15" r="2.5"/></svg> 배지 획득: ' + Badges.label(id));"""

LABEL_FN = """  /* 배지 이름 — **영문 id를 절대 화면에 내보내지 않는다.**
     예전에는 정의가 없으면 id를 그대로 띄웠다. 그래서 고인돌을 세우면
     `배지 획득: did_goindol`, 챕터를 끝내면
     `배지 획득: ch_complete_seonsa1.html` 이 떴다(실제 제보).
     정의를 빠뜨리는 일은 앞으로도 생길 수 있으니, 규칙으로 받쳐 둔다. */
  label(id){
    const def = BADGE_DEFS[id];
    if (def && def.name) return def.name;
    if (String(id).indexOf('ch_complete_') === 0) return '챕터 완주';
    return '새 배지';
  },
  earn(id, meta){"""


def main():
    s = io.open(P, encoding='utf-8').read()

    # ① 팬페어가 id를 흘리지 않게
    if OLD_FANFARE in s:
        s = s.replace(OLD_FANFARE, NEW_FANFARE, 1)
        print('팬페어 — Badges.label(id)로 바꿈')
    elif 'Badges.label(id)' in s:
        print('팬페어 — 이미 고쳐져 있다')
    else:
        raise SystemExit('!! 팬페어 자리를 못 찾았다')

    # ② label() 추가
    if 'label(id){' not in s:
        assert '  earn(id, meta){' in s
        s = s.replace('  earn(id, meta){', LABEL_FN, 1)
        print('Badges.label() 추가')

    # ③ 빠진 정의 채우기
    m = re.search(r'const BADGE_DEFS = \{\n', s)
    assert m, '!! BADGE_DEFS를 못 찾았다'
    added = []
    lines = []
    for bid, name, desc in DEFS:
        if re.search(r'\n  ' + re.escape(bid) + r':\s*\{', s):
            continue
        lines.append("  %s: { name: '%s',\n    desc: '%s' }," % (bid, name, desc))
        added.append(bid)
    if lines:
        head = ("  /* 아래는 '해 보기'(Deed)·유물·조우로 얻는 배지들이다. 이름은 챕터에\n"
                "     이미 적혀 있는 label·tag에서 가져왔다 — 새로 지어내면 챕터의 말과\n"
                "     어긋난다. 그림은 지정하지 않는다(index.html이 badge_mapae.png로 받친다). */\n")
        s = s[:m.end()] + head + '\n'.join(lines) + '\n' + s[m.end():]
    print('배지 정의 추가: %d개' % len(added))

    io.open(P, 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    main()
