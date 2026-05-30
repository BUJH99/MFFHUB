'use client';

import Image from 'next/image';
import { Ban, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { characters, pvpDecks, pvpModeRules } from '@/lib/data';
import {
  buildCatalogCharacterOptions,
  catalogFallbackUniform,
  normalizeCatalogPickerKey,
  type CatalogCharacterPickerOption,
} from '@/lib/catalogCharacterPicker';
import { usePvpRestrictionOverrides, type PvpRestrictionCharacter } from '@/lib/pvpRestrictions';
import { type PvpScoreContent } from '@/lib/scoreDisplay';
import { catalogCharacters, type CatalogUniform } from '@mff-data-hub/data';
import type { Character } from '@mff-data-hub/types';

type PvpDeckMember = {
  id: string;
  catalogId?: string;
  name: string;
  portraitUrl: string;
  uniformName?: string;
  uniformImageUrl?: string;
};
type PvpDeckOverrideStore = Partial<Record<PvpScoreContent, Record<string, PvpDeckMember>>>;
type DeckPickerState = {
  slotKey: string;
  label: string;
  current: PvpDeckMember;
} | null;
type PvpDeck = (typeof pvpDecks)[number];
type BuiltDeckSlot = {
  slotKey: string;
  member: PvpDeckMember | null;
  teamIndex: number;
  slotIndex: number;
  fallbackId: string;
};
type PvpDeckRow = {
  rowKey: string;
  rowLabel?: string;
  tierIds?: readonly TeamBattleTierId[];
  members: BuiltDeckSlot[];
};
type PvpModeRule = {
  content: PvpScoreContent;
  formation: string;
  teamCount: number;
  membersPerTeam: number;
  leaguePolicy: string;
  restrictionSummary: string;
  sourceUrl: string;
  restrictionCharacters: readonly { id: string; name: string; kind: string; note: string }[];
};
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => void;
};
type ViewTransitionStyle = CSSProperties & {
  viewTransitionName?: string;
};

const TEAM_BATTLE_RESTRICTION_SLOT_COUNT = 5;
const TEAM_BATTLE_TEAM_COUNT = 5;
const TEAM_BATTLE_MEMBERS_PER_TEAM = 3;
const TEAM_BATTLE_TIERS = [
  { id: 'bronze', label: 'Bronze', iconUrl: '/mff-assets/pvp/tier-bronze.svg', tone: 'text-amber-700' },
  { id: 'silver', label: 'Silver', iconUrl: '/mff-assets/pvp/tier-silver.svg', tone: 'text-slate-600' },
  { id: 'gold', label: 'Gold', iconUrl: '/mff-assets/pvp/tier-gold.svg', tone: 'text-yellow-700' },
  { id: 'platinum', label: 'Platinum', iconUrl: '/mff-assets/pvp/tier-platinum.svg', tone: 'text-cyan-700' },
  { id: 'vibranium', label: 'Vibranium', iconUrl: '/mff-assets/pvp/tier-vibranium.svg', tone: 'text-red-600' },
  { id: 'challenger', label: 'Challenger', iconUrl: '/mff-assets/pvp/tier-challenger.svg', tone: 'text-purple-700' },
] as const;
type TeamBattleTierId = (typeof TEAM_BATTLE_TIERS)[number]['id'];
type TeamBattleTier = (typeof TEAM_BATTLE_TIERS)[number];

