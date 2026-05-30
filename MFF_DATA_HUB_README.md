# MFF DATA HUB Final

마블 퓨처파이트 개인 계정용 데이터 허브입니다.  
처음에는 엑셀 대체용으로 시작했지만, 현재 구조는 **개인 계정 기반 캐릭터 DB + ABX/ABL 조합 추천 + 대미지 계산기 + 통계/분석 + 향후 iOS 확장**을 염두에 둔 TypeScript 모노레포입니다.

이 프로젝트는 완성형 상용 서비스라기보다는, 혼자 쓰기 좋게 계속 키울 수 있는 **고급 스타터킷 / MVP 베이스**입니다.  
핵심 의도는 다음과 같습니다.

- 엑셀처럼 데이터를 직접 관리할 수 있어야 함
- 캐릭터, 유니폼, 아티팩트, 리더/패시브 효과를 DB화할 수 있어야 함
- 개인 계정 보유 캐릭터 상황을 반영해서 ABX / ABL 최적 조합을 뽑을 수 있어야 함
- PC 웹 대시보드와 모바일 세로 화면을 모두 고려해야 함
- 나중에 iOS 앱으로 확장하더라도 추천 로직과 타입을 재사용할 수 있어야 함

---

## 1. 빠른 실행

### 1-1. 준비물

PC에 아래가 설치되어 있어야 합니다.

- Node.js 20 LTS 이상 권장
- npm
- PowerShell 또는 터미널

압축을 푼 뒤 루트 폴더에서 실행합니다.

```powershell
cd C:\Users\tbdk5\Desktop\InBox\mff-data-hub-final
npm install
npm run dev
```

브라우저에서 엽니다.

```txt
http://127.0.0.1:3700
```

### 1-2. Windows 편의 실행

처음 한 번만 루트 폴더의 설치 파일을 실행합니다.

```txt
INSTALL_DEPENDENCIES_WINDOWS.bat
```

그 다음부터는 개발 서버 파일만 더블클릭하면 됩니다. 이 파일은 `npm install`을 다시 실행하지 않습니다.

```txt
START_DEV_WINDOWS.bat
```

### 1-3. 무설치 프리뷰

Next.js 개발 서버 없이 UI 느낌만 바로 보려면 루트의 파일을 더블클릭합니다.

```txt
OPEN_ME_FIRST.html
```

이건 **정적 HTML 미리보기**입니다. 실제 앱 기능, Supabase 연동, 추천 로직 전체가 도는 버전은 아닙니다. 진짜 개발/사용은 `npm install` 후 `npm run dev`로 실행하는 쪽입니다.

---

## 2. 기술스택

### 전체 구조

```txt
Next.js + React + TypeScript + Tailwind CSS
Supabase + PostgreSQL + Drizzle
공용 TypeScript 패키지 기반 Monorepo
향후 Expo iOS 앱 확장 준비
```

### 프론트엔드

- **Next.js 15**: PC 웹앱 / 대시보드 본체
- **React 19**: 컴포넌트 UI
- **TypeScript**: 캐릭터, 유니폼, 아티팩트, 추천 결과 타입 안정성
- **Tailwind CSS**: 카드형 대시보드, 사이드바, 모바일 반응형 UI
- **lucide-react**: 아이콘 라이브러리
- **Recharts**: 통계/차트 확장용
- **TanStack React Table**: 캐릭터 DB 고도화 시 테이블 기능 확장용
- **Zustand**: 앱 상태 관리 확장용
- **Zod**: 데이터 검증 확장용

현재 UI는 shadcn/ui를 직접 설치해서 쓰는 구조가 아니라, Tailwind 기반 커스텀 컴포넌트 위주로 구성되어 있습니다.

### 백엔드 / DB

- **Supabase**: 계정, DB, Storage, 관리 화면 용도
- **PostgreSQL**: 캐릭터/유니폼/아티팩트/기록 저장
- **Drizzle ORM / Drizzle Kit**: DB 스키마를 코드로 관리하기 위한 기반
- **Supabase Studio**: 직접 테이블 편집, CSV import/export, 데이터 검수용

### 데이터 수집 / 동기화

- **tsx**: TypeScript 스크립트 실행
- **cheerio**: HTML 파싱
- **THANO$VIB$ sync script**: `uniforms`, `artifacts`, `supports` 페이지에서 데이터 추출 시도

### 향후 iOS

