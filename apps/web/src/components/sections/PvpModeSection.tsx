'use client';

import Image from 'next/image';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { characters, pvpDecks, pvpModeRules } from '@/lib/data';
import {
  buildCatalogCharacterOptions,
  catalogFallbackUniform,
  normalizeCatalogPickerKey,
  type CatalogCharacterPickerOption,
} from '@/lib/catalogCharacterPicker';
import { usePvpRestrictionOverrides, type PvpRestrictionCharacter } from '@/lib/pvpRestrictions';
import { gradeForScore, pvpScoreModes, type PvpScoreContent } from '@/lib/scoreDisplay';
import { catalogCharacters, type CatalogUniform } from '@mff-data-hub/data';
import type { Character } from '@mff-data-hub/types';

type PvpDeckMember = {
  id: string;
  catalogId?: string;
  name: string;
  portraitUrl: string;
  uniformName?: string;
  uniformImageUrl?: string;
  score: number;
};
type PvpDeckOverrideStore = Partial<Record<PvpScoreContent, Record<string, PvpDeckMember>>>;
type DeckPickerState = {
  slotKey: string;
  label: string;
  current: PvpDeckMember;
} | null;

const modeCopy: Record<PvpScoreContent, { eyebrow: string; title: string; note: string }> = {
  Otherworld: {
    eyebrow: 'Otherworld Battle',
    title: '아더월드 점수 / 덱',
    note: '자동전투 안정성, 부활, 회복, 광역 제어를 같이 보는 PVP 모드',
  },
  'Timeline Battle': {
    eyebrow: 'Timeline Battle',
    title: '타임라인 점수 / 덱',
    note: '방어덱과 공격덱 양쪽에서 생존 앵커와 디버프 대응을 우선 확인',
  },
  'Team Battle Arena': {
    eyebrow: 'Team Battle Arena',
    title: '팀 배틀 아레나 점수 / 덱',
    note: '여러 팀에 전력을 분산해야 하므로 단일 고점보다 덱 평균과 안정성이 중요',
  },
};

const restrictionKindByContent: Record<PvpScoreContent, string> = {
  Otherworld: 'custom-5pct',
  'Timeline Battle': 'custom-restricted',
  'Team Battle Arena': 'custom-banned',
};
const deckCustomizationStorageKey = 'mff-data-hub:pvp-deck-customizations:v1';
const deckCustomizationEventName = 'mff-data-hub:pvp-deck-customizations-updated';

const baseCatalogOptions = buildCatalogCharacterOptions({ catalogCharacters, appCharacters: characters });
const baseCatalogOptionByAppId = new Map(baseCatalogOptions.flatMap((option) => (option.appCharacter ? [[option.appCharacter.id, option]] : [])));

function findCharacter(id: string) {
  return characters.find((character) => character.id === id);
}

function getRestrictionId(option: CatalogCharacterPickerOption) {
  return option.appCharacter?.id ?? `catalog-${option.catalogCharacter.id}`;
}

function getRestrictionImage(restriction: PvpRestrictionCharacter, character?: Character) {
  return restriction.characterImageUrl ?? character?.portraitUrl;
}

