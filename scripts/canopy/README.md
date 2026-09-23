# 나무 덮개(canopy)·배리어 도구 (2026-09-23)

게임: `www/assets/canopy.js`가 `www/assets/canopy/data.js`의 나무 조각(webp)을 인물과 발 높이 순으로 그린다.

## 새 무대에 나무 붙이기
1. 게임 파일에서 무대 데이터 새로 뽑기(**꼭 매번 새로** — 옛 스냅샷으로 돌리면 뒤에 덧붙인 배리어가 되돌아간다):
   `ls ../../www/*.html | xargs -n1 basename | xargs node extract_zones.js > all_zones.json`
2. `python3 view.py 파일.html#무대` → 격자 그림 보고 `specs.json`에 나무 상자(box, 밑동=box 아래 끝) 적기.
   옵션: `m`(isnet 기본 / u2net / grabcut / union / hue=어두운 솔잎+isnet / dark), `thr`, `margin`, `ex`(뺄 사각형), `green`(초록만 남길 사각형), `open`(잎 아래 배리어 열기).
3. `/usr/bin/python3 build_canopy.py 파일.html#무대` (rembg·cv2는 시스템 파이썬 3.9에 있음, 모델은 ~/.u2net)
   → webp·data.js 생성, 밑동 1줄×2~3칸 배리어, open이면 잎 아래 열기, 미리보기 prev_*.jpg.
4. 못 가는 빈 곳 막기: `fill.py`(sel_zones.json 목록, game_zones.json 필요) → `append_fill.py`.
