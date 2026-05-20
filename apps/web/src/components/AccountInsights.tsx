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
  updateTeamUpCollectionLevel,
  type EditableTeamUpCollection,
} from '@/lib/teamUpEditor';
import { rosterCoverage } from '@mff-data-hub/core';
import { catalogCharacters } from '@mff-data-hub/data';
import Image from 'next/image';
import { type ReactNode, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  getTeamUpTheme,
  getXSwordElement,
  xSwordElements,
  type AccountStatKey,
  type ComicCardDefinition,
  type StatBlock,
  type XSwordElement,
  type XSwordElementId,
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

function normalizeHeroKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

const appCharacterByTeamUpKey = new Map<string, { name: string; imageUrl: string }>();
for (const character of characters) {
  appCharacterByTeamUpKey.set(normalizeHeroKey(character.id), { name: character.name, imageUrl: character.portraitUrl });
  appCharacterByTeamUpKey.set(normalizeHeroKey(character.slug), { name: character.name, imageUrl: character.portraitUrl });
  appCharacterByTeamUpKey.set(normalizeHeroKey(character.name), { name: character.name, imageUrl: character.portraitUrl });
}

const catalogCharacterByTeamUpKey = new Map<string, { name: string; imageUrl: string }>();
for (const character of catalogCharacters) {
  catalogCharacterByTeamUpKey.set(normalizeHeroKey(character.id), { name: character.name, imageUrl: character.imageUrl });
  catalogCharacterByTeamUpKey.set(normalizeHeroKey(character.name), { name: character.name, imageUrl: character.imageUrl });
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const gameStatLabels: Record<string, string> = {
  allBasicAttack: '모든 공격력 상승',
  physicalAttack: '물리 공격력 상승',
  energyAttack: '에너지 공격력 상승',
  maxHp: '생명력 상승',
  cooldownDuration: '스킬 재사용 시간 감소',
  ignoreDefense: '방어 무시',
  ignoreDodge: '회피 무시',
  criticalRate: '치명타율 상승',
  criticalDamage: '치명타 피해율 상승',
  attackSpeed: '공격 속도 상승',
  elementalDamage: '속성 피해량 증가',
  instinctAttack: '본능 공격력 상승',
  pierce: '추가 관통 피해',
  physicalDamageTakenDecrease: '물리 피해 감소',
  energyDamageTakenDecrease: '에너지 피해 감소',
  pierceDamageTakenDecrease: '관통 피해 감소',
  'All Basic Attacks': '모든 공격력 상승',
  'Physical Attack': '물리 공격력 상승',
  'Energy Attack': '에너지 공격력 상승',
  'Max HP': '생명력 상승',
  'Cooldown Duration': '스킬 재사용 시간 감소',
  'Skill Cooldown': '스킬 재사용 시간 감소',
  'Ignore Defense': '방어 무시',
  'Ignore Dodge': '회피 무시',
  Dodge: '회피율 상승',
  'Critical Rate': '치명타율 상승',
  'Critical Damage': '치명타 피해율 상승',
  'Attack Speed': '공격 속도 상승',
  'Movement Speed': '이동 속도 상승',
  'Recovery Rate': '회복률 상승',
  'Physical Defense': '물리 방어력 상승',
  'Energy Defense': '에너지 방어력 상승',
  'All Basic Defenses': '모든 일반 방어력 상승',
  'All Resistances': '모든 저항력 상승',
  'Fire Resist': '화염 저항력 상승',
  'Cold Resist': '냉기 저항력 상승',
  'Lightning Resist': '전기 저항력 상승',
  'Mind Resist': '정신 저항력 상승',
  'Poison Resist': '독 저항력 상승',
  'Debuff Duration': '상태 이상 지속시간 감소',
  'Additional Pierce Damage Increase': '추가 관통 피해',
};

const cardProcTriggerLabels: Record<string, string> = {
  'When Attacking': '공격 시',
  'When Hit': '피격 시',
  'When Critting': '치명타 시',
  'When Dodging': '회피 시',
};

function normalizeGameOptionLabel(value: string) {
  return value.replace(/,+$/g, '').trim();
}

function parseCardProcOption(value: string) {
  const normalized = normalizeGameOptionLabel(value);
  const match = normalized.match(/^(.*) Proc \(([^)]+)\)$/);
  if (!match) return null;
  return {
    baseLabel: normalizeGameOptionLabel(match[1]),
    trigger: match[2],
  };
}

function gameStatLabel(value: string) {
  const normalized = normalizeGameOptionLabel(value);
  return gameStatLabels[normalized] ?? normalized;
}

function formatCardOptionLabel(value: string) {
  const proc = parseCardProcOption(value);
  if (!proc) return gameStatLabel(value);
  return `${gameStatLabel(proc.baseLabel)} (${cardProcTriggerLabels[proc.trigger] ?? proc.trigger} 발동)`;
}

function formatCardProcSummary(value: string) {
  const proc = parseCardProcOption(value);
  if (!proc) return formatCardOptionLabel(value);
  return `발동 확률: ${cardProcTriggerLabels[proc.trigger] ?? proc.trigger} 5% 확률 · ${gameStatLabel(proc.baseLabel)} +20% 증가(15초)`;
}

function getCardOptionDisplayValue(value: string, quality: number, optionType: 'fixed' | 'optional') {
  const proc = parseCardProcOption(value);
  if (proc) return '발동';

  const label = normalizeGameOptionLabel(value);
  if (label === 'All Basic Attacks') return `+${quality + (optionType === 'fixed' ? 4 : 3)}%`;
  if (label === 'Physical Attack' || label === 'Energy Attack') return `+${optionType === 'fixed' ? quality + 6 : quality}%`;
  if (label === 'Max HP') return `+${quality + (optionType === 'fixed' ? 4 : 2)}%`;
  if (label === 'Instinct Attack') return `+${quality * (optionType === 'fixed' ? 120 : 100)}`;
  if (label === 'Additional Pierce Damage Increase') return `+${Math.max(3, quality - 1)}%`;
  return `+${Math.max(3, quality - 1)}%`;
}

function formatCraftStatValue(key: AccountStatKey, color: CraftColor) {
  if (key === 'instinctAttack') return color === 'blue' ? '+600' : '+450';
  if (key === 'allBasicAttack' || key === 'physicalAttack' || key === 'energyAttack') return color === 'blue' ? '+2.5%' : '+2%';
  if (key === 'maxHp') return color === 'green' ? '+3.5%' : '+3%';
  return color === 'blue' ? '+2%' : '+1.5%';
}

function getTeamUpHeroIcon(heroId: string, heroName?: string) {
  const idKey = normalizeHeroKey(heroId);
  const nameKey = normalizeHeroKey(heroName ?? heroId);
  return appCharacterByTeamUpKey.get(idKey)
    ?? appCharacterByTeamUpKey.get(nameKey)
    ?? catalogCharacterByTeamUpKey.get(idKey)
    ?? catalogCharacterByTeamUpKey.get(nameKey)
    ?? {
      name: heroName ?? heroId,
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(heroName ?? heroId)}&background=e0f2fe&color=075985&bold=true`,
    };
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
    updateSlots((current) => {
      const targetCard = premiumComicCards.find((card) => card.id === cardId);
      if (!targetCard || current[slotIndex]?.cardId === targetCard.id) return current;
      const alreadyEquipped = current.some((slot, index) => index !== slotIndex && slot.cardId === targetCard.id);
      if (alreadyEquipped) return current;
      return current.map((slot, index) => (index === slotIndex ? createCardSlot(slot.slotId, targetCard.id) : slot));
    });
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
          {gameStatLabel(key)} {value > 0 ? '+' : ''}{value}{key === 'instinctAttack' ? '' : '%'}
        </span>
      ))}
    </div>
  );
}

const cardEffectGroups: Array<{
  title: string;
  headerClassName: string;
  rowClassName: string;
  className?: string;
  keys: AccountStatKey[];
}> = [
  {
    title: '공격',
    headerClassName: 'border-b border-slate-200 bg-white text-slate-950',
    rowClassName: 'text-slate-700',
    className: 'xl:col-span-2',
    keys: ['attackSpeed', 'criticalRate', 'criticalDamage', 'allBasicAttack', 'physicalAttack', 'energyAttack', 'ignoreDodge', 'elementalDamage', 'instinctAttack'],
  },
  {
    title: '방어',
    headerClassName: 'border-b border-slate-200 bg-white text-slate-950',
    rowClassName: 'text-slate-700',
    keys: ['maxHp', 'physicalDamageTakenDecrease', 'energyDamageTakenDecrease', 'pierceDamageTakenDecrease'],
  },
  {
    title: '상태 이상',
    headerClassName: 'border-b border-slate-200 bg-white text-slate-950',
    rowClassName: 'text-slate-700',
    keys: ['cooldownDuration', 'ignoreDefense'],
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

function CardEffectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-black text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function CardEffectStatRow({ group, statKey, value }: { group: (typeof cardEffectGroups)[number]; statKey: AccountStatKey; value: number }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_86px] items-center gap-3 px-3 py-2 text-sm font-black ${value === 0 ? 'text-slate-600' : group.rowClassName}`}>
      <span className="min-w-0 truncate">{gameStatLabel(statKey)}</span>
      <span className={`shrink-0 text-right ${value === 0 ? 'text-slate-600' : 'text-slate-950'}`}>{formatStatValue(statKey, value)}</span>
    </div>
  );
}

