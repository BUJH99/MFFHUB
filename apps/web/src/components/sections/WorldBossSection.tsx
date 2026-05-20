'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { catalogCharacters, type CatalogCharacter, type CatalogUniform, worldBosses, type WorldBoss, type WorldBossStageRule } from '@mff-data-hub/data';

const noRestrictionIcon = 'https://thanosvibs.money/static/attributes/nores.png';
const customPicksStorageKey = 'mff-data-hub:world-boss-stage-picks:v2';
const knownRestrictionLabels = new Set([
  'Agility',
  'Alien',
  'Blast',
  'Combat',
  'Command',
  'Durability',
  'Energy Projection',
  'Fast Movement',
  'Female',
  'Healing',
  'Hero',
  'Human',
  'Leadership',
  'Machine',
  'Magic',
  'Male',
  'Mutant',
  'Pure Evil',
  'Speed',
  'Strong',
  'Universal',
  'Villain',
  'Weapons Master',
]);

type StagePick = {
  id: string;
  characterId: string;
  characterName: string;
  characterImageUrl: string;
  uniformName: string;
  uniformImageUrl?: string;
};
type StagePickStore = Record<string, StagePick[]>;
type PickerState = {
  stageKey: string;
  bossName: string;
  stage: WorldBossStageRule;
} | null;
type UniformOption = {
  key: string;
  character: CatalogCharacter;
  uniform: CatalogUniform;
};
type CharacterOption = {
  key: string;
  character: CatalogCharacter;
  uniforms: CatalogUniform[];
};

function makeStageKey(bossId: string, stageRange: string) {
  return `${bossId}:${stageRange}`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

function displayRestrictionLabel(label: string) {
  return knownRestrictionLabels.has(label) ? label : label.replace(/_/g, ' ');
}

function characterMatchesRestriction(character: CatalogCharacter, label: string) {
  const normalizedLabel = normalizeText(label);
  if (!normalizedLabel) return true;
  const acceptedLabels = normalizedLabel === 'weaponsmaster' ? [normalizedLabel, 'weaponmaster'] : [normalizedLabel];

  if (acceptedLabels.includes(normalizeText(character.type))) return true;
  if (acceptedLabels.includes(normalizeText(character.side))) return true;
  return character.tags.some((tag) => acceptedLabels.includes(normalizeText(tag.replace(/^Gender:/, '').replace(/^Species:/, ''))));
}

function uniformMatchesRestriction(character: CatalogCharacter, uniform: CatalogUniform, label: string) {
  if (characterMatchesRestriction(character, label)) return true;

  const normalizedLabel = normalizeText(label);
  const acceptedLabels = normalizedLabel === 'weaponsmaster' ? [normalizedLabel, 'weaponmaster'] : [normalizedLabel];
  const uniformWithTags = uniform as CatalogUniform & {
    gender?: string;
    side?: string;
    species?: string;
    tags?: string[];
    type?: string;
  };
  const uniformLabels = [
    uniformWithTags.type,
    uniformWithTags.side,
    uniformWithTags.gender,
    uniformWithTags.species,
    ...(uniformWithTags.tags ?? []),
  ];

  return uniformLabels.some((value) => value ? acceptedLabels.includes(normalizeText(value.replace(/^Gender:/, '').replace(/^Species:/, ''))) : false);
}

function uniformMatchesStage(character: CatalogCharacter, uniform: CatalogUniform, stage: WorldBossStageRule) {
  return stage.restrictions.every((restriction) => uniformMatchesRestriction(character, uniform, restriction.label));
}

function toCharacterOptionSearchText(option: CharacterOption) {
  return [
    option.character.name,
    option.character.type,
    option.character.side,
    option.character.tags.join(' '),
  ].join(' ').toLowerCase();
}

function getCharacterOptions(stage: WorldBossStageRule): CharacterOption[] {
  return catalogCharacters
    .map((character) => ({
      key: character.id,
      character,
      uniforms: character.uniforms.filter((uniform) => uniformMatchesStage(character, uniform, stage)),
    }))
    .filter((option) => option.uniforms.length > 0);
}

function readStoredPicks(): StagePickStore {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(customPicksStorageKey) ?? '{}') as StagePickStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function stagePickFromOption(option: UniformOption): StagePick {
  return {
    id: `${option.character.id}:${option.uniform.name}:${Date.now()}`,
    characterId: option.character.id,
    characterName: option.character.name,
    characterImageUrl: option.character.imageUrl,
    uniformName: option.uniform.name,
    uniformImageUrl: option.uniform.imageUrl,
  };
}

function imageFallback(e: React.SyntheticEvent<HTMLImageElement>, label: string) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=ede9fe&color=6d28d9&bold=true`;
}

function BossButton({ boss, active, onClick }: { boss: WorldBoss; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group flex min-h-[96px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50'
      }`}
    >
      <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-200">
        <Image src={boss.portraitUrl} alt={boss.name} width={64} height={64} unoptimized className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-950">{boss.name}</span>
        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${boss.mode === 'Legend+' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-blue-100 text-blue-700'}`}>
          {boss.mode}
        </span>
      </span>
    </button>
  );
}

