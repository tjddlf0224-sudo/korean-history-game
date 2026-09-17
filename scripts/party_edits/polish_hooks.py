import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from party_insert import ins, ME, NPC, C, B
W = lambda f: os.path.join(os.path.dirname(__file__), '..', '..', 'www', f)
ins(W('gaya.html'), [('ureuk_0', '$END', [ME('(속으로) 가야가 스러졌다. 이제 세 나라의 마지막 판이다.')])])
ins(W('goryeo1.html'), [('yejong_0', '$END', [ME('(속으로) 문벌이 너무 커졌다. 곧 칼이 붓을 뒤엎는다.')])])
ins(W('gaehang4.html'), [('eulmi_0', '$END', [ME('(속으로) 이 불씨는 을사년, 정미년에 더 크게 번진다.')])])
ins(W('ilje_ch7.html'), [('yunbonggil_0', '$END', [C('smile', '형아, 이제… 해방 와요?'), ME('(속으로) 온다. 1945년 8월 15일.')])])
ins(W('hyeondae1.html'), [('yukio_0', '$END', [ME('(속으로) 새 헌법, 새 정부. 그러나 이듬해 5월, 군인들이 한강을 건넌다.')])])
