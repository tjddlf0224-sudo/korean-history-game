# BGM 제미나이 프롬프트 (전 챕터용)

지금 게임에는 배경음악이 전혀 없다(오디오 시스템 자체를 새로 붙여야 함).
36개 챕터를 시대·분위기별로 묶어서, 필요한 자리마다 하나씩 뽑을 수 있게
정리했다. 존(zone) 배경음악은 챕터 하나하나가 아니라 "분위기 그룹"으로
묶었다 — 예를 들어 조선 전기 궁궐은 챕터가 여러 개(1화·3화·6화 등)라도
음악은 하나만 있으면 된다.

각 항목의 코드블록은 그대로 통째로 복붙해서 쓰면 된다(공통 요청사항이
이미 각 블록 안에 들어있음).

## 작업 방식

1. 한 그룹씩 순서대로 뽑아서 저장해 보내주면, 파일명(`id: ...`)에 맞춰
   `assets/audio/{id}.mp3`로 저장하고 게임에 연결한다.
2. 존 전환 시 크로스페이드로 자연스럽게 바뀌도록 구현할 예정이니, 곡 시작과
   끝이 너무 튀지 않게 나오는지 확인해서 알려주면 손본다.

---

## A. 타이틀 · 챕터 선택 화면 (1곡)

챕터 목록 화면(index.html)에서 항상 흘러나오는 곡. 특정 시대에 치우치지
않고 "역사책을 펼치는" 느낌으로, 국악과 오케스트라를 은은하게 섞는다.

```
Calm, dignified, slightly nostalgic theme for a Korean history
textbook's title screen — like an old photo album or museum
introduction. Blend traditional Korean instruments (gayageum,
daegeum flute) with a small warm string ensemble, no percussion or
very sparse soft percussion only. Should feel timeless rather than
tied to one specific era, inviting the player to explore thousands
of years of history. Gentle dynamics, no big swells.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: title_theme
```

---

## B. 시대·분위기별 존 루프

### B1. 선사시대 (원시·자연)
해당: `seonsa1` 강가·움집 마을

```
Sparse, primal ambient loop for a prehistoric riverside settlement.
Simple wooden/bone-like percussion (soft hand drum, wood block),
breathy flute or ocarina-like tone playing a simple pentatonic
melody, occasional natural sounds implied through instrumentation
(not literal sound effects — just the mood of wind and water).
Minimal, spacious, unhurried — nothing that feels "civilized" or
courtly yet.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_prehistoric
```

### B2. 고대 삼국 — 궁궐·조정
해당: `godae1/2/3` 궁성·상경성, `gaya` 궁, `tongil` 왕궁 장면

```
Stately but modest ancient Korean royal court loop — earlier and
sparser than a grand Joseon palace theme. Feature gayageum and
piri (Korean double-reed oboe) trading a slow, dignified melody
over a light janggu (hourglass drum) pulse. Should feel ceremonial
and a little austere, evoking the Three Kingdoms / Balhae era
rather than the more ornate later Joseon court.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_ancient_court
```

### B3. 고대 삼국 — 전장·진영
해당: `godae3` 공산·고창 전투, `tongil` 황산벌, `gaya` 대가야 최후

```
Tense, driving ancient-battlefield loop. Heavy taepyeongso (Korean
oboe, piercing reed tone) blaring a modal war-call melody over
insistent buk (barrel drum) and jing (gong) hits marking a marching
rhythm. Should feel urgent and martial without being chaotic —
steady tempo suitable for looping under exploration, not a one-off
battle cue.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_ancient_war
```

### B4. 고려 — 궁궐·포구
해당: `goryeo1/2/3` 개경 궁궐·강화 임시도읍, `byeokrando` 벽란도 포구

```
Elegant, slightly melancholic Goryeo-dynasty court and harbor loop.
Combine gayageum with haegeum (Korean two-string fiddle, its
expressive sliding tone) for a wistful melody, gentle janggu
rhythm underneath. Should feel a touch more refined and worldly
than the Three Kingdoms court theme — Goryeo traded with the world
through its ports — with a faint sense of unease appropriate to an
era of invasions and power struggles.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_goryeo
```

### B5. 조선 전기 — 궁궐
해당: `ch0/ch1/ch3/ch6` 궁궐·근정전, `hugi1` 편전

