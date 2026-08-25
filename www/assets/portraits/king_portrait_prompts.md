# 왕 계보용 초상화 제미나이 프롬프트 (신규 37명)

왕 계보 모달에 이미지가 들어가면 학생들이 왕을 "장면"이 아니라 "얼굴"로
기억할 수 있다는 아이디어에서 시작. 기출에 나오는 왕(원 안 숫자>0) 62명
중 **이미 게임 NPC 초상화가 있는 25명은 재사용**하고(아래 "재사용 목록"),
**새로 없는 37명만** 뽑으면 된다. 고려 태조는 왕건 NPC 초상화
(`wanggeon.png`)를 그대로 쓰므로 여기 포함하지 않았다.

영조는 hugi1.html에 NPC로 새로 들어갔는데 아직 초상화가 없다 — 아래
"그리드 EFG"에 포함했다. 이 프롬프트로 나온 그림은 `assets/portraits/
yeongjo.png`로 저장해서 NPC 대화와 왕 계보 모달(`'p':'yeongjo'`) 양쪽에
같이 쓰면 된다(재사용 23→25명이 된 것도 이번에 단종·고종 초상화가
이미 있다는 걸 다시 확인해서다).

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

## 작업 방식 (지금까지 해온 방식 그대로)

1. 그리드 하나(캐릭터 4~6명)를 한 번에 생성 — 따로따로 뽑으면 해상도·톤이 튄다.
2. 받은 이미지를 저장해서 보내주면 각 인물을 잘라 `assets/portraits/{id}.png`로 저장하고 게임에 연결.
3. 배경에 제미나이 로고나 마젠타 얼룩이 남는 경우가 잦았으니(오늘 밤에도 여러 건 고쳤다), 받으면 확인해서 알려주면 지운다.
4. 각 인물 설명 끝의 `id: ...`가 파일명이 된다.

---

## 그리드 A — 고조선·고구려 (6명)

공통 배경: 초기 국가~삼국시대 고구려. 갑옷은 쌍영총·안악3호분 등 고구려
고분벽화에 흔히 묘사되는 형태(찰갑, 볼가리개 투구)를 참고.

```
[공통 스타일 문단 붙이기]

A grid sheet of 6 ancient Korean royal figures, evenly spaced, same
scale:

1. 단군왕검(Dangun Wanggeom) — id: dangun_king. Legendary founder-king of
   Gojoseon; depicted in traditional folk-art style (as seen on Korean
   textbook illustrations), NOT as a specific historical costume record
   (predates written costume history) — white/undyed hemp robe, simple
   rope-like sash, a plain wooden or antler-like crown suggestion,
   long white beard, holding a wooden staff. Dignified, ancient,
   mythic elder.

2. 우거왕(Ugeo, last king of Wiman Joseon) — id: ugeo_king. Early Korean
   monarch, c. 2nd century BC — dark hemp/leather robe with simple
   woven belt, plain leather cap, stern wartime expression (his reign
   ended in war with Han China).

3. 고국원왕(Gogugwon, Goguryeo) — id: gogugwon_king. 4th-century Goguryeo
   king in scale armor (bicheolgap-style lamellar armor) with a
   rounded iron helmet with cheek guards, red officer's sash, grave
   expression (he died in battle).

4. 소수림왕(Sosurim, Goguryeo) — id: sosurim_king. 4th-century Goguryeo
   king, scholarly/reformist mood — dark robe with wide sleeves over
   armor, holding a Buddhist sutra scroll and a law-code tablet
   (references his adoption of Buddhism and legal code).

5. 광개토대왕(Gwanggaeto the Great) — id: gwanggaeto_king. Iconic
   Goguryeo warrior-king — ornate lamellar cavalry armor, tall plumed
   iron helmet, ornate sword at hip, confident commanding pose,
   golden accents suggesting his conquests.

6. 장수왕(Jangsu, Goguryeo) — id: jangsu_king. Elderly Goguryeo king (he
   reigned ~79 years) — richer court robe over armor, dignified aged
   face, holding a scroll map suggesting the move of the capital to
   Pyongyang.

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 B — 백제 (4명)

공통 배경: 백제 특유의 세련되고 화려한 금속공예(금동관, 금동신발 등),
곡선이 부드러운 백제 미술 특유의 온화한 인상 참고(무령왕릉 금제 유물풍).

```
[공통 스타일 문단 붙이기]

