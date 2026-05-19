import { describe, expect, it } from 'vitest';
import {
  accountSpecSummary,
  comicCardDatabase,
  equippedComicCards,
  getComicCard,
  getTeamUpAttackBonusForCharacter,
  getTeamUpCoverage,
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

  it('computes coverage without leaking UI state into the domain package', () => {
    const coverage = getTeamUpCoverage(['doctor-strange', 'wolverine']);

    expect(coverage).toHaveLength(userTeamUpCollections.length);
    expect(coverage.some((row) => row.covered > 0)).toBe(true);
  });
});
