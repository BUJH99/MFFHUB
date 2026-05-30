'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { userRoster } from '@/lib/data';
import { ctpDefinitions, parseCtpName } from '@/lib/ctpInventory';
import { filterIconGroups, getMffAbilityIcons, getMffAttributeIcon, normalizeAttributeKey, type AttributeFilterKey, type FilterIconGroup as AttributeIconGroup, type MffAttributeIcon } from '@/lib/mffAttributeIcons';
import { getCharacterInstinctLabel, translateMffEffectText } from '@/lib/mffTextKorean';
import { catalogCharacters, catalogStats, type CatalogCharacter, type CatalogUniform } from '@mff-data-hub/data';
import type { UserCharacter } from '@mff-data-hub/types';

type Props = {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onSelectCatalog?: (character: CatalogCharacter) => void;
  mode?: 'catalog' | 'my';
};

const PAGE_SIZE = 10;
const artifactStarOptions = [3, 4, 5, 6] as const;
type ArtifactStar = (typeof artifactStarOptions)[number];
const myArtifactStarOptions = [0, 3, 4, 5, 6] as const;
const sourceOptions: Array<'ALL' | CatalogCharacter['sourceStatus']> = ['ALL', 'synced', 'manual'];
const matrixColumnCount = 4;
const myCharacterMatrixColumnCount = 4;
const myCharacterStorageKey = 'mff-data-hub:my-character-builds:v1';
const levelQuickOptions = [60, 70, 80] as const;
const uniformOwnershipPageSize = 6;
const uniformRankOptions = [
  { value: 'normal', label: '일반' },
  { value: 'advanced', label: '고급' },
  { value: 'rare', label: '희귀' },
  { value: 'heroic', label: '영웅' },
  { value: 'legendary', label: '전설' },
  { value: 'mythic', label: '신화' },
] as const;
type UniformRankValue = (typeof uniformRankOptions)[number]['value'];
const validUniformRanks = new Set<string>(uniformRankOptions.map((option) => option.value));
const uruSlotCount = 20;
const uruSlotIndexes = Array.from({ length: uruSlotCount }, (_, index) => index);
const tierIconOptions = [
  { value: 'T1', iconSrc: '/mff-assets/tier/tier-1.png' },
  { value: 'T2', iconSrc: '/mff-assets/tier/tier-2.png' },
  { value: 'T3', iconSrc: '/mff-assets/tier/tier-3.png' },
  { value: 'T4', iconSrc: '/mff-assets/tier/tier-4.png' },
] as const;
const tierRailOptions = [...tierIconOptions].reverse();
const normalUruOptions = [
  { value: 'physical-attack', name: '일반 우루: 물리 공격력', label: '물공', stats: ['Physical Attack'], tone: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'energy-attack', name: '일반 우루: 에너지 공격력', label: '에공', stats: ['Energy Attack'], tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'hp', name: '일반 우루: HP', label: 'HP', stats: ['HP'], tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'critical-rate', name: '일반 우루: 치명타율', label: '치확', stats: ['Critical Rate'], tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'critical-damage', name: '일반 우루: 치명타 피해', label: '치피', stats: ['Critical Damage'], tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'ignore-defense', name: '일반 우루: 방어 무시', label: '무방', stats: ['Ignore Defense'], tone: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'skill-cooldown', name: '일반 우루: 스킬 쿨타임', label: '쿨감', stats: ['Skill Cooldown'], tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'attack-speed', name: '일반 우루: 공격 속도', label: '공속', stats: ['Attack Speed'], tone: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'dodge', name: '일반 우루: 회피율', label: '회피', stats: ['Dodge'], tone: 'bg-lime-50 text-lime-700 border-lime-200' },
] as const;
type NormalUruOption = (typeof normalUruOptions)[number];
type NormalUruValue = NormalUruOption['value'];
const odinBlessingOptions = [
  { value: 'none', name: '미장착', label: '없음', iconSrc: undefined, stats: [] },
  { value: 'amplify', name: 'Odin\'s Blessing: Amplify', label: 'Amplify', iconSrc: '/mff-assets/items/uru_amplify.png', stats: ['Energy Attack', 'Critical Damage'] },
  { value: 'balance', name: 'Odin\'s Blessing: Balance', label: 'Balance', iconSrc: '/mff-assets/items/uru_balance.png', stats: ['Physical Attack', 'Energy Attack'] },
  { value: 'focus', name: 'Odin\'s Blessing: Focus', label: 'Focus', iconSrc: '/mff-assets/items/uru_focus.png', stats: ['Energy Attack', 'Critical Rate'] },
  { value: 'fortitude', name: 'Odin\'s Blessing: Fortitude', label: 'Fortitude', iconSrc: '/mff-assets/items/uru_fortitude.png', stats: ['Physical Attack', 'Ignore Defense'] },
  { value: 'heal', name: 'Odin\'s Blessing: Heal', label: 'Heal', iconSrc: '/mff-assets/items/uru_heal.png', stats: ['HP', 'HP'] },
  { value: 'insight', name: 'Odin\'s Blessing: Insight', label: 'Insight', iconSrc: '/mff-assets/items/uru_insight.png', stats: ['Energy Attack', 'Skill Cooldown'] },
  { value: 'magic', name: 'Odin\'s Blessing: Magic', label: 'Magic', iconSrc: '/mff-assets/items/uru_magic.png', stats: ['Energy Attack', 'Energy Attack'] },
  { value: 'resist', name: 'Odin\'s Blessing: Resist', label: 'Resist', iconSrc: '/mff-assets/items/uru_resist.png', stats: ['Energy Attack', 'Ignore Defense'] },
  { value: 'steel', name: 'Odin\'s Blessing: Steel', label: 'Steel', iconSrc: '/mff-assets/items/uru_steel.png', stats: ['Physical Attack', 'Critical Damage'] },
  { value: 'strike', name: 'Odin\'s Blessing: Strike', label: 'Strike', iconSrc: '/mff-assets/items/uru_strike.png', stats: ['Physical Attack', 'Physical Attack'] },
  { value: 'toughness', name: 'Odin\'s Blessing: Toughness', label: 'Toughness', iconSrc: '/mff-assets/items/uru_toughness.png', stats: ['Physical Attack', 'Critical Rate'] },
  { value: 'will', name: 'Odin\'s Blessing: Will', label: 'Will', iconSrc: '/mff-assets/items/uru_will.png', stats: ['Physical Attack', 'Skill Cooldown'] },
  { value: 'flame', name: 'Odin\'s Blessing: Flame', label: 'Flame', iconSrc: '/mff-assets/items/uru_flame.png', stats: ['All Basic Attacks', 'Fire Damage'] },
  { value: 'chill', name: 'Odin\'s Blessing: Chill', label: 'Chill', iconSrc: '/mff-assets/items/uru_chill.png', stats: ['All Basic Attacks', 'Cold Damage'] },
  { value: 'lightning', name: 'Odin\'s Blessing: Lightning', label: 'Lightning', iconSrc: '/mff-assets/items/uru_lightning.png', stats: ['All Basic Attacks', 'Lightning Damage'] },
  { value: 'poison', name: 'Odin\'s Blessing: Poison', label: 'Poison', iconSrc: '/mff-assets/items/uru_poison.png', stats: ['All Basic Attacks', 'Poison Damage'] },
  { value: 'mind', name: 'Odin\'s Blessing: Mind', label: 'Mind', iconSrc: '/mff-assets/items/uru_mind.png', stats: ['All Basic Attacks', 'Mind Damage'] },
] as const;
type OdinBlessingOption = (typeof odinBlessingOptions)[number];
type OdinBlessingValue = OdinBlessingOption['value'];
type UruSlotValue = 'none' | `normal:${NormalUruValue}` | `odin:${OdinBlessingValue}`;
type UruPickerKind = 'normal' | 'odin';
const legacyOdinBlessingTypeMap: Record<string, OdinBlessingValue> = {
  없음: 'none',
  '물리 공격': 'strike',
  '에너지 공격': 'magic',
  '모든 공격': 'flame',
  HP: 'heal',
  '치명타 피해': 'steel',
  '스킬 쿨타임': 'insight',
  '방어 무시': 'resist',
};
const iso8SetOptions = [
  { value: 'power-of-angry-hulk', label: '분노한 헐크의 힘', effect: '공격력 / 공격속도' },
  { value: 'overdrive', label: '오버드라이브', effect: '공격력 / 치명타 피해' },
  { value: 'hawks-eye', label: '매의 눈', effect: '공격력 / 스킬 쿨타임' },
  { value: 'binary-power', label: '바이너리 파워', effect: 'HP / 생존' },
  { value: 'protect-the-captain', label: '캡틴을 지켜라', effect: '방어 / 생존' },
] as const;
type Iso8SetValue = (typeof iso8SetOptions)[number]['value'];
const ultimateObeliskOption = {
  value: 'Ultimate Obelisk',
  label: '궁극의 오벨리스크',
  iconSrc: '/mff-assets/items/ultimate-obelisk.svg',
};
const equippedCtpOptions = [
  { value: '미장착', label: '미장착', iconSrc: '/mff-assets/items/ultimate-obelisk.svg' },
  ultimateObeliskOption,
  ...ctpDefinitions.flatMap((definition) => [
    { value: definition.name, label: definition.koreanName, iconSrc: `https://thanosvibs.money/static/assets/items/ctp_${definition.id}.png` },
    { value: `Mighty ${definition.name}`, label: `강력 ${definition.koreanName}`, iconSrc: `https://thanosvibs.money/static/assets/items/ctp_${definition.id}.png` },
    { value: `Brilliant ${definition.name}`, label: `찬란 ${definition.koreanName}`, iconSrc: `https://thanosvibs.money/static/assets/items/ctp_${definition.id}.png` },
  ]),
];
const ctpBaseOptions = [
  equippedCtpOptions[0],
  ultimateObeliskOption,
  ...ctpDefinitions.map((definition) => ({ value: definition.name, label: definition.koreanName, iconSrc: `https://thanosvibs.money/static/assets/items/ctp_${definition.id}.png` })),
];
const ctpGradeOptions = [
  { value: 'normal', label: '일반' },
  { value: 'mighty', label: '강력' },
  { value: 'brilliant', label: '찬란' },
] as const;
type CtpBuildGrade = (typeof ctpGradeOptions)[number]['value'];
type CtpOption = { value: string; label: string; iconSrc: string };
const myArtifactFilterOptions = [
  { value: 'owned', label: '보유' },
  { value: 'missing', label: '미보유' },
] as const;
type SelectedFilters = Record<AttributeFilterKey, string[]>;
type MyRosterFilters = {
  tiers: string[];
  ctp: string[];
  artifact: string[];
};
type MyCharacterBuild = {
  tier: string;
  level: number;
  typeEnhancement: number;
  eliteGearUnlocked: boolean;
  eliteGearLevel: number;
  artifactStars: number;
  ctp: string;
  iso8Set: Iso8SetValue;
  uruSlots: UruSlotValue[];
  ownedUniforms: Record<string, boolean>;
  uniformRanks: Record<string, UniformRankValue[]>;
};
type StoredMyCharacterBuild = Partial<Omit<MyCharacterBuild, 'ownedUniforms' | 'uniformRanks' | 'uruSlots'>> & {
  uruSlots?: string[];
  odinBlessings?: string[];
  odinBlessingCount?: number;
  odinBlessingType?: string;
  ownedUniforms?: Record<string, boolean>;
  uniformRanks?: Record<string, string[]>;
};
const totalUniforms = catalogCharacters.reduce((count, character) => count + character.uniforms.length, 0);
const artifactCount = catalogCharacters.filter((character) => character.artifact).length;
const ownedRosterCount = userRoster.filter((character) => character.owned).length;
const rosterByCharacterKey = new Map(userRoster.map((character) => [normalizeRosterKey(character.characterId), character]));
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

