# -*- coding: utf-8 -*-
"""무왕 이야기를 고대 1화에서 고대 3화로 옮긴다.

   왜
   - 무령왕(재위 501~523)이 "훗날 무왕은…" 하고 백 년 뒤 일을 이야기하고 있었다.
     제보: "무령왕이 훗날 무왕에 대해 이야기하니까 좀 어색하네."
   - 더 큰 문제는 시대다. 고대 1화는 **4~6세기**인데 무왕은 **7세기**다.
     고대 3화(통일 전쟁)는 7세기라, 무왕(600~641)은 의자왕 바로 앞에 놓인다.

   옮기는 것
   - 서동요 대사 · 미륵사 대사 · 미륵사지 석탑 사진 · 미륵사 문항

   함께 고치는 것
   - 무령왕의 "웅진·사비·익산 — 세 도읍의 자취일세" 는 **익산을 도읍으로
     단정**한다. 우리역사넷은 익산 왕궁리 유적을 두고 "천도를 시도했거나
     별도(別都)로 기능했다는 학설이 있다"고만 쓴다. 확정된 사실이 아니다.
     그래서 무령왕은 두 도읍만 말하고, 익산 이야기는 무왕이 직접 하되
     **학설이라는 사실까지** 말한다.

   초상
   - 무왕 초상은 아직 없다. 필드는 실루엣(look), 대화창은 아이콘으로
     대신 그려진다 — drawNpcSprite가 그렇게 만들어져 있다.
     그림이 오면 img를 넣기만 하면 된다.

   쓰는 법
     python3 scripts/move_muwang.py
"""
import io
import os
import re

WWW = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'www')

CROWN = ("<svg viewBox=\"0 0 24 24\" width=\"1em\" height=\"1em\" "
         "style=\"vertical-align:-0.125em\" fill=\"currentColor\" stroke=\"none\">"
         "<path d=\"M3 8l4 4 5-7 5 7 4-4v9H3z\"/></svg>")

MUWANG_NPC = """  muwang_0: {
    name: '무왕', icon: '%s',
    beats: [
      { who:'npc', t:'(돌을 고르다 고개를 든다) 마침 잘 왔네. 이것 좀 들어 주게.' },
      { who:'me', t:'(든다) …무겁습니다. 어디에 쓰십니까?' },
      { who:'npc', t:'탑을 세우네. 익산 금마저에 절을 짓고 있지.',
        chart:{ type:'map', title:'무왕이 절을 세운 곳', pins:[ { x:42.9, y:117.4, n:'익산', on:true }, { x:41.6, y:113.4, n:'사비' } ] } },
      { who:'me', t:'절 이름이 무엇입니까?' },
      { who:'npc', t:'미륵사일세. 탑과 금당을 셋씩 나란히 둘 참이야.',
        chart:{ type:'grid', title:'미륵사의 짜임', head:['자리','수'], rows:[ ['탑','셋'], ['금당','셋'] ], hi:0 } },
      { who:'me', t:'…셋씩이나요. 그럼 우리나라에서 가장 큰 절이 되겠습니다.' },
      { who:'doc', docImg:'assets/scenes/heritage_mireuksaji_tower.jpg',
        t:'(익산 미륵사지 석탑. 현존하는 삼국 시대 석탑 중 가장 크며, 목탑의 짜임새를 그대로 돌에 옮긴 초기 백제 석탑 양식을 보여준다.)\\n출처: 셀수스협동조합, 공유마당, 기증저작물(자유이용)' },
      { who:'me', t:'도읍을 이곳 익산으로 옮기시는 겁니까?' },
      { who:'npc', t:'(잠시 말이 없다) …그건 훗날 사람들이 다툴 일일세.',
        chart:{ type:'compare', title:'익산 왕궁리 유적을 보는 두 갈래', cols:[ { h:'천도설', items:[ '사비에서 익산으로 옮기려 했다' ] }, { h:'별도설', hi:true, items:[ '제2의 도읍으로 삼았다' ] } ], note:'확정된 사실이 아니라 학설이다. 우리역사넷도 "천도를 시도했거나 별도로 기능했다는 학설"이라고만 쓴다.' } },
      { who:'npc', t:'나는 본디 서동이라 불렸네. 마를 캐어 팔던 아이였지.' },
      { who:'me', t:'그 서동요의…?' },
      { who:'npc', t:'노래 하나로 신라 공주를 얻었다더군. 삼국유사의 이야기일세.',
        chart:{ type:'kings', main:[ { name:'위덕왕' }, { name:'혜왕' }, { name:'법왕' }, { name:'무왕', note:'서동요·미륵사', active:true }, { name:'의자왕', note:'백제 마지막' } ], cross:[ null, null, null, null, null ] } },
    ],
    quizSeq: [
      { q:'백제 무왕이 금마저(익산)에 세운, 세 탑과 세 금당을 나란히 둔 백제 최대의 사찰은?',
        opts:['미륵사','불국사'], answer:0, src:[78],
        feedback:['불국사는 통일 신라 경덕왕 때 세워진 절이에요.','정답! 미륵사입니다. 서동요의 주인공 무왕이 익산에 세웠어요.'] },
    ],
  },
""" % CROWN


