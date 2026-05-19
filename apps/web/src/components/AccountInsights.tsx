'use client';

import { account, characters, userRoster } from '@/lib/data';
import {
  craftColors,
  craftStatOptions,
  createDefaultCardSlots,
  createDefaultCraftState,
  type CalculatedComicCard,
  normalizeCardSlots,
  premiumComicCards,
  summarizeComicCardSlots,
  type CardOptionSlot,
  type CraftColor,
  type EditableComicCardSlot,
} from '@/lib/comicCardEditor';
import {
  createDefaultXSwordSlots,
  getXSwordOptionDefinition,
  normalizeXSwordSlots,
  summarizeXSwordSlots,
  xSwordOptionDefinitions,
  type EditableXSwordOption,
  type EditableXSwordSlot,
  type XSwordOptionId,
} from '@/lib/xSwordEditor';
import {
  clampTeamUpLevel,
  createDefaultTeamUpCollections,
  normalizeTeamUpCollections,
  summarizeTeamUpCollections,
  updateTeamUpCollectionLevel,
  type EditableTeamUpCollection,
} from '@/lib/teamUpEditor';
import { rosterCoverage } from '@mff-data-hub/core';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTeamUpTheme,
  getXSwordElement,
  statLabel,
  type AccountStatKey,
  type ComicCardDefinition,
  type StatBlock,
} from '@mff-data-hub/account';
import { BookOpen, ExternalLink, RotateCcw, Swords, TrendingUp, Users } from 'lucide-react';

const cardEditorStorageKey = 'mff-data-hub:comic-card-editor:v1';
const cardEditorCookieKey = 'mff_comic_card_editor_v1';
const cardEditorHashKey = 'cards';
const xSwordEditorStorageKey = 'mff-data-hub:x-sword-editor:v1';
const xSwordEditorCookieKey = 'mff_x_sword_editor_v1';
const xSwordEditorHashKey = 'swords';
const teamUpEditorStorageKey = 'mff-data-hub:team-up-editor:v1';
const teamUpEditorCookieKey = 'mff_team_up_editor_v1';
const teamUpEditorHashKey = 'teamUps';

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function clampSpecValue(value: number, min: number, max?: number) {
  const upperBounded = typeof max === 'number' ? Math.min(max, value) : value;
  return round1(Math.max(min, upperBounded));
}

function readCardEditorCookie() {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${cardEditorCookieKey}=`;
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : undefined;
}

function readCardEditorHash() {
  if (typeof window === 'undefined' || !window.location.hash) return undefined;
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get(cardEditorHashKey) ?? undefined;
}

function parseStoredCardSlots(stored?: string | null) {
  if (!stored) return createDefaultCardSlots();
  try {
    return normalizeCardSlots(JSON.parse(stored));
  } catch {
    return createDefaultCardSlots();
  }
}

function readStoredCardSlots() {
  if (typeof window === 'undefined') return createDefaultCardSlots();

  try {
    const stored = readCardEditorHash() ?? window.localStorage?.getItem(cardEditorStorageKey) ?? readCardEditorCookie();
    return parseStoredCardSlots(stored);
  } catch {
    return parseStoredCardSlots(readCardEditorHash() ?? readCardEditorCookie());
  }
}

function writeStoredCardSlots(slots: EditableComicCardSlot[]) {
  if (typeof window === 'undefined') return;
  const stored = JSON.stringify(slots);
  let persisted = false;
  try {
    window.localStorage?.setItem(cardEditorStorageKey, stored);
    persisted = window.localStorage?.getItem(cardEditorStorageKey) === stored;
  } catch {
    // Cookie/hash fallbacks keep the card editor usable in restricted browser contexts.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${cardEditorCookieKey}=${encodeURIComponent(stored)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    persisted = persisted || readCardEditorCookie() === stored;
  }
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (persisted) {
    params.delete(cardEditorHashKey);
  } else {
    params.set(cardEditorHashKey, stored);
  }
  const nextHash = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`);
}

function createCardSlot(slotId: string, cardId: string): EditableComicCardSlot {
  const card = premiumComicCards.find((item) => item.id === cardId) ?? premiumComicCards[0];
  return {
    slotId,
    cardId: card.id,
    quality: 7,
    selectedOptions: {
      stat4: card.optionalStats.stat4[0],
      stat5: card.optionalStats.stat5[0],
      stat6: card.optionalStats.stat6[0],
    },
    crafted: createDefaultCraftState(6),
  };
}

