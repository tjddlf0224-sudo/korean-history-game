// 조선 전기 MVP - 초기 스캐폴드
// 챕터 데이터 로딩 테스트용 placeholder

fetch('data/chapters_index.json')
  .then((res) => res.json())
  .then((index) => {
    const app = document.getElementById('app');
    const list = document.createElement('ul');
    index.chapters.forEach((ch) => {
      const li = document.createElement('li');
      li.textContent = `챕터 ${ch.chapterId}: ${ch.title} (${ch.king})`;
      list.appendChild(li);
    });
    app.appendChild(list);
  })
  .catch((err) => {
    console.error('챕터 데이터 로딩 실패', err);
  });
