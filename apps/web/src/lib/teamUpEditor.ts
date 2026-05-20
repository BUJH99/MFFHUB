import {
  getTeamUpLevelStats,
  getTeamUpStats,
  teamUpCollectionThemes,
  teamUpLevelEffects,
  userTeamUpCollections,
  type StatBlock,
  type TeamUpCollectionTheme,
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

const teamUpMaxLevel = teamUpLevelEffects[teamUpLevelEffects.length - 1]?.level ?? 18;
const teamUpEffectLabel = '모든 공격력 / 추가 관통 피해';

export function clampTeamUpLevel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(teamUpMaxLevel, Math.max(0, Math.round(number)));
}

const seededTeamUpCollectionsByThemeId = new Map(userTeamUpCollections.map((collection) => [collection.themeId, collection]));

function createEmptyTeamUpCollection(theme: TeamUpCollectionTheme): UserTeamUpCollection {
  return {
    themeId: theme.id,
    completedSteps: 0,
    collectionLevel: 0,
    optionLevel: 0,
    appliedOption: teamUpEffectLabel,
    stats: {},
    tokenProgress: 0,
    tokenGoal: 0,
    status: 'locked',
  };
}

function getDefaultTeamUpCollections() {
  return teamUpCollectionThemes.map((theme) => seededTeamUpCollectionsByThemeId.get(theme.id) ?? createEmptyTeamUpCollection(theme));
}

function normalizeTeamUpCollection(value: unknown, fallback: UserTeamUpCollection): EditableTeamUpCollection {
  const raw = value && typeof value === 'object'
    ? value as Partial<UserTeamUpCollection>
    : {};
  const collectionLevel = clampTeamUpLevel(raw.collectionLevel ?? fallback.collectionLevel);
  const completedSteps = collectionLevel;
  const unlockedStatus = fallback.status === 'locked' ? 'farm' : fallback.status;

  return {
    ...fallback,
    collectionLevel,
    optionLevel: collectionLevel,
    completedSteps,
    appliedOption: teamUpEffectLabel,
    stats: getTeamUpLevelStats(collectionLevel),
    status: collectionLevel > 0 ? unlockedStatus : 'locked',
  };
}

export function createDefaultTeamUpCollections(): EditableTeamUpCollection[] {
  return getDefaultTeamUpCollections().map((collection) => normalizeTeamUpCollection(collection, collection));
}

export function normalizeTeamUpCollections(value: unknown): EditableTeamUpCollection[] {
  const defaults = getDefaultTeamUpCollections();
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
  const defaults = getDefaultTeamUpCollections();

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
