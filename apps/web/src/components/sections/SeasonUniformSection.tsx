'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027] as const;

type Year = (typeof years)[number];
type Gender = '여성' | '남성';
type SeasonName = '봄' | '여름' | '할로윈' | '홀리데이';

type SeasonHero = {
  name: string;
  imageUrl: string;
};

type SeasonRow = {
  gender: Gender;
  heroes: Partial<Record<Year, SeasonHero>>;
};

type SeasonBlock = {
  name: SeasonName;
  className: string;
  rows: SeasonRow[];
};

type RecommendationRow = {
  season: SeasonName;
  gender: Gender;
  heroes: SeasonHero[];
};

const portrait = (slug: string) => `/mff-assets/characters/${slug}.webp`;
const hero = (name: string, slug: string): SeasonHero => ({ name, imageUrl: portrait(slug) });

const seasonStyles: Record<SeasonName, string> = {
  봄: 'bg-[#fff2cc] text-slate-950',
  여름: 'bg-[#ffd700] text-slate-950',
  할로윈: 'bg-[#ff7f32] text-slate-950',
  홀리데이: 'bg-[#6384d9] text-slate-950',
};

const seasonUniforms: SeasonBlock[] = [
  {
    name: '봄',
    className: seasonStyles.봄,
    rows: [
      {
        gender: '여성',
        heroes: {
          2022: hero('그웬풀', 'gwenpool4'),
          2023: hero('스쿼럴 걸', 'squirrelgirl2'),
          2024: hero('사타나', 'satana2'),
          2025: hero('크레센트', 'crescent3'),
          2026: hero('크리스탈', 'crystal3'),
        },
      },
      {
        gender: '남성',
        heroes: {
          2022: hero('데드풀', 'deadpool7'),
          2023: hero('타노스', 'thanos6'),
          2024: hero('엔젤', 'angel3'),
          2025: hero('에인션트 원', 'ancientone3'),
          2026: hero('스트라이프', 'stryfe2'),
        },
      },
    ],
  },
  {
    name: '여름',
    className: seasonStyles.여름,
    rows: [
      {
        gender: '여성',
        heroes: {
          2020: hero('인챈트리스', 'enchantress2'),
          2021: hero('실크', 'silk2'),
          2022: hero('스톰', 'storm5'),
          2023: hero('루나 스노우', 'lunasnow5'),
          2024: hero('사일록', 'psylocke4'),
          2025: hero('엠마 프로스트', 'emmafrost4'),
        },
      },
      {
        gender: '남성',
        heroes: {
          2020: hero('케이블', 'cable5'),
          2021: hero('퀵실버', 'quicksilver4'),
          2022: hero('아이스맨', 'iceman2'),
          2023: hero('미스테리오', 'mysterio2'),
          2024: hero('온두', 'yondu3'),
          2025: hero('그루트', 'groot6'),
        },
      },
    ],
  },
  {
    name: '할로윈',
    className: seasonStyles.할로윈,
    rows: [
      {
        gender: '여성',
        heroes: {
          2022: hero('모건 르 페이', 'morganlefay1'),
          2023: hero('신', 'sin1'),
          2024: hero('웨폰 헥스', 'weaponhex1'),
          2025: hero('메두사', 'medusa3'),
        },
      },
      {
        gender: '남성',
        heroes: {
          2022: hero('블랙 볼트', 'blackbolt4'),
          2023: hero('고스트 라이더', 'ghostrider5'),
          2024: hero('어보미네이션', 'abomination1'),
          2025: hero('마일즈 모랄레스', 'milesmorales5'),
        },
      },
    ],
  },
  {
    name: '홀리데이',
    className: seasonStyles.홀리데이,
    rows: [
      {
        gender: '여성',
        heroes: {
          2019: hero('그웬풀', 'gwenpool4'),
          2020: hero('화이트 폭스', 'whitefox2'),
          2021: hero('블랙 캣', 'blackcat3'),
          2022: hero('매직', 'magik3'),
          2023: hero('로그', 'rogue4'),
          2024: hero('샤론 로저스', 'sharonrogers6'),
          2025: hero('매들린 프라이어', 'madelynepryor1'),
        },
      },
      {
        gender: '남성',
        heroes: {
          2019: hero('데드풀', 'deadpool'),
          2020: hero('그루트', 'groot6'),
          2021: hero('킹핀', 'kingpin3'),
          2022: hero('매그니토', 'magneto3'),
          2023: hero('필 콜슨', 'philcoulson2'),
          2024: hero('갬빗', 'gambit2'),
          2025: hero('스칼렛 스파이더', 'scarletspider2'),
        },
      },
    ],
  },
];

const pvpRecommendations: RecommendationRow[] = [
  { season: '봄', gender: '남성', heroes: [hero('스트라이프', 'stryfe2'), hero('엔젤', 'angel3')] },
  { season: '여름', gender: '여성', heroes: [hero('엠마 프로스트', 'emmafrost4')] },
  { season: '할로윈', gender: '여성', heroes: [hero('웨폰 헥스', 'weaponhex1')] },
  { season: '홀리데이', gender: '여성', heroes: [hero('매들린 프라이어', 'madelynepryor1')] },
];

