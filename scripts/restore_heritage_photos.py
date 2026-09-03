# -*- coding: utf-8 -*-
"""대사 개편 때 떨어져 나간 문화유산 사진을 되살린다.

   무엇이 잘못됐나
   - `_research/heritage_image_credits.md`에 등록된 49장 가운데 **41장만**
     챕터에서 쓰이고 있었다. 8장이 화면에서 사라졌다.
   - 그중 7장은 대사 개편(서브에이전트가 beats를 새로 쓸 때)에 딸려 빠졌다.
     사진 beat(`who:'doc'` + `docImg`)은 "손대지 말 것"에 들어 있지 않아서
     새 beats에 옮겨 적히지 않았다. **규격 문서의 빈틈이었다.**
   - 남은 1장(강화 부근리 고인돌)은 문서에 자리까지 적혀 있는데
     한 번도 쓰인 적이 없었다(git 이력 전체를 훑어 확인).

   어떻게 되살리나
   - 캡션은 **예전 커밋에서 그대로 가져온다**(내가 다시 쓰면 출처 표기가
     흔들린다). 출처 줄은 `\\n출처: …` 로 유지해야 renderDocCaption()이
     작은 글씨로 갈라 앉힌다.
   - 넣을 자리는 그 사진을 설명하는 대사 **바로 뒤**다. 앞에 두면
     무엇의 사진인지 모른 채 보게 된다.

   쓰는 법
     python3 scripts/restore_heritage_photos.py
"""
import io, os, re

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

# (챕터, 이 대사 뒤에 넣는다(부분 문자열), 사진, 캡션)
# 캡션은 dc75849 / a199c86 커밋에서 그대로 옮겼다.
JOBS = [
    ('godae1.html', '미륵사',
     'assets/scenes/heritage_mireuksaji_tower.jpg',
     '(익산 미륵사지 석탑. 현존하는 삼국 시대 석탑 중 가장 크며, 목탑의 짜임새를 '
     '그대로 돌에 옮긴 초기 백제 석탑 양식을 보여준다.)\\n'
     '출처: 셀수스협동조합, 공유마당, 기증저작물(자유이용)'),
    ('godae1.html', '중원고구려비',
     'assets/scenes/heritage_jungwon_goguryeobi.jpg',
     '(충주 고구려비. 한반도 안에 남은 유일한 고구려 비석으로, 5세기 장수왕 대에 '
     '고구려가 남한강 유역까지 세력을 뻗쳐 신라를 사실상 아래에 둔 정황을 보여준다.)\\n'
     '출처: 국가유산청, 국가유산포털, 공공누리 제1유형'),
    ('godae1.html', '수렵도',
     'assets/scenes/heritage_muyongchong_suryeopdo.jpg',
     '(정기환 필 무용총 수렵도 모사도. 말을 타고 활을 쏘며 호랑이와 사슴을 사냥하는 '
     '고구려인의 힘찬 모습을 담았다.)\\n'
     '출처: 국립중앙박물관(모사: 정기환), 공유마당, 공공누리 제1유형'),
    ('godae1.html', '정림사',
     'assets/scenes/heritage_jeongnimsaji_tower.jpg',
     '(부여 정림사지 오층석탑. 목탑의 짜임새를 그대로 돌에 옮긴 초기 백제 석탑 양식을 '
     '보여주며, 미륵사지 석탑과 함께 백제 석탑의 두 대표작으로 꼽힌다.)\\n'
     '출처: 국가유산청, 국가유산포털, 공공누리 제1유형'),
    ('godae1.html', '금동대향로',
     'assets/scenes/heritage_geumdong_daehyangno.jpg',
     '(백제 금동대향로. 능산리 절터에서 출토되었으며, 봉황과 용, 산봉우리와 신선, '
     '동물들을 정교하게 새겨 도교와 불교의 세계관을 함께 담아낸 백제 금속 공예의 걸작이다.)\\n'
     '출처: 국가유산청, 국가유산포털, 공공누리 제1유형'),
    ('godae1.html', '순수비',
     'assets/scenes/heritage_bukhansan_jinheungwang_sunsubi.jpg',
     '(북한산 진흥왕 순수비. 555년 무렵 진흥왕이 한강 유역까지 영토를 넓힌 뒤 이를 '
     '기념해 세운 비석으로, 원래 북한산 비봉에 있었으나 훼손을 막기 위해 지금은 '
     '국립중앙박물관으로 옮겨 보존되고 있다.)\\n'
     '출처: 국가유산청, 국가유산포털, 공공누리 제1유형'),
    ('imjin2.html', '행주',
     'assets/scenes/heritage_haengju_daecheopbi.jpg',
     None),      # 캡션을 a199c86에서 꺼내 온다
    # 강화 부근리 고인돌 — 한 번도 안 쓰였다. 사용자가 "이 얘기가 나올 때
    # 고인돌 이미지가 위에 뜨면 좋겠어"라고 해서 크기 이야기 바로 뒤에 넣는다.
    ('seonsa1.html', '고인돌의 크기',
     'assets/scenes/heritage_ganghwa_bugeunri_dolmen.jpg',
     '(강화 부근리 지석묘. 덮개돌 하나가 50톤이 넘는 탁자식 고인돌로, 이만한 돌을 '
     '옮기려면 수백 명이 필요했다. 사람을 부릴 수 있는 자가 있었다는 증거다. 사적 137호.)\\n'
     '출처: 국가유산청, 국가유산포털, 공공누리 제1유형'),
]


