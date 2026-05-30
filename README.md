# 🚀 MFF Data Hub

개인용 **Marvel Future Fight 데이터 허브**입니다.
현재는 **Next.js 웹앱**이 본체이고, **Supabase/Drizzle 데이터 구조**, **공용 TypeScript 로직 패키지**, **향후 Expo 모바일 쉘**, 그리고 루트 전용 CLI인 **`mff.bat`**까지 함께 들어있는 모노레포입니다. ✨

> 🎮 한 줄 요약: 캐릭터 DB, 나의 캐릭터 성장 상태, 카드/X-소드/팀업/CTP, ABX/ABL, 월드보스, PVP 덱, 티어리스트, 점수 기록, 통계까지 한곳에서 보는 개인용 마퓨파 작전실입니다.

---

## ⚡ 빠른 실행

### 🛠️ 처음 한 번

```powershell
npm install
```

Windows에서는 더블클릭용 설치 파일도 있습니다. 🪟

```powershell
.\INSTALL_DEPENDENCIES_WINDOWS.bat
```

### 🧪 개발 서버 실행

가장 추천하는 방식은 전용 CLI입니다. 👇

```powershell
.\mff.bat dev --port 3700 --open
```

또는 npm 스크립트로도 실행할 수 있습니다.

```powershell
npm run dev
```

브라우저 주소:

```txt
http://127.0.0.1:3700
```

### 🪄 무설치 프리뷰

Next.js 서버 없이 정적 미리보기만 보고 싶을 때:

```powershell
.\mff.bat preview root
```

직접 열 수 있는 파일도 있습니다.

```txt
OPEN_ME_FIRST.html
standalone/index.html
apps/web/OPEN_ME_FIRST.html
```

---

## 🧭 현재 주요 기능

### 🧑‍🚀 계정 / 캐릭터 정보

- 👤 사이드바 계정 프로필 저장: 에이전트명, Agent Lv, VIP
- 🃏 카드 편집기: 카드 선택, 품질, 옵션 4/5/6, 제작 색상/스탯, 관통 합산
- ⚔️ X-소드 편집기: 6개 소드, 마스터리 레벨, 옵션 6줄, 공격/관통 요약
- 🤝 팀업 컬렉션: 팀업 레벨, 보유 캐릭터 커버리지, 완성도 요약
- 💎 CTP 인벤토리: 일반/강력/찬란 수량, 장착/여유 수량, 역할별 보유량
- 💾 브라우저 저장소 기반 개인 데이터 저장: `localStorage` 중심, 일부 cookie/hash fallback 포함

### 🧬 캐릭터 DB / 나의 캐릭터

- 🔎 전체 캐릭터 DB 검색: 캐릭터명, 유니폼, 아티팩트, 효과 텍스트 검색
- 🧩 아이콘 필터: 타입, 진영, 성별/종족/속성/능력 태그 기반 필터
- 🧾 Matrix 보기: 캐릭터, 아티팩트, 리더/패시브/유니폼 효과, 유니폼 목록
- 🧍 나의 캐릭터 입력: 티어, 레벨, 타입강화, 엘리트장비, ISO-8, CTP, 우루, 유니폼 보유/등급
- 📄 페이지네이션과 선택 상태 유지
- 🧠 저장 키: `mff-data-hub:my-character-builds:v1`

### 🌍 PVE

- 🐲 World Boss: 보스 선택, 도전 층/정복 레벨 기록, 층별 제한 아이콘, 해금 캐릭터, 조건별 추천 픽 저장
- 🗓️ ABX / ABL: KST 기준 날짜, 라운드/조건, 제한 아이콘, 조합표, 딜러/버퍼 역할 전환, CTP/캐릭터 교체
- 📊 ABX / ABL 사용 순위: 딜러 순위, 버퍼 순위, 상세 순위
- 🌸 시즌 유니폼: 2019-2027 시즌표, PVE/PVP 추천, 보유/미보유 체크
- 🏆 PVE 티어리스트: 타입별 티어 보드, 검색/필터, 드래그 이동, CTP 추천 아이콘 수정

