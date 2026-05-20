import { describe, expect, it } from 'vitest';
import {
  createDefaultCtpInventory,
  ctpDefinitions,
  ctpRoleOrder,
  parseCtpName,
  summarizeCtpInventory,
  updateCtpInventoryCount,
} from './ctpInventory';
import type { UserCharacter } from '@mff-data-hub/types';

const sampleRoster: UserCharacter[] = [
  {
    characterId: 'dealer',
    owned: true,
    level: 80,
    tier: 'T4',
    uniformOwned: true,
    uniformRank: 'Mythic',
    artifactStars: 6,
    ctp: 'Rage',
    buildQuality: 95,
    skillCooldown: 50,
    ignoreDefense: 50,
    criticalDamage: 200,
  },
  {
    characterId: 'pvp',
    owned: true,
    level: 80,
    tier: 'T4',
    uniformOwned: true,
    uniformRank: 'Mythic',
    artifactStars: 6,
    ctp: 'Mighty Destruction',
    buildQuality: 92,
    skillCooldown: 50,
    ignoreDefense: 50,
    criticalDamage: 190,
  },
];

describe('ctp inventory', () => {
  it('parses regular, mighty, and brilliant CTP names', () => {
    expect(parseCtpName('Rage')).toEqual({ ctpId: 'rage', grade: 'normal' });
    expect(parseCtpName('Mighty Destruction')).toEqual({ ctpId: 'destruction', grade: 'mighty' });
    expect(parseCtpName('Brilliant Refinement')).toEqual({ ctpId: 'refinement', grade: 'brilliant' });
    expect(parseCtpName('Judgment')).toEqual({ ctpId: 'judgement', grade: 'normal' });
  });

  it('seeds inventory from equipped roster CTPs', () => {
    const inventory = createDefaultCtpInventory(sampleRoster);
    const summary = summarizeCtpInventory(inventory, inventory);

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.equipped).toBe(summary.total);
    expect(summary.byRole.some((row) => row.role === 'PVE')).toBe(true);
  });

  it('updates counts by grade without touching other CTPs', () => {
    const inventory = createDefaultCtpInventory(sampleRoster);
    const updated = updateCtpInventoryCount(inventory, 'rage', 'brilliant', 2);
    const rage = updated.find((entry) => entry.ctpId === 'rage');

    expect(rage?.brilliant).toBe(2);
    expect(updateCtpInventoryCount(updated, 'rage', 'normal', -1).find((entry) => entry.ctpId === 'rage')?.normal).toBe(0);
  });

  it('groups CTPs by the requested inventory roles', () => {
    expect(ctpDefinitions.filter((ctp) => ctp.role === 'PVE').map((ctp) => ctp.koreanName)).toEqual(['분노', '경쟁']);
    expect(ctpDefinitions.filter((ctp) => ctp.role === 'SEMI PVE').map((ctp) => ctp.koreanName)).toEqual(['심판', '격동[에너지]', '파괴']);
    expect(ctpDefinitions.filter((ctp) => ctp.role === 'Support').map((ctp) => ctp.koreanName)).toEqual(['통찰', '해방']);
    expect(ctpDefinitions.filter((ctp) => ctp.role === 'PVP').map((ctp) => ctp.koreanName)).toEqual(['극복', '탐욕']);
    expect(ctpDefinitions.filter((ctp) => ctp.role === 'SEMI PVP').map((ctp) => ctp.koreanName)).toEqual(['재생', '제련', '권능']);
    expect(ctpDefinitions.filter((ctp) => ctp.role === 'WASTE').map((ctp) => ctp.koreanName)).toEqual(['초월', '인내']);

    const summary = summarizeCtpInventory(createDefaultCtpInventory(sampleRoster));
    expect(summary.byRole.map((row) => row.role)).toEqual(ctpRoleOrder);
  });
});
