'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { filterIconGroups, getMffAbilityIcons, getMffAttributeIcon, normalizeAttributeKey, type AttributeFilterKey, type FilterIconGroup as AttributeIconGroup, type MffAttributeIcon } from '@/lib/mffAttributeIcons';
import { getCharacterInstinctLabel, translateMffEffectText } from '@/lib/mffTextKorean';
import { catalogCharacters, catalogStats, type CatalogCharacter, type CatalogUniform } from '@mff-data-hub/data';

type Props = {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onSelectCatalog?: (character: CatalogCharacter) => void;
};

const PAGE_SIZE = 10;
const artifactStarOptions = [3, 4, 5, 6] as const;
type ArtifactStar = (typeof artifactStarOptions)[number];
const sourceOptions: Array<'ALL' | CatalogCharacter['sourceStatus']> = ['ALL', 'synced', 'manual'];
const matrixColumnCount = 4;
type SelectedFilters = Record<AttributeFilterKey, string[]>;
const totalUniforms = catalogCharacters.reduce((count, character) => count + character.uniforms.length, 0);
const artifactCount = catalogCharacters.filter((character) => character.artifact).length;
const catalogSearchIndex = catalogCharacters.map((character) => ({
  character,
  searchText: [
    character.name,
    character.type,
    character.side,
    character.tags.join(' '),
    character.uniforms.map((uniform) => [uniform.name, uniform.type, uniform.side, uniform.gender, uniform.species, uniform.tags?.join(' ')].filter(Boolean).join(' ')).join(' '),
    character.artifact?.name,
    character.artifact?.skill,
    character.artifact?.effects.join(' '),
  ].join(' ').toLowerCase(),
}));

