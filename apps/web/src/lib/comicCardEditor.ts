import {
  comicCardDatabase,
  equippedComicCards,
  type AccountStatKey,
  type ComicCardDefinition,
  type StatBlock,
} from '@mff-data-hub/account';

export type CraftColor = 'blue' | 'red' | 'green';
export type CardOptionSlot = 'stat4' | 'stat5' | 'stat6';

export type CardCraftState = {
  color: CraftColor;
  stat: AccountStatKey;
};

export type EditableComicCardSlot = {
  slotId: string;
  cardId: string;
  quality: number;
  selectedOptions: Record<CardOptionSlot, string>;
  crafted: CardCraftState[];
};

export type CalculatedComicCard = {
  attackContribution: number;
  pierce: number;
  blueStars: number;
  craftedStars: number;
  stats: StatBlock;
};

export const premiumComicCards = comicCardDatabase.filter((card) => card.type === 'Premium');

export const craftColors: Array<{ id: CraftColor; label: string; className: string }> = [
  { id: 'blue', label: '파랑', className: 'bg-sky-500 text-white border-sky-500' },
  { id: 'red', label: '빨강', className: 'bg-rose-500 text-white border-rose-500' },
  { id: 'green', label: '초록', className: 'bg-emerald-500 text-white border-emerald-500' },
];

export const craftStatOptions: Array<{ key: AccountStatKey; label: string }> = [
  { key: 'allBasicAttack', label: 'All Basic Attacks' },
  { key: 'physicalAttack', label: 'Physical Attack' },
  { key: 'energyAttack', label: 'Energy Attack' },
  { key: 'maxHp', label: 'Max HP' },
  { key: 'cooldownDuration', label: 'Cooldown Duration' },
  { key: 'ignoreDefense', label: 'Ignore Defense' },
  { key: 'criticalRate', label: 'Critical Rate' },
  { key: 'criticalDamage', label: 'Critical Damage' },
  { key: 'attackSpeed', label: 'Attack Speed' },
  { key: 'ignoreDodge', label: 'Ignore Dodge' },
  { key: 'instinctAttack', label: 'Instinct Attack' },
];

const defaultCraftStats: AccountStatKey[] = [
  'allBasicAttack',
  'energyAttack',
  'physicalAttack',
  'maxHp',
  'cooldownDuration',
  'criticalDamage',
];

const statNameMap: Record<string, AccountStatKey | undefined> = {
  'All Basic Attacks': 'allBasicAttack',
  'Physical Attack': 'physicalAttack',
  'Energy Attack': 'energyAttack',
  'Max HP': 'maxHp',
  'Cooldown Duration': 'cooldownDuration',
  'Ignore Defense': 'ignoreDefense',
  'Ignore Dodge': 'ignoreDodge',
  Dodge: 'ignoreDodge',
  'Critical Rate': 'criticalRate',
  'Critical Damage': 'criticalDamage',
  'Attack Speed': 'attackSpeed',
  'Elemental Damage': 'elementalDamage',
  'Instinct Attack': 'instinctAttack',
};