const pvpArenaTitles: Record<PvpScoreContent, string> = {
  Otherworld: 'OTHERWORLD',
  'Timeline Battle': 'TIMELINE BATTLE',
  'Team Battle Arena': 'TEAM BATTLE ARENA',
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

function runPvpViewTransition(update: () => void) {
  if (typeof document === 'undefined') {
    update();
    return;
  }

  const transitionDocument = document as ViewTransitionDocument;
  if (typeof transitionDocument.startViewTransition === 'function') {
    transitionDocument.startViewTransition(() => flushSync(update));
    return;
  }

  update();
}

function getPvpRowViewTransitionName(rowKey: string) {
  return `tba-best-${rowKey.replace(/[^a-z0-9_-]/gi, '-')}`;
}

function getPvpTier(tierId: TeamBattleTierId) {
  return TEAM_BATTLE_TIERS.find((tier) => tier.id === tierId) ?? TEAM_BATTLE_TIERS[0];
}

function PvpTierIconStrip({
  tierIds,
  ariaLabel,
  size = 24,
}: {
  tierIds: readonly TeamBattleTierId[];
  ariaLabel: string;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={ariaLabel} title={ariaLabel}>
      {tierIds.map((tierId) => {
        const tier = getPvpTier(tierId);
        return (
          <Image
            key={tier.id}
            src={tier.iconUrl}
            alt={tier.label}
            width={size}
            height={size}
            unoptimized
            className="shrink-0 drop-shadow-sm"
          />
        );
      })}
    </span>
  );
}

function PvpDeckRowBadge({ row }: { row: PvpDeckRow }) {
  if (row.tierIds?.length) {
    return <PvpTierIconStrip tierIds={row.tierIds} ariaLabel={row.rowLabel ?? 'PVP 등급 덱'} size={26} />;
  }

  if (!row.rowLabel) return null;
  return <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-600 ring-1 ring-red-100">{row.rowLabel}</span>;
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

function deckMemberFromCharacter(character: Character): PvpDeckMember {
  const option = baseCatalogOptionByAppId.get(character.id);
  const uniform = option?.uniforms[0];

  return {
    id: character.id,
    catalogId: option?.catalogCharacter.id,
    name: option?.displayName ?? character.name,
    portraitUrl: uniform?.imageUrl ?? option?.imageUrl ?? character.portraitUrl,
    uniformName: uniform?.name,
    uniformImageUrl: uniform?.imageUrl,
  };
}

function deckMemberFromSelection(option: CatalogCharacterPickerOption, uniform: CatalogUniform): PvpDeckMember {
  const appCharacter = option.appCharacter;
  const catalogCharacter = option.catalogCharacter;
  return {
    id: appCharacter?.id ?? `catalog-${catalogCharacter.id}`,
    catalogId: catalogCharacter.id,
    name: option.displayName,
    portraitUrl: uniform.imageUrl ?? catalogCharacter.imageUrl,
    uniformName: uniform.name,
    uniformImageUrl: uniform.imageUrl,
  };
}

function buildDeckSlotsFromIds(content: PvpScoreContent, memberIds: readonly string[], teamIndex: number, overrides: Record<string, PvpDeckMember>) {
  return memberIds.map((id, slotIndex): BuiltDeckSlot => {
    const slotKey = makeDeckSlotKey(content, teamIndex, slotIndex);
    const character = findCharacter(id);
    const member = overrides[slotKey] ?? (character ? deckMemberFromCharacter(character) : null);
    return { slotKey, member, teamIndex, slotIndex, fallbackId: id };
  });
}

function buildDeckTeams(deck: PvpDeck, overrides: Record<string, PvpDeckMember>) {
  return deck.teams.map((deckTeam, teamIndex) => ({
    members: buildDeckSlotsFromIds(deck.content, deckTeam.memberIds, teamIndex, overrides),
  }));
}

function getPvpDeckRows(content: PvpScoreContent, deck: PvpDeck, overrides: Record<string, PvpDeckMember>): PvpDeckRow[] {
  if (content === 'Otherworld') {
    const baseMemberIds = deck.teams[0]?.memberIds ?? [];
    return [
      {
        rowKey: 'otherworld-bronze-platinum',
        rowLabel: '브론즈~플래 덱',
        tierIds: ['bronze', 'silver', 'gold', 'platinum'],
        members: buildDeckSlotsFromIds(content, baseMemberIds, 0, overrides),
      },
      {
        rowKey: 'otherworld-vibranium-challenger',
        rowLabel: '비브라늄~챌린저 덱',
        tierIds: ['vibranium', 'challenger'],
        members: buildDeckSlotsFromIds(content, baseMemberIds, 1, overrides),
      },
    ];
  }

  return buildDeckTeams(deck, overrides).map((deckRow, rowIndex) => ({
    rowKey: `${content}-row-${rowIndex}`,
    members: deckRow.members,
  }));
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
      includeUniformSearch: false,
    });
  }, []);

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
  picker,
  onSelect,
  onClose,
}: {
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
    });
  }, []);

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
    onSelect(deckMemberFromSelection(selectedOption, uniform));
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

