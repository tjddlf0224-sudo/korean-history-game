/* ============ 판 껍데기 — 네 화면이 같은 옷을 입게 ============

   왜 만들었나
   - 출석·상자·할 일·미니게임·계급이 저마다 판을 그렸다. 테두리 굵기도,
     제목 크기도, 단추 생김새도 조금씩 달랐다. 하나씩 보면 모르지만
     연달아 열어 보면 **딴 게임 화면 같다.**
   - 옷을 한 벌로 맞춘다. 여기서 한 번 고치면 다섯 화면이 같이 바뀐다.

   여기서 정하는 것
   - 판: 위아래로 옅어지는 바탕, 위쪽 금박 한 줄, 둥근 모서리, 그림자
   - 제목: 한 서체(Gugi)로 통일
   - 닫기: 아래에 가로로 긴 단추 대신 **모서리에 동그란 ✕**
     (가로 화면은 세로가 390뿐이라, 단추 하나가 그만큼 아깝다)
   - 단추: 누르면 살짝 들어간다. 주행동(.hi)은 금빛으로 채운다.
   - 묶음 이름: 자간을 넓히고 뒤로 실선을 흘린다

   화면마다 다른 것(엽전 길, 상자 그림, 할 일 줄…)은 각 파일이 알아서 한다.
   이 파일은 **다른 모듈보다 먼저** 실려야 한다 — 나중에 실린 쪽이 이긴다.
*/
(function(){
  const SEL = '.dy-ov, #mg-ov, #qs-ov, #ul-ov';
  const s = document.createElement('style');
  s.id = 'panelskin';
  s.textContent = `
  ${SEL} { position:absolute; inset:0; z-index:95; display:none;
    align-items:center; justify-content:center; padding:14px;
    background:rgba(6,4,2,.78);
    -webkit-backdrop-filter:blur(7px) saturate(.9); backdrop-filter:blur(7px) saturate(.9);
    font-family:"Gowun Batang",serif; }
  ${SEL.split(', ').map(x => x + '.show').join(', ')} { display:flex; }

  ${SEL.split(', ').map(x => x + ' .panel').join(', ')} {
    position:relative; width:min(94%,470px); max-height:92%; overflow-y:auto;
    -webkit-overflow-scrolling:touch;
    background:linear-gradient(180deg,#241b11 0%,#171108 100%);
    border:1px solid #4a3c26; border-radius:18px; padding:16px 18px;
    box-shadow:0 24px 60px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,238,205,.06);
    display:flex; flex-direction:column; gap:9px; }
  ${SEL.split(', ').map(x => x + ' .panel::before').join(', ')} {
    content:''; position:absolute; left:0; right:0; top:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(201,162,74,.35) 18%,
      rgba(240,201,107,.72) 50%,rgba(201,162,74,.35) 82%,transparent); }

  ${SEL.split(', ').map(x => x + ' h3').join(', ')} {
    margin:0; font-size:18px; color:#f0c96b; text-align:center;
    font-family:"Gugi","Gowun Batang",serif; letter-spacing:.05em; }
  ${SEL.split(', ').map(x => x + ' .sub').join(', ')} {
    text-align:center; font-size:12.5px; color:#b8a888; line-height:1.7; margin-top:-3px; }

  /* 묶음 이름 — 메뉴와 같은 결로 */
  ${SEL.split(', ').map(x => x + ' .sec').join(', ')} {
    display:flex; align-items:center; gap:9px; margin:5px 0 -1px;
    font-size:10.5px; font-weight:400; letter-spacing:.34em; color:#8b7c63; }
  ${SEL.split(', ').map(x => x + ' .sec::after').join(', ')} {
    content:''; flex:1; height:1px; background:linear-gradient(90deg,#3a2c1a,transparent); }

  ${SEL.split(', ').map(x => x + ' button').join(', ')} {
    padding:12px; border-radius:11px; font-family:"Gowun Batang",serif; font-size:14.5px;
    cursor:pointer; border:1px solid #4a3c26; background:#241b11; color:#f5ecd8;
    transition:transform .12s ease, background .16s, border-color .16s; }
  ${SEL.split(', ').map(x => x + ' button:active').join(', ')} { transform:scale(.98); }
  ${SEL.split(', ').map(x => x + ' button:disabled').join(', ')} { opacity:.38; cursor:default; }
  ${SEL.split(', ').map(x => x + ' button:disabled:active').join(', ')} { transform:none; }
  /* 이 화면에서 할 일 하나 — 금빛으로 채워 앞세운다 */
  ${SEL.split(', ').map(x => x + ' button.hi').join(', ')} {
    background:linear-gradient(180deg,#efcd8b,#c9a24a); border-color:#e0bd76;
    color:#2b1f0c; font-weight:700; box-shadow:0 4px 14px rgba(201,162,74,.28); }

  /* 닫기는 모서리 표로 */
  ${SEL.split(', ').map(x => x + ' .x').join(', ')} {
    position:absolute; top:11px; right:12px; width:29px; height:29px; padding:0;
    border-radius:50%; border:1px solid #46381f; background:rgba(0,0,0,.28);
    color:#bfae90; font-size:15px; line-height:1; display:flex; align-items:center;
    justify-content:center; }

  ${SEL.split(', ').map(x => x + ' .msg').join(', ')} {
    text-align:center; font-size:13px; color:#c9a24a; }
  ${SEL.split(', ').map(x => x + ' .msg:empty').join(', ')} { display:none; }

  /* 두 칸·세 칸으로 나란히 놓을 때. 크기를 똑같이 둔다. */
  ${SEL.split(', ').map(x => x + ' .row2').join(', ')} {
    display:grid; grid-template-columns:1fr 1fr; gap:9px; }
  ${SEL.split(', ').map(x => x + ' .row3').join(', ')} {
    display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  ${SEL.split(', ').map(x => x + ' .row2 > button, ' + x + ' .row3 > button').join(', ')} { margin:0; }
  `;
  (document.head || document.documentElement).appendChild(s);
})();
