import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, split, repl, retext, ME, NPC, C, B
P = os.path.join(os.path.dirname(__file__), '..', '..', 'www', 'godae3.html')
# 최치원이 고려 때 책(백운소설)을 인용하던 줄 — 출전 미확인이라 '전한다'로만
retext(P, '백운소설이라는 책에 그리 전하오. 믿거나 말거나요.', 'npc', '그리 전한다 하오. 믿거나 말거나요.')
retext(P, '그 길로 곧장 나주를 거쳐, 고려에 몸을 맡겼소.', 'npc', '그 길로 고려에 몸을 맡겼소.')
ins(P, [
  ('gyeonhwon_0', '나는 견훤이다', [B('stance', '(앞을 막아선다) 우리 일행이오. 창끝은 거두시오.')]),
  ('gungye_0', '(그 눈빛에 놀라', [C('shock', '(형아 등 뒤로 쏙 숨는다)')]),
  ('gungye_0', '…그 모든 일에', [B('resolve', '(말없이 차돌이를 등 뒤로 감싼다)')]),
  ('choechiwon_0', '열두 살 어린 나이에', [B('resolve', '(고개를 숙인다) 벽이라… 나도 할 말이 없소.')]),
  ('choechiwon_0', '황소의 난이 일자', [B('oops', '글은 뜻만 전하면 그만이라… 어? 방금 내가 뭐라 했소?')]),
  ('choechiwon_0', '그리 전한다 하오', [C('smile', '글 읽고 쿵! 헤헤.')]),
  ('sinsunggyeom_0', '(담담히) 후회는 없소', [C('cry', '(조용히 형아 옷자락을 붙잡는다)')]),
  ('gyeongsunwang_0', '$END', [C('cry', '신라… 끝? 바우 나라…'),
                                B('resolve', '…괜찮소. 나라는 저물어도 사람은 남으니.'),
                                ME('(속으로) 이제 고려다. 새 판이 열린다.')]),
])