```
Formal, confident royal-court loop for the Joseon palace — the
game's most "iconic" court theme, since many chapters are set here.
Piri and daegeum carrying a stately melody, gayageum arpeggios
underneath, steady janggu rhythm giving it quiet grandeur. Should
sound authoritative and orderly, like the well-run bureaucratic
heart of the dynasty — not martial, not sad, just dignified.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_joseon_palace
```

### B6. 조선 전기 — 서원·학당
해당: `ch2` 집현전, `ch4` 홍문관, `ch5b` 서원

```
Quiet, studious loop for a Confucian academy / royal research
institute. Sparse gayageum picking a slow contemplative melody,
long danso (small bamboo flute) tones, almost no percussion — just
occasional soft wood-block ticks like a study bell. Should feel
focused and calm, evoking scholars bent over books and debating
philosophy, not courtly ceremony.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_seowon
```

### B7. 조선 전기 — 유배·사화 (어두운 변주)
해당: `ch3` 청령포, `ch5` 사초 사고·유배지

```
Somber, isolated loop for a place of exile or political purge.
Solo haegeum playing a slow, mournful sliding melody, very sparse
accompaniment — a single low drone or occasional soft gong,
long silences. Should feel lonely and unjust rather than
tragic-grand; this is quiet suffering, not a dramatic death scene.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_exile
```

### B8. 조선 후기 — 임진왜란·호란 전장
해당: `imjin/imjin2` 진주성·한산도·행주산성, `hugi1` 남한산성·삼전도

```
Grim, high-stakes wartime loop for the Japanese and Manchu invasions
of Joseon. Taepyeongso and buk drums as in the ancient-battle theme,
but darker and heavier — slower tempo, minor mode, more dissonant
gong hits, a sense of a kingdom under siege rather than an army on
the march. Should be usable both for open battlefields and for a
grim last-stand fortress.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_invasion_war
```

### B9. 조선 후기 — 저잣거리·농촌
해당: `ch2b` 권농 들녘, `hugi2` 한양 저잣거리, `hugi3` 무너진 고을

```
Lively, folk-flavored loop for Joseon marketplaces and farm
villages. Buk and janggu keeping a bouncy folk rhythm (feel of
pansori/minyo folk song accompaniment), daegeum or piri playing
a cheerful, slightly rustic melody. Should feel warm and
everyday — merchants haggling, farmers working — with room to
darken slightly for hugi3's famine/uprising chapters if needed as
a variant.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_marketplace
```

### B10. 개항기 — 병영·전투
해당: `gaehang1` 광성보, `gaehang4` 우금치, `gaehang_ch2` 무위영 병영

```
Tense transitional-era military loop — still rooted in traditional
Korean instrumentation (taepyeongso, buk, jing) but with a hint of
encroaching Western brass in the harmony, suggesting modern
weapons arriving in an old world. Should feel like a losing fight
against overwhelming odds — determined but doomed, not triumphant.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_gaehang_war
```

### B11. 일제강점기 — 거리·저항
해당: `ilje1` 탑골공원, `ilje2` 경성 종로·상하이 임시정부, `ilje_ch7` 임시정부 청사

```
Melancholic hybrid loop blending early-20th-century Western string
ensemble with traditional Korean melodic ornamentation (a haegeum
or daegeum voice weaving through the strings). Slow, dignified,
sorrowful but not defeated — evokes both colonial-era city streets
and the quiet resolve of an independence movement office. Avoid
anything that sounds militaristic or triumphant; this is grief
carrying quiet determination.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_colonial_era
```

### B12. 현대 — 거리·광장
해당: `hyeondae1` 해방 정국, `hyeondae2` 광장, `hyeondae3` 광화문~판문점

```
Modern orchestral loop with a documentary-film quality — strings
and light percussion, occasionally a solo traditional instrument
(daegeum or haegeum) surfacing to keep the Korean identity audible.
Should shift in feel across use cases: capable of sounding hopeful
and civic (a public square) as well as tense (a protest or
division-era border scene) with the same core instrumentation, just
different dynamics.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_modern
```

### B13. 세시풍속 (민속 축제, 시대 초월)
해당: `sesi` 사계절 마을

```
Bright, festive Korean folk-festival loop themed around the four
seasons (세시풍속) — think a village celebrating Lunar New Year,
Dano, Chuseok. Full traditional percussion (buk, janggu, kkwaenggwari
small gong) in an upbeat samul-nori-flavored rhythm, taepyeongso or
piri carrying a joyful folk melody on top. Should feel communal and
celebratory, era-agnostic (folk customs spanning all of Korean
history, not tied to one dynasty).

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_folk_festival
```

