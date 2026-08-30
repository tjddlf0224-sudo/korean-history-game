/* ============ 유물 탐색·인벤토리 (전 챕터 공용) ============
   보카바리스타의 채집처럼, 지도를 돌아다니다 그 시대의 유물을 줍는다.

   설계 의도
   - 걷기가 게임이 아니라는 진단에 대한 답. 지도에 숨긴 것이 있으면 걷는 데
     이유가 생긴다.
   - 주운 유물은 그냥 소지품이 아니라 **도감**이다. 유물마다 기출에서 어떻게
     나오는지를 붙여, 수집욕이 곧 개념 복습이 되게 한다.
   - 챕터가 바뀌어도 유지된다(localStorage). 시대를 넘나드는 이 게임 설정과 맞고,
     뒤 시대에서 앞 시대 유물을 쓰는 이벤트도 가능해진다.

   챕터에 붙이는 법
     1) <script src="assets/items.js"></script>
     2) ZONES의 구역에 spots 배열 추가:
          spots: [ { id:'x', x:420, y:300, label:'낡은 항아리',
                     item:'jumeokdokki', text:'…' } ]
     3) World.checkNpc() 끝에 Items.checkSpot(this) 한 줄
     4) Stage.interact()에서 Items.nearSpot이 있으면 Items.search() 먼저
*/
window.Items = (function(){
  const KEY = 'khg_items';

  /* ---------------- 유물 도감 ----------------
     art: assets/items/<id>.png (아직 없으면 이모지 폴백)
     exam: 기출에서 이게 어떻게 나오는지 — 도감의 핵심 */
  const DB = {
    jumeokdokki: { name:'주먹도끼', era:'구석기', emoji:'🪨',
      desc:'뗀석기 가운데 가장 널리 쓰인 만능 도구. 자르고, 찍고, 파는 데 모두 썼다.',
      exam:'구석기 하면 뗀석기 — 주먹도끼·찍개·슴베찌르개. 연천 전곡리에서 나온 것이 유명하다.' },
    bitsalmunui:  { name:'빗살무늬 토기', era:'신석기', emoji:'🏺',
      desc:'겉면에 빗살처럼 줄을 그은 토기. 밑이 뾰족해 강가나 바닷가 모래에 꽂아 세웠다.',
      exam:'신석기의 상징. 농경이 시작되며 곡식을 저장할 그릇이 필요해졌다는 근거로 나온다.' },
    bandal:       { name:'반달 돌칼', era:'청동기', emoji:'🌙',
      desc:'반달 모양 간석기. 구멍에 끈을 꿰어 손에 걸고 곡식의 이삭을 땄다.',
      exam:'청동기 시대 벼농사의 증거. 청동기는 무기·제기에 쓰고 농기구는 여전히 돌이었다.' },
    bipahyeong:   { name:'비파형 동검', era:'청동기', emoji:'🗡️',
      desc:'악기 비파를 닮은 청동 검. 만주와 한반도 북부에 걸쳐 출토된다.',
      exam:'미송리식 토기·탁자식 고인돌과 함께 **고조선의 세력 범위**를 보여주는 유물.' },
    misongni:     { name:'미송리식 토기', era:'청동기', emoji:'⚱️',
      desc:'몸통이 부풀고 목이 잘록하며 손잡이가 달린 토기. 평북 의주 미송리에서 처음 나왔다.',
      exam:'비파형 동검·탁자식 고인돌과 묶어 고조선 문화권을 묻는 문제로 나온다.' },
    chiljido:     { name:'칠지도', era:'삼국 · 백제', emoji:'🗡️',
      desc:'몸통 좌우로 가지가 셋씩 뻗은 철제 칼. 표면에 금으로 글자를 상감했다.',
      exam:'백제가 왜에 보낸 것으로, **백제와 왜의 교류**를 보여주는 유물로 나온다.' },
    gwanggaetobi: { name:'광개토대왕릉비 탁본', era:'삼국 · 고구려', emoji:'📜',
      desc:'아들 장수왕이 세운 비석을 먹으로 뜬 것. 높이 6미터가 넘는 거대한 비다.',
      exam:'고구려의 **남진 정책**과 신라 구원(400년 왜 격퇴) 기록. 일본의 임나일본부설 왜곡 논란으로도 나온다.' },
    jinheungbi:   { name:'진흥왕 순수비 탁본', era:'삼국 · 신라', emoji:'📜',
      desc:'진흥왕이 새로 넓힌 땅을 돌아보며 세운 비석의 탁본. 북한산·창녕·황초령·마운령에 있다.',
      exam:'신라의 **한강 유역 장악**을 보여주는 증거. 북한산비는 김정희가 고증했다.' },
    geumdongdaehyangno: { name:'백제 금동대향로', era:'삼국 · 백제', emoji:'🏺',
      desc:'뚜껑 꼭대기에 봉황이 앉고 몸통에 산과 연꽃이 새겨진 향로. 용이 받침을 물었다.',
      exam:'부여 능산리 절터 출토. 백제 공예의 절정이자 **도교와 불교가 함께 담긴** 유물.' },
    deongiswe:    { name:'덩이쇠', era:'삼국 · 가야', emoji:'⛓️',
      desc:'얇고 길쭉한 판 모양 철 덩어리. 그대로 화폐처럼 쓰기도 했다.',
      exam:'가야가 **철을 낙랑·왜에 수출**했다는 근거. 김해 대성동 고분군에서 나온다.' },
    pangapot:     { name:'가야 판갑옷', era:'삼국 · 가야', emoji:'🛡️',
      desc:'넓은 철판을 이어 붙여 만든 몸통 갑옷. 말갖춤과 함께 나온다.',
      exam:'가야의 철기 문화 수준을 보여준다. 고령 지산동·김해 대성동 고분 출토.' },
    gayageum:     { name:'가야금', era:'삼국 · 가야', emoji:'🎵',
      desc:'오동나무 몸통에 열두 줄을 건 현악기. 열두 달을 본떴다고 전한다.',
      exam:'대가야 가실왕이 만들게 하고 **우륵**이 신라로 가져갔다. 진흥왕이 받아들였다.' },
    manpasikjeok: { name:'만파식적', era:'남북국 · 통일신라', emoji:'🎋',
      desc:'불면 적병이 물러가고 병이 낫는다는 전설의 피리. 대나무로 만들었다.',
      exam:'**신문왕** 때의 설화. 삼국유사에 실렸고, 통일 뒤 왕권 안정을 바라는 뜻으로 읽는다.' },
    sesogogye:    { name:'세속오계 목간', era:'삼국 · 신라', emoji:'🎍',
      desc:'좁고 긴 나무 조각에 먹으로 글을 써 끈으로 엮은 것.',
      exam:'**원광**이 화랑에게 준 다섯 계율 — 사군이충·사친이효·교우이신·임전무퇴·살생유택.' },
    mugujeonggwang: { name:'무구정광대다라니경', era:'남북국 · 통일신라', emoji:'📃',
      desc:'닥종이에 목판으로 찍은 불경. 지금은 삭아서 책자 형태로 배접해 보존한다.',
      exam:'경주 **불국사 삼층석탑(석가탑)**에서 나온 **현존 최고(最古)의 목판 인쇄물**.' },
    cheonghaejin: { name:'청해진 교역 도자기', era:'남북국 · 통일신라', emoji:'🫖',
      desc:'굽이 낮고 아가리가 벌어진 청록빛 도자기. 바다 건너 들어온 형태다.',
      exam:'**장보고**가 완도에 세운 청해진. 신라·당·일본을 잇는 해상 무역을 장악했다.' },
    ibulbyeongjwasang: { name:'이불병좌상', era:'남북국 · 발해', emoji:'🗿',
      desc:'두 부처가 나란히 앉은 작은 불상. 광배가 하나로 이어져 있다.',
      exam:'발해가 **고구려를 계승**했다는 근거. 정혜공주 묘의 굴식 돌방무덤·모줄임천장과 함께 나온다.' },
    hunyo10jo:    { name:'훈요 10조', era:'고려 초', emoji:'📜',
      desc:'후대 왕들이 지킬 것을 열 가지로 적어 남긴 글.',
      exam:'**태조 왕건**이 남겼다. 불교 숭상·풍수지리·거란 배척 등이 담겼다.' },
    simu28jo:     { name:'시무 28조', era:'고려 초', emoji:'📄',
      desc:'나라를 다스릴 스물여덟 가지를 올린 상소문. 지금은 스물두 조가 전한다.',
      exam:'**최승로**가 성종에게 올렸다. 유교 정치 이념을 세우고 불교 행사를 줄이자고 했다.' },
    geonwonjungbo:{ name:'건원중보', era:'고려 초', emoji:'🪙',
      desc:'둥글고 가운데 네모 구멍이 뚫린 청동 엽전. 표면에 乾元重寶라 새겼다.',
      exam:'**성종** 때 만든 우리나라 **최초의 금속 화폐**. 널리 유통되지는 못했다.' },
    eunbyeong:    { name:'은병(활구)', era:'고려 중기', emoji:'🍶',
      desc:'한반도 모양을 본떠 만든 은 화폐. 목이 넓어 활구라고도 불렀다.',
      exam:'**숙종** 때 의천의 건의로 주조. 은 한 근으로 만든 고액 화폐라 큰 거래에 썼다.' },
    sanggamcheongja: { name:'상감청자 매병', era:'고려 중기', emoji:'🏺',
      desc:'비취색 청자에 흰흙과 검은흙을 파 넣어 학과 구름을 새겼다.',
      exam:'고려가 독자적으로 발전시킨 **상감 기법**. 12세기 중엽 절정에 이르렀다.' },
    palmandaejanggyeong: { name:'팔만대장경 경판', era:'고려 후기', emoji:'🪵',
      desc:'양 끝에 나무 마구리를 댄 목판. 8만 장이 넘는다.',
      exam:'**몽골 침입**을 부처의 힘으로 물리치려 강화도에서 새겼다. 합천 해인사 장경판전에 있다.' },
    samguksagi:   { name:'삼국사기', era:'고려 중기', emoji:'📕',
      desc:'실로 꿰맨 옛 역사책. 표지에 三國史記라 썼다.',
      exam:'**김부식**이 인종 때 편찬한 **현존 최고(最古)의 역사서**. 기전체·유교 사관.' },
    samgukyusa:   { name:'삼국유사', era:'고려 후기', emoji:'📙',
      desc:'승려가 쓴 역사책. 표지에 三國遺事라 썼다.',
      exam:'**일연**이 충렬왕 때 지었다. **단군 신화**를 처음 기록한 책으로 나온다.' },
    jikji:        { name:'직지심체요절', era:'고려 말', emoji:'📖',
      desc:'금속활자로 찍은 불교 서적. 줄이 미세하게 어긋나 활자로 찍은 티가 난다.',
      exam:'청주 흥덕사에서 1377년 간행. **현존 최고(最古)의 금속활자 인쇄본**. 프랑스 국립도서관 소장.' },
    hwatongdogam: { name:'화통도감 화포', era:'고려 말', emoji:'💥',
      desc:'짧고 굵은 청동 대포. 마디처럼 테를 둘렀다.',
      exam:'**최무선**의 건의로 화통도감을 두었다. 이 화포로 **진포 대첩**에서 왜구를 물리쳤다.' },
    joseongyeongukjeon: { name:'조선경국전', era:'조선 초', emoji:'📘',
      desc:'짙은 남색 표지의 실로 꿰맨 책.',
      exam:'**정도전**이 지은 조선 최초의 법전 초안. 재상 중심의 정치를 담았다.' },
    honilgangni:  { name:'혼일강리역대국도지도', era:'조선 초', emoji:'🗺️',
      desc:'비단 바탕에 대륙 윤곽을 먹으로 그린 세계지도.',
      exam:'**태종** 때(1402) 만든 **현존 동양 최고(最古)의 세계지도**. 아프리카와 유럽까지 그렸다.' },
    gyemija:      { name:'계미자', era:'조선 초', emoji:'🔡',
      desc:'낱개 금속활자 여럿. 윗면에 거꾸로 된 한자가 도드라진다.',
      exam:'**태종** 때 주자소를 두고 만든 조선 최초의 금속활자. 뒤에 세종이 갑인자로 개량했다.' },
    hunminjeongeum: { name:'훈민정음 해례본', era:'조선 초', emoji:'📖',
      desc:'펼친 면에 "나랏말싸미"로 시작하는 글이 크게 찍혔다.',
      exam:'**세종**이 1443년 창제, 1446년 반포. 해례본은 **글자를 만든 원리**를 설명한다. 유네스코 세계기록유산.' },
    angbuilgu:    { name:'앙부일구', era:'조선 초', emoji:'🕰️',
      desc:'솥을 우러러본 모양으로 우묵하게 판 청동 해시계.',
      exam:'**세종** 때 장영실 등이 만들었다. 백성도 보라고 저잣거리에 놓은 것으로 나온다.' },
    cheugugi:     { name:'측우기', era:'조선 초', emoji:'🌧️',
      desc:'원통형 청동 그릇이 돌 받침에 얹혔다. 안쪽에 눈금이 있다.',
      exam:'**세종** 때(1441) 만든 강우량 측정 기구. 전국 고을에 보급해 재어 보고하게 했다.' },
    jagyeongnu:   { name:'자격루', era:'조선 초', emoji:'⏳',
      desc:'물받이 통과 톱니바퀴, 구슬이 굴러가는 관이 얽힌 기계.',
      exam:'**장영실**이 만든 자동 물시계. 정해진 시각에 인형이 종과 북을 울렸다.' },
    nongsajikseol:{ name:'농사직설', era:'조선 초', emoji:'🌾',
      desc:'누렇게 바랜 실로 꿰맨 농서.',
      exam:'**세종** 때 정초 등이 편찬. 중국 농서가 아니라 **우리 실정에 맞는** 농법을 정리했다.' },
    mongyudowondo:{ name:'몽유도원도', era:'조선 초', emoji:'🖼️',
      desc:'복숭아꽃 핀 골짜기와 기암을 옅은 먹과 담채로 그린 두루마리.',
      exam:'**안견**이 **안평대군**의 꿈 이야기를 듣고 사흘 만에 그렸다. 지금은 일본에 있다.' },
    gyeongguktaejeon: { name:'경국대전', era:'조선 초', emoji:'📚',
      desc:'두툼하고 표지가 짙은 법전.',
      exam:'세조 때 시작해 **성종** 때 완성·반포. 조선의 기본 법전으로 통치 체제가 확립됐다.' },
    baekja:       { name:'백자', era:'조선 초', emoji:'⚪',
      desc:'무늬 없는 흰 항아리. 유약이 은은한 푸른빛을 띤다.',
      exam:'검소함을 숭상한 사대부의 취향. 고려 청자와 대비해 조선 도자를 묻는 문제로 나온다.' },
    sosuseowon:   { name:'소수서원 편액', era:'조선 중기', emoji:'🪧',
      desc:'검은 바탕에 금빛 한자 紹修書院을 새긴 가로 현판.',
      exam:'주세붕이 세운 백운동 서원에 **명종**이 이름을 내렸다. 우리나라 **최초의 사액 서원**.' },
    geobukseon:   { name:'거북선', era:'조선 · 임진왜란', emoji:'🐢',
      desc:'못 박은 덮개를 덮고 앞에 용머리를 단 배. 옆구리에 포구멍이 늘어섰다.',
      exam:'**이순신**이 임진왜란 직전 완성. 사천 해전에서 처음 썼다.' },
    nanjungilgi:  { name:'난중일기', era:'조선 · 임진왜란', emoji:'📓',
      desc:'손으로 쓴 한자가 빽빽한 낡은 일기책.',
      exam:'**이순신**이 7년 전쟁 동안 쓴 일기. 유네스코 세계기록유산.' },
    bigyeokjincheolloe: { name:'비격진천뢰', era:'조선 · 임진왜란', emoji:'💣',
      desc:'표면이 매끈한 무쇠 공. 위에 심지를 넣는 구멍이 있다.',
      exam:'**이장손**이 만든 시한폭탄식 무기. 경주성 탈환에 썼다.' },
    samjeondobi:  { name:'삼전도비 탁본', era:'조선 후기', emoji:'🪨',
      desc:'검은 바탕에 흰 한자가 빽빽한 세로 탁본.',
      exam:'**병자호란** 뒤 인조가 청 태종에게 항복한 사실을 새긴 비. 만주문·몽골문·한문이 함께 있다.' },
    sangpyeongtongbo: { name:'상평통보', era:'조선 후기', emoji:'🪙',
      desc:'가운데 네모 구멍이 뚫린 놋빛 엽전을 끈에 꿴 꾸러미.',
      exam:'**숙종** 때부터 전국에 유통된 조선의 대표 화폐. 상품 화폐 경제 발달의 근거.' },
    donguibogam:  { name:'동의보감', era:'조선 후기', emoji:'📗',
      desc:'짙은 갈색 표지의 의서 여러 권.',
      exam:'**허준**이 광해군 때 완성. 우리 약재를 정리했고 유네스코 세계기록유산이다.' },
    daedongyeojido: { name:'대동여지도', era:'조선 후기', emoji:'🗾',
      desc:'병풍처럼 접었다 펴는 지도첩. 산줄기와 물줄기가 먹선으로 촘촘하다.',
      exam:'**김정호**가 1861년 목판으로 찍었다. 22첩으로 나뉘고 10리마다 눈금을 넣었다.' },
    mongminsimseo:{ name:'목민심서', era:'조선 후기', emoji:'📔',
      desc:'담백한 표지의 실로 꿰맨 책.',
      exam:'**정약용**이 유배 중에 지었다. 지방 수령이 지킬 도리를 적은 실학의 대표작.' },
    geojunggi:    { name:'거중기 설계도', era:'조선 후기', emoji:'⚙️',
      desc:'도르래와 밧줄이 얽힌 기계를 먹선으로 그린 도면.',
      exam:'**정약용**이 기기도설을 참고해 고안. **수원 화성** 축조에 써서 공사 기간을 줄였다.' },
    jeonggamnok:  { name:'정감록', era:'조선 후기', emoji:'📜',
      desc:'손으로 베껴 쓴 낡은 예언서.',
      exam:'세도 정치기에 널리 퍼졌다. 왕조 교체를 예언해 **홍경래의 난** 같은 봉기의 명분이 됐다.' },
    cheokhwabi:   { name:'척화비 탁본', era:'개항기', emoji:'🪨',
      desc:'검은 바탕에 흰 한자. "洋夷侵犯 非戰則和 主和賣國"이라 새겼다.',
      exam:'**흥선대원군**이 신미양요 뒤 전국에 세웠다. 통상 수교 거부 정책의 상징.' },
    sujagi:       { name:'수자기', era:'개항기', emoji:'🚩',
      desc:'누런 삼베 한가운데 帥 한 글자를 크게 쓴 군기.',
      exam:'**신미양요** 때 광성보에서 미군이 빼앗아 갔다가 2007년 장기 대여로 돌아왔다. 어재연 장군의 깃발.' },
    oegyujanggak: { name:'외규장각 의궤', era:'개항기', emoji:'📓',
      desc:'비단으로 감싼 호화로운 표지의 큰 책. 모서리에 놋쇠 장식.',
      exam:'**병인양요** 때 프랑스군이 강화도에서 약탈. 2011년 대여 형식으로 반환됐다.' },
    dongnipsinmun:{ name:'독립신문', era:'개항기', emoji:'📰',
      desc:'한글 활자로 짠 신문 한 장. 종이가 누렇다.',
      exam:'**서재필**이 1896년 창간한 최초의 민간 신문. 한글판과 영문판을 함께 냈다.' },
    daehanguksae: { name:'대한제국 국새', era:'개항기', emoji:'👑',
      desc:'손잡이에 용이 앉은 네모난 금빛 도장.',
      exam:'고종이 **환구단**에서 황제로 즉위하며 대한제국을 선포(1897)했음을 보여준다.' },
    gimiseoneon:  { name:'기미독립선언서', era:'일제강점기', emoji:'📄',
      desc:'활자로 찍은 한 장짜리 선언문. 접힌 자국이 깊다.',
      exam:'**3·1 운동**(1919) 때 민족 대표 33인 이름으로 발표. 최남선이 초안을 썼다.' },
    taegeukgi:    { name:'태극기', era:'일제강점기', emoji:'🇰🇷',
      desc:'흰 바탕에 붉고 푸른 태극, 네 귀에 검은 괘.',
      exam:'3·1 운동 만세 시위에서 나눠 들었다. **유관순**과 아우내 장터 시위로 이어진다.' },
    joseoneohakhoe: { name:'조선어학회 원고', era:'일제강점기', emoji:'📝',
      desc:'손으로 쓴 원고지 뭉치를 끈으로 묶었다.',
      exam:'우리말 큰사전 편찬 원고. **조선어학회 사건**(1942)으로 학자들이 잡혀가며 중단됐다.' },
    uiyeoldan:    { name:'조선혁명선언', era:'일제강점기', emoji:'📃',
      desc:'거칠게 인쇄된 한 장짜리 격문. 종이가 얇다.',
      exam:'**신채호**가 쓴 **의열단**의 강령. 민중 직접 혁명을 통한 무장 투쟁을 주장했다.' },
    haninaegukdan:{ name:'한인애국단 서약서', era:'일제강점기', emoji:'🩸',
      desc:'손으로 쓴 서약문. 아래에 붉은 손도장이 찍혔다.',
      exam:'**김구**가 조직했다. **이봉창**의 도쿄 의거, **윤봉길**의 훙커우 공원 의거로 이어진다.' },
    geumbuchi:    { name:'금붙이(군자금)', era:'일제강점기', emoji:'💰',
      desc:'가락지와 비녀, 작은 금덩이가 무명 보자기에 모여 있다.',
      exam:'국채 보상 운동과 임시정부 군자금 모금. 여성들이 패물을 내놓은 일로 나온다.' },
    jeheonheonbeop: { name:'제헌헌법', era:'현대', emoji:'⚖️',
      desc:'표지에 한자 제목이 찍힌 얇은 책자.',
      exam:'**제헌 국회**가 1948년 7월 17일 공포. 대통령 간선제와 삼권분립을 담았다.' },
    nongjigaehyeok:{ name:'농지개혁 문서', era:'현대', emoji:'📋',
      desc:'도장이 여럿 찍힌 관공서 서류. 표에 숫자가 적혔다.',
      exam:'1949년 제정, 1950년 시행. **유상 매수·유상 분배**가 원칙이었다(북한은 무상몰수·무상분배).' },
    sailgu:       { name:'4·19 선언문', era:'현대', emoji:'✊',
      desc:'등사기로 민 거친 전단 한 장. 글자가 번졌다.',
      exam:'**3·15 부정선거**에 항거해 일어난 **4·19 혁명**(1960). 이승만이 하야했다.' },
    yugilo:       { name:'6·15 남북공동선언', era:'현대', emoji:'🕊️',
      desc:'두 사람이 서명한 현대식 문서.',
      exam:'2000년 **김대중** 대통령과 김정일 국방위원장의 첫 남북 정상회담에서 발표됐다.' },
  };

  /* ---------------- 저장 ---------------- */
  function load(){
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') return raw;
    } catch(e){}
    return { have: {}, spots: {} };
  }
  function save(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }

  function has(id){ return !!load().have[id]; }
  function taken(spotKey){ return !!load().spots[spotKey]; }
  function owned(){ const h = load().have; return Object.keys(DB).filter(k => h[k]); }

  function give(id, spotKey){
    const s = load();
    if (spotKey) s.spots[spotKey] = 1;
    const isNew = !s.have[id];
    s.have[id] = 1;
    save(s);
    return isNew;
  }

  /* ---------------- 스타일 ---------------- */
  let injected = false;
  function css(){
    if (injected) return; injected = true;
    const st = document.createElement('style');
    st.textContent = `
    /* 가방 버튼 — 미니맵 아래 */
    #bag-btn { position:absolute; z-index:24; right:calc(10px + env(safe-area-inset-right));
      bottom:calc(10px + env(safe-area-inset-bottom)); width:46px; height:46px; border-radius:50%;
      border:1px solid #4a3c26; background:#241c12ee; color:#f0c96b; font-size:20px;
      display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0;
      box-shadow:0 4px 14px rgba(0,0,0,.5); }
    #bag-btn:active { transform:scale(.94); }
    #bag-btn .cnt { position:absolute; right:-2px; top:-2px; min-width:17px; height:17px;
      border-radius:999px; background:#b6483c; color:#fff; font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center; padding:0 4px; }

    /* 유물 획득 연출 */
    /* #wrap 기준으로 덮는다. fixed로 두면 회전이 없는 가로 화면에서
       다시 뷰포트 기준이 되어 #wrap과 어긋난다. */
    .it-get { position:absolute; inset:0; z-index:88; display:flex; align-items:center;
      justify-content:center; pointer-events:none; }
    .it-get .card { text-align:center; font-family:"Gowun Batang",serif;
      background:rgba(26,20,12,.94); border:1px solid rgba(240,201,107,.6); border-radius:14px;
      padding:22px 26px; box-shadow:0 14px 44px rgba(0,0,0,.6);
      animation:it-card 2.6s cubic-bezier(.2,.9,.25,1) forwards; }
    @keyframes it-card { 0%{opacity:0; transform:scale(.8) translateY(12px);}
      12%{opacity:1; transform:scale(1.06) translateY(0);} 20%{transform:scale(1);}
      82%{opacity:1;} 100%{opacity:0; transform:translateY(-10px);} }
    .it-get .ic { font-size:52px; line-height:1; margin-bottom:8px; display:block; }
    .it-get .ic img { width:78px; height:78px; object-fit:contain; }
    .it-get .eb { font-size:11px; letter-spacing:.2em; color:#b8a888; }
    .it-get .nm { font-size:24px; font-weight:700; color:#f0c96b; margin:5px 0 3px;
      text-shadow:0 0 22px rgba(240,201,107,.55); }
    .it-get .er { font-size:12px; color:#c9bda6; }
    .it-get .glow { position:absolute; inset:-30px; border-radius:50%; pointer-events:none;
      background:radial-gradient(circle,rgba(240,201,107,.55),transparent 62%);
      animation:it-glow 1s ease forwards; }
    @keyframes it-glow { 0%{opacity:0; transform:scale(.4);} 30%{opacity:.9;}
      100%{opacity:0; transform:scale(1.8);} }
    .it-spark { position:absolute; width:8px; height:8px; background:#f0c96b; opacity:0; z-index:89;
      clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
      animation:it-spark .9s cubic-bezier(.2,.7,.3,1) forwards; pointer-events:none; }
    @keyframes it-spark { 0%{opacity:0; transform:rotate(var(--a)) translate(0,0) scale(.3);}
      15%{opacity:1;} 100%{opacity:0; transform:rotate(var(--a)) translate(84px,0) scale(1) rotate(200deg);} }

    /* 가방(도감) */
    #bag-ov { position:absolute; inset:0; z-index:92; display:none; align-items:center;
      justify-content:center; background:rgba(8,6,3,.84); font-family:"Gowun Batang",serif; }
    #bag-ov.show { display:flex; }
    #bag-ov .panel { width:min(90%,520px); max-height:84%; overflow-y:auto;
      background:#1a140c; border:1px solid #4a3c26; border-radius:16px; padding:18px; }
    #bag-ov h3 { margin:0 0 4px; font-size:17px; color:#f0c96b; text-align:center; }
    #bag-ov .cntline { text-align:center; font-size:12px; color:#b8a888; margin-bottom:14px; }
    #bag-ov .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(84px,1fr)); gap:9px; }
    #bag-ov .cell { background:#241c12; border:1px solid #3a2c1a; border-radius:11px;
      padding:10px 6px; text-align:center; cursor:pointer; }
    #bag-ov .cell.locked { opacity:.35; cursor:default; }
    #bag-ov .cell .ic { font-size:26px; display:block; margin-bottom:5px; }
    #bag-ov .cell .ic img { width:38px; height:38px; object-fit:contain; }
    #bag-ov .cell .nm { font-size:11.5px; color:#e8dcc2; line-height:1.35; }
    #bag-ov .detail { margin-top:14px; padding:14px; background:#241c12; border-radius:12px;
      border:1px solid #3a2c1a; display:none; }
    #bag-ov .detail.show { display:block; }
    #bag-ov .detail .dn { font-size:16px; font-weight:700; color:#f0c96b; }
    #bag-ov .detail .de { font-size:11px; color:#b8a888; margin-bottom:8px; }
    #bag-ov .detail .dd { font-size:13.5px; color:#f5ecd8; line-height:1.7; }
    #bag-ov .detail .dx { margin-top:9px; padding-top:9px; border-top:1px solid #3a2c1a;
      font-size:12.5px; color:#c9bda6; line-height:1.7; }
    #bag-ov .detail .dx b { color:#e9c979; }
    #bag-ov .close { display:block; width:100%; margin-top:14px; background:#2a2013;
      border:1px solid #4a3c26; color:#f5ecd8; border-radius:11px; padding:11px;
      font-family:inherit; font-size:14px; cursor:pointer; }
    @media (prefers-reduced-motion:reduce){
      .it-get .card,.it-get .glow,.it-spark { animation-duration:.01ms !important; }
    }`;
    document.head.appendChild(st);
  }

  /* 화면에 얹는 것은 전부 #wrap 안에 붙인다. 세로로 든 휴대폰에서는
     body.rot #wrap 이 rotate(90deg)로 가로모드를 만드는데, #wrap 밖에 붙이면
     그 회전을 안 물려받아 연출만 90도 틀어진 채 뜬다(미니맵과 같은 이유). */
  function layer(){ return document.getElementById('wrap') || document.body; }

  function iconHtml(id, big){
    const d = DB[id]; if (!d) return '';
    // 아트가 준비되면 자동으로 그림으로 바뀐다. 없으면 이모지로 버틴다.
    return `<span class="ic"><img src="assets/items/${id}.png" alt=""
      onerror="this.parentNode.textContent='${d.emoji}'"></span>`;
  }

  /* ---------------- 획득 연출 ---------------- */
  function celebrate(id){
    css();
    const d = DB[id];
    const ov = document.createElement('div');
    ov.className = 'it-get';
    ov.innerHTML = `<div class="card"><div class="glow"></div>${iconHtml(id, true)}` +
      `<div class="eb">유 물 을  얻 었 다</div>` +
      `<div class="nm">${d.name}</div><div class="er">${d.era}</div></div>`;
    layer().appendChild(ov);
    for (let i = 0; i < 10; i++){
      const p = document.createElement('i');
      p.className = 'it-spark';
      p.style.left = '50%'; p.style.top = '46%';
      p.style.setProperty('--a', (i * 36) + 'deg');
      p.style.animationDelay = (Math.random() * .15) + 's';
      layer().appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
    if (window.BGM && BGM.playOnce) BGM.playOnce('sfx_fanfare');
    if (navigator.vibrate) navigator.vibrate([30, 40, 60]);
    setTimeout(() => ov.remove(), 2700);
  }

  /* ---------------- 탐색 ---------------- */
  let nearSpot = null;

  function spotKey(zone, id){ return zone + ':' + id; }

  /* World.checkNpc() 끝에서 부른다. NPC보다 가까운 탐색 지점이 있으면
     그쪽을 잡고, 행동 버튼의 뜻을 [탐색]으로 바꾼다. */
  function checkSpot(world){
    // 지도에 표식을 두지 않는다. 유물은 직접 돌아다니다 발견하는 것이라,
    // 유일한 단서는 가까이 갔을 때 행동 버튼이 돋보기로 바뀌는 것뿐이다.
    // 그래서 대화 반경(108.8)보다 조금 넉넉하게 잡아, 스쳐 지나가도 걸리게 한다.
    const RANGE = 128;
    const zone = ZONES[world.zone];
    const list = (zone && zone.spots) || [];
    let best = RANGE, found = null;
    for (const s of list){
      if (taken(spotKey(world.zone, s.id))) continue;   // 이미 주운 건 무시
      const d = Math.hypot(s.x - world.px, s.y - world.py);
      if (d < best){ best = d; found = s; }
    }
    nearSpot = found;

    // NPC 옆에 유물을 숨긴 자리도 있다. 둘 다 잡히면 **더 가까운 쪽**이 이긴다.
    // (대화를 무조건 우선하면, 좁은 지도에서는 영영 못 줍는 유물이 생긴다.)
    spotWins = false;
    if (found){
      const n = world.nearNpc;
      spotWins = !n || best < Math.hypot(n.x - world.px, n.y - world.py);
    }

    const btn = document.getElementById('act-btn');
    if (!btn) return;
    if (spotWins){
      btn.classList.add('show');
      setActIcon(btn, 'search');
      btn.dataset.mode = 'search';
    } else if (btn.dataset.mode === 'search'){
      btn.dataset.mode = '';
      setActIcon(btn, '');
      if (!world.nearNpc) btn.classList.remove('show');
    }
  }

  /* 행동 버튼은 챕터마다 말풍선 아이콘을 갖고 있다. 탐색 상태일 때만
     돋보기로 갈아 끼우고, 원래 모양은 처음 한 번 기억해 두었다 되돌린다. */
  let actTalkHtml = null;
  const ACT_SEARCH_HTML =
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="10.5" cy="10.5" r="6.2" stroke="#2b1d0e" stroke-width="1.6" fill="#2b1d0e" fill-opacity="0.06"/>' +
    '<path d="M15.2 15.2 L20 20" stroke="#2b1d0e" stroke-width="1.9" stroke-linecap="round"/>' +
    '<path d="M8.2 9.4a2.5 2.5 0 0 1 2.5-2.2" stroke="#2b1d0e" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function setActIcon(btn, mode){
    if (actTalkHtml === null) actTalkHtml = btn.innerHTML;
    const want = mode === 'search' ? ACT_SEARCH_HTML : actTalkHtml;
    if (btn.innerHTML !== want) btn.innerHTML = want;
  }

  /* Stage.interact()가 NPC보다 먼저 이걸 물어본다. 처리했으면 true. */
  function trySearch(world){
    if (!nearSpot || world.nearNpc) return false;
    const s = nearSpot;
    const k = spotKey(world.zone, s.id);
    if (taken(k)) return false;
    const isNew = give(s.item, k);
    nearSpot = null;
    renderBag();
    if (isNew) celebrate(s.item);
    if (window.Rank) Rank.addXp(15, '유물 발견');
    const btn = document.getElementById('act-btn');
    if (btn){ btn.dataset.mode = ''; setActIcon(btn, ''); btn.classList.remove('show'); }
    return true;
  }

  /* ---------------- 가방 UI ---------------- */
  function mount(){
    css();
    if (!document.getElementById('bag-btn')){
      const b = document.createElement('button');
      b.id = 'bag-btn';
      b.innerHTML = '🎒<span class="cnt">0</span>';
      b.onclick = openBag;
      layer().appendChild(b);
    }
    if (!document.getElementById('bag-ov')){
      const d = document.createElement('div');
      d.id = 'bag-ov';
      d.innerHTML = '<div class="panel"><h3>유물 도감</h3>' +
        '<div class="cntline" id="bag-cnt"></div>' +
        '<div class="grid" id="bag-grid"></div>' +
        '<div class="detail" id="bag-detail"></div>' +
        '<button class="close" id="bag-close">닫기</button></div>';
      layer().appendChild(d);
      d.querySelector('#bag-close').onclick = () => d.classList.remove('show');
      d.onclick = e => { if (e.target === d) d.classList.remove('show'); };
    }
    renderBag();
  }

  function renderBag(){
    const btn = document.getElementById('bag-btn');
    if (btn) btn.querySelector('.cnt').textContent = owned().length;
  }

  function openBag(){
    mount();
    const all = Object.keys(DB);
    const mine = owned();
    document.getElementById('bag-cnt').textContent = `${mine.length} / ${all.length} 종`;
    const g = document.getElementById('bag-grid');
    g.innerHTML = '';
    for (const id of all){
      const got = mine.includes(id);
      const c = document.createElement('div');
      c.className = 'cell' + (got ? '' : ' locked');
      c.innerHTML = got
        ? iconHtml(id) + `<div class="nm">${DB[id].name}</div>`
        : `<span class="ic">❔</span><div class="nm">???</div>`;
      if (got) c.onclick = () => showDetail(id);
      g.appendChild(c);
    }
    document.getElementById('bag-detail').classList.remove('show');
    document.getElementById('bag-ov').classList.add('show');
  }

  function showDetail(id){
    const d = DB[id], el = document.getElementById('bag-detail');
    el.innerHTML = `<div class="dn">${d.name}</div><div class="de">${d.era}</div>` +
      `<div class="dd">${d.desc}</div>` +
      `<div class="dx"><b>시험에는</b> ${d.exam}</div>`;
    el.classList.add('show');
  }

  return { DB, has, owned, give, checkSpot, trySearch,
           mount, openBag, renderBag,
           get nearSpot(){ return nearSpot; } };
})();
