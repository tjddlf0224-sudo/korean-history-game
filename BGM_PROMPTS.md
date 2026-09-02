# 타임슬립 한국사 — Suno AI BGM 프롬프트

작성 2026-09-02. 제미나이로 만든 기존 BGM을 Suno로 다시 만들기 위한 것.

---

## 1. 먼저 — 기존 BGM이 아쉬웠던 진짜 이유

파일을 재보니 **BGM 16곡이 전부 정확히 30.8초**다. 한 챕터를 5~10분 플레이하면
같은 30초를 **10~20번** 듣는다. 곡의 완성도와 무관하게 질릴 수밖에 없는 길이다.

그래서 이번엔 프롬프트만 바꾸는 게 아니라 **길이부터 바꾼다.**

| 항목 | 기존 | 이번 |
|---|---|---|
| 본편 BGM 길이 | 30.8초 | **90~120초** (같은 시간 플레이 시 반복 1/3~1/4로) |
| 스팅(짧은 효과) | 5~9초 | 그대로 5~9초 |
| 루프 이음매 | 신경 안 씀 | 이음매에 세게 치는 음 두지 않기(아래 §5) |

## 2. 이 게임 음악의 대전제 — **재촉하지 않되, 처지지도 않는다**

이 게임은 **시간제한이 없다.** "학습해야 하니까 생각을 해야 한다"는 이유로 일부러
뺐다. 그런데 음악이 몰아치면 시간제한이 없어도 플레이어는 쫓긴다.

그래서 긴장은 **음정(단조·불협)과 음색(낮은 북·태평소)**으로 만들고,
**속도로는 만들지 않는다.** 빨라지는 템포, 16분음표로 쪼개지는 퍼커션,
계속 상승하는 스트링은 전 곡에서 제외어로 막았다.

> **1차 프롬프트의 실수(2026-09-02 수정)**: "재촉하지 않는다"를 **"느리고 비운다"**로
> 잘못 옮겼다. 54~76 BPM에 `sparse`, `minimal melody`, `no strong hook`, `lots of
> empty space` 같은 말을 넣었더니 **배경음악이 아니라 명상음악**이 됐다.
> 타이틀곡에서 먼저 드러났다 — 사용자 평 "게임 노래인데 너무 처져".
>
> **재촉하지 않는 것과 생기가 없는 것은 다르다.** 그래서 전 곡을 다시 썼다:
> - BPM을 10~20 올렸다(느리게가 아니라 **안 몰아치게**가 목적이었으므로)
> - `no strong hook`, `minimal melody`를 빼고 **`memorable melody`를 넣었다**.
>   특히 `bgm_joseon_palace`는 17곳에서 나오는데 선율이 없으면 벽지가 된다
> - 대신 `accelerating tempo`(빨라지는 템포)를 제외어에 새로 넣어,
>   **활기는 주되 재촉은 막는** 쪽으로 방향을 분리했다
> - 타이틀곡이 사운드 정체성을 잡았으므로, 전 곡에 `warm low cinematic strings`를
>   깔아 **같은 사운드트랙처럼 들리게** 통일했다
>
> 예외 둘: `bgm_seowon`(퀴즈 푸는 자리)와 `bgm_exile`(유배)은 원래 성격이 조용한
> 곡이라 절제를 유지하되, **선율은 넣었다.** 비어 있는 것과 조용한 것은 다르다.

## 3. Suno 공통 설정

- **Custom Mode**로 들어간다(Simple Mode는 가사를 붙인다)
- **Instrumental 토글 ON** — 이게 가사를 막는 가장 확실한 방법이다
- 모델은 최신(v5 계열) 사용
- **Style** 칸에 아래 프롬프트를 통째로 붙인다
- **Exclude Styles** 칸에 각 곡마다 적어둔 제외어를 붙인다
- 한 곡당 **2~4번 생성**해서 고른다. Suno는 같은 프롬프트로도 결과가 꽤 다르다