function useComicCardSlots() {
  const [slots, setSlots] = useState(createDefaultCardSlots);

  useEffect(() => {
    setSlots(readStoredCardSlots());
  }, []);

  const updateSlots = useCallback((updater: (current: EditableComicCardSlot[]) => EditableComicCardSlot[]) => {
    setSlots((current) => {
      const next = normalizeCardSlots(updater(current));
      writeStoredCardSlots(next);
      return next;
    });
  }, []);

  const assignCard = useCallback((slotIndex: number, cardId: string) => {
    updateSlots((current) => current.map((slot, index) => (index === slotIndex ? createCardSlot(slot.slotId, cardId) : slot)));
  }, [updateSlots]);

  const updateCardSlot = useCallback((slotIndex: number, patch: Partial<EditableComicCardSlot>) => {
    updateSlots((current) => current.map((slot, index) => (index === slotIndex ? { ...slot, ...patch } : slot)));
  }, [updateSlots]);

  const updateCardOption = useCallback((slotIndex: number, optionSlot: CardOptionSlot, value: string) => {
    updateSlots((current) => current.map((slot, index) => (
      index === slotIndex ? { ...slot, selectedOptions: { ...slot.selectedOptions, [optionSlot]: value } } : slot
    )));
  }, [updateSlots]);

  const updateCraft = useCallback((slotIndex: number, craftIndex: number, patch: Partial<{ color: CraftColor; stat: AccountStatKey }>) => {
    updateSlots((current) => current.map((slot, index) => {
      if (index !== slotIndex) return slot;
      return {
        ...slot,
        crafted: slot.crafted.map((craft, currentCraftIndex) => (currentCraftIndex === craftIndex ? { ...craft, ...patch } : craft)),
      };
    }));
  }, [updateSlots]);

  const resetCards = useCallback(() => {
    const next = createDefaultCardSlots();
    writeStoredCardSlots(next);
    setSlots(next);
  }, []);

  return { slots, assignCard, updateCardSlot, updateCardOption, updateCraft, resetCards };
}

function readXSwordEditorCookie() {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${xSwordEditorCookieKey}=`;
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : undefined;
}

function readXSwordEditorHash() {
  if (typeof window === 'undefined' || !window.location.hash) return undefined;
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get(xSwordEditorHashKey) ?? undefined;
}

function parseStoredXSwordSlots(stored?: string | null) {
  if (!stored) return createDefaultXSwordSlots();
  try {
    return normalizeXSwordSlots(JSON.parse(stored));
  } catch {
    return createDefaultXSwordSlots();
  }
}

function readStoredXSwordSlots() {
  if (typeof window === 'undefined') return createDefaultXSwordSlots();

  try {
    const stored = readXSwordEditorHash() ?? window.localStorage?.getItem(xSwordEditorStorageKey) ?? readXSwordEditorCookie();
    return parseStoredXSwordSlots(stored);
  } catch {
    return parseStoredXSwordSlots(readXSwordEditorHash() ?? readXSwordEditorCookie());
  }
}

function writeStoredXSwordSlots(slots: EditableXSwordSlot[]) {
  if (typeof window === 'undefined') return;
  const stored = JSON.stringify(slots);
  let persisted = false;
  try {
    window.localStorage?.setItem(xSwordEditorStorageKey, stored);
    persisted = window.localStorage?.getItem(xSwordEditorStorageKey) === stored;
  } catch {
    // Cookie/hash fallbacks keep the X-sword editor usable in restricted browser contexts.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${xSwordEditorCookieKey}=${encodeURIComponent(stored)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    persisted = persisted || readXSwordEditorCookie() === stored;
  }
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (persisted) {
    params.delete(xSwordEditorHashKey);
  } else {
    params.set(xSwordEditorHashKey, stored);
  }
  const nextHash = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`);
}

function useXSwordSlots() {
  const [slots, setSlots] = useState(createDefaultXSwordSlots);

  useEffect(() => {
    setSlots(readStoredXSwordSlots());
  }, []);

  const updateSlots = useCallback((updater: (current: EditableXSwordSlot[]) => EditableXSwordSlot[]) => {
    setSlots((current) => {
      const next = normalizeXSwordSlots(updater(current));
      writeStoredXSwordSlots(next);
      return next;
    });
  }, []);

  const updateMasteryLevel = useCallback((slotIndex: number, masteryLevel: number) => {
    updateSlots((current) => current.map((slot, index) => (index === slotIndex ? { ...slot, masteryLevel } : slot)));
  }, [updateSlots]);

  const updateOption = useCallback((slotIndex: number, optionIndex: number, patch: Partial<EditableXSwordOption>) => {
    updateSlots((current) => current.map((slot, index) => {
      if (index !== slotIndex) return slot;
      return {
        ...slot,
        options: slot.options.map((option, currentOptionIndex) => (currentOptionIndex === optionIndex ? { ...option, ...patch } : option)),
      };
    }));
  }, [updateSlots]);

  const resetSwords = useCallback(() => {
    const next = createDefaultXSwordSlots();
    writeStoredXSwordSlots(next);
    setSlots(next);
  }, []);

  return { slots, updateMasteryLevel, updateOption, resetSwords };
}

