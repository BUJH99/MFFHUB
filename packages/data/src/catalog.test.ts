import { describe, expect, it } from 'vitest';
import {
  catalogCharacters,
  catalogCharactersWithPlaceholders,
  catalogStats,
  placeholderCatalogCharacters,
  slugify,
} from './catalog';
import syncedPayload from '../generated/thanosvibs.json';

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

  it('exposes the current THANO$VIB$ uniforms and base-only character forms', () => {
    const expectedUniforms = [
      ['spiderman', "Marvel Studios' Spider-Man: Brand New Day"],
      ['hulk', "Marvel Studios' Spider-Man: Brand New Day"],
      ['scorpion', "Marvel Studios' Spider-Man: Brand New Day"],
      ['greengoblin', 'Gold Goblin'],
      ['rhino', 'Uncanny Spider-Man'],
    ] as const;

    for (const [characterId, uniformName] of expectedUniforms) {
      const character = catalogCharacters.find((row) => row.id === characterId);
      expect(character?.uniforms.some((uniform) => uniform.name === uniformName)).toBe(true);
    }

    const whiplash = catalogCharacters.find((character) => character.id === 'whiplash');
    expect(whiplash?.uniforms[0]).toMatchObject({
      name: "Marvel Studios' Iron Man 2",
      type: 'Blast',
      side: 'Villain',
    });
  });

  it('keeps every synced base character form alongside its purchasable uniforms', () => {
    const dormammu = catalogCharacters.find((character) => character.id === 'dormammu');
    const classic = dormammu?.uniforms.find((uniform) => uniform.name === 'Classic');

    expect(dormammu?.uniforms[0]?.name).toBe('Damnation');
    expect(classic).toMatchObject({
      baseCharacter: true,
      imageUrl: '/mff-assets/uniforms/dormammu.webp',
      type: 'Universal',
      side: 'Villain',
    });
    expect(classic?.leader).toEqual([]);
    expect(classic?.passive).toEqual([]);
    expect(classic?.uniformEffect).toEqual([]);

    const baseAttributes = syncedPayload.attributes.filter((attribute) => attribute.baseCharacter);
    for (const attribute of baseAttributes) {
      const character = catalogCharacters.find((row) => row.id === attribute.characterId);
      const matchingForms = character?.uniforms.filter(
        (uniform) => slugify(uniform.name) === slugify(attribute.uniform ?? 'Modern'),
      ) ?? [];

      expect(matchingForms, `${attribute.character} ${attribute.uniform} base form`).toHaveLength(1);
      expect(matchingForms[0], `${attribute.character} ${attribute.uniform} base metadata`).toMatchObject({
        baseCharacter: true,
        imageUrl: attribute.localPortraitUrl,
      });
    }
  });

  it('keeps every synced appearance under its canonical base character', () => {
    const baseCharacterIds = new Set(
      syncedPayload.attributes
        .filter((attribute) => attribute.baseCharacter)
        .map((attribute) => attribute.characterId),
    );
    const syncedCharacterIds = new Set(syncedPayload.characters.map((character) => character.id));
    const appearanceKeys = syncedPayload.attributes.map(
      (attribute) => `${attribute.characterId}|${slugify(attribute.uniform ?? 'Modern')}`,
    );

    expect(syncedCharacterIds).toEqual(baseCharacterIds);
    expect(new Set(appearanceKeys).size).toBe(appearanceKeys.length);

    for (const attribute of syncedPayload.attributes) {
      const character = catalogCharacters.find((row) => row.id === attribute.characterId);
      const matchingForms = character?.uniforms.filter(
        (uniform) => slugify(uniform.name) === slugify(attribute.uniform ?? 'Modern'),
      ) ?? [];
      expect(matchingForms, `${attribute.character} ${attribute.uniform} appearance`).toHaveLength(1);
    }
  });

  it('keeps name-colliding transformed uniforms on the correct character', () => {
    const shuri = catalogCharacters.find((character) => character.id === 'shuri');
    const blackPanther = catalogCharacters.find((character) => character.id === 'blackpanther');
    const giantMan = catalogCharacters.find((character) => character.id === 'giantman');
    const goliath = catalogCharacters.find((character) => character.id === 'goliath');

    expect(shuri?.uniforms.find((uniform) => uniform.name === "Marvel Studios' Black Panther: Wakanda Forever")?.imageUrl)
      .toContain('shuri3');
    expect(blackPanther?.uniforms.find((uniform) => uniform.name === "Marvel Studios' Black Panther")?.imageUrl)
      .toContain('blackpanther2');
    expect(giantMan?.uniforms.find((uniform) => uniform.name === 'Modern · Goliath')?.imageUrl)
      .toContain('giantman1');
    expect(goliath?.uniforms.some((uniform) => uniform.imageUrl?.includes('giantman1'))).toBe(false);
  });

  it('merges manual aliases into the synced canonical character', () => {
    expect(catalogCharacters.find((character) => character.id === 'philcoulson')?.imageUrl)
      .toBe('/mff-assets/characters/philcoulson2.webp');
    expect(catalogCharacters.some((character) => character.id === 'coulson')).toBe(false);
    expect(catalogCharacters.some((character) => character.id === 'cullobsidian')).toBe(false);
  });
});
