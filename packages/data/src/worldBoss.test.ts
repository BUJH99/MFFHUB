import { describe, expect, it } from 'vitest';
import { worldBosses } from './worldBoss';

describe('world boss legend data', () => {
  it('contains only Legend and Legend+ bosses', () => {
    expect(worldBosses).toHaveLength(10);
    expect(worldBosses.every((boss) => boss.mode === 'Legend' || boss.mode === 'Legend+')).toBe(true);
    expect(worldBosses.map((boss) => boss.name)).toEqual([
      'Knull',
      'Mephisto',
      'Infinity Ultron',
      'Gorr',
      'Dark Phoenix',
      'Kang the Conqueror',
      'Black Swan',
      'Corvus & Proxima',
      'Black Dwarf & Ebony Maw',
      'Thanos & The Black Order',
    ]);
  });

  it('includes stage unlocks, restrictions, and eligible character examples', () => {
    for (const boss of worldBosses) {
      expect(boss.unlocks).toHaveLength(9);
      expect(boss.stages).toHaveLength(19);
      expect(boss.stages.every((stage) => stage.candidateCount > 0 && stage.candidates.length > 0)).toBe(true);
    }
  });

  it('exposes only current image routes to the web app', () => {
    const imageUrls = worldBosses.flatMap((boss) => [
      boss.portraitUrl,
      boss.bannerUrl,
      ...boss.unlocks.map((unlock) => unlock.portraitUrl),
      ...boss.stages.flatMap((stage) => [
        ...stage.restrictions.map((restriction) => restriction.iconUrl),
        ...stage.candidates.map((candidate) => candidate.portraitUrl),
      ]),
    ]);

    expect(imageUrls.length).toBeGreaterThan(250);
    expect(imageUrls.every((url) => !url.includes('/static/'))).toBe(true);
  });
});
