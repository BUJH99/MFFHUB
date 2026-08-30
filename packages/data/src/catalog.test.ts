import { describe, expect, it } from 'vitest';
import {
  catalogCharacters,
  catalogCharactersWithPlaceholders,
  catalogStats,
  placeholderCatalogCharacters,
  slugify,
} from './catalog';
import syncedPayload from '../generated/thanosvibs.json';

type NormalizedAppearancePayload = {
  appearanceAbilities: Array<{
    id: string;
    portraitId: string;
    kind: 'leader' | 'passive' | 'uniform_effect';
    skillName: string;
  }>;
  appearanceAbilityEffects: Array<{
    appearanceAbilityId: string;
    description: string;
  }>;
  appearanceAbilityCoverage: Array<{
    portraitId: string;
    kind: 'leader' | 'passive' | 'uniform_effect';
    status: 'complete' | 'not_applicable' | 'missing' | 'needs_review';
  }>;
};

const normalizedPayload = syncedPayload as unknown as typeof syncedPayload & NormalizedAppearancePayload;

function catalogAppearanceByPortrait(portraitId: string) {
  return catalogCharacters
    .flatMap((character) => character.uniforms)
    .find((uniform) => uniform.portraitId === portraitId);
}

describe('catalog source layering', () => {
  it('keeps placeholders out of the production catalog export', () => {
    expect(placeholderCatalogCharacters.length).toBeGreaterThan(0);
    expect(catalogCharacters.some((character) => character.sourceStatus === 'placeholder')).toBe(false);
    expect(catalogCharacters.some((character) => character.tags.includes('sync-needed'))).toBe(false);
    expect(catalogCharacters.every((character) => character.sourceStatus === 'synced')).toBe(true);
    expect(catalogStats.rawCount).toBe(syncedPayload.characters.length);
    expect(catalogStats.manualCount).toBe(0);
  });

  it('keeps placeholder access explicit for development diagnostics', () => {
    expect(catalogCharactersWithPlaceholders.length).toBeGreaterThanOrEqual(catalogCharacters.length);
    expect(placeholderCatalogCharacters.every((character) => character.sourceStatus === 'placeholder')).toBe(true);
    expect(catalogStats.placeholderCount).toBe(placeholderCatalogCharacters.length);
  });

  it('keeps complete normalized appearance abilities available for the character DB', () => {
    const syncedCharacters = catalogCharacters.filter((character) => character.sourceStatus === 'synced');
    expect(syncedCharacters.length).toBeGreaterThan(250);
    expect(syncedCharacters.every((character) => character.tags.some((tag) => tag.startsWith('Instinct:')))).toBe(true);

    const appearances = catalogCharacters.flatMap((character) => character.uniforms);
    expect(appearances).toHaveLength(syncedPayload.attributes.length);
    expect(appearances.every((appearance) => appearance.leader?.length)).toBe(true);
    expect(appearances.every((appearance) => appearance.passive?.length)).toBe(true);
    expect(appearances.filter((appearance) => appearance.baseCharacter).every((appearance) => appearance.uniformEffect?.length === 0)).toBe(true);
    expect(appearances.filter((appearance) => !appearance.baseCharacter).every((appearance) => appearance.uniformEffect?.length)).toBe(true);
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
    const damnation = dormammu?.uniforms.find((uniform) => uniform.name === 'Damnation');

    expect(dormammu?.uniforms[0]?.name).toBe('Damnation');
    expect(classic).toMatchObject({
      baseCharacter: true,
      imageUrl: '/mff-assets/uniforms/dormammu.webp',
      type: 'Universal',
      side: 'Villain',
    });
    expect(classic?.portraitId).toBe('dormammu');
    expect(damnation?.portraitId).toBe('dormammu1');
    expect(classic?.leader).not.toEqual([]);
    expect(classic?.passive).not.toEqual([]);
    expect(classic?.uniformEffect).toEqual([]);
    expect(damnation?.leader).not.toEqual(classic?.leader);
    expect(damnation?.passive).toEqual(classic?.passive);
    expect(damnation?.uniformEffect).not.toEqual([]);

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
      expect(matchingForms[0]?.portraitId, `${attribute.character} ${attribute.uniform} portrait`).toBe(attribute.portraitId);
    }

    expect(catalogCharacters.flatMap((character) => character.uniforms)).toHaveLength(syncedPayload.attributes.length);
  });

  it('covers every portrait and preserves every normalized ability/effect in its selected form', () => {
    const portraitIds = syncedPayload.attributes.map((attribute) => attribute.portraitId);
    expect(portraitIds.every(Boolean)).toBe(true);
    expect(new Set(portraitIds).size).toBe(portraitIds.length);
    expect(normalizedPayload.appearanceAbilityCoverage).toHaveLength(portraitIds.length * 3);
    expect(normalizedPayload.appearanceAbilityCoverage.every(
      (row) => row.status === 'complete' || row.status === 'not_applicable',
    )).toBe(true);
    expect(normalizedPayload.appearanceAbilityCoverage.filter((row) => row.status === 'not_applicable')).toHaveLength(
      syncedPayload.attributes.filter((attribute) => attribute.baseCharacter).length,
    );

    const effectsByAbility = new Map<string, string[]>();
    for (const effect of normalizedPayload.appearanceAbilityEffects) {
      effectsByAbility.set(effect.appearanceAbilityId, [
        ...(effectsByAbility.get(effect.appearanceAbilityId) ?? []),
        effect.description,
      ]);
    }

    const missing: string[] = [];
    for (const ability of normalizedPayload.appearanceAbilities) {
      const appearance = catalogAppearanceByPortrait(ability.portraitId);
      const rows = ability.kind === 'leader'
        ? appearance?.leader
        : ability.kind === 'passive'
          ? appearance?.passive
          : appearance?.uniformEffect;
      const searchableText = rows?.join(' ') ?? '';
      if (!appearance || !searchableText.includes(ability.skillName)) {
        missing.push(`${ability.portraitId}:${ability.kind}:${ability.skillName}`);
        continue;
      }
      for (const description of effectsByAbility.get(ability.id) ?? []) {
        if (!searchableText.includes(description)) {
          missing.push(`${ability.portraitId}:${ability.kind}:${description}`);
        }
      }
    }
    expect(missing).toEqual([]);
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

  it('keeps canonical source ids without merging manual aliases into production', () => {
    expect(catalogCharacters.find((character) => character.id === 'philcoulson')?.imageUrl)
      .toBe('/mff-assets/characters/philcoulson2.webp');
    expect(catalogCharacters.some((character) => character.id === 'coulson')).toBe(false);
    expect(catalogCharacters.some((character) => character.id === 'cullobsidian')).toBe(false);
  });
});
