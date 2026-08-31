# iOS 로그인 준비 (구글 · 애플)

코드는 다 들어가 있다. **콘솔·개발자 계정 쪽 설정만 남았다.**
아래 순서를 **그대로** 지켜야 한다 — 순서를 바꾸면 앱이 켜지자마자 죽는다.

## ⚠️ 반드시 이 순서로

`@capacitor-firebase/authentication` 플러그인은 앱이 켜질 때 `FIRApp.configure()`를
부른다. `GoogleService-Info.plist` 가 없으면 **그 자리에서 크래시한다.**
실제로 겪었다 — 플러그인만 먼저 깔았더니 앱이 켜졌다가 곧바로 홈 화면으로 튕겼다.

그래서 **plist 를 먼저 넣고, 플러그인은 나중에 깐다.**

## 1. 파이어베이스 콘솔 (사장님)

1. 프로젝트 만들기 — 새로 만드는 걸 권한다(보카 바리스타와 섞지 말 것).
2. **웹 앱 추가** → 나오는 구성 여섯 줄을 `www/assets/firebase_config.js` 에 옮긴다.
3. **iOS 앱 추가** → 번들 ID `com.yunsis.koreanhistorygame`
   → `GoogleService-Info.plist` 를 받아 `ios/App/App/` 에 넣는다.
4. Authentication → Sign-in method → **Google** 켜기
5. Authentication → Sign-in method → **Apple** 켜기 (아래 2번이 끝나야 완성된다)
6. Firestore Database 만들기 (프로덕션 모드)

## 2. 애플 로그인 (사장님 · 유료 개발자 계정 필요)

애플은 구글보다 손이 많이 간다.

1. developer.apple.com → Certificates, Identifiers & Profiles
   - App ID `com.yunsis.koreanhistorygame` 에 **Sign In with Apple** 체크
   - **Service ID** 하나 만들고, Return URL 에
     `https://<프로젝트ID>.firebaseapp.com/__/auth/handler` 를 넣는다
   - **Key** 를 만들어 Sign In with Apple 을 켜고 `.p8` 파일을 받는다
2. 파이어베이스 콘솔 Apple 제공업체에 Service ID, Team ID, Key ID, `.p8` 을 넣는다
3. Xcode 에서 App 타깃 → Signing & Capabilities → **+ Capability → Sign In with Apple**

> 앱스토어 규칙상, 구글 로그인을 제공하면 **애플 로그인도 같이 제공해야 한다.**
> 둘 중 하나만 넣으면 심사에서 걸린다.

## 3. 플러그인 설치 (여기서부터 내가 한다)

`GoogleService-Info.plist` 가 자리에 있는 것을 확인한 뒤:

```bash
npm i @capacitor-firebase/authentication
npx cap sync ios
python3 www/assets/tools/ios_setup.py     # 가로 고정 + 구글 URL 스킴 주입
```

`ios_setup.py` 가 `GoogleService-Info.plist` 의 `REVERSED_CLIENT_ID` 를 읽어
`CFBundleURLSchemes` 에 넣는다. **이게 빠지면 구글 로그인 창은 뜨는데 끝나고
앱으로 안 돌아온다.**

## 지금 상태

| | 상태 |
|---|---|
| 웹 SDK (vendor/firebase) | 들어감 |
| 로그인 모듈 `www/assets/auth.js` | 들어감 (구글·애플, 앱=네이티브 / 웹=팝업) |
| 챕터 목록의 로그인 단추 | 들어감 (설정이 비면 **단추 자체가 안 생긴다**) |
| `firebase_config.js` | **비어 있음** — 1번을 하면 채운다 |
| 네이티브 플러그인 | **일부러 뺐다** — plist 가 생긴 뒤에 깐다 |

설정이 비어 있는 동안에도 게임은 **아무 문제 없이 돌아간다.** 로그인은 조용히 꺼져 있을 뿐이다.