### 국악기 이름 쓰는 법

Suno가 한국 악기 이름을 모를 수 있다. **반드시 서양식 설명을 괄호로 붙인다.**
아래 프롬프트는 전부 그렇게 써 두었다.

| 악기 | 프롬프트에 쓸 표기 |
|---|---|
| 가야금 | gayageum (Korean plucked zither) |
| 거문고 | geomungo (deep six-string Korean zither) |
| 대금 | daegeum (large Korean bamboo transverse flute) |
| 소금 | sogeum (small Korean bamboo flute) |
| 피리 | piri (Korean double-reed bamboo oboe) |
| 해금 | haegeum (two-string Korean bowed fiddle) |
| 아쟁 | ajaeng (bowed Korean zither, low and rough) |
| 태평소 | taepyeongso (loud Korean conical oboe) |
| 장구 | janggu (Korean hourglass drum) |
| 북 | buk (Korean barrel drum) |
| 징 | jing (large Korean gong) |
| 꽹과리 | kkwaenggwari (small sharp Korean gong) |
| 편종·편경 | pyeonjong and pyeongyeong (bronze bell chimes and stone chimes) |
| 나발·나각 | nabal (long straight trumpet), nagak (conch horn) |

---

## 4. 프롬프트

각 블록은 **그대로 복사해서 붙이면 되게** 통째로 적었다. 앞뒤 문단을 조합할 필요 없다.

---

### 4-1. `title_theme` — 제목 화면 (29초 → 60초)

게임의 얼굴. 유일하게 **선율이 기억에 남아야 하는** 곡.

> **1차 시도 실패 기록**: 처음엔 68 BPM에 `solemn and wistful`(장엄하고 애수 어린)로 썼는데,
> 게임 시작 화면이 아니라 다큐멘터리 오프닝이 됐다. 사용자 평 — "게임 노래인데 너무 처져".
> **시작 화면은 이 게임에서 유일하게 신나도 되는 자리다.** 여기서 플레이어는 문제를 풀지
> 않는다. 아래로 다시 썼다.

**A안 · 퓨전 드라이브 (추천)** — 국악기에 현대적 추진력을 얹은 게임 트레일러 느낌

```
Modern Korean fusion gugak game theme, heroic and exciting with strong forward drive, taepyeongso (loud Korean conical oboe) and daegeum (large Korean bamboo transverse flute) trading a bold memorable pentatonic hook, gayageum (Korean plucked zither) rapid plucked ostinato underneath, janggu (Korean hourglass drum) and large taiko-style buk (Korean barrel drum) locking into a powerful driving groove, low cinematic strings pushing forward, jing (large Korean gong) accents at phrase ends, 112 BPM, adventurous and triumphant, momentum from the first bar, main melody stated twice with the second time fuller, epic but light on its feet, instrumental, no vocals
```
**Exclude Styles**: `slow tempo, ambient, sparse, drone, melancholy, sad, solemn, funeral, vocals, chanting, choir, EDM, dubstep, drum kit`

**B안 · 정통 국악 활기** — 사물놀이 그루브로 밀고 가는, 더 한국적인 쪽

```
Uplifting Korean traditional adventure theme, bright and spirited and full of momentum, taepyeongso (loud Korean conical oboe) leading a bold heroic pentatonic melody, gayageum (Korean plucked zither) fast rolling arpeggios underneath, janggu (Korean hourglass drum) driving a lively rolling samulnori groove, buk (Korean barrel drum) accents, kkwaenggwari (small sharp Korean gong) sharp punctuation, jing (large Korean gong) on phrase ends, 108 BPM, strong forward drive, memorable main melody stated twice with the second time fuller, festive and heroic like setting out on a long journey, instrumental, no vocals
```
**Exclude Styles**: `slow tempo, ambient, sparse, drone, melancholy, sad, solemn, funeral, vocals, chanting, choir, EDM, drum kit, western orchestra`

