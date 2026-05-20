import type { CatalogCharacter, CatalogUniform } from '@mff-data-hub/data';
import type { Character } from '@mff-data-hub/types';

export type CatalogCharacterPickerOption = {
  key: string;
  catalogCharacter: CatalogCharacter;
  appCharacter?: Character;
  displayName: string;
  imageUrl: string;
  uniforms: CatalogUniform[];
  normalizedSearchText: string;
  score: number;
};

type BuildCatalogCharacterOptionsArgs = {
  catalogCharacters: CatalogCharacter[];
  appCharacters?: Character[];
  scoreForCharacter?: (character: Character, catalogCharacter: CatalogCharacter) => number;
  includeUniformSearch?: boolean;
};

export function normalizeCatalogPickerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

export function catalogFallbackUniform(character: Pick<CatalogCharacter, 'imageUrl'>): CatalogUniform {
  return {
    name: '기본',
    imageUrl: character.imageUrl,
    leader: [],
    passive: [],
    uniformEffect: [],
  };
}

function buildAppCharacterLookup(appCharacters: Character[]) {
  const lookup = new Map<string, Character>();

  for (const character of appCharacters) {
    lookup.set(normalizeCatalogPickerKey(character.id), character);
    lookup.set(normalizeCatalogPickerKey(character.slug), character);
    lookup.set(normalizeCatalogPickerKey(character.name), character);
  }

  return lookup;
}

export function buildCatalogCharacterOptions({
  catalogCharacters,
  appCharacters = [],
  scoreForCharacter,
  includeUniformSearch = true,
}: BuildCatalogCharacterOptionsArgs): CatalogCharacterPickerOption[] {
  const appCharacterLookup = buildAppCharacterLookup(appCharacters);

  return catalogCharacters
    .map((catalogCharacter) => {
      const appCharacter = appCharacterLookup.get(normalizeCatalogPickerKey(catalogCharacter.id))
        ?? appCharacterLookup.get(normalizeCatalogPickerKey(catalogCharacter.name));
      const uniforms = catalogCharacter.uniforms.length ? catalogCharacter.uniforms : [catalogFallbackUniform(catalogCharacter)];
      const searchParts = [
        catalogCharacter.id,
        catalogCharacter.name,
        catalogCharacter.type,
        catalogCharacter.side,
        catalogCharacter.tags.join(' '),
        appCharacter?.id,
        appCharacter?.slug,
        appCharacter?.name,
        appCharacter?.tags.join(' '),
        includeUniformSearch
          ? uniforms.map((uniform) => [uniform.name, uniform.release, uniform.acquisition].filter(Boolean).join(' ')).join(' ')
          : '',
      ];

      return {
        key: `${catalogCharacter.id}-${catalogCharacter.name}`,
        catalogCharacter,
        appCharacter,
        displayName: catalogCharacter.name,
        imageUrl: catalogCharacter.imageUrl,
        uniforms,
        normalizedSearchText: normalizeCatalogPickerKey(searchParts.filter(Boolean).join(' ')),
        score: appCharacter && scoreForCharacter ? scoreForCharacter(appCharacter, catalogCharacter) : 0,
      };
    })
    .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName, 'ko'));
}
