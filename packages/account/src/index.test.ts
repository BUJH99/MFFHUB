import { describe, expect, it } from 'vitest';
import {
  accountSpecSummary,
  comicCardDatabase,
  equippedComicCards,
  getComicCard,
  getTeamUpAttackBonusForCharacter,
  getTeamUpCoverage,
  getTeamUpLevelStats,
  teamUpCollectionThemes,
  teamUpLevelEffects,
  teamUpAttackBonusByCharacter,
  userTeamUpCollections,
} from './index';

describe('account spec calculations', () => {
  it('loads the synced comic card database with the full premium card set', () => {
    const premiumCards = comicCardDatabase.filter((card) => card.type === 'Premium');

    expect(comicCardDatabase).toHaveLength(112);
    expect(premiumCards).toHaveLength(21);
    expect(new Set(comicCardDatabase.map((card) => card.id)).size).toBe(comicCardDatabase.length);
  });

  it('keeps default equipped comic cards backed by premium definitions', () => {
    for (const equippedCard of equippedComicCards) {
      expect(getComicCard(equippedCard.cardId)?.type).toBe('Premium');
    }
  });

  it('derives account attack and pierce from equipped account data', () => {
    const cardAttack = equippedComicCards.reduce((sum, card) => sum + card.attackContribution, 0);
    const cardPierce = equippedComicCards.reduce((sum, card) => sum + card.pierce, 0);

    expect(accountSpecSummary.cardAttack).toBe(cardAttack);
    expect(accountSpecSummary.cardPierce).toBe(cardPierce);
    expect(accountSpecSummary.accountAttack).toBeGreaterThan(accountSpecSummary.cardAttack);
  });

  it('keeps team-up bonuses addressable by character id', () => {
    const characterId = Object.keys(teamUpAttackBonusByCharacter)[0];

    expect(characterId).toBeTruthy();
    expect(teamUpAttackBonusByCharacter[characterId]).toBe(getTeamUpAttackBonusForCharacter(characterId));
  });

  it('keeps the in-game team-up collection order with Fantastic Four last', () => {
    const finalTheme = teamUpCollectionThemes[teamUpCollectionThemes.length - 1];

    expect(teamUpCollectionThemes).toHaveLength(8);
    expect(finalTheme?.id).toBe('fantastic-four');
    expect(finalTheme?.targetHeroes).toEqual([
      'Invisible Woman',
      'Spider-Man',
      'Mister Fantastic',
      'Medusa',
      'Human Torch',
      'Luke Cage',
      'Black Panther',
      'Thing',
      'She-Hulk',
      'Crystal',
      'Ant-Man',
      'Iceman',
      'Moon Girl',
    ]);
  });

  it('uses the in-game team-up level table for cumulative all attack and additional pierce', () => {
    expect(teamUpLevelEffects).toHaveLength(18);
    expect(getTeamUpLevelStats(1)).toEqual({ allBasicAttack: 1 });
    expect(getTeamUpLevelStats(6)).toEqual({ allBasicAttack: 9, pierce: 1 });
    expect(getTeamUpLevelStats(15)).toEqual({ allBasicAttack: 30, pierce: 5 });
    expect(getTeamUpLevelStats(18)).toEqual({ allBasicAttack: 40, pierce: 10 });
  });

  it('computes coverage without leaking UI state into the domain package', () => {
    const coverage = getTeamUpCoverage(['doctor-strange', 'wolverine']);

    expect(coverage).toHaveLength(userTeamUpCollections.length);
    expect(coverage.some((row) => row.covered > 0)).toBe(true);
  });
});