> **같이 고친 것**: `title_theme`은 `exam_practice.html`의 '시대 통합' 문제 풀이 화면에서도
> 쓰이고 있었다. 타이틀을 신나게 만들면 **문제 푸는 동안 음악이 재촉하게 된다.**
> 그래서 '시대 통합'은 가장 조용한 `bgm_seowon`으로 바꿨다(2026-09-02 적용).

---

### 4-2. `bgm_prehistoric` — 선사·초기국가 (seonsa1)

문자도, 나라도 없던 시대. 선율 악기를 거의 안 쓴다. 넓고 원시적인 공간.

```
Cinematic tribal Korean prehistoric theme, ancient and adventurous with a sense of wide open discovery, bone flute carrying a simple memorable modal melody, low frame drums and hollow log percussion in a steady walking groove, stone knapping clicks as light rhythmic texture, deep male throat hum drone underneath, warm low cinematic strings supporting, 78 BPM, alive and moving but never rushed, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, wide natural reverb, instrumental, no vocals
```
**Exclude Styles**: `sparse ambient drone only, no melody, new age, fast percussion, accelerating tempo, rising strings, orchestral climax, choir, vocals, EDM, drum kit`

---

### 4-3. `bgm_ancient_court` — 고대 (godae1·2·3, gaya)

삼국·가야·발해·통일신라 궁정. 격식 있고 의례적. 화려하지 않고 단정하게.

```
Ancient Korean court theme, stately and proud with graceful forward motion, piri (Korean double-reed bamboo oboe) carrying a warm memorable pentatonic melody, daegeum (large Korean bamboo transverse flute) answering in dialogue, gayageum (Korean plucked zither) flowing arpeggios underneath, pyeonjong and pyeongyeong (bronze bell chimes and stone chimes) accenting phrases, janggu (Korean hourglass drum) in a steady dignified groove, warm low strings supporting, 84 BPM, elegant and alive, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `sparse, ambient drone only, no melody, fast percussion, accelerating tempo, rising strings, orchestral climax, vocals, chanting, EDM, drum kit`

---

### 4-4. `bgm_ancient_war` — 고대 전투 (tongil 황산벌, godae3 공산)

황산벌·공산 전투. **긴장은 주되 재촉하지 않는다** — 느린 큰 북으로 무게를 준다.

```
Ancient Korean battlefield theme, grim and heroic with heavy forward momentum, large buk (Korean barrel drum) driving a strong marching pulse, taepyeongso (loud Korean conical oboe) crying a bold minor melody, nagak (conch horn) and nabal (long straight trumpet) calls answering, low ajaeng (bowed Korean zither, low and rough) drone, jing (large Korean gong) accents, dark low cinematic strings, 94 BPM, weight and courage rather than panic, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `sixteenth note hi-hats, frantic percussion, accelerating tempo, rising strings, orchestral climax, cymbal crash, epic trailer riser, choir, vocals, double kick, EDM`

---

### 4-5. `bgm_goryeo` — 고려 (goryeo1·2·3, byeokrando)

불교 국가이면서 벽란도로 세계와 통했던 나라. 향 냄새와 바닷길이 같이 있어야 한다.

