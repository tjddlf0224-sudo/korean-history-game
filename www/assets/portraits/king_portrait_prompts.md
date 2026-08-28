# 왕 계보용 초상화 제미나이 프롬프트 (전면 재작업 — 기출 왕 62명)

왕 계보 모달의 초상화를 전부 새로 그린다. 기존에는 "이미 게임 NPC 초상화가 있는
왕은 재사용, 없는 왕만 신규"로 나눴었는데, 이번엔 **기출에 나온 왕(원 안 숫자>0)
62명 전원을 처음부터 다시 그린다** — 이미 NPC 초상화가 있는 왕(세종·태종·연산군
등)도 예외 없이 포함된다. 기출에 한 번도 안 나온 왕(n=0, 약 67명 — 이렇다 할
기록도 거의 없는 경우가 대부분)은 이번 작업에서 제외했다.

핵심 목표는 "이 왕 하면 떠오르는 이미지"를 초상화 한 장에 담는 것이다 — 예:
연산군은 조선 최고의 폭군이라는 이미지가 한눈에 드러나야 한다. 아래 각 인물
설명은 지어낸 게 아니라 웹 검색으로 확인한 실제 역사 기록(실록·삼국사기·고려사
등에 남은 사건·평판)에 근거해서 시각적 특징(복식·표정·자세·소품)으로 옮긴 것이다.

## 파일명 규칙 (중요)

기존 NPC 대화 초상화(`sejong.png`, `taejong.png`, `yeonsangun.png` 등)와
**절대 겹치지 않도록** 왕 계보용 파일은 전부 `{id}_king.png` (여왕은 `_queen.png`)
접미사를 붙였다. 즉 세종의 왕 계보 초상화는 `sejong_king.png`로 저장하고,
세종 NPC 대화 초상화(`sejong.png`)는 그대로 둔다 — 서로 다른 그림, 다른 파일이다.

**단 하나의 예외: 영조(`yeongjo`)만 접미사가 없다.** 영조는 hugi1.html에 NPC로도
나오는데 아직 초상화가 없어서, 이번에 뽑는 그림 하나를 NPC 대화와 왕 계보 모달
양쪽에 똑같이 쓴다(`assets/portraits/yeongjo.png`).

같은 묘호가 고려·조선 양쪽에 있는 경우(성종·현종·숙종·태조)는 `_goryeo_king`
접미사로 구분했다(예: `seongjong_goryeo_king` vs `seongjong_king`).