A grid sheet of 4 Baekje royal figures, evenly spaced, same scale:

1. 개로왕(Gaero) — id: gaero_king. Late 5th-century Baekje king, elegant
   gilt-bronze crown with flame-like prongs (Baekje royal crown style),
   flowing purple/deep-red robe, refined court dress, tense expression
   (his reign ended when Hanseong fell).

2. 삼근왕(Samgeun) — id: samgeun_king. Very young Baekje king (acceded as
   a boy) — smaller build than other kings, simplified gilt-bronze
   crown, plain but dignified robe, slightly uncertain youthful
   expression.

3. 무왕(Baekje Mu — the "Seodong" legend king) — id: baekje_mu_king.
   Baekje king associated with the Seodong-yo folk legend and Mireuksa
   temple — refined Baekje court robe, holding a small temple-pagoda
   motif or lotus flower (references Mireuksa), warm romantic/gentle
   expression fitting the folk tale.

4. 의자왕(Uija, last king of Baekje) — id: uija_king. Final Baekje king —
   opulent gilt-bronze crown and richly patterned deep-red/purple
   robe, but a melancholy, resigned expression (his reign ended in
   Baekje's fall in 660).

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 C — 신라 (6명)

공통 배경: 신라 특유의 나뭇가지·사슴뿔 모양 세움장식 금관(경주 출토
금관 스타일), 초기(마립간기)는 소박하게, 후기로 갈수록 화려하게.

```
[공통 스타일 문단 붙이기]

A grid sheet of 6 Silla royal figures, evenly spaced, same scale:

1. 눌지마립간(Nulji Maripgan) — id: nulji_king. 5th-century Silla ruler
   (title "Maripgan", pre-"king" era) — simpler gold headband/diadem
   rather than a full crown, sturdy plain robe, alliance-minded
   composed expression (negotiated the Silla-Baekje alliance).

2. 지증왕(Jijeung) — id: jijeung_king. Early 6th-century Silla king (first
   to formally use the title "King" and the name "Silla") — the classic
   Silla gold crown with tree/antler-shaped uprights and jade
   comma-shaped (gogok) beads, deep blue-green robe, authoritative
   pose.

3. 법흥왕(Beopheung) — id: beopheung_king. Silla king who legalized
   Buddhism — ornate gold crown, robe with a Buddhist lotus or
   sutra-scroll motif, serene devout expression.

4. 경덕왕(Gyeongdeok) — id: gyeongdeok_king. 8th-century Unified Silla
   king, height of Silla art/architecture (Bulguksa/Seokguram era) —
   very ornate gold crown and jade beads, refined aristocratic robe,
   cultured composed expression.

5. 원성왕(Wonseong) — id: wonseong_king. Unified Silla king who created
   the Dokseo-sampum-gwa civil exam system — scholarly-leaning robe
   with an official's tablet (hol) in hand, gold crown, thoughtful
   administrator's expression.

6. 흥덕왕(Heungdeok) — id: heungdeok_king. 9th-century Unified Silla king
   (era of Jang Bogo's maritime power) — gold crown, robe with a subtle
   nautical/wave motif hinting at the Cheonghaejin naval base, calm
   expression.

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 D — 신라(여왕)·가야·발해 (4명)

```
[공통 스타일 문단 붙이기]

A grid sheet of 4 royal figures, evenly spaced, same scale:

1. 진성여왕(Jinseong, Silla's last reigning queen) — id: jinseong_queen.
   Unified Silla QUEEN in late-9th-century decline — female royal
   figure, ornate gold crown, elegant flowing robe, but a troubled/
   weary expression (era of the Wonjong-Aeno peasant rebellion).

2. 김수로왕(Kim Suro, founder of Geumgwan Gaya) — id: suro_king. Legendary
   founder-king of Gaya (born from a golden egg per the Guji-ga myth) —
   distinctive Gaya-style gilt-bronze crown with flower/grass-shaped
   uprights (simpler and more organic than Silla's antler shapes,
   per actual Gaya crown artifacts), warm founding-father expression,
   maybe a small golden egg motif nearby.

3. 이진아시왕(Ijinasi, founder of Daegaya) — id: ijinasi_king. Legendary
   founder of Daegaya (the other major Gaya confederacy state) — similar
   Gaya-style crown but with a distinct color accent from Kim Suro's to
   tell them apart, dignified founder pose.

4. 무왕/대무예(Balhae King Mu) — id: balhae_mu_king. Balhae king known
   for the era name "Inan" and a naval strike on Tang China's Shandong
   coast — Balhae official dress: a round-collared robe (danryeongpo)
   in deep purple (highest rank color in Balhae's dress code) with a
   bokdu-style hat, martial confident expression, hand resting on a
   sword hilt.

Each figure clearly separated with visible margin for easy cropping.
```

## 그리드 EFG — 고려 후기~조선 후기 (15명, 영조 포함)

⚠ 확인 결과 정정: 고려 성종·현종·숙종은 조선의 같은 묘호 왕과 이름이
겹칠 뿐 실제로는 게임에 초상화가 없다(조선 성종·현종·숙종만 있음) —
아래 고려 세 왕은 신규다. 그리고 단종·고종은 원래 각각 별도 그리드에
있었는데, 확인해보니 이미 게임 NPC 초상화(`danjong.png`·`gojong.png`)
가 있어 재사용으로 옮기고 이 그리드에서는 뺐다(그만큼 자리가 남아
영조까지 넣어 정확히 15명을 맞췄다). 시대(고려/조선)가 섞여 있지만
그림체(치비 스타일)는 전 그리드 공통이니, 인물별로 그 시대에 맞는
복식만 정확히 설명해 넣었다 — 한 이미지 안에서 뽑아야 해상도·명도가
서로 안 튀고 다른 캐릭터들과도 위화감이 없다.

```
[공통 스타일 문단 붙이기]

A grid sheet of 15 royal figures, evenly spaced, same scale, arranged
in a clean grid (e.g. 5 columns × 3 rows) with generous margin around
each for easy cropping. Each figure wears clothing correct for THEIR
OWN era as noted individually below — do not mix eras on one figure.

고려 관복(자색·홍색 계열 관복, 통천관·곤룡포) — 문치·제도 정비 시대라
온화한 문관풍:

1. 성종(Seongjong, Goryeo) — id: seongjong_goryeo_king. Late-10th-century
   Goryeo king who adopted Choe Seung-no's 28-point reform memorial and
   set up the 12 mok (provincial administrative centers) — refined
   purple/gold court robe, tall black official's hat, thoughtful
   reform-minded administrator's expression, perhaps holding a scroll.

2. 현종(Hyeonjong, Goryeo) — id: hyeonjong_goryeo_king. Early-11th-century
   Goryeo king who survived the 2nd Khitan invasion (fled south to
   Naju) and sponsored the first Tripitaka Koreana woodblocks —
   court robe, resilient/steady expression, a small woodblock or
   sutra-scroll motif nearby.

3. 선종(Seonjong, Goryeo) — id: seonjong_goryeo_king. Late-11th-century
   Goryeo king — purple/gold court robe, calm unremarkable expression
   (a quiet transitional reign).

4. 숙종(Sukjong, Goryeo) — id: sukjong_goryeo_king. Late-11th-century
   Goryeo king who organized the Byeolmuban special army (on Yun
   Gwan's advice) and minted Haedong-tongbo coinage — court robe,
   holding a coin or a spear motif referencing the new army, resolute
   military-minded expression.

5. 예종(Yejong, Goryeo) — id: yejong_goryeo_king. Early-12th-century
   Goryeo king who sponsored Yun Gwan's Jurchen campaign — court robe,
   holding or gesturing toward a small map/scroll referencing the
   Nine Fortresses of the northeast.

6. 인종(Injong, Goryeo) — id: injong_goryeo_king. Goryeo king during Yi
   Jagyeom's rebellion and Myocheong's Seogyeong movement — court robe,
   slightly anxious/embattled expression reflecting political turmoil.

7. 충렬왕(Chungnyeol, Goryeo) — id: chungnyeol_king. First of the
   "Chung-" era Goryeo kings, married a Yuan Mongol princess — Goryeo
   royal robe now blended with visible Mongol-style details (a
   Mongol-influenced hat/hairstyle called byeonbal partially shown,
   Yuan-style belt ornament), signaling the start of Mongol
   interference — conflicted, dignified-but-uneasy expression.

조선 왕 특유의 익선관(翼蟬冠)+곤룡포(용포), 홍룡포로 통일하되 나이·
표정으로 개인차를 준다:

8. 태조 이성계(Taejo Yi Seong-gye, founder of Joseon) — id: taejo_yi_king.
   Founder of Joseon — sturdy warrior-turned-king build, dignified
   founding-father expression, perhaps a subtle military bearing under
   the royal robe (he was a general before founding the dynasty).

9. 중종(Jungjong) — id: jungjong_king. Joseon king installed by the
   Jungjong coup — composed but somewhat uncertain expression
   (reflects a reign shaped by factional pressure, e.g. Jo Gwang-jo's
   rise and fall).

10. 명종(Myeongjong) — id: myeongjong_king. Joseon king during the Eulsa
    sahwa purge and Im Kkeok-jeong's uprising — youthful-to-middle-aged,
    somewhat weary/overshadowed expression (his mother Queen Munjeong
    held real power during his reign).

11. 인조(Injo) — id: injo_king. Joseon king during the Manchu invasions
    (Jeongmyo/Byeongja horan) — troubled, humbled expression, robe
    slightly disheveled at the edges (references his humiliating
    surrender at Namhansanseong).

12. 경종(Gyeongjong) — id: gyeongjong_king. Joseon king during the
    Sinim-oksa factional purge (Noron vs Soron) — frail, sickly-looking
    build, anxious expression.

13. 영조(Yeongjo) — id: yeongjo. Long-reigning 18th-century Joseon
    king known for Tangpyeong (factional balance) policy — elderly but
    vigorous, stern fair-minded expression, perhaps holding a small
    drum motif referencing his revival of the Sinmun-go petition drum.
    (이 캐릭터는 게임 NPC로도 쓰인다 — 파일명을 반드시 yeongjo로.)

14. 순조(Sunjo) — id: sunjo_king. Young Joseon king at the start of
    Sedo (in-law clan) politics — youthful, somewhat overshadowed/
    passive expression.

15. 철종(Cheoljong) — id: cheoljong_king. Joseon king plucked from a
    common upbringing into the throne during Sedo politics era — simple,
    slightly bewildered everyman quality beneath the royal robe,
    uneasy expression (era of the 1862 Imsul peasant uprisings).

Each figure clearly separated with visible margin for easy cropping.
```

---

## 재사용 목록 (이미 있는 초상화, 새로 안 뽑아도 됨)

왕 계보 이름 → 기존 파일명 (그대로 연결하면 됨):

- 고려 태조 → `wanggeon.png`
- 세종 → `sejong.png`
- 태종 → `taejong.png`
- 세조 → `sejo.png`
- 성종(조선) → `seongjong.png`
- 연산군 → `yeonsangun.png`
- 선조 → `seonjo.png`
- 광해군 → `gwanghae.png`
- 효종 → `hyojong.png`
- 현종(조선) → `hyeonjong.png`
- 숙종(조선) → `sukjong.png`
- 정조 → `jeongjo.png`
- 광종 → `gwangjong.png`
- 공민왕 → `gongmin.png`
- 근초고왕 → `geunchogo.png`
- 무령왕 → `muryeong.png`
- 성왕(백제) → `seongwang.png`
- 진흥왕 → `jinheung.png`
- 문무왕 → `munmu.png`
- 신문왕 → `sinmun.png`
- 경순왕 → `gyeongsunwang.png`
- 대조영 → `daejoyeong.png`
- 문왕(발해) → `munwang.png`
- 단종 → `danjong.png`
- 고종 → `gojong.png`

⚠ 성종·현종·숙종은 고려와 조선에 같은 묘호를 쓰는 왕이 있는데, 실제로
게임에 있는 초상화(`seongjong.png`·`hyeonjong.png`·`sukjong.png`)는
전부 **조선** 쪽 왕만 그린 것이다(고려 성종·현종·숙종은 초상화 없는
NPC 없음). 그래서 위 그리드 E에 고려 성종·현종·숙종을 신규로 넣었다 —
파일명도 `seongjong_goryeo_king`처럼 구분해 헷갈리지 않게 했다.