- **Expo React Native shell** 포함
- `packages/core`, `packages/account`, `packages/types`를 모바일에서도 재사용하는 구조
- 지금 당장은 웹앱이 본체이고, 모바일 앱은 향후 확장을 위한 껍데기입니다.

---

## 3. 프로젝트 폴더 구조

```txt
mff-data-hub-final/
├─ apps/
│  ├─ web/                 # 실제 실행되는 Next.js 웹앱
│  └─ mobile/              # 향후 iOS용 Expo 앱 쉘
│
├─ packages/
│  ├─ types/               # 공용 타입 정의
│  ├─ core/                # 추천 엔진, 계산기, 조합 로직
│  ├─ account/             # 카드/X-소드/팀업 기반 계정 스펙 계산
│  ├─ db/                  # Drizzle DB 스키마
│  └─ data/                # 캐릭터 카탈로그, THANO$VIB$ sync
│
├─ supabase/
│  ├─ schema.sql           # Supabase SQL 스키마
│  └─ imports/             # sync 결과 CSV 저장 위치
│
├─ standalone/             # 무설치 HTML 프리뷰
├─ scripts/                # 루트 보조 스크립트
├─ package.json            # 루트 workspace 스크립트
├─ .env.example            # 환경변수 예시
├─ INSTALL_DEPENDENCIES_WINDOWS.bat # Windows 의존성 설치
├─ START_DEV_WINDOWS.bat   # Windows 개발 서버 빠른 실행
├─ SYNC_THANOSVIBS_WINDOWS.bat # Windows THANO$VIB$ 동기화
└─ README.md               # 이 문서
```

---

## 4. 핵심 기능 요약

### 4-1. PC 웹 대시보드

메인 대시보드는 흰색 기반 UI, 좌측 메뉴, 중앙 콘텐츠, 우측 캐릭터 상세 패널 구조입니다.

주요 영역:

- 오늘의 ABX / ABL 도전 조건
- 추천 캐릭터 카드
- 커스텀 ABX / ABL 조합 추천
- PVE / PVP TOP3 랭킹
- 월간 사용/계정 분석
- 캐릭터 상세 정보
- 장비 / C.T.P / 아티팩트 표시

### 4-2. 좌측 메뉴 구조

현재 사이드바는 다음 구조를 반영합니다.

```txt
계정정보
캐릭터정보

PVE
  - World Boss
  - ABL
  - ABX
  - Infinity Challenge

PVP
  - Team Battle Arena
  - 아더월드
  - 타임라인

통계/분석
내 기록
캐릭터가이드
티어리스트
캐릭터DB
계산기
커스텀 ABX/ABL 조합
```

실제 컴포넌트 위치:

```txt
apps/web/src/components/Sidebar.tsx
```

### 4-3. 오늘의 도전 조건

ABX와 ABL이 각각 별도 카드로 표시됩니다.

예상 표시 정보:

- 콘텐츠 종류: ABX / ABL
- 추천 타입: Combat / Blast / Speed / Universal
- 진영 제한: Hero / Villain / Any
- 성별 제한: Male / Female / Any
- 필수 태그 / 보너스 태그 / 금지 태그
- 메모

관련 파일:

```txt
apps/web/src/components/ChallengeCard.tsx
apps/web/src/lib/data.ts
packages/types/src/index.ts
```

### 4-4. PVE / PVP TOP3

기존 “보스별 추천 요약” 대신 아래 구조로 TOP3를 표시하도록 설계했습니다.

PVE:

```txt
인피니티 챌린지 TOP3
ABX TOP3
ABL TOP3
```

PVP:

```txt
Team Battle Arena TOP3
아더월드 TOP3
타임라인 TOP3
```

관련 로직:

```txt
packages/core/src/optimizer.ts
apps/web/src/components/Rankings.tsx
```

핵심 함수:

```ts
getModeTop3(characters)
getTopCharacters(content, characters, count)
```

### 4-5. 커스텀 ABX / ABL 조합 추천

개인 계정 상황을 반영해서 딜러, 리더, 서포터 조합을 뽑는 기능입니다.

입력 조건:

- 콘텐츠: ABX / ABL
- 타입: Combat / Blast / Speed / Universal / Any
- 진영: Hero / Villain / Any
- 성별: Male / Female / Any
- 태그: villain, hero, elemental, boss, support 등
- 보유 캐릭만 보기
- 유니폼 보유 여부 반영
- 안정적인 회전 선호

출력 결과:

- 추천 딜러
- 추천 리더
- 추천 서포터 1
- 추천 서포터 2
- 최종 점수
- 등급
- 점수 breakdown
- 추천 이유
- 업그레이드 힌트

관련 파일:

```txt
apps/web/src/components/CustomOptimizer.tsx
packages/core/src/optimizer.ts
packages/types/src/index.ts
```

핵심 함수:

```ts
optimizeTeams(input, characters, userRoster, account)
```

현재 추천식은 샘플 기반입니다. 실제 마퓨파 고점 메타를 100% 반영하려면 캐릭터별 점수, 유니폼 효과, 아티팩트, 버프 수치를 운영 데이터로 계속 보강해야 합니다.

### 4-6. 대미지 / 버퍼 효과 계산기

버퍼, 리더, 카드, 피어스, 보스 피해, 체인 히트, 속성 피해, Proc/Rage 배율을 합산해서 예상 배율과 예상 피해량을 계산합니다.

입력값 예시:

- 기본 공격력
- 카드 공격력
- 피어스
- 리더 공격력
- 빌런 대상 피해
- 영웅 대상 피해
- 보스 피해
- 체인 히트
- 속성 피해
- Proc / Rage 배율
- 치명타 피해

관련 파일:

```txt
apps/web/src/components/DamageCalculator.tsx
packages/core/src/optimizer.ts
```

핵심 함수:

```ts
calcDamage(input)
```

현재 계산식은 비교/가이드용 단순 모델입니다. 실제 인게임 공식은 숨겨진 보정, 스킬 계수, 방어력, 레벨 차이, 버프 중첩 방식, 보스 특수 보정 등에 따라 달라질 수 있습니다.

### 4-7. 캐릭터 DB Matrix

요청한 캐릭터 DB 구조를 반영한 화면입니다.

표 구조:

```txt
1열: 캐릭터 이미지 / 이름 / 타입 / 진영
2열: 아티팩트 정보
3열: 유니폼별 리더스킬 + 패시브스킬 + 유니폼 효과 총집합
4열: 적용 가능한 유니폼 목록
```

추가 기능:

- 캐릭터명 검색
- 타입 필터
- 진영 필터
- Matrix 보기 / Card 보기 전환
- 중복 id 제거 로직
- 이미지 로딩 실패 시 avatar fallback

관련 파일:

```txt
apps/web/src/components/EnhancedCharacterDB.tsx
packages/data/src/catalog.ts
```

중복 key 경고 대응:

- `catalogCharacters` 생성 단계에서 같은 캐릭터 id 병합
- 렌더링 직전 `dedupedFiltered`로 한 번 더 중복 제거

---

## 5. 데이터 구조

### 5-1. 앱 내부 샘플 데이터

현재 웹앱은 우선 `apps/web/src/lib/data.ts`의 샘플 계정/로스터와 `packages/data/src/catalog.ts`의 공용 카탈로그를 사용해서 돌아갑니다.

즉 Supabase를 아직 연결하지 않아도 화면은 뜹니다.

주요 파일:

```txt
apps/web/src/lib/data.ts          # 대시보드/추천용 샘플 데이터
packages/data/src/catalog.ts      # 캐릭터 DB matrix용 공용 카탈로그
```

### 5-2. 공용 타입

공용 타입은 여기 있습니다.

```txt
packages/types/src/index.ts
```

대표 타입:

```txt
Character
Uniform
Artifact
CharacterBuff
UserCharacter
UserAccount
ChallengeRule
CustomOptimizerInput
TeamRecommendation
DamageCalculatorInput
```

웹앱과 향후 iOS 앱이 같은 타입을 공유하도록 설계했습니다.

### 5-3. 공용 추천 엔진

추천 엔진과 계산기는 여기 있습니다.

```txt
packages/core/src/optimizer.ts
```

대표 함수:

```txt
getRosterItem
getCurrentUniform
getTierColor
optimizeTeams
getTopCharacters
getModeTop3
calcDamage
rosterCoverage
```

이 파일은 웹 UI에 종속되지 않습니다. 그래서 나중에 iOS 앱에서도 재사용할 수 있습니다.

---

## 6. Supabase DB 설계

Supabase용 SQL은 여기 있습니다.

```txt
supabase/schema.sql
```

DB 스키마의 TypeScript 기준은 `packages/db/src/schema.ts`이고, Supabase SQL Editor에 붙여 넣는 배포 스냅샷은 루트의 `supabase/schema.sql`만 유지합니다.

