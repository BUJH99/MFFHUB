# Future iOS / Expo shell

루트 `npm install`은 웹앱만 안정적으로 굴리기 위해 이 폴더를 설치하지 않습니다.
나중에 iOS까지 확장할 때 이 폴더에서 따로 시작하세요.

```bash
cd apps/mobile
npm install
npm run start
```

추천 로직/타입은 `packages/core`, `packages/types`를 재사용하는 방향입니다.
