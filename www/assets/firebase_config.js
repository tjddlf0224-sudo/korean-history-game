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
*/
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