function clampQuality(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(7, Math.max(1, Math.round(number)));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function readStatKey(label: string) {
  return statNameMap[label.replace(/ Proc$/, '')];
}

function addStat(stats: StatBlock, statKey: AccountStatKey | undefined, value: number) {
  if (!statKey || value <= 0) return;
  stats[statKey] = round1((stats[statKey] ?? 0) + value);
}

function fixedStatValue(statKey: AccountStatKey, quality: number) {
  if (statKey === 'allBasicAttack') return quality + 4;
  if (statKey === 'physicalAttack' || statKey === 'energyAttack') return quality + 6;
  if (statKey === 'maxHp') return quality + 4;
  if (statKey === 'instinctAttack') return quality * 120;
  return Math.max(3, quality - 1);
}

function optionalStatValue(statKey: AccountStatKey, quality: number) {
  if (statKey === 'allBasicAttack') return quality + 3;
  if (statKey === 'physicalAttack' || statKey === 'energyAttack') return quality;
  if (statKey === 'maxHp') return quality + 2;
  if (statKey === 'instinctAttack') return quality * 100;
  return Math.max(3, quality - 1);
}

function craftedStatValue(statKey: AccountStatKey, color: CraftColor) {
  if (statKey === 'instinctAttack') return color === 'blue' ? 600 : 450;
  if (statKey === 'allBasicAttack' || statKey === 'physicalAttack' || statKey === 'energyAttack') {
    return color === 'blue' ? 2.5 : 2;
  }
  if (statKey === 'maxHp') return color === 'green' ? 3.5 : 3;
  return color === 'blue' ? 2 : 1.5;
}

export function pierceFromBlueStars(blueStars: number) {
  if (blueStars >= 6) return 5;
  if (blueStars >= 3) return 2;
  return 0;
}

export function createDefaultCraftState(blueStars = 6): CardCraftState[] {
  return Array.from({ length: 6 }, (_, index) => ({
    color: index < blueStars ? 'blue' : 'green',
    stat: defaultCraftStats[index],
  }));
}

export function createDefaultCardSlots(): EditableComicCardSlot[] {
  return equippedComicCards.map((equipped, index) => {
    const card = comicCardDatabase.find((item) => item.id === equipped.cardId);
    return {
      slotId: `card-slot-${index + 1}`,
      cardId: equipped.cardId,
      quality: equipped.quality,
      selectedOptions: {
        stat4: equipped.selectedOptions[0] ?? card?.optionalStats.stat4[0] ?? '',
        stat5: equipped.selectedOptions[1] ?? card?.optionalStats.stat5[0] ?? '',
        stat6: equipped.selectedOptions[2] ?? card?.optionalStats.stat6[0] ?? '',
      },
      crafted: createDefaultCraftState(equipped.blueStars),
    };
  });
}

export function normalizeCardSlots(value: unknown): EditableComicCardSlot[] {
  const defaults = createDefaultCardSlots();
  if (!Array.isArray(value)) return defaults;

  return defaults.map((fallback, index) => {
    const raw = value[index] as Partial<EditableComicCardSlot> | undefined;
    const card = comicCardDatabase.find((item) => item.id === raw?.cardId) ?? comicCardDatabase.find((item) => item.id === fallback.cardId);
    if (!raw || !card) return fallback;

    return {
      slotId: fallback.slotId,
      cardId: card.id,
      quality: clampQuality(raw.quality),
      selectedOptions: {
        stat4: card.optionalStats.stat4.includes(raw.selectedOptions?.stat4 ?? '') ? raw.selectedOptions!.stat4 : card.optionalStats.stat4[0],
        stat5: card.optionalStats.stat5.includes(raw.selectedOptions?.stat5 ?? '') ? raw.selectedOptions!.stat5 : card.optionalStats.stat5[0],
        stat6: card.optionalStats.stat6.includes(raw.selectedOptions?.stat6 ?? '') ? raw.selectedOptions!.stat6 : card.optionalStats.stat6[0],
      },
      crafted: Array.from({ length: 6 }, (_, craftIndex) => {
        const craft = raw.crafted?.[craftIndex];
        return {
          color: craft?.color === 'blue' || craft?.color === 'red' || craft?.color === 'green' ? craft.color : 'blue',
          stat: craftStatOptions.some((option) => option.key === craft?.stat) ? craft!.stat : defaultCraftStats[craftIndex],
        };
      }),
    };
  });
}

export function calculateComicCardSlot(slot: EditableComicCardSlot, card?: ComicCardDefinition): CalculatedComicCard {
  const definition = card ?? comicCardDatabase.find((item) => item.id === slot.cardId);
  if (!definition) {
    return { attackContribution: 0, pierce: 0, blueStars: 0, craftedStars: 0, stats: {} };
  }

  const quality = clampQuality(slot.quality);
  const stats: StatBlock = {};

  for (const label of definition.fixedStats) {
    const statKey = readStatKey(label);
    if (statKey) addStat(stats, statKey, fixedStatValue(statKey, quality));
  }

  for (const option of Object.values(slot.selectedOptions)) {
    const statKey = readStatKey(option);
    if (statKey) addStat(stats, statKey, optionalStatValue(statKey, quality));
  }

  for (const craft of slot.crafted) {
    addStat(stats, craft.stat, craftedStatValue(craft.stat, craft.color));
  }

  const blueStars = slot.crafted.filter((craft) => craft.color === 'blue').length;
  const pierce = pierceFromBlueStars(blueStars);
  if (pierce) stats.pierce = pierce;

  const attackContribution = round1(
    (stats.allBasicAttack ?? 0)
    + (stats.physicalAttack ?? 0) * 0.5
    + (stats.energyAttack ?? 0) * 0.5,
  );

  return {
    attackContribution,
    pierce,
    blueStars,
    craftedStars: slot.crafted.length,
    stats,
  };
}

export function summarizeComicCardSlots(slots: EditableComicCardSlot[]) {
  const calculatedCards = slots.map((slot) => ({
    slot,
    card: comicCardDatabase.find((item) => item.id === slot.cardId),
    calculated: calculateComicCardSlot(slot),
  }));
  return {
    calculatedCards,
    attack: round1(calculatedCards.reduce((sum, row) => sum + row.calculated.attackContribution, 0)),
    pierce: calculatedCards.reduce((sum, row) => sum + row.calculated.pierce, 0),
    fullBlueCards: calculatedCards.filter((row) => row.calculated.blueStars >= 6).length,
    equippedCardCount: calculatedCards.length,
  };
}
