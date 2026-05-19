import { describe, expect, it } from 'vitest';
import {
  catalogCharacters,
  catalogCharactersWithPlaceholders,
  catalogStats,
  placeholderCatalogCharacters,
} from './catalog';

describe('catalog source layering', () => {
  it('keeps placeholders out of the production catalog export', () => {
    expect(placeholderCatalogCharacters.length).toBeGreaterThan(0);
    expect(catalogCharacters.some((character) => character.sourceStatus === 'placeholder')).toBe(false);
    expect(catalogCharacters.some((character) => character.tags.includes('sync-needed'))).toBe(false);
  });

  it('keeps placeholder access explicit for development diagnostics', () => {
    expect(catalogCharactersWithPlaceholders.length).toBeGreaterThanOrEqual(catalogCharacters.length);
    expect(placeholderCatalogCharacters.every((character) => character.sourceStatus === 'placeholder')).toBe(true);
    expect(catalogStats.placeholderCount).toBe(placeholderCatalogCharacters.length);
  });
});