def caption_from_git(chapter, img):
    """예전 커밋에서 캡션을 그대로 꺼낸다 — 출처 표기를 내가 다시 쓰지 않는다."""
    import subprocess
    root = os.path.dirname(BASE)
    for commit in ('a199c86', 'dc75849'):
        r = subprocess.run(['git', 'show', '%s:www/%s' % (commit, chapter)],
                           cwd=root, capture_output=True, text=True)
        if r.returncode:
            continue
        m = re.search(r"docImg:'" + re.escape(img) + r"',\s*\n\s*t:'((?:[^'\\]|\\.)*)'",
                      r.stdout)
        if m:
            return m.group(1)
    return None


def main():
    os.chdir(BASE)
    done, fail = 0, []
    for chapter, anchor, img, cap in JOBS:
        if cap is None:
            cap = caption_from_git(chapter, img)
            if not cap:
                fail.append('%s %s — 예전 캡션을 못 찾음' % (chapter, img)); continue

        s = io.open(chapter, encoding='utf-8').read()
        if img in s:
            print('  이미 있음: %s ← %s' % (chapter, img.split('/')[-1])); continue

        # 그 말이 나오는 대사 beat을 찾아 **그 뒤에** 사진을 끼운다
        pat = re.compile(r"^(\s*)\{ who:'(?:npc|me)',[^\n]*" + re.escape(anchor) +
                         r"[^\n]*\},$", re.M)
        m = pat.search(s)
        if not m:
            # chart가 붙어 여러 줄로 흐르는 beat — 닫는 '},'까지 찾는다
            pat2 = re.compile(r"^(\s*)\{ who:'(?:npc|me)',[^\n]*" + re.escape(anchor) +
                              r"[\s\S]{0,600}?\n\1\s*\},$", re.M)
            m = pat2.search(s)
        if not m:
            fail.append('%s — "%s"가 든 대사를 못 찾음' % (chapter, anchor)); continue

        ind = m.group(1)
        beat = ("\n%s{ who:'doc', docImg:'%s',\n%s  t:'%s' }," % (ind, img, ind, cap))
        s = s[:m.end()] + beat + s[m.end():]
        io.open(chapter, 'w', encoding='utf-8').write(s)
        print('  넣음: %-14s ← %s ("%s" 뒤)' % (chapter, img.split('/')[-1], anchor))
        done += 1

    print('\n되살린 사진: %d장' % done)
    for f in fail:
        print('  ⚠️', f)


if __name__ == '__main__':
    main()
