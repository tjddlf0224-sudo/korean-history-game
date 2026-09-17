import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, split, repl, retext, ME, NPC, C, B
W = lambda f: os.path.join(os.path.dirname(__file__), '..', '..', 'www', f)
ins(W('gaehang4.html'), [('yugiljun_0', '그래서 조선을 중립국으로', [B('stance', '거문도를? 남의 섬을 제 것처럼!')])])
ins(W('gaehang5.html'), [
  ('seojaepil_0', "t:'신분을 가리지 않았지.'", [ME('(작게) 만민공동회엔 누구나 연단에 설 수 있었어.')]),
  ('sinminhoe_0', '안창호와 대한매일신보의', [C('smile', '학교! 회사! 다 세워요?')]),
])
ins(W('gaya.html'), [('suro_0', '그 뒤로는 고령의 대가야가', [B('resolve', '고구려 군사가 여기까지… 신라를 도우러 온 길이었구려.')])])
ins(W('godae1.html'), [
  ('gwanggaeto_0', '왜에 시달리던 신라에', [C('shock', '영락? 뭐야?')]),
  ('gwanggaeto_0', "t:'벽화도 그 방 안에", [C('smile', '돌방! 동굴 같아!')]),
])
ins(W('goryeo1.html'), [('yejong_0', '개경 동쪽과 서쪽엔 대비원을', [C('cry', '(콜록콜록) …약, 나도?')])])
ins(W('hugi3.html'), [('hongyeong_0', '이승훈·정약종은 처형되고', [B('resolve', '(굳은 얼굴로 입을 다문다)')])])
ins(W('hyeondae2.html'), [('yusin_0', '통일주체국민회의가 대통령을', [C('shock', '또 헌법? 헌법이 자꾸 바뀌어요!')])])
ins(W('hyeondae3.html'), [
  ('olympic_0', '그전에도 통일로 가는 길은', [C('smile', '(깃발을 흔든다) 세계가 다 왔대요!')]),
  ('olympic_0', '전두환 정부는 국민의 관심을', [B('resolve', '세계가 몰랐다니…')]),
  ('gimdaejung_0', '선언엔 남측의 연합제안과', [B('smile', '남과 북의 우두머리가 마주 앉다니!')]),
])
ins(W('ilje2.html'), [('mulsan_0', '그럼 일본 물건이 밀려드오', [C('shock', '관세? 그게 뭐예요?'), ME('(작게) 나라끼리 드나드는 물건에 매기는 세금이야.')])])
ins(W('ilje_ch7.html'), [('aegukban_0', '아침마다 도쿄 궁성 쪽으로', [B('resolve', '이웃끼리 서로 엿보게 하다니…')])])
ins(W('sesi.html'), [
  ('chilseok_0', '내일 아침 비는', [C('smile', '(하늘을 본다) 비 오면 좋겠다! 만나게!')]),
  ('dano_0', '한식은… 저 산소', [C('smile', '화전? 꽃을 먹어요?')]),
])
