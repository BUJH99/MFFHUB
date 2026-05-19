import { describe, expect, it } from 'vitest';
import {
  createRosterLookup,
  getCurrentUniform,
  getRosterItem,
  getTopCharacters,
  optimizeTeams,
  pveOverallScore,
} from './optimizer';
import type { Character, CustomOptimizerInput, UserAccount, UserCharacter } from '@mff-data-hub/types';

const dealer: Character = {
  id: 'dealer',
  name: 'Dealer',
  slug: 'dealer',
  portraitUrl: '/dealer.webp',
  type: 'Blast',
  alignment: 'Hero',
  gender: 'Female',
  species: 'Human',
  roles: ['dealer'],
  tier: 'T4',
  instinct: 'Justice',
  acquisition: 'Free',
  tags: ['blast', 'hero', 'female', 'leadership', 'pve'],
  uniforms: [{ id: 'dealer-uniform', name: 'Best', tags: [], note: 'best' }],
  artifact: { name: 'Dealer Artifact', effect: 'damage', pveScore: 5, pvpScore: 1 },
  ctpRecommendations: ['Rage'],
  procFriendly: 'Rage',
  scores: { ABX: 100, ABL: 110, 'World Boss': 90, 'Infinity Challenge': 95, 'Team Battle Arena': 60, Otherworld: 60, 'Timeline Battle': 60 },
  buffs: [],
  rotations: { pve: 'test' },
  buildNotes: [],
};

const leader: Character = {
  ...dealer,
  id: 'leader',
  name: 'Leader',
  slug: 'leader',
  roles: ['leader'],
  buffs: [{ stat: 'All Basic Attacks', magnitude: 45, appliesTo: 'all', source: 'Leadership' }],
};

const support: Character = {
  ...dealer,
  id: 'support',
  name: 'Support',
  slug: 'support',
  roles: ['support'],
  buffs: [{ stat: 'Basic Damage Dealt to Villains', magnitude: 45, appliesTo: 'all', source: 'Tier-2 Passive' }],
  ctpRecommendations: ['Insight'],
};

const roster: UserCharacter[] = [dealer, leader, support].map((character) => ({
  characterId: character.id,
  owned: true,
  level: 80,
  tier: 'T4',
  uniformOwned: true,
  uniformId: character.uniforms[0].id,
  uniformRank: 'Mythic',
  artifactStars: 6,
  ctp: character.id === 'support' ? 'Insight' : 'Rage',
  buildQuality: 95,
  skillCooldown: 50,
  ignoreDefense: 50,
  criticalDamage: 200,
}));

const account: UserAccount = {
  agentName: 'Tester',
  agentLevel: 300,
  vip: 0,
  cardAttack: 100,
  accountAttack: 120,
  pierce: 25,
  maxCharacters: 3,
  updatedAt: '2026-05-19',
};

const input: CustomOptimizerInput = {
  content: 'ABL',
  type: 'Blast',
  alignment: 'Hero',
  gender: 'Female',
  tags: ['pve'],
  accountOnly: true,
  requireUniform: true,
  preferSafeRotation: true,
};

describe('optimizer roster lookup', () => {
  it('reuses caller-provided roster lookup for helper APIs', () => {
    const lookup = createRosterLookup(roster);

    expect(getRosterItem(dealer, lookup)?.characterId).toBe('dealer');
    expect(getCurrentUniform(dealer, lookup).id).toBe('dealer-uniform');
  });

  it('returns ranked teams with stable score breakdowns', () => {
    const [team] = optimizeTeams(input, [dealer, leader, support], roster, account);

    expect(team.dealer.id).toBe('dealer');
    expect(team.leader?.id).toBe('leader');
    expect(team.support1?.id).toBe('support');
    expect(team.breakdown.total).toBe(team.score);
    expect(team.score).toBeGreaterThan(0);
  });

  it('supports Infinity Challenge and PVE Overall scoring', () => {
    const [team] = optimizeTeams({ ...input, content: 'Infinity Challenge', tags: ['pve', 'boss'] }, [dealer, leader, support], roster, account);
    const [overall] = getTopCharacters('PVE Overall', [dealer, leader, support], 1);

    expect(team.dealer.id).toBe('dealer');
    expect(pveOverallScore(dealer)).toBe(97.5);
    expect(overall.character.id).toBe('dealer');
  });
});
