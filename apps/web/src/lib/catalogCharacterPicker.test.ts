import { describe, expect, it } from 'vitest';
import { characters } from './data';
import { buildCatalogCharacterOptions, catalogFallbackUniform, normalizeCatalogPickerKey } from './catalogCharacterPicker';
import { catalogCharacters } from '@mff-data-hub/data';

describe('catalog character picker helpers', () => {
  it('builds one shared Korean catalog option source for mode pickers', () => {
    const options = buildCatalogCharacterOptions({
      catalogCharacters,
      appCharacters: characters,
      scoreForCharacter: (character) => character.scores['Timeline Battle'],
    });
    const jean = options.find((option) => option.catalogCharacter.id === 'jeangrey');

    expect(options.length).toBe(catalogCharacters.length);
    expect(jean?.displayName).toBe('진 그레이');
    expect(jean?.normalizedSearchText).toContain(normalizeCatalogPickerKey('Dark Phoenix'));
    expect(jean?.uniforms.length).toBeGreaterThan(0);
  });

  it('creates a catalog-image fallback uniform for characters without uniforms', () => {
    const uniform = catalogFallbackUniform({ id: 'sample', name: '샘플', imageUrl: '/sample.webp', uniforms: [] } as never);

    expect(uniform.name).toBe('기본');
    expect(uniform.imageUrl).toBe('/sample.webp');
    expect(uniform.leader).toEqual([]);
  });
});