function imageFallback(event: React.SyntheticEvent<HTMLImageElement>, label: string) {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=fee2e2&color=b91c1c&bold=true`;
}

function restrictionFromSelection(content: PvpScoreContent, option: CatalogCharacterPickerOption): PvpRestrictionCharacter {
  const character = option.appCharacter;
  const catalogCharacter = option.catalogCharacter;
  return {
    id: getRestrictionId(option),
    catalogId: catalogCharacter.id,
    name: option.displayName,
    kind: restrictionKindByContent[content],
    note: character ? '로컬 캐릭터 DB 매칭' : '카탈로그 캐릭터 매칭',
    characterImageUrl: catalogCharacter.imageUrl,
    custom: true,
  };
}

function readDeckOverrideStore(): PvpDeckOverrideStore {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(deckCustomizationStorageKey) ?? '{}') as PvpDeckOverrideStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeDeckOverrideStore(next: PvpDeckOverrideStore) {
  window.localStorage.setItem(deckCustomizationStorageKey, JSON.stringify(next));
  window.dispatchEvent(new Event(deckCustomizationEventName));
}

function makeDeckSlotKey(content: PvpScoreContent, teamIndex: number, slotIndex: number) {
  return `${content}:${teamIndex}:${slotIndex}`;
}

function deckMemberFromCharacter(content: PvpScoreContent, character: Character): PvpDeckMember {
  const option = baseCatalogOptionByAppId.get(character.id);
  const uniform = option?.uniforms[0];

  return {
    id: character.id,
    catalogId: option?.catalogCharacter.id,
    name: option?.displayName ?? character.name,
    portraitUrl: uniform?.imageUrl ?? option?.imageUrl ?? character.portraitUrl,
    uniformName: uniform?.name,
    uniformImageUrl: uniform?.imageUrl,
    score: character.scores[content],
  };
}

function deckMemberFromSelection(content: PvpScoreContent, option: CatalogCharacterPickerOption, uniform: CatalogUniform): PvpDeckMember {
  const appCharacter = option.appCharacter;
  const catalogCharacter = option.catalogCharacter;
  return {
    id: appCharacter?.id ?? `catalog-${catalogCharacter.id}`,
    catalogId: catalogCharacter.id,
    name: option.displayName,
    portraitUrl: uniform.imageUrl ?? catalogCharacter.imageUrl,
    uniformName: uniform.name,
    uniformImageUrl: uniform.imageUrl,
    score: appCharacter?.scores[content] ?? 0,
  };
}

function averageMemberScore(members: readonly PvpDeckMember[]) {
  if (!members.length) return 0;
  return members.reduce((sum, member) => sum + member.score, 0) / members.length;
}

function usePvpDeckOverrides(content: PvpScoreContent) {
  const [store, setStore] = useState<PvpDeckOverrideStore>({});

  useEffect(() => {
    const sync = () => setStore(readDeckOverrideStore());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(deckCustomizationEventName, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(deckCustomizationEventName, sync);
    };
  }, []);

  const overrides = store[content] ?? {};
  const setOverride = useCallback((slotKey: string, member: PvpDeckMember) => {
    const nextStore = readDeckOverrideStore();
    nextStore[content] = { ...(nextStore[content] ?? {}), [slotKey]: member };
    writeDeckOverrideStore(nextStore);
  }, [content]);
  const clearOverrides = useCallback(() => {
    const nextStore = readDeckOverrideStore();
    nextStore[content] = {};
    writeDeckOverrideStore(nextStore);
  }, [content]);

  return { overrides, setOverride, clearOverrides };
}

function RestrictionEditor({
  restrictions,
  removeRestriction,
  clearRestrictions,
  onOpenPicker,
}: {
  restrictions: PvpRestrictionCharacter[];
  removeRestriction: (id: string) => void;
  clearRestrictions: () => void;
  onOpenPicker: () => void;
}) {
  return (
    <section className="rounded-3xl border border-red-100 bg-red-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-red-700">제한 캐릭터 커스텀</p>
          <h3 className="text-xl font-black text-slate-950">GUI 선택 목록</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpenPicker} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm">+ 캐릭터 선택</button>
          <button type="button" onClick={clearRestrictions} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-red-100 hover:text-red-600">초기화</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {restrictions.length ? restrictions.map((restriction) => {
          const character = findCharacter(restriction.id);
          const imageUrl = getRestrictionImage(restriction, character);
          return (
            <span key={restriction.id} className="inline-flex items-center gap-2 rounded-2xl bg-white px-2 py-2 text-xs font-black text-slate-700 ring-1 ring-red-100">
              {imageUrl ? (
                <span className="relative h-7 w-7 overflow-hidden rounded-xl">
                  <Image src={imageUrl} alt={restriction.name} fill sizes="28px" unoptimized className="object-cover" onError={(event) => imageFallback(event, restriction.name)} />
                </span>
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-slate-100 text-[10px] text-slate-500">?</span>
              )}
              <span className="grid min-w-0">
                <span className="max-w-[132px] truncate">{restriction.name}</span>
                <span className="max-w-[132px] truncate text-[10px] text-red-600">{restriction.kind}</span>
              </span>
              <button type="button" onClick={() => removeRestriction(restriction.id)} className="rounded-lg px-1.5 py-0.5 text-red-600 hover:bg-red-50" aria-label={`${restriction.name} 제한 삭제`}>×</button>
            </span>
          );
        }) : <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-red-100">등록된 제한 캐릭터 없음</p>}
      </div>
    </section>
  );
}

function RestrictionPickerPanel({
  content,
  restrictedIds,
  onSelect,
  onClose,
}: {
  content: PvpScoreContent;
  restrictedIds: Set<string>;
  onSelect: (restriction: PvpRestrictionCharacter) => boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const characterOptions = useMemo(() => {
    return buildCatalogCharacterOptions({
      catalogCharacters,
      appCharacters: characters,
      scoreForCharacter: (character) => character.scores[content],
      includeUniformSearch: false,
    });
  }, [content]);

  const normalizedQuery = normalizeCatalogPickerKey(deferredQuery);
  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) return characterOptions;
    return characterOptions.filter((option) => option.normalizedSearchText.includes(normalizedQuery));
  }, [characterOptions, normalizedQuery]);

  const selectCharacter = (option: CatalogCharacterPickerOption) => {
    const saved = onSelect(restrictionFromSelection(content, option));
    if (saved) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-red-100">
        <div className="min-h-0 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-600">PVP 제한 캐릭터 선택</p>
              <h3 className="text-lg font-black text-slate-950">{content}</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">제한은 캐릭터 기준으로 적용됩니다.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-red-50 hover:text-red-600" aria-label="선택창 닫기">×</button>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="영웅 이름 검색"
              aria-label="PVP 제한 캐릭터 검색"
              className="min-w-0 flex-1 rounded-2xl border border-red-100 bg-red-50/40 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-red-300 focus:bg-white"
            />
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleOptions.length}/{characterOptions.length}</span>
          </div>

          <div className="grid max-h-[68vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {visibleOptions.length ? visibleOptions.map((option) => {
              const restrictionId = getRestrictionId(option);
              const alreadyRestricted = restrictedIds.has(restrictionId);
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectCharacter(option)}
                  className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-2 text-left transition ${
                    alreadyRestricted ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white hover:border-red-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                    <Image src={option.imageUrl} alt={option.displayName} fill sizes="56px" unoptimized className="object-cover" onError={(event) => imageFallback(event, option.displayName)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-950">{option.displayName}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{option.catalogCharacter.type}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{option.catalogCharacter.side}</span>
                      {alreadyRestricted ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">등록됨</span> : null}
                    </span>
                  </span>
                  <span className="rounded-xl bg-slate-950 px-2 py-1 text-[10px] font-black text-white">{option.score ? option.score.toFixed(0) : '-'}</span>
                </button>
              );
            }) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400 sm:col-span-2 xl:col-span-3">검색 결과 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckMemberPickerPanel({
  content,
  picker,
  onSelect,
  onClose,
}: {
  content: PvpScoreContent;
  picker: Exclude<DeckPickerState, null>;
  onSelect: (member: PvpDeckMember) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState<CatalogCharacterPickerOption | null>(null);
  const deferredQuery = useDeferredValue(query);

  const characterOptions = useMemo(() => {
    return buildCatalogCharacterOptions({
      catalogCharacters,
      appCharacters: characters,
      scoreForCharacter: (character) => character.scores[content],
    });
  }, [content]);

  const normalizedQuery = normalizeCatalogPickerKey(deferredQuery);
  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) return characterOptions;
    return characterOptions.filter((option) => option.normalizedSearchText.includes(normalizedQuery));
  }, [characterOptions, normalizedQuery]);
  const selectedUniforms = selectedOption
    ? selectedOption.uniforms.length ? selectedOption.uniforms : [catalogFallbackUniform(selectedOption.catalogCharacter)]
    : [];

  const selectUniform = (uniform: CatalogUniform) => {
    if (!selectedOption) return;
    onSelect(deckMemberFromSelection(content, selectedOption, uniform));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <div className="grid max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-red-100 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="min-h-0 border-b border-slate-100 p-4 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-600">PVP 덱 캐릭터 교체</p>
              <h3 className="text-lg font-black text-slate-950">{picker.label}</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">현재 {picker.current.name}{picker.current.uniformName ? ` · ${picker.current.uniformName}` : ''}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-red-50 hover:text-red-600" aria-label="덱 교체창 닫기">×</button>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="영웅 이름 / 유니폼 검색"
              aria-label="PVP 덱 캐릭터 검색"
              className="min-w-0 flex-1 rounded-2xl border border-red-100 bg-red-50/40 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-red-300 focus:bg-white"
            />
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleOptions.length}/{characterOptions.length}</span>
          </div>

          <div className="grid max-h-[58vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:max-h-[68vh]">
            {visibleOptions.length ? visibleOptions.map((option) => {
              const active = selectedOption?.key === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-2 text-left transition ${active ? 'border-red-300 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:border-red-200 hover:bg-slate-50'}`}
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                    <Image src={option.imageUrl} alt={option.displayName} fill sizes="56px" unoptimized className="object-cover" onError={(event) => imageFallback(event, option.displayName)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-950">{option.displayName}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{option.catalogCharacter.type}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{option.catalogCharacter.side}</span>
                    </span>
                  </span>
                  <span className="rounded-xl bg-slate-950 px-2 py-1 text-[10px] font-black text-white">{option.score ? option.score.toFixed(0) : '-'}</span>
                </button>
              );
            }) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400 sm:col-span-2">검색 결과 없음</p>
            )}
          </div>
        </div>

        <div className="min-h-0 p-4">
          <div className="mb-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">유니폼 최종 선택</p>
            <h4 className="mt-1 truncate text-lg font-black text-slate-950">{selectedOption ? selectedOption.displayName : '캐릭터를 먼저 선택'}</h4>
          </div>

          {selectedOption ? (
            <div className="grid max-h-[64vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
              {selectedUniforms.map((uniform, index) => (
                <button
                  key={`${selectedOption.key}-${uniform.name}-${index}`}
                  type="button"
                  onClick={() => selectUniform(uniform)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-red-300 hover:bg-red-50"
                >
                  <span className="relative mb-2 block aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <Image src={uniform.imageUrl ?? selectedOption.imageUrl} alt={`${selectedOption.displayName} ${uniform.name}`} fill sizes="160px" unoptimized className="object-cover" onError={(event) => imageFallback(event, selectedOption.displayName)} />
                  </span>
                  <span className="line-clamp-2 block min-h-9 text-xs font-black leading-tight text-slate-950">{uniform.name}</span>
                  {uniform.release ? <span className="mt-1 block truncate text-[10px] font-bold text-red-600">{uniform.release}</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400">왼쪽 목록에서 캐릭터를 선택하세요</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DeckCard({
  deck,
  selectedId,
  restrictedIds,
  overrides,
  onOpenPicker,
}: {
  deck: (typeof pvpDecks)[number];
  selectedId: string;
  restrictedIds: Set<string>;
  overrides: Record<string, PvpDeckMember>;
  onOpenPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  const teams = deck.teams.map((team, teamIndex) => ({
    ...team,
    members: team.memberIds
      .map((id, slotIndex) => ({ id, slotIndex }))
      .map(({ id, slotIndex }) => {
        const slotKey = makeDeckSlotKey(deck.content, teamIndex, slotIndex);
        const character = findCharacter(id);
        const member = overrides[slotKey] ?? (character ? deckMemberFromCharacter(deck.content, character) : null);
        return member ? { slotKey, member } : null;
      })
      .filter((slot): slot is { slotKey: string; member: PvpDeckMember } => Boolean(slot)),
  }));
  const members = teams.flatMap((team) => team.members);
  const score = averageMemberScore(members.map((slot) => slot.member));
  const restrictedCount = members.filter((slot) => restrictedIds.has(slot.member.id)).length;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-red-600">{deck.label}</p>
          <h3 className="text-xl font-black text-slate-950">{gradeForScore(score)} · {score.toFixed(1)}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${restrictedCount ? 'bg-red-600 text-white' : 'bg-slate-950 text-white'}`}>
          {restrictedCount ? `제한 ${restrictedCount}` : `${members.length}명`}
        </span>
      </div>
      <div className="grid gap-3">
        {teams.map((team) => (
          <div key={team.label} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black text-slate-500">{team.label}</p>
              <p className="text-xs font-black text-slate-950">{averageMemberScore(team.members.map((slot) => slot.member)).toFixed(1)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {team.members.map(({ slotKey, member }) => {
                const restricted = restrictedIds.has(member.id);
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => onOpenPicker({ slotKey, label: `${deck.label} · ${team.label}`, current: member })}
                    className={`rounded-2xl p-2 text-center ring-1 transition hover:ring-red-300 ${member.id === selectedId ? 'bg-purple-50 ring-purple-200' : restricted ? 'bg-red-50 ring-red-200' : 'bg-white ring-slate-100'}`}
                    aria-label={`${member.name} 덱 캐릭터 교체`}
                  >
                    <div className="relative mx-auto h-14 w-14 overflow-hidden rounded-2xl">
                      <Image src={member.uniformImageUrl ?? member.portraitUrl} alt={member.name} fill sizes="56px" unoptimized className="object-cover" onError={(event) => imageFallback(event, member.name)} />
                    </div>
                    <p className="mt-2 truncate text-xs font-black text-slate-950">{member.name}</p>
                    {member.uniformName ? <p className="truncate text-[10px] font-bold text-red-600">{member.uniformName}</p> : null}
                    <p className={`text-xs font-black ${restricted ? 'text-red-600' : 'text-slate-600'}`}>{restricted ? '제한' : member.score ? member.score.toFixed(0) : '-'}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-bold leading-relaxed text-slate-500">{deck.note}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {deck.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">#{tag}</span>)}
      </div>
    </article>
  );
}

export function PvpModeSection({
  content,
  selectedId,
  setSelectedId,
}: {
  content: PvpScoreContent;
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  const topScore = useMemo(() => Math.max(...characters.map((character) => character.scores[content])), [content]);
  const mode = pvpScoreModes.find((item) => item.content === content)!;
  const rule = pvpModeRules.find((item) => item.content === content)!;
  const decks = pvpDecks.filter((deck) => deck.content === content);
  const average = Math.round((characters.reduce((sum, character) => sum + character.scores[content], 0) / characters.length) * 10) / 10;
  const { restrictions, restrictedIds, addRestriction, removeRestriction, clearRestrictions } = usePvpRestrictionOverrides(content, rule.restrictionCharacters);
  const { overrides, setOverride, clearOverrides } = usePvpDeckOverrides(content);
  const [restrictionPickerOpen, setRestrictionPickerOpen] = useState(false);
  const [deckPicker, setDeckPicker] = useState<DeckPickerState>(null);

  const selectDeckMember = (member: PvpDeckMember) => {
    if (!deckPicker) return;
    setOverride(deckPicker.slotKey, member);
    if (findCharacter(member.id)) setSelectedId(member.id);
    setDeckPicker(null);
  };

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-red-600">{modeCopy[content].eyebrow}</p>
            <h2 className="text-2xl font-black text-slate-950">{modeCopy[content].title}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{modeCopy[content].note}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className={`rounded-2xl px-4 py-3 ring-1 ${mode.accent}`}>
              <p className="text-xs font-black">{mode.shortLabel}</p>
              <p className="text-xl font-black">{average}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-black">TOP1</p>
              <p className="text-xl font-black">{Number.isFinite(topScore) ? topScore.toFixed(0) : '-'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <div>
            <p className="text-sm font-black text-red-600">룰 / 제한 인식</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{rule.formation}</h3>
            <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500">{rule.leaguePolicy}</p>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-400">{rule.restrictionSummary}</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {restrictions.map((restricted) => {
              const character = findCharacter(restricted.id);
              const imageUrl = getRestrictionImage(restricted, character);
              return (
                <article key={restricted.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex items-center gap-3">
                    {imageUrl ? (
                      <span className="relative h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-red-100">
                        <Image src={imageUrl} alt={restricted.name} fill sizes="44px" unoptimized className="object-cover" onError={(event) => imageFallback(event, restricted.name)} />
                      </span>
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-200 text-xs font-black text-slate-500">?</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{restricted.name}</p>
                      <p className="truncate text-[10px] font-black text-red-600">{restricted.kind}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">{restricted.note}</p>
                </article>
              );
            })}
            {restrictions.length === 0 ? (
              <article className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-sm font-black text-slate-950">제한 목록 없음</p>
                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">캐릭터 선택 버튼에서 이번 주/이번 시즌 제한 캐릭터를 추가하세요.</p>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <RestrictionEditor
        restrictions={restrictions}
        removeRestriction={removeRestriction}
        clearRestrictions={clearRestrictions}
        onOpenPicker={() => setRestrictionPickerOpen(true)}
      />

      <div className="flex justify-end">
        <button type="button" onClick={clearOverrides} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 hover:text-red-600">덱 초기화</button>
      </div>
      <section className="grid gap-4 xl:grid-cols-3">
        {decks.map((deck) => (
          <DeckCard
            key={deck.content}
            deck={deck}
            selectedId={selectedId}
            restrictedIds={restrictedIds}
            overrides={overrides}
            onOpenPicker={setDeckPicker}
          />
        ))}
      </section>

      {restrictionPickerOpen ? (
        <RestrictionPickerPanel
          content={content}
          restrictedIds={restrictedIds}
          onSelect={addRestriction}
          onClose={() => setRestrictionPickerOpen(false)}
        />
      ) : null}
      {deckPicker ? (
        <DeckMemberPickerPanel
          content={content}
          picker={deckPicker}
          onSelect={selectDeckMember}
          onClose={() => setDeckPicker(null)}
        />
      ) : null}
    </section>
  );
}