```
Goryeo era Korean theme with a faint Silk Road color, mysterious and richly colored with a gentle sway, haegeum (two-string Korean bowed fiddle) singing a memorable melancholy melody, gayageum (Korean plucked zither) rolling ostinato underneath, hand percussion in a lilting steady groove, low temple bell accents, warm low strings supporting, 88 BPM, exotic and flowing and alive, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `sparse, ambient drone only, no melody, chanting monks, vocals, fast percussion, accelerating tempo, rising strings, orchestral climax, EDM, drum kit`

---

### 4-6. `bgm_joseon_palace` — 조선 궁궐 **(가장 많이 쓰임 · 17곳)**

ch0~ch6, hugi1 등에서 계속 나온다. **가장 안 질려야 하는 곡**이므로 특히 절제하게.
선율을 앞세우지 말고 배경으로 물러나 있게 만든다.

```
Korean royal court theme, refined and graceful with quiet confidence, piri (Korean double-reed bamboo oboe) and daegeum (large Korean bamboo transverse flute) trading a warm memorable pentatonic melody, geomungo (deep six-string Korean zither) and gayageum (Korean plucked zither) weaving underneath, ajaeng (bowed Korean zither, low and rough) sustaining the bass, janggu (Korean hourglass drum) in a calm steady groove, pyeonjong (bronze bell chimes) accents, warm low strings supporting, 82 BPM, dignified and pleasant to hear many times over, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `sparse, ambient drone only, no melody, fast percussion, accelerating tempo, rising strings, orchestral climax, vocals, chanting, EDM, drum kit, dramatic build`

---

### 4-7. `bgm_seowon` — 학문의 자리 (ch2 집현전, ch4 홍문관, ch5b 서원, hugi2 성호)

**퀴즈를 푸는 곳**이다. 이 게임에서 가장 조용해야 하는 곡. 생각을 방해하면 안 된다.

```
Quiet Korean scholarly theme, serene and thoughtful with a gentle steady flow, geomungo (deep six-string Korean zither) playing a calm repeating figure, sogeum (small Korean bamboo flute) carrying a soft simple melody above it, gayageum (Korean plucked zither) light plucks, very soft low string pad, no drums, 72 BPM, warm and unhurried, easy to think over, present but never demanding attention, steady, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `percussion, drums, ambient drone only, long silence, dramatic build, crescendo, rising strings, vocals, new age, synth lead`

---

### 4-8. `bgm_marketplace` — 저잣거리·권농 (ch2b, hugi2 저잣, hugi3)

장터의 활기. 신나되 정신없지는 않게.

```
Korean folk marketplace theme, bright and bustling and good-humored, taepyeongso (loud Korean conical oboe) playing a catchy cheerful folk melody, gayageum (Korean plucked zither) strumming energetically, janggu (Korean hourglass drum) rolling a lively samulnori groove, kkwaenggwari (small sharp Korean gong) accents, jing (large Korean gong) on downbeats, warm acoustic bass underneath, 108 BPM, festive and busy but clean and never chaotic, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `frantic dense percussion, drum kit, electronic, vocals, shouting, muddy mix, dramatic build, accelerating tempo`

---

### 4-9. `bgm_exile` — 유배 (ch3 강화도, ch5 사고·유배)

혼자 남겨진 자리. 악기 하나로 충분하다.

```
Lonely Korean exile theme, desolate and aching yet quietly beautiful, solo daegeum (large Korean bamboo transverse flute) carrying a memorable sorrowful melody with breathy tone and wide vibrato, gayageum (Korean plucked zither) answering with sparse falling phrases, low bowed string drone far behind, faint sea wind, no drums, 68 BPM, spacious and slow moving but with a real melodic line, cold distant reverb, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `percussion, drums, ambient drone only, no melody, piano, synth, cinematic swell, crescendo, vocals, new age`

---

### 4-10. `bgm_invasion_war` — 임진왜란·병자호란 (imjin, imjin2, hugi1 남한산성)

침략당한 나라. 비장하되 절망적이지 않게 — 의병과 이순신이 있는 시대다.

```
Korean war era theme, grave and defiant with strong marching weight, deep buk (Korean barrel drum) driving a firm steady pulse, taepyeongso (loud Korean conical oboe) crying a bold minor melody, haegeum (two-string Korean bowed fiddle) doubling it darkly, low ajaeng (bowed Korean zither, low and rough) drone, jing (large Korean gong) accents, dark low cinematic strings, 96 BPM, resolve and momentum rather than panic, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `sixteenth note percussion, accelerating tempo, frantic, rising strings, orchestral climax, epic trailer riser, cymbal crash, choir, vocals, drum kit, EDM`

