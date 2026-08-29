import { describe, expect, it } from 'vitest';
import {
  parseApiArtifacts,
  parseApiAttributes,
  parseApiComicCards,
  parseApiSupports,
  parseApiUniforms,
  type ApiCharacter,
} from './api';

const baseCharacter: ApiCharacter = {
  character: 'Test Hero',
  uniform: 'Modern',
  uniformed: 'False',
  portrait: 'testhero',
  type: 'Blast',
  allies: 'Human',
  gender: 'Female',
  side: 'Super Hero',
  ability: ['Leadership'],
  original: 'Comic',
  skill6: 'Tier-3',
  'tier-4': 'True',
};

describe('THANO$VIB$ JSON API adapter', () => {
  it('maps character variants and selects the latest uniform portrait', () => {
    const latest = { ...baseCharacter, uniform: 'Future Suit', uniformed: 'True', portrait: 'testhero1' };
    const rows = parseApiAttributes([baseCharacter, latest], { testhero1: { update: '12.1' } });

    expect(rows.find((row) => row.portraitId === 'testhero')).toMatchObject({
      baseCharacter: true,
      latestUniform: false,
      side: 'Hero',
    });
    expect(rows.find((row) => row.portraitId === 'testhero1')).toMatchObject({
      uniform: 'Future Suit',
      latestUniform: true,
      portraitUrl: 'https://thanosvibs.money/images-thumbnails/portraits/md/testhero1.png',
    });
    expect(rows.every((row) => row.tags.includes('Instinct:Justice'))).toBe(true);
  });

  it('maps uniform update metadata without requiring legacy HTML cards', () => {
    const latest = { ...baseCharacter, uniform: 'Future Suit', uniformed: 'True', portrait: 'testhero1' };
    const rows = parseApiUniforms(
      { testhero1: { cost: '1750 Crystals', update: '12.1', flags: ['Crystal1750'] } },
      [latest],
      [{ potes: [{ version: '12.1', date: 'July 27, 2026' }] }],
    );

    expect(rows[0]).toMatchObject({
      character: 'Test Hero',
      name: 'Future Suit',
      acquisition: '1750 Crystals',
      releaseUpdate: 'Update 12.1',
      releaseDate: 'July 27, 2026',
      portraitId: 'testhero1',
    });
  });

  it('expands artifact rank placeholders and accepts fixed card stat 3 strings', () => {
    const artifacts = parseApiArtifacts([{
      portrait: 'testhero',
      character: 'Test Hero',
      artifact_name: 'Test Artifact',
      passive_name: 'Test Skill',
      pve_score: 3,
      pvp_score: 1,
      text: ['Increases All Basic Attacks by [P1]%.'],
      values: { 3: ['5'], 4: ['10'], 5: ['15'], 6: ['20'] },
    }]);
    const cards = parseApiComicCards([{
      name: 'TEST #1',
      type: 'Premium',
      img: 'test',
      stat1: 'MAX HP',
      stat2: 'IGNORE DEFENSE',
      stat3: 'ALL BASIC ATTACKS',
      stat4: [],
      stat5: [],
      stat6: [],
    }]);

    expect(artifacts[0].effects).toContain('6★: Increases All Basic Attacks by 20%.');
    expect(artifacts[0]).toMatchObject({ pveScore: 'High', pvpScore: 'Low' });
    expect(cards[0].fixedStats).toEqual(['Max HP', 'Ignore Defense', 'All Basic Attacks']);
  });

  it('maps support sections and 6-star artifact aggregates', () => {
    const result = parseApiSupports([{
      portrait: 'testhero',
      leader: { restrictions: ['Side', 'Hero'], effect: [['All Basic Attacks', 45]] },
      artifact: {
        effect3: [['Max HP', 5]],
        effect4: [['Max HP', 10]],
        effect5: [['Max HP', 15]],
        effect6: [['Max HP', 20]],
      },
    }], [baseCharacter]);

    expect(result.supports[0].leadership).toEqual(['All Basic Attacks 45%']);
    expect(result.supports[0].artifactExclusiveSkill).toEqual([
      'Max HP 5%',
      'Max HP 10%',
      'Max HP 15%',
      'Max HP 20%',
    ]);
    expect(result.effects).toHaveLength(5);
    expect(result.effects[0].restrictionText).toBe('Side: Hero');
  });
});
