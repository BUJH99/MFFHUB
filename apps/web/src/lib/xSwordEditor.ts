import {
  equippedXSwords,
  xSwordElements,
  type AccountStatKey,
  type EquippedXSword,
} from '@mff-data-hub/account';

export type XSwordOptionId =
  | 'damageDealtToAliens'
  | 'damageDealtToHumans'
  | 'damageDealtToMutants'
  | 'damageDealtToPureEvil'
  | 'damageReceivedFromAliens'
  | 'damageReceivedFromHumans'
  | 'damageReceivedFromMutants'
  | 'damageReceivedFromPureEvil'
  | 'damageDealtToJusticeInstinct'
  | 'damageDealtToCrueltyInstinct'
  | 'damageDealtToOrderInstinct'
  | 'damageDealtToDestructionInstinct'
  | 'damageReceivedFromJusticeInstinct'
  | 'damageReceivedFromCrueltyInstinct'
  | 'damageReceivedFromOrderInstinct'
  | 'damageReceivedFromDestructionInstinct'
  | 'flameDamage'
  | 'coldDamage'
  | 'lightningDamage'
  | 'mindDamage'
  | 'flameResist'
  | 'coldResist'
  | 'lightningResist'
  | 'mindResist'
  | 'cooldownDuration'
  | 'movementSpeed'
  | 'concentration'
  | 'crowdControlTime'
  | 'instinctAttack';

export type XSwordOptionDefinition = {
  id: XSwordOptionId;
  label: string;
  category: 'typeDamage' | 'instinctDamage' | 'elemental' | 'utility';
  defaultValue: number;
  step: number;
  statKey?: AccountStatKey;
};

export type EditableXSwordOption = {
  optionId: XSwordOptionId;
  value: number;
};

export type EditableXSwordSlot = {
  id: string;
  elementId: EquippedXSword['elementId'];
  masteryLevel: number;
  options: EditableXSwordOption[];
  note: string;
};

export const xSwordOptionDefinitions: XSwordOptionDefinition[] = [
  { id: 'damageDealtToAliens', label: '외계인에게 주는 일반 피해량 증가', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToHumans', label: '인간에게 주는 일반 피해량 증가', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToMutants', label: '뮤턴트에게 주는 일반 피해량 증가', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToPureEvil', label: '순수 악에게 주는 일반 피해량 증가', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromAliens', label: '외계인에게 받는 일반 피해량 감소', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromHumans', label: '인간에게 받는 일반 피해량 감소', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromMutants', label: '뮤턴트에게 받는 일반 피해량 감소', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromPureEvil', label: '순수 악에게 받는 일반 피해량 감소', category: 'typeDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToJusticeInstinct', label: '정의 본능에게 주는 일반 피해량 증가', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToCrueltyInstinct', label: '잔혹 본능에게 주는 일반 피해량 증가', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToOrderInstinct', label: '질서 본능에게 주는 일반 피해량 증가', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageDealtToDestructionInstinct', label: '파괴 본능에게 주는 일반 피해량 증가', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromJusticeInstinct', label: '정의 본능에게 받는 일반 피해량 감소', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromCrueltyInstinct', label: '잔혹 본능에게 받는 일반 피해량 감소', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromOrderInstinct', label: '질서 본능에게 받는 일반 피해량 감소', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'damageReceivedFromDestructionInstinct', label: '파괴 본능에게 받는 일반 피해량 감소', category: 'instinctDamage', defaultValue: 2.5, step: 0.5 },
  { id: 'flameDamage', label: '화염 피해량 증가', category: 'elemental', defaultValue: 5, step: 0.5, statKey: 'elementalDamage' },
  { id: 'coldDamage', label: '냉기 피해량 증가', category: 'elemental', defaultValue: 5, step: 0.5, statKey: 'elementalDamage' },
  { id: 'lightningDamage', label: '전기 피해량 증가', category: 'elemental', defaultValue: 5, step: 0.5, statKey: 'elementalDamage' },
  { id: 'mindDamage', label: '정신 피해량 증가', category: 'elemental', defaultValue: 5, step: 0.5, statKey: 'elementalDamage' },
  { id: 'flameResist', label: '화염 저항력 상승', category: 'elemental', defaultValue: 5, step: 0.5 },
  { id: 'coldResist', label: '냉기 저항력 상승', category: 'elemental', defaultValue: 5, step: 0.5 },
  { id: 'lightningResist', label: '전기 저항력 상승', category: 'elemental', defaultValue: 5, step: 0.5 },
  { id: 'mindResist', label: '정신 저항력 상승', category: 'elemental', defaultValue: 5, step: 0.5 },
  { id: 'cooldownDuration', label: '스킬 재사용 시간 감소', category: 'utility', defaultValue: 4, step: 0.5, statKey: 'cooldownDuration' },
  { id: 'movementSpeed', label: '이동 속도 상승', category: 'utility', defaultValue: 4, step: 0.5 },
  { id: 'concentration', label: '집중 증가', category: 'utility', defaultValue: 4, step: 0.5 },
  { id: 'crowdControlTime', label: '상태 이상 지속시간 감소', category: 'utility', defaultValue: 4, step: 0.5 },
  { id: 'instinctAttack', label: '본능 공격력 상승', category: 'utility', defaultValue: 600, step: 100, statKey: 'instinctAttack' },
];

const xSwordOptionIds = xSwordOptionDefinitions.map((option) => option.id);
const defaultOptionIds: XSwordOptionId[] = [
  'damageDealtToPureEvil',
  'damageDealtToHumans',
  'damageDealtToAliens',
  'damageDealtToDestructionInstinct',
  'cooldownDuration',
  'lightningDamage',
];

const legacyStatToOptionId: Partial<Record<AccountStatKey, XSwordOptionId>> = {
  cooldownDuration: 'cooldownDuration',
  elementalDamage: 'lightningDamage',
  instinctAttack: 'instinctAttack',
};

const masteryAttackTable: Record<number, number> = {
  0: 0,
  1: 1,
  2: 1.5,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  12: 11,
  13: 12,
  14: 13.5,
  15: 15,
  16: 16.5,
  17: 18,
  18: 19.5,
  19: 21,
  20: 22.5,
  21: 24,
  22: 25.5,
  23: 27,
  24: 28.5,
  25: 30,
  26: 31.5,
  27: 33,
  28: 34.5,
  29: 36,
  30: 37.5,
  31: 39.5,
  32: 41.5,
  33: 43.5,
  34: 45.5,
  35: 47.5,
  36: 50,
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function clampMasteryLevel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(36, Math.max(0, Math.round(number)));
}

function clampSwordMasteryLevel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(6, Math.max(0, Math.round(number)));
}

function readNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? round1(Math.max(0, number)) : fallback;
}

function isOptionId(value: unknown): value is XSwordOptionId {
  return typeof value === 'string' && xSwordOptionIds.includes(value as XSwordOptionId);
}

export function masteryAttackForLevel(level: unknown) {
  return masteryAttackTable[clampMasteryLevel(level)] ?? 0;
}

export function getXSwordOptionDefinition(optionId: XSwordOptionId) {
  return xSwordOptionDefinitions.find((option) => option.id === optionId) ?? xSwordOptionDefinitions[0];
}

function normalizeOptions(value: unknown, fallback: EditableXSwordOption[]): EditableXSwordOption[] {
  const rawOptions = Array.isArray(value) ? value : fallback;

  return Array.from({ length: 6 }, (_, index) => {
    const raw = rawOptions[index] as (Partial<EditableXSwordOption> & { stat?: AccountStatKey }) | undefined;
    const optionId = isOptionId(raw?.optionId)
      ? raw.optionId
      : legacyStatToOptionId[raw?.stat as AccountStatKey] ?? defaultOptionIds[index];
    const definition = getXSwordOptionDefinition(optionId);

    return {
      optionId,
      value: readNumber(raw?.value, definition.defaultValue),
    };
  });
}

function optionsFromStats(stats: EquippedXSword['optionStats']) {
  const statOptions = Object.entries(stats).flatMap(([key, value]) => {
    const optionId = legacyStatToOptionId[key as AccountStatKey];
    return optionId ? [{ optionId, value: readNumber(value, getXSwordOptionDefinition(optionId).defaultValue) }] : [];
  });

  return normalizeOptions(statOptions, defaultOptionIds.map((optionId) => ({
    optionId,
    value: getXSwordOptionDefinition(optionId).defaultValue,
  })));
}

export function createDefaultXSwordSlots(): EditableXSwordSlot[] {
  return equippedXSwords.map((sword, index) => ({
    id: sword.id || `x-sword-${index + 1}`,
    elementId: sword.elementId,
    masteryLevel: clampSwordMasteryLevel(sword.level),
    options: optionsFromStats(sword.optionStats),
    note: sword.note,
  }));
}

export function normalizeXSwordSlots(value: unknown): EditableXSwordSlot[] {
  const defaults = createDefaultXSwordSlots();
  if (!Array.isArray(value)) return defaults;

  return defaults.map((fallback, index) => {
    const raw = value[index] as Partial<EditableXSwordSlot> | undefined;
    if (!raw || typeof raw !== 'object') return fallback;

    return {
      id: fallback.id,
      elementId: xSwordElements.some((element) => element.id === raw.elementId) ? raw.elementId! : fallback.elementId,
      masteryLevel: clampSwordMasteryLevel(raw.masteryLevel ?? (raw as Partial<EditableXSwordSlot> & { level?: number }).level ?? fallback.masteryLevel),
      options: normalizeOptions(raw.options, fallback.options),
      note: typeof raw.note === 'string' ? raw.note : fallback.note,
    };
  });
}

export function toEquippedXSwords(slots: EditableXSwordSlot[]): EquippedXSword[] {
  return slots.map((slot) => {
    const optionStats = slot.options.reduce<EquippedXSword['optionStats']>((stats, option) => {
      const definition = getXSwordOptionDefinition(option.optionId);
      if (!definition.statKey || option.value <= 0) return stats;
      stats[definition.statKey] = round1((stats[definition.statKey] ?? 0) + option.value);
      return stats;
    }, {});

    return {
      id: slot.id,
      elementId: slot.elementId,
      level: slot.masteryLevel,
      runes: Array.from({ length: 6 }, () => slot.elementId),
      optionStats,
      quality: 'refining',
      note: slot.note,
    };
  });
}

export function summarizeXSwordSlots(slots: EditableXSwordSlot[]) {
  const swords = toEquippedXSwords(slots);
  const stats = swords.reduce<Partial<Record<AccountStatKey, number>>>((total, sword) => {
    for (const [key, value] of Object.entries(sword.optionStats)) {
      const statKey = key as AccountStatKey;
      total[statKey] = round1((total[statKey] ?? 0) + Number(value ?? 0));
    }
    return total;
  }, {});
  const normalizedMasteryLevel = clampMasteryLevel(slots.reduce((sum, slot) => sum + slot.masteryLevel, 0));
  const masteryAllAttack = masteryAttackForLevel(normalizedMasteryLevel);

  if (masteryAllAttack) {
    stats.allBasicAttack = round1((stats.allBasicAttack ?? 0) + masteryAllAttack);
  }

  return {
    masteryLevel: normalizedMasteryLevel,
    masteryAllAttack,
    stats,
    swords,
  };
}
