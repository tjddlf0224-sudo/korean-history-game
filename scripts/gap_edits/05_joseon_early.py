# -*- coding: utf-8 -*-
"""교안 빈자리 5: 조선 전기 — 고사관수도·신량역천·신사임당·사군자·초충도."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from npc_edit import edit
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..', 'www'))

edit('ch2.html', [
("""      { who:'npc', t:'제 곁엔 강희안이란 분도 있습니다. 시·그림·글씨 다 능하시지요.' },""","""      { who:'npc', t:'제 곁엔 강희안이란 분도 있습니다. 시·그림·글씨 다 능하시지요.' },
      { who:'npc', t:'그분이 그린 고사관수도는 선비가 바위에 엎드려 물을 바라보는 그림입니다. 붓 몇 번에 마음이 다 담겼지요.',
        chart:{ type:'compare', title:'조선 전기의 두 그림', cols:[ { h:'몽유도원도', items:[ '안견', '안평대군의 꿈 · 도원' ] }, { h:'고사관수도', hi:true, items:[ '강희안', '선비가 물을 바라봄' ] } ] } },"""),
], quiz_add=[
('angyeon_0', 'bakyeon_0', """      { q:'선비가 바위에 엎드려 물을 바라보는 모습을 그린 강희안의 그림은?', opts:['고사관수도','세한도'], answer:0, src:[72],
        feedback:['세한도는 조선 후기 김정희의 작품이에요.','정답! 고사관수도입니다.'] },
"""),
])

edit('ch4.html', [
("""      { who:'me', t:'(말문이 막힌다) …그게, 좀 멀리서 왔습니다.' },""","""      { who:'me', t:'(말문이 막힌다) …그게, 좀 멀리서 왔습니다.' },
      { who:'npc', t:'호적엔 양인과 천민이 갈립니다. 헌데 양인이라도 수군·조례·나장처럼 고된 일을 대대로 지는 이들이 있지요. 신량역천이라 합니다.',
        chart:{ type:'grid', title:'조선의 신분', head:[ '구분', '누구' ], rows:[ [ '법으로는', '양인과 천인 둘 — 양천제' ], [ '실제로는', '양반 · 중인 · 상민 · 천민' ], [ '신량역천', '신분은 양인, 하는 일은 천역 — 수군·조례·나장 등' ], [ '천민', '노비가 대부분 · 백정·광대 등' ] ], hi:2 } },
      { who:'me', t:'양인인데도 천한 일을 해야 한다니….' },"""),
], quiz_add=[
('hyangni_0', 'hyangni_bond', """      { q:'조선에서 신분은 양인이지만 수군·조례·나장처럼 천한 역을 지던 계층은?',
        opts:['신량역천','서얼'], answer:0, src:[7, 11, 16, 19, 67],
        feedback:['서얼은 양반의 첩에게서 난 자손으로, 벼슬길에 제약을 받았어요.','정답! 신량역천입니다.'] },
"""),
])

edit('ch5b.html', [
("""      { id:'yusaeng', name:'소수서원 유생',""","""      { id:'saimdang', name:'신사임당', x:400, y:590, img:'assets/portraits/saimdang.png', look:{ role:'scholar', body:'#8fbf9a', accent:'#2f3d5a' } },
      { id:'yusaeng', name:'소수서원 유생',"""),
("""  josik_0: {""","""  saimdang_0: {
    name: '신사임당', icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.125em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l9-9"/><path d="M13 11l4-7 3 3-7 4"/><path d="M4 20c1-2 2-3 4-3"/></svg>', img: 'assets/portraits/saimdang.png',
    beats: [
      { who:'npc', t:'(붓을 헹군다) 오셨소. 그림이 마르는 동안 잠시 앉으시오.' },
      { who:'me', t:'(그림을 본다) 오이 넝쿨에 방아깨비와 나비… 살아 있는 것 같습니다.',
        chart:{ type:'relic', title:'초충도', items:[ { img:'chochungdo', n:'초충도', s:'풀과 벌레를 그린 그림' } ] } },
      { who:'npc', t:'풀과 벌레를 그린 초충도요. 뜰에 나가 오래 들여다보고 그리지.' },
      { who:'me', t:'(속으로) 이분이 신사임당, 율곡 이이의 어머니다.' },
      { who:'npc', t:'선비들은 매화·난초·국화·대나무를 즐겨 그리오. 사군자라 하지.',
        chart:{ type:'grid', title:'사군자', head:[ '그림', '뜻' ], rows:[ [ '매화', '추위를 뚫고 먼저 핀다' ], [ '난초', '그윽한 향을 멀리 보낸다' ], [ '국화', '서리 속에 핀다' ], [ '대나무', '곧고 속이 비었다' ] ] } },
      { who:'me', t:'모두 선비가 지킬 마음을 닮았군요.' },
      { who:'npc', t:'그렇소. 이정의 대나무, 어몽룡의 매화가 요즘 이름이 높지.',
        chart:{ type:'compare', title:'조선 중기의 그림', cols:[ { h:'사군자', items:[ '이정 — 대나무', '어몽룡 — 매화' ] }, { h:'초충도', hi:true, items:[ '신사임당', '풀벌레를 섬세하게' ] } ] } },
      { who:'npc', t:'(웃으며) 아들이 서원에서 글을 읽는다기에 잠시 들렀소. 글과 그림은 결국 한 마음이오.' },
    ],
    quizSeq: [
      { q:'풀과 벌레를 섬세하게 그린 초충도로 이름난 조선 중기의 인물은?',
        opts:['신사임당','허난설헌'], answer:0, src:[15, 23, 28, 30, 31, 65],
        feedback:['허난설헌은 허균의 누이로, 시로 이름난 문인이에요.','정답! 신사임당입니다. 율곡 이이의 어머니예요.'] },
      { q:'매화·난초·국화·대나무를 그려 선비의 지조를 나타낸 그림의 소재를 무엇이라 하나?',
        opts:['사군자','십장생'], answer:0, src:[22, 25, 28, 34, 39, 51, 57, 59, 61, 62],
        feedback:['십장생은 해·산·물·소나무 같은, 오래 사는 것을 그린 소재예요.','정답! 사군자입니다. 조선 중기에는 이정의 대나무, 어몽룡의 매화가 유명했어요.'] },
    ],
  },
  josik_0: {"""),
])
