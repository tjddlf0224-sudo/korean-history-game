import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, ME, C, B
W = lambda f: os.path.join(os.path.dirname(__file__), '..', '..', 'www', f)
DOC = lambda img, t: "{ who:'doc', docImg:'assets/scenes/" + img + "', t:'" + t + "' },"

ins(W('godae1.html'), [('gwanggaeto_0', '(속으로) 훗날 경주 호우총에서', [
  DOC('heritage_houu.jpg', '(경주 호우총 출토 청동 「광개토대왕」명 호우(보물). 그릇 바닥에 「乙卯年國罡上廣開土地好太王」 글자가 돋을새김되어 있다. 고구려 그릇이 신라 무덤에서 나와 5세기 두 나라의 관계를 보여 준다.)\\n출처: 국립중앙박물관, 소장품 신수120, 공공누리 제1유형'),
])])

ins(W('gaehang5.html'), [
  ('gojong_0', '(속으로) 전차가 처음 달리던 날', [
    DOC('heritage_jejungwon.jpg', '(제중원. 1885년 알렌의 건의로 세운 우리나라 최초의 서양식 국립 병원으로, 광혜원을 고쳐 제중원이라 했다.)\\n출처: 1885년 촬영, 촬영자 미상 — 저작권 만료(퍼블릭 도메인), 위키미디어 공용'),
  ]),
  ('gojong_0', '(속으로) 며칠 뒤 이 거리에서', [
    DOC('heritage_hanseong_jeoncha.jpg', '(1899년 서대문~청량리 전차 개통 무렵의 흥인지문 앞. 구경꾼이 구름처럼 몰렸다. 개통 열흘 뒤 종로에서 다섯 살 아이가 치여 목숨을 잃자 성난 사람들이 전차를 불태웠다.)\\n출처: 서울역사박물관, 공공누리 제1유형'),
  ]),
  ('hwangseong_0', '검열을 피해 몰래', [
    DOC('heritage_siilya.jpg', '(1905년 11월 20일자 황성신문에 실린 논설 「시일야방성대곡」 지면. 을사늑약을 고발한 글이다.)\\n출처: 황성신문(1905) — 저작권 만료(퍼블릭 도메인), 위키미디어 공용'),
  ]),
  ('jeongmi_0', '군대까지 해산되자', [
    DOC('heritage_jeongmi_uibyeong.jpg', '(1907년 정미의병. 캐나다 기자 프레더릭 매켄지가 찍었다. 제복도 총도 제각각이지만, 해산 군인이 합류해 전투력이 크게 올랐다.)\\n출처: F. A. McKenzie, 「The Tragedy of Korea」(1908) — 저작권 만료(퍼블릭 도메인)'),
  ]),
])
