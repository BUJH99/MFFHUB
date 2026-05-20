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

  it('keeps synced instinct and uniform support data available for the character DB', () => {
    const syncedCharacters = catalogCharacters.filter((character) => character.sourceStatus === 'synced');
    expect(syncedCharacters.length).toBeGreaterThan(250);
    expect(syncedCharacters.every((character) => character.tags.some((tag) => tag.startsWith('Instinct:')))).toBe(true);
    const supportedUniformCount = catalogCharacters
      .flatMap((character) => character.uniforms)
      .filter((uniform) => (uniform.leader?.length ?? 0) + (uniform.passive?.length ?? 0) + (uniform.uniformEffect?.length ?? 0) > 0).length;
    expect(supportedUniformCount).toBeGreaterThan(250);
  });

  it('keeps synced uniform core attributes available for image and icon switching', () => {
    const syncedUniforms = catalogCharacters
      .filter((character) => character.sourceStatus === 'synced')
      .flatMap((character) => character.uniforms);
    const uniformsWithCoreAttributes = syncedUniforms.filter(
      (uniform) => uniform.imageUrl && uniform.type && uniform.side && uniform.gender && uniform.species,
    );

    expect(uniformsWithCoreAttributes.length).toBeGreaterThan(500);

    const gamora = catalogCharacters.find((character) => character.id === 'gamora');
    const guardianUniform = gamora?.uniforms.find((uniform) => uniform.name.includes('Guardians of the Galaxy 2'));
    expect(guardianUniform?.imageUrl).toContain('gamora2');
    expect(guardianUniform).toMatchObject({
      type: 'Speed',
      side: 'Hero',
      gender: 'Female',
      species: 'Alien',
    });
  });
});
