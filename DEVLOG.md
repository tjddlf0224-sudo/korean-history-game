# 개발 기록 / 재발 방지 체크리스트

**용도**: 챕터 파일(ch0~ch6, gaehang_ch2/3, ilje_ch7)을 새로 만들거나 수정하기 전에
반드시 먼저 훑어볼 것. 여기 적힌 버그들은 전부 "한 챕터에서 고쳤는데 다른 챕터엔
반영 안 돼서 사용자가 똑같은 문제를 또 신고한" 패턴으로 반복됐던 것들이다.
같은 실수를 세 번째 반복하지 않는 게 이 문서의 유일한 목적.

## 원칙

- **ch1.html이 표준 레퍼런스다.** zone 시스템(실사 배경+구역전환+실사 스프라이트)을
  쓰는 모든 챕터(ch1~ch6, gaehang_ch2/3, ilje_ch7)는 ch1.html과 동일한 핵심 엔진
  코드(PLAYER_SPRITES 로딩, checkNpc, drawPlayerSprite/drawNpcSprite, Quiz 엔진,
  z-index 레이어링, 줌 방지 스니펫)를 공유해야 한다. 한 챕터에서 버그를 고쳤다면
  **반드시 다른 모든 챕터 파일에도 grep으로 같은 패턴이 있는지 확인하고 동일하게
  고칠 것** — "이 챕터만 고치고 끝"이 가장 많이 반복된 실수 원인이었다.
- 새 챕터를 만들 때는 ch1.html을 통째로 복사해서 시작하거나, 최소한 아래 체크리스트를
  전부 대조할 것.
- 코드를 고친 뒤에는 `node --check`로 인라인 `<script>` 문법만 확인하지 말고,
  **실제로 브라우저(localhost:8934)에서 열어 값까지 확인**할 것. 문법은 통과해도
  로직이 틀린 경우가 훨씬 많았다(퀴즈 정오 반전 버그가 대표적 사례).

## 지금까지 실제로 반복됐던 버그 목록

### 1. 주인공 좌우 스프라이트 반전
- **증상**: 왼쪽으로 이동하면 오른쪽을 보고, 오른쪽으로 이동하면 왼쪽을 봄.
- **원인**: `assets/player/left_*.png`, `right_*.png` **파일 자체의 내용이 서로
  뒤바뀌어 있음**(AI 생성/recenter 파이프라인에서 생긴 문제, 코드 버그가 아니라
  에셋 버그). ch0_phaser.html은 이미 `DIR_SRC = {down:'down',up:'up',left:'right',
  right:'left'}` 룩업으로 이걸 보정했는데, zone 시스템으로 새 챕터를 만들 때마다
  이 보정을 빼먹고 `assets/player/${dir}_${i}.png`를 직접 로드해서 매번 재발했다.
- **체크**: 새 챕터 파일에서 `PLAYER_SPRITES` 로딩 부분에 `DIR_SRC`가 있는지 grep.
- **고친 파일**: ch1~ch6, gaehang_ch2/3, ilje_ch7 (2026-08-21).

### 2. NPC 근접 표시(느낌표/이름)가 단일 반경이었음
- **증상**: 멀리 있을 때 느낌표(!)도 안 뜨고, 가까이 가도 이름이 아니라 계속 "!"만 뜸.
- **원인**: ch0_phaser.html은 `SHOW_RANGE=192`(멀면 !) / `INTERACT_RANGE=108.8`
  (가까우면 이름+상호작용 가능)의 2단계 구조인데, zone 시스템 챕터들의 `checkNpc()`는
  `best=90` 단일 반경만 쓰고 항상 `'!'`만 그렸다.
- **체크**: `checkNpc()`에 `SHOW_RANGE`/`INTERACT_RANGE`/`nearNpcShown`/`nearNpcClose`가
  있는지, render()의 라벨 그리기가 `n === this.nearNpcClose ? n.name : '!'` 형태인지 확인.
- **부가 버그**: 라벨을 `sy - 40`에 그리면 캐릭터 이마 높이에 뜬다(H=88, 앵커
  `py - H*0.68` 기준으로 머리 꼭대기가 `py-59.84`이므로). **`sy - 66`이 올바른 값.**
- **고친 파일**: ch1~ch6, gaehang_ch2/3, ilje_ch7 (2026-08-21).