### 6-1. 핵심 테이블

#### `characters`

캐릭터 기본 정보.

```txt
id
name
portrait_url
combat_type
side
gender
species
tags
source
source_url
updated_at
```

#### `uniforms`

캐릭터별 유니폼.

```txt
id
character_id
name
acquisition
season
cost
release_update
release_date
source_url
```

`unique(character_id, name)` 제약이 있어서 같은 캐릭터의 같은 유니폼 중복 입력을 막습니다.

#### `artifacts`

캐릭터별 아티팩트.

```txt
id
character_id
name
exclusive_skill
pve_score
pvp_score
effects
acquisition
release_update
source_url
```

현재는 캐릭터당 하나의 전용 아티팩트를 기준으로 `unique(character_id)`가 걸려 있습니다.

#### `character_effects`

리더스킬, 패시브, 유니폼 효과, 아티팩트 전용 효과를 저장합니다.

```txt
id
character_id
uniform_id
source_kind
effect_name
magnitude
magnitude_text
restriction_text
raw_text
source_url
```

`source_kind` 예시:

```txt
Leadership
Tier-2 Passive
Tier-3 Passive
Tier-4 Passive
Uniform Effect
Artifact Exclusive Skill
Other
```

#### `user_characters`

개인 계정 보유 캐릭터 상태.

```txt
user_id
character_id
owned
tier
level
uniform_id
uniform_rank
artifact_id
artifact_stars
ctp
memo
updated_at
```

개인 계정 기반 추천 기능의 핵심 테이블입니다.

#### `daily_challenges`

ABX / ABL 오늘 조건.

```txt
id
challenge_date
content
label
recommended_type
required_alignment
required_gender
required_tags
bonus_tags
banned_tags
note
updated_at
```

#### `usage_logs`

사용 기록.

```txt
id
user_id
used_at
content
boss_or_mode
dealer_id
leader_id
support_1_id
support_2_id
score
memo
created_at
```

#### `calculator_presets`

계산기 프리셋 저장.

```txt
id
user_id
name
preset
created_at
updated_at
```

#### `raw_source_snapshots`

외부 데이터 수집 원본 보관용.

```txt
id
source_name
source_url
fetched_at
content_hash
payload
```

외부 사이트 구조가 바뀌었을 때 디버깅하거나, 과거 수집 결과를 보존하는 용도로 씁니다.

### 6-2. 관리용 View

```txt
v_character_db_matrix
```

캐릭터 DB Matrix 화면에 맞게 데이터를 합쳐서 볼 수 있는 View입니다.

포함 정보:

- 캐릭터 기본정보
- 유니폼 JSON 배열
- 아티팩트 JSON
- 리더/패시브/유니폼 효과 JSON 배열

DB 관리 화면에서 이 View를 보면 캐릭터별 전체 정보를 한 번에 검수하기 좋습니다.

### 6-3. RLS 정책

현재 SQL에는 RLS가 켜져 있습니다.

- 캐릭터/유니폼/아티팩트/효과/오늘 조건은 공개 read
- `user_characters`, `usage_logs`, `calculator_presets`는 본인 `auth.uid()` 기준으로만 접근

개인용이라도 Supabase를 쓰면 RLS는 켜두는 게 안전합니다.

---

## 7. Supabase 연결 방법

### 7-1. Supabase 프로젝트 만들기

1. Supabase에서 새 프로젝트 생성
2. SQL Editor 열기
3. `supabase/schema.sql` 전체 복사
4. 실행

### 7-2. 환경변수 설정