function UnlockStrip({ boss }: { boss: WorldBoss }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">층 해금</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">10-90</span>
      </div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5 xl:grid-cols-9">
        {boss.unlocks.map((unlock) => (
          <div key={`${boss.id}-${unlock.stage}`} className="grid place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="mb-2 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{unlock.stage}</span>
            <Image src={unlock.portraitUrl} alt={unlock.character} title={unlock.character} width={58} height={58} unoptimized className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RestrictionIcons({ stage }: { stage: WorldBossStageRule }) {
  const restrictions = stage.restrictions.length
    ? stage.restrictions
    : [{ label: 'No Restrictions', iconUrl: noRestrictionIcon }];

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {restrictions.map((restriction) => (
        <span key={`${stage.range}-${restriction.label}`} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 p-1.5 ring-1 ring-slate-200" title={displayRestrictionLabel(restriction.label)}>
          <Image src={restriction.iconUrl} alt={displayRestrictionLabel(restriction.label)} width={32} height={32} unoptimized className="h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

function StagePickCard({ pick, onRemove }: { pick: StagePick; onRemove: () => void }) {
  return (
    <div className="group relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-purple-100 bg-white p-1 shadow-sm" title={`${pick.characterName} · ${pick.uniformName}`}>
      <Image
        src={pick.uniformImageUrl ?? pick.characterImageUrl}
        alt={`${pick.characterName} ${pick.uniformName}`}
        width={44}
        height={44}
        unoptimized
        onError={(event) => imageFallback(event, pick.characterName)}
        className="h-full w-full rounded-lg object-cover"
      />
      <button type="button" onClick={onRemove} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-950 text-[10px] font-black text-white shadow-sm opacity-90 hover:bg-rose-600" aria-label={`${pick.characterName} 제거`}>
        ×
      </button>
    </div>
  );
}

function StagePickerPanel({
  picker,
  onClose,
  onSelect,
}: {
  picker: PickerState;
  onClose: () => void;
  onSelect: (option: UniformOption) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedCharacterKey, setSelectedCharacterKey] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const pickerStageKey = picker?.stageKey;
  const allCharacterOptions = useMemo(() => (picker ? getCharacterOptions(picker.stage) : []), [picker]);
  const selectedCharacter = useMemo(
    () => allCharacterOptions.find((option) => option.key === selectedCharacterKey) ?? null,
    [allCharacterOptions, selectedCharacterKey],
  );
  const visibleCharacters = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return allCharacterOptions.slice(0, 48);

    return allCharacterOptions.filter((option) => toCharacterOptionSearchText(option).includes(q)).slice(0, 72);
  }, [allCharacterOptions, deferredQuery]);

  useEffect(() => {
    if (!pickerStageKey) return;
    setQuery('');
    setSelectedCharacterKey(null);
  }, [pickerStageKey]);

  if (!picker) return null;

  return (
    <div data-testid="world-boss-picker" className="fixed bottom-4 right-4 z-50 max-h-[82vh] w-[min(820px,calc(100vw-2rem))] overscroll-contain overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-purple-600">World Boss 조건 캐릭터 추가</p>
          <h3 className="truncate text-sm font-black text-slate-950">{picker.bossName} · {picker.stage.range}층</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">{picker.stage.restrictions.map((restriction) => displayRestrictionLabel(restriction.label)).join(' + ') || '제한 없음'}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-50">닫기</button>
      </div>
      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="영웅 이름 검색"
            aria-label="월드보스 조건 영웅 이름 검색"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
          />
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleCharacters.length}/{allCharacterOptions.length}</span>
        </div>
      </div>
      <div className="grid h-[58vh] min-h-0 gap-3 overscroll-contain overflow-hidden p-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <div data-testid="world-boss-character-scroll" className="min-h-0 overscroll-contain overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
          <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-wide text-slate-500">1. 영웅 선택</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2">
            {visibleCharacters.length ? visibleCharacters.map((option) => {
              const active = selectedCharacter?.key === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedCharacterKey(option.key)}
                  className={`min-w-0 rounded-xl border p-2 text-left transition ${active ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
                >
                  <Image
                    src={option.character.imageUrl}
                    alt={option.character.name}
                    width={72}
                    height={72}
                    unoptimized
                    onError={(event) => imageFallback(event, option.character.name)}
                    className="mx-auto h-[72px] w-[72px] rounded-xl object-cover"
                  />
                  <p className="mt-2 truncate text-xs font-black text-slate-950">{option.character.name}</p>
                  <p className="mt-1 text-[10px] font-black text-purple-600">{option.uniforms.length} 유니폼</p>
                </button>
              );
            }) : (
              <p className="col-span-full rounded-xl bg-white p-4 text-center text-xs font-black text-slate-400">검색 결과 없음</p>
            )}
          </div>
        </div>
        <div data-testid="world-boss-uniform-scroll" className="min-h-0 overscroll-contain overflow-y-auto rounded-xl border border-purple-100 bg-white p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-purple-600">2. 조건 유니폼 선택</p>
          {selectedCharacter ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                <Image
                  src={selectedCharacter.character.imageUrl}
                  alt={selectedCharacter.character.name}
                  width={44}
                  height={44}
                  unoptimized
                  onError={(event) => imageFallback(event, selectedCharacter.character.name)}
                  className="h-11 w-11 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-950">{selectedCharacter.character.name}</p>
                  <p className="text-[10px] font-bold text-slate-500">조건 충족 {selectedCharacter.uniforms.length}개</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedCharacter.uniforms.map((uniform, index) => (
                  <button
                    key={`${selectedCharacter.key}-${uniform.name}-${index}`}
                    type="button"
                    onClick={() => onSelect({ key: `${selectedCharacter.key}:${index}:${uniform.name}`, character: selectedCharacter.character, uniform })}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Image
                      src={uniform.imageUrl ?? selectedCharacter.character.imageUrl}
                      alt={`${selectedCharacter.character.name} ${uniform.name}`}
                      width={92}
                      height={92}
                      unoptimized
                      onError={(event) => imageFallback(event, selectedCharacter.character.name)}
                      className="mx-auto h-[92px] w-[92px] rounded-xl object-cover"
                    />
                    <span className="mt-2 line-clamp-2 block min-h-8 text-[10px] font-black leading-tight text-slate-950">{uniform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-black text-slate-400">
              영웅을 먼저 선택
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StageRuleGrid({
  boss,
  picks,
  onOpenPicker,
  onRemovePick,
}: {
  boss: WorldBoss;
  picks: StagePickStore;
  onOpenPicker: (picker: PickerState) => void;
  onRemovePick: (stageKey: string, pickId: string) => void;
}) {
  const stageOptionCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const stage of boss.stages) {
      counts.set(makeStageKey(boss.id, stage.range), getCharacterOptions(stage).length);
    }

    return counts;
  }, [boss]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">층 조건</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{boss.stages.length}구간</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {boss.stages.map((stage) => {
          const stageKey = makeStageKey(boss.id, stage.range);
          const stagePicks = picks[stageKey] ?? [];

          return (
            <article key={`${boss.id}-${stage.range}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[72px_150px_minmax(0,1fr)] md:items-start">
              <div className="grid place-items-center rounded-2xl bg-slate-950 px-3 py-3 text-sm font-black text-white">{stage.range}</div>
              <RestrictionIcons stage={stage} />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">DB {stageOptionCounts.get(stageKey) ?? 0}명</span>
                  <button
                    type="button"
                    onClick={() => onOpenPicker({ stageKey, bossName: boss.name, stage })}
                    className="rounded-full bg-purple-600 px-3 py-1 text-[11px] font-black text-white shadow-sm hover:bg-purple-700"
                  >
                    + 영웅
                  </button>
                </div>
                <div className="mt-3 flex min-h-12 flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 bg-white/70 p-2">
                  {stagePicks.length ? stagePicks.map((pick) => (
                    <StagePickCard key={pick.id} pick={pick} onRemove={() => onRemovePick(stageKey, pick.id)} />
                  )) : (
                    <div className="min-h-8 flex-1" aria-label="추가된 월드보스 조건 영웅 없음" />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BossHero({ boss }: { boss: WorldBoss }) {
  return (
    <section className="relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
      <Image src={boss.bannerUrl} alt={boss.name} fill priority unoptimized className="object-cover opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/35 to-transparent" />
      <div className="relative flex min-h-[280px] items-end gap-5 p-6">
        <Image src={boss.portraitUrl} alt={boss.name} width={108} height={108} unoptimized className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white/20" />
        <div className="pb-2">
          <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${boss.mode === 'Legend+' ? 'bg-fuchsia-500 text-white' : 'bg-blue-500 text-white'}`}>{boss.mode}</span>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{boss.name}</h1>
        </div>
      </div>
    </section>
  );
}

export function WorldBossSection() {
  const [selectedId, setSelectedId] = useState(worldBosses[0]?.id ?? '');
  const [stagePicks, setStagePicks] = useState<StagePickStore>({});
  const [picksReady, setPicksReady] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);
  const selectedBoss = useMemo(
    () => worldBosses.find((boss) => boss.id === selectedId) ?? worldBosses[0],
    [selectedId],
  );

  useEffect(() => {
    setStagePicks(readStoredPicks());
    setPicksReady(true);
  }, []);

  useEffect(() => {
    if (!picksReady) return;
    try {
      window.localStorage.setItem(customPicksStorageKey, JSON.stringify(stagePicks));
    } catch {
      // Custom stage picks are local convenience data; the World Boss screen remains usable without storage.
    }
  }, [picksReady, stagePicks]);

  useEffect(() => {
    if (!picker) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [picker]);

  if (!selectedBoss) return null;

  const addPick = (option: UniformOption) => {
    if (!picker) return;
    setStagePicks((current) => ({
      ...current,
      [picker.stageKey]: [...(current[picker.stageKey] ?? []), stagePickFromOption(option)],
    }));
    setPicker(null);
  };

  const removePick = (stageKey: string, pickId: string) => {
    setStagePicks((current) => ({
      ...current,
      [stageKey]: (current[stageKey] ?? []).filter((pick) => pick.id !== pickId),
    }));
  };

  return (
    <section className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {worldBosses.map((boss) => (
          <BossButton key={boss.id} boss={boss} active={boss.id === selectedBoss.id} onClick={() => setSelectedId(boss.id)} />
        ))}
      </section>

      <BossHero boss={selectedBoss} />
      <UnlockStrip boss={selectedBoss} />
      <StageRuleGrid boss={selectedBoss} picks={stagePicks} onOpenPicker={setPicker} onRemovePick={removePick} />
      <StagePickerPanel picker={picker} onClose={() => setPicker(null)} onSelect={addPick} />
    </section>
  );
}