### 🛡️ PVP

- 🔴 Team Battle Arena, 아더월드, 타임라인 화면
- 🚫 제한 캐릭터 관리: 기본 제한 + 사용자 지정 제한 캐릭터
- 🧱 BEST 덱 보드: 슬롯별 캐릭터/유니폼 교체
- 🥇 Team Battle Arena 등급 아이콘: Bronze, Silver, Gold, Platinum, Vibranium, Challenger
- 🔀 Team Battle Arena 행 순서 드래그 및 “가장 강한팀” 지정
- 💾 덱 커스터마이징 저장 키: `mff-data-hub:pvp-deck-customizations:v1`

### 📈 기록 / 분석 / 계산

- 🧮 Damage Lab: 버퍼/디버퍼/카드/피어스/보스 피해/체인 히트/속성 피해/Proc/Rage 기반 비교용 데미지 계산
- 📋 내 기록: 날짜별 ABX, ABL, Infinity Challenge 점수와 3인 조합 기록
- 📊 통계/분석: 나의 캐릭터 입력값 기반 성장 단계, 레벨, 유니폼, 아티팩트, CTP 차트
- 🔍 차트 클릭 시 해당 캐릭터 목록 검사
- 🔔 오늘 할 일: ABX, ABL, 월드보스, 기록, 로스터 체크리스트
- ⚙️ 설정/데이터 관리: 앱 저장 데이터 내보내기, 복사, 가져오기, 초기화

### 🧰 데이터 / DB / 동기화

- 🧲 `THANO$VIB$` 동기화: 캐릭터, 유니폼, 아티팩트, 코믹카드, 서포트, 효과, ABX/ABL 조건
- 🐉 World Boss 동기화: 보스/층/제한/해금 데이터
- 🗃️ Supabase import CSV 생성
- 🧱 Drizzle schema와 Supabase SQL 스냅샷 관리
- 📱 Expo 모바일 쉘 포함: 지금은 향후 iOS/Android 확장용

---

## 🗂️ 파일 구조

```txt
MFF_DATA_HUB/
├─ apps/
│  ├─ web/                         # 🌐 실제 사용되는 Next.js 웹앱
│  │  ├─ src/app/                  # 🧭 App Router 엔트리
│  │  ├─ src/components/           # 🧩 화면/패널/공통 UI
│  │  │  ├─ sections/              # 📄 WorldBoss, ABX/ABL, PVP, 기록, 분석 등 섹션
│  │  │  └─ layout/                # 🧱 Header, skeleton 등 레이아웃
│  │  ├─ src/lib/                  # 🧠 화면용 상태/계산/필터 helper
│  │  ├─ public/mff-assets/        # 🖼️ 캐시된 캐릭터/유니폼/카드/아이템 에셋
│  │  └─ package.json              # 📦 웹앱 의존성/스크립트
│  │
│  └─ mobile/                      # 📱 향후 Expo 모바일 앱 쉘
│     ├─ app/                      # 🚧 Expo Router 시작점
│     └─ package.json              # 📦 모바일 독립 의존성
│
├─ packages/
│  ├─ types/                       # 🧾 Character, Uniform, Account, 추천/계산 타입
│  ├─ core/                        # 🧮 추천 엔진, TOP 계산, 데미지 계산, 로스터 커버리지
│  ├─ account/                     # 🃏 카드/X-소드/팀업 계정 스펙 계산
│  ├─ db/                          # 🗄️ Drizzle schema
│  └─ data/                        # 🧬 카탈로그, 티어, 월드보스, sync 스크립트/생성 데이터
│
├─ scripts/
│  ├─ mff-cli.ts                   # 🧰 전용 CLI 본체
│  └─ ios-note.mjs                 # 📱 iOS 안내 스크립트
│
├─ supabase/
│  ├─ schema.sql                   # 🧱 Supabase SQL 스냅샷
│  └─ imports/                     # 📥 CSV import / seed SQL
│
├─ standalone/                     # 🪄 서버 없이 여는 정적 HTML 프리뷰
├─ output/                         # 📦 작업/출력물 보관 영역
├─ mff.bat                         # 🧨 Windows 전용 MFF CLI 런처
├─ package.json                    # 🧵 루트 workspace / npm scripts
├─ drizzle.config.ts               # 🗄️ Drizzle Kit 설정
├─ .env.example                    # 🔐 환경변수 예시
├─ OPEN_ME_FIRST.html              # 👀 루트 정적 프리뷰
├─ INSTALL_DEPENDENCIES_WINDOWS.bat# 🪟 Windows 설치 helper
├─ START_DEV_WINDOWS.bat           # 🪟 Windows dev helper
├─ SYNC_THANOSVIBS_WINDOWS.bat     # 🪟 Windows sync helper
└─ README.md                       # 📘 이 문서
```

