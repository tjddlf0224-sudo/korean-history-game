import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, split, repl, retext, ME, NPC, C, B
P = os.path.join(os.path.dirname(__file__), '..', '..', 'www', 'ilje_ch7.html')
split(P, '아침마다 도쿄 궁성 쪽으로 절을 시키고, 신문도 1940년에 동아·조선일보를 다 없앴지요.',
      ['아침마다 도쿄 궁성 쪽으로 절을 시키고,', '1940년엔 동아·조선일보를 다 없앴지요.'])
split(P, '일본이 미국과 전쟁을 벌이자, 임시정부는 곧바로 일본에 선전 포고를 했소(1941. 12).',
      ['일본이 미국과 전쟁을 벌이자,', '임시정부는 곧바로 일본에 선전 포고를 했소(1941. 12).'])
ins(P, [
  ('aegukban_0', '요새는 이걸 안 입으면', [C('shock', '(바짓단을 잡아당긴다) 치마가 바지가 됐어요!')]),
  ('aegukban_0', '$END', [B('resolve', '(말없이 주먹을 쥔다)')]),
  ('jicheongcheon_0', '그 차이는 총 한 자루', [B('stance', '우리 이름으로 된 군대라! (가슴을 친다)')]),
  ('jicheongcheon_0', '인도와 미얀마 전선에도', [C('shock', '미얀마? 엄청 먼 데요?')]),
  ('josoang_0', '무릇 셋이 고르게', [B('oops', '되찾은 뒤를 미리 적어 둔다… 과연 선비의 일이구려.')]),
  ('josoang_0', '그 뜻을 어찌 세상에', [C('smile', '셋이 고르게! 차돌이, 바우 형아, 형아!')]),
  ('gimgu_0', '(1931년 12월)', [B('stance', '나도 거들겠소! 이 힘이면…'),
                                ME('(바우 팔을 잡는다) …바우. 이건 우리가 끼어들 일이 아니야.')]),
  ('gimgu_1', '$END', [B('resolve', '(말없이 고개를 숙인다)')]),
  ('yunbonggil_0', '윤봉길은 도망치지 않고', [C('cry', '(형아 손을 꽉 잡고 눈을 감는다)')]),
  ('yunbonggil_0', '…그 뜻은 결코 헛되지', [B('resolve', '스물다섯… 나보다 고작 몇 살 위요.')]),
  ('yunbonggil_0', '삼균주의를 내세운', [C('smile', '삼균! 아까 그 셋 고르게!')]),
])