function CardEffectSummary({ cardSummary }: { cardSummary: ReturnType<typeof summarizeComicCardSlots> }) {
  const totalStats = useMemo(() => aggregateCardStats(cardSummary), [cardSummary]);
  const allBasicAttack = Number(totalStats.allBasicAttack ?? 0);
  const physicalAttackTotal = round1(allBasicAttack + Number(totalStats.physicalAttack ?? 0));
  const energyAttackTotal = round1(allBasicAttack + Number(totalStats.energyAttack ?? 0));
  const equippedCards = cardSummary.calculatedCards.filter((row) => row.card);
  const triggerRows = equippedCards
    .flatMap(({ slot, card }, index) => (
      Object.values(slot.selectedOptions)
        .filter((option) => option.includes('Proc'))
        .map((option) => ({ id: `${slot.slotId}-${option}`, label: `${index + 1}. ${card?.name ?? '카드'} · ${formatCardProcSummary(option)}` }))
    ));

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Comic Card Effects</p>
          <h4 className="text-2xl font-black text-slate-950">전체 카드 효과</h4>
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-sm font-black text-slate-950">카드 덱 1</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{cardSummary.equippedCardCount}장 장착 · 옵션 자동 합산</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <CardEffectMetric label="물리 공격력" value={`+${formatNumber(physicalAttackTotal)}%`} />
          <CardEffectMetric label="에너지 공격력" value={`+${formatNumber(energyAttackTotal)}%`} />
          <CardEffectMetric label="관통 피해" value={`+${formatNumber(cardSummary.pierce)}%`} />
          <CardEffectMetric label="파랑 별" value={`${cardSummary.fullBlueCards}/${cardSummary.equippedCardCount}`} />
        </div>
      </div>

      <div className="grid gap-3 px-4 pb-4 xl:grid-cols-4">
        {cardEffectGroups.map((group) => {
          const rows = group.keys.map((key) => ({ key, value: Number(totalStats[key] ?? 0) }));
          return (
            <article key={group.title} className={`overflow-hidden border border-slate-200 bg-white ${group.className ?? ''}`}>
              <div className={`px-3 py-2 ${group.headerClassName}`}>
                <h5 className="font-black">{group.title}</h5>
              </div>
              {group.title === '공격' ? (
                <div className="grid md:grid-cols-2 md:divide-x md:divide-slate-200">
                  {[rows.slice(0, 5), rows.slice(5)].map((columnRows, columnIndex) => (
                    <div key={`${group.title}-${columnIndex}`} className="divide-y divide-slate-200">
                      {columnRows.map(({ key, value }) => (
                        <CardEffectStatRow key={key} group={group} statKey={key} value={value} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {rows.map(({ key, value }) => (
                    <CardEffectStatRow key={key} group={group} statKey={key} value={value} />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mx-4 mb-4 border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-950">발동 효과</div>
        <div className="flex flex-wrap gap-2 p-3">
          {triggerRows.length ? triggerRows.map((row) => (
            <span key={row.id} className="bg-white px-3 py-1.5 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">{row.label}</span>
          )) : (
            <span className="bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">선택된 발동 옵션 없음</span>
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
  const targetHeroes = theme?.targetHeroIds.map((heroId, index) => getTeamUpHeroIcon(heroId, theme.targetHeroes[index])) ?? [];
  const applyLevel = (value: number) => onLevelChange(clampTeamUpLevel(value));

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        {theme ? (
          <span className="grid h-16 w-32 shrink-0 place-items-center rounded-xl bg-white p-2 ring-1 ring-slate-200">
            <Image src={theme.iconImageUrl} alt={theme.name} width={128} height={51} unoptimized className="max-h-12 w-full object-contain drop-shadow-sm" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h4 className="truncate text-base font-black text-slate-950">{title}</h4>
          <p className="text-xs font-bold text-slate-500">Lv.{collection.collectionLevel} · {collection.completedSteps}/18 단계</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {targetHeroes.map((hero, index) => (
          <span key={`${collection.themeId}-${hero.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200" title={hero.name}>
            <Image src={hero.imageUrl} alt={hero.name} fill sizes="42px" unoptimized className="object-cover" />
          </span>
        ))}
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
            max={18}
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
        <span className="text-right text-[10px] font-black text-slate-400">/18</span>
      </label>

      <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-800 ring-1 ring-blue-100">{collection.appliedOption}</p>
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

function GameCardOptionSection({ title, className, children }: { title: string; className: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className={`border-b border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black ${className}`}>{title}</div>
      <div className="divide-y divide-slate-200 bg-white">{children}</div>
    </div>
  );
}

function GameCardOptionRow({
  marker,
  label,
  value,
  children,
  labelClassName = 'text-cyan-200',
}: {
  marker: ReactNode;
  label?: string;
  value?: string;
  children?: ReactNode;
  labelClassName?: string;
}) {
  return (
    <div className="grid min-h-[36px] grid-cols-[22px_minmax(0,1fr)_56px] items-center gap-1.5 bg-white px-2 py-1.5">
      <span className="grid h-5 w-5 place-items-center border border-slate-300 bg-slate-100 text-[10px] font-black text-slate-700">{marker}</span>
      <div className="min-w-0">
        {children ?? <p className={`truncate text-xs font-black ${labelClassName}`}>{label}</p>}
      </div>
      <span className="shrink-0 text-right text-xs font-black text-slate-900">{value}</span>
    </div>
  );
}

function ComicCardEditorCard({
  slot,
  card,
  calculated,
  index,
  selected,
  onSelect,
  onOpenPicker,
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
  onOpenPicker: () => void;
  onQualityChange: (quality: number) => void;
  onOptionChange: (optionSlot: CardOptionSlot, value: string) => void;
  onCraftChange: (craftIndex: number, patch: Partial<{ color: CraftColor; stat: AccountStatKey }>) => void;
}) {
  const imageUrl = card?.localImageUrl ?? card?.sourceImageUrl;

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-white shadow-sm ${selected ? 'border-cyan-400 ring-2 ring-cyan-200/50' : 'border-slate-200'}`}
    >
      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 p-2">
        <div className="grid content-start gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="relative mx-auto h-32 w-20 overflow-hidden border border-slate-200 bg-white shadow-sm"
            aria-label={`카드 슬롯 ${index + 1} 선택`}
          >
            {imageUrl ? <Image src={imageUrl} alt={card?.name ?? `카드 슬롯 ${index + 1}`} fill sizes="80px" unoptimized className="object-contain p-1" /> : null}
          </button>
          <button
            type="button"
            onClick={onOpenPicker}
            className="border border-cyan-500 bg-white px-2 py-1.5 text-[11px] font-black text-cyan-700 shadow-sm hover:bg-cyan-50"
            aria-label={`카드 슬롯 ${index + 1} 교체`}
          >
            교체
          </button>
          <label className="grid gap-1 border border-slate-200 bg-white p-1.5">
            <span className="text-[10px] font-black text-slate-500">카드 등급</span>
            <select
              value={slot.quality}
              onChange={(event) => onQualityChange(Number(event.target.value))}
              className="min-w-0 border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-900 outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((quality) => <option key={quality} value={quality}>{quality}</option>)}
            </select>
          </label>
        </div>
        <div className="min-w-0 border border-slate-200 bg-white">
          <div className="grid gap-1 border-b border-slate-200 bg-white px-2 py-2">
            <button type="button" onClick={onSelect} className="min-w-0 text-left">
              <h4 className="line-clamp-2 min-h-8 text-xs font-black leading-tight text-slate-950">{card?.name ?? '카드 없음'}</h4>
            </button>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-amber-700">세공 {calculated.craftedStars}단계</span>
              <span className="text-[10px] font-bold text-cyan-700">#{index + 1}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-200 text-center">
            <div className="px-1 py-1.5">
              <p className="text-[9px] font-black text-slate-500">공격</p>
              <p className="text-xs font-black text-slate-950">+{formatNumber(calculated.attackContribution)}%</p>
            </div>
            <div className="border-x border-slate-200 px-1 py-1.5">
              <p className="text-[9px] font-black text-slate-500">관통</p>
              <p className="text-xs font-black text-slate-950">+{formatNumber(calculated.pierce)}%</p>
            </div>
            <div className="px-1 py-1.5">
              <p className="text-[9px] font-black text-slate-500">파랑</p>
              <p className="text-xs font-black text-slate-950">{calculated.blueStars}/6</p>
            </div>
          </div>
          <div className="p-2">
            <StatPills stats={calculated.stats} limit={2} />
          </div>
        </div>
      </div>

      <div className="grid gap-1.5 px-2 pb-2">
        {card ? (
          <GameCardOptionSection title="고정 옵션" className="text-slate-950">
            {card.fixedStats.map((stat, fixedIndex) => (
              <GameCardOptionRow
                key={stat}
                marker={fixedIndex + 1}
                label={formatCardOptionLabel(stat)}
                value={getCardOptionDisplayValue(stat, slot.quality, 'fixed')}
                labelClassName="text-slate-900"
              />
            ))}
          </GameCardOptionSection>
        ) : null}

        {card ? (
          <GameCardOptionSection title="추가 옵션" className="text-slate-950">
            {cardOptionSlots.map((optionSlot, optionIndex) => (
              <GameCardOptionRow
                key={`${slot.slotId}-${optionSlot.key}`}
                marker={optionIndex + 4}
                value={getCardOptionDisplayValue(slot.selectedOptions[optionSlot.key], slot.quality, 'optional')}
              >
                <select
                  aria-label={`카드 슬롯 ${index + 1} ${optionSlot.label}`}
                  value={slot.selectedOptions[optionSlot.key]}
                  onChange={(event) => onOptionChange(optionSlot.key, event.target.value)}
                  className="w-full min-w-0 border border-slate-300 bg-white px-1.5 py-1 text-xs font-black text-slate-900 outline-none focus:border-cyan-500"
                >
                  {card.optionalStats[optionSlot.key].map((option) => <option key={option} value={option}>{formatCardOptionLabel(option)}</option>)}
                </select>
              </GameCardOptionRow>
            ))}
          </GameCardOptionSection>
        ) : null}

        <GameCardOptionSection title="세공 옵션" className="text-slate-950">
          {slot.crafted.map((craft, craftIndex) => (
            <GameCardOptionRow
              key={`${slot.slotId}-craft-${craftIndex}`}
              marker="★"
              value={formatCraftStatValue(craft.stat, craft.color)}
              labelClassName="text-lime-300"
            >
              <div className="grid gap-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {craftColors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      aria-label={`슬롯 ${index + 1} 세공 ${craftIndex + 1} ${color.label}`}
                      title={color.label}
                      onClick={() => onCraftChange(craftIndex, { color: color.id })}
                      className={`grid h-6 place-items-center border ${craft.color === color.id ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                    >
                      <span className={`h-3.5 w-3.5 ${color.id === 'blue' ? 'bg-sky-400' : color.id === 'red' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    </button>
                  ))}
                </div>
                <select
                  aria-label={`카드 슬롯 ${index + 1} 세공 ${craftIndex + 1} 옵션`}
                  value={craft.stat}
                  onChange={(event) => onCraftChange(craftIndex, { stat: event.target.value as AccountStatKey })}
                  className="min-w-0 border border-slate-300 bg-white px-1.5 py-1 text-xs font-black text-slate-900 outline-none focus:border-emerald-500"
                >
                  {craftStatOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </div>
            </GameCardOptionRow>
          ))}
        </GameCardOptionSection>
      </div>
    </article>
  );
}

function normalizeCardSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

function cardSearchText(card: ComicCardDefinition) {
  return [
    card.id,
    card.name,
    card.type,
    card.fixedStats.join(' '),
    card.fixedStats.map(formatCardOptionLabel).join(' '),
    card.optionalStats.stat4.join(' '),
    card.optionalStats.stat4.map(formatCardOptionLabel).join(' '),
    card.optionalStats.stat5.join(' '),
    card.optionalStats.stat5.map(formatCardOptionLabel).join(' '),
    card.optionalStats.stat6.join(' '),
    card.optionalStats.stat6.map(formatCardOptionLabel).join(' '),
    card.note,
  ].filter(Boolean).join(' ');
}

function CardPickerPanel({
  slotIndex,
  currentCard,
  equippedCardIds,
  onSelect,
  onClose,
}: {
  slotIndex: number;
  currentCard?: ComicCardDefinition;
  equippedCardIds: ReadonlySet<string>;
  onSelect: (cardId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeCardSearch(deferredQuery);
  const cardOptions = useMemo(() => premiumComicCards.map((card) => ({
    card,
    normalizedSearchText: normalizeCardSearch(cardSearchText(card)),
  })), []);
  const visibleCards = useMemo(() => {
    if (!normalizedQuery) return cardOptions;
    return cardOptions.filter((option) => option.normalizedSearchText.includes(normalizedQuery));
  }, [cardOptions, normalizedQuery]);

  const pickCard = (cardId: string) => {
    onSelect(cardId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-purple-100">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-purple-600">카드 교체</p>
              <h3 className="text-lg font-black text-slate-950">슬롯 #{slotIndex + 1}</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">현재 {currentCard?.name ?? '카드 없음'}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-purple-50 hover:text-purple-700" aria-label="카드 교체창 닫기">×</button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="카드 이름 / 옵션 검색"
              aria-label="카드 검색"
              className="min-w-0 flex-1 rounded-2xl border border-purple-100 bg-purple-50/40 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-300 focus:bg-white"
            />
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleCards.length}/{cardOptions.length}</span>
          </div>
        </div>

        <div className="grid max-h-[66vh] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {visibleCards.length ? visibleCards.map(({ card }) => {
            const imageUrl = card.localImageUrl ?? card.sourceImageUrl;
            const active = currentCard?.id === card.id;
            const disabled = equippedCardIds.has(card.id) && !active;
            return (
              <button
                key={card.id}
                type="button"
                disabled={disabled}
                onClick={() => pickCard(card.id)}
                className={`rounded-2xl border p-3 text-left transition ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-45' : 'hover:border-purple-300 hover:bg-purple-50'} ${active ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-100 opacity-100' : 'border-slate-200 bg-slate-50'}`}
              >
                <span className="relative mx-auto block h-32 w-20 overflow-hidden rounded-xl bg-white">
                  {imageUrl ? <Image src={imageUrl} alt={card.name} fill sizes="80px" unoptimized className="object-contain p-1" /> : null}
                </span>
                <span className="mt-2 line-clamp-2 block min-h-9 text-xs font-black leading-tight text-slate-950">{card.name}</span>
                <span className={`mt-1 block truncate text-[10px] font-black ${disabled ? 'text-slate-500' : 'text-purple-700'}`}>{active ? '현재 장착' : disabled ? '다른 슬롯 장착중' : card.type}</span>
              </button>
            );
          }) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-black text-slate-400 sm:col-span-3 lg:col-span-5 xl:col-span-6">검색 결과 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

const xSwordBoardOrder: XSwordElementId[] = ['strength', 'intelligence', 'stamina', 'judgement', 'dexterity', 'psionic'];
const xSwordMasteryOrder: XSwordElementId[] = ['strength', 'intelligence', 'judgement', 'psionic', 'stamina', 'dexterity'];

const xSwordElementVisuals: Record<XSwordElementId, {
  koreanLabel: string;
  softBg: string;
  border: string;
  text: string;
  dot: string;
  inactiveDot: string;
  bar: string;
  glow: string;
}> = {
  strength: {
    koreanLabel: '힘',
    softBg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    dot: 'bg-orange-500 border-orange-600',
    inactiveDot: 'bg-orange-100 border-orange-200',
    bar: 'bg-orange-500 border-orange-600',
    glow: 'shadow-[0_0_26px_rgba(249,115,22,0.28)]',
  },
  intelligence: {
    koreanLabel: '지능',
    softBg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400 border-yellow-500',
    inactiveDot: 'bg-yellow-100 border-yellow-200',
    bar: 'bg-yellow-400 border-yellow-500',
    glow: 'shadow-[0_0_26px_rgba(250,204,21,0.28)]',
  },
  judgement: {
    koreanLabel: '판단력',
    softBg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    dot: 'bg-red-500 border-red-600',
    inactiveDot: 'bg-red-100 border-red-200',
    bar: 'bg-red-500 border-red-600',
    glow: 'shadow-[0_0_26px_rgba(239,68,68,0.28)]',
  },
  psionic: {
    koreanLabel: '사이오닉',
    softBg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    dot: 'bg-purple-500 border-purple-600',
    inactiveDot: 'bg-purple-100 border-purple-200',
    bar: 'bg-purple-500 border-purple-600',
    glow: 'shadow-[0_0_26px_rgba(168,85,247,0.28)]',
  },
  stamina: {
    koreanLabel: '스태미나',
    softBg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500 border-emerald-600',
    inactiveDot: 'bg-emerald-100 border-emerald-200',
    bar: 'bg-emerald-500 border-emerald-600',
    glow: 'shadow-[0_0_26px_rgba(16,185,129,0.28)]',
  },
  dexterity: {
    koreanLabel: '기술',
    softBg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-700',
    dot: 'bg-sky-500 border-sky-600',
    inactiveDot: 'bg-sky-100 border-sky-200',
    bar: 'bg-sky-500 border-sky-600',
    glow: 'shadow-[0_0_26px_rgba(14,165,233,0.28)]',
  },
};

type XSwordDisplayRow = {
  slotIndex: number;
  slot: EditableXSwordSlot;
  element: XSwordElement;
};

function getXSwordVisual(elementId: XSwordElementId) {
  return xSwordElementVisuals[elementId];
}

function XSwordRuneTrack({ elementId, level, size = 'normal' }: { elementId: XSwordElementId; level: number; size?: 'normal' | 'small' }) {
  const visual = getXSwordVisual(elementId);
  return (
    <div className={`grid grid-cols-6 ${size === 'small' ? 'gap-0.5' : 'gap-1'}`} aria-label={`마스터리 ${level}/6`}>
      {Array.from({ length: 6 }, (_, runeIndex) => (
        <span
          key={`${elementId}-rune-${runeIndex}`}
          className={`${size === 'small' ? 'h-3.5 w-3.5' : 'h-4 w-4'} rounded-[3px] border ${runeIndex < level ? visual.dot : visual.inactiveDot}`}
        />
      ))}
    </div>
  );
}

function formatXSwordOptionValue(option: EditableXSwordOption) {
  const definition = getXSwordOptionDefinition(option.optionId);
  const value = formatNumber(option.value);
  return definition.statKey === 'instinctAttack' ? `+${value}` : `+${value}%`;
}

function formatXSwordLevelEffect(element: XSwordElement, level: number) {
  const normalizedLevel = clampSpecValue(level, 0, 6);
  const value = normalizedLevel > 0 ? element.levelValues[normalizedLevel - 1] ?? 0 : 0;
  const suffix = element.statKey === 'instinctAttack' ? '' : '%';

  return `${gameStatLabels[element.statKey] ?? element.statLabel} +${formatNumber(value)}${suffix}`;
}

function XSwordLevelEffectTable({ element, level }: { element: XSwordElement; level: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-600">소드 레벨 효과</span>
        <span className="truncate text-[10px] font-black text-slate-400">{gameStatLabels[element.statKey] ?? element.statLabel}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {element.levelValues.map((value, index) => {
          const swordLevel = index + 1;
          const active = swordLevel === level;
          return (
            <span key={`${element.id}-level-effect-${swordLevel}`} className={`rounded border px-2 py-1 text-[10px] font-black ${active ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              Lv.{swordLevel} +{formatNumber(value)}{element.statKey === 'instinctAttack' ? '' : '%'}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function XSwordOptionSummaryList({ slot, dense = false }: { slot: EditableXSwordSlot; dense?: boolean }) {
  return (
    <div className={`grid ${dense ? 'gap-1' : 'gap-1.5'}`}>
      {slot.options.map((option, optionIndex) => {
        const definition = getXSwordOptionDefinition(option.optionId);
        return (
          <div
            key={`${slot.id}-summary-${optionIndex}`}
            className={`grid grid-cols-[18px_minmax(0,1fr)_52px] items-center gap-1.5 rounded border border-slate-200 bg-white/85 ${dense ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}
          >
            <span className="grid h-4 w-4 place-items-center rounded bg-slate-900 text-[9px] font-black text-white">{optionIndex + 1}</span>
            <span className={`min-w-0 truncate font-black text-slate-700 ${dense ? 'text-[10px]' : 'text-xs'}`}>{definition.label}</span>
            <span className={`text-right font-black text-sky-700 ${dense ? 'text-[10px]' : 'text-xs'}`}>{formatXSwordOptionValue(option)}</span>
          </div>
        );
      })}
    </div>
  );
}

function XSwordBoardCard({
  row,
  selected,
  onSelect,
}: {
  row: XSwordDisplayRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const { slot, element } = row;
  const visual = getXSwordVisual(slot.elementId);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative min-h-[388px] rounded-lg border bg-white p-3 text-left transition ${selected ? `${visual.border} ${visual.glow} ring-2 ring-slate-900/10` : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
      aria-label={`${visual.koreanLabel} X-소드 선택`}
    >
      <span className={`absolute inset-x-8 top-5 h-24 rounded-lg ${visual.softBg} opacity-90 blur-md`} />
      <span className="relative mx-auto grid h-36 w-32 place-items-center">
        <span className={`absolute inset-x-3 top-2 h-28 rounded-md border-2 ${visual.border} ${visual.softBg}`} />
        <span className="absolute inset-x-6 bottom-0 h-10 bg-slate-100 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <Image src={element.sourceImageUrl} alt={element.name} width={104} height={104} unoptimized className="relative z-10 h-24 w-24 -rotate-12 object-contain drop-shadow-xl" />
        <span className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded bg-white/90 px-1.5 py-1 shadow-sm">
          <XSwordRuneTrack elementId={slot.elementId} level={slot.masteryLevel} size="small" />
        </span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-slate-950">{visual.koreanLabel}</span>
          <span className="mt-0.5 block text-[11px] font-bold text-slate-500">{element.name} Sword</span>
        </span>
        <span className={`rounded border px-2 py-1 text-xs font-black ${visual.border} ${visual.text}`}>Lv.{slot.masteryLevel}</span>
      </span>
      <span className="mt-3 block rounded-lg border border-slate-200 bg-slate-50 p-2">
        <span className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-black text-slate-500">추가 옵션</span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-400">6줄</span>
        </span>
        <XSwordOptionSummaryList slot={slot} dense />
      </span>
    </button>
  );
}

function XSwordMasteryPanel({
  rows,
  selectedSlotIndex,
  totalMastery,
  masteryAllAttack,
  onSelect,
  selectedRow,
  onMasteryChange,
  onOptionChange,
}: {
  rows: XSwordDisplayRow[];
  selectedSlotIndex: number;
  totalMastery: number;
  masteryAllAttack: number;
  onSelect: (slotIndex: number) => void;
  selectedRow?: XSwordDisplayRow;
  onMasteryChange: (masteryLevel: number) => void;
  onOptionChange: (optionIndex: number, patch: Partial<EditableXSwordOption>) => void;
}) {
  const rowsByElement = new Map(rows.map((row) => [row.slot.elementId, row]));

  return (
    <aside className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-sky-950 px-4 py-3 text-white">
        <p className="text-base font-black">속성 마스터리</p>
      </div>
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-5">
        <p className="text-5xl font-black leading-none text-slate-950">{formatNumber(totalMastery)}</p>
        <div>
          <p className="text-sm font-black text-slate-500">마스터리 효과</p>
          <p className="mt-1 text-sm font-black text-slate-950">모든 일반 공격력 상승 +{formatNumber(masteryAllAttack)}%</p>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-sky-900 px-4 py-2 text-sm font-black text-white">속성 레벨</div>
      <div className="divide-y divide-slate-100">
        {xSwordMasteryOrder.map((elementId) => {
          const element = xSwordElements.find((item) => item.id === elementId);
          const row = rowsByElement.get(elementId);
          const level = row?.slot.masteryLevel ?? 0;
          const visual = getXSwordVisual(elementId);
          const selected = row?.slotIndex === selectedSlotIndex;
          return (
            <button
              key={elementId}
              type="button"
              onClick={() => {
                if (row) onSelect(row.slotIndex);
              }}
              className={`grid w-full grid-cols-[74px_28px_minmax(0,1fr)] items-center gap-3 px-4 py-3 text-left ${selected ? 'bg-sky-50' : 'bg-white hover:bg-slate-50'}`}
            >
              <span className="text-sm font-black text-slate-700">{visual.koreanLabel}</span>
              <span className="text-lg font-black text-slate-950">{level}</span>
              <span className="min-w-0">
                <span className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 6 }, (_, barIndex) => (
                    <span key={`${elementId}-bar-${barIndex}`} className={`h-5 rounded-[2px] border ${barIndex < level ? visual.bar : 'border-slate-200 bg-slate-100'}`} />
                  ))}
                </span>
                {element ? <span className="mt-1 block truncate text-[10px] font-black text-slate-500">{formatXSwordLevelEffect(element, level)}</span> : null}
              </span>
              <span className="sr-only">{element?.name}</span>
            </button>
          );
        })}
      </div>
      {selectedRow ? (
        <XSwordInlineOptionEditor
          row={selectedRow}
          onMasteryChange={onMasteryChange}
          onOptionChange={onOptionChange}
        />
      ) : null}
    </aside>
  );
}

function XSwordInlineOptionEditor({
  row,
  onMasteryChange,
  onOptionChange,
}: {
  row: XSwordDisplayRow;
  onMasteryChange: (masteryLevel: number) => void;
  onOptionChange: (optionIndex: number, patch: Partial<EditableXSwordOption>) => void;
}) {
  const { slot, element } = row;
  const visual = getXSwordVisual(slot.elementId);
  const applyMasteryLevel = (value: number) => {
    onMasteryChange(clampSpecValue(value, 0, 6));
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4" data-testid="x-sword-inline-option-editor">
      <div className="grid gap-4">
        <div className={`rounded-lg border ${visual.border} ${visual.softBg} p-3`}>
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded border border-white bg-white shadow-sm">
              <Image src={element.sourceImageUrl} alt={element.name} width={54} height={54} unoptimized className="h-14 w-14 -rotate-12 object-contain drop-shadow-lg" />
            </div>
            <div className="min-w-0">
              <p className={`text-lg font-black ${visual.text}`}>{visual.koreanLabel}</p>
              <p className="truncate text-xs font-bold text-slate-500">{element.name} Sword</p>
              <div className="mt-2">
                <XSwordRuneTrack elementId={slot.elementId} level={slot.masteryLevel} />
              </div>
            </div>
          </div>
          <label className="mt-4 grid gap-1.5">
            <span className="text-xs font-black text-slate-600">소드별 마스터리</span>
            <span className="grid grid-cols-[42px_minmax(0,1fr)_42px] overflow-hidden rounded border border-slate-300 bg-white">
              <button
                type="button"
                aria-label={`${visual.koreanLabel} X-소드 마스터리 감소`}
                onClick={() => applyMasteryLevel(slot.masteryLevel - 1)}
                className="bg-slate-50 text-lg font-black text-slate-600 hover:bg-slate-100"
              >
                -
              </button>
              <input
                aria-label={`${visual.koreanLabel} X-소드 마스터리`}
                type="number"
                inputMode="numeric"
                min={0}
                max={6}
                step={1}
                value={slot.masteryLevel}
                onChange={(event) => applyMasteryLevel(Number(event.target.value))}
                className="min-w-0 bg-white px-2 py-2 text-center text-base font-black text-slate-950 outline-none"
              />
              <button
                type="button"
                aria-label={`${visual.koreanLabel} X-소드 마스터리 증가`}
                onClick={() => applyMasteryLevel(slot.masteryLevel + 1)}
                className="bg-slate-50 text-lg font-black text-slate-600 hover:bg-slate-100"
              >
                +
              </button>
            </span>
          </label>
          <div className="mt-3">
            <XSwordLevelEffectTable element={element} level={slot.masteryLevel} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-sky-700">기술 아래 옵션</p>
              <h4 className="text-lg font-black text-slate-950">추가 옵션 6줄</h4>
            </div>
            <span className="rounded border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">6줄</span>
          </div>
          <div className="grid gap-2">
            {slot.options.map((option, optionIndex) => {
              const definition = getXSwordOptionDefinition(option.optionId);
              return (
                <div key={`${slot.id}-option-${optionIndex}`} className="grid grid-cols-[44px_minmax(0,1fr)_76px] items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-2">
                  <span className="text-xs font-black text-slate-500">{optionIndex + 1}번</span>
                  <select
                    aria-label={`${visual.koreanLabel} X-소드 옵션 ${optionIndex + 1}`}
                    value={option.optionId}
                    onChange={(event) => {
                      const optionId = event.target.value as XSwordOptionId;
                      onOptionChange(optionIndex, {
                        optionId,
                        value: getXSwordOptionDefinition(optionId).defaultValue,
                      });
                    }}
                    className="min-w-0 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-800"
                  >
                    {xSwordOptionDefinitions.map((optionDefinition) => (
                      <option key={optionDefinition.id} value={optionDefinition.id}>{optionDefinition.label}</option>
                    ))}
                  </select>
                  <input
                    aria-label={`${visual.koreanLabel} X-소드 옵션 ${optionIndex + 1} 값`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={definition.step}
                    value={option.value}
                    onChange={(event) => onOptionChange(optionIndex, { value: Number(event.target.value) })}
                    className="min-w-0 rounded border border-slate-200 bg-white px-2 py-1.5 text-right text-xs font-black text-slate-900"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
  const [cardPickerSlot, setCardPickerSlot] = useState<number | null>(null);
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
  const equippedCardIds = useMemo(() => new Set(comicCardSlots.map((slot) => slot.cardId)), [comicCardSlots]);
  const xSwordSummary = useMemo(() => summarizeXSwordSlots(xSwordSlots), [xSwordSlots]);
  const swordRows = useMemo(
    () => xSwordSummary.swords.map((sword, index) => {
      const slot = xSwordSlots[index];
      const element = getXSwordElement(sword.elementId);
      return slot && element ? { slotIndex: index, slot, element } : undefined;
    }).filter((row): row is XSwordDisplayRow => Boolean(row)),
    [xSwordSlots, xSwordSummary.swords],
  );
  const orderedSwordRows = useMemo(
    () => xSwordBoardOrder.map((elementId) => swordRows.find((row) => row.slot.elementId === elementId)).filter((row): row is XSwordDisplayRow => Boolean(row)),
    [swordRows],
  );
  const selectedSwordRow = swordRows.find((row) => row.slotIndex === selectedXSwordSlot) ?? orderedSwordRows[0] ?? swordRows[0];
  const customAccountAttack = round1(cardSummary.attack + xSwordSummary.masteryAllAttack);
  const customTotalPierce = round1(cardSummary.pierce + Number(xSwordSummary.stats.pierce ?? 0));
  const pickerCard = cardPickerSlot === null ? undefined : cardSummary.calculatedCards[cardPickerSlot]?.card;

  const openCardPicker = (index: number) => {
    setSelectedCardSlot(index);
    setCardPickerSlot(index);
  };

  const selectCardFromPicker = (cardId: string) => {
    if (cardPickerSlot === null) return;
    if (comicCardSlots.some((slot, index) => index !== cardPickerSlot && slot.cardId === cardId)) return;
    assignCard(cardPickerSlot, cardId);
    setSelectedCardSlot(cardPickerSlot);
  };

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
              <p className="text-sm font-bold text-slate-500">카드별 교체 버튼으로 장착 카드를 선택하고, 옵션과 세공 색상으로 공격/피어스를 자동 계산합니다.</p>
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
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {cardSummary.calculatedCards.map(({ slot, card, calculated }, index) => (
            <ComicCardEditorCard
              key={slot.slotId}
              slot={slot}
              card={card}
              calculated={calculated}
              index={index}
              selected={selectedCardSlot === index}
              onSelect={() => setSelectedCardSlot(index)}
              onOpenPicker={() => openCardPicker(index)}
              onQualityChange={(quality) => updateCardSlot(index, { quality })}
              onOptionChange={(optionSlot, value) => updateCardOption(index, optionSlot, value)}
              onCraftChange={(craftIndex, patch) => updateCraft(index, craftIndex, patch)}
            />
          ))}
        </div>
        {cardPickerSlot !== null ? (
          <CardPickerPanel
            slotIndex={cardPickerSlot}
            currentCard={pickerCard}
            equippedCardIds={equippedCardIds}
            onSelect={selectCardFromPicker}
            onClose={() => setCardPickerSlot(null)}
          />
        ) : null}
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
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-500">X 오브 소드</p>
                  <h4 className="text-lg font-black text-slate-950">장착 소드</h4>
                </div>
                <span className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{swordRows.length}/6</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {orderedSwordRows.map((row) => (
                  <XSwordBoardCard
                    key={row.slot.id}
                    row={row}
                    selected={selectedXSwordSlot === row.slotIndex}
                    onSelect={() => setSelectedXSwordSlot(row.slotIndex)}
                  />
                ))}
              </div>
            </div>
            <XSwordMasteryPanel
              rows={swordRows}
              selectedSlotIndex={selectedXSwordSlot}
              totalMastery={xSwordSummary.masteryLevel}
              masteryAllAttack={xSwordSummary.masteryAllAttack}
              onSelect={setSelectedXSwordSlot}
              selectedRow={selectedSwordRow}
              onMasteryChange={(masteryLevel) => {
                if (selectedSwordRow) updateMasteryLevel(selectedSwordRow.slotIndex, masteryLevel);
              }}
              onOptionChange={(optionIndex, patch) => {
                if (selectedSwordRow) updateXSwordOption(selectedSwordRow.slotIndex, optionIndex, patch);
              }}
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <StatPills stats={xSwordSummary.stats} limit={8} />
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