---

## 🧨 전용 CLI: `mff.bat`

이 프로젝트의 터미널 작업은 가능하면 전용 CLI를 쓰면 됩니다.
PowerShell 기준:

```powershell
.\mff.bat <command> [options]
```

npm으로도 같은 CLI를 호출할 수 있습니다.

```powershell
npm run hub -- <command> [options]
```

### 🩺 상태 확인

```powershell
.\mff.bat doctor
.\mff.bat doctor --strict
.\mff.bat doctor --json
.\mff.bat data status
.\mff.bat data status --json
.\mff.bat db check
```

### 🌐 웹앱 실행 / 열기 / 빌드

```powershell
.\mff.bat dev
.\mff.bat dev --host 127.0.0.1 --port 3700 --open
.\mff.bat open
.\mff.bat preview root
.\mff.bat preview web
.\mff.bat preview standalone
.\mff.bat install
.\mff.bat build
.\mff.bat start --port 3700
```

### ✅ 검증 / 테스트

```powershell
.\mff.bat check --fast
.\mff.bat check --full
.\mff.bat typecheck
.\mff.bat lint
.\mff.bat test --list
.\mff.bat test catalog
.\mff.bat test optimizer
.\mff.bat test alliance
.\mff.bat test worldboss
.\mff.bat test tier
.\mff.bat test pvp
```

현재 테스트 alias:

```txt
account, all, alliance, analysis, catalog, character-db, character-names,
comic-card, ctp, dashboard, db, mobile, optimizer, pvp, record, sidebar,
team-up, tier, web, worldboss, xsword
```

### 🧲 데이터 동기화

```powershell
.\mff.bat sync thanosvibs
.\mff.bat sync worldboss
.\mff.bat sync all
.\mff.bat sync thanosvibs --skip-ffmpeg-check
```

생성/갱신되는 대표 파일:

```txt
packages/data/generated/thanosvibs.json
packages/data/generated/worldboss.json
packages/data/generated/debug/*.html
supabase/imports/*.csv
apps/web/public/mff-assets/*
```

### 🗄️ DB / Supabase

```powershell
.\mff.bat db check
.\mff.bat db push
.\mff.bat db studio
```

`db push`와 `db studio`는 `DATABASE_URL`이 필요합니다. 🔐

### 📱 모바일 쉘

```powershell
.\mff.bat ios note
.\mff.bat mobile note
.\mff.bat mobile install
.\mff.bat mobile start
.\mff.bat mobile ios
.\mff.bat mobile android
.\mff.bat mobile typecheck
```

### 🧭 파일 위치 찾기

```powershell
.\mff.bat map list
.\mff.bat map nav
.\mff.bat map dashboard
.\mff.bat map character-db
.\mff.bat map optimizer
.\mff.bat map abx
.\mff.bat map pvp
.\mff.bat map db
.\mff.bat map sync
.\mff.bat map worldboss
.\mff.bat map tier
.\mff.bat map mobile
.\mff.bat map generated
```

`routes`도 같은 라우팅 맵을 보여줍니다.

```powershell
.\mff.bat routes list
```