루트의 `.env.example`을 복사해서 `.env.local` 또는 환경에 맞는 파일로 만듭니다.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
THANOSVIBS_BASE_URL=https://thanosvibs.money
```

웹앱만 따로 실행할 때는 `apps/web/.env.example`도 참고합니다.

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

현재 UI는 로컬 샘플 데이터 위주라 Supabase 키가 없어도 화면 자체는 뜹니다. Supabase 연동 CRUD를 본격화하려면 환경변수와 DB 쿼리 코드를 더 연결해야 합니다.

### 7-3. Drizzle 명령

루트에서 사용합니다.

```powershell
npm run db:push
npm run db:studio
```

주의:

- `DATABASE_URL`이 정확해야 합니다.
- Supabase hosted DB에 직접 push할 경우 connection string을 Supabase에서 확인해야 합니다.
- 개인용이면 처음에는 Supabase SQL Editor로 `schema.sql` 실행하는 방식이 제일 단순합니다.

---

## 8. THANO$VIB$ 데이터 동기화

### 8-1. 실행 방법

루트에서 실행합니다.

```powershell
npm run sync:thanosvibs
```

또는 Windows 편의 스크립트:

```powershell
.\SYNC_THANOSVIBS_WINDOWS.bat
```

### 8-2. 동기화 대상

스크립트는 기본적으로 아래 페이지를 읽습니다.

```txt
https://thanosvibs.money/uniforms
https://thanosvibs.money/artifacts
https://thanosvibs.money/supports
```

환경변수로 base URL을 바꿀 수 있습니다.

```txt
THANOSVIBS_BASE_URL=https://thanosvibs.money
```

### 8-3. 생성 파일

성공 시 아래 파일들이 갱신됩니다.

```txt
packages/data/generated/thanosvibs.json
supabase/imports/characters.csv
supabase/imports/uniforms.csv
supabase/imports/artifacts.csv
supabase/imports/supports.csv
```

### 8-4. Debug HTML

동기화 시 페이지 원본 HTML도 저장합니다.

```txt
packages/data/generated/debug/uniforms.html
packages/data/generated/debug/artifacts.html
packages/data/generated/debug/supports.html
```

파싱 결과가 0개일 때는 이 HTML을 보고 파서를 고치면 됩니다.

### 8-5. `Done: { characters: 0, uniforms: 0, artifacts: 0, supports: 0 }`가 뜨는 경우

명령어 실행 자체는 된 겁니다. 하지만 실제 데이터 파싱은 실패한 상태입니다.

의미:

```txt
사이트 접속: 됨
파일 생성: 됨
데이터 추출: 실패
```

원인 후보:

- 사이트 HTML 구조가 변경됨
- 클라이언트 렌더링으로 인해 서버 HTML에 데이터가 충분히 안 들어있음
- 파서의 label 탐색 로직이 실제 텍스트 구조와 안 맞음
- Cloudflare, bot 방어, 압축 응답 등으로 원하는 HTML이 안 옴

확인할 파일:

```powershell
Get-Content .\packages\data\generated\thanosvibs.json
Get-Content .\supabase\imports\uniforms.csv -TotalCount 10
```

Debug HTML 확인:

```txt
packages/data/generated/debug/uniforms.html
packages/data/generated/debug/artifacts.html
packages/data/generated/debug/supports.html
```

정상이라면 CSV에 수십~수백 줄이 생겨야 합니다. 헤더만 있거나 JSON 배열이 비어 있으면 파서 수정이 필요합니다.

### 8-6. CSV를 Supabase에 넣는 방법

1. Supabase Studio 접속
2. Table Editor 열기
3. 대상 테이블 선택
4. Import CSV
5. `supabase/imports/*.csv` 선택

주의:

- `characters.csv`를 먼저 import해야 합니다.
- 그 다음 `uniforms.csv`, `artifacts.csv`, `supports.csv` 순서로 넣는 게 좋습니다.
- 현재 CSV 컬럼명과 DB 컬럼명이 1:1로 완전히 맞지 않는 부분이 있을 수 있으므로, 실제 운영 전에는 import mapping을 확인해야 합니다.

---

## 9. iOS 확장 구조

### 9-1. 왜 mobile 폴더가 있나

나중에 iOS 앱으로 확장할 때 처음부터 새로 만들지 않도록 Expo 앱 쉘을 넣어둔 구조입니다.

```txt
apps/mobile
```

현재 mobile은 실제 완성 앱이 아니라 향후 확장용 시작점입니다.

### 9-2. 왜 root workspace에 mobile을 안 넣었나

루트 `package.json`의 workspaces에는 현재 mobile이 빠져 있습니다.

```json
"workspaces": [
  "apps/web",
  "packages/types",
  "packages/core",
  "packages/account",
  "packages/db",
  "packages/data"
]
```

이유:

- Expo / React Native 의존성은 웹과 충돌하거나 설치가 무거울 수 있음
- 지금 당장 실행해야 하는 본체는 웹앱임
- 개인용 개발 단계에서는 mobile을 독립적으로 설치하는 게 안전함

### 9-3. 나중에 모바일 실행하기

iOS 앱을 실제로 만질 때:

```powershell
cd apps/mobile
npm install
npm run start
```

iOS 시뮬레이터 또는 실기기 테스트는 Expo 환경 세팅이 필요합니다.

### 9-4. iOS에서 재사용할 코드

웹과 모바일이 같이 쓰는 부분:

```txt
packages/types    # 타입
packages/core     # 추천엔진 / 계산기
packages/account  # 카드/X-소드/팀업 계정 스펙 계산
packages/data     # 기본 카탈로그 / sync 결과
```

따로 만들어야 하는 부분:

```txt
앱 화면 UI
모바일 네비게이션
터치/제스처 UX
Expo Router 화면 구성
```

즉, 추천 로직은 공유하고 UI만 모바일용으로 다시 짜는 구조입니다.

---

## 10. 주요 파일 설명

### 루트

#### `package.json`

모노레포 스크립트 관리.

주요 명령어:

```txt
npm run dev              # 웹앱 개발 서버 실행
npm run build            # 웹앱 빌드
npm run typecheck        # 타입 체크
npm run sync:thanosvibs  # 외부 데이터 sync
npm run db:push          # Drizzle DB push
npm run db:studio        # Drizzle Studio
npm run ios:note         # iOS 안내 메시지
```

#### `.env.example`

Supabase, DB, sync URL 환경변수 예시.

#### `drizzle.config.ts`

Drizzle 설정.

#### `INSTALL_DEPENDENCIES_WINDOWS.bat`

Windows에서 의존성만 설치하는 편의 파일.

#### `START_DEV_WINDOWS.bat`

Windows에서 `npm install` 없이 개발 서버만 빠르게 실행하는 편의 파일.

#### `SYNC_THANOSVIBS_WINDOWS.bat`

Windows에서 `npm install` 없이 THANO$VIB$ 데이터만 동기화하는 편의 파일.

---

### `apps/web`

실제 웹앱입니다.

#### `apps/web/src/app/page.tsx`

메인 페이지입니다.  
현재는 URL route를 여러 개로 나누기보다, `section` 상태로 화면을 전환합니다.

섹션 값:

```txt
dashboard
custom
db
calculator
analysis
record
guide
tier
```

#### `apps/web/src/components/Sidebar.tsx`

좌측 메뉴.

#### `apps/web/src/components/ChallengeCard.tsx`

ABX / ABL 오늘 조건 카드.

#### `apps/web/src/components/CharacterCard.tsx`

추천 캐릭터 카드.

#### `apps/web/src/components/CharacterDetail.tsx`

우측 캐릭터 상세 패널.

#### `apps/web/src/components/CustomOptimizer.tsx`

커스텀 ABX / ABL 조합 추천 화면.

#### `apps/web/src/components/DamageCalculator.tsx`

대미지 계산기.

#### `apps/web/src/components/EnhancedCharacterDB.tsx`

고도화 캐릭터 DB Matrix.

#### `apps/web/src/components/Rankings.tsx`

PVE / PVP TOP3.

#### `apps/web/src/components/AccountInsights.tsx`

계정 분석, 사용 통계, 데이터 소스 패널.

#### `apps/web/src/components/MobileNav.tsx`

모바일 하단 네비게이션.

---

### `packages/types`

공용 TypeScript 타입.

이 패키지는 웹과 모바일, core가 같이 씁니다.

---

### `packages/core`

UI와 분리된 순수 로직.

주요 책임:

- 조건 점수 계산
- 계정 보유 상태 점수 계산
- 장비/아티팩트 점수 계산
- 리더/서포터 효과 점수 계산
- 팀 조합 추천
- TOP3 산출
- 대미지 계산
- 계정 커버리지 계산

---

### `packages/account`

UI와 분리된 계정 스펙 도메인 로직.

주요 책임:

- 카드 스탯 합산
- X-소드 스탯 합산
- 팀업 기반 공격력 보너스 계산
- 계정 전체 스펙 요약

---

### `packages/db`

Drizzle용 DB schema.

Supabase SQL과 함께 DB 구조를 코드로 관리하기 위한 위치입니다.

---

### `packages/data`

데이터 카탈로그와 동기화 스크립트.

```txt
packages/data/src/catalog.ts
packages/data/scripts/thanosvibs-sync.ts
packages/data/generated/thanosvibs.json
```

---

## 11. 개발 명령어 모음

### 설치

```powershell
npm install
```

### 웹 실행

```powershell
npm run dev
```

### 웹만 명시 실행

```powershell
npm run dev:web
```

### 빌드

```powershell
npm run build
```

### 프로덕션 실행

```powershell
npm run start
```

빌드 후 실행해야 합니다.

```powershell
npm run build
npm run start
```

### 타입 체크

```powershell
npm run typecheck
```

### 외부 데이터 동기화

```powershell
npm run sync:thanosvibs
```

### Drizzle DB push

```powershell
npm run db:push
```

### Drizzle Studio

```powershell
npm run db:studio
```

---

## 12. 자주 나는 에러 / 해결법

### 12-1. `'next' is not recognized`

원인:

```txt
npm install을 안 했거나 node_modules가 없음
```

해결:

```powershell
npm install
npm run dev
```

### 12-2. 포트가 이미 사용 중이거나 Windows에서 제외됨

해결 1: 기존 dev 서버 종료

```powershell
Ctrl + C
```

해결 2: 다른 포트로 실행

```powershell
cd apps/web
npx next dev --hostname 127.0.0.1 -p 3700
```

### 12-3. React key 중복 경고

예전 버전에서 `adamwarlock` 같은 id 중복으로 경고가 날 수 있었습니다.

```txt
Encountered two children with the same key
```

현재 버전은 다음 방식으로 대응했습니다.

- 카탈로그 병합 단계에서 같은 id 병합
- 렌더링 직전 dedupe

그래도 뜨면 `packages/data/src/catalog.ts`에서 같은 id가 중복으로 들어갔는지 확인합니다.

### 12-4. 이미지가 안 뜸

이미지는 기본적으로 아래 형태를 사용합니다.

```txt
https://thanosvibs.money/static/assets/portraits/{slug}.png
```

이미지 실패 시 UI avatar fallback으로 대체됩니다.

원인 후보:

- 캐릭터 slug 불일치
- 외부 사이트 이미지 경로 변경
- 네트워크 문제
- 특정 캐릭터 이미지 파일명 예외

### 12-5. sync 결과가 0개

위 8번 참고.  
명령어는 성공했지만 파싱이 실패한 상태입니다.

### 12-6. Supabase 연결이 안 됨

확인할 것:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
schema.sql 실행 여부
RLS 정책
```

현재 앱은 로컬 샘플 데이터 기반으로 화면이 뜨므로, Supabase 연결 실패가 곧바로 전체 앱 먹통을 의미하지는 않습니다.

### 12-7. `npm install`이 너무 오래 걸림

정상일 수 있습니다. Next.js, React, Drizzle, Cheerio 등이 설치됩니다.

문제가 계속되면:

```powershell
npm cache verify
npm install
```

그래도 안 되면 Node.js 20 LTS를 다시 설치하는 게 빠릅니다.

---

## 13. 현재 한계

솔직히 현재 버전은 “실사용 가능한 UI 프로토타입 + 확장 구조”에 가깝습니다.

아직 보강이 필요한 부분:

```txt
1. THANO$VIB$ 파서가 사이트 구조 변화에 취약함
2. 전체 캐릭터 실데이터가 완전히 자동 검수된 상태는 아님
3. Supabase CRUD 화면이 아직 본격 구현 전
4. Auth 로그인 플로우가 완성되어 있지 않음
5. 추천 알고리즘은 샘플 점수 기반이라 메타 검수가 필요함
6. 실제 인게임 대미지 공식과 계산기가 완전히 같지는 않음
7. iOS 앱은 현재 쉘 단계임
8. 캐릭터 DB Matrix는 TanStack Table 완전 기능까지는 아직 미적용
```

즉, 지금은 다음 단계로 가기 위한 뼈대가 잘 잡힌 상태입니다.

---

## 14. 추천 개발 순서

### 1단계: 웹앱 안정화

```txt
npm install
npm run dev
```

으로 앱이 잘 뜨는지 확인합니다.

### 2단계: 캐릭터 DB 실데이터 보강

우선은 수동 보강 데이터는 `packages/data/src/catalog.ts`에 추가하고, 운영 데이터는 Supabase 테이블에 직접 입력합니다.

추천 순서:

```txt
characters
uniforms
artifacts
character_effects
```

### 3단계: sync 파서 수리

`npm run sync:thanosvibs` 결과가 0개면 debug HTML을 기준으로 `packages/data/scripts/thanosvibs-sync.ts`를 수정합니다.

### 4단계: Supabase CRUD 연결

화면에서 직접 캐릭터/유니폼/아티팩트 수정 가능하게 만듭니다.

우선순위:

```txt
캐릭터 수정
유니폼 추가/수정
아티팩트 추가/수정
리더/패시브 효과 추가/수정
내 계정 보유 캐릭 설정
```

### 5단계: ABX / ABL 추천 정확도 보강

실제 메타 기준으로 캐릭터 점수와 버프 효과를 조정합니다.

보강할 데이터:

```txt
콘텐츠별 딜러 점수
리더 효율
서포터 효율
C.T.P 추천
아티팩트 우선도
회전 난이도
보유 유니폼 기준 성능 차이
```

### 6단계: 사용 기록 / 분석 완성

`usage_logs`를 연결해서 실제 사용 이력을 쌓고, 월간 통계를 만듭니다.

### 7단계: iOS 앱 확장

웹앱 구조가 안정된 뒤 `apps/mobile`을 본격적으로 구현합니다.

---

## 15. 코드 수정 가이드

### 좌측 메뉴 추가/수정

```txt
apps/web/src/components/Sidebar.tsx
apps/web/src/app/page.tsx
```

`Section` 타입에 새 섹션을 추가하고, Sidebar 버튼과 page 렌더링 조건을 추가합니다.

### 추천 로직 수정

```txt
packages/core/src/optimizer.ts
```

주로 수정할 함수:

```txt
conditionScore
accountScore
gearScore
helperScore
optimizeTeams
```

### 대미지 계산식 수정

```txt
packages/core/src/optimizer.ts
```

함수:

```ts
calcDamage(input)
```

### 캐릭터 DB 표시 방식 수정

```txt
apps/web/src/components/EnhancedCharacterDB.tsx
```

### 캐릭터 카탈로그 데이터 수정

```txt
packages/data/src/catalog.ts
```

### DB 스키마 수정

```txt
supabase/schema.sql
packages/db/src/schema.ts
```

SQL과 Drizzle schema를 같이 맞추는 게 좋습니다.

---

## 16. 데이터 관리 방식 추천

개인용이라면 가장 현실적인 관리 방식은 이겁니다.

### 초기 단계

```txt
로컬 TS 데이터 직접 수정
```

장점:

- 빠름
- 바로 UI에 반영
- Supabase 세팅 없어도 됨

단점:

- 데이터가 많아지면 불편함

### 중간 단계

```txt
CSV import/export + Supabase Studio
```

장점:

- 엑셀처럼 관리 가능
- 대량 수정 편함
- 앱과 DB 연결 준비 가능

### 장기 단계

```txt
앱 안에 관리자 화면 추가
```

장점:

- 캐릭터, 유니폼, 아티팩트, 효과를 웹에서 직접 수정
- 실사용 앱에 가까워짐

추천 최종 구조:

```txt
데이터 원장: Supabase
수집/백업: CSV
화면/추천: Next.js
iOS: Expo
공통 로직: packages/core, packages/account
```

---

## 17. 운영 메모

이 앱은 공개 서비스보다는 개인용에 맞춰져 있습니다.  
그래서 대규모 트래픽, 권한 관리, 결제, 서버 큐 같은 건 일부러 과하게 넣지 않았습니다.

개인용 기준으로 중요한 건 다음입니다.

```txt
관리 편함
데이터 구조 명확함
나중에 iOS로 확장 가능함
추천 로직 재사용 가능함
엑셀보다 UI가 좋음
```

현재 구조는 이 목적에 맞춰 설계되어 있습니다.

---

## 18. 라이선스 / 외부 데이터 주의

이 프로젝트는 개인용 도구 성격입니다.

THANO$VIB$ 데이터, 게임 관련 이미지, 캐릭터명, 유니폼명 등은 각 원천 사이트/게임/권리자의 정책을 확인하고 개인 사용 범위에서 조심해서 다루는 게 좋습니다.

앱을 공개 배포하거나 상업적으로 운영하려면 외부 데이터 사용권과 이미지 권리를 별도로 확인해야 합니다.

---

## 19. 한 줄 요약

이 프로젝트는 **마퓨파 개인 계정 기준으로 캐릭터 DB를 관리하고, ABX/ABL/PVE/PVP 추천과 계산, 통계까지 처리하기 위한 Next.js + Supabase 기반 개인용 데이터 허브**입니다.

지금 당장은 웹앱이 본체고, 나중에 iOS 앱을 붙일 수 있도록 핵심 로직과 타입을 `packages`로 분리해 둔 구조입니다.