function imageFallback(e: SyntheticEvent<HTMLImageElement>, label: string) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=ede9fe&color=6d28d9&bold=true`;
}

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'purple' | 'blue' | 'green' | 'red' | 'amber' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
}

function artifactLinesByStar(effects: string[], star: ArtifactStar) {
  const starPrefix = `${star}★:`;
  const starLines = effects.filter((effect) => effect.startsWith(starPrefix));
  return (starLines.length ? starLines : effects).map(translateMffEffectText);
}

function tagValue(tags: string[] | undefined, prefix: string) {
  return tags?.find((tag) => tag.startsWith(prefix))?.slice(prefix.length);
}

function tagsForDisplay(character: CatalogCharacter, selectedUniform?: CatalogUniform) {
  return selectedUniform?.tags?.length ? selectedUniform.tags : character.tags;
}

function coreIconValues(character: CatalogCharacter, selectedUniform?: CatalogUniform) {
  const uniformTags = selectedUniform?.tags ?? [];
  const gender = selectedUniform?.gender ?? tagValue(uniformTags, 'Gender:') ?? tagValue(character.tags, 'Gender:');
  const species = selectedUniform?.species ?? tagValue(uniformTags, 'Species:') ?? tagValue(character.tags, 'Species:');
  return [
    { group: 'type', value: selectedUniform?.type ?? character.type },
    { group: 'species', value: species },
    { group: 'gender', value: gender },
    { group: 'side', value: selectedUniform?.side ?? character.side },
  ].filter((item): item is { group: AttributeFilterKey; value: string } => Boolean(item.value));
}

function CharacterAttributeIcons({ character, selectedUniform }: { character: CatalogCharacter; selectedUniform?: CatalogUniform }) {
  const icons = coreIconValues(character, selectedUniform)
    .map((item) => getMffAttributeIcon(item.value, item.group))
    .filter((icon): icon is MffAttributeIcon => Boolean(icon));

  return (
    <div data-testid={`character-core-icons-${character.id}`} className="flex max-h-12 flex-wrap justify-center gap-1 overflow-hidden">
      {icons.map((icon, index) => (
        <span key={`${character.id}-${icon.key}-${index}`} className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-100 p-0.5" title={icon.label} aria-label={icon.label}>
          <Image src={icon.src} alt={icon.label} width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
        </span>
      ))}
    </div>
  );
}

function CharacterAbilityIcons({ character, selectedUniform }: { character: CatalogCharacter; selectedUniform?: CatalogUniform }) {
  const icons = getMffAbilityIcons(tagsForDisplay(character, selectedUniform));

  return (
    <div data-testid={`character-ability-icons-${character.id}`} className="flex flex-wrap justify-center gap-1">
      {icons.length ? icons.map((icon) => (
        <span key={`${character.id}-ability-${icon.key}`} className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-slate-200 bg-white p-0.5" title={icon.label} aria-label={icon.label}>
          <Image src={icon.src} alt={icon.label} width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
        </span>
      )) : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">능력 없음</span>
      )}
    </div>
  );
}

function createEmptyFilters(): SelectedFilters {
  return filterIconGroups.reduce((acc, group) => {
    acc[group.key] = [];
    return acc;
  }, {} as SelectedFilters);
}

function allCharacterTags(character: CatalogCharacter) {
  return [character.tags, ...character.uniforms.map((uniform) => uniform.tags ?? [])].flat();
}

function attributeValuesForCharacter(character: CatalogCharacter, group: AttributeFilterKey) {
  const tags = allCharacterTags(character);
  const values = new Set<string>();

  if (group === 'type') {
    [character.type, ...character.uniforms.map((uniform) => uniform.type)].filter(Boolean).forEach((value) => values.add(normalizeAttributeKey(value!)));
  } else if (group === 'side') {
    [character.side, ...character.uniforms.map((uniform) => uniform.side)].filter(Boolean).forEach((value) => values.add(normalizeAttributeKey(value!)));
  } else if (group === 'species') {
    [tagValue(character.tags, 'Species:'), ...character.uniforms.map((uniform) => uniform.species ?? tagValue(uniform.tags, 'Species:'))]
      .filter(Boolean)
      .forEach((value) => values.add(normalizeAttributeKey(value!)));
  } else if (group === 'gender') {
    [tagValue(character.tags, 'Gender:'), ...character.uniforms.map((uniform) => uniform.gender ?? tagValue(uniform.tags, 'Gender:'))]
      .filter(Boolean)
      .forEach((value) => values.add(normalizeAttributeKey(value!)));
  } else if (group === 'instinct') {
    tags
      .filter((tag) => tag.startsWith('Instinct:'))
      .map((tag) => tag.slice('Instinct:'.length))
      .forEach((value) => values.add(normalizeAttributeKey(value)));
  } else {
    tags
      .filter((tag) => getMffAttributeIcon(tag, 'ability'))
      .forEach((value) => values.add(normalizeAttributeKey(value)));
  }

  return values;
}

function characterMatchesFilters(character: CatalogCharacter, selectedFilters: SelectedFilters) {
  return filterIconGroups.every((group) => {
    const selected = selectedFilters[group.key];
    if (!selected.length) return true;
    const values = attributeValuesForCharacter(character, group.key);
    return selected.some((value) => values.has(normalizeAttributeKey(value)));
  });
}

function hasActiveFilters(selectedFilters: SelectedFilters) {
  return filterIconGroups.some((group) => selectedFilters[group.key].length > 0);
}

function CharacterCell({
  character,
  selectedUniform,
  active,
  onSelect,
}: {
  character: CatalogCharacter;
  selectedUniform?: CatalogUniform;
  active?: boolean;
  onSelect?: (id: string) => void;
}) {
  const instinctLabel = getCharacterInstinctLabel(character.tags);
  const displayImageUrl = selectedUniform?.imageUrl ?? character.imageUrl;
  const displayImageLabel = selectedUniform ? `${character.name} - ${selectedUniform.name}` : character.name;

  return (
    <div className={`w-full rounded-xl border p-2 ${active ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white'}`}>
      <button type="button" data-testid={`character-select-${character.id}`} onClick={() => onSelect?.(character.id)} className="grid w-full justify-items-center gap-2 text-center">
        <Image
          src={displayImageUrl}
          alt={displayImageLabel}
          width={82}
          height={82}
          unoptimized
          onError={(e) => imageFallback(e, displayImageLabel)}
          className="h-[82px] w-[82px] shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover"
        />
        <p className="line-clamp-2 min-h-8 w-full break-keep text-[13px] font-black leading-tight text-slate-950">{character.name}</p>
        <CharacterAbilityIcons character={character} selectedUniform={selectedUniform} />
        <p data-testid={`character-instinct-${character.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
          {instinctLabel ?? '미등록'}
        </p>
        <CharacterAttributeIcons character={character} selectedUniform={selectedUniform} />
      </button>
    </div>
  );
}

function ArtifactCell({ character, selectedStar, onStarChange }: { character: CatalogCharacter; selectedStar: ArtifactStar; onStarChange: (star: ArtifactStar) => void }) {
  const artifact = character.artifact;
  const effectLines = artifact ? artifactLinesByStar(artifact.effects, selectedStar) : [];
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-2">
      <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          {artifact?.imageUrl ? (
            <Image src={artifact.imageUrl} alt={artifact.name} width={56} height={56} unoptimized onError={(e) => imageFallback(e, artifact.name)} className="h-full w-full object-contain p-1" />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-black text-amber-600">A</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950">{artifact?.name ?? '아티팩트 미등록'}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-amber-700">{artifact?.skill ?? '전용 스킬 없음'}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone="green">PvE {artifact?.pve ?? '-'}</Badge>
            <Badge tone="red">PvP {artifact?.pvp ?? '-'}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        {artifactStarOptions.map((star) => (
          <button
            key={`${character.id}-${star}`}
            type="button"
            onClick={() => onStarChange(star)}
            disabled={!artifact}
            className={`flex-1 rounded-lg border px-2 py-1 text-[10px] font-black ${selectedStar === star ? 'border-amber-400 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-500 disabled:opacity-40'}`}
          >
            {star}성
          </button>
        ))}
      </div>
      <div className="mt-2 rounded-lg bg-slate-50 p-2">
        {effectLines.length ? (
          <div className="space-y-1">
            {effectLines.map((effect, index) => (
              <p key={`${artifact?.name}-${selectedStar}-${index}`} className="text-[10px] font-bold leading-relaxed text-slate-700">{effect}</p>
            ))}
          </div>
        ) : (
          <p className="text-xs font-bold text-slate-400">아티팩트 효과 텍스트 없음</p>
        )}
      </div>
    </div>
  );
}

function SkillGroup({ title, rows, tone }: { title: string; rows?: string[]; tone: 'blue' | 'purple' | 'green' }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Badge tone={tone}>{title}</Badge>
        <span className="text-[11px] font-black text-slate-400">{rows?.length ?? 0}</span>
      </div>
      <div className="space-y-1.5">
        {rows?.length ? rows.map((row, index) => (
          <p key={`${title}-${index}`} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-bold leading-relaxed text-slate-700">{translateMffEffectText(row)}</p>
        )) : <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-400">없음</p>}
      </div>
    </div>
  );
}

function SkillCell({ uniform }: { uniform?: CatalogUniform }) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-2">
      <div className="mb-2 flex items-center gap-2">
        {uniform?.imageUrl ? (
          <Image src={uniform.imageUrl} alt={uniform.name} width={42} height={42} unoptimized onError={(e) => imageFallback(e, uniform.name)} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950">{uniform?.name ?? '유니폼 선택 필요'}</p>
          <p className="truncate text-[10px] font-bold text-slate-400">{uniform?.release ?? uniform?.acquisition ?? '선택한 유니폼 기준으로 효과 표시'}</p>
        </div>
      </div>
      <div data-testid="uniform-effect-columns" className="grid gap-2 xl:grid-cols-3">
        <SkillGroup title="리더" rows={uniform?.leader} tone="blue" />
        <SkillGroup title="패시브" rows={uniform?.passive} tone="purple" />
        <SkillGroup title="유니폼 효과" rows={uniform?.uniformEffect} tone="green" />
      </div>
    </div>
  );
}

function UniformButton({
  uniform,
  active,
  testId,
  onClick,
}: {
  uniform?: CatalogUniform;
  active?: boolean;
  testId?: string;
  onClick?: () => void;
}) {
  if (!uniform) return null;

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex min-w-0 flex-col rounded-lg border p-1 text-center transition hover:border-purple-300 hover:bg-purple-50 ${active ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-100' : 'border-slate-200 bg-white'}`}
    >
      {uniform.imageUrl ? (
        <Image
          src={uniform.imageUrl}
          alt={uniform.name}
          width={64}
          height={64}
          unoptimized
          onError={(e) => imageFallback(e, uniform.name)}
          className="mx-auto h-12 w-12 rounded-md border border-slate-200 bg-slate-100 object-cover"
        />
      ) : (
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-black text-slate-400">UNI</div>
      )}
      <p className="mt-1 line-clamp-2 min-h-7 break-keep text-[8px] font-black leading-tight text-slate-900">{uniform.name}</p>
    </button>
  );
}