### 🧹 정리 명령

기본은 dry-run입니다. 실제 삭제는 `--confirm`을 붙여야 합니다. ⚠️

```powershell
.\mff.bat clean debug
.\mff.bat clean generated
.\mff.bat clean assets
.\mff.bat clean debug --confirm
```

---

## 📍 CLI 맵 토픽별 핵심 파일

| 토픽 | 파일 |
|---|---|
| 🧭 `nav` | `apps/web/src/lib/navigation.ts`, `AppShell.tsx`, `Sidebar.tsx`, `MobileNav.tsx`, `Header.tsx` |
| 🧑‍🚀 `dashboard` | `DashboardSection.tsx`, `AccountInsights.tsx`, `packages/account/src/index.ts`, `apps/web/src/lib/data.ts` |
| 🧬 `character-db` | `EnhancedCharacterDB.tsx`, `packages/data/src/catalog.ts`, `catalogCharacterPicker.ts` |
| 🧮 `optimizer` | `packages/core/src/optimizer.ts`, `DamageCalculator.tsx` |
| 🗓️ `abx` | `allianceBattle.ts`, `AllianceBattleSchedule.tsx`, `supabase/imports/alliance_battle_conditions.csv` |
| 🛡️ `pvp` | `apps/web/src/lib/data.ts`, `pvpRestrictions.ts`, `PvpModeSection.tsx` |
| 🗄️ `db` | `packages/db/src/schema.ts`, `supabase/schema.sql`, `drizzle.config.ts`, `.env.example` |
| 🧲 `sync` | `thanosvibs-sync.ts`, `worldboss-sync.ts`, `packages/data/generated/*`, `supabase/imports/*.csv` |
| 🐲 `worldboss` | `worldboss-sync.ts`, `packages/data/src/worldBoss.ts`, `WorldBossSection.tsx` |
| 🏆 `tier` | `packages/data/src/tierList.ts`, `tierListResolver.ts`, `TierListSection.tsx` |
| 📱 `mobile` | `apps/mobile/package.json`, `apps/mobile`, `packages/types`, `packages/core`, `packages/account` |
| 🚫 `generated` | `packages/data/generated/*`, `supabase/imports/*.csv`, `apps/web/public/mff-assets/*`, `apps/web/out` |

---

## 🧪 루트 npm 스크립트

전용 CLI가 더 편하지만, 기본 npm 스크립트도 유지됩니다. 🧵

```powershell
npm run dev
npm run dev:web
npm run build
npm run start
npm run lint
npm test
npm run typecheck
npm run sync:thanosvibs
npm run sync:worldboss
npm run db:push
npm run db:studio
npm run ios:note
```

---

## 🔐 환경변수

`.env.example`을 복사해서 루트 `.env.local`에 채우면 됩니다.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
THANOSVIBS_BASE_URL=https://thanosvibs.money
```

메모:

- 🟢 웹 UI는 로컬 샘플/생성 데이터 중심이라 Supabase 키가 없어도 대부분 열립니다.
- 🟡 `db push`, `db studio`는 `DATABASE_URL`이 필요합니다.
- 🟠 `sync thanosvibs`는 새 이미지/에셋 처리에서 `ffmpeg`가 필요할 수 있습니다.
- 🔵 `.env.local` 누락 warning은 DB/Supabase 작업이 아닐 때는 보통 막힘이 아닙니다.

---

## 📦 현재 데이터 스냅샷

`.\mff.bat data status` 기준으로 현재 생성 데이터는 대략 이렇게 들어있습니다. 📊

### 🧬 Generated JSON

```txt
packages/data/generated/thanosvibs.json
  characters: 308
  uniforms: 579
  artifacts: 263
  comicCards: 112
  allianceBattleConditions: 76
  supports: 342
  characterEffects: 1189
  attributes: 862

packages/data/generated/worldboss.json
  bosses: 10
