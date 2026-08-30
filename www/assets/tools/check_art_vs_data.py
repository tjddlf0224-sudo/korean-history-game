#!/usr/bin/env python3
"""출구 라벨의 방향과 실제 출구 위치가 어긋나는지 검사.

배경:
  check_reachability.js는 "아예 못 가는" 치명적 차단만 잡는다. 실제로 겪은
  버그(상경성 "배를 타고 남쪽으로"인데 출구는 지도 북쪽 끝, 탄금대 "남쪽
  바다로"인데 출구는 물이 없는 위쪽 들판)는 둘 다 좌표만 보면 멀쩡히 걸어갈
  수 있어서 그 검사로는 안 잡혔다. 여기서는 안내 문구와 좌표의 모순만 본다.

  ※ 처음에는 "배리어가 실제로는 빈 바닥을 덮고 있는지"를 배경 그림 색으로
    판별하는 검사도 넣었으나, 배경이 수채화풍이라 벽·건물·바닥 색이 비슷해
    602개 중 111개를 오탐으로 쏟아내 쓸모가 없었다. 그 방식은 폐기했다.
    (배리어가 과하게 잡힌 문제는 아직 자동 검출 수단이 없으니, 새 구역을
     만들 땐 ?debug=1 격자로 눈으로 확인할 것.)

실행: python3 www/assets/tools/check_art_vs_data.py
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # www/
REPO = os.path.dirname(ROOT)

dump = subprocess.run(['node', os.path.join(ROOT, 'assets', 'tools', 'dump_zones.js')],
                      capture_output=True, text=True, cwd=REPO)
if dump.returncode != 0:
    print('dump_zones.js 실행 실패:', dump.stderr[:500]); sys.exit(1)
DATA = json.loads(dump.stdout)

# 방향어는 반드시 '쪽'이 붙은 형태만 본다. 그냥 '남'/'서'로 잡으면
# 서경·남한산성·서재처럼 지명·낱말 속 글자까지 방향으로 오인한다(실제로 겪음).
DIRS = [
    ('남쪽', 'bottom'), ('북쪽', 'top'), ('동쪽', 'right'), ('서쪽', 'left'),
    ('아래로', 'bottom'), ('위로', 'top'),
]
KO = {'top': '북(위)', 'bottom': '남(아래)', 'left': '서(왼쪽)', 'right': '동(오른쪽)'}


def exit_side(rect, W, H):
    """출구 사각형의 중심이 지도의 어느 쪽에 치우쳐 있는지."""
    cx = (rect['x0'] + rect['x1']) / 2
    cy = (rect['y0'] + rect['y1']) / 2
    dx = cx / W - 0.5
    dy = cy / H - 0.5
    if abs(dy) >= abs(dx):
        return 'bottom' if dy > 0 else 'top'
    return 'right' if dx > 0 else 'left'


problems = []
n_exits = 0
for fname, entry in DATA.items():
    W = entry['consts']['BG_W']; H = entry['consts']['BG_H']
    for zid, zone in entry['zones'].items():
        for e in zone['exits']:
            n_exits += 1
            label = e.get('label') or ''
            side = exit_side(e['rect'], W, H)
            for word, want in DIRS:
                if word in label:
                    if side != want:
                        problems.append(
                            f"{fname} [{zid}] 출구 라벨 '{label}'은 {word}이라는데 "
                            f"실제 출구 위치는 {KO[side]} — 라벨/좌표 불일치 rect={e['rect']}")
                    break

print(f"검사한 출구: {n_exits}개")
if problems:
    print(f"\n■ 방향 불일치 {len(problems)}건\n")
    for p in problems:
        print('  - ' + p)
    sys.exit(1)
print('■ 이상 없음 ✅')