function normalizeRosterKey(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

function getRosterForCharacter(character: CatalogCharacter): UserCharacter | undefined {
  return rosterByCharacterKey.get(normalizeRosterKey(character.id)) ?? rosterByCharacterKey.get(normalizeRosterKey(character.name));
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function normalizeMyTier(value?: string) {
  if (value === 'T4' || value === 'Native T4' || value === '4') return 'T4';
  if (value === 'T3' || value === 'Awakened' || value === 'Native T3' || value === '3') return 'T3';
  if (value === 'T2' || value === 'Native T2' || value === '2') return 'T2';
  return 'T1';
}

function myTierPatch(tier: string): Partial<MyCharacterBuild> {
  if (tier === 'T4') return { tier, level: 80 };
  if (tier === 'T3') return { tier, level: 70 };
  return { tier };
}

function uniformOwnershipKey(uniform: CatalogUniform, index: number) {
  return `${index}:${uniform.name}`;
}

function isRosterUniformOwned(roster: UserCharacter | undefined, uniform: CatalogUniform, index: number) {
  if (!roster?.uniformOwned) return false;
  if (!roster.uniformId) return index === 0;
  const rosterUniformKey = normalizeRosterKey(roster.uniformId);
  return index === 0 || normalizeRosterKey(uniform.name) === rosterUniformKey;
}

function defaultOwnedUniforms(character: CatalogCharacter, roster = getRosterForCharacter(character)) {
  return character.uniforms.reduce((acc, uniform, index) => {
    acc[uniformOwnershipKey(uniform, index)] = isRosterUniformOwned(roster, uniform, index);
    return acc;
  }, {} as Record<string, boolean>);
}

function odinBlessingOptionFor(value?: string): OdinBlessingOption {
  const normalizedValue = value ? legacyOdinBlessingTypeMap[value] ?? value : undefined;
  return odinBlessingOptions.find((option) => option.value === normalizedValue || option.name === value || option.label === value) ?? odinBlessingOptions[0];
}

function normalizeOdinBlessingType(value?: string): OdinBlessingValue {
  return odinBlessingOptionFor(value).value;
}

function normalUruOptionFor(value?: string): NormalUruOption {
  return normalUruOptions.find((option) => option.value === value || option.name === value || option.label === value) ?? normalUruOptions[0];
}

function uruOptionFor(value?: string) {
  if (!value || value === 'none') return { value: 'none' as UruSlotValue, kind: 'none' as const, name: '미장착', label: '없음', stats: [] as string[], iconSrc: undefined, tone: 'border-slate-200 bg-slate-50 text-slate-400' };
  if (value.startsWith('normal:')) {
    const option = normalUruOptionFor(value.slice('normal:'.length));
    return { ...option, value: `normal:${option.value}` as UruSlotValue, kind: 'normal' as const, iconSrc: undefined };
  }
  const odinValue = value.startsWith('odin:') ? value.slice('odin:'.length) : value;
  const option = odinBlessingOptionFor(odinValue);
  return { ...option, value: option.value === 'none' ? 'none' as UruSlotValue : `odin:${option.value}` as UruSlotValue, kind: option.value === 'none' ? 'none' as const : 'odin' as const, tone: 'border-amber-200 bg-amber-50 text-amber-800' };
}

function normalizeUruSlotValue(value?: string): UruSlotValue {
  return uruOptionFor(value).value;
}

function createEmptyUruSlots() {
  return uruSlotIndexes.map(() => 'none' as UruSlotValue);
}

function normalizeUruSlots(stored?: StoredMyCharacterBuild, fallback = createEmptyUruSlots()) {
  const slots = createEmptyUruSlots();

  if (Array.isArray(stored?.uruSlots)) {
    uruSlotIndexes.forEach((slotIndex) => {
      slots[slotIndex] = normalizeUruSlotValue(stored.uruSlots?.[slotIndex] ?? fallback[slotIndex]);
    });
    return slots;
  }

  if (Array.isArray(stored?.odinBlessings)) {
    uruSlotIndexes.forEach((slotIndex) => {
      const odinValue = normalizeOdinBlessingType(stored.odinBlessings?.[slotIndex]);
      slots[slotIndex] = odinValue === 'none' ? normalizeUruSlotValue(fallback[slotIndex]) : `odin:${odinValue}`;
    });
    return slots;
  }

  uruSlotIndexes.forEach((slotIndex) => {
    slots[slotIndex] = normalizeUruSlotValue(fallback[slotIndex]);
  });

  const legacyCount = clampInteger(stored?.odinBlessingCount, 0, 0, uruSlotCount);
  const legacyType = normalizeOdinBlessingType(stored?.odinBlessingType);
  if (legacyType !== 'none') {
    uruSlotIndexes.slice(0, legacyCount).forEach((slotIndex) => {
      slots[slotIndex] = `odin:${legacyType}`;
    });
  }

  return slots;
}

function updateUruSlot(slots: UruSlotValue[], slotIndex: number, value: UruSlotValue) {
  return uruSlotIndexes.map((index) => (index === slotIndex ? value : normalizeUruSlotValue(slots[index])));
}

function countUruStats(slots: UruSlotValue[]) {
  const statCounts = new Map<string, number>();

  slots.forEach((slotValue) => {
    uruOptionFor(slotValue).stats.forEach((stat) => {
      statCounts.set(stat, (statCounts.get(stat) ?? 0) + 1);
    });
  });

  return Array.from(statCounts, ([stat, count]) => ({
    stat,
    label: translateMffEffectText(stat),
    count,
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
}

function normalizeUniformRanks(uniformRanks?: Record<string, string[]>) {
  return Object.entries(uniformRanks ?? {}).reduce<Record<string, UniformRankValue[]>>((normalized, [key, ranks]) => {
    if (!Array.isArray(ranks)) return normalized;
    const validRanks = ranks.filter((rank): rank is UniformRankValue => validUniformRanks.has(rank));
    if (validRanks.length > 0) normalized[key] = [...new Set(validRanks)];
    return normalized;
  }, {});
}

function iso8SetOptionFor(value?: string) {
  return iso8SetOptions.find((option) => option.value === value || option.label === value) ?? iso8SetOptions[0];
}

function createDefaultMyBuild(character: CatalogCharacter): MyCharacterBuild {
  const roster = getRosterForCharacter(character);

  return {
    tier: normalizeMyTier(roster?.tier),
    level: clampInteger(roster?.level, roster?.owned === false ? 60 : 70, 60, 80),
    typeEnhancement: 0,
    eliteGearUnlocked: false,
    eliteGearLevel: 0,
    artifactStars: clampInteger(roster?.artifactStars, 0, 0, 6),
    ctp: roster?.ctp ?? '미장착',
    iso8Set: 'power-of-angry-hulk',
    uruSlots: createEmptyUruSlots(),
    ownedUniforms: defaultOwnedUniforms(character, roster),
    uniformRanks: {},
  };
}

function normalizeMyBuild(character: CatalogCharacter, stored?: StoredMyCharacterBuild): MyCharacterBuild {
  const fallback = createDefaultMyBuild(character);

  return {
    tier: normalizeMyTier(stored?.tier ?? fallback.tier),
    level: clampInteger(stored?.level, fallback.level, 60, 80),
    typeEnhancement: clampInteger(stored?.typeEnhancement, fallback.typeEnhancement, 0, 6),
    eliteGearUnlocked: Boolean(stored?.eliteGearUnlocked ?? fallback.eliteGearUnlocked),
    eliteGearLevel: clampInteger(stored?.eliteGearLevel, fallback.eliteGearLevel, 0, 20),
    artifactStars: clampInteger(stored?.artifactStars, fallback.artifactStars, 0, 6),
    ctp: stored?.ctp ?? fallback.ctp,
    iso8Set: iso8SetOptionFor(stored?.iso8Set ?? fallback.iso8Set).value,
    uruSlots: normalizeUruSlots(stored, fallback.uruSlots),
    ownedUniforms: { ...fallback.ownedUniforms, ...(stored?.ownedUniforms ?? {}) },
    uniformRanks: { ...fallback.uniformRanks, ...normalizeUniformRanks(stored?.uniformRanks) },
  };
}

function readStoredMyBuilds(): Record<string, StoredMyCharacterBuild> {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(myCharacterStorageKey) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, StoredMyCharacterBuild> : {};
  } catch {
    return {};
  }
}

function ctpOptionForValue(value: string) {
  const exact = equippedCtpOptions.find((option) => option.value === value);
  if (exact) return exact;
  const parsed = parseCtpName(value);
  const definition = parsed ? ctpDefinitions.find((ctp) => ctp.id === parsed.ctpId) : undefined;
  if (!parsed || !definition) return value === ultimateObeliskOption.value ? ultimateObeliskOption : equippedCtpOptions[0];

  return {
    value,
    label: `${parsed.grade === 'brilliant' ? '찬란 ' : parsed.grade === 'mighty' ? '강력 ' : ''}${definition.koreanName}`,
    iconSrc: `https://thanosvibs.money/static/assets/items/ctp_${definition.id}.png`,
  };
}

function ctpBaseValueFor(value: string) {
  if (value === '미장착' || value === ultimateObeliskOption.value) return value;
  const parsed = parseCtpName(value);
  const definition = parsed ? ctpDefinitions.find((ctp) => ctp.id === parsed.ctpId) : undefined;
  return definition?.name ?? value;
}

function ctpGradeForValue(value: string): CtpBuildGrade {
  return parseCtpName(value)?.grade ?? 'normal';
}

function composeCtpValue(baseValue: string, grade: CtpBuildGrade) {
  if (baseValue === '미장착' || baseValue === ultimateObeliskOption.value) return baseValue;
  if (grade === 'brilliant') return `Brilliant ${baseValue}`;
  if (grade === 'mighty') return `Mighty ${baseValue}`;
  return baseValue;
}

function ctpGradeFrameClass(grade: CtpBuildGrade) {
  const frames = {
    normal: 'border-slate-200 bg-slate-50 shadow-sm',
    mighty: 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200',
    brilliant: 'border-amber-400 bg-amber-50 shadow-lg ring-2 ring-amber-200',
  };
  return frames[grade];
}

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
    <div data-testid={`character-ability-icons-${character.id}`} className="flex flex-nowrap justify-center gap-1 overflow-hidden">
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

function createEmptyMyRosterFilters() {
  return {
    tiers: [],
    ctp: [],
    artifact: [],
  } as MyRosterFilters;
}

function hasActiveMyRosterFilters(filters: MyRosterFilters) {
  return filters.tiers.length > 0 || filters.ctp.length > 0 || filters.artifact.length > 0;
}

function countMyRosterFilters(filters: MyRosterFilters) {
  return filters.tiers.length + filters.ctp.length + filters.artifact.length;
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

function myBuildMatchesRosterFilters(_character: CatalogCharacter, build: MyCharacterBuild, filters: MyRosterFilters) {
  const selectedTier = normalizeMyTier(build.tier);
  if (filters.tiers.length > 0 && !filters.tiers.includes(selectedTier)) return false;

  const selectedCtpBase = ctpBaseValueFor(build.ctp);
  if (filters.ctp.length > 0 && !filters.ctp.includes(selectedCtpBase)) return false;

  const artifactOwned = build.artifactStars > 0;
  if (filters.artifact.length > 0) {
    const matchesOwned = artifactOwned && filters.artifact.includes('owned');
    const matchesMissing = !artifactOwned && filters.artifact.includes('missing');
    if (!matchesOwned && !matchesMissing) return false;
  }

  return true;
}

function CharacterCell({
  character,
  selectedUniform,
  active,
  onSelect,
  compact = false,
}: {
  character: CatalogCharacter;
  selectedUniform?: CatalogUniform;
  active?: boolean;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const instinctLabel = getCharacterInstinctLabel(character.tags);
  const displayImageUrl = selectedUniform?.imageUrl ?? character.imageUrl;
  const displayImageLabel = selectedUniform ? `${character.name} - ${selectedUniform.name}` : character.name;
  const cardPadding = compact ? 'p-1.5' : 'p-2';
  const buttonGap = compact ? 'gap-1' : 'gap-2';
  const imageSize = compact ? 74 : 82;
  const imageClassName = compact ? 'h-[74px] w-[74px]' : 'h-[82px] w-[82px]';
  const nameClassName = compact ? 'min-h-7 text-[12px]' : 'min-h-8 text-[13px]';

  return (
    <div className={`w-full rounded-xl border ${cardPadding} ${active ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white'}`}>
      <button type="button" data-testid={`character-select-${character.id}`} onClick={() => onSelect?.(character.id)} className={`grid w-full justify-items-center ${buttonGap} text-center`}>
        <Image
          src={displayImageUrl}
          alt={displayImageLabel}
          width={imageSize}
          height={imageSize}
          unoptimized
          onError={(e) => imageFallback(e, displayImageLabel)}
          className={`${imageClassName} shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover`}
        />
        <p className={`line-clamp-2 w-full break-keep ${nameClassName} font-black leading-tight text-slate-950`}>{character.name}</p>
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

function TierIconButton({
  character,
  tier,
  iconSrc,
  active,
  onClick,
}: {
  character: CatalogCharacter;
  tier: string;
  iconSrc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={`my-character-tier-button-${character.id}-${tier}`}
      aria-pressed={active}
      title={`${character.name} ${tier}`}
      onClick={onClick}
      className={`grid min-h-10 min-w-0 place-items-center rounded-lg border p-1 transition ${active ? 'border-purple-400 bg-purple-100 ring-1 ring-purple-200' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
    >
      <Image src={iconSrc} alt={`${tier} 아이콘`} width={34} height={34} unoptimized className="h-8 w-8 object-contain" />
    </button>
  );
}

function LevelStepperButton({
  character,
  direction,
  disabled,
  onClick,
}: {
  character: CatalogCharacter;
  direction: 'down' | 'up';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={`my-character-level-step-${character.id}-${direction}`}
      aria-label={`${character.name} 레벨 ${direction === 'up' ? '증가' : '감소'}`}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-full place-items-center rounded-lg border border-slate-200 bg-white text-base font-black text-slate-700 transition hover:border-purple-300 hover:bg-purple-50 disabled:opacity-40"
    >
      {direction === 'up' ? '+' : '-'}
    </button>
  );
}

function MyCharacterCell({
  character,
  selectedUniform,
  active,
  build,
  onSelect,
  onBuildChange,
}: {
  character: CatalogCharacter;
  selectedUniform?: CatalogUniform;
  active?: boolean;
  build: MyCharacterBuild;
  onSelect?: (id: string) => void;
  onBuildChange: (patch: Partial<MyCharacterBuild>) => void;
}) {
  return (
    <div data-testid={`my-character-build-layout-${character.id}`} className="w-full">
      <div className="grid w-full grid-cols-[50px_minmax(0,1fr)_70px] items-stretch gap-1.5">
        <div data-testid={`my-character-tier-rail-${character.id}`} className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {tierRailOptions.map(({ value: tier, iconSrc }) => (
            <TierIconButton
              key={`${character.id}-tier-${tier}`}
              character={character}
              tier={tier}
              iconSrc={iconSrc}
              active={build.tier === tier}
              onClick={() => onBuildChange(myTierPatch(tier))}
            />
          ))}
        </div>
        <CharacterCell character={character} selectedUniform={selectedUniform} active={active} onSelect={onSelect} compact />
        <div data-testid={`my-character-level-rail-${character.id}`} className="grid content-start gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <LevelStepperButton character={character} direction="up" disabled={build.level >= 80} onClick={() => onBuildChange({ level: clampInteger(build.level + 1, build.level, 60, 80) })} />
          <div className="grid min-h-14 place-items-center rounded-lg border border-purple-100 bg-white px-2 text-xl font-black leading-none text-slate-950">{build.level}</div>
          <LevelStepperButton character={character} direction="down" disabled={build.level <= 60} onClick={() => onBuildChange({ level: clampInteger(build.level - 1, build.level, 60, 80) })} />
          <div className="mt-1 grid grid-cols-3 gap-0.5">
            {levelQuickOptions.map((level) => (
              <button
                key={`${character.id}-level-${level}`}
                type="button"
                aria-pressed={build.level === level}
                onClick={() => onBuildChange({ level })}
                className={`rounded-md border px-1 py-1 text-[9px] font-black ${build.level === level ? 'border-purple-400 bg-purple-100 text-purple-800' : 'border-slate-200 bg-white text-slate-500 hover:border-purple-300'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 grid w-full grid-cols-[96px_minmax(0,1fr)] gap-1.5">
        <div data-testid={`my-character-type-enhancement-${character.id}`} className="rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-1.5 shadow-sm">
          <p className="text-[10px] font-black text-slate-700">타입강화</p>
          <div className="mt-1 grid grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-1">
            <button
              type="button"
              aria-label={`${character.name} 타입강화 감소`}
              disabled={build.typeEnhancement <= 0}
              onClick={() => onBuildChange({ typeEnhancement: clampInteger(build.typeEnhancement - 1, build.typeEnhancement, 0, 6) })}
              className="rounded-md border border-slate-200 bg-white text-[11px] font-black text-purple-700 disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              max={6}
              value={build.typeEnhancement}
              aria-label={`${character.name} 타입강화 수치`}
              data-testid={`my-character-type-enhancement-input-${character.id}`}
              onChange={(event) => onBuildChange({ typeEnhancement: clampInteger(event.currentTarget.valueAsNumber, 0, 0, 6) })}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-center text-sm font-black text-slate-950 outline-none focus:border-purple-300"
            />
            <button
              type="button"
              aria-label={`${character.name} 타입강화 증가`}
              disabled={build.typeEnhancement >= 6}
              onClick={() => onBuildChange({ typeEnhancement: clampInteger(build.typeEnhancement + 1, build.typeEnhancement, 0, 6) })}
              className="rounded-md border border-slate-200 bg-white text-[11px] font-black text-purple-700 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <div data-testid={`my-character-elite-gear-${character.id}`} className="rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-1.5 shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[10px] font-black text-slate-700">엘리트장비</p>
            <button
              type="button"
              aria-pressed={build.eliteGearUnlocked}
              onClick={() => onBuildChange({ eliteGearUnlocked: !build.eliteGearUnlocked, eliteGearLevel: build.eliteGearUnlocked ? 0 : Math.max(1, build.eliteGearLevel) })}
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${build.eliteGearUnlocked ? 'bg-purple-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}
            >
              {build.eliteGearUnlocked ? '개방' : '미개방'}
            </button>
          </div>
          <div className="mt-1 grid grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-1">
            <button
              type="button"
              aria-label={`${character.name} 엘리트장비 레벨 감소`}
              disabled={!build.eliteGearUnlocked || build.eliteGearLevel <= 1}
              onClick={() => onBuildChange({ eliteGearLevel: clampInteger(build.eliteGearLevel - 1, build.eliteGearLevel, 1, 20) })}
              className="rounded-md border border-slate-200 bg-white text-[11px] font-black text-purple-700 disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              max={20}
              value={build.eliteGearUnlocked ? build.eliteGearLevel : 0}
              aria-label={`${character.name} 엘리트장비 레벨`}
              data-testid={`my-character-elite-gear-level-input-${character.id}`}
              onChange={(event) => {
                const eliteGearLevel = clampInteger(event.currentTarget.valueAsNumber, 0, 0, 20);
                onBuildChange({ eliteGearLevel, eliteGearUnlocked: eliteGearLevel > 0 });
              }}
              className="min-w-0 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-center text-sm font-black text-slate-950 outline-none focus:border-purple-300"
            />
            <button
              type="button"
              aria-label={`${character.name} 엘리트장비 레벨 증가`}
              disabled={!build.eliteGearUnlocked || build.eliteGearLevel >= 20}
              onClick={() => onBuildChange({ eliteGearLevel: clampInteger(build.eliteGearLevel + 1, build.eliteGearLevel, 1, 20) })}
              className="rounded-md border border-slate-200 bg-white text-[11px] font-black text-purple-700 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyCharacterArtifactCell({
  character,
  artifactStars,
  ctp,
  iso8Set,
  onArtifactStarsChange,
  onCtpChange,
  onIso8SetChange,
}: {
  character: CatalogCharacter;
  artifactStars: number;
  ctp: string;
  iso8Set: Iso8SetValue;
  onArtifactStarsChange: (stars: number) => void;
  onCtpChange: (ctp: string) => void;
  onIso8SetChange: (iso8Set: Iso8SetValue) => void;
}) {
  const artifact = character.artifact;

  return (
    <div className="grid gap-2">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-2">
        <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-2">
          <div className="h-12 w-12 overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
            {artifact?.imageUrl ? (
              <Image src={artifact.imageUrl} alt={artifact.name} width={48} height={48} unoptimized onError={(e) => imageFallback(e, artifact.name)} className="h-full w-full object-contain p-1" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm font-black text-amber-600">A</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-slate-950">{artifact?.name ?? '아티팩트 미등록'}</p>
            <p className="mt-1 text-[11px] font-black text-amber-700">{artifactStars > 0 ? `${artifactStars}성 보유중` : '미보유'}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {myArtifactStarOptions.map((star) => (
            <button
              key={`${character.id}-my-artifact-${star}`}
              type="button"
              aria-pressed={artifactStars === star}
              onClick={() => onArtifactStarsChange(star)}
              className={`rounded-lg border px-1 py-1.5 text-[10px] font-black ${artifactStars === star ? 'border-amber-400 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300'}`}
            >
              {star === 0 ? '미보유' : `${star}성`}
            </button>
          ))}
        </div>
      </div>
      <EquippedCtpCell character={character} ctp={ctp} onCtpChange={onCtpChange} />
      <Iso8EffectCell character={character} iso8Set={iso8Set} onIso8SetChange={onIso8SetChange} />
    </div>
  );
}

function Iso8EffectCell({
  character,
  iso8Set,
  onIso8SetChange,
}: {
  character: CatalogCharacter;
  iso8Set: Iso8SetValue;
  onIso8SetChange: (iso8Set: Iso8SetValue) => void;
}) {
  const [openIsoPicker, setOpenIsoPicker] = useState(false);
  const selectedIso = iso8SetOptionFor(iso8Set);

  return (
    <div className="w-full rounded-xl border border-rose-100 bg-rose-50/50 p-2">
      <button
        type="button"
        data-testid={`my-character-iso8-slot-${character.id}`}
        aria-expanded={openIsoPicker}
        onClick={() => setOpenIsoPicker((current) => !current)}
        className="flex w-full items-center gap-2 rounded-lg bg-white p-2 text-left ring-1 ring-rose-100 transition hover:ring-rose-300"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-600 text-[11px] font-black text-white">ISO</span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-black text-slate-950">ISO-8 효과</span>
          <span className="block truncate text-[11px] font-bold text-rose-700">{selectedIso.label} · {selectedIso.effect}</span>
        </span>
      </button>
      {openIsoPicker ? (
        <div data-testid={`my-character-iso8-picker-${character.id}`} className="mt-2 grid gap-1 rounded-xl border border-rose-100 bg-white p-2">
          {iso8SetOptions.map((option) => (
            <button
              key={`${character.id}-iso8-${option.value}`}
              type="button"
              aria-pressed={iso8Set === option.value}
              onClick={() => {
                onIso8SetChange(option.value);
                setOpenIsoPicker(false);
              }}
              className={`rounded-lg border px-2 py-1.5 text-left transition ${iso8Set === option.value ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300'}`}
            >
              <span className="block text-[11px] font-black">{option.label}</span>
              <span className="block text-[10px] font-bold text-slate-500">{option.effect}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CtpIconFrame({ option, grade, size, active = false }: { option: CtpOption; grade: CtpBuildGrade; size: 'sm' | 'md' | 'lg'; active?: boolean }) {
  const sizeClasses = {
    sm: 'h-8 w-8 p-1',
    md: 'h-10 w-10 p-1',
    lg: 'h-12 w-12 p-1.5',
  };
  const imageClasses = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  };

  return (
    <span className={`grid shrink-0 place-items-center rounded-lg border ${sizeClasses[size]} ${ctpGradeFrameClass(grade)} ${active ? 'outline outline-2 outline-purple-300' : ''}`}>
      <Image src={option.iconSrc} alt={option.label} width={42} height={42} unoptimized onError={(e) => imageFallback(e, option.label)} className={`${imageClasses[size]} object-contain`} />
    </span>
  );
}

function CtpIconButton({
  character,
  option,
  selectedGrade,
  active,
  onClick,
}: {
  character: CatalogCharacter;
  option: CtpOption;
  selectedGrade: CtpBuildGrade;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={`my-character-ctp-button-${character.id}-${option.value}`}
      aria-pressed={active}
      title={option.label}
      onClick={onClick}
      className={`grid min-w-0 justify-items-center gap-1 rounded-lg border p-1 text-center transition ${active ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-100' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
    >
      <CtpIconFrame option={option} grade={active ? selectedGrade : 'normal'} size="md" active={active} />
      <span className="w-full truncate text-[8px] font-black text-slate-700">{option.label}</span>
    </button>
  );
}

function CtpGradeButton({
  character,
  selectedOption,
  grade,
  selectedGrade,
  disabled,
  onClick,
}: {
  character: CatalogCharacter;
  selectedOption: CtpOption;
  grade: (typeof ctpGradeOptions)[number];
  selectedGrade: CtpBuildGrade;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      key={`${character.id}-ctp-grade-${grade.value}`}
      type="button"
      data-testid={`my-character-ctp-grade-${character.id}-${grade.value}`}
      aria-pressed={selectedGrade === grade.value}
      disabled={disabled}
      onClick={onClick}
      className={`grid min-w-0 justify-items-center gap-1 rounded-lg border p-1.5 text-[10px] font-black transition ${selectedGrade === grade.value && !disabled ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 disabled:opacity-40'}`}
    >
      <CtpIconFrame option={selectedOption} grade={grade.value} size="sm" active={selectedGrade === grade.value} />
      <span>{grade.label}</span>
    </button>
  );
}

function EquippedCtpCell({
  character,
  ctp,
  onCtpChange,
}: {
  character: CatalogCharacter;
  ctp: string;
  onCtpChange: (ctp: string) => void;
}) {
  const [openCtpPicker, setOpenCtpPicker] = useState(false);
  const selectedOption = ctpOptionForValue(ctp);
  const selectedBaseValue = ctpBaseValueFor(ctp);
  const selectedGrade = ctpGradeForValue(ctp);
  const canReforge = selectedBaseValue !== '미장착' && selectedBaseValue !== ultimateObeliskOption.value;
  const selectBaseCtp = (baseValue: string) => {
    onCtpChange(composeCtpValue(baseValue, selectedGrade));
    if (baseValue === '미장착' || baseValue === ultimateObeliskOption.value) {
      setOpenCtpPicker(false);
    }
  };
  const selectCtpGrade = (grade: CtpBuildGrade) => {
    onCtpChange(composeCtpValue(selectedBaseValue, grade));
    setOpenCtpPicker(false);
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-2">
      <button
        type="button"
        data-testid={`my-character-ctp-slot-${character.id}`}
        aria-expanded={openCtpPicker}
        onClick={() => setOpenCtpPicker((current) => !current)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-purple-300 hover:bg-purple-50"
      >
        <CtpIconFrame option={selectedOption} grade={selectedGrade} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950">장착 CTP</p>
          <p className="truncate text-[11px] font-bold text-slate-500">{selectedOption.label}</p>
        </div>
      </button>
      {openCtpPicker ? (
        <div data-testid={`my-character-ctp-picker-${character.id}`} className="mt-2 rounded-xl border border-purple-200 bg-purple-50 p-2">
          <div className="grid grid-cols-4 gap-1">
            {ctpBaseOptions.map((option) => (
              <CtpIconButton
                key={`${character.id}-ctp-${option.value}`}
                character={character}
                option={option}
                selectedGrade={selectedGrade}
                active={selectedBaseValue === option.value}
                onClick={() => selectBaseCtp(option.value)}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {ctpGradeOptions.map((grade) => (
              <CtpGradeButton
                key={`${character.id}-ctp-grade-${grade.value}`}
                character={character}
                selectedOption={selectedOption}
                grade={grade}
                selectedGrade={selectedGrade}
                disabled={!canReforge}
                onClick={() => selectCtpGrade(grade.value)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UruKindButton({
  character,
  selectedSlotIndex,
  kind,
  label,
  description,
  active,
  onClick,
}: {
  character: CatalogCharacter;
  selectedSlotIndex: number;
  kind: UruPickerKind;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={`my-character-uru-kind-${character.id}-${selectedSlotIndex}-${kind}`}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${active ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-100' : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50'}`}
    >
      <span className="block text-sm font-black text-slate-950">{label}</span>
      <span className="mt-1 block text-[11px] font-bold leading-relaxed text-slate-500">{description}</span>
    </button>
  );
}

function UruOptionButton({
  character,
  selectedSlotIndex,
  value,
  label,
  name,
  stats,
  iconSrc,
  tone,
  active,
  onClick,
}: {
  character: CatalogCharacter;
  selectedSlotIndex: number;
  value: UruSlotValue;
  label: string;
  name: string;
  stats: readonly string[];
  iconSrc?: string;
  tone?: string;
  active: boolean;
  onClick: () => void;
}) {
  const statLabel = stats.length ? stats.map(translateMffEffectText).join(' / ') : '';

  return (
    <button
      type="button"
      data-testid={`my-character-uru-type-${character.id}-${selectedSlotIndex}-${value}`}
      aria-pressed={active}
      title={`${character.name} ${selectedSlotIndex + 1}번 ${name}${statLabel ? ` - ${statLabel}` : ''}`}
      onClick={onClick}
      className={`grid min-h-[48px] min-w-0 justify-items-center gap-0.5 rounded-lg border p-1 text-center transition ${active ? 'border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-200' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'}`}
    >
      {iconSrc ? (
        <Image src={iconSrc} alt={name} width={28} height={28} unoptimized onError={(e) => imageFallback(e, name)} className="h-6 w-6 object-contain" />
      ) : (
        <span className={`grid h-6 w-6 place-items-center rounded-md border text-[9px] font-black ${tone ?? 'border-slate-200 bg-slate-100 text-slate-500'}`}>{label}</span>
      )}
      <span className="w-full truncate text-[8px] font-black text-slate-700">{label}</span>
    </button>
  );
}

function UruSlotButton({
  character,
  slotIndex,
  value,
  active,
  onClick,
}: {
  character: CatalogCharacter;
  slotIndex: number;
  value: UruSlotValue;
  active: boolean;
  onClick: () => void;
}) {
  const option = uruOptionFor(value);
  return (
    <button
      type="button"
      data-testid={`my-character-uru-slot-${character.id}-${slotIndex}`}
      aria-pressed={active}
      title={`${character.name} 우루 ${slotIndex + 1}번: ${option.name}`}
      onClick={onClick}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border text-[9px] font-black transition ${active ? 'border-amber-400 bg-amber-100 ring-1 ring-amber-200' : option.value !== 'none' ? 'border-amber-200 bg-amber-50 hover:border-amber-300' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-amber-300 hover:bg-amber-50'}`}
    >
      {option.iconSrc ? (
        <Image src={option.iconSrc} alt={option.name} width={24} height={24} unoptimized onError={(e) => imageFallback(e, option.name)} className="h-5 w-5 object-contain" />
      ) : option.kind === 'normal' ? (
        <span className={`grid h-6 w-6 place-items-center rounded-sm border text-[8px] ${option.tone}`}>{option.label}</span>
      ) : (
        <span>{slotIndex + 1}</span>
      )}
    </button>
  );
}

function UruCell({
  character,
  build,
  onBuildChange,
}: {
  character: CatalogCharacter;
  build: MyCharacterBuild;
  onBuildChange: (patch: Partial<MyCharacterBuild>) => void;
}) {
  const [openUruSlotIndex, setOpenUruSlotIndex] = useState<number | null>(null);
  const [openUruKind, setOpenUruKind] = useState<UruPickerKind | null>(null);
  const openUru = openUruSlotIndex === null ? undefined : uruOptionFor(build.uruSlots[openUruSlotIndex]);
  const uruStats = countUruStats(build.uruSlots);
  const closePicker = () => {
    setOpenUruSlotIndex(null);
    setOpenUruKind(null);
  };
  const openSlot = (slotIndex: number) => {
    setOpenUruSlotIndex(slotIndex);
    setOpenUruKind(null);
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-1.5">
      <p className="text-xs font-black text-slate-950">우루</p>
      <div data-testid={`my-character-uru-slot-grid-${character.id}`} className="mt-1 grid grid-cols-5 justify-start gap-0.5">
        {uruSlotIndexes.map((slotIndex) => (
          <UruSlotButton
            key={`${character.id}-uru-slot-${slotIndex}`}
            character={character}
            slotIndex={slotIndex}
            value={build.uruSlots[slotIndex]}
            active={openUruSlotIndex === slotIndex}
            onClick={() => openSlot(slotIndex)}
          />
        ))}
      </div>
      <div data-testid={`my-character-uru-summary-${character.id}`} className="mt-1.5 rounded-lg border border-amber-100 bg-amber-50/60 p-1.5">
        <p className="text-[10px] font-black text-amber-800">현재 장착 효과 총합</p>
        {uruStats.length ? (
          <div className="mt-1 flex flex-wrap gap-0.5">
            {uruStats.map((effect) => (
              <span key={effect.stat} className="rounded-full border border-amber-200 bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-700">
                {effect.label} x{effect.count}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[10px] font-black text-slate-400">장착 효과 없음</p>
        )}
      </div>
      {openUruSlotIndex !== null ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 py-6" onClick={closePicker}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${character.name} ${openUruSlotIndex + 1}번 우루 선택`}
            data-testid={`my-character-uru-picker-${character.id}-${openUruSlotIndex}`}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-950">{openUruSlotIndex + 1}번 우루 슬롯 선택</p>
                <p className="truncate text-[11px] font-bold text-amber-700">{openUru?.name ?? '미장착'}</p>
              </div>
              <button
                type="button"
                aria-label="우루 선택 닫기"
                onClick={closePicker}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-600 hover:border-amber-300 hover:bg-amber-50"
              >
                X
              </button>
            </div>
            {!openUruKind ? (
              <div className="grid gap-2">
                <UruKindButton character={character} selectedSlotIndex={openUruSlotIndex} kind="normal" label="일반 우루" description="기본 단일 능력치 우루를 장착합니다." active={openUru?.kind === 'normal'} onClick={() => setOpenUruKind('normal')} />
                <UruKindButton character={character} selectedSlotIndex={openUruSlotIndex} kind="odin" label="오딘의 축복" description="복합 능력치 오딘의 축복을 장착합니다." active={openUru?.kind === 'odin'} onClick={() => setOpenUruKind('odin')} />
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-500 hover:border-amber-300 hover:bg-amber-50"
                  onClick={() => {
                    onBuildChange({ uruSlots: updateUruSlot(build.uruSlots, openUruSlotIndex, 'none') });
                    closePicker();
                  }}
                >
                  미장착
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setOpenUruKind(null)}
                  className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 hover:border-amber-300 hover:bg-amber-50"
                >
                  종류 다시 선택
                </button>
                <div className="grid max-h-[60vh] grid-cols-3 gap-1 overflow-y-auto p-1 sm:grid-cols-4">
                  {(openUruKind === 'normal' ? normalUruOptions : odinBlessingOptions).map((option) => {
                    const value = openUruKind === 'normal'
                      ? `normal:${(option as NormalUruOption).value}` as UruSlotValue
                      : (option as OdinBlessingOption).value === 'none' ? 'none' as UruSlotValue : `odin:${(option as OdinBlessingOption).value}` as UruSlotValue;
                    const optionName = option.name;
                    return (
                      <UruOptionButton
                        key={`${character.id}-uru-${openUruSlotIndex}-${value}`}
                        character={character}
                        selectedSlotIndex={openUruSlotIndex}
                        value={value}
                        label={option.label}
                        name={optionName}
                        stats={option.stats}
                        iconSrc={'iconSrc' in option ? option.iconSrc : undefined}
                        tone={'tone' in option ? option.tone : undefined}
                        active={openUru?.value === value}
                        onClick={() => {
                          onBuildChange({ uruSlots: updateUruSlot(build.uruSlots, openUruSlotIndex, value) });
                          closePicker();
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UniformOwnershipCell({
  character,
  selectedUniformIndex,
  build,
  onSelectUniform,
  onOwnedUniformsChange,
  onUniformRanksChange,
}: {
  character: CatalogCharacter;
  selectedUniformIndex: number;
  build: MyCharacterBuild;
  onSelectUniform: (index: number) => void;
  onOwnedUniformsChange: (ownedUniforms: Record<string, boolean>) => void;
  onUniformRanksChange: (uniformRanks: Record<string, UniformRankValue[]>) => void;
}) {
  const [uniformCellPage, setUniformCellPage] = useState(() => Math.floor(selectedUniformIndex / uniformOwnershipPageSize));
  const uniformPageCount = Math.max(1, Math.ceil(character.uniforms.length / uniformOwnershipPageSize));
  const visibleUniformPage = Math.min(uniformCellPage, uniformPageCount - 1);
  const visibleUniformStart = visibleUniformPage * uniformOwnershipPageSize;
  const visibleUniformEntries = character.uniforms
    .slice(visibleUniformStart, visibleUniformStart + uniformOwnershipPageSize)
    .map((uniform, offset) => ({ uniform, index: visibleUniformStart + offset }));
  const hasUniformPages = character.uniforms.length > uniformOwnershipPageSize;

  useEffect(() => {
    setUniformCellPage(Math.floor(selectedUniformIndex / uniformOwnershipPageSize));
  }, [character.id, selectedUniformIndex]);

  return (
    <td className="border-b border-slate-100 px-2 py-2 align-top">
      {hasUniformPages ? (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
          <button
            type="button"
            data-testid={`my-character-uniform-page-prev-${character.id}`}
            aria-label={`${character.name} 유니폼 이전 셀`}
            disabled={visibleUniformPage <= 0}
            onClick={() => setUniformCellPage((current) => Math.max(0, current - 1))}
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span data-testid={`my-character-uniform-page-indicator-${character.id}`} className="text-[11px] font-black text-slate-600">
            {visibleUniformPage + 1}/{uniformPageCount}
          </span>
          <button
            type="button"
            data-testid={`my-character-uniform-page-next-${character.id}`}
            aria-label={`${character.name} 유니폼 다음 셀`}
            disabled={visibleUniformPage >= uniformPageCount - 1}
            onClick={() => setUniformCellPage((current) => Math.min(uniformPageCount - 1, current + 1))}
            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
      <div data-testid={`my-character-uniform-page-grid-${character.id}`} className="grid grid-cols-2 gap-1.5 2xl:grid-cols-3">
        {visibleUniformEntries.length ? visibleUniformEntries.map(({ uniform, index }) => {
          const ownedKey = uniformOwnershipKey(uniform, index);
          const owned = Boolean(build.ownedUniforms[ownedKey]);
          const selectedRanks = build.uniformRanks[ownedKey] ?? [];
          return (
            <div key={`${character.id}-my-uniform-${uniform.name}-${index}`} className={`min-w-0 rounded-lg border p-1 ${index === selectedUniformIndex ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-100' : 'border-slate-200 bg-white'}`}>
              <button type="button" onClick={() => onSelectUniform(index)} className="grid w-full justify-items-center text-center">
                {uniform.imageUrl ? (
                  <Image src={uniform.imageUrl} alt={uniform.name} width={56} height={56} unoptimized onError={(e) => imageFallback(e, uniform.name)} className="h-11 w-11 rounded-md border border-slate-200 bg-slate-100 object-cover" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-black text-slate-400">UNI</div>
                )}
                <span className="mt-1 line-clamp-2 min-h-7 break-keep text-[8px] font-black leading-tight text-slate-900">{uniform.name}</span>
              </button>
              <label className="mt-1 flex items-center justify-center gap-1 rounded-md bg-slate-50 px-1 py-1 text-[10px] font-black text-slate-600">
                <input
                  type="checkbox"
                  checked={owned}
                  onChange={(event) => {
                    const ownedNext = event.target.checked;
                    onOwnedUniformsChange({ ...build.ownedUniforms, [ownedKey]: ownedNext });
                    if (!ownedNext) onUniformRanksChange({ ...build.uniformRanks, [ownedKey]: [] });
                  }}
                  data-testid={`my-character-uniform-owned-${character.id}-${index}`}
                  className="h-3 w-3 accent-purple-600"
                />
                {owned ? '보유' : '미보유'}
              </label>
              <div className="mt-1 grid grid-cols-3 gap-0.5">
                {uniformRankOptions.map((rank) => {
                  const checked = selectedRanks.includes(rank.value);
                  return (
                    <label key={`${character.id}-${ownedKey}-${rank.value}`} className={`flex min-w-0 items-center justify-center gap-0.5 rounded-md border px-1 py-0.5 text-[9px] font-black ${checked ? 'border-purple-300 bg-purple-100 text-purple-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        data-testid={`my-character-uniform-rank-${character.id}-${index}-${rank.value}`}
                        aria-label={`${character.name} ${uniform.name} ${rank.label} 체크`}
                        onChange={(event) => {
                          const ranksNext = event.target.checked
                            ? [...new Set([...selectedRanks, rank.value])]
                            : selectedRanks.filter((value) => value !== rank.value);
                          onUniformRanksChange({ ...build.uniformRanks, [ownedKey]: ranksNext });
                          if (ranksNext.length > 0 && !owned) onOwnedUniformsChange({ ...build.ownedUniforms, [ownedKey]: true });
                        }}
                        className="h-2.5 w-2.5 accent-purple-600"
                      />
                      <span className="truncate">{rank.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }) : (
          <p className="col-span-3 rounded-lg bg-slate-50 p-3 text-center text-xs font-black text-slate-400">유니폼 없음</p>
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

function MyRosterFilterPanel({
  filters,
  onToggle,
}: {
  filters: MyRosterFilters;
  onToggle: (group: keyof MyRosterFilters, value: string) => void;
}) {
  return (
    <div data-testid="my-character-build-filters" className="mt-4 grid gap-2 xl:grid-cols-[1fr_2fr_1fr]">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="min-w-10 text-[11px] font-black text-slate-700">티어</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-400">{filters.tiers.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {tierIconOptions.map(({ value: tier, iconSrc }) => {
            const active = filters.tiers.includes(tier);
            return (
              <button
                key={`my-character-filter-tier-${tier}`}
                type="button"
                data-testid={`my-character-filter-tier-${tier}`}
                aria-pressed={active}
                title={`티어 ${tier}`}
                onClick={() => onToggle('tiers', tier)}
                className={`grid h-8 min-w-0 place-items-center rounded-lg border p-1 transition ${active ? 'border-purple-400 bg-purple-100 ring-1 ring-purple-200' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
              >
                <Image src={iconSrc} alt={`${tier} 아이콘`} width={22} height={22} unoptimized className="h-5 w-5 object-contain" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="min-w-10 text-[11px] font-black text-slate-700">CTP</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-400">{filters.ctp.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ctpBaseOptions.map((option) => {
            const active = filters.ctp.includes(option.value);
            return (
              <button
                key={`my-character-filter-ctp-${option.value}`}
                type="button"
                data-testid={`my-character-filter-ctp-${option.value}`}
                aria-pressed={active}
                title={option.label}
                onClick={() => onToggle('ctp', option.value)}
                className={`grid h-8 w-8 place-items-center rounded-lg border p-1 transition ${active ? 'border-purple-400 bg-purple-100 ring-1 ring-purple-200' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
              >
                <CtpIconFrame option={option} grade="normal" size="sm" active={active} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="min-w-10 text-[11px] font-black text-slate-700">아티팩트</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-400">{filters.artifact.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {myArtifactFilterOptions.map((option) => {
            const active = filters.artifact.includes(option.value);
            return (
              <button
                key={`my-character-filter-artifact-${option.value}`}
                type="button"
                data-testid={`my-character-filter-artifact-${option.value}`}
                aria-pressed={active}
                title={`아티팩트 ${option.label}`}
                onClick={() => onToggle('artifact', option.value)}
                className={`rounded-lg border px-2 py-2 text-[11px] font-black transition ${active ? 'border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-200' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EnhancedCharacterDB({ selectedId, onSelect, onSelectCatalog, mode = 'catalog' }: Props) {
  const isMyMode = mode === 'my';
  const [query, setQuery] = useState('');
  const [sourceStatus, setSourceStatus] = useState<'ALL' | CatalogCharacter['sourceStatus']>('ALL');
  const [view, setView] = useState<'matrix' | 'cards'>('matrix');
  const [page, setPage] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(() => createEmptyFilters());
  const [myRosterFilters, setMyRosterFilters] = useState<MyRosterFilters>(() => createEmptyMyRosterFilters());
  const [selectedUniformByCharacter, setSelectedUniformByCharacter] = useState<Record<string, number>>({});
  const [selectedArtifactStarByCharacter, setSelectedArtifactStarByCharacter] = useState<Record<string, ArtifactStar>>({});
  const [myCharacterBuilds, setMyCharacterBuilds] = useState<Record<string, StoredMyCharacterBuild>>({});
  const [myCharacterBuildsLoaded, setMyCharacterBuildsLoaded] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const effectiveView = isMyMode ? 'matrix' : view;

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return catalogSearchIndex
      .filter(({ character, searchText }) =>
        (!q || searchText.includes(q)) &&
        (sourceStatus === 'ALL' || character.sourceStatus === sourceStatus) &&
        characterMatchesFilters(character, selectedFilters) &&
        (!isMyMode || myBuildMatchesRosterFilters(character, normalizeMyBuild(character, myCharacterBuilds[character.id]), myRosterFilters)))
      .map(({ character }) => character);
  }, [deferredQuery, isMyMode, myCharacterBuilds, myRosterFilters, sourceStatus, selectedFilters]);

  const dedupedFiltered = useMemo(() => Array.from(new Map(filtered.map((character) => [character.id, character])).values()), [filtered]);
  const visibleColumnCount = isMyMode ? myCharacterMatrixColumnCount : matrixColumnCount;
  const pageCount = Math.max(1, Math.ceil(dedupedFiltered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const currentPageCharacters = dedupedFiltered.slice(pageStart, pageStart + PAGE_SIZE);
  const activeFilterCount = filterIconGroups.reduce((count, group) => count + selectedFilters[group.key].length, 0) + (isMyMode ? countMyRosterFilters(myRosterFilters) : 0);

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

  const toggleMyRosterFilter = (group: keyof MyRosterFilters, value: string) => {
    setMyRosterFilters((current) => {
      const selected = current[group];
      const exists = selected.includes(value);
      return {
        ...current,
        [group]: exists ? selected.filter((item) => item !== value) : [...selected, value],
      };
    });
  };

  const resetFilters = () => {
    setSelectedFilters(createEmptyFilters());
    setMyRosterFilters(createEmptyMyRosterFilters());
  };

  const selectUniform = (characterId: string, index: number) => {
    setSelectedUniformByCharacter((current) => ({ ...current, [characterId]: index }));
  };

  const selectArtifactStar = (characterId: string, star: ArtifactStar) => {
    setSelectedArtifactStarByCharacter((current) => ({ ...current, [characterId]: star }));
  };

  const updateMyBuild = (character: CatalogCharacter, patch: Partial<MyCharacterBuild>) => {
    setMyCharacterBuilds((current) => {
      const currentBuild = normalizeMyBuild(character, current[character.id]);
      return {
        ...current,
        [character.id]: {
          ...currentBuild,
          ...patch,
          ownedUniforms: patch.ownedUniforms ?? currentBuild.ownedUniforms,
          uniformRanks: patch.uniformRanks ?? currentBuild.uniformRanks,
        },
      };
    });
  };

  const selectCharacter = (character: CatalogCharacter) => {
    onSelect?.(character.id);
    onSelectCatalog?.(character);
  };

  useEffect(() => {
    setMyCharacterBuilds(readStoredMyBuilds());
    setMyCharacterBuildsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isMyMode || !myCharacterBuildsLoaded || typeof window === 'undefined') return;
    window.localStorage.setItem(myCharacterStorageKey, JSON.stringify(myCharacterBuilds));
  }, [isMyMode, myCharacterBuilds, myCharacterBuildsLoaded]);

  useEffect(() => {
    setPage(0);
  }, [deferredQuery, sourceStatus, selectedFilters, myRosterFilters, effectiveView]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-600">{isMyMode ? 'My Character Roster' : 'Character DB Matrix'}</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{isMyMode ? '나의 캐릭터' : '전체 캐릭터 DB'}</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">
              {isMyMode
                ? '전체 캐릭터 DB의 검색, 필터, 유니폼 이미지를 그대로 재사용하면서 내 티어, 레벨, 타입강화, 엘리트장비, 아티팩트, CTP, ISO-8, 우루, 유니폼 보유 상태를 관리합니다.'
                : '로컬 PNG 캐시 기반으로 캐릭터, 아티팩트, 유니폼 이미지를 표시합니다. 유니폼 이미지를 누르면 3열의 리더/패시브/유니폼 효과가 해당 유니폼 기준으로 바뀝니다.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-purple-50 px-4 py-3"><p className="text-2xl font-black text-purple-700">{isMyMode ? ownedRosterCount : catalogStats.count}</p><p className="text-[11px] font-black text-purple-500">{isMyMode ? '보유 캐릭' : '표시 캐릭'}</p></div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3"><p className="text-2xl font-black text-blue-700">{totalUniforms}</p><p className="text-[11px] font-black text-blue-500">유니폼</p></div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3"><p className="text-2xl font-black text-amber-700">{artifactCount}</p><p className="text-[11px] font-black text-amber-500">아티팩트</p></div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_150px_150px]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="캐릭터명 / 유니폼 / 아티팩트 / 효과 검색" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100" />
          <select value={sourceStatus} onChange={(e) => setSourceStatus(e.target.value as 'ALL' | CatalogCharacter['sourceStatus'])} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black">
            {sourceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <button onClick={resetFilters} disabled={!hasActiveFilters(selectedFilters) && (!isMyMode || !hasActiveMyRosterFilters(myRosterFilters))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-40">필터 초기화 {activeFilterCount ? activeFilterCount : ''}</button>
          {isMyMode ? (
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">자동 저장</div>
          ) : (
            <button onClick={() => setView(view === 'matrix' ? 'cards' : 'matrix')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{view === 'matrix' ? '카드 보기' : '표 보기'}</button>
          )}
        </div>
        <div data-testid="character-db-icon-filters" className="mt-4 grid gap-2 xl:grid-cols-2">
          {filterIconGroups.map((group) => (
            <FilterIconGroup key={group.key} group={group} selected={selectedFilters[group.key]} onToggle={toggleFilter} />
          ))}
        </div>
        {isMyMode ? <MyRosterFilterPanel filters={myRosterFilters} onToggle={toggleMyRosterFilter} /> : null}
      </div>

      {effectiveView === 'matrix' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table data-testid={isMyMode ? 'my-character-matrix' : 'character-db-matrix'} className="w-full table-fixed border-separate border-spacing-0 text-left">
            {isMyMode ? (
              <colgroup>
                <col style={{ width: '27%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
            ) : (
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '34%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
            )}
            <thead className="bg-slate-950 text-white">
              {isMyMode ? (
                <tr>
                  <th className="px-3 py-4 text-xs font-black">1열 티어 / 레벨 / 캐릭터</th>
                  <th className="px-3 py-4 text-xs font-black">2열 아티팩트 / CTP / ISO-8</th>
                  <th className="px-3 py-4 text-xs font-black">3열 우루</th>
                  <th className="px-3 py-4 text-xs font-black">4열 유니폼 보유</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-3 py-4 text-xs font-black">1열 캐릭터</th>
                  <th className="px-3 py-4 text-xs font-black">2열 아티팩트</th>
                  <th className="px-3 py-4 text-xs font-black">3열 리더 / 패시브 / 유니폼 효과</th>
                  <th className="px-3 py-4 text-xs font-black">4열 유니폼 목록 6열</th>
                </tr>
              )}
            </thead>
            <tbody>
              {currentPageCharacters.map((character) => {
                const selectedUniformIndex = Math.min(selectedUniformByCharacter[character.id] ?? 0, character.uniforms.length - 1);
                const selectedUniform = character.uniforms[selectedUniformIndex];
                const selectedArtifactStar = selectedArtifactStarByCharacter[character.id] ?? 6;
                const myBuild = normalizeMyBuild(character, myCharacterBuilds[character.id]);
                return (
                  <tr key={character.id} data-character-id={character.id} className="align-top hover:bg-purple-50/30">
                    {isMyMode ? (
                      <>
                        <td className="border-b border-slate-100 px-2 py-2">
                          <MyCharacterCell character={character} selectedUniform={selectedUniform} active={character.id === selectedId} build={myBuild} onSelect={() => selectCharacter(character)} onBuildChange={(patch) => updateMyBuild(character, patch)} />
                        </td>
                        <td className="border-b border-slate-100 px-2 py-2">
                          <MyCharacterArtifactCell
                            character={character}
                            artifactStars={myBuild.artifactStars}
                            ctp={myBuild.ctp}
                            iso8Set={myBuild.iso8Set}
                            onArtifactStarsChange={(artifactStars) => updateMyBuild(character, { artifactStars })}
                            onCtpChange={(ctp) => updateMyBuild(character, { ctp })}
                            onIso8SetChange={(iso8Set) => updateMyBuild(character, { iso8Set })}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-2 py-2">
                          <UruCell character={character} build={myBuild} onBuildChange={(patch) => updateMyBuild(character, patch)} />
                        </td>
                        <UniformOwnershipCell
                          character={character}
                          selectedUniformIndex={selectedUniformIndex}
                          build={myBuild}
                          onSelectUniform={(index) => selectUniform(character.id, index)}
                          onOwnedUniformsChange={(ownedUniforms) => updateMyBuild(character, { ownedUniforms })}
                          onUniformRanksChange={(uniformRanks) => updateMyBuild(character, { uniformRanks })}
                        />
                      </>
                    ) : (
                      <>
                        <td className="border-b border-slate-100 px-2 py-2">
                          <CharacterCell character={character} selectedUniform={selectedUniform} active={character.id === selectedId} onSelect={() => selectCharacter(character)} />
                        </td>
                        <td className="border-b border-slate-100 px-2 py-2"><ArtifactCell character={character} selectedStar={selectedArtifactStar} onStarChange={(star) => selectArtifactStar(character.id, star)} /></td>
                        <td className="border-b border-slate-100 px-2 py-2"><SkillCell uniform={selectedUniform} /></td>
                        <UniformGridCell character={character} selectedUniformIndex={selectedUniformIndex} onSelectUniform={(index) => selectUniform(character.id, index)} />
                      </>
                    )}
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