```

### 📥 Supabase CSV imports

```txt
alliance_battle_conditions.csv: 76 rows
artifacts.csv: 263 rows
character_effects.csv: 847 rows
characters.csv: 308 rows
comic_cards.csv: 112 rows
supports.csv: 342 rows
uniforms.csv: 579 rows
```

### 🖼️ Cached assets

```txt
artifacts: 263
cards: 112
characters: 308
items: 18
pvp: 6
teamups: 8
tier: 4
uniforms: 862
```

---

## 🧱 패키지별 역할

### 🌐 `apps/web`

Next.js 15 + React 19 기반의 실제 대시보드입니다.

주요 화면:

- `AppShell.tsx`: 전체 레이아웃과 섹션 전환
- `Sidebar.tsx`: 계정 프로필, 캐릭터/PVE/PVP 메뉴
- `Header.tsx`: 날짜, 설정/백업, 오늘 할 일
- `AccountInsights.tsx`: 카드/X-소드/팀업 편집기
- `CtpInventoryPanel.tsx`: CTP 인벤토리
- `EnhancedCharacterDB.tsx`: 전체 캐릭터 DB + 나의 캐릭터
- `AllianceBattleSchedule.tsx`: ABX/ABL 조건표와 조합표
- `WorldBossSection.tsx`: 월드보스 층/조건/진행도
- `PvpModeSection.tsx`: PVP 제한/덱/BEST 구성
- `TierListSection.tsx`: PVE/PVP 티어리스트
- `RecordSection.tsx`: 날짜별 점수 기록
- `AnalysisSection.tsx`: 나의 캐릭터 통계
- `DamageCalculator.tsx`: 데미지 계산기

### 🧾 `packages/types`

웹, core, account, data, 향후 mobile이 공유하는 타입입니다.

대표 타입:

```txt
Character, Uniform, Artifact, CharacterBuff, UserCharacter, UserAccount,
ChallengeRule, CustomOptimizerInput, TeamRecommendation, DamageCalculatorInput
```

### 🧮 `packages/core`

UI에 묶이지 않은 순수 계산 로직입니다.

대표 함수:

```txt
getRosterItem
getCurrentUniform
getTierColor
optimizeTeams
getTopCharacters
pveOverallScore
getModeTop3
calcDamage
rosterCoverage
```

### 🃏 `packages/account`

카드, X-소드, 팀업 기반 계정 스펙 계산을 담당합니다.

대표 함수:

```txt
getComicCard
getXSwordElement
getTeamUpTheme
getSwordStats
getTeamUpStats
getTeamUpAttackBonusForCharacter
getTeamUpCoverage
```

### 🧬 `packages/data`

캐릭터 카탈로그, 티어리스트, 월드보스 데이터, 외부 sync 스크립트를 담당합니다.

대표 파일:

```txt
packages/data/src/catalog.ts
packages/data/src/tierList.ts
packages/data/src/worldBoss.ts
packages/data/scripts/thanosvibs-sync.ts
packages/data/scripts/worldboss-sync.ts
packages/data/generated/
```

### 🗄️ `packages/db`

Drizzle schema와 DB 타입의 기준입니다.

```txt
packages/db/src/schema.ts
packages/db/src/index.ts
```

Supabase에서 직접 실행하는 SQL 스냅샷은:

```txt
supabase/schema.sql
```

---

## 🧲 데이터 동기화 흐름

```mermaid
flowchart LR
  A["THANO$VIB$ / external sources"] --> B["packages/data/scripts/*-sync.ts"]
  B --> C["packages/data/generated/*.json"]
  B --> D["supabase/imports/*.csv"]
  B --> E["apps/web/public/mff-assets/*"]
  C --> F["packages/data/src/*"]
  D --> G["Supabase Table Editor / SQL"]
  F --> H["apps/web dashboard"]
  G --> H
