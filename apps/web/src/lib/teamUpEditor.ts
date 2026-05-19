import {
  getTeamUpStats,
  userTeamUpCollections,
  type AccountStatKey,
  type StatBlock,
  type UserTeamUpCollection,
} from '@mff-data-hub/account';

export type EditableTeamUpCollection = UserTeamUpCollection;

export type TeamUpCollectionSummary = {
  activeTeamUpCollections: number;
  teamUpAttackBudget: number;
  stats: StatBlock;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function clampTeamUpLevel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(10, Math.max(0, Math.round(number)));
}

function scaleStats(stats: StatBlock, level: number, baseLevel: number) {
  if (level <= 0 || baseLevel <= 0) return {};
  const ratio = level / baseLevel;

  return Object.entries(stats).reduce<StatBlock>((scaled, [key, value]) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number === 0) return scaled;
    scaled[key as AccountStatKey] = round1(number * ratio);
    return scaled;
  }, {});
}

function normalizeTeamUpCollection(value: unknown, fallback: UserTeamUpCollection): EditableTeamUpCollection {
  const raw = value && typeof value === 'object'
    ? value as Partial<UserTeamUpCollection>
    : {};
  const collectionLevel = clampTeamUpLevel(raw.collectionLevel ?? fallback.collectionLevel);
  const completedSteps = Math.min(10, collectionLevel + (collectionLevel > 0 ? 1 : 0));

  return {
    ...fallback,
    collectionLevel,
    optionLevel: collectionLevel,
    completedSteps,
    stats: scaleStats(fallback.stats, collectionLevel, fallback.collectionLevel),
    status: collectionLevel > 0 ? fallback.status : 'locked',
  };
}

export function createDefaultTeamUpCollections(): EditableTeamUpCollection[] {
  return userTeamUpCollections.map((collection) => normalizeTeamUpCollection(collection, collection));
}

export function normalizeTeamUpCollections(value: unknown): EditableTeamUpCollection[] {
  const defaults = userTeamUpCollections;
  if (!Array.isArray(value)) return createDefaultTeamUpCollections();

  const byThemeId = new Map(
    value
      .filter((item): item is Partial<UserTeamUpCollection> => Boolean(item) && typeof item === 'object')
      .map((item) => [item.themeId, item]),
  );

  return defaults.map((fallback, index) => {
    const raw = byThemeId.get(fallback.themeId) ?? value[index];
    return normalizeTeamUpCollection(raw, fallback);
  });
}

export function updateTeamUpCollectionLevel(collections: EditableTeamUpCollection[], collectionIndex: number, collectionLevel: unknown) {
  const defaults = userTeamUpCollections;

  return normalizeTeamUpCollections(
    collections.map((collection, index) => (
      index === collectionIndex
        ? { ...collection, collectionLevel: clampTeamUpLevel(collectionLevel) }
        : collection
    )).map((collection, index) => ({
      ...collection,
      themeId: defaults[index]?.themeId ?? collection.themeId,
    })),
  );
}

export function summarizeTeamUpCollections(collections: EditableTeamUpCollection[]): TeamUpCollectionSummary {
  const normalized = normalizeTeamUpCollections(collections);
  const stats = getTeamUpStats(normalized);
  const teamUpAttackBudget = round1(
    (stats.allBasicAttack ?? 0)
      + (stats.physicalAttack ?? 0) * 0.5
      + (stats.energyAttack ?? 0) * 0.5,
  );

  return {
    activeTeamUpCollections: normalized.filter((collection) => collection.collectionLevel > 0).length,
    teamUpAttackBudget,
    stats,
  };
}