---

## C. 특수 장면 전용 변주 (선택 — 위 존 루프를 어둡게 바꿔 쓰고 싶을 때)

특정 챕터의 한 장면만 유독 비극적이라 해당 존 루프를 그대로 쓰기
아쉬운 곳들이다. 굳이 다 따로 뽑지 않아도 되지만, 아래는 대표적으로
꼽을 만한 자리.

- `hugi1` 삼전도의 굴욕(인조 항복 장면) — B8(임진왜란·호란 전장)에서
  타악기를 다 빼고 정(gong) 한 대만 아주 느리게 울리는 변주로 충분.
- `ilje1` 탑골공원 만세운동 — B11(일제강점기)에서 후반부에 합창처럼
  현악기가 겹겹이 쌓이며 고조되는(악기만, 보컬 없이) 변주를 별도로
  받아두면 그 장면의 임팩트가 커진다.

```
Same instrumentation and mood as the colonial-era street loop
(bgm_colonial_era) — melancholic hybrid of early-20th-century
Western strings and traditional Korean melodic ornamentation
(haegeum or daegeum voice weaving through) — but building in
intensity over the loop: strings layering up, a subtle crescendo
suggesting a crowd's voice rising together, then settling back down
before the loop repeats. No vocals, no percussion hits that sound
like violence — this is a peaceful crowd's defiance, not a battle.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_colonial_uprising
```

---

## D. 팡파레 · 전환 스팅 (1회성, 루프 아님)

### D1. 정답 팡파레
퀴즈 정답 시 뜨는 `#fanfare` 연출에 맞춰 아주 짧게 흐르는 소리.

```
A bright, satisfying success-chime figure using traditional Korean
percussion — a single warm kkwaenggwari (small gong) hit or a quick
buk roll ending on a bright accent. No melody needed, just a clear
"correct!" feeling. Not loud or startling — this plays constantly
throughout a quiz-heavy game, so it should stay pleasant on repeat.
Only the first second or two of this clip will actually be used in
the game (trimmed down after generation), so keep that opening
instant strong and clean on its own even though the full clip below
will run longer.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: sfx_fanfare
```

### D2. 인트로 컷씬 스팅
매 챕터 시작 시 대사가 탭으로 넘어가는 인트로 화면에 깔리는 짧은 곡.

```
A somber, scene-setting cue — sparse solo instrument (haegeum or
daegeum) playing a slow rubato phrase with no fixed rhythm, like a
narrator taking a breath before telling a story. Should work under
any of the era-specific tones above without clashing — keep it
neutral and atmospheric rather than tied to one specific mood. Some
players read slowly, so this may need to loop while they finish the
intro text.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_intro_sting
```

### D3. 보스전 · 최종 퀴즈
`startsBoss`/최종 통합 퀴즈 구간에서 긴장감을 올리는 루프.

```
Tense, focused loop for a climactic multi-question quiz sequence —
faster tempo than the zone loops, a steady insistent janggu rhythm,
short repeating gayageum or piri phrase creating urgency, like a
countdown. Should feel like a final challenge without being scary —
this is an exam-under-pressure feeling, not a horror cue.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_boss_quiz
```

### D4. 챕터 엔딩 화면
`#end-screen`에서 흐르는 짧은 마무리 곡.

```
A resolving, reflective cue that feels like closing a book chapter —
warm strings or gayageum settling into a final held chord partway
through, calm and a little wistful, giving a sense of "this chapter
is complete, more to come." It's fine for the piece to settle and
go quiet/still for the remainder of the 30 seconds after that final
chord rather than starting something new.

Instrumental only, no vocals, no lyrics (dialogue text is overlaid on
screen so vocals would clash). Generate exactly 30 seconds long —
always request the full 30 seconds regardless of how the clip will
actually be used in-game (Gemini renders very short direct requests
and sound-effect-length clips poorly); this will be trimmed down or
looped afterward as needed. Keep it loop-friendly — no hard stop or
big one-shot finale right at the very end — so a 30-second segment
can repeat smoothly if it ends up used as a loop. Mixed to sit
quietly under UI sound effects and speech-bubble text — no sudden
loud stabs.

id: bgm_chapter_end
```
