# -*- coding: utf-8 -*-
"""동료 대사 끼우기 — 대화(키) 안에서 needle이 든 대사 줄 **앞**에 새 줄을 넣는다.
   ins(path, [(키, needle, [새 줄...]), ...])  · needle이 그 대화 안에 정확히 한 줄이어야 한다.
   needle=None 이면 그 대화의 첫 대사 줄 앞(=맨 앞)에 넣는다. needle='$END' 면 마지막 대사 줄 뒤.
   새 줄은 JS 한 줄: "Party.say('chadol','sly','…')," 또는 "{ who:'me', t:'…' },"
"""
import re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from npc_edit import edit

BEAT = re.compile(r"^\s*(\{ who:|Party\.say\()")

def block(s, key):
    i = s.find('\n  ' + key + ': {')
    if i < 0: raise SystemExit('대화 없음: ' + key)
    m = re.search(r'\n  [A-Za-z_0-9]+: *\{|\n\};', s[i + 5:])
    return i, i + 5 + m.start()

def ins(path, items):
    s = open(path, encoding='utf-8').read()
    pairs = []
    for key, needle, new in items:
        i, j = block(s, key)
        lines = s[i:j].split('\n')
        idx = [n for n, ln in enumerate(lines) if BEAT.match(ln)]
        if needle is None:
            n = idx[0]
        elif needle == '$END':
            n = idx[-1] + 1
            # 도해가 이어지는 대사면 그 도해 줄들이 끝난 뒤로
            while n < len(lines) and not BEAT.match(lines[n]) and not re.match(r"^\s*\],?\s*$", lines[n]) and lines[n].strip():
                n += 1
        else:
            hits = [k for k in idx if needle in lines[k]]
            if len(hits) != 1: raise SystemExit(f'{path} {key}: needle {needle!r} {len(hits)}번')
            n = hits[0]
        ind = re.match(r'^(\s*)', lines[idx[0]]).group(1)
        lines[n:n] = [ind + x.strip() for x in new]
        s = s[:i] + '\n'.join(lines) + s[j:]
    open(path + '.tmp', 'w', encoding='utf-8').write(s)
    # npc_edit의 안전검사를 거쳐 쓴다
    orig = open(path, encoding='utf-8').read()
    os.remove(path + '.tmp')
    edit(path, [(orig, s)] if orig != s else [])

def lint_len(items, limit=50):
    for _, _, new in items:
        for x in new:
            m = re.search(r"'([^']*)'\)?,?\s*$", x) or re.search(r"t:'((?:[^'\\]|\\.)*)'", x)
            t = re.findall(r"'((?:[^'\\]|\\.)*)'", x)[-1] if "Party.say" in x else (re.search(r"t:'((?:[^'\\]|\\.)*)'", x) or [None, ''])[1]
            if len(t) > limit: raise SystemExit(f'긴 줄({len(t)}자): {t}')


def split(path, old_t, parts):
    """t:'old_t' 인 대사 한 줄을 여러 줄로 나눈다. 마지막 조각이 원래 줄(도해 등)을 이어받는다."""
    s = open(path, encoding='utf-8').read()
    key = "t:'" + old_t + "'"
    lines = s.split('\n')
    hits = [n for n, ln in enumerate(lines) if key in ln]
    if len(hits) != 1: raise SystemExit(f'{path}: split 대상 {len(hits)}번 — {old_t[:40]}')
    n = hits[0]; ln = lines[n]
    ind = re.match(r'^(\s*)', ln).group(1)
    who = re.search(r"who:'(\w+)'", ln).group(1)
    extra = ''
    nm = re.search(r"(, name:'[^']*'(?:, img:'[^']*')?(?:, icon:[^,}]*)?)", ln)
    if nm and ln.index(nm.group(1)) < ln.index(key): extra = nm.group(1)
    new = [f"{ind}{{ who:'{who}'{extra}, t:'{p}' }}," for p in parts[:-1]]
    new.append(ln.replace(key, "t:'" + parts[-1] + "'"))
    lines[n:n + 1] = new
    t = '\n'.join(lines)
    edit(path, [(s, t)])


def repl(path, old_t, new_lines):
    """t:'old_t' 인 줄을 new_lines(JS 줄 목록)로 바꾼다. 빈 목록이면 지운다.
       원래 줄에 도해가 붙어 있으면(끝이 ',') 쓰지 말 것 — split을 쓴다."""
    s = open(path, encoding='utf-8').read()
    key = "t:'" + old_t + "'"
    lines = s.split('\n')
    hits = [n for n, ln in enumerate(lines) if key in ln or (ln.lstrip().startswith('Party.say(') and ", '" + old_t + "')" in ln)]
    if len(hits) != 1: raise SystemExit(f'{path}: repl 대상 {len(hits)}번 — {old_t[:40]}')
    n = hits[0]
    if not re.search(r"[})]\s*,?\s*$", lines[n]):
        raise SystemExit(f'{path}: 도해가 이어지는 줄은 repl 금지 — {old_t[:40]}')
    ind = re.match(r'^(\s*)', lines[n]).group(1)
    lines[n:n + 1] = [ind + x.strip() for x in new_lines]
    edit(path, [(s, '\n'.join(lines))])

ME = lambda t: f"{{ who:'me', t:'{t}' }},"
NPC = lambda t: f"{{ who:'npc', t:'{t}' }},"
C = lambda f, t: f"Party.say('chadol', '{f}', '{t}'),"
B = lambda f, t: f"Party.say('bau', '{f}', '{t}'),"


def retext(path, old_t, who, new_t):
    """도해는 그대로 두고 말하는 사람·글만 바꾼다."""
    s = open(path, encoding='utf-8').read()
    key = "t:'" + old_t + "'"
    lines = s.split('\n')
    hits = [n for n, ln in enumerate(lines) if key in ln]
    if len(hits) != 1: raise SystemExit(f'{path}: retext 대상 {len(hits)}번 — {old_t[:40]}')
    n = hits[0]
    lines[n] = re.sub(r"who:'\w+'", f"who:'{who}'", lines[n], 1).replace(key, "t:'" + new_t + "'")
    edit(path, [(s, '\n'.join(lines))])