## 공통 스타일 (전 그리드 공통, 프롬프트 맨 앞에 붙일 것)

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.
```

(연산군만 예외 — 그리드 4 설명에 별도로 표정 규칙이 있다.)

## 작업 방식 (지금까지 해온 방식 그대로)

1. 그리드 하나를 한 번에 생성 — 따로따로 뽑으면 해상도·톤이 튄다.
2. 받은 이미지를 저장해서 보내주면 각 인물을 잘라 `assets/portraits/{id}.png`로 저장하고 게임에 연결(왕 계보 모달의 `KINGS_DATA`에 `'p':'{id}'` 추가).
3. 배경에 제미나이 로고나 마젠타 얼룩이 남는 경우가 잦으니 받으면 확인해서 알려주면 지운다.
4. 각 인물 설명 끝의 `id: ...`가 파일명이 된다(위 파일명 규칙 참고).

---

## 그리드 1 — 고조선~백제 (13명)

이 시대는 복식사가 균일하지 않다는 점이 특징이다. 단군왕검은 문자 기록 이전 인물이라 실제 복식 고증이 불가능해 교과서 삽화 스타일(백의·소박한 관)로 그리고, 고구려 구간(고국원왕~장수왕)은 안악3호분·쌍영총 등 고분벽화의 찰갑(비늘갑옷)과 볼가리개 투구를, 백제 구간(근초고왕~의자왕)은 무령왕릉 금제 유물처럼 화려한 금동관과 부드러운 곡선의 백제 미술 특유의 온화한 인상을 참고했다.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.

A grid sheet of 13 ancient Korean royal figures, evenly spaced, same
scale:

1. 단군왕검(Dangun Wanggeom) — id: dangun_king. Legendary founder-king of
   Gojoseon, depicted in traditional Korean folk-art/textbook style
   (predates recorded costume history, so no specific armor or crown) —
   plain white/undyed hemp robe, simple rope sash, a modest wooden or
   antler-shaped crown suggestion, long white beard, holding a wooden
   staff, a faint sun-ray motif behind him hinting at "hongik-ingan"
   (benefiting all humanity). Serene, ancient, mythic-elder dignity.

2. 우거왕(Ugeo, last king of Wiman Joseon) — id: ugeo_king. Late-2nd-century
   BC monarch who held besieged Wanggeomseong fortress against Han
   China's invading army for months and refused to surrender even as
   his own ministers urged it (he was ultimately assassinated by one
   of them) — dark hemp/leather robe with a simple woven belt, plain
   leather cap, siege-worn and stubborn expression, hand gripping a
   short blade, defiant to the last.

3. 고국원왕(Gogugwon, Goguryeo) — id: gogugwon_king. 4th-century Goguryeo
   king struck down by an arrow while defending Pyongyang fortress
   against Baekje's Geunchogo in 371 — scale/lamellar armor (bicheolgap
   style), rounded iron helmet with cheek guards, an arrow grazing or
   lodged near his shoulder, pained but resolute wartime expression,
   grave and tragic mood.

4. 소수림왕(Sosurim, Goguryeo) — id: sosurim_king. Reformist king who
   officially adopted Buddhism in 372 (received sutras and an image
   from the monk Sundo), founded the Taehak state academy, and
   promulgated Goguryeo's first law code in 373 — dark scholarly robe
   with wide sleeves layered over armor, holding a Buddhist sutra
   scroll in one hand and a law-code tablet in the other, calm and
   deliberate reformer's expression.

5. 광개토대왕(Gwanggaeto the Great) — id: gwanggaeto_king. Conqueror-king
   who declared Korea's earliest known independent era name, "Yeongnak,"
   and whose memorial stele records capturing 64 fortresses and 1,400
   villages, expanding Goguryeo west to the Liao River — ornate lamellar
   cavalry armor, tall plumed iron helmet, hand on an ornate sword hilt,
   confident commanding pose atop implied horseback, golden accents.

6. 장수왕(Jangsu, Goguryeo) — id: jangsu_king. Elderly king (he reigned
   roughly 79 years, into his 90s) who moved the capital to Pyongyang
   in 427 and personally led the 475 campaign — using the spy-monk
   Dorim to weaken Baekje first — that captured Hanseong and killed
   King Gaero — richer court robe layered over armor, long white beard,
   dignified aged but sharp and calculating face, holding a scroll map
   of the southern campaign.

7. 근초고왕(Geunchogo, Baekje) — id: geunchogo_king. Baekje's
   greatest-expansion king — conquered the Mahan confederacy, personally
   led 30,000 elite cavalry to storm Pyongyang and kill Goguryeo's
   Gogugwon in 371, and forged ties with Wa Japan by gifting the ornate
   Chiljido (seven-branched sword) — resplendent gilt-bronze crown,
   fine Baekje court robe, triumphant proud expression, holding a
   distinctive seven-branched ceremonial sword.

8. 개로왕(Gaero, Baekje) — id: gaero_king. Late-5th-century king who was
   deceived by the disguised Goguryeo spy-monk Dorim — who exploited
   his love of the board game baduk (go) to win his trust and goad him
   into exhausting the treasury on lavish palace construction — leaving
   Baekje weak when Jangsu's army struck; he was captured and executed
   at Hanseong's fall in 475 — elegant flame-prong gilt-bronze crown,
   flowing purple-red robe, a baduk board/stones motif nearby, tense
   and regretful expression.

9. 삼근왕(Samgeun, Baekje) — id: samgeun_king. Grandson of Gaero, enthroned
   at only about 13 years old right after his father Munju's
   assassination, and almost immediately had to face a rebellion led
   by the powerful minister Hae-gu — notably smaller, child-sized build
   compared to the other kings, an oversized/simplified crown and robe
   that look slightly too big for him, uncertain but trying-to-be-brave
   youthful expression.

10. 무령왕(Muryeong, Baekje) — id: muryeong_king. King who restored
    Baekje's power after decades of crisis, declaring in a letter to
    Liang China that Baekje had "again become a strong nation,"
    established the 22 damno provincial-governor system, and was
    buried in the brick-chamber Muryeongwang-neung tomb (Chinese
    Liang-style brickwork, with an epitaph tablet naming him — the
    first identified Korean royal tomb) — mature, composed, confident
    ruler's bearing, ornate gilt crown, a brick-pattern or epitaph
    tablet motif referencing his tomb.

11. 성왕(백제, Seongwang) — id: seongwang_king. King who moved the capital
    to Sabi in 538 and renamed the country Namburyeo to proclaim a
    Baekje revival, but died in battle at Gwansanseong fighting Silla's
    Jinheung — refined gilt-bronze crown and court robe suited to a
    capital-founding reformer, composed and visionary expression, but
    with a subtle undertone of doom (this scene should still read as
    dignified, not yet defeated — a king at his ambitious peak just
    before his tragic end).

12. 무왕(백제, "서동" 설화의 왕) — id: mu_baekje_king. King tied to the
    Seodong-yo folk legend — as a commoner he supposedly composed a
    song to win the hand of Silla's Princess Seonhwa, later becoming
    her husband and king, and (per legend) built Mireuksa temple at her
    request — refined Baekje court robe, holding a small
    temple-pagoda or lotus-flower motif referencing Mireuksa, warm,
    romantic, gentle expression fitting the folk tale.

13. 의자왕(Uija, last king of Baekje) — id: uija_king. Final king of
    Baekje, nicknamed "Haedong Jeungja" (the Confucius-like paragon of
    the East) in his youth for his devotion to his parents and
    siblings — yet his later reign fell into decline, and in 660 the
    allied Silla-Tang forces took the capital Sabi within about two
    weeks, ending 700 years of Baekje with Uija and the royal family
    taken captive to Tang China — opulent gilt-bronze crown and richly
    patterned deep-red/purple robe showing his early nobility, but a
    heavy, resigned, defeated expression and slightly slumped posture
    marking the dynasty's fall.

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 2 — 신라·가야·발해 (16명)

신라는 마립간기(눌지왕)의 소박한 금테 두름에서 후기로 갈수록 나뭇가지·사슴뿔 모양 세움장식 금관과 곱은옥(曲玉)으로 화려해지고, 가야는 신라보다 단순한 꽃·풀 모양 금동관을 쓴다. 발해는 고구려 유민 정체성과 당(唐) 문물을 함께 받아들여 초기엔 소박한 무장 차림이었다가 문왕 대에 이르러 당풍 단령포(團領袍)·복두 차림의 황제국풍 관복으로 바뀐다.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.

A grid sheet of 16 ancient Korean royal figures, evenly spaced, same
scale:

1. 눌지마립간(Nulji Maripgan) — id: nulji_king. 5th-century Silla ruler
   in the pre-crown "Maripgan" era — simple gold headband/diadem
   instead of a full crown, sturdy plain robe. Composed, diplomatic
   expression fitting the 433 Silla-Baekje alliance, but with a
   faint solemn undertone referencing loyal minister Bak Jesang, who
   died rescuing the king's brother hostages — perhaps a small knotted
   cord or simple token motif hinting at that sacrifice.

2. 지증왕(Jijeung) — id: jijeung_king. Early 6th-century Silla king, the
   first to formally adopt the title "King" and the name "Silla" (503)
   — classic Silla gold crown with tree-shaped uprights and jade
   comma-shaped (gogok) beads, deep blue-green robe. Stern,
   reform-minded expression (he outlawed human sacrifice/순장 in 502 and
   promoted ox-plowing); a small carved wooden lion figure resting near
   him references Isabu's ruse that subdued Usan-guk (Ulleungdo).

3. 법흥왕(Beopheung) — id: beopheung_king. Silla king who legalized
   Buddhism (527) through the martyrdom of his retainer Ichadon —
   ornate gold crown, robe with a lotus or sutra-scroll motif. Serene,
   devout expression tinged with quiet grief; a faint white-lotus or
   milk-white motif near his hand subtly recalls the legend that
   Ichadon's blood ran white as milk at his execution.

4. 진흥왕(Jinheung) — id: jinheung_king. 6th-century Silla's great
   conquering king — richest gold crown yet, deep royal robe,
   confident commanding pose. Holds or stands beside a stone
   monument-stele motif (referencing his Changnyeong/Bukhansan/
   Maun-ryeong/Hwangchoryeong tour-inspection steles), with a hint of
   a young hwarang trainee nearby symbolizing his founding of the
   Hwarang order.

5. 문무왕(Munmu) — id: munmu_king. Silla king who completed the
   unification of the Three Kingdoms — ornate gold crown and armor
   beneath his robe, resolute warrior-king bearing. A carved dragon
   motif coils near him, referencing his dying wish to be cremated and
   his ashes enshrined beneath the sea (Daewangam) so he could become
   a sea-dragon guarding the nation forever.

6. 신문왕(Sinmun) — id: sinmun_king. Late-7th-century Silla king who
   crushed the Kim Heumdol rebellion right after his succession and
   founded the Gukhak national Confucian academy — gold crown, formal
   court robe with a scholar's tablet (hol). He holds a magical
   bamboo flute (Manpasikjeok, said to calm wind and waves and heal
   all ills), expression firm and newly authoritative after
   consolidating royal power.

7. 경덕왕(Gyeongdeok) — id: gyeongdeok_king. 8th-century Unified Silla
   king at the cultural height of Bulguksa and Seokguram — the most
   ornate gold crown and jade beads, refined aristocratic robe with a
   small pagoda or temple-roof motif. Outwardly cultured and composed,
   but with a faint uneasy undertone in the eyes, hinting at his
   forced revival of the noble 녹읍 land-stipend system and the
   resurgent aristocratic power that shadowed his reign.

8. 원성왕(Wonseong) — id: wonseong_king. Unified Silla king who created
   the Dokseo-sampum-gwa Confucian civil exam — scholarly court robe
   with an official's tablet and an examination scroll in hand, gold
   crown. Thoughtful administrator's expression, with a subtle rain
   or swollen-river motif in the background referencing the legend
   that a sudden flood on the Alcheon River kept his rival from
   crossing, letting him claim the throne instead.

9. 흥덕왕(Heungdeok) — id: heungdeok_king. 9th-century Unified Silla
   king who granted Jang Bogo the Cheonghaejin naval garrison — gold
   crown, robe with a subtle wave/anchor motif. A solitary, quietly
   grieving expression, refusing to ever remarry after his queen's
   death; a small caged parrot motif nearby recalls the Samguk Yusa
   tale of the widowed parrot who pined for its lost mate before a
   mirror.

10. 진성여왕(Jinseong, Silla's last reigning queen) — id: jinseong_queen.
    Unified Silla QUEEN in the empire's late-9th-century decline —
    female royal figure, ornate gold crown, elegant flowing robe,
    holding a poetry scroll (referencing the hyangga anthology
    Samdaemok she commissioned). Weary, troubled expression, with
    faint smoke or unrest in the background evoking the Wonjong-Aeno
    peasant rebellion and the crumbling order after her regent
    Wihong's death.

11. 경순왕(Gyeongsun, last king of Silla) — id: gyeongsun_king. Final
    king of Silla, who surrendered his kingdom to Goryeo's Taejo
    Wanggeon in 935 — once-splendid gold crown and royal robe now worn
    with subdued, unadorned dignity. Downcast, resigned expression, a
    single tear or heavy sorrow implied — his son, the "Hemp-Robed
    Prince" (마의태자), opposed the surrender and fled to the mountains
    in mourning clothes rather than accept it.

12. 김수로왕(Kim Suro, founder of Geumgwan Gaya) — id: suro_king.
    Legendary founder-king of Gaya, said to have descended from
    heaven in a golden box wrapped in a purple cord at Guji-bong hill
    — distinctive Gaya-style gilt-bronze crown with flower/grass-shaped
    uprights (simpler and more organic than Silla's antler shapes).
    Warm, founding-father expression; a small golden egg-shaped box
    motif and a hint of iron ingots nearby (Geumgwan Gaya's famed iron
    industry), with Princess Heo Hwang-ok — his queen who arrived by
    ship from a distant land — subtly suggested at his side.

13. 이진아시왕(Ijinasi, founder of Daegaya) — id: ijinasi_king. Legendary
    founder of Daegaya, said in myth to be one of twin sons born when
    the mountain goddess of Gayasan, Jeonggyeon-moju, united with a
    heavenly god (making him a mythic "brother" of Kim Suro) —
    similar Gaya-style gilt-bronze crown but with a distinct color
    accent from Kim Suro's, a small mountain-peak motif referencing
    Gayasan, dignified founder pose.

14. 대조영(Dae Joyeong, founder-king of Balhae) — id: daejoyeong_king.
    Founder of Balhae — after leading Goguryeo refugees and Mohe
    (말갈) followers to victory over Tang forces at the Battle of
    Cheonmullyeong (698), he built his fortress capital at Dongmosan
    and declared the era name Cheontong. Sturdy Goguryeo-style
    lamellar armor beneath a plain founder's cloak, resolute
    battle-tested expression, a war banner or mountain-fortress motif
    nearby.

15. 무왕(Balhae King Mu, Dae Muye) — id: mu_balhae_king. Balhae king
    known for the era name "Inan" and Jang Munhyu's bold naval strike
    on Tang China's Dengzhou (Shandong) port, killing its governor —
    Balhae official dress: a round-collared robe (danryeongpo) in deep
    purple (highest rank color in Balhae's dress code) with a
    bokdu-style hat, martial confident expression, hand resting on a
    sword hilt, a small warship motif referencing the Dengzhou raid.

16. 문왕(Balhae King Mun, Dae Heummu) — id: munwang_king. Long-reigning
    Balhae king who adopted Tang China's Three Chancelleries/Six
    Ministries (3성 6부) government system and moved the capital to
    Sanggyeong — richer, more formal Tang-style court robe with a
    seal or ceremonial tablet in hand, composed and imperially
    dignified bearing (his daughters' tomb inscriptions actually call
    him "Hwangsang," Emperor, showing Balhae's self-image as an
    equal to Tang).

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 3 — 고려 (12명)

고려 관복은 자색·홍색 계열에 통천관·곤룡포를 갖춘 문치 중심의 온화한 인상이 기본이다. 다만 이 열두 명은 초기 건국기(태조·광종)의 강단 있는 창업/숙청 군주부터 중기 문물정비기(성종~예종)의 문신풍 군주, 후기 정치적 격변기(인종·원종)를 거쳐 원 간섭기의 시작(충렬왕)과 반원 자주개혁(공민왕)까지 이어지므로, 인물별로 표정·소품에 시대적 변화(특히 충렬왕부터 섞이는 몽골풍 요소)를 반영했다. 성종·현종·숙종은 조선에도 같은 묘호의 왕이 있어 프롬프트에 "Goryeo king"임을 명시해 구분했다.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.

A grid sheet of 12 Goryeo royal figures, evenly spaced, same scale:

1. 태조(왕건, Taejo of Goryeo) — id: taejo_goryeo_king. Goryeo's
   FOUNDING king (not to be confused with Joseon's Taejo Yi Seong-gye)
   — unified the Later Three Kingdoms in 936 and secured power by
   marrying into many local strongman (hojok) clans and using the
   sasimgwan/giin systems to control the provinces. Dignified elder
   founder-king, purple/gold Goryeo court robe, tongcheongwan-style
   crown, calm authoritative expression, holding a folded scroll
   referencing his Ten Injunctions (Hunyo Sipjo) for his descendants.

2. 광종(Gwangjong) — id: gwangjong_king. Ruthless centralizing reformer
   — freed slaves illegally held by hojok clans (nobi angeom-beop),
   introduced the gwageo civil exam to elevate new scholar-officials,
   even declared himself emperor with his own era name, then carried
   out brutal purges of rivals including royal relatives in his later
   years. Cold, stern, unsmiling expression, slightly more ornate
   imperial-tinged robe (referencing his self-proclaimed emperor
   status), holding a torn slave-ownership document or exam paper.

3. 성종(Seongjong, Goryeo king) — id: seongjong_goryeo_king.
   Late-10th-century Goryeo king who adopted Choe Seung-no's 28-point
   reform memorial and established the 12 mok provincial centers,
   promoting Confucian-centered aristocratic governance. Refined
   purple/gold court robe, tall black official's hat, thoughtful
   reform-minded administrator's expression, holding a memorial
   scroll.

4. 현종(Hyeonjong, Goryeo king) — id: hyeonjong_goryeo_king.
   Early-11th-century Goryeo king who, as an 18-year-old, fled the
   2nd Khitan invasion south through Jeonju and Gwangju to Naju,
   surviving on the protection of loyal officials and commoners, then
   sponsored the first Tripitaka Koreana woodblocks to pray for divine
   protection — before his sudden accession he had spent his youth
   quietly raised in Buddhist-monastery seclusion due to a royal
   scandal. Youthful but resilient, travel-worn hem on his court robe,
   a faint sutra-scroll or prayer-bead motif hinting at his monastic
   past, steady determined expression.

5. 문종(Munjong) — id: munjong_king. Presided over Goryeo's golden age
   of prosperity (해동천하) — bright and studious since childhood,
   skilled at archery, patronized great scholars like Choe Chung who
   founded Goryeo's first private academies. Mature, confident,
   cultured monarch, refined robe, a small bow motif alongside a
   scholar's scroll, serene prosperous expression.

6. 선종(Seonjong) — id: seonjong_king. Succeeded his frail brother
   Sunjong after only three months on the throne and presided over a
   stable, culturally open reign with active Song-China exchange —
   his younger brother, the monk Uicheon, secretly traveled to Song to
   study Buddhism, a diplomatic stir that Seonjong smoothed over.
   Calm, gentle court robe, a faint Buddhist sutra-scroll motif,
   composed diplomatic expression.

7. 숙종(Sukjong, Goryeo king) — id: sukjong_goryeo_king. Seized the
   throne from his young nephew Heonjong in a near-coup, then, after
   early defeats against the Jurchen, backed Yun Gwan's proposal to
   organize the elite Byeolmuban army and minted Haedong Tongbo coins
   to promote a money economy. Hard-edged, ambitious, resolute
   expression, holding a Haedong Tongbo coin with a spear motif beside
   him, court robe.

8. 예종(Yejong) — id: yejong_king. Backed Yun Gwan's campaign of some
   170,000 Byeolmuban troops against the Jurchen and the building of
   the Nine Fortresses in the northeast — a triumph that soured within
   a year when the fortresses proved unsustainable to defend and had
   to be returned to the Jurchen. Holding a campaign map/scroll of the
   Nine Fortresses, proud but faintly pensive expression reflecting
   that bittersweet outcome.

9. 인종(Injong) — id: injong_king. Endured Yi Jagyeom's rebellion (his
   own father-in-law seized power and reportedly tried to poison him),
   then Myocheong's Seogyeong-relocation movement, including a violent
   storm during the royal procession toward Seogyeong that killed many
   in his escort. Youthful but visibly anxious, embattled expression,
   court robe looking slightly windswept and disheveled.

10. 원종(Wonjong) — id: wonjong_king. Ended decades of military-regime
    (Choe clan) rule and returned the capital from Ganghwado back to
    Gaegyeong after prolonged wars with the Mongols, then ordered the
    disbandment of the elite Sambyeolcho troops — sparking their
    revolt — while also arranging his son's marriage to a Yuan
    princess, opening the door to the Mongol-interference era that
    followed. War-weary elder king, traditional Goryeo court robe,
    holding a treaty/decree scroll, an expression mixing relief and
    unease.

11. 충렬왕(Chungnyeol) — id: chungnyeol_king. Married Kublai Khan's
    daughter, the Jegukdaejang princess, in 1274, and returned to
    Goryeo already wearing a Mongol-style byeonbal hairstyle and
    Mongol dress — famously shocking onlookers to tears — with the
    Jeongdong Haengseong office established soon after his accession,
    marking the start of the Yuan-interference period. Goryeo royal
    robe visibly mixed with Mongol elements (partially shaved/braided
    byeonbal hair, a Mongol-style belt ornament), dignified but
    uneasy, conflicted expression.

12. 공민왕(Gongmin) — id: gongmin_king. Abolished Mongol-era customs,
    era names, and offices including the Jeongdong Haengseong and the
    Ssangseong Chonggwanbu (recovering the northeast with the help of
    local strongmen Yi Ja-chun and his son Yi Seong-gye), restored
    Munjong-era institutions, and appointed the monk Sindon to run
    land/slave reforms through the Jeonmin Byeonjeong Dogam; he was
    also personally renowned as a skilled painter. Proud, resolute
    sovereign-style robe deliberately free of Mongol elements,
    confident commanding expression, holding a reform decree scroll
    (or a painter's brush, referencing his own artistic reputation).

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 4 — 조선 전기 (9명)

조선 왕 특유의 익선관(翼蟬冠)+곤룡포(용포)/홍룡포로 통일하되, 나이·표정·소품으로
개인차를 준다 — 개국 시조는 무장 출신다운 다부진 풍채로, 폐위된 어린 임금은
애처로운 소년의 모습으로, 성군은 온화한 학자의 인상으로 그린다. 특히 연산군은
사용자 요청에 따라 이 그리드에서 유일하게 공통 스타일의 "온화한 표정" 규칙을
깨고, "조선 최고의 폭군" 이미지가 한눈에 드러나도록 표정·자세·소품을 예외적으로
강렬하게 처리했다.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.

A grid sheet of 9 early-Joseon royal figures, evenly spaced, same
scale:

1. 태조 이성계(Taejo Yi Seong-gye) — id: taejo_yi_king. Founder of
   Joseon (1392) and former Goryeo general who won major battlefield
   victories (Hwangsan-daecheop, Hamju-daecheop) before founding the
   dynasty and moving the capital to Hanyang. Sturdy, weathered
   warrior-turned-king build with broad shoulders and a solid stance,
   dignified founding-father expression, calm but commanding bearing —
   a soldier's toughness still visible beneath the royal robe.

2. 태종(Taejong) — id: taejong_king. Seized the throne through two
   bloody "Strife of Princes" succession struggles, then abolished the
   private armies of royals and meritorious officials (sabyeong
   hyeokpa), enforced the hopae identification-tag system, and purged
   even his own in-laws to concentrate royal authority. Sharp, cold,
   calculating gaze, rigidly upright posture, stern unsmiling
   expression — a ruler who governed through resolve and ruthlessness
   rather than warmth.

3. 세종(Sejong) — id: sejong_king. Creator of Hunminjeongeum
   (Hangeul), expanded the northern frontier with the Four
   Garrisons and Six Forts, and sponsored scientific inventions like
   the rain gauge (cheugugi) and sundial (angbuilgu). Warm, studious,
   gentle scholarly expression, composed dignified posture, holding or
   seated near a book/scroll and a small rain-gauge or sundial motif.

4. 단종(Danjong) — id: danjong_king. Enthroned at just twelve with
   real power held by regents, deposed within a year when his uncle
   Suyang-daegun (Sejo) seized power in the 1453 Gyeyu Jeongnan coup;
   demoted to commoner rank, exiled to Yeongwol, and put to death at
   sixteen. Very young, physically slight build, the royal robe and
   headgear looking oversized on him, a sorrowful, frightened, or
   dazed youthful expression, drooping shoulders — an image of
   childlike vulnerability rather than authority.

5. 세조(Sejo) — id: sejo_king. Loved horseback riding, archery, and
   hunting; built his power base by winning over scholars like Han
   Myeong-hoe and Sin Suk-ju, then seized the throne through the
   bloody 1453 coup that eliminated Kim Jong-seo and Prince Anpyeong,
   forcing his young nephew Danjong's abdication in 1455 — succession
   in name, usurpation in fact. Physically robust, athletic
   archer/hunter's build, intense watchful eyes, a hand resting near a
   bow or sword hilt, a commanding but faintly ruthless expression.

6. 성종(Seongjong) — id: seongjong_king. Completed the Gyeongguk
   Daejeon legal code, revived Hongmun-gwan as a scholarly
   institution, held frequent gyeongyeon lecture-debates with Confucian
   scholars, and founded dokseodang reading retreats for young
   officials. Gentle, cultured, mild-mannered scholarly expression,
   refined composed posture, holding or seated beside a bound law-code
   book (referencing the Gyeongguk Daejeon) — a legislator-scholar
   king.

7. 연산군(Yeonsangun) — id: yeonsangun_king. Remembered as Joseon's
   most notorious tyrant: he dug up and beheaded the corpse of scholar
   Kim Jong-jik over the "Joui-jemun" essay (Muo sahwa, 1498), then
   unleashed an even bloodier revenge purge for his mother's forced
   death (Gapja sahwa, 1504) — the deadliest sahwa of early Joseon —
   while sending officials nationwide to seize beautiful women and
   fine horses, staffing endless palace banquets with hundreds of
   hand-picked "Heungcheong" courtesans (origin of the idiom
   "heungcheong-mangcheong," squandering everything in revelry) and
   demolishing commoners' homes to expand his private hunting grounds;
   he also forced officials to wear a warning tag reading "the mouth
   is a blade that cuts the body" and burned Hangul books that
   criticized him. Break the sheet's default gentle expression for
   this figure ONLY: give him a manic, sneering, drunkenly flushed
   face with wild, bloodshot, arrogant eyes glaring down at the
   viewer; a garishly overloaded gold-embroidered crimson robe with
   the collar carelessly loosened and disheveled; one hand gripping an
   ornate wine goblet and the other holding a hunting bow or arrow as
   twin symbols of debauchery and violence; a looming, threatening
   posture leaning toward the viewer. Keep the same chibi proportions
   and linework as the rest of the sheet, but let the palette around
   him run darker and more saturated (deep red, black) to set a
   menacing tone distinct from the other eight figures.

8. 중종(Jungjong) — id: jungjong_king. Installed by the 1506 coup
   that deposed Yeonsangun; he initially embraced reformist scholar Jo
   Gwang-jo's idealistic policies (like the hyeollyang-gwa
   recommendation exam) but grew wary of the rising sillim faction and
   ultimately turned on them, sentencing Jo Gwang-jo to death in the
   1519 Gimyo sahwa. Composed but visibly indecisive, uneasy
   expression, a slightly hesitant posture as if caught between two
   factions, one hand gesturing uncertainly toward a scroll/edict — a
   king whose reign flip-flopped between reform and purge.

9. 명종(Myeongjong) — id: myeongjong_king. Enthroned at twelve after
   his half-brother Injong's brief eight-month reign; his mother Queen
   Munjeong ruled as regent for years and, with her ally Yun
   Won-hyeong, purged the rival faction in the 1545 Eulsa sahwa —
   records even describe her physically disciplining her adult son the
   king — while the outlaw Im Kkeok-jeong's uprising nearly convulsed
   the country during his reign. Youthful-to-middle-aged build but a
   visibly overshadowed, timid expression, slightly hunched or
   shrinking posture suggesting a king dominated by his mother, a
   subdued and uneasy gaze — a monarch without real authority of his
   own.

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 5 — 조선 후기·대한제국 (12명)

조선 왕 특유의 익선관(翼蟬冠)+곤룡포(용포)를 기본으로 하되, 시대가 후기로 갈수록 세도정치(안동김씨 등 외척 가문)에 왕권이 잠식되어 왕 개인의 존재감이 옅어지는 시대상을 표정·자세로 담았다. 선조·인조는 전란(임진왜란·병자호란)의 상처가, 순조·철종은 세도정치기 특유의 무력한 인상이, 고종은 1897년 대한제국 선포 이후 황제로서 황룡포(黃龍袍)·황제관을 착용했을 가능성까지 반영했다.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.

A grid sheet of 12 late-Joseon and Daehan Empire royal figures, evenly
spaced, same scale:

1. 선조(Seonjo) — id: seonjo_king. Joseon king who abandoned the capital
   during the 1592 Imjin War, fleeing all the way to Uiju on the Yalu
   River border and even seeking to defect into exile in Ming China.
   Formal ik-seon-gwan crown and red dragon robe, but a visibly weary,
   anxious expression and a slightly hunched, worn-down posture, eyes
   turned toward the horizon as if looking back at a lost capital.

2. 광해군(Gwanghae-gun) — id: gwanghae_king. King famous for his
   pragmatic "neutral diplomacy," carefully balancing between a
   declining Ming China and a rising Later Jin instead of committing to
   either side. Calm, calculating expression, one hand resting on a
   copy of the Donguibogam medical text he commissioned, the other
   near a folded diplomatic scroll — a shrewd gaze that looks like it
   is weighing two paths at once.

3. 인조(Injo) — id: injo_king. King who surrendered to the Qing at
   Samjeondo in 1637, forced to strip off his royal dragon robe and
   wear plain blue-grey commoner's clothing (namyeom-ui) while
   performing the humiliating three-kneelings-nine-bows ritual. Show
   him in dulled blue-grey robe rather than the usual red, in a
   bowing/kneeling posture with a downcast, humiliated expression; a
   discarded red royal robe visible at his feet hints at what was
   taken from him.

4. 효종(Hyojong) — id: hyojong_king. King who spent 8 years as a
   political hostage in Shenyang after the Manchu invasions and
   returned determined to avenge that humiliation through Bukbeol
   (a planned northern expedition), personally practicing horseback
   archery and martial arts. Sturdy, martial bearing beneath the
   dragon robe, gripping a bow or sword hilt, resolute battle-ready
   expression, gaze fixed northward.

5. 현종(Hyeonjong, Joseon) — id: hyeonjong_king. King who ascended as a
   teenager into the middle of the Yesong ritual controversy — a bitter
   factional dispute over how long Queen Jaui should mourn — which he
   was too young and politically weak to control, leaving the Seo-in
   faction dominant. Youthful, tired, indecisive expression, a
   somewhat overshadowed seated posture, holding a mourning-rite
   scroll he seems unable to resolve.

6. 숙종(Sukjong, Joseon) — id: sukjong_king. Fiery, ruthless king known
   for repeatedly purging and reinstating entire factions in sudden
   power reversals (hwan-guk) tied to the court rivalry between Queen
   Inhyeon and Consort Jang, and for ordering the Baekdusan Boundary
   Stele to fix the northern border. Commanding, almost cold
   charismatic expression, upright imposing posture, one hand near a
   boundary-stone or map motif referencing the stele.

7. 경종(Gyeongjong) — id: gyeongjong_king. Chronically ill,
   heavyset king whose short reign was consumed by the bloody Sinim
   purge between Noron and Soron factions, and who reportedly died
   after a meal of crab preserve and persimmons brought on fatal
   illness. Pale, unwell complexion, weary and frail expression,
   seated rather than standing, a small dish of crab preserve visible
   nearby as a quiet grim detail.

8. 영조(Yeongjo) — id: yeongjo. Long-reigning 18th-century king (52
   years on the throne) who grew up acutely self-conscious that his
   mother had been a lowly palace servant (musuri) — a complex that
   drove both his Tangpyeong balance-of-factions policy and a strict,
   almost puritanical personal frugality — and who halved commoners'
   military cloth tax through Gyunyeokbeop. Elderly but upright and
   vigorous, stern yet fair-minded expression, a plain, unadorned
   dragon robe reflecting his personal frugality, perhaps a small
   scale/balance motif referencing Tangpyeong.
   (이 캐릭터는 게임 NPC로도 쓰인다 — 파일명을 반드시 yeongjo로.)

9. 정조(Jeongjo) — id: jeongjo_king. Reformist king who built the
   Gyujanggak royal library to cultivate scholar-officials regardless
   of faction or class, founded his elite Jangyongyeong guard, and was
   himself a genuinely skilled archer; built Suwon Hwaseong fortress as
   a base for his reforms. Bright, sharp, intelligent eyes, upright
   energetic posture, holding a rolled fortress blueprint or a bow,
   with books/scrolls nearby referencing Gyujanggak.

10. 순조(Sunjo) — id: sunjo_king. Child king enthroned at age 10, first
    under Queen Dowager Jeongsun's regency and then dominated for the
    rest of his reign by his father-in-law Kim Jo-sun's Andong Kim
    clan — the start of Sedo in-law politics — his reign opening with
    the bloody Sinyu persecution. Young, passive, overshadowed
    expression, a slightly diminished posture as if standing in
    someone else's shadow despite the correct royal robe.

11. 철종(Cheoljong) — id: cheoljong_king. Known as "Ganghwa-doryeong" —
    his family had been branded traitors, and he grew up doing farm
    labor and woodcutting as a commoner on Ganghwa Island before the
    Andong Kim clan suddenly installed him as king precisely because
    he seemed easy to control; his reign ended amid the nationwide
    1862 Imsul peasant uprisings. Simple, bewildered, uneasy
    expression that looks out of place beneath the royal robe, a
    slightly awkward posture as if still unused to the throne, maybe a
    subtle sun-browned, work-worn hint to his hands.

12. 고종(Gojong) — id: gojong_king. King who opened the country with the
    1876 Ganghwa Treaty, survived repeated national crises (the Imo
    Mutiny, the Gapsin Coup, the assassination of Empress Myeongseong,
    his own flight to the Russian legation), and finally proclaimed
    the Korean Empire in 1897, becoming its first Emperor. May be shown
    in the golden-yellow imperial dragon robe (hwangnyongpo) and
    imperial crown adopted after 1897 instead of the king's red robe,
    reflecting his elevation to emperor — a complex expression mixing
    dignity, wariness, and quiet resolve, the look of a monarch who
    has weathered constant upheaval.

Each figure clearly separated with visible margin for easy cropping.
```