function readTeamUpEditorCookie() {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${teamUpEditorCookieKey}=`;
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : undefined;
}

function readTeamUpEditorHash() {
  if (typeof window === 'undefined' || !window.location.hash) return undefined;
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get(teamUpEditorHashKey) ?? undefined;
}

function parseStoredTeamUpCollections(stored?: string | null) {
  if (!stored) return createDefaultTeamUpCollections();
  try {
    return normalizeTeamUpCollections(JSON.parse(stored));
  } catch {
    return createDefaultTeamUpCollections();
  }
}

function readStoredTeamUpCollections() {
  if (typeof window === 'undefined') return createDefaultTeamUpCollections();

  try {
    const stored = readTeamUpEditorHash() ?? window.localStorage?.getItem(teamUpEditorStorageKey) ?? readTeamUpEditorCookie();
    return parseStoredTeamUpCollections(stored);
  } catch {
    return parseStoredTeamUpCollections(readTeamUpEditorHash() ?? readTeamUpEditorCookie());
  }
}

function writeStoredTeamUpCollections(collections: EditableTeamUpCollection[]) {
  if (typeof window === 'undefined') return;
  const stored = JSON.stringify(collections);
  let persisted = false;
  try {
    window.localStorage?.setItem(teamUpEditorStorageKey, stored);
    persisted = window.localStorage?.getItem(teamUpEditorStorageKey) === stored;
  } catch {
    // Cookie/hash fallbacks keep the team-up editor usable in restricted browser contexts.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${teamUpEditorCookieKey}=${encodeURIComponent(stored)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    persisted = persisted || readTeamUpEditorCookie() === stored;
  }
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (persisted) {
    params.delete(teamUpEditorHashKey);
  } else {
    params.set(teamUpEditorHashKey, stored);
  }
  const nextHash = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`);
}

function useTeamUpCollections() {
  const [collections, setCollections] = useState(createDefaultTeamUpCollections);

  useEffect(() => {
    setCollections(readStoredTeamUpCollections());
  }, []);

  const updateCollections = useCallback((updater: (current: EditableTeamUpCollection[]) => EditableTeamUpCollection[]) => {
    setCollections((current) => {
      const next = normalizeTeamUpCollections(updater(current));
      writeStoredTeamUpCollections(next);
      return next;
    });
  }, []);

  const updateLevel = useCallback((collectionIndex: number, collectionLevel: number) => {
    updateCollections((current) => updateTeamUpCollectionLevel(current, collectionIndex, collectionLevel));
  }, [updateCollections]);

  const resetTeamUps = useCallback(() => {
    const next = createDefaultTeamUpCollections();
    writeStoredTeamUpCollections(next);
    setCollections(next);
  }, []);

  return { collections, updateLevel, resetTeamUps };
}

function StatPills({ stats, limit = 4 }: { stats: StatBlock; limit?: number }) {
  const entries = Object.entries(stats)
    .filter(([, value]) => Number(value) !== 0)
    .slice(0, limit) as Array<[AccountStatKey, number]>;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <span key={key} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
          {statLabel(key)} {value > 0 ? '+' : ''}{value}{key === 'instinctAttack' ? '' : '%'}
        </span>
      ))}
    </div>
  );
}

const cardEffectGroups: Array<{
  title: string;
  icon: string;
  tone: string;
  keys: AccountStatKey[];
}> = [
  {
    title: '공격',
    icon: '⚔️',
    tone: 'border-rose-100 bg-rose-50/50 text-rose-700',
    keys: ['allBasicAttack', 'physicalAttack', 'energyAttack', 'attackSpeed', 'criticalRate', 'criticalDamage', 'ignoreDodge', 'elementalDamage', 'instinctAttack'],
  },
  {
    title: '방어 · 생존',
    icon: '🛡️',
    tone: 'border-emerald-100 bg-emerald-50/50 text-emerald-700',
    keys: ['maxHp', 'physicalDamageTakenDecrease', 'energyDamageTakenDecrease', 'pierceDamageTakenDecrease'],
  },
  {
    title: '상태 · 유틸',
    icon: '✨',
    tone: 'border-sky-100 bg-sky-50/50 text-sky-700',
    keys: ['cooldownDuration', 'ignoreDefense'],
  },
  {
    title: '세공 효과',
    icon: '💎',
    tone: 'border-purple-100 bg-purple-50/50 text-purple-700',
    keys: ['pierce'],
  },
];

function aggregateCardStats(cardSummary: ReturnType<typeof summarizeComicCardSlots>) {
  return cardSummary.calculatedCards.reduce<StatBlock>((stats, row) => {
    for (const [key, value] of Object.entries(row.calculated.stats)) {
      const statKey = key as AccountStatKey;
      stats[statKey] = round1((stats[statKey] ?? 0) + Number(value ?? 0));
    }
    return stats;
  }, {});
}