---

### 4-11. `bgm_folk_festival` — 세시풍속 (sesi)

명절. 이 게임에서 가장 밝은 곡. 마음껏 흥겹게.

```
Korean samulnori festival theme, joyful and exuberant and warm, full percussion quartet of kkwaenggwari (small sharp Korean gong), jing (large Korean gong), janggu (Korean hourglass drum) and buk (Korean barrel drum) locked in an infectious interlocking groove, taepyeongso (loud Korean conical oboe) singing a bright catchy festive melody on top, gayageum (Korean plucked zither) strumming, 116 BPM, village holiday celebration, warm outdoor air, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `electronic, drum kit, synth, vocals, shouting, aggressive, dramatic build, modern pop, muddy mix`

---

### 4-12. `bgm_gaehang_war` — 근대·개항기 (gaehang1~5, gaehang_ch2·ch3 · 12곳)

옛것과 새것이 부딪히는 시대. **국악기와 서양 취주악을 일부러 섞는다** — 그 충돌 자체가 이 시대다.

```
Late nineteenth century Korean transitional theme, restless and dramatic with old and new colliding, Western military brass band snare and muted trumpet playing against haegeum (two-string Korean bowed fiddle) and taepyeongso (loud Korean conical oboe), the two idioms overlapping in tension, low buk (Korean barrel drum) driving underneath, faint slightly out of tune upright piano, dark low strings, 100 BPM, gaslit harbor town in upheaval, forward moving and alive, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `clean modern pop production, EDM, synth lead, vocals, epic trailer riser, orchestral climax, accelerating tempo, drum kit`

---

### 4-13. `bgm_colonial_era` — 일제강점기 (ilje1·2, ilje_ch7 · 8곳)

**여기가 가장 조심할 곡.** 신파로 흐르면 안 된다. 슬프되 품위를 잃지 않게,
울리려 들지 말고 담담하게. 기획서의 원칙(일방적 매도·미화 없이)과 같은 태도로.

```
Restrained Korean colonial period theme, sorrowful but dignified and never self-pitying, haegeum (two-string Korean bowed fiddle) carrying a plain memorable minor melody without heavy ornament, upright piano playing a simple steady figure underneath, low cello sustaining, soft brushed pulse keeping gentle motion, distant street ambience, 80 BPM, quiet grief held in check with a steady forward walk, no swelling, no melodrama, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `melodrama, sentimental swelling strings, crescendo, choir, vocals, epic, orchestral climax, trot, enka, heavy vibrato, wailing`

---

### 4-14. `bgm_colonial_uprising` — 3·1 운동 (**현재 미사용 — 만세 장면에 붙일 것**)

지금 파일은 있는데 어느 챕터에서도 안 쓰고 있다. `manse.js`의 만세 장면에 붙이면 딱이다.

```
Korean independence movement theme, solemn and stirring with quiet gathering courage, haegeum (two-string Korean bowed fiddle) and daegeum (large Korean bamboo transverse flute) in unison on a simple memorable hymn-like melody, low hummed male drone underneath, deep buk (Korean barrel drum) stepping like a marching crowd, warm low strings, distant crowd murmur, 86 BPM, strength gathering steadily without turning triumphant or militant, steady rhythm, seamless loop, no intro, no outro, consistent energy, instrumental, no vocals
```
**Exclude Styles**: `triumphant fanfare, military march, brass band, epic trailer riser, choir singing words, vocals, aggressive percussion, EDM, orchestral climax`

---

### 4-15. `bgm_modern` — 현대 (hyeondae1·2·3)

해방 이후. 폐허에서 다시 짓는 온기, 그리고 광장. 국악기를 줄이고 피아노로.

```
Postwar Korean modern theme, warm and hopeful and quietly determined, felt piano playing a memorable rising melody, acoustic guitar arpeggios underneath, warm string pad, light brushed drums keeping an easy steady groove, soft bass, one distant daegeum (large Korean bamboo transverse flute) phrase as a memory of the older eras, 88 BPM, rebuilding and everyday resilience, gentle forward motion, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `epic orchestra, dramatic climax, EDM, heavy drums, vocals, pop song structure, cymbal crash, synth lead, sentimental swell`

