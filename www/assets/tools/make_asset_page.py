#!/usr/bin/env python3
"""제미나이_프롬프트.md → 그림_작업목록.html (복붙·체크용 한 장짜리 페이지).

마크다운 990줄을 폰에서 스크롤하며 프롬프트를 찾아 긁는 건 못 할 짓이다.
같은 내용을 항목별 카드로 펴고, 버튼 하나로 프롬프트가 클립보드에 들어가게 한다.

프롬프트를 고치면 마크다운만 고치고 이걸 다시 돌린다 — 두 곳을 따로 고치면
반드시 어긋난다.

  python3 make_asset_page.py
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.abspath(os.path.join(HERE, '..', '..'))
ROOT = os.path.abspath(os.path.join(WWW, '..'))
MD = os.path.join(ROOT, '제미나이_프롬프트.md')
OUT = os.path.join(ROOT, '그림_작업목록.html')

# 커버리지 점검에서 나온, 아직 챕터가 없는 무대들. 프롬프트는 챕터를 만든 뒤에 쓴다.
PLANNED = [
    ('임진왜란', '한산도 통제영 · 행주산성', '이순신 · 권율 · 곽재우 · 김시민 · 조헌 · 논개', 22,
     '기출 22문항으로 병자호란(20)보다 높은데 지금은 훈련도감 한 문항뿐'),
    ('삼국 통일 전쟁과 가야', '황산벌 · 백강 · 매소성', '계백 · 관창 · 김유신 · 문무왕 · 의자왕', 47,
     '황산벌 7 · 백강 5 · 나당전쟁 5 + 금관가야 18 · 대가야 12 — 가야가 통째로 없다'),
    ('통일신라의 정치', '경주 국학과 관청', '신문왕 · 원효 · 혜초 · 설총', 31,
     '신문왕 16 · 국학 5 · 부흥운동 10'),
    ('고려의 경제와 무역', '벽란도 포구', '송 상인 · 아라비아 상인 · 전시과 담당 관리', 29,
     '전시과 13 · 해동통보 8 · 대외무역 8'),
    ('현대 정부별 정책과 통일 노력', '청와대 앞 · 판문점', '박정희 · 김대중 · 남북회담 대표', 63,
     '김대중정부 11 · 통일노력 10 · 남북협상 9 · 박정희 9 · 유신체제 5'),
    ('세시풍속·문화유산 도감', '(챕터가 아니라 별도 콘텐츠)', '—', 128,
     '문화유산 39 · 지역사 34 · 답사 19 · 세시풍속 19 · 생활상 17 — 출제 유형 자체가 빠져 있다'),
]


def parse():
    md = open(MD, encoding='utf-8').read()
    scenes = []
    for m in re.finditer(r'## 1-(\d+)\. `([\w.]+)` — ([^\n]+) \(([^()\n]+)\)\n\n```\n(.*?)\n```', md, re.S):
        no, fn, name, where, prompt = m.groups()
        scenes.append(dict(no=int(no), file=fn, name=name.strip(), where=where.strip(),
                           prompt=prompt.strip(),
                           done=os.path.exists(os.path.join(WWW, 'assets/scenes', fn))))
    sheets = []
    for m in re.finditer(r'## 2-(\d+)\. ([^\[]+)\[키: `(\w+)`\] — 5열 3행, (\d+)명\n\n```\n(.*?)\n```', md, re.S):
        no, title, key, n, prompt = m.groups()
        who = re.findall(r'^\d+\) ([^:]+):', prompt, re.M)
        done = sum(os.path.exists(os.path.join(WWW, 'assets/portraits', f'{x}.png'))
                   for x in sheet_files(key))
        sheets.append(dict(no=int(no), title=title.strip(), key=key, n=int(n),
                           who=[w.strip() for w in who], prompt=prompt.strip(), done=done))
    return scenes, sheets


def sheet_files(key):
    import sys
    sys.path.insert(0, os.path.join(WWW, 'assets', 'portraits'))
    import extract_sheet
    return [x for x in extract_sheet.SHEETS[key][2] if x]


def build(scenes, sheets):
    e = html.escape
    scene_left = sum(1 for s in scenes if not s['done'])
    npc_left = sum(s['n'] - s['done'] for s in sheets)
    sheet_left = sum(1 for s in sheets if s['done'] < s['n'])
    total_left = scene_left + npc_left

    cards = []
    for s in scenes:
        cards.append(f'''
    <article class="card{' is-done' if s['done'] else ''}" data-kind="scene" id="{s['file'][:-4]}">
      <header>
        <div class="line">
          <span class="idx">배경 {s['no']}</span>
          <span class="chip {'ok' if s['done'] else 'todo'}">{'받음' if s['done'] else '대기'}</span>
        </div>
        <h3>{e(s['name'])}</h3>
        <p class="meta"><code>{e(s['file'])}</code> · {e(s['where'])}</p>
      </header>
      <div class="acts">
        <button class="copy" type="button">프롬프트 복사</button>
        <button class="peek" type="button" aria-expanded="false">펼쳐 보기</button>
      </div>
      <pre class="prompt" hidden>{e(s['prompt'])}</pre>
    </article>''')

    for s in sheets:
        left = s['n'] - s['done']
        chips = ' '.join(f'<span class="who">{e(w)}</span>' for w in s['who'])
        cards.append(f'''
    <article class="card wide{' is-done' if left == 0 else ''}" data-kind="sheet" id="{s['key']}">
      <header>
        <div class="line">
          <span class="idx">시트 {s['no']} · <code>{s['key']}</code></span>
          <span class="chip {'ok' if left == 0 else 'todo'}">{'받음' if left == 0 else f'{left}명 대기'}</span>
        </div>
        <h3>{e(s['title'])}</h3>
        <p class="meta">5열 3행 격자 한 장에 {s['n']}명</p>
      </header>
      <div class="whos">{chips}</div>
      <div class="acts">
        <button class="copy" type="button">프롬프트 복사</button>
        <button class="peek" type="button" aria-expanded="false">펼쳐 보기</button>
      </div>
      <pre class="prompt" hidden>{e(s['prompt'])}</pre>
    </article>''')

    planned = []
    for name, stage, who, n, why in PLANNED:
        planned.append(f'''
      <tr>
        <th scope="row">{e(name)}</th>
        <td>{e(stage)}</td>
        <td class="who-cell">{e(who)}</td>
        <td class="num">{n}</td>
        <td class="why">{e(why)}</td>
      </tr>''')

    vals = dict(
        total_left=total_left, scene_left=scene_left, npc_left=npc_left,
        sheet_left=sheet_left, scene_total=len(scenes),
        npc_total=sum(x['n'] for x in sheets),
        scene_done=len(scenes) - scene_left, npc_done=sum(x['done'] for x in sheets),
        cards=''.join(cards), planned=''.join(planned),
        planned_q=sum(p[3] for p in PLANNED),
    )
    vals['pct'] = round((vals['scene_done'] + vals['npc_done'])
                        / (vals['scene_total'] + vals['npc_total']) * 100)
    # CSS에 중괄호가 가득해서 str.format을 못 쓴다. 자리표시자를 따로 둔다.
    out = TEMPLATE
    for k, v in vals.items():
        out = out.replace('\u27e6' + k + '\u27e7', str(v))
    left = re.findall(r'\u27e6\w+\u27e7', out)
    assert not left, f'채우지 못한 자리표시자: {set(left)}'
    return out


TEMPLATE = r'''<meta charset="utf-8">
<title>한국사 게임 그림 목록</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&display=swap">
<style>
  /* 게임 화면의 색을 그대로 가져왔다 — 밤에는 게임과 같은 먹빛,
     낮에는 같은 팔레트를 한지 쪽으로 뒤집은 것. */
  :root {
    --bg:#f6f1e6; --bg-2:#efe7d6; --card:#fffdf8; --line:#ddd0b4;
    --ink:#2b2419; --ink-2:#6b5f4a; --gold:#8a6a1f; --gold-2:#b08c33;
    --ok:#4a7c4e; --ok-bg:#e4efe1; --todo:#8a5a1f; --todo-bg:#f6e8d2;
    --shadow:0 1px 2px rgba(43,36,25,.06), 0 8px 24px rgba(43,36,25,.06);
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg:#15110c; --bg-2:#1c1710; --card:#221c14; --line:#3a3024;
      --ink:#f5ecd8; --ink-2:#b8a888; --gold:#f0c96b; --gold-2:#c9a24a;
      --ok:#8fd694; --ok-bg:#1f2c1f; --todo:#f0c96b; --todo-bg:#2e2413;
      --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
    }
  }
  :root[data-theme="dark"] {
    --bg:#15110c; --bg-2:#1c1710; --card:#221c14; --line:#3a3024;
    --ink:#f5ecd8; --ink-2:#b8a888; --gold:#f0c96b; --gold-2:#c9a24a;
    --ok:#8fd694; --ok-bg:#1f2c1f; --todo:#f0c96b; --todo-bg:#2e2413;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
  }

  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.7 "Gowun Dodum", -apple-system, "Malgun Gothic", sans-serif;
    -webkit-text-size-adjust:100%;
  }
  .wrap { max-width:980px; margin:0 auto; padding:32px 20px 80px; }

  h1, h2, h3 { font-family:"Gowun Batang", serif; text-wrap:balance; margin:0; }
  h1 { font-size:1.9rem; letter-spacing:-.01em; }
  .lede { color:var(--ink-2); margin:.6em 0 0; max-width:60ch; }

  /* 요약 — 숫자가 먼저 눈에 들어와야 한다 */
  .tally { display:flex; flex-wrap:wrap; gap:12px; margin:26px 0 8px; }
  .stat {
    flex:1 1 150px; background:var(--card); border:1px solid var(--line);
    border-radius:12px; padding:14px 16px; box-shadow:var(--shadow);
  }
  .stat b { display:block; font-family:"Gowun Batang",serif; font-size:1.8rem;
    line-height:1.2; font-variant-numeric:tabular-nums; color:var(--gold); }
  .stat span { color:var(--ink-2); font-size:.85rem; }
  .bar { height:8px; border-radius:99px; background:var(--bg-2);
    border:1px solid var(--line); overflow:hidden; margin:16px 0 4px; }
  .bar i { display:block; height:100%; background:var(--gold-2); }
  .bar-note { color:var(--ink-2); font-size:.85rem; }

  .how { background:var(--bg-2); border:1px solid var(--line); border-radius:12px;
    padding:16px 18px; margin:28px 0; }
  .how h2 { font-size:1.05rem; margin-bottom:.4em; }
  .how ol { margin:0; padding-left:1.2em; color:var(--ink-2); }
  .how li { margin:.35em 0; }
  .how code, .meta code, .idx code {
    font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.86em;
    background:var(--bg); border:1px solid var(--line); border-radius:5px; padding:.1em .4em;
  }

  .filters { display:flex; gap:8px; flex-wrap:wrap; margin:30px 0 16px; }
  .filters button {
    font:inherit; font-size:.9rem; padding:7px 14px; border-radius:99px; cursor:pointer;
    background:var(--card); color:var(--ink-2); border:1px solid var(--line);
  }
  .filters button[aria-pressed="true"] { background:var(--gold-2); color:var(--bg);
    border-color:var(--gold-2); font-weight:700; }

  h2.sec { font-size:1.15rem; margin:34px 0 14px; padding-bottom:8px;
    border-bottom:1px solid var(--line); }

  .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); }
  .card {
    background:var(--card); border:1px solid var(--line); border-radius:14px;
    padding:16px 18px; box-shadow:var(--shadow); display:flex; flex-direction:column; gap:12px;
  }
  .card.wide { grid-column:1/-1; }
  .card.is-done { opacity:.55; }
  .card .line { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .idx { color:var(--ink-2); font-size:.8rem; letter-spacing:.06em; }
  .card h3 { font-size:1.12rem; margin:.25em 0 .2em; }
  .meta { margin:0; color:var(--ink-2); font-size:.85rem; word-break:break-all; }
  .chip { font-size:.75rem; padding:3px 10px; border-radius:99px; white-space:nowrap; font-weight:700; }
  .chip.ok { color:var(--ok); background:var(--ok-bg); }
  .chip.todo { color:var(--todo); background:var(--todo-bg); }

  .whos { display:flex; flex-wrap:wrap; gap:6px; }
  .who { font-size:.8rem; padding:3px 9px; border-radius:6px;
    background:var(--bg-2); border:1px solid var(--line); color:var(--ink-2); }

  .acts { display:flex; gap:8px; flex-wrap:wrap; margin-top:auto; }
  .acts button {
    font:inherit; font-size:.9rem; padding:9px 16px; border-radius:9px; cursor:pointer;
    border:1px solid var(--gold-2); background:var(--gold-2); color:var(--bg); font-weight:700;
  }
  .acts .peek { background:transparent; color:var(--gold); }
  .acts button:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
  .acts button.copied { background:var(--ok); border-color:var(--ok); color:var(--bg); }

  pre.prompt {
    margin:0; padding:14px 16px; background:var(--bg-2); border:1px solid var(--line);
    border-radius:10px; white-space:pre-wrap; word-break:break-word;
    font:13px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--ink);
    max-height:420px; overflow:auto;
  }

  table { width:100%; border-collapse:collapse; font-size:.9rem; }
  .scroll { overflow-x:auto; border:1px solid var(--line); border-radius:12px; background:var(--card); }
  th, td { padding:10px 12px; text-align:left; border-bottom:1px solid var(--line); vertical-align:top; }
  thead th { background:var(--bg-2); font-family:"Gowun Batang",serif; white-space:nowrap; }
  tbody tr:last-child th, tbody tr:last-child td { border-bottom:0; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; font-weight:700; color:var(--gold); white-space:nowrap; }
  td.why, td.who-cell { color:var(--ink-2); font-size:.85rem; min-width:180px; }
  tbody th { font-weight:700; white-space:nowrap; }

  footer { margin-top:44px; padding-top:18px; border-top:1px solid var(--line);
    color:var(--ink-2); font-size:.85rem; }
  @media (prefers-reduced-motion:no-preference) { .acts button { transition:background .15s; } }
</style>

<div class="wrap">
  <h1>제미나이로 뽑을 그림</h1>
  <p class="lede">한국사 게임에 아직 없는 그림 목록이다. 카드마다 프롬프트가 통째로 들어 있으니
    복사 버튼을 눌러 제미나이에 그대로 붙여 넣으면 된다.</p>

  <div class="tally">
    <div class="stat"><b>⟦total_left⟧</b><span>지금 뽑을 그림</span></div>
    <div class="stat"><b>⟦scene_left⟧</b><span>배경 (전체 ⟦scene_total⟧)</span></div>
    <div class="stat"><b>⟦npc_left⟧</b><span>NPC (시트 ⟦sheet_left⟧장)</span></div>
  </div>
  <div class="bar"><i style="width:⟦pct⟧%"></i></div>
  <p class="bar-note">배경 ⟦scene_done⟧/⟦scene_total⟧ · NPC ⟦npc_done⟧/⟦npc_total⟧ — ⟦pct⟧% 받음.
    그림이 없어도 게임은 폴백으로 돌아간다.</p>

  <section class="how">
    <h2>받은 뒤에 할 일</h2>
    <ol>
      <li><b>배경</b> — 카드에 적힌 <code>파일명.png</code> 그대로 이름을 바꿔
        <code>www/assets/scenes/</code>에 넣고,
        <code>python3 www/assets/scenes/to_webp.py</code>를 한 번 돌린다.</li>
      <li><b>NPC 시트</b> — 다섯 장을 <b>다 받은 뒤</b> 이름만 <code>sheet1.png</code> …
        <code>sheet5.png</code>로 바꿔 두고
        <code>python3 www/assets/portraits/extract_sheet.py --all ~/Downloads</code>.
        한 장씩 뽑아 조건이 달라지면 인물끼리 밝기가 어긋난다.</li>
      <li>확인은 <code>python3 www/assets/tools/check_all.py</code>.</li>
    </ol>
  </section>

  <div class="filters" role="group" aria-label="목록 거르기">
    <button type="button" data-f="all" aria-pressed="true">전체</button>
    <button type="button" data-f="scene" aria-pressed="false">배경만</button>
    <button type="button" data-f="sheet" aria-pressed="false">NPC 시트만</button>
    <button type="button" data-f="todo" aria-pressed="false">아직 안 받은 것만</button>
  </div>

  <div class="grid" id="grid">⟦cards⟧
  </div>

  <h2 class="sec">아직 프롬프트가 없는 것 — 다음에 만들 무대</h2>
  <p class="lede">기출 3,700문항을 게임과 대조해 찾은 구멍이다. 챕터를 먼저 짜야
    무대와 등장인물이 정해지므로, 프롬프트는 그때 이 목록에 추가한다.
    다 합쳐 <b>⟦planned_q⟧문항</b>어치다.</p>
  <div class="scroll">
    <table>
      <thead>
        <tr><th>만들 챕터</th><th>무대</th><th>NPC</th><th>기출</th><th>왜</th></tr>
      </thead>
      <tbody>⟦planned⟧
      </tbody>
    </table>
  </div>

  <footer>
    이 페이지는 <code>제미나이_프롬프트.md</code>에서 자동으로 만들어진다.
    프롬프트를 고칠 때는 마크다운을 고치고
    <code>python3 www/assets/tools/make_asset_page.py</code>를 다시 돌릴 것.
  </footer>
</div>

<script>
  document.querySelectorAll('.peek').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.card').querySelector('.prompt');
      var open = pre.hidden;
      pre.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '접기' : '펼쳐 보기';
    });
  });

  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.card').querySelector('.prompt');
      var text = pre.textContent;
      var ok = function () {
        btn.textContent = '복사했어요';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = '프롬프트 복사'; btn.classList.remove('copied'); }, 1600);
      };
      // 샌드박스에서 클립보드가 막히는 경우가 있다. 그때는 펼쳐서 직접 고르게 한다.
      var fail = function () {
        pre.hidden = false;
        var r = document.createRange();
        r.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        btn.textContent = '길게 눌러 복사하세요';
        setTimeout(function () { btn.textContent = '프롬프트 복사'; }, 2600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fail);
      } else {
        fail();
      }
    });
  });

  var grid = document.getElementById('grid');
  document.querySelectorAll('.filters button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filters button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var f = btn.dataset.f;
      grid.querySelectorAll('.card').forEach(function (c) {
        var show = f === 'all' ? true
          : f === 'todo' ? !c.classList.contains('is-done')
          : c.dataset.kind === f;
        c.style.display = show ? '' : 'none';
      });
    });
  });
</script>
'''


def main():
    scenes, sheets = parse()
    assert len(scenes) == 17, f'배경 프롬프트를 {len(scenes)}개만 읽었다'
    assert len(sheets) == 5, f'시트 프롬프트를 {len(sheets)}개만 읽었다'
    open(OUT, 'w', encoding='utf-8').write(build(scenes, sheets))
    left = sum(1 for s in scenes if not s['done']) + sum(s['n'] - s['done'] for s in sheets)
    print(f'{OUT}\n  배경 {len(scenes)} · 시트 {len(sheets)}장({sum(s["n"] for s in sheets)}명) · 남은 그림 {left}장')


if __name__ == '__main__':
    main()
