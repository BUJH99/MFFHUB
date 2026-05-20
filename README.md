# MFF Data Hub Final

개인용 **Marvel Future Fight 데이터 허브 / ABX·ABL 조합 최적화 / 캐릭터 DB / 계산기 / 통계 대시보드** 프로젝트입니다.

이번 최종본은 기존 Next.js 앱을 바로 쓸 수 있게 유지하면서, 향후 iOS 확장까지 고려해서 구조를 monorepo 형태로 정리했습니다.

## 빠른 실행

처음 한 번만 의존성을 설치합니다.

```powershell
npm install
```

Windows에서는 루트의 `INSTALL_DEPENDENCIES_WINDOWS.bat`을 더블클릭해도 됩니다.

그 다음부터는 개발 서버만 빠르게 실행합니다.

```powershell
npm run dev
```

Windows에서는 `START_DEV_WINDOWS.bat`을 더블클릭하면 됩니다.

브라우저:

```txt
http://127.0.0.1:3600
```

무설치 미리보기는 루트의 `OPEN_ME_FIRST.html` 또는 `standalone/index.html`을 더블클릭하세요.

## 구조

```txt
apps/web              실제 사용용 Next.js 웹앱
apps/mobile           향후 Expo iOS 앱 쉘, 루트 설치에서는 제외
packages/types        캐릭터/유니폼/아티팩트/계정/추천 타입
packages/core         추천 엔진, 점수 계산, 데미지 계산
packages/account      카드/X-소드/팀업 기반 계정 스펙 계산
packages/db           Drizzle/Supabase DB schema
packages/data         THANO$VIB$ sync adapter + seed/catalog
supabase/schema.sql   Supabase Table Editor용 SQL
supabase/imports      sync 결과 CSV import 위치
standalone/index.html 브라우저 바로 열리는 프리뷰
```

## 주요 기능

- 계정 정보 사이드바
- PVE / PVP / 통계 / 기록 / 가이드 / 티어리스트 메뉴
- ABX / ABL 오늘의 도전 조건 2개 표시
- 커스텀 ABX / ABL 조합 추천
- 개인 계정 보유 캐릭터/유니폼/아티팩트/CTP 반영형 점수 계산
- PVE: 인피니티 챌린지 / ABX / ABL TOP3
- PVP TOP3
- 캐릭터 상세 패널
- 캐릭터 DB Matrix
  - 1열: 캐릭터 이미지
  - 2열: 아티팩트
  - 3열: 유니폼별 리더/패시브/유니폼 효과 총집합
  - 4열~N열: 적용 가능 유니폼[유니폼 갯수에 따라 N열까지 동적 확장]
- 버퍼/디버퍼/데미지 효과 계산기
- Supabase + Drizzle schema
- THANO$VIB$ sync adapter

## THANO$VIB$ 데이터 동기화

```powershell
npm run sync:thanosvibs
```

Windows에서는 `SYNC_THANOSVIBS_WINDOWS.bat`을 더블클릭하면 됩니다.

결과물:

```txt
packages/data/generated/thanosvibs.json
supabase/imports/characters.csv
supabase/imports/uniforms.csv
supabase/imports/artifacts.csv
supabase/imports/supports.csv
packages/data/generated/debug/*.html
```

파서가 0개를 뱉으면 `packages/data/generated/debug/*.html`을 기준으로 파서만 고치면 됩니다.
이번 버전은 이전처럼 무조건 조용히 0개로 끝나지 않고 warning과 debug HTML을 남기게 했습니다.

## Supabase 관리

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. `supabase/imports/*.csv`를 Table Editor로 import
4. `.env.example`을 `.env.local`로 복사하고 키 입력

## iOS 확장

처음부터 네이티브로 갈 필요 없습니다. 웹앱을 먼저 완성한 다음, iOS가 필요할 때:

```powershell
cd apps/mobile
npm install
npm run start
```

모바일은 Expo 기반 쉘만 넣어뒀고, 추천 엔진/계정 스펙/타입은 `packages/core`, `packages/account`, `packages/types`를 재사용하는 구조입니다.

## 추천 개발 순서

1. `npm install`로 의존성 설치
2. `npm run dev`로 웹앱 확인
3. `src/lib/data.ts`의 샘플 계정/캐릭터 보유 상황 수정
4. `npm run sync:thanosvibs`로 최신 Uniform/Artifact/Support CSV 생성
5. Supabase에 schema/import 적용
6. 관리자 CRUD 화면 추가
7. iOS 앱은 마지막에 Expo로 연결