---

### 4-16. `bgm_boss_quiz` — 논쟁·보스전 (현재 6.3초 → **60초로**)

`boss.js`가 쓰는 곡. 지금 6초짜리라 계속 끊긴다. **여기도 재촉하면 안 된다** —
답을 생각할 시간이 필요하다. 긴장은 저음과 불협으로만 준다.

```
Tense Korean debate confrontation theme, focused and pressing with a firm steady pulse, low geomungo (deep six-string Korean zither) repeating a dark ostinato figure, ajaeng (bowed Korean zither, low and rough) sustaining a dissonant drone, piri (Korean double-reed bamboo oboe) cutting in with short sharp phrases, janggu (Korean hourglass drum) on a firm unhurried beat, low cinematic strings, 88 BPM, pressure from low register and harmony not from speed, never accelerating, steady rhythm, seamless loop, no intro, no outro, consistent energy, no dramatic changes, instrumental, no vocals
```
**Exclude Styles**: `accelerating tempo, sixteenth note percussion, ticking clock, urgent rising strings, epic trailer riser, orchestral climax, drum kit, vocals, cymbal crash, EDM`

---

### 4-17. `bgm_intro_sting` — 챕터 시작 (36곳 · 6~8초로 짧게)

지금 30.8초짜리 루프 파일이 들어가 있다. **짧은 스팅으로 다시 만든다.**

```
Short Korean cinematic sting, seven seconds, one bright jing (large Korean gong) strike opening into a quick rising taepyeongso (loud Korean conical oboe) and daegeum (large Korean bamboo transverse flute) flourish over a warm low string swell, a single janggu (Korean hourglass drum) hit landing at the end, settling cleanly with natural decay, 100 BPM, sense of a curtain lifting on a new era, one single gesture only, no loop, instrumental, no vocals
```
**Exclude Styles**: `long form, repeating loop, percussion groove, vocals, fade out, EDM, slow ambient`

---

### 4-18. `bgm_chapter_end` — 챕터 끝 (36곳 · 8~10초)

한 화를 마쳤을 때. 성취감보다 **여운**.

```
Short Korean cinematic closing cadence, nine seconds, gayageum (Korean plucked zither) descending resolving figure answered by warm daegeum (large Korean bamboo transverse flute), low strings settling onto a final consonant chord, one distant jing (large Korean gong) fading, 72 BPM, satisfying sense of a chapter closing and a page turning, fully resolved ending with long natural decay, no loop, instrumental, no vocals
```
**Exclude Styles**: `fanfare, triumphant brass, percussion groove, vocals, abrupt cut, EDM, loop, sad, unresolved`

---

### 4-19. `sfx_fanfare` — 정답·보상 (45곳 · 2~3초)

가장 자주 들리는 소리다. **짧고 안 거슬려야 한다.** 45번 들어도 괜찮을 만큼.

```
Very short Korean reward chime, two seconds, three ascending gayageum (Korean plucked zither) plucked notes with a small bright bell doubling the last one, warm and gentle and satisfying, 100 BPM, clean quick decay, very short reverb tail, light and unobtrusive because it will be heard hundreds of times, no loop, instrumental, no vocals
```
**Exclude Styles**: `orchestral fanfare, brass, drums, long reverb tail, dramatic, vocals, arcade chiptune, loud, harsh`

---

## 5. 받은 뒤 처리 — 여기서 품질이 갈린다