```

주의할 generated 파일들입니다. 손으로 직접 고치기보다 sync/소스 데이터를 고치는 쪽이 좋습니다. 🚫

```txt
packages/data/generated/thanosvibs.json
packages/data/generated/worldboss.json
packages/data/generated/debug/*.html
supabase/imports/*.csv
apps/web/public/mff-assets/*
apps/web/out
```

---

## 🗄️ Supabase 사용 순서

1. 🧱 Supabase 프로젝트 생성
2. 📝 SQL Editor에서 `supabase/schema.sql` 실행
3. 📥 `supabase/imports/*.csv`를 Table Editor로 import
4. 🔐 `.env.example`을 `.env.local`로 복사하고 값 입력
5. 🩺 연결 확인

```powershell
.\mff.bat db check
```

Drizzle push 또는 Studio:

```powershell
.\mff.bat db push
.\mff.bat db studio
```

---

## 🧪 개발 루틴 추천

### 🟢 화면/로컬 UI 작업

```powershell
.\mff.bat dev --port 3700 --open
.\mff.bat test web
.\mff.bat check --fast
```

### 🟣 캐릭터 DB / 나의 캐릭터 작업

```powershell
.\mff.bat map character-db
.\mff.bat test character-db
.\mff.bat test analysis
```

### 🔵 ABX / ABL 작업

```powershell
.\mff.bat map abx
.\mff.bat test alliance
```

### 🔴 PVP 작업

```powershell
.\mff.bat map pvp
.\mff.bat test pvp
```

### 🐲 월드보스 작업

```powershell
.\mff.bat map worldboss
.\mff.bat test worldboss
```

### 🧲 데이터 sync 작업

```powershell
.\mff.bat data status
.\mff.bat sync thanosvibs
.\mff.bat sync worldboss
.\mff.bat data status
```

---

## 🧯 자주 나는 문제

### ❌ `next`를 찾을 수 없음

의존성이 설치되지 않은 상태입니다.

```powershell
npm install
```

### ❌ 포트 3700이 바쁨

이미 dev 서버가 돌고 있을 수 있습니다. 다른 포트로 실행해도 됩니다.

```powershell
.\mff.bat dev --port 3701 --open
```

### ❌ `DATABASE_URL` 없음

DB 명령에는 루트 `.env.local` 또는 현재 shell 환경변수가 필요합니다.

```powershell
.\mff.bat db check
```

### ❌ sync 결과가 0개 또는 이상함

외부 사이트 HTML 구조가 바뀌었을 수 있습니다. debug HTML을 확인합니다.

```txt
packages/data/generated/debug/*.html
```

### ❌ 이미지가 깨짐

캐시된 에셋 또는 외부 이미지 경로가 바뀌었을 수 있습니다.

```powershell
.\mff.bat data status
.\mff.bat sync thanosvibs
```

---

## 📱 모바일 확장 메모

`apps/mobile`은 현재 완성 앱이 아니라 향후 확장용 Expo 쉘입니다.
웹앱이 본체이고, 아래 공용 패키지를 재사용하도록 준비되어 있습니다. 📦

```txt
packages/types
packages/core
packages/account
packages/data
```

모바일만 따로 설치/실행:

```powershell
.\mff.bat mobile install
.\mff.bat mobile start
```

---

## 🧡 운영 메모

이 프로젝트는 공개 상용 서비스보다 **개인용 고급 데이터 허브**에 가깝습니다.
외부 데이터, 게임 이미지, 캐릭터/유니폼 명칭은 각 원천 사이트와 권리자의 정책을 확인하고 개인 사용 범위에서 조심해서 다루는 것이 좋습니다. 🛡️

---

## 🏁 최종 요약

**MFF Data Hub**는 마퓨파 개인 계정 기준으로 캐릭터 DB, 성장 상태, 장비/카드/팀업, ABX/ABL, 월드보스, PVP, 티어리스트, 기록/통계/계산기를 한 번에 관리하기 위한 **Next.js + TypeScript + Supabase + Drizzle 기반 모노레포**입니다.

그리고 이제 루트의 **`.\mff.bat` 전용 CLI**가 실행, 진단, 테스트, 동기화, DB, 모바일, 파일 라우팅까지 책임집니다. 🚀
