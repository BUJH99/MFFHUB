import {
  catalogCharacters,
  type CatalogCharacter,
  type CatalogUniform,
  type TierListEntry,
} from '@mff-data-hub/data';

export type ResolvedTierEntry = TierListEntry & {
  character?: CatalogCharacter;
  latestUniform?: CatalogUniform;
  displayName: string;
  sourceLabel: string;
  imageUrl: string;
  matched: boolean;
  searchText: string;
};

type CharacterMatcher = {
  character: CatalogCharacter;
  key: string;
  priority: number;
};

const leadingAliasWords = new Set(['baron', 'the']);

export function normalizeTierSearch(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9가-힣]+/g, '');
}

function titleCaseSource(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (/^[ivx]+$/i.test(part)) return part.toUpperCase();
      if (part.length <= 2 && part.includes('-')) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ')
    .replace(/\bX-men\b/gi, 'X-Men')
    .replace(/\bPvp\b/g, 'PvP')
    .replace(/\bPve\b/g, 'PvE');
}

function uniqueMatchers(matchers: CharacterMatcher[]) {
  const seen = new Set<string>();
  return matchers.filter((matcher) => {
    const key = `${matcher.character.id}:${matcher.key}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return matcher.key.length > 1;
  });
}

function getAliasKeys(character: CatalogCharacter) {
  const words = character.name
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const firstWord = words[0]?.toLowerCase();
  if (!firstWord || !leadingAliasWords.has(firstWord) || words.length < 2) return [];
  return [normalizeTierSearch(words.slice(1).join(' '))];
}

function buildCharacterMatchers(characters: CatalogCharacter[]) {
  return uniqueMatchers(characters.flatMap((character) => [
    { character, key: normalizeTierSearch(character.name), priority: 0 },
    { character, key: normalizeTierSearch(character.id), priority: 0 },
    ...getAliasKeys(character).map((key) => ({ character, key, priority: 1 })),
  ]));
}

const defaultCharacterMatchers = buildCharacterMatchers(catalogCharacters);

function getCatalogId(entry: TierListEntry) {
  return 'catalogId' in entry && typeof entry.catalogId === 'string' ? entry.catalogId : undefined;
}

function resolveCharacter(entry: TierListEntry, matchers: CharacterMatcher[] = defaultCharacterMatchers) {
  const sourceKey = normalizeTierSearch(entry.sourceName);
  const catalogId = getCatalogId(entry);
  const explicitMatch = catalogId
    ? matchers.find((matcher) => matcher.character.id === catalogId)
    : undefined;
  if (explicitMatch) return explicitMatch.character;

  const exactMatch = matchers
    .filter((matcher) => sourceKey === matcher.key)
    .sort((left, right) => left.priority - right.priority || right.key.length - left.key.length)[0];
  if (exactMatch) return exactMatch.character;

  const prefixMatch = matchers
    .filter((matcher) => sourceKey.startsWith(matcher.key))
    .sort((left, right) => left.priority - right.priority || right.key.length - left.key.length)[0];
  if (prefixMatch) return prefixMatch.character;

  return matchers
    .filter((matcher) => matcher.key.length >= 4 && sourceKey.includes(matcher.key))
    .sort((left, right) => {
      const leftIndex = sourceKey.indexOf(left.key);
      const rightIndex = sourceKey.indexOf(right.key);
      return leftIndex - rightIndex || left.priority - right.priority || right.key.length - left.key.length;
    })[0]?.character;
}

function assetToken(value?: string) {
  const fileName = value?.split(/[\\/]/).pop();
  return fileName?.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
}

function releaseScore(uniform: CatalogUniform) {
  const release = uniform.release ?? '';
  const update = /Update\s+(\d+(?:\.\d+)*)([a-z])?/i.exec(release);
  if (update) {
    const parts = update[1].split('.').map((part) => Number(part));
    const suffix = update[2] ? update[2].toLowerCase().charCodeAt(0) - 96 : 0;
    return (parts[0] ?? 0) * 1_000_000 + (parts[1] ?? 0) * 10_000 + (parts[2] ?? 0) * 100 + suffix;
  }

  const dateText = release.split('·').pop()?.trim();
  const dateValue = dateText ? Date.parse(dateText) : NaN;
  return Number.isFinite(dateValue) ? dateValue / 100_000_000 : 0;
}

export function getLatestUniform(character: CatalogCharacter) {
  const characterToken = assetToken(character.imageUrl);
  const currentUniform = character.uniforms.find((uniform) => (
    characterToken
      && [uniform.imageUrl, uniform.sourceImageUrl].some((imageUrl) => assetToken(imageUrl) === characterToken)
  ));
  if (currentUniform) return currentUniform;

  return character.uniforms
    .map((uniform) => ({ uniform, score: releaseScore(uniform) }))
    .sort((left, right) => right.score - left.score)[0]?.uniform;
}

export function resolveTierListEntry(entry: TierListEntry): ResolvedTierEntry {
  const character = resolveCharacter(entry);
  const latestUniform = character ? getLatestUniform(character) : undefined;
  const displayName = character?.name ?? titleCaseSource(entry.sourceName);
  const sourceLabel = latestUniform?.name ?? titleCaseSource(entry.sourceName);
  const imageUrl = latestUniform?.imageUrl ?? character?.imageUrl ?? entry.sourceImageUrl;
  const searchText = normalizeTierSearch([
    entry.sourceName,
    entry.type,
    displayName,
    sourceLabel,
    character?.type,
    character?.side,
    character?.tags.join(' '),
  ].filter(Boolean).join(' '));

  return {
    ...entry,
    character,
    latestUniform,
    displayName,
    sourceLabel,
    imageUrl,
    matched: Boolean(character),
    searchText,
  };
}
