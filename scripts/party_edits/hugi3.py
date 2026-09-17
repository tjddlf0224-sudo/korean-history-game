import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, split, repl, retext, ME, NPC, C, B
W = os.path.join(os.path.dirname(__file__), '..', '..', 'www')
P = os.path.join(W, 'hugi3.html')
split(P, '벼슬도 돈으로 사고팝니다. 산 자는 본전을 뽑으려 백성을 더 쥐어짜지요 — 매관매직입니다.',
      ['벼슬도 돈으로 사고팝니다.', '산 자는 본전을 뽑으려 백성을 더 쥐어짜지요 — 매관매직입니다.'])
ins(P, [
  ('hongyeong_0', '(고개를 끄덕인다) …정약용', [C('cry', '거중기 할아버지… 멀리 가?')]),
  ('hongyeong_0', '아무리 재주가 있어도', [B('resolve', '(평안도라는 말에 귀를 세운다)')]),
  ('hongyeong_0', '…끝내 성은 무너졌지만', [B('resolve', '(말없이 고개를 숙인다)')]),
  ('useen_0', '그날 일은 아직도', [C('cry', '(아낙의 치마폭을 가만히 잡는다)')]),
  ('imsul_0', '유계춘 어른을', [B('stance', '(주먹을 쥔다) 그런 자는 혼쭐을 내야 하오!')]),
  ('imsul_0', '그맘때 고구마 같은', [NPC('(한숨) 바뀐 게 없소. 하여 저마다 살길을 찾았지.')]),
  ('imsul_0', '흉년에는 목숨을', [C('smile', '고구마? 맛있어?')]),
  ('choeje_0', '반상의 구별도', [C('smile', '(가슴을 톡톡) 여기? 한울님? 간지러!')]),
  ('choeje_0', '조정은 나를 세상을', [B('shock', '반상 구별이 없다니… 성골 진골도 없단 말이오?')]),
  ('samjeong_0', '벼슬도 돈으로 사고팝니다', [B('resolve', '비변사가… 임진년엔 전쟁을 막으려 둔 곳이었는데.')]),
  ('samjeong_0', '(안타까워한다) …그래서 삿갓을', [C('shock', '할아버지를? 혼냈어?')]),
  ('samjeong_0', '$END', [C('shock', '(먼 바다 쪽을 본다) 형아, 저기… 큰 배?'),
                           ME('(속으로) 낯선 배들이 온다. 개항이 코앞이다.')]),
])
P = os.path.join(W, 'hugi2.html')
ins(P, [
  ('bobusang_0', '여긴 우리 시전 자리요', [ME('(속으로) 시전 상인이다. 난전 단속이 붙었다!')]),
  ('bobusang_0', "t:'큰 장사꾼도 많소.'", [C('smile', '(패랭이의 목화송이를 만진다) 몽실몽실!')]),
])
P = os.path.join(W, 'hugi1.html')
ins(P, [('hugi1' and 'gwanghae_0', '인목대비를 서궁에', [C('cry', '(형제라는 말에 바우를 올려다본다)')])])