function TeamBattleTierButton({
  currentTier,
  selectedTierId,
  onSelectTier,
}: {
  currentTier: TeamBattleTier;
  selectedTierId: TeamBattleTierId;
  onSelectTier: (tierId: TeamBattleTierId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full md:w-[150px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50"
        aria-label={`현재 티어: ${currentTier.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Image src={currentTier.iconUrl} alt="" width={28} height={28} unoptimized className="h-7 w-7 shrink-0" />
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase text-slate-400">현재 티어</span>
          <span className={`block truncate text-xs font-black ${currentTier.tone}`}>{currentTier.label}</span>
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 grid w-full gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" role="menu">
          {TEAM_BATTLE_TIERS.map((tier) => {
            const active = tier.id === selectedTierId;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  onSelectTier(tier.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left transition ${active ? 'bg-red-50' : 'hover:bg-slate-50'}`}
                role="menuitem"
                aria-label={`${tier.label} 티어 선택`}
              >
                <Image src={tier.iconUrl} alt="" width={24} height={24} unoptimized className="h-6 w-6 shrink-0" />
                <span className={`truncate text-xs font-black ${tier.tone}`}>{tier.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TeamBattleRestrictionPanel({
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
  const slots = Array.from(
    { length: Math.max(TEAM_BATTLE_RESTRICTION_SLOT_COUNT, restrictions.length + 1) },
    (_, index) => restrictions[index] ?? null,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-950">캐릭터 제한 목록</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPicker}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-600"
            aria-label="제한 캐릭터 추가"
            title="제한 캐릭터 추가"
          >
            <Plus size={18} />
          </button>
          {restrictions.length ? (
            <button
              type="button"
              onClick={clearRestrictions}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-600"
              aria-label="제한 목록 초기화"
              title="제한 목록 초기화"
            >
              <RotateCcw size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 md:gap-4">
        {slots.map((restriction, index) => {
          const character = restriction ? findCharacter(restriction.id) : undefined;
          const imageUrl = restriction ? getRestrictionImage(restriction, character) : undefined;
          return (
            <div key={restriction?.id ?? `empty-restriction-${index}`} className="relative">
              <button
                type="button"
                onClick={onOpenPicker}
                className="grid aspect-square w-full place-items-center rounded-lg border border-slate-300 bg-white p-2 text-center shadow-sm transition hover:border-red-300 hover:bg-red-50"
                aria-label={restriction ? `${restriction.name} 제한 캐릭터 변경` : `제한 캐릭터 슬롯 ${index + 1} 선택`}
              >
                {restriction && imageUrl ? (
                  <span className="grid min-w-0 place-items-center gap-2">
                    <span className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100 ring-1 ring-red-100 md:h-16 md:w-16">
                      <Image src={imageUrl} alt={restriction.name} fill sizes="64px" unoptimized className="object-cover" onError={(event) => imageFallback(event, restriction.name)} />
                    </span>
                    <span className="max-w-full truncate text-xs font-black text-slate-950">{restriction.name}</span>
                    <span className="text-[11px] font-black text-red-600">선택 불가</span>
                  </span>
                ) : (
                  <span className="grid place-items-center gap-2 text-slate-400">
                    <Ban size={38} strokeWidth={1.8} className="md:h-14 md:w-14" />
                    <span className="text-xs font-black md:text-sm">선택 불가</span>
                  </span>
                )}
              </button>
              {restriction ? (
                <button
                  type="button"
                  onClick={() => removeRestriction(restriction.id)}
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white text-red-600 shadow-sm ring-1 ring-red-100 transition hover:bg-red-600 hover:text-white"
                  aria-label={`${restriction.name} 제한 삭제`}
                  title="제한 삭제"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PvpModeDeckBoard({
  content,
  title,
  teamCount,
  membersPerTeam,
  deck,
  selectedId,
  restrictedIds,
  overrides,
  onOpenPicker,
  onClearOverrides,
}: {
  content: PvpScoreContent;
  title: string;
  teamCount: number;
  membersPerTeam: number;
  deck?: PvpDeck;
  selectedId: string;
  restrictedIds: Set<string>;
  overrides: Record<string, PvpDeckMember>;
  onOpenPicker: (picker: Exclude<DeckPickerState, null>) => void;
  onClearOverrides: () => void;
}) {
  const gridClass = membersPerTeam === 5 ? 'grid-cols-5' : 'grid-cols-3';
  const deckRows = deck ? getPvpDeckRows(content, deck, overrides) : [];
  const rowCount = Math.max(content === 'Otherworld' ? 2 : teamCount, deckRows.length);
  const rows = Array.from({ length: rowCount }, (_, teamIndex): PvpDeckRow => {
    const deckRow = deckRows[teamIndex];
    return {
      rowKey: deckRow?.rowKey ?? `${content}-empty-row-${teamIndex}`,
      rowLabel: deckRow?.rowLabel,
      tierIds: deckRow?.tierIds,
      members: Array.from({ length: membersPerTeam }, (_, slotIndex): BuiltDeckSlot => {
        return deckRow?.members[slotIndex] ?? {
          slotKey: makeDeckSlotKey(content, teamIndex, slotIndex),
          member: null,
          teamIndex,
          slotIndex,
          fallbackId: '',
        };
      }),
    };
  });

  const slotPickerLabel = (slot: BuiltDeckSlot, rowLabel?: string) => {
    if (rowLabel) return `${content} · ${rowLabel} ${slot.slotIndex + 1}번 슬롯`;
    return `${content} · ${slot.teamIndex + 1}-${slot.slotIndex + 1}`;
  };

  return (
    <section className="space-y-4 border-t border-slate-300 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-950">{title}</h2>
        <button
          type="button"
          onClick={onClearOverrides}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-600"
          aria-label="덱 초기화"
          title="덱 초기화"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.rowKey} className="space-y-2">
            {row.rowLabel ? (
              <div className="flex items-center justify-between gap-2">
                <PvpDeckRowBadge row={row} />
                <span className="text-[11px] font-black text-slate-400">{row.members.length}명</span>
              </div>
            ) : null}
            <div className={`grid ${gridClass} gap-2 md:gap-3`}>
              {row.members.map((slot) => {
                const member = slot.member;
                const restricted = member ? restrictedIds.has(member.id) : false;
                const active = member ? member.id === selectedId : false;
                return (
                  <button
                    key={slot.slotKey}
                    type="button"
                    onClick={() => {
                      if (!member) return;
                      onOpenPicker({ slotKey: slot.slotKey, label: slotPickerLabel(slot, row.rowLabel), current: member });
                    }}
                    className={`relative flex min-h-[78px] items-center justify-start rounded-2xl border p-2.5 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50 md:min-h-[96px] ${
                      active ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-100' : restricted ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                    }`}
                    aria-label={member ? `${member.name} 덱 캐릭터 교체` : `팀 ${slot.teamIndex + 1} 슬롯 ${slot.slotIndex + 1} 선택`}
                  >
                    {member ? (
                      <span className="flex min-w-0 items-center gap-2 md:gap-3">
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 md:h-14 md:w-14">
                          <Image src={member.uniformImageUrl ?? member.portraitUrl} alt={member.name} fill sizes="56px" unoptimized className="object-cover" onError={(event) => imageFallback(event, member.name)} />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-xs font-black text-slate-950 md:text-sm">{member.name}</span>
                          {member.uniformName ? <span className="mt-0.5 block truncate text-[10px] font-bold text-red-600">{member.uniformName}</span> : null}
                          {restricted ? <span className="mt-0.5 block truncate text-[10px] font-black text-red-600">제한</span> : null}
                        </span>
                      </span>
                    ) : (
                      <span className="grid w-full place-items-center">
                        <Plus size={30} strokeWidth={1.8} className="text-slate-300 md:h-9 md:w-9" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PvpBestIconButton({
  slot,
  pickerLabel,
  selectedId,
  restrictedIds,
  onOpenPicker,
}: {
  slot: BuiltDeckSlot;
  pickerLabel: string;
  selectedId: string;
  restrictedIds: Set<string>;
  onOpenPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  const member = slot.member;
  const restricted = member ? restrictedIds.has(member.id) : false;
  const active = member ? member.id === selectedId : false;

  return (
    <button
      type="button"
      onClick={() => {
        if (!member) return;
        onOpenPicker({ slotKey: slot.slotKey, label: pickerLabel, current: member });
      }}
      className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md md:h-12 md:w-12 ${
        active ? 'border-red-400 ring-2 ring-red-100' : restricted ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 ring-1 ring-slate-100'
      }`}
      aria-label={member ? `${member.name} BEST 슬롯 교체` : pickerLabel}
      title={member ? `${member.name}${member.uniformName ? ` · ${member.uniformName}` : ''}` : pickerLabel}
    >
      {member ? (
        <>
          <Image src={member.uniformImageUrl ?? member.portraitUrl} alt={member.name} fill sizes="48px" unoptimized className="object-cover" onError={(event) => imageFallback(event, member.name)} />
          {restricted ? <span className="absolute inset-0 rounded-full bg-red-600/20 ring-2 ring-inset ring-red-500" aria-hidden="true" /> : null}
        </>
      ) : (
        <Plus size={18} strokeWidth={1.8} className="text-slate-300" />
      )}
    </button>
  );
}

function PvpBestIconRow({
  row,
  rowLabel,
  selectedId,
  restrictedIds,
  onOpenPicker,
}: {
  row: PvpDeckRow;
  rowLabel?: string;
  selectedId: string;
  restrictedIds: Set<string>;
  onOpenPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {row.members.map((slot) => (
        <PvpBestIconButton
          key={slot.slotKey}
          slot={slot}
          pickerLabel={rowLabel ? `BEST · ${rowLabel} ${slot.slotIndex + 1}번 슬롯` : `BEST · ${slot.teamIndex + 1}-${slot.slotIndex + 1} 슬롯`}
          selectedId={selectedId}
          restrictedIds={restrictedIds}
          onOpenPicker={onOpenPicker}
        />
      ))}
    </div>
  );
}

function PvpBestDeckPanel({
  content,
  deck,
  selectedId,
  restrictedIds,
  overrides,
  onOpenPicker,
}: {
  content: PvpScoreContent;
  deck?: PvpDeck;
  selectedId: string;
  restrictedIds: Set<string>;
  overrides: Record<string, PvpDeckMember>;
  onOpenPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  const rows = deck ? getPvpDeckRows(content, deck, overrides) : [];
  const slotCount = rows.reduce((count, row) => count + row.members.length, 0);

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:sticky xl:top-4" aria-label={`${pvpArenaTitles[content]} BEST`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-red-600">BEST</h2>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">{slotCount}명</span>
      </div>

      <div className="grid gap-3">
        {rows.map((row, rowIndex) => {
          const rowLabel = row.rowLabel ?? `${rowIndex + 1}행`;
          return (
            <div key={row.rowKey} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                {row.tierIds?.length ? <PvpDeckRowBadge row={row} /> : <span className="text-[11px] font-black text-slate-500">{row.rowLabel ?? 'BEST'}</span>}
                <span className="text-[10px] font-black text-red-600">{row.members.length}명</span>
              </div>
              <PvpBestIconRow row={row} rowLabel={rowLabel} selectedId={selectedId} restrictedIds={restrictedIds} onOpenPicker={onOpenPicker} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function TeamBattleBestDeckPanel({
  deck,
  selectedId,
  restrictedIds,
  overrides,
  onOpenPicker,
}: {
  deck?: PvpDeck;
  selectedId: string;
  restrictedIds: Set<string>;
  overrides: Record<string, PvpDeckMember>;
  onOpenPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  const [strongestTeamKey, setStrongestTeamKey] = useState<string | null>(null);
  const [rowOrder, setRowOrder] = useState<string[]>([]);
  const [draggingTeamKey, setDraggingTeamKey] = useState<string | null>(null);
  const rows = useMemo(() => (deck ? getPvpDeckRows('Team Battle Arena', deck, overrides) : []), [deck, overrides]);
  const rowKeysSignature = rows.map((row) => row.rowKey).join('|');
  const rowByKey = new Map(rows.map((row) => [row.rowKey, row]));
  const activeRowOrder = rowOrder.length ? rowOrder : rows.map((row) => row.rowKey);
  const orderedRows = activeRowOrder.map((rowKey) => rowByKey.get(rowKey)).filter((row): row is PvpDeckRow => Boolean(row));
  const strongestRow = orderedRows.find((row) => row.rowKey === strongestTeamKey) ?? orderedRows[0];
  const strongestTeamIndex = Math.max(0, orderedRows.findIndex((row) => row.rowKey === strongestRow?.rowKey));

  useEffect(() => {
    const rowKeys = rowKeysSignature ? rowKeysSignature.split('|') : [];
    setRowOrder((previousOrder) => {
      const validKeys = previousOrder.filter((rowKey) => rowKeys.includes(rowKey));
      const missingKeys = rowKeys.filter((rowKey) => !validKeys.includes(rowKey));
      const nextOrder = [...validKeys, ...missingKeys];
      if (nextOrder.length === previousOrder.length && nextOrder.every((rowKey, index) => rowKey === previousOrder[index])) return previousOrder;
      return nextOrder;
    });
    setStrongestTeamKey((previousKey) => (previousKey && rowKeys.includes(previousKey) ? previousKey : rowKeys[0] ?? null));
  }, [rowKeysSignature]);

  const moveTeamRow = useCallback((sourceKey: string, targetKey: string) => {
    if (!sourceKey || sourceKey === targetKey) return;
    runPvpViewTransition(() => {
      setRowOrder((previousOrder) => {
        const nextOrder = previousOrder.length ? [...previousOrder] : rows.map((row) => row.rowKey);
        const sourceIndex = nextOrder.indexOf(sourceKey);
        const targetIndex = nextOrder.indexOf(targetKey);
        if (sourceIndex < 0 || targetIndex < 0) return previousOrder;

        const [movedKey] = nextOrder.splice(sourceIndex, 1);
        const targetIndexAfterRemoval = nextOrder.indexOf(targetKey);
        const insertionIndex = sourceIndex < targetIndex ? targetIndexAfterRemoval + 1 : targetIndexAfterRemoval;
        nextOrder.splice(insertionIndex, 0, movedKey);

        if (nextOrder.every((rowKey, index) => rowKey === previousOrder[index])) return previousOrder;
        return nextOrder;
      });
    });
  }, [rows]);

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:sticky xl:top-4" aria-label="TEAM BATTLE ARENA BEST">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-red-600">BEST</h2>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">{rows.length}행</span>
      </div>

      {strongestRow ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-red-600">가장 강한팀</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-red-600 ring-1 ring-red-100">{strongestTeamIndex + 1}행</span>
          </div>
          <PvpBestIconRow row={strongestRow} rowLabel={`${strongestTeamIndex + 1}행 대표`} selectedId={selectedId} restrictedIds={restrictedIds} onOpenPicker={onOpenPicker} />
        </div>
      ) : null}

      <div className="grid gap-2">
        {orderedRows.map((row, teamIndex) => {
          const selectedStrongest = row.rowKey === strongestRow?.rowKey;
          return (
            <div
              key={row.rowKey}
              draggable
              data-row-key={row.rowKey}
              role="button"
              tabIndex={0}
              aria-label={`팀 ${teamIndex + 1} BEST 행 드래그`}
              style={{ viewTransitionName: getPvpRowViewTransitionName(row.rowKey) } as ViewTransitionStyle}
              onClick={() => setStrongestTeamKey(row.rowKey)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setStrongestTeamKey(row.rowKey);
                }
              }}
              onDragStart={(event) => {
                setDraggingTeamKey(row.rowKey);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', row.rowKey);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                const sourceKey = event.dataTransfer.getData('text/plain') || draggingTeamKey;
                if (sourceKey) moveTeamRow(sourceKey, row.rowKey);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceKey = event.dataTransfer.getData('text/plain') || draggingTeamKey;
                if (sourceKey) moveTeamRow(sourceKey, row.rowKey);
                setDraggingTeamKey(null);
              }}
              onDragEnd={() => setDraggingTeamKey(null)}
              className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-[transform,opacity,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none ${
                selectedStrongest ? 'border-red-300 bg-red-50/80 shadow-sm' : 'border-slate-200 bg-slate-50/70'
              } ${draggingTeamKey === row.rowKey ? 'opacity-60 ring-2 ring-red-100' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${selectedStrongest ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`} aria-hidden="true">
                <span className="grid gap-0.5">
                  <span className="h-1 w-4 rounded-full bg-current" />
                  <span className="h-1 w-4 rounded-full bg-current" />
                  <span className="h-1 w-4 rounded-full bg-current" />
                </span>
              </span>
              <PvpBestIconRow row={row} rowLabel={`${teamIndex + 1}행`} selectedId={selectedId} restrictedIds={restrictedIds} onOpenPicker={onOpenPicker} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function PvpModeArenaLayout({
  content,
  modeTitle,
  rule,
  headerLead,
  bestPanel,
  deck,
  selectedId,
  restrictedIds,
  restrictions,
  overrides,
  removeRestriction,
  clearRestrictions,
  clearOverrides,
  onOpenRestrictionPicker,
  onOpenDeckPicker,
}: {
  content: PvpScoreContent;
  modeTitle: string;
  rule: PvpModeRule;
  headerLead: ReactNode;
  bestPanel: ReactNode;
  deck?: PvpDeck;
  selectedId: string;
  restrictedIds: Set<string>;
  restrictions: PvpRestrictionCharacter[];
  overrides: Record<string, PvpDeckMember>;
  removeRestriction: (id: string) => void;
  clearRestrictions: () => void;
  clearOverrides: () => void;
  onOpenRestrictionPicker: () => void;
  onOpenDeckPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  const deckTitle = '덱 구성';

  return (
    <section className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] xl:items-start">
      <section className="space-y-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-3 md:grid-cols-[150px_minmax(0,1fr)_150px] md:items-center">
          {headerLead}
          <h1 className="text-center text-3xl font-black text-red-600 md:text-4xl 2xl:text-5xl" style={{ fontFamily: 'Pretendard, system-ui, sans-serif' }}>{modeTitle}</h1>
          <span className="hidden md:block" aria-hidden="true" />
        </div>
        {content !== 'Team Battle Arena' ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-relaxed text-slate-500 ring-1 ring-slate-200">
            {rule.restrictionSummary}
          </div>
        ) : null}
        <TeamBattleRestrictionPanel
          restrictions={restrictions}
          removeRestriction={removeRestriction}
          clearRestrictions={clearRestrictions}
          onOpenPicker={onOpenRestrictionPicker}
        />
        <PvpModeDeckBoard
          content={content}
          title={deckTitle}
          teamCount={rule.teamCount}
          membersPerTeam={rule.membersPerTeam}
          deck={deck}
          selectedId={selectedId}
          restrictedIds={restrictedIds}
          overrides={overrides}
          onOpenPicker={onOpenDeckPicker}
          onClearOverrides={clearOverrides}
        />
      </section>
      {bestPanel}
    </section>
  );
}

function TeamBattleArenaLayout({
  rule,
  deck,
  selectedId,
  restrictedIds,
  restrictions,
  overrides,
  removeRestriction,
  clearRestrictions,
  clearOverrides,
  onOpenRestrictionPicker,
  onOpenDeckPicker,
}: {
  rule: PvpModeRule;
  deck?: PvpDeck;
  selectedId: string;
  restrictedIds: Set<string>;
  restrictions: PvpRestrictionCharacter[];
  overrides: Record<string, PvpDeckMember>;
  removeRestriction: (id: string) => void;
  clearRestrictions: () => void;
  clearOverrides: () => void;
  onOpenRestrictionPicker: () => void;
  onOpenDeckPicker: (picker: Exclude<DeckPickerState, null>) => void;
}) {
  const [selectedTierId, setSelectedTierId] = useState<TeamBattleTierId>('vibranium');
  const currentTier = TEAM_BATTLE_TIERS.find((tier) => tier.id === selectedTierId) ?? TEAM_BATTLE_TIERS[4];
  const teamBattleRule = { ...rule, teamCount: TEAM_BATTLE_TEAM_COUNT, membersPerTeam: TEAM_BATTLE_MEMBERS_PER_TEAM };

  return (
    <PvpModeArenaLayout
      content="Team Battle Arena"
      modeTitle="TEAM BATTLE ARENA"
      rule={teamBattleRule}
      headerLead={<TeamBattleTierButton currentTier={currentTier} selectedTierId={selectedTierId} onSelectTier={setSelectedTierId} />}
      bestPanel={<TeamBattleBestDeckPanel deck={deck} selectedId={selectedId} restrictedIds={restrictedIds} overrides={overrides} onOpenPicker={onOpenDeckPicker} />}
      deck={deck}
      selectedId={selectedId}
      restrictedIds={restrictedIds}
      restrictions={restrictions}
      overrides={overrides}
      removeRestriction={removeRestriction}
      clearRestrictions={clearRestrictions}
      clearOverrides={clearOverrides}
      onOpenRestrictionPicker={onOpenRestrictionPicker}
      onOpenDeckPicker={onOpenDeckPicker}
    />
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
  const rule = pvpModeRules.find((item) => item.content === content)!;
  const decks = pvpDecks.filter((deck) => deck.content === content);
  const { restrictions, restrictedIds, addRestriction, removeRestriction, clearRestrictions } = usePvpRestrictionOverrides(content, rule.restrictionCharacters);
  const { overrides, setOverride, clearOverrides } = usePvpDeckOverrides(content);
  const [restrictionPickerOpen, setRestrictionPickerOpen] = useState(false);
  const [deckPicker, setDeckPicker] = useState<DeckPickerState>(null);
  const [selectedTierId, setSelectedTierId] = useState<TeamBattleTierId>('vibranium');
  const currentTier = getPvpTier(selectedTierId);

  const selectDeckMember = (member: PvpDeckMember) => {
    if (!deckPicker) return;
    setOverride(deckPicker.slotKey, member);
    if (findCharacter(member.id)) setSelectedId(member.id);
    setDeckPicker(null);
  };

  const pickerPanels = (
    <>
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
          picker={deckPicker}
          onSelect={selectDeckMember}
          onClose={() => setDeckPicker(null)}
        />
      ) : null}
    </>
  );

  if (content === 'Team Battle Arena') {
    return (
      <section className="space-y-5">
        <TeamBattleArenaLayout
          rule={rule}
          deck={decks[0]}
          selectedId={selectedId}
          restrictedIds={restrictedIds}
          restrictions={restrictions}
          overrides={overrides}
          removeRestriction={removeRestriction}
          clearRestrictions={clearRestrictions}
          clearOverrides={clearOverrides}
          onOpenRestrictionPicker={() => setRestrictionPickerOpen(true)}
          onOpenDeckPicker={setDeckPicker}
        />
        {pickerPanels}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <PvpModeArenaLayout
        content={content}
        modeTitle={pvpArenaTitles[content]}
        rule={rule}
        headerLead={<TeamBattleTierButton currentTier={currentTier} selectedTierId={selectedTierId} onSelectTier={setSelectedTierId} />}
        bestPanel={<PvpBestDeckPanel content={content} deck={decks[0]} selectedId={selectedId} restrictedIds={restrictedIds} overrides={overrides} onOpenPicker={setDeckPicker} />}
        deck={decks[0]}
        selectedId={selectedId}
        restrictedIds={restrictedIds}
        restrictions={restrictions}
        overrides={overrides}
        removeRestriction={removeRestriction}
        clearRestrictions={clearRestrictions}
        clearOverrides={clearOverrides}
        onOpenRestrictionPicker={() => setRestrictionPickerOpen(true)}
        onOpenDeckPicker={setDeckPicker}
      />

      {pickerPanels}
    </section>
  );
}
