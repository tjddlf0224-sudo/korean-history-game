# -*- coding: utf-8 -*-
"""교안 빈자리 사진 14장을 대화에 사진 장면(doc)으로 넣는다. 출처는 _research/heritage_image_credits.md."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from npc_edit import edit, before
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..', 'www'))

KH = '출처: 국가유산청, 국가유산포털, 공공누리 제1유형'
NM = '출처: 국립중앙박물관, 공공누리 제1유형'
def doc(img, t, src=KH):
    return "      { who:'doc', docImg:'assets/scenes/%s', t:'(%s)\\n%s' }," % (img, t, src)

F = 'ch2.html'
edit(F, [before(F, "{ who:'me', t:'…화원의 일도, 참 여러 갈래군요.' },",
  doc('heritage_gosagwansudo.jpg', '강희안 「고사관수도」. 선비가 바위에 엎드려 물을 바라보는 그림으로, 조선 전기 문인화의 대표작이다. 국립중앙박물관 소장.', NM))])

F = 'ch5b.html'
edit(F, [before(F, "{ who:'npc', t:'선비들은 매화·난초·국화·대나무를",
  doc('heritage_chochungdo.jpg', '신사임당이 그렸다고 전하는 「초충도」 가운데 한 폭. 수박과 들쥐, 나비와 패랭이꽃을 섬세하게 그렸다. 국립중앙박물관 소장.', NM))])

F = 'godae2.html'
edit(F, [
  before(F, "{ who:'me', t:'꼭대기에 용이 붙어 있군요.' },",
    doc('heritage_sangwonsa_bell.jpg', '평창 상원사 동종(국보). 725년 성덕왕 때 만든, 지금 남아 있는 한국 범종 가운데 가장 오래된 종이다.')),
  before(F, "{ who:'me', t:'(속으로) 뒷날 폐허가 된 뒤 안압지라고",
    doc('heritage_donggung_wolji.jpg', '경주 동궁과 월지(사적). 문무왕 때 판 못과 복원한 건물로, 신라 왕궁의 별궁이자 잔치를 열던 곳이다.')),
])

F = 'seonsa1.html'
edit(F, [before(F, "{ who:'me', t:'(상인이 품에서 꺼내는 것을 본다)",
  doc('heritage_hwasun_daegokri.jpg', '화순 대곡리 청동기 일괄(국보). 세형 동검과 팔주령, 잔무늬 거울이 함께 나와 한반도에서 독자적으로 발전한 청동기 문화를 보여 준다.'))])

F = 'godae1.html'
edit(F, [
  before(F, "/* 여기부터 법흥왕 이야기가 끝날 때까지",
    doc('heritage_danyang_jeokseongbi.jpg', '단양 신라 적성비(국보). 진흥왕이 남한강 상류의 적성을 차지한 뒤 공을 세운 사람에게 상을 준 내용을 새겼다.')),
  before(F, "{ who:'me', t:'유교 경전을 익히겠다는 맹세로군요.",
    doc('heritage_imsinseogiseok.jpg', '경주 임신서기석(보물). 신라의 두 청년이 충성을 다하고 유교 경전을 익히겠다고 맹세한 글을 새긴 돌이다. 국립경주박물관 소장.')),
  before(F, "{ who:'npc', t:'우리 무덤엔 그림을 그리네.",
    doc('heritage_yeonga7.jpg', '금동 연가7년명 여래입상(국보). 고구려에서 만든 불상인데 경남 의령에서 발견되었다. 뒷면에 연가 7년이라는 글자가 새겨져 있다.')),
  before(F, "{ who:'npc', t:'분황사엔 돌을 벽돌처럼",
    doc('heritage_hwangnyongsaji.jpg', '경주 황룡사지(사적)를 남쪽 하늘에서 본 모습. 9층 목탑은 고려 때 몽골 침입으로 불타 지금은 넓은 절터와 주춧돌만 남았다.')),
  before(F, "{ who:'me', t:'돌인데 벽돌처럼 보이는군요.' },",
    doc('heritage_bunhwangsa_tower.jpg', '경주 분황사 모전석탑(국보). 돌을 벽돌 모양으로 다듬어 쌓았으며, 남아 있는 신라 석탑 가운데 가장 오래되었다(634년).')),
])

F = 'goryeo3.html'
edit(F, [
  before(F, "{ who:'npc', t:'지방 호족들이 세운 불상도 저마다",
    """      { who:'npc', t:'상감보다 먼저, 무늬 없이 빛깔만으로 멋을 낸 순청자가 있었소.' },
""" + doc('heritage_suncheongja.jpg', '청자 참외모양 병(국보). 12세기 순청자의 대표작으로, 무늬 없이 비색과 참외 모양만으로 아름다움을 냈다. 인종의 무덤에서 나왔다고 전한다.')),
  before(F, "{ who:'npc', t:'내가 뜬 뒤, 몽골이 쳐들어오자",
    doc('heritage_gwanchoksa_mireuk.jpg', '논산 관촉사 석조미륵보살입상(국보). 높이 18m에 이르는 고려 초의 거대한 석불로, 은진미륵이라고도 부른다.') + '\n' +
    doc('heritage_buseoksa_sojo.jpg', '영주 부석사 소조여래좌상(국보). 무량수전 안에 모신 고려의 불상으로, 흙으로 빚어 만들었다.') + '\n' +
    doc('heritage_woljeongsa_tower.jpg', '평창 월정사 팔각 구층석탑(국보). 고려 전기에 유행한 다각 다층탑의 대표작이다.')),
])