const pveRecommendations: RecommendationRow[] = [
  { season: '봄', gender: '여성', heroes: [hero('사타나', 'satana2'), hero('크레센트', 'crescent3'), hero('크리스탈', 'crystal3')] },
  { season: '봄', gender: '남성', heroes: [hero('에인션트 원', 'ancientone3')] },
  { season: '여름', gender: '남성', heroes: [hero('온두', 'yondu3'), hero('미스테리오', 'mysterio2')] },
  { season: '할로윈', gender: '여성', heroes: [hero('신', 'sin1'), hero('모건 르 페이', 'morganlefay1'), hero('메두사', 'medusa3')] },
  { season: '할로윈', gender: '남성', heroes: [hero('마일즈 모랄레스', 'milesmorales5'), hero('어보미네이션', 'abomination1')] },
  { season: '홀리데이', gender: '여성', heroes: [hero('화이트 폭스', 'whitefox2'), hero('블랙 캣', 'blackcat3'), hero('로그', 'rogue4')] },
  { season: '홀리데이', gender: '남성', heroes: [hero('필 콜슨', 'philcoulson2'), hero('스칼렛 스파이더', 'scarletspider2'), hero('갬빗', 'gambit2')] },
];

const totalUniforms = seasonUniforms.reduce(
  (count, season) => count + season.rows.reduce((rowCount, row) => rowCount + Object.keys(row.heroes).length, 0),
  0,
);

const seasonUniformOwnershipStorageKey = 'mff-data-hub:season-uniform-ownership:v1';

const getSeasonUniformKey = (season: SeasonName, gender: Gender, year: Year, character: SeasonHero) =>
  `${season}:${gender}:${year}:${character.name}`;

const seasonUniformKeySet = new Set(
  seasonUniforms.flatMap((season) =>
    season.rows.flatMap((row) =>
      years.flatMap((year) => {
        const character = row.heroes[year];

        return character ? [getSeasonUniformKey(season.name, row.gender, year, character)] : [];
      }),
    ),
  ),
);

