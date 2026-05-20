import { describe, expect, it } from 'vitest';
import { filterIconGroups, getMffAttributeIcon } from './mffAttributeIcons';

describe('MFF attribute icon registry', () => {
  it('maps core character filters to THANO$VIB$ icons with Korean labels', () => {
    expect(getMffAttributeIcon('Combat')).toMatchObject({ label: '컴뱃', src: expect.stringContaining('/combat.png') });
    expect(getMffAttributeIcon('Alien')).toMatchObject({ label: '외계인', src: expect.stringContaining('/alien.png') });
    expect(getMffAttributeIcon('Female')).toMatchObject({ label: '여성', src: expect.stringContaining('/female.png') });
    expect(getMffAttributeIcon('Hero')).toMatchObject({ label: '영웅', src: expect.stringContaining('/hero.png') });
    expect(getMffAttributeIcon('Order')).toMatchObject({ label: '질서', src: expect.stringContaining('/instinct_order.png') });
  });

  it('maps ability tags including weapons master and spider-sense to ability icons', () => {
    expect(getMffAttributeIcon('Weaponsmaster')).toMatchObject({ label: '무기 전문가', src: expect.stringContaining('/weaponsmaster.png') });
    expect(getMffAttributeIcon('Weapon Master')).toMatchObject({ label: '무기 전문가', src: expect.stringContaining('/weaponsmaster.png') });
    expect(getMffAttributeIcon('Spider Sense')).toMatchObject({ label: '스파이더 센스', src: expect.stringContaining('/spider-sense.png') });
    expect(getMffAttributeIcon('Gammaradiation')).toMatchObject({ label: '감마선', src: expect.stringContaining('/gammaradiation.png') });
  });

  it('exposes icon filter groups for all requested character dimensions', () => {
    expect(filterIconGroups.map((group) => group.key)).toEqual(['type', 'species', 'gender', 'side', 'instinct', 'ability']);
    expect(filterIconGroups.find((group) => group.key === 'ability')?.options.length).toBeGreaterThan(35);
  });
});