function UniformGridCell({
  character,
  selectedUniformIndex,
  onSelectUniform,
}: {
  character: CatalogCharacter;
  selectedUniformIndex: number;
  onSelectUniform: (index: number) => void;
}) {
  return (
    <td className="border-b border-slate-100 px-2 py-2 align-top">
      <div className="grid grid-cols-6 gap-1.5">
        {character.uniforms.length ? character.uniforms.map((uniform, index) => (
          <UniformButton
            key={`${character.id}-${uniform.name}-${index}`}
            uniform={uniform}
            active={index === selectedUniformIndex}
            testId={`uniform-select-${character.id}-${index}`}
            onClick={() => onSelectUniform(index)}
          />
        )) : (
          <p className="col-span-6 rounded-lg bg-slate-50 p-3 text-center text-xs font-black text-slate-400">유니폼 없음</p>
        )}
      </div>
    </td>
  );
}

function FilterIconGroup({
  group,
  selected,
  onToggle,
}: {
  group: AttributeIconGroup;
  selected: string[];
  onToggle: (group: AttributeFilterKey, value: string) => void;
}) {
  const active = new Set(selected.map(normalizeAttributeKey));

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="mb-2 flex items-center gap-2">
        <span className="min-w-10 text-[11px] font-black text-slate-700">{group.label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-400">{selected.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {group.options.map((option) => {
          const isActive = active.has(normalizeAttributeKey(option.key));
          return (
            <button
              key={`${group.key}-${option.key}`}
              type="button"
              data-testid={`filter-${group.key}-${normalizeAttributeKey(option.key)}`}
              aria-pressed={isActive}
              title={option.label}
              onClick={() => onToggle(group.key, option.key)}
              className={`grid h-8 w-8 place-items-center rounded-lg border p-1 transition ${isActive ? 'border-purple-400 bg-purple-100 ring-1 ring-purple-200' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
            >
              <Image src={option.src} alt={option.label} width={22} height={22} unoptimized className="h-5 w-5 object-contain" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EnhancedCharacterDB({ selectedId, onSelect, onSelectCatalog }: Props) {
  const [query, setQuery] = useState('');
  const [sourceStatus, setSourceStatus] = useState<'ALL' | CatalogCharacter['sourceStatus']>('ALL');
  const [view, setView] = useState<'matrix' | 'cards'>('matrix');
  const [page, setPage] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(() => createEmptyFilters());
  const [selectedUniformByCharacter, setSelectedUniformByCharacter] = useState<Record<string, number>>({});
  const [selectedArtifactStarByCharacter, setSelectedArtifactStarByCharacter] = useState<Record<string, ArtifactStar>>({});
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return catalogSearchIndex
      .filter(({ character, searchText }) =>
        (!q || searchText.includes(q)) &&
        (sourceStatus === 'ALL' || character.sourceStatus === sourceStatus) &&
        characterMatchesFilters(character, selectedFilters))
      .map(({ character }) => character);
  }, [deferredQuery, sourceStatus, selectedFilters]);

  const dedupedFiltered = useMemo(() => Array.from(new Map(filtered.map((character) => [character.id, character])).values()), [filtered]);
  const visibleColumnCount = matrixColumnCount;
  const pageCount = Math.max(1, Math.ceil(dedupedFiltered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const currentPageCharacters = dedupedFiltered.slice(pageStart, pageStart + PAGE_SIZE);
  const activeFilterCount = filterIconGroups.reduce((count, group) => count + selectedFilters[group.key].length, 0);

  const prevPage = () => setPage((current) => Math.max(0, current - 1));
  const nextPage = () => setPage((current) => Math.min(pageCount - 1, current + 1));

  const toggleFilter = (group: AttributeFilterKey, value: string) => {
    setSelectedFilters((current) => {
      const selected = current[group];
      const normalized = normalizeAttributeKey(value);
      const exists = selected.some((item) => normalizeAttributeKey(item) === normalized);
      return {
        ...current,
        [group]: exists ? selected.filter((item) => normalizeAttributeKey(item) !== normalized) : [...selected, value],
      };
    });
  };

  const resetFilters = () => setSelectedFilters(createEmptyFilters());

  const selectUniform = (characterId: string, index: number) => {
    setSelectedUniformByCharacter((current) => ({ ...current, [characterId]: index }));
  };

  const selectArtifactStar = (characterId: string, star: ArtifactStar) => {
    setSelectedArtifactStarByCharacter((current) => ({ ...current, [characterId]: star }));
  };

  const selectCharacter = (character: CatalogCharacter) => {
    onSelect?.(character.id);
    onSelectCatalog?.(character);
  };

  useEffect(() => {
    setPage(0);
  }, [deferredQuery, sourceStatus, selectedFilters, view]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-600">Character DB Matrix</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">전체 캐릭터 DB</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">
              로컬 PNG 캐시 기반으로 캐릭터, 아티팩트, 유니폼 이미지를 표시합니다. 유니폼 이미지를 누르면 3열의 리더/패시브/유니폼 효과가 해당 유니폼 기준으로 바뀝니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-purple-50 px-4 py-3"><p className="text-2xl font-black text-purple-700">{catalogStats.count}</p><p className="text-[11px] font-black text-purple-500">표시 캐릭</p></div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3"><p className="text-2xl font-black text-blue-700">{totalUniforms}</p><p className="text-[11px] font-black text-blue-500">유니폼</p></div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3"><p className="text-2xl font-black text-amber-700">{artifactCount}</p><p className="text-[11px] font-black text-amber-500">아티팩트</p></div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_150px_150px]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="캐릭터명 / 유니폼 / 아티팩트 / 효과 검색" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100" />
          <select value={sourceStatus} onChange={(e) => setSourceStatus(e.target.value as 'ALL' | CatalogCharacter['sourceStatus'])} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black">
            {sourceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <button onClick={resetFilters} disabled={!hasActiveFilters(selectedFilters)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-40">필터 초기화 {activeFilterCount ? activeFilterCount : ''}</button>
          <button onClick={() => setView(view === 'matrix' ? 'cards' : 'matrix')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{view === 'matrix' ? '카드 보기' : '표 보기'}</button>
        </div>
        <div data-testid="character-db-icon-filters" className="mt-4 grid gap-2 xl:grid-cols-2">
          {filterIconGroups.map((group) => (
            <FilterIconGroup key={group.key} group={group} selected={selectedFilters[group.key]} onToggle={toggleFilter} />
          ))}
        </div>
      </div>

      {view === 'matrix' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-3 py-4 text-xs font-black">1열 캐릭터</th>
                <th className="px-3 py-4 text-xs font-black">2열 아티팩트</th>
                <th className="px-3 py-4 text-xs font-black">3열 리더 / 패시브 / 유니폼 효과</th>
                <th className="px-3 py-4 text-xs font-black">4열 유니폼 목록 6열</th>
              </tr>
            </thead>
            <tbody>
              {currentPageCharacters.map((character) => {
                const selectedUniformIndex = Math.min(selectedUniformByCharacter[character.id] ?? 0, character.uniforms.length - 1);
                const selectedUniform = character.uniforms[selectedUniformIndex];
                const selectedArtifactStar = selectedArtifactStarByCharacter[character.id] ?? 6;
                return (
                  <tr key={character.id} data-character-id={character.id} className="align-top hover:bg-purple-50/30">
                    <td className="border-b border-slate-100 px-2 py-2">
                      <CharacterCell character={character} selectedUniform={selectedUniform} active={character.id === selectedId} onSelect={() => selectCharacter(character)} />
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2"><ArtifactCell character={character} selectedStar={selectedArtifactStar} onStarChange={(star) => selectArtifactStar(character.id, star)} /></td>
                    <td className="border-b border-slate-100 px-2 py-2"><SkillCell uniform={selectedUniform} /></td>
                    <UniformGridCell character={character} selectedUniformIndex={selectedUniformIndex} onSelectUniform={(index) => selectUniform(character.id, index)} />
                  </tr>
                );
              })}
              {currentPageCharacters.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-4 py-10 text-center text-sm font-black text-slate-400">검색 결과 없음</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {currentPageCharacters.map((character) => {
            const selectedUniformIndex = Math.min(selectedUniformByCharacter[character.id] ?? 0, character.uniforms.length - 1);
            const selectedUniform = character.uniforms[selectedUniformIndex];
            const selectedArtifactStar = selectedArtifactStarByCharacter[character.id] ?? 6;
            return (
              <article key={character.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <CharacterCell character={character} selectedUniform={selectedUniform} active={character.id === selectedId} onSelect={() => selectCharacter(character)} />
                <div className="mt-4"><ArtifactCell character={character} selectedStar={selectedArtifactStar} onStarChange={(star) => selectArtifactStar(character.id, star)} /></div>
                <div className="mt-4"><SkillCell uniform={selectedUniform} /></div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
                  {character.uniforms.map((uniform, index) => (
                    <button key={uniform.name} type="button" data-testid={`uniform-card-${character.id}-${index}`} onClick={() => selectUniform(character.id, index)} className={`min-w-0 rounded-2xl border p-2 ${index === selectedUniformIndex ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                      {uniform.imageUrl ? (
                        <Image src={uniform.imageUrl} alt={uniform.name} width={112} height={112} unoptimized onError={(e) => imageFallback(e, uniform.name)} className="aspect-square w-full rounded-xl object-cover" />
                      ) : (
                        <div className="grid aspect-square w-full place-items-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-400">UNI</div>
                      )}
                      <p className="mt-2 line-clamp-2 text-[11px] font-black">{uniform.name}</p>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
          {currentPageCharacters.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-400 shadow-sm">검색 결과 없음</div>
          ) : null}
        </div>
      )}
      <div data-testid="character-db-pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <button type="button" onClick={prevPage} disabled={currentPage === 0} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">이전</button>
        <div className="text-center text-sm font-black text-slate-600">
          {dedupedFiltered.length ? pageStart + 1 : 0}-{Math.min(pageStart + PAGE_SIZE, dedupedFiltered.length)} / {dedupedFiltered.length}
          <span className="ml-2 text-slate-400">{currentPage + 1} / {pageCount}</span>
        </div>
        <button type="button" onClick={nextPage} disabled={currentPage >= pageCount - 1} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-40">다음</button>
      </div>
    </section>
  );
}