### 3. 퀴즈 정답/오답 피드백 메시지가 뒤바뀜
- **증상**: 정답을 눌러도 오답 설명이 뜨고, 오답을 눌러도 "정답!" 메시지가 뜸.
- **원인**: 이 게임의 모든 퀴즈 데이터는 예외 없이 `answer: 0`(첫 번째 보기가 항상
  정답), `feedback: [오답설명, "정답! ...정답설명"]` 고정 순서로 작성돼 있는데,
  기존 `Quiz.pick(i)` 코드는 `this.data.feedback[i]`(클릭한 보기의 인덱스)로 그대로
  조회했다. 데이터를 일일이 고칠 필요 없이 **엔진 한 줄만 고치면 전체 해결**:
  `this.data.feedback[correct ? 1 : 0]`.
- **체크**: `grep "feedback\[i\]"` — 이게 남아있으면 무조건 버그다.
- **고친 파일**: ch1~ch5 (ch6/gaehang/ilje는 퀴즈 자체가 없음, 2026-08-21).

### 4. 미니맵이 대화창보다 위 레이어에 뜸
- **원인**: `#minimap-canvas`의 `z-index`가 `50`으로, `.ov`(대화/퀴즈 오버레이,
  `z-index: 20`)보다 높게 설정돼 있었음. **`z-index: 4`가 올바른 값**(HUD와 같은
  레벨, 오버레이보다 항상 아래).
- **고친 파일**: ch1~ch6, gaehang_ch2/3, ilje_ch7 (2026-08-21).

### 5. 핀치줌/더블탭줌이 완전히 안 막힘
- **원인**: viewport meta의 `user-scalable=no`만으로는 iOS Safari에서 확대가
  완전히 막히지 않는 경우가 있음(접근성 정책으로 무시됨). 아래 스니펫을 매 챕터
  `</script>` 직전에 추가해야 함:
  ```js
  document.addEventListener('gesturestart', e => e.preventDefault());
  let __lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - __lastTouchEnd <= 300) e.preventDefault();
    __lastTouchEnd = now;
  }, { passive: false });
  ```
- **고친 파일**: ch1~ch6, gaehang_ch2/3, ilje_ch7 (2026-08-21).

### 6. NPC끼리/책상 등 가구와 겹쳐 보임
- **원인**: `isBarrierPx()`가 배경 그림 속 가구(책상 등)를 인식하지 못해서 그 위를
  그냥 걸어다닐 수 있었고, NPC 좌표를 가구 바로 옆/위에 배치해 시각적으로 겹쳤다.
  배경 이미지는 반드시 **Read 툴로 실제로 보고** 가구 위치를 눈대중으로 픽셀
  좌표를 잡아 `barriers` 배열에 넣어야 한다(자동 감지 불가).
- **체크**: 새 배경을 쓰는 챕터를 만들 때마다 Read로 이미지를 열어 큰 가구
  (책상/침상/제단 등)의 대략적인 bbox를 barriers에 추가했는지 확인. NPC 좌표는
  barriers와 겹치지 않는 열린 바닥 위로 배치.
- **고친 파일**: ch2 (2026-08-21) — 다른 챕터도 새로 만들 때 이 원칙 적용할 것.

### 7. 대화 속 화자(beat.name 오버라이드)에 전용 초상이 없으면 이전 화자 얼굴이 뜸
- **증상**: (ch2) 최만리가 말하는 줄인데 세종의 얼굴이 뜸.
- **원인**: `Dialog.render()`가 `beat.img || this.data.img`로 폴백해서, beat에
  `name`만 있고 `img`가 없으면 **부모 대화(직전 화자)의 얼굴을 그대로 물려받음**.
  카메오 화자가 전용 초상이 없을 땐 얼굴 대신 아이콘으로 대체해야 자연스럽다.
  고친 로직: `const img = beat.img || (beat.name ? null : this.data.img);`
- **체크**: 다중화자 대화(beat.name 오버라이드)를 쓸 때, 그 화자의 전용 초상이
  없다면 위 폴백 로직이 있는지, 혹은 초상을 새로 그려줄지 확인.

## 아직 미해결/보류 중인 항목

- **ilje_ch7의 태극기 소품**: 3차례 Gemini 생성 시도 전부 건곤감리 배치가 틀려서
  `www/assets/props/draw_taegukgi.py`(PIL 직접 드로잉)로 교체, 이미
  `ilje_ch7_imjeong.png`에 합성 완료·배포됨. 사용자가 같은 시기 ChatGPT로 생성한
  버전도 픽셀 단위로 검증해보니 **감/리 위치가 똑같이 뒤바뀌어 있어서** 채택하지
  않음(AI 이미지 생성이 태극/괘 같은 정밀 기하 요소에 반복적으로 취약하다는
  프로젝트 공통 교훈 재확인).
- **ch0_phaser의 퀴즈 시스템**: 예전엔 있었는데 Phaser 마이그레이션 과정에서
  빠짐. ch1의 태종 퀴즈 수준으로 되살려달라는 요청 있음(다음 작업 대상).