function HeroTile({
  hero: character,
  dense = false,
  owned = false,
  ownedKey,
  onToggleOwned,
}: {
  hero?: SeasonHero;
  dense?: boolean;
  owned?: boolean;
  ownedKey?: string;
  onToggleOwned?: (key: string) => void;
}) {
  if (!character) {
    return <div className={dense ? 'min-h-[78px]' : 'min-h-[112px]'} />;
  }

  const ownedControl =
    ownedKey && onToggleOwned ? (
      <label
        className={`mt-1 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border px-1 py-1 text-[10px] font-black leading-none ${
          owned ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <input
          type="checkbox"
          checked={owned}
          onChange={() => onToggleOwned(ownedKey)}
          data-testid={`season-owned-${ownedKey}`}
          aria-label={`${character.name} 시즌 유니폼 ${owned ? '보유' : '미보유'}`}
          className="h-3 w-3 shrink-0 accent-emerald-600"
        />
        <span>{owned ? '보유' : '미보유'}</span>
      </label>
    ) : null;

  return (
    <div className={`mx-auto flex h-full flex-col items-center justify-start ${dense ? 'min-h-[78px] w-[66px]' : 'min-h-[112px] w-[82px]'}`}>
      <div className={`relative shrink-0 overflow-hidden border border-slate-950 bg-slate-100 ${dense ? 'h-[54px] w-[54px]' : 'h-[60px] w-[60px]'}`}>
        <Image src={character.imageUrl} alt={character.name} fill sizes={dense ? '54px' : '60px'} unoptimized className="object-cover" />
      </div>
      <p className={`mt-1 w-full break-keep text-center font-semibold leading-tight text-slate-950 ${dense ? 'text-[11px]' : 'text-[12px]'}`}>{character.name}</p>
      {ownedControl}
    </div>
  );
}

function SeasonMatrix({ ownedUniformKeys, onToggleOwned }: { ownedUniformKeys: ReadonlySet<string>; onToggleOwned: (key: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-900 bg-white shadow-sm" data-testid="season-uniform-matrix">
      <table className="min-w-[1030px] table-fixed border-collapse text-center">
        <thead>
          <tr className="bg-[#c9c9c9] text-[12px] font-black text-slate-950">
            <th className="h-[66px] w-[120px] border-2 border-slate-950">시즌</th>
            <th className="h-[66px] w-[64px] border-2 border-slate-950">성별</th>
            {years.map((year) => (
              <th key={year} className="h-[66px] w-[92px] border-2 border-slate-950">
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {seasonUniforms.map((season) =>
            season.rows.map((row, rowIndex) => (
              <tr key={`${season.name}-${row.gender}`} className="align-middle">
                {rowIndex === 0 ? (
                  <th rowSpan={season.rows.length} className={`w-[120px] border-2 border-slate-950 text-3xl font-black ${season.className}`}>
                    {season.name}
                  </th>
                ) : null}
                <th className="w-[64px] border-2 border-slate-950 bg-[#c9c9c9] text-[13px] font-semibold text-slate-950">{row.gender}</th>
                {years.map((year) => {
                  const character = row.heroes[year];
                  const ownedKey = character ? getSeasonUniformKey(season.name, row.gender, year, character) : undefined;

                  return (
                    <td key={`${season.name}-${row.gender}-${year}`} className="h-[122px] w-[92px] border border-slate-950 p-1 align-top">
                      <HeroTile hero={character} owned={ownedKey ? ownedUniformKeys.has(ownedKey) : false} ownedKey={ownedKey} onToggleOwned={onToggleOwned} />
                    </td>
                  );
                })}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

function RecommendationTable({ title, titleClassName, rows }: { title: string; titleClassName: string; rows: RecommendationRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-900 bg-white shadow-sm">
      <table className="min-w-[380px] table-fixed border-collapse text-center">
        <thead>
          <tr>
            <th colSpan={3} className={`h-[58px] border-2 border-slate-950 bg-[#fff600] text-xl font-black ${titleClassName}`}>
              {title}
            </th>
          </tr>
          <tr className="bg-[#c9c9c9] text-[12px] font-black text-slate-950">
            <th className="w-[88px] border-2 border-slate-950 py-2">시즌</th>
            <th className="w-[64px] border-2 border-slate-950 py-2">성별</th>
            <th className="border-2 border-slate-950 py-2">캐릭터</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${title}-${row.season}-${row.gender}`} className="align-middle">
              <th className={`border-2 border-slate-950 px-2 py-2 text-lg font-black ${seasonStyles[row.season]}`}>{row.season}</th>
              <td className="border-2 border-slate-950 bg-[#c9c9c9] px-2 py-2 text-[13px] font-semibold text-slate-950">{row.gender}</td>
              <td className="border border-slate-950 px-2 py-2">
                <div className="flex min-h-[78px] flex-wrap items-start justify-center gap-2">
                  {row.heroes.map((character) => (
                    <HeroTile key={`${row.season}-${row.gender}-${character.name}`} hero={character} dense />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SeasonUniformSection() {
  const [ownedUniformKeys, setOwnedUniformKeys] = useState<Set<string>>(() => new Set());
  const [ownershipReady, setOwnershipReady] = useState(false);
  const ownedUniformCount = ownedUniformKeys.size;
  const missingUniformCount = Math.max(totalUniforms - ownedUniformCount, 0);

  useEffect(() => {
    try {
      const storedKeys = window.localStorage.getItem(seasonUniformOwnershipStorageKey);
      const parsedKeys: unknown = storedKeys ? JSON.parse(storedKeys) : [];

      if (Array.isArray(parsedKeys)) {
        setOwnedUniformKeys(new Set(parsedKeys.filter((key): key is string => typeof key === 'string' && seasonUniformKeySet.has(key))));
      }
    } catch {
      setOwnedUniformKeys(new Set());
    } finally {
      setOwnershipReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ownershipReady) {
      return;
    }

    window.localStorage.setItem(seasonUniformOwnershipStorageKey, JSON.stringify([...ownedUniformKeys]));
  }, [ownedUniformKeys, ownershipReady]);

  const toggleOwnedUniform = (key: string) => {
    setOwnedUniformKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }

      return nextKeys;
    });
  };

  return (
    <section className="space-y-5" data-testid="season-uniform-page">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Season Uniforms</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">시즌 유니폼</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-black">
            <span className="rounded-md bg-slate-950 px-3 py-2 text-white">2019-2027</span>
            <span className="rounded-md bg-blue-50 px-3 py-2 text-blue-700">총 {totalUniforms}종</span>
            <span className="rounded-md bg-red-50 px-3 py-2 text-red-600">PVP 추천 {pvpRecommendations.reduce((sum, row) => sum + row.heroes.length, 0)}명</span>
            <span className="rounded-md bg-blue-50 px-3 py-2 text-blue-700">PVE 추천 {pveRecommendations.reduce((sum, row) => sum + row.heroes.length, 0)}명</span>
            <span className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">보유 {ownedUniformCount}종</span>
            <span className="rounded-md bg-slate-100 px-3 py-2 text-slate-600">미보유 {missingUniformCount}종</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]">
        <SeasonMatrix ownedUniformKeys={ownedUniformKeys} onToggleOwned={toggleOwnedUniform} />
        <div className="grid content-start gap-5" data-testid="season-recommendations">
          <RecommendationTable title="PVP 추천" titleClassName="text-red-600" rows={pvpRecommendations} />
          <RecommendationTable title="PVE 추천" titleClassName="text-blue-700" rows={pveRecommendations} />
        </div>
      </div>
    </section>
  );
}