function formatStatValue(key: AccountStatKey, value: number) {
  if (value === 0) return key === 'instinctAttack' ? '0' : '0%';
  const formatted = formatNumber(value);
  return key === 'instinctAttack' ? `+${formatted}` : `+${formatted}%`;
}

function CardEffectSummary({ cardSummary }: { cardSummary: ReturnType<typeof summarizeComicCardSlots> }) {
  const totalStats = useMemo(() => aggregateCardStats(cardSummary), [cardSummary]);
  const equippedCards = cardSummary.calculatedCards.filter((row) => row.card);
  const triggerRows = equippedCards
    .flatMap(({ slot, card }, index) => (
      Object.values(slot.selectedOptions)
        .filter((option) => option.includes('Proc'))
        .map((option) => ({ id: `${slot.slotId}-${option}`, label: `${index + 1}. ${card?.name ?? '카드'} · ${option.replace(' Proc', '')}` }))
    ));

  return (
    <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-500">📊 전체 카드 효과</p>
          <h4 className="text-xl font-black text-slate-950">카드 효과 결산</h4>
          <p className="mt-1 text-sm font-bold text-slate-500">{cardSummary.equippedCardCount}장 장착 · 옵션/세공 선택값 자동 합산</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
            <p className="text-[10px] font-black text-rose-500">⚔️ 공격</p>
            <p className="text-xl font-black text-rose-700">{formatNumber(cardSummary.attack)}%</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
            <p className="text-[10px] font-black text-sky-500">💠 피어스</p>
            <p className="text-xl font-black text-sky-700">{formatNumber(cardSummary.pierce)}%</p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3">
            <p className="text-[10px] font-black text-purple-500">🔵 풀파랑</p>
            <p className="text-xl font-black text-purple-700">{cardSummary.fullBlueCards}/{cardSummary.equippedCardCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        {cardEffectGroups.map((group) => {
          const rows = group.keys.map((key) => ({ key, value: Number(totalStats[key] ?? 0) }));
          return (
            <article key={group.title} className={`rounded-2xl border p-3 ${group.tone}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h5 className="font-black">{group.icon} {group.title}</h5>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black text-slate-500">{group.keys.length}개</span>
              </div>
              <div className="space-y-1.5">
                {rows.map(({ key, value }) => (
                  <div key={key} className={`flex items-center justify-between gap-3 rounded-xl bg-white px-2.5 py-2 text-xs font-black ${value === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                    <span className="min-w-0 truncate">{statLabel(key)}</span>
                    <span className={`shrink-0 ${value === 0 ? 'text-slate-400' : 'text-slate-950'}`}>{formatStatValue(key, value)}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
        <p className="text-xs font-black text-amber-700">🔥 발동 효과</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {triggerRows.length ? triggerRows.map((row) => (
            <span key={row.id} className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-amber-800 ring-1 ring-amber-100">{row.label}</span>
          )) : (
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-amber-100">선택된 발동 옵션 없음</span>
          )}
        </div>
      </div>
    </section>
  );
}

function TeamUpEditorCard({
  collection,
  covered,
  total,
  coverage,
  onLevelChange,
}: {
  collection: EditableTeamUpCollection;
  covered: number;
  total: number;
  coverage: number;
  onLevelChange: (collectionLevel: number) => void;
}) {
  const theme = getTeamUpTheme(collection.themeId);
  const title = theme?.name ?? collection.themeId;
  const applyLevel = (value: number) => onLevelChange(clampTeamUpLevel(value));

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        {theme ? <Image src={theme.iconImageUrl} alt={theme.name} width={48} height={48} unoptimized className="h-12 w-12 rounded-xl object-cover" /> : null}
        <div className="min-w-0">
          <h4 className="truncate text-sm font-black text-slate-950">{title}</h4>
          <p className="text-xs font-bold text-slate-500">Lv.{collection.collectionLevel} · {collection.completedSteps}/10 단계</p>
        </div>
      </div>

      <label className="mt-3 grid gap-1.5 rounded-2xl border border-slate-200 bg-white p-3">
        <span className="text-xs font-black text-slate-500">팀업 레벨</span>
        <span className="grid grid-cols-[34px_minmax(0,1fr)_34px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white">
          <button
            type="button"
            aria-label={`${title} 팀업 레벨 감소`}
            onClick={() => applyLevel(collection.collectionLevel - 1)}
            className="bg-white text-base font-black text-slate-500 hover:bg-slate-100 hover:text-blue-700"
          >
            -
          </button>
          <input
            aria-label={`${title} 팀업 레벨`}
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            step={1}
            value={collection.collectionLevel}
            onChange={(event) => applyLevel(Number(event.target.value))}
            className="min-w-0 bg-transparent px-2 py-2 text-center text-sm font-black text-slate-950 outline-none"
          />
          <button
            type="button"
            aria-label={`${title} 팀업 레벨 증가`}
            onClick={() => applyLevel(collection.collectionLevel + 1)}
            className="bg-white text-base font-black text-slate-500 hover:bg-slate-100 hover:text-blue-700"
          >
            +
          </button>
        </span>
        <span className="text-right text-[10px] font-black text-slate-400">/10</span>
      </label>

      <p className="mt-3 text-sm font-black text-blue-700">{collection.appliedOption}</p>
      <StatPills stats={collection.stats} limit={3} />
      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>내 로스터 {covered}/{total}</span>
        <span>{coverage}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${coverage}%` }} />
      </div>
    </article>
  );
}

function ComicCardEditorCard({
  slot,
  card,
  calculated,
  index,
  selected,
  onSelect,
  onAssign,
  onQualityChange,
  onOptionChange,
  onCraftChange,
}: {
  slot: EditableComicCardSlot;
  card?: ComicCardDefinition;
  calculated: CalculatedComicCard;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onAssign: (cardId: string) => void;
  onQualityChange: (quality: number) => void;
  onOptionChange: (optionSlot: CardOptionSlot, value: string) => void;
  onCraftChange: (craftIndex: number, patch: Partial<{ color: CraftColor; stat: AccountStatKey }>) => void;
}) {
  const imageUrl = card?.localImageUrl ?? card?.sourceImageUrl;

  return (
    <article
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const cardId = event.dataTransfer.getData('application/mff-card-id');
        if (cardId) onAssign(cardId);
      }}
      className={`rounded-3xl border p-3 ${selected ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-slate-50'}`}
    >
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="relative h-28 overflow-hidden rounded-2xl bg-white shadow-sm"
          aria-label={`카드 슬롯 ${index + 1} 선택`}
        >
          {imageUrl ? <Image src={imageUrl} alt={card?.name ?? `카드 슬롯 ${index + 1}`} fill sizes="76px" unoptimized className="object-contain p-1" /> : null}
        </button>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={onSelect} className="min-w-0 text-left">
              <h4 className="line-clamp-2 min-h-9 text-sm font-black leading-tight text-slate-950">{card?.name ?? '카드 없음'}</h4>
            </button>
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-purple-700">#{index + 1}</span>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500">제작 {calculated.craftedStars}★ · 파랑 {calculated.blueStars}/6</p>
          <p className="mt-2 text-sm font-black text-purple-700">공격 +{formatNumber(calculated.attackContribution)}% · 피어스 +{calculated.pierce}%</p>
          <StatPills stats={calculated.stats} limit={3} />
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <label className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-xs font-black text-slate-500">품질</span>
          <select
            value={slot.quality}
            onChange={(event) => onQualityChange(Number(event.target.value))}
            className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-black text-slate-900"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((quality) => <option key={quality} value={quality}>{quality}</option>)}
          </select>
        </label>

        {card ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs font-black text-slate-500">고정 옵션</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {card.fixedStats.map((stat) => (
                <span key={stat} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{stat}</span>
              ))}
            </div>
          </div>
        ) : null}

        {card ? cardOptionSlots.map((optionSlot) => (
          <label key={`${slot.slotId}-${optionSlot.key}`} className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs font-black text-slate-500">{optionSlot.label}</span>
            <select
              value={slot.selectedOptions[optionSlot.key]}
              onChange={(event) => onOptionChange(optionSlot.key, event.target.value)}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-800"
            >
              {card.optionalStats[optionSlot.key].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )) : null}
      </div>

      <div className="mt-3 grid gap-2">
        {slot.crafted.map((craft, craftIndex) => (
          <div key={`${slot.slotId}-craft-${craftIndex}`} className="grid grid-cols-[42px_92px_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs font-black text-slate-500">{craftIndex + 1}번</span>
            <div className="grid grid-cols-3 gap-1">
              {craftColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  aria-label={`슬롯 ${index + 1} 세공 ${craftIndex + 1} ${color.label}`}
                  title={color.label}
                  onClick={() => onCraftChange(craftIndex, { color: color.id })}
                  className={`grid h-7 place-items-center rounded-lg border ${craft.color === color.id ? 'border-slate-950 bg-white ring-2 ring-slate-200' : 'border-slate-200 bg-slate-50'}`}
                >
                  <span className={`h-3.5 w-3.5 rounded-full ${color.id === 'blue' ? 'bg-sky-500' : color.id === 'red' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                </button>
              ))}
            </div>
            <select
              value={craft.stat}
              onChange={(event) => onCraftChange(craftIndex, { stat: event.target.value as AccountStatKey })}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-800"
            >
              {craftStatOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </article>
  );
}

function XSwordEditorCard({
  slot,
  index,
  selected,
  onSelect,
  onMasteryChange,
  onOptionChange,
}: {
  slot: EditableXSwordSlot;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onMasteryChange: (masteryLevel: number) => void;
  onOptionChange: (optionIndex: number, patch: Partial<EditableXSwordOption>) => void;
}) {
  const element = getXSwordElement(slot.elementId);
  const applyMasteryLevel = (value: number) => {
    onMasteryChange(clampSpecValue(value, 0, 6));
  };

  return (
    <article className={`rounded-3xl border p-3 ${selected ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-slate-50'}`}>
      <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm"
          aria-label={`X-소드 ${index + 1} 선택`}
        >
          {element ? <Image src={element.sourceImageUrl} alt={element.name} width={44} height={44} unoptimized className="h-11 w-11 object-contain" /> : null}
        </button>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={onSelect} className="min-w-0 text-left">
              <h4 className="truncate text-sm font-black text-slate-950">{element?.name ?? slot.elementId} Sword</h4>
              <p className="mt-1 text-xs font-bold text-slate-500">{element?.koreanName ?? '소드'} · 마스터리 {slot.masteryLevel}/6</p>
            </button>
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-purple-700">#{index + 1}</span>
          </div>
          <p className="mt-2 text-sm font-black text-purple-700">옵션 6줄 · 마스터리 +{slot.masteryLevel}</p>
        </div>
      </div>

      <label className="mt-3 grid gap-1.5 rounded-2xl border border-slate-200 bg-white p-3">
        <span className="text-xs font-black text-slate-500">소드별 마스터리</span>
        <span className="grid grid-cols-[34px_minmax(0,1fr)_34px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-purple-400 focus-within:bg-white">
          <button
            type="button"
            aria-label={`X-소드 ${index + 1} 마스터리 감소`}
            onClick={() => applyMasteryLevel(slot.masteryLevel - 1)}
            className="bg-white text-base font-black text-slate-500 hover:bg-slate-100 hover:text-purple-700"
          >
            -
          </button>
          <input
            aria-label={`X-소드 ${index + 1} 마스터리`}
            type="number"
            inputMode="numeric"
            min={0}
            max={6}
            step={1}
            value={slot.masteryLevel}
            onChange={(event) => applyMasteryLevel(Number(event.target.value))}
            className="min-w-0 bg-transparent px-2 py-2 text-center text-sm font-black text-slate-950 outline-none"
          />
          <button
            type="button"
            aria-label={`X-소드 ${index + 1} 마스터리 증가`}
            onClick={() => applyMasteryLevel(slot.masteryLevel + 1)}
            className="bg-white text-base font-black text-slate-500 hover:bg-slate-100 hover:text-purple-700"
          >
            +
          </button>
        </span>
        <span className="text-right text-[10px] font-black text-slate-400">/6</span>
      </label>

      <div className="mt-3 grid gap-2">
        {slot.options.map((option, optionIndex) => {
          const definition = getXSwordOptionDefinition(option.optionId);
          return (
          <div key={`${slot.id}-option-${optionIndex}`} className="grid grid-cols-[54px_minmax(0,1fr)_78px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs font-black text-slate-500">{optionIndex + 1}번</span>
            <select
              aria-label={`X-소드 ${index + 1} 옵션 ${optionIndex + 1}`}
              value={option.optionId}
              onChange={(event) => {
                const optionId = event.target.value as XSwordOptionId;
                onOptionChange(optionIndex, {
                  optionId,
                  value: getXSwordOptionDefinition(optionId).defaultValue,
                });
              }}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-800"
            >
              {xSwordOptionDefinitions.map((optionDefinition) => (
                <option key={optionDefinition.id} value={optionDefinition.id}>{optionDefinition.label}</option>
              ))}
            </select>
            <input
              aria-label={`X-소드 ${index + 1} 옵션 ${optionIndex + 1} 값`}
              type="number"
              inputMode="decimal"
              min={0}
              step={definition.step}
              value={option.value}
              onChange={(event) => onOptionChange(optionIndex, { value: Number(event.target.value) })}
              className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-right text-xs font-black text-slate-900"
            />
          </div>
          );
        })}
      </div>
    </article>
  );
}

function SpecMetric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      {caption ? <p className="mt-1 text-xs font-bold text-slate-500">{caption}</p> : null}
    </div>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:border-purple-200 hover:text-purple-700"
    >
      <RotateCcw size={14} />
      기본값
    </button>
  );
}

const cardOptionSlots: Array<{ key: CardOptionSlot; label: string }> = [
  { key: 'stat4', label: '옵션 4' },
  { key: 'stat5', label: '옵션 5' },
  { key: 'stat6', label: '옵션 6' },
];

export function AccountSpecPanel() {
  const { slots: comicCardSlots, assignCard, updateCardSlot, updateCardOption, updateCraft, resetCards } = useComicCardSlots();
  const { slots: xSwordSlots, updateMasteryLevel, updateOption: updateXSwordOption, resetSwords } = useXSwordSlots();
  const { collections: teamUpCollections, updateLevel: updateTeamUpLevel, resetTeamUps } = useTeamUpCollections();
  const [selectedCardSlot, setSelectedCardSlot] = useState(0);
  const [selectedXSwordSlot, setSelectedXSwordSlot] = useState(0);
  const ownedIds = useMemo(() => userRoster.filter((row) => row.owned).map((row) => row.characterId), []);
  const teamCoverage = useMemo(() => {
    const owned = new Set(ownedIds);
    return teamUpCollections.map((collection) => {
      const theme = getTeamUpTheme(collection.themeId);
      const covered = theme?.targetHeroIds.filter((id) => owned.has(id)).length ?? 0;
      const total = theme?.targetHeroIds.length ?? 0;
      return {
        collection,
        theme,
        covered,
        total,
        coverage: total ? Math.round((covered / total) * 100) : 0,
      };
    });
  }, [ownedIds, teamUpCollections]);
  const cardSummary = useMemo(() => summarizeComicCardSlots(comicCardSlots), [comicCardSlots]);
  const xSwordSummary = useMemo(() => summarizeXSwordSlots(xSwordSlots), [xSwordSlots]);
  const teamUpSummary = useMemo(() => summarizeTeamUpCollections(teamUpCollections), [teamUpCollections]);
  const swordRows = useMemo(
    () => xSwordSummary.swords.map((sword, index) => ({ sword, slot: xSwordSlots[index], element: getXSwordElement(sword.elementId) })).filter((row) => row.element && row.slot),
    [xSwordSlots, xSwordSummary.swords],
  );
  const customAccountAttack = round1(cardSummary.attack + xSwordSummary.masteryAllAttack);
  const customTotalPierce = round1(cardSummary.pierce + Number(xSwordSummary.stats.pierce ?? 0));

  return (
    <section className="mt-5 space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-purple-700">계정 스펙 현황</p>
            <h2 className="text-2xl font-black text-slate-950">카드 / X-소드 / 팀업</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <p className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
              <TrendingUp size={16} />
              계정공 {formatNumber(customAccountAttack)}%
            </p>
            <p className="rounded-2xl bg-purple-50 px-4 py-2 text-sm font-black text-purple-700">피어스 {formatNumber(customTotalPierce)}%</p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-slate-950 p-3 text-white"><BookOpen size={20} /></span>
            <div>
              <h3 className="text-xl font-black text-slate-950">카드</h3>
              <p className="text-sm font-bold text-slate-500">프리미엄 카드 DB에서 드래그해 장착하고, 카드별 옵션과 세공 색상으로 공격/피어스를 자동 계산합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ResetButton onClick={resetCards} />
            <a href="https://thanosvibs.money/cards" target="_blank" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-purple-700" aria-label="Open card reference">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        <CardEffectSummary cardSummary={cardSummary} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cardSummary.calculatedCards.map(({ slot, card, calculated }, index) => (
            <ComicCardEditorCard
              key={slot.slotId}
              slot={slot}
              card={card}
              calculated={calculated}
              index={index}
              selected={selectedCardSlot === index}
              onSelect={() => setSelectedCardSlot(index)}
              onAssign={(cardId) => {
                assignCard(index, cardId);
                setSelectedCardSlot(index);
              }}
              onQualityChange={(quality) => updateCardSlot(index, { quality })}
              onOptionChange={(optionSlot, value) => updateCardOption(index, optionSlot, value)}
              onCraftChange={(craftIndex, patch) => updateCraft(index, craftIndex, patch)}
            />
          ))}
        </div>
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h4 className="font-black text-slate-950">프리미엄 카드 DB</h4>
              <p className="text-xs font-bold text-slate-500">{premiumComicCards.length}장 · 이미지를 드래그해서 선택 슬롯에 장착</p>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-purple-700">선택 슬롯 #{selectedCardSlot + 1}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
            {premiumComicCards.map((card) => (
              <article
                key={card.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/mff-card-id', card.id);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                className="cursor-grab rounded-2xl border border-slate-200 bg-white p-2 active:cursor-grabbing"
              >
                <button type="button" onClick={() => assignCard(selectedCardSlot, card.id)} className="block w-full text-left">
                  <div className="relative mx-auto h-24 w-16">
                    <Image src={card.localImageUrl ?? card.sourceImageUrl} alt={card.name} fill sizes="64px" unoptimized className="rounded-xl object-contain" />
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-8 text-[11px] font-black text-slate-950">{card.name}</p>
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-purple-50 p-3 text-purple-700"><Swords size={20} /></span>
            <div>
              <h3 className="text-xl font-black text-slate-950">X-소드</h3>
              <p className="text-sm font-bold text-slate-500">각 소드별 마스터리 숫자와 실제 게임 옵션 6줄을 편집합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ResetButton onClick={() => {
              resetSwords();
            }} />
            <a href="https://thanosvibs.money/dailybuggle/script_guide_swords" target="_blank" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-purple-700" aria-label="Open X of Swords reference">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-purple-100 bg-purple-50 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <SpecMetric label="마스터리" value={`${formatNumber(xSwordSummary.masteryLevel)}/36`} caption="6개 소드 합산" />
              <SpecMetric label="마스터리 올공" value={`${formatNumber(xSwordSummary.masteryAllAttack)}%`} caption="카드 공격에 합산" />
              <SpecMetric label="옵션 풀" value={formatNumber(xSwordOptionDefinitions.length)} caption="실제 게임 옵션 후보" />
              <SpecMetric label="편집 옵션" value={`${swordRows.length * 6}개`} caption="소드 6개 x 옵션 6줄" />
            </div>
            <div className="mt-3">
              <StatPills stats={xSwordSummary.stats} limit={8} />
            </div>
            <p className="mt-3 rounded-2xl bg-white/70 p-3 text-xs font-bold leading-relaxed text-slate-600">
              룬 색상 6칸은 입력하지 않습니다. 각 소드 카드에서 0~6 마스터리 숫자만 넣으면 합산 올공 보너스가 자동으로 잡힙니다.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {swordRows.map(({ sword, slot }, index) => (
              <XSwordEditorCard
                key={sword.id}
                slot={slot}
                index={index}
                selected={selectedXSwordSlot === index}
                onSelect={() => setSelectedXSwordSlot(index)}
                onMasteryChange={(masteryLevel) => updateMasteryLevel(index, masteryLevel)}
                onOptionChange={(optionIndex, patch) => updateXSwordOption(index, optionIndex, patch)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Users size={20} /></span>
            <div>
              <h3 className="text-xl font-black text-slate-950">팀업</h3>
              <p className="text-sm font-bold text-slate-500">각 팀업 컬렉션 레벨을 개별 입력하고 대상 캐릭터 적용 범위를 확인합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ResetButton onClick={resetTeamUps} />
            <a href="https://future-fight.fandom.com/wiki/Team-Up_Collection" target="_blank" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-purple-700" aria-label="Open team-up reference">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <SpecMetric label="활성 팀업" value={formatNumber(teamUpSummary.activeTeamUpCollections)} caption={`${teamUpCollections.length}개 컬렉션`} />
              <SpecMetric label="팀업 공격" value={`${formatNumber(teamUpSummary.teamUpAttackBudget)}%`} caption="개별 레벨 합산" />
            </div>
            <StatPills stats={teamUpSummary.stats} limit={6} />
            <p className="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold leading-relaxed text-slate-600">
              팀업은 대상 영웅별로 적용되므로 좌측 일괄 레벨이나 공격 예산 입력 없이, 각 컬렉션 카드의 레벨만 편집합니다.
            </p>
          </aside>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
            {teamUpCollections.map((collection, index) => {
              const coverage = teamCoverage.find((row) => row.collection.themeId === collection.themeId);
              return (
                <TeamUpEditorCard
                  key={collection.themeId}
                  collection={collection}
                  covered={coverage?.covered ?? 0}
                  total={coverage?.total ?? 0}
                  coverage={coverage?.coverage ?? 0}
                  onLevelChange={(collectionLevel) => updateTeamUpLevel(index, collectionLevel)}
                />
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}

export function AccountInsights() {
  const coverage = rosterCoverage(characters, userRoster);
  const weak = userRoster.filter((r) => r.owned && (r.artifactStars < 4 || r.uniformRank !== 'Mythic')).slice(0, 5);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">계정 분석</h2>
          <p className="text-sm font-bold text-slate-500">{account.updatedAt} 기준 · 추천 엔진 보정값</p>
        </div>
        <span className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white">{coverage.coverage}% 보유</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">보유</p><p className="text-2xl font-black">{coverage.owned}/{coverage.total}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">T4</p><p className="text-2xl font-black">{coverage.t4}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Insight</p><p className="text-2xl font-black">{coverage.insight}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Mythic Uniform</p><p className="text-2xl font-black">{coverage.mythicUniform}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-400">Pierce</p><p className="text-2xl font-black">{account.pierce}%</p></div>
      </div>
      <AccountSpecPanel />
      <div className="mt-5 rounded-3xl bg-amber-50 p-4">
        <p className="mb-3 font-black text-amber-900">우선 보완 후보</p>
        <div className="grid gap-2 md:grid-cols-2">
          {weak.map((item) => {
            const c = characters.find((x) => x.id === item.characterId);
            return <p key={item.characterId} className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">{c?.name}: {item.uniformRank !== 'Mythic' ? '유니폼 Mythic 필요' : '아티팩트 별 보강'}</p>;
          })}
        </div>
      </div>
    </section>
  );
}
