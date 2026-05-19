import { describe, expect, it } from 'vitest';
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
    expect(summary.activeTeamUpCollections).toBe(collections.length);
    expect(summary.teamUpAttackBudget).toBeGreaterThan(0);
  });

  it('clamps levels to the in-game 0-10 collection range', () => {
    expect(clampTeamUpLevel(-3)).toBe(0);
    expect(clampTeamUpLevel(4.6)).toBe(5);
    expect(clampTeamUpLevel(99)).toBe(10);
  });

  it('recalculates stats from each collection level', () => {
    const defaults = createDefaultTeamUpCollections();
    const raised = updateTeamUpCollectionLevel(defaults, 0, defaults[0].collectionLevel + 1);
    const lowered = updateTeamUpCollectionLevel(defaults, 0, 0);

    expect(raised[0].collectionLevel).toBe(defaults[0].collectionLevel + 1);
    expect(summarizeTeamUpCollections(raised).teamUpAttackBudget).toBeGreaterThan(summarizeTeamUpCollections(defaults).teamUpAttackBudget);
    expect(summarizeTeamUpCollections(lowered).activeTeamUpCollections).toBe(defaults.length - 1);
  });
});
