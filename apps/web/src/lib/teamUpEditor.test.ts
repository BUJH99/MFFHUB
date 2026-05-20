import { describe, expect, it } from 'vitest';
import { teamUpCollectionThemes } from '@mff-data-hub/account';
import {
  clampTeamUpLevel,
  createDefaultTeamUpCollections,
  summarizeTeamUpCollections,
  updateTeamUpCollectionLevel,
} from './teamUpEditor';

describe('team-up editor', () => {
  it('uses the seeded team-up collections as editable defaults', () => {
    const collections = createDefaultTeamUpCollections();
    const summary = summarizeTeamUpCollections(collections);

    expect(collections.length).toBeGreaterThan(0);
    expect(summary.activeTeamUpCollections).toBeGreaterThan(0);
    expect(summary.activeTeamUpCollections).toBeLessThanOrEqual(collections.length);
    expect(summary.teamUpAttackBudget).toBeGreaterThan(0);
  });

  it('exposes all 8 team-up themes in the editable order', () => {
    const collections = createDefaultTeamUpCollections();
    const finalCollection = collections[collections.length - 1];

    expect(teamUpCollectionThemes).toHaveLength(8);
    expect(collections).toHaveLength(8);
    expect(finalCollection?.themeId).toBe('fantastic-four');
  });

  it('clamps levels to the in-game 0-18 collection range', () => {
    expect(clampTeamUpLevel(-3)).toBe(0);
    expect(clampTeamUpLevel(4.6)).toBe(5);
    expect(clampTeamUpLevel(99)).toBe(18);
  });

  it('uses the in-game cumulative all attack and additional pierce table by level', () => {
    const defaults = createDefaultTeamUpCollections();
    const xForceIndex = defaults.findIndex((collection) => collection.themeId === 'x-force');
    const levelSix = updateTeamUpCollectionLevel(defaults, xForceIndex, 6);
    const levelEighteen = updateTeamUpCollectionLevel(defaults, xForceIndex, 18);

    expect(xForceIndex).toBeGreaterThanOrEqual(0);
    expect(levelSix[xForceIndex].stats).toMatchObject({ allBasicAttack: 9, pierce: 1 });
    expect(levelSix[xForceIndex].stats).not.toHaveProperty('physicalAttack');
    expect(levelSix[xForceIndex].stats).not.toHaveProperty('energyAttack');
    expect(levelEighteen[xForceIndex].stats).toMatchObject({ allBasicAttack: 40, pierce: 10 });
  });

  it('recalculates stats from each collection level', () => {
    const defaults = createDefaultTeamUpCollections();
    const defaultActiveCollections = summarizeTeamUpCollections(defaults).activeTeamUpCollections;
    const raised = updateTeamUpCollectionLevel(defaults, 0, defaults[0].collectionLevel + 1);
    const lowered = updateTeamUpCollectionLevel(defaults, 0, 0);

    expect(raised[0].collectionLevel).toBe(defaults[0].collectionLevel + 1);
    expect(summarizeTeamUpCollections(raised).teamUpAttackBudget).toBeGreaterThan(summarizeTeamUpCollections(defaults).teamUpAttackBudget);
    expect(summarizeTeamUpCollections(lowered).activeTeamUpCollections).toBe(defaultActiveCollections - 1);
  });

  it('derives stats when a locked collection is raised from zero', () => {
    const defaults = createDefaultTeamUpCollections();
    const fantasticFourIndex = defaults.findIndex((collection) => collection.themeId === 'fantastic-four');
    const raised = updateTeamUpCollectionLevel(defaults, fantasticFourIndex, 1);

    expect(fantasticFourIndex).toBeGreaterThanOrEqual(0);
    expect(raised[fantasticFourIndex].status).toBe('farm');
    expect(raised[fantasticFourIndex].stats.allBasicAttack).toBeGreaterThan(0);
    expect(summarizeTeamUpCollections(raised).teamUpAttackBudget).toBeGreaterThan(summarizeTeamUpCollections(defaults).teamUpAttackBudget);
  });
});