### ① 길이: 90~120초를 뽑아 자른다
Suno에서 2~4분으로 생성한 뒤, **가장 좋은 구간 90~120초를 잘라 쓴다.**
30초로 만들지 말 것. 이게 이번 작업의 핵심이다.

### ② 루프 이음매: 세게 치는 음을 끝/시작에 두지 않는다
이 게임 엔진은 `<audio loop>` + MP3다. **MP3는 구조상 앞뒤에 미세한 무음이 붙어**
완벽한 무이음 루프가 안 된다(수십 ms). 그래서:

- 곡의 **끝과 시작이 지속음(드론·패드·긴 여운) 위에 오도록** 자른다
- 북이나 징을 세게 치는 지점에서 자르면 그 틈이 딱 들린다
- 반대로 대금 긴 음이나 드론 위에서 자르면 사람 귀에 거의 안 걸린다

### ③ 음량을 곡끼리 맞춘다
지금 엔진은 볼륨 0.55 고정에 900ms 크로스페이드다. 곡마다 음량이 다르면
챕터 넘어갈 때 튄다. **전 곡을 같은 라우드니스(-16 LUFS 정도)로 맞춘다.**

### ④ 파일명은 기존 그대로
코드 수정 없이 교체하려면 이름을 반드시 맞춘다:
```
title_theme.mp3        bgm_prehistoric.mp3     bgm_ancient_court.mp3
bgm_ancient_war.mp3    bgm_goryeo.mp3          bgm_joseon_palace.mp3
bgm_seowon.mp3         bgm_marketplace.mp3     bgm_exile.mp3
bgm_invasion_war.mp3   bgm_folk_festival.mp3   bgm_gaehang_war.mp3
bgm_colonial_era.mp3   bgm_colonial_uprising.mp3  bgm_modern.mp3
bgm_boss_quiz.mp3      bgm_intro_sting.mp3     bgm_chapter_end.mp3
sfx_fanfare.mp3
```

### ⑤ 용량 주의
앱스토어 번들 용량 때문에 이미 한 번 정리했었다. 90초 × 16곡을 128kbps로 넣으면
약 23MB다(기존 14MB에서 +9MB). **96kbps 모노**로 하면 약 11MB로 오히려 줄어든다 —
배경음악은 모노로 해도 게임에서 거의 티가 안 난다. 결정 필요.

## 6. 우선순위

전부 다시 만들 필요는 없다. **자주 들리는 것부터**.

| 순위 | 트랙 | 이유 |
|---|---|---|
| 1 | `sfx_fanfare` | 45곳. 가장 자주 들린다 |
| 2 | `bgm_joseon_palace` | 17곳. 가장 오래 듣는다 |
| 3 | `bgm_intro_sting` / `bgm_chapter_end` | 각 36곳. 지금 스팅이 30초짜리라 어색 |
| 4 | `bgm_gaehang_war` | 12곳 |
| 5 | `bgm_seowon` | 7곳이지만 **퀴즈 푸는 자리**라 중요도 높음 |
| 6 | `bgm_boss_quiz` | 지금 6초라 계속 끊긴다 |
| 7 | 나머지 | |

---

## 참고한 자료

- [Suno AI for Game Developers (hookgenius)](https://hookgenius.app/learn/suno-for-game-developers/) — 루프용 프롬프트 문구("no intro, no outro, seamless loop"), DAW 후처리 필요성
- [Best Suno Prompts: 40+ Examples & Simple Formula (musicful.ai)](https://www.musicful.ai/music-tips/suno-prompts/) — 프롬프트 6단 구조, Exclude Styles 사용법
- [How to Write Effective Prompts for Instrumental Music on Suno (Soundverse)](https://www.soundverse.ai/blog/article/how-to-write-effective-prompts-for-instrumental-music-on-sunoai-1313) — 장르를 앞 3~5토큰에 두기
- [Suno instrumental prompts for BGM and loops (SunoGuide)](https://sunoai.uk/en/guides/suno-instrumental-prompts/)
