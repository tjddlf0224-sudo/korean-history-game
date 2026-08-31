/* ============ 파이어베이스 설정 ============

   여기 값이 채워지기 전에는 로그인·랭킹이 **조용히 꺼진 채로** 돌아간다.
   게임 자체는 로그인 없이도 끝까지 할 수 있어야 하므로, 설정이 없다고
   오류를 내거나 화면을 막지 않는다(auth.js가 알아서 비활성으로 둔다).

   채우는 법
     1) 파이어베이스 콘솔에서 프로젝트를 만든다(웹 앱 추가).
     2) 프로젝트 설정 → 내 앱 → SDK 설정 및 구성 → "구성"에 나오는
        여섯 줄을 아래에 그대로 옮긴다.
     3) Authentication → Sign-in method 에서 **Google**과 **Apple**을 켠다.
     4) Firestore Database 를 만든다(프로덕션 모드).

   iOS는 여기에 더해 네이티브 설정이 필요하다 — README의 "iOS 로그인 준비" 참고.

   여기 apiKey는 **비밀이 아니다.** 파이어베이스 웹 API 키는 프로젝트를 가리키는
   식별자일 뿐이고, 브라우저에 그대로 실려 나가므로 숨길 수도 없다. 실제 방어는
   Firestore 보안 규칙에서 한다 — 규칙을 열어 두면 키를 숨겨도 소용없고,
   규칙을 잠가 두면 키가 보여도 괜찮다. (measurementId는 애널리틱스를 안 써서 뺐다.)
*/
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCJ7WNxKGqxI2T0hmXFOEalU7vZkBxnIZY",
  authDomain: "korean-history-game-beec0.firebaseapp.com",
  projectId: "korean-history-game-beec0",
  storageBucket: "korean-history-game-beec0.firebasestorage.app",
  messagingSenderId: "544299282957",
  appId: "1:544299282957:web:e0c81774916f96bb605b44",
};
