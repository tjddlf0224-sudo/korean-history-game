import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, split, repl, retext, ME, NPC, C, B
W = lambda f: os.path.join(os.path.dirname(__file__), '..', '..', 'www', f)
ins(W('ch4.html'), [
  ('hyangni_0', None, [NPC('(호적 뭉치를 와르르 떨어뜨린다) 아이고, 이 귀한 걸!')]),
  ('hyangni_bond', None, [NPC('(호적 뭉치를 와르르 떨어뜨린다) 아이고, 이 귀한 걸!')]),
])
ins(W('ch5b.html'), [('yihwang_0', None, [C('shock', '(서원 마루에서 쭈욱 미끄러진다) 으악!'), B('oops', '(차돌이를 붙잡는다) …조용한 곳이오, 차돌아.')])])
ins(W('godae2.html'), [('cheoyong_0', None, [ME('(대문에 붙은 무서운 얼굴 그림에 흠칫한다)'), C('shock', '(바우 뒤에 숨는다) 무서운 얼굴!')])])
ins(W('goryeo3.html'), [('ijehyeon_0', None, [C('shock', '(책 더미에 부딪힌다) 으앗! 책이 와르르!')])])
ins(W('ilje1.html'), [
  ('suin3_0', None, [ME('(끝방에서 끙끙 앓는 소리가 들린다)')]),
  ('siwon1_0', None, [ME('(가게 덧문이 쾅 닫힌다. 주인이 태극기를 품에 넣는다)')]),
  ('siwon2_0', None, [ME('(흙투성이 짚신을 신은 사내가 숨을 헐떡인다)')]),
])
