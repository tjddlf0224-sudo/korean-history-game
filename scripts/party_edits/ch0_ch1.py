import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, split, repl, retext, ME, NPC, C, B
W = os.path.join(os.path.dirname(__file__), '..', '..', 'www')
P = os.path.join(W, 'ch0.html')
ins(P, [
  ('jeongdojeon_0', None, [C('sly', '(단청을 콕콕) 알록달록! 반짝!')]),
  ('jeongdojeon_0', '강녕전은 평안을', [B('smile', '부지런히… 생각하며… (손가락을 꼽다 포기한다)')]),
  ('jeongdojeon_0', '그 뜻을 어떻게 남기셨습니까', [B('oops', '백성이 나라의 근본이라… 어? 방금 내가 뭐라 했소?')]),
  ('jeongdojeon_1', '권중화가 좋다 하여', [C('shock', '산! 또 산!')]),
  ('jeongdojeon_2', '무슨 생각을 하고 계신 건지', [B('resolve', '(칼자루에 손을 얹는다) …바람이 차오.')]),
  ('jeongdojeon_2', '$END', [ME('(속으로) 1398년. 이 사람에게 남은 시간이 얼마 없다.')]),
  ('taejo_0', '…끝까지 뜻을 함께하지', [B('stance', '말머리를 돌리다니… 장수로선 제일 어려운 결정이오.')]),
  ('taejo_0', '나라를 세우려면 땅부터', [C('cry', '(형아 뒤에 숨어 조용해진다)')]),
  ('jongmyo_0', '이 정전이 그 신주를', [C('smile', '(따라서 넙죽) 꾸벅! 꾸벅!')]),
  ('worker_0', '허리 한번 못 펴고', [B('stance', '(혼자 번쩍 든다) 어디다 놓으면 되오?')]),
])
P = os.path.join(W, 'ch1.html')
retext(P, '그렇네. 훗날 갑인자라는 것도 더 나온다네.', 'npc', '그렇네. 계미년에 부었다 하여 계미자일세.')
retext(P, '훗날 갑인자가 나오지요. 밀랍 없이 대나무로 빈틈을 메운다오.', 'me', '(속으로) 세종 때 갑인자에 가면 밀랍 없이 대나무로 틈을 메운다.')
ins(P, [
  ('taejong_0', '그 힘이 얼마나 위험한지', [B('resolve', '(형제라는 말에 눈을 내리깐다)')]),
  ('taejong_1', '…무척 웅장합니다', [C('shock', '(입이 떡) 집! 엄청 커!')]),
  ('taejong_2', '$END', [ME('(속으로) 충녕대군. 곧 세종이다.'),
                          C('smile', '형아, 웃어. 좋은 사람 와?')]),
  ('daegan_0', '그저 흉내이나', [C('sly', '(도장을 꽉 쥔다) 쾅! 나도!')]),
  ('jujaso_0', '어찌 목판 대신', [B('shock', '쇳물로 글자를… 고려에서도 봤소!')]),
  ('guard_0', '천한 이는 저 큰', [C('shock', '(호패를 흔든다) 딸랑? 이거 뭐야?')]),
])