def main():
    os.chdir(WWW)

    # ── ① 고대 1화에서 덜어낸다 ─────────────────────────────────────────
    s = io.open('godae1.html', encoding='utf-8').read()
    before = len(s)

    # 무왕 대사 넷(서동요·미륵사 물음·미륵사 답·석탑 사진)을 통째로
    pat = re.compile(
        r"\n\s*\{ who:'npc', t:'훗날 무왕은 서동요로 신라 공주를 얻었다더군\.',"
        r"[\s\S]*?"
        r"\n\s*\{ who:'doc', docImg:'assets/scenes/heritage_mireuksaji_tower\.jpg',"
        r"\n[^\n]*\},")
    s2, n = pat.subn('', s, count=1)
    print('① 고대 1화 · 무왕 대사 덜어냄: %s' % ('됨' if n else '못 찾음'))
    s = s2

    # 익산을 도읍으로 단정하던 대사 — 두 도읍만 남긴다
    old_line = "{ who:'npc', t:'웅진·사비·익산 — 세 도읍의 자취일세.',"
    new_line = ("// 익산은 도읍이라 단정할 수 없다. 우리역사넷은 왕궁리 유적을 두고\n"
                "      // \"천도를 시도했거나 별도로 기능했다는 학설\"이라고만 쓴다.\n"
                "      // 익산 이야기는 고대 3화의 무왕이 학설까지 함께 말한다.\n"
                "      { who:'npc', t:'웅진과 사비 — 두 도읍의 자취일세.',")
    if old_line in s:
        s = s.replace(old_line, new_line, 1)
        print('② 무령왕 대사: 세 도읍 → 두 도읍(익산은 학설이라 뺐다)')

    # 미륵사 문항을 덜어낸다
    qpat = re.compile(
        r"\n\s*\{ q:'백제 무왕이 금마저\(익산\)에 세운[\s\S]*?feedback:\[[^\]]*\] \},")
    s, nq = qpat.subn('', s, count=1)
    print('③ 미륵사 문항 덜어냄: %s' % ('됨' if nq else '못 찾음'))
    io.open('godae1.html', 'w', encoding='utf-8').write(s)
    print('   고대 1화 %d자 → %d자' % (before, len(s)))

    # ── ② 고대 3화에 무왕을 세운다 ──────────────────────────────────────
    t = io.open('tongil.html', encoding='utf-8').read()

    if "id: 'muwang'" not in t:
        anchor = "{ id:'gyebaek',"
        i = t.index(anchor)
        npc = ("// 무왕(600~641)은 의자왕 바로 앞이다. 고대 1화(4~6세기)에서는\n"
               "      // 무령왕이 백 년 뒤 일을 이야기하는 꼴이라 이리로 옮겼다.\n"
               "      // 초상은 아직 없다 — 필드는 실루엣, 대화창은 아이콘으로 뜬다.\n"
               "      { id:'muwang', name:'무왕', x:1000, y:320,\n"
               "        look: { role: 'king', body: '#6b4a7a', accent: '#e0b94a' } },\n"
               "      ")
        t = t[:i] + npc + t[i:]
        print('④ 고대 3화 · 무왕 세움 (1000,320)')

    if 'muwang_0:' not in t:
        m = re.search(r'const NPC_DATA = \{\n', t)
        t = t[:m.end()] + MUWANG_NPC + t[m.end():]
        print('⑤ 무왕 대사·문항 넣음')

    io.open('tongil.html', 'w', encoding='utf-8').write(t)


if __name__ == '__main__':
    main()
