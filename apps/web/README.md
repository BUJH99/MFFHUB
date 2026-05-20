# MFF DATA HUB - Character DB Matrix Edition

Next.js + Supabase + TypeScript + Tailwind 기반 마퓨파 개인 계정용 데이터 허브.

이번 버전 핵심:

- 전체 캐릭터 DB 매트릭스 화면 추가
- 요청한 열 구조 반영
  - 1열: 캐릭터 이미지 / 이름 / 타입 / 진영
  - 2열: 캐릭터별 아티팩트
  - 3열: 해당 캐릭터의 유니폼별 리더스킬 + 패시브스킬 + 유니폼 효과 총집합
  - 4열: 해당 캐릭터에 적용 가능한 유니폼 목록
- THANO$VIB$ 참고 페이지 기반 sync adapter 추가
  - `https://thanosvibs.money/uniforms`
  - `https://thanosvibs.money/artifacts`
  - `https://thanosvibs.money/supports`
- 관리 편하게 Supabase SQL + Drizzle schema 동시 제공
- Supabase 관리용 view: `v_character_db_matrix`
- CSV export: `supabase/imports/*.csv`

## 실행

```powershell
npm install
npm run dev
```

브라우저:

```txt
http://127.0.0.1:3600
```

## THANO$VIB$ 데이터 동기화

```powershell
npm run sync:thanosvibs
```

성공하면 생성됨:

```txt
packages/data/generated/thanosvibs.json
supabase/imports/characters.csv
supabase/imports/uniforms.csv
supabase/imports/artifacts.csv
supabase/imports/supports.csv
```

주의: 사이트 HTML 구조가 바뀌면 parser도 같이 손봐야 함. 그래서 원천 스냅샷 + CSV + Supabase 정규화 구조로 뺐음.

## DB 관리 추천

가장 편한 순서:

1. Supabase Table Editor에서 직접 수정
2. 루트 `supabase/schema.sql`로 테이블 생성
3. `npm run sync:thanosvibs`로 CSV 생성
4. Supabase Table Editor의 CSV import로 적재
5. `v_character_db_matrix` view로 앱 화면에 붙이기

Drizzle을 쓰고 싶으면:

```powershell
$env:DATABASE_URL="postgresql://..."
npm run db:push
npm run db:studio
```

## 참고

현재 앱 화면에는 seed 데이터가 들어있고, 모든 실데이터는 sync adapter로 갱신하는 구조임. 실제 운영용으로는 사이트 데이터를 동기화한 뒤, 패치별 메타/캐릭 점수/계정 보유 상태를 Supabase에서 관리하면 됨.