---

## 추가 — 동명성왕(주몽) (2026-08-28)

기출 집계 스크립트가 "동명성왕"이라는 시호만 찾고, 실제 문제에서 거의 항상
쓰이는 이름 "주몽"은 못 찾아서 원 안 숫자 0회로 잡혀 있었음(사용자 지적으로
확인). n을 2로 정정하면서 기출 왕(n>0) 기준에 새로 들어왔으므로 초상화 추가.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.

동명성왕/주몽(Dongmyeongseong-wang / Jumong) — id: dongmyeong_king.
Founder-king of Goguryeo, known almost entirely through his founding myth:
born from an egg after his mother Yuhwa was courted by Habaek's daughter
and the sun, raised in Buyeo where his archery skill was so famous his
name "Jumong" itself means "skilled archer," fled south with loyal
companions after Buyeo princes tried to kill him (legend says fish and
turtles rose to form a bridge across the Eomnok river for his escape),
and founded Goguryeo at Jolbon in 37 BCE — youthful, athletic build
(younger than the game's usual elder-king portraits), simple hemp/fur
hunter's tunic rather than court robes, a wooden bow slung over one
shoulder or held in hand, a quiver of arrows on his back, confident and
determined young founder's expression, maybe a faint river or reed
marshland hinted behind him evoking the escape-crossing legend.
```

---

## 추가 — 전수조사로 발견한 8명 (2026-08-28)

동명성왕 건으로 "다른 왕들도 이름이 달라서 못 찾은 거 아니냐"는 질문을 받고,
아이클라우드에 있던 실제 원본 태그 데이터(74회분, 3,700문항의 era/topic
기록)를 찾아 전수 대조했다. 새로 원 안 숫자가 0에서 양수로 바뀐 8명 전부
초상화 추가 대상(기출 왕 n>0 규칙).

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.
Same rendering style across all characters in this sheet — consistent
line weight, consistent shading style, consistent proportions.

A grid sheet of 8 ancient/medieval Korean royal figures, evenly spaced,
same scale:

1. 위만(Wiman, Gojoseon) — id: wiman_king. Originally a general from the
   Chinese state of Yan who fled east with a band of followers around
   194 BCE; King Jun of Gojoseon granted him land as a border guardian,
   but Wiman then turned his forces around and seized the throne for
   himself. The Records of the Grand Historian note he adopted Gojoseon
   dress and the topknot (sangtu) hairstyle to win local trust — plain
   Gojoseon-style robe and a simple topknot rather than Chinese court
   dress, but a shrewd, ambitious, calculating expression that hints at
   his outsider origins and the betrayal to come, one hand resting near
   a sword hilt.

2. 준왕(King Jun, Gojoseon) — id: junwang_king. The last king of the
   older Gojoseon line, betrayed and driven from his throne by Wiman
   (whom he had trusted and given land to) around 194 BCE; fled south by
   sea to the Han River region and declared himself "King of Han" among
   the Mahan communities there. Weary, dignified king in retreat — plain
   worn robe from a hasty departure, a small boat or southward coastline
   hinted in the background, a bitter but proud expression of a
   betrayed monarch refusing to fully surrender his dignity.

3. 고국천왕(Gogukcheon, Goguryeo) — id: gogukcheon_king. Late-2nd-century
   king remembered for instituting the Jindaebeop (진대법) in 194 CE —
   Korea's earliest known relief-loan system, lending grain to poor
   farmers in spring to be repaid after autumn harvest — after being
   moved by a starving farmer's plight on a hunting trip. Warm,
   compassionate expression, holding or gesturing toward a grain sack or
   jar being distributed to a humble commoner, a caring ruler-of-the-
   people mood rather than a warrior king.

4. 무열왕/김춘추(Muyeol-wang / Kim Chunchu, Silla) — id: muyeol_king.
   Silla's first king from true-bone (jingol) rather than sacred-bone
   lineage, but far more famous for his pre-enthronement diplomatic
   career as Kim Chunchu: personally traveled to Goguryeo to request
   military aid (and was nearly imprisoned by Yeon Gaesomun), then
   secured the pivotal Silla-Tang alliance by sailing to Tang China and
   winning over Emperor Taizong — Samguk Yusa describes him as
   remarkably handsome and charismatic. Refined, silver-tongued diplomat
   bearing, elegant robe with a subtle nod to Tang-style court dress
   (he was recorded as adopting Tang court costume after his mission),
   confident persuasive expression, perhaps holding a diplomatic scroll
   or gesturing as if mid-negotiation.

5. 문주왕(Munju-wang, Baekje) — id: munju_king. Became king in 475 under
   the worst possible circumstances — his father Gaero had just been
   captured and executed by Goguryeo's Jangsu-wang, and Hanseong
   (Baekje's capital) had fallen — forcing an emergency relocation of
   the capital south to Ungjin (modern Gongju). Exhausted, grief-
   stricken, and anxious expression, hastily-arranged traveling robes
   rather than a formal enthronement outfit, a small retreating
   procession or the silhouette of Ungjin's hills hinted behind him,
   the weight of sudden catastrophe visible on his face.

6. 동성왕(Dongseong-wang, Baekje) — id: dongseong_king. Late-5th-century
   king who worked to restore Baekje's strength after the Hanseong
   disaster — strengthened the Silla-Baekje alliance (Naje dongmaeng)
   by marrying a Silla noblewoman in 493, and brought the Tamna
   (Jeju Island) polity under Baekje's influence. Confident,
   revitalizing young king's expression, a wedding/alliance motif (a
   ceremonial sash or a Silla-style ornament as a subtle nod to the
   marriage alliance), restoring rather than mourning mood — a contrast
   to his predecessor Munju.

7. 선덕여왕(Seondeok, Silla) — id: seondeok_queen. Silla's first reigning
   queen (r. 632-647) — commissioned Cheomseongdae (one of the oldest
   surviving astronomical observatories in East Asia) and, on monk
   Jajang's advice, the nine-story wooden pagoda at Hwangnyongsa; famous
   for the peony-painting legend where she deduced from a gift painting
   that the flowers had no fragrance because no bees or butterflies were
   painted alongside them, correctly foreseeing she would rule without a
   husband. Elegant, wise queen in fine Silla royal dress and a jeweled
   crown, serene intelligent expression, perhaps a small peony motif or
   Cheomseongdae's distinctive bottle-shaped silhouette worked into the
   background.

8. 공양왕(Gongyang-wang, Goryeo) — id: gongyang_king. The last king of
   Goryeo (r. 1389-1392), installed by Yi Seong-gye's faction as a
   powerless figurehead specifically because he seemed easy to control;
   his brief reign saw the 1391 Gwajeon Beop land reform that undercut
   the old aristocracy's power base, and ended with his forced
   abdication as Yi Seong-gye founded Joseon. Uneasy, hollow authority —
   grand royal robes that seem to sit uncomfortably on him, a distant or
   downcast gaze suggesting he knows the throne isn't really his,
   melancholy rather than dignified.

Each figure clearly separated with visible margin for easy cropping.
```

---

## 추가 — 순종(대한제국) (2026-08-28)

전체 재집계(원본 태그 데이터 대조)로 근대·개항기/대한제국의 순종이 0→1회로
바뀌면서 기출 왕 기준에 새로 들어옴. 신라·고려·조선 범위에서 초상화 없는
마지막 한 명(다른 왕들은 전부 앞선 "전수조사로 발견한 8명"에 포함됨).

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — big head (roughly head:body 1:2.2), soft
cel-shaded coloring, clean black linework, warm semi-flat palette,
gentle friendly expression, three-quarter or front-facing bust/full-body
shot, plain white background, no drop shadow, no watermark, no text.

A grid sheet of 1 late-Korean-Empire royal figure (single portrait, same
composition rules as the other grids):

1. 순종(Sunjong, Daehan Empire) — id: sunjong_king. Second and last
   emperor of the Korean Empire (r. 1907-1910), enthroned after his
   father Gojong was forced to abdicate by Japan following the Hague
   Secret Emissary Affair; sickly and largely powerless throughout his
   reign as Japan's Residency-General under Ito Hirobumi steadily
   stripped away Korean sovereignty, ending with the 1910 Japan-Korea
   Annexation Treaty that formally ended the dynasty. Pale, frail,
   melancholic bearing in the golden-yellow imperial dragon robe
   (hwangnyongpo) and imperial crown, a hollow ceremonial dignity — eyes
   that seem distant or resigned rather than commanding, the visual
   sense of a monarch presiding helplessly over his own nation's end.

Clear margin around the figure for easy cropping.
```

## 재생성 — 순종(대한제국) 흉상 구도로 다시 (2026-08-28)

기존 순종 그림이 다른 왕들과 달리 전신샷으로 나와, 흉상(가슴 위)만 나오도록
프롬프트를 명시적으로 강화해 다시 요청. `assets/portraits/sunjong_king.png`를
새 결과물로 교체할 것.

```
Cute chibi-style character portrait in the same art style as a Korean
educational history game — BUST PORTRAIT ONLY: head, neck and upper
chest/shoulders, cropped right below the shoulders — do NOT show the
full body, hands, or robe hem. Big head (roughly head:body 1:2.2 in
the visible bust area), soft cel-shaded coloring, clean black
linework, warm semi-flat palette, gentle friendly expression,
front-facing or slight three-quarter angle, plain white background,
no drop shadow, no watermark, no text, no caption/label under the
image.

순종(Sunjong, Daehan Empire) — id: sunjong_king. Second and last
emperor of the Korean Empire (r. 1907-1910), enthroned after his
father Gojong was forced to abdicate by Japan following the Hague
Secret Emissary Affair; sickly and largely powerless throughout his
reign as Japan's Residency-General under Ito Hirobumi steadily
stripped away Korean sovereignty, ending with the 1910 Japan-Korea
Annexation Treaty that formally ended the dynasty. Pale, frail,
melancholic bearing in the golden-yellow imperial dragon robe
(hwangnyongpo) visible at the shoulders, and an imperial crown, a
hollow ceremonial dignity — eyes that seem distant or resigned rather
than commanding, the visual sense of a monarch presiding helplessly
over his own nation's end. Keep the framing tight and consistent with
a close-up head-and-shoulders bust, matching how the other kings in
this game are portrayed (not a full standing figure).
```

---

## 완료 후 연결 방법

각 그리드 이미지를 받아 인물별로 잘라 `assets/portraits/{id}.png`로 저장한 뒤,
`www/index.html`의 `KINGS_DATA`에서 해당 왕 항목에 `"p":"{id}"`를 추가(또는
기존 값을 새 id로 교체)하면 왕 계보 모달에 반영된다. 영조는 추가로
`www/assets/tools/specs/hugi1.json`(또는 `author_specs.py`의 `yeongjo_0`
npc 정의)의 portrait 경로도 `yeongjo`로 맞춰져 있는지 확인할 것.
