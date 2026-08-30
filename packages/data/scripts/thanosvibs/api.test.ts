import { describe, expect, it } from 'vitest';
import {
  parseApiArtifacts,
  parseApiAttributes,
  parseApiCharacterSkills,
  parseApiComicCards,
  parseApiSupports,
  parseApiUniforms,
  type ApiCharacter,
  type ApiCharacterSkillPayload,
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

  it('joins alter-ego uniform names back to the base character identity', () => {
    const transformed: ApiCharacter = {
      ...baseCharacter,
      character: 'Future Hero',
      uniform: 'Future Suit',
      uniformed: 'True',
      portrait: 'testhero1',
      base_portrait: 'testhero',
    };
    const existing: ApiCharacter = {
      ...baseCharacter,
      uniform: 'Existing Suit',
      uniformed: 'True',
      portrait: 'testhero2',
      base_portrait: 'testhero',
    };
    const previousUniforms = [
      {
        character: 'Test Hero',
        characterId: 'testhero',
        name: 'Existing Suit',
        portraitId: 'testhero2',
        sourceUrl: 'https://thanosvibs.money/uniforms',
      },
      {
        character: 'Future Hero',
        characterId: 'futurehero',
        name: 'Future Suit',
        portraitId: 'testhero1',
        sourceUrl: 'https://thanosvibs.money/uniforms',
      },
    ];

    const attributes = parseApiAttributes(
      [baseCharacter, transformed, existing],
      { testhero1: { update: '12.1' }, testhero2: { update: '12.0' } },
    );
    const uniforms = parseApiUniforms(
      { testhero1: { update: '12.1' }, testhero2: { update: '12.0' } },
      [baseCharacter, transformed, existing],
      [],
      previousUniforms,
    );
    const supports = parseApiSupports([{
      portrait: 'testhero1',
      passive: { effect: [['All Basic Attacks', 25]] },
    }], [baseCharacter, transformed, existing]);

    expect(new Set(attributes.map((row) => row.characterId))).toEqual(new Set(['testhero']));
    expect(attributes.find((row) => row.portraitId === 'testhero1')).toMatchObject({
      character: 'Test Hero',
      characterId: 'testhero',
      uniform: 'Future Suit',
    });
    expect(attributes.find((row) => row.portraitId === 'testhero1')?.tags).toContain('Alias:Future Hero');
    expect(uniforms.map((row) => [row.characterId, row.name])).toEqual([
      ['testhero', 'Existing Suit'],
      ['testhero', 'Future Suit'],
    ]);
    expect(supports.supports[0]).toMatchObject({
      character: 'Test Hero',
      characterId: 'testhero',
      uniform: 'Future Suit',
    });
    expect(supports.effects[0]).toMatchObject({
      character: 'Test Hero',
      characterId: 'testhero',
      uniform: 'Future Suit',
    });
  });

  it('qualifies duplicate uniform names without dropping transformed appearances', () => {
    const transformed: ApiCharacter = {
      ...baseCharacter,
      character: 'Future Hero',
      uniformed: 'True',
      portrait: 'testhero1',
      base_portrait: 'testhero',
    };
    const rows = [baseCharacter, transformed];
    const attributes = parseApiAttributes(rows, { testhero1: { update: '12.1' } });
    const uniforms = parseApiUniforms(
      { testhero1: { update: '12.1' } },
      rows,
      [],
    );
    const supports = parseApiSupports([{
      portrait: 'testhero1',
      uniform: { effect: [['All Basic Attacks', 15]] },
    }], rows);

    expect(attributes.map((row) => row.uniform)).toEqual(['Modern', 'Modern · Future Hero']);
    expect(uniforms[0]).toMatchObject({
      characterId: 'testhero',
      name: 'Modern · Future Hero',
    });
    expect(supports.supports[0]).toMatchObject({
      characterId: 'testhero',
      uniform: 'Modern · Future Hero',
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

  it('keeps leader, passive, and uniform effects scoped to each appearance', () => {
    const dormammu: ApiCharacter = {
      ...baseCharacter,
      character: 'Dormammu',
      uniform: 'Default',
      portrait: 'dormammu',
      uniformed: 'False',
    };
    const dormammuUniform: ApiCharacter = {
      ...dormammu,
      uniform: 'Damnation',
      portrait: 'dormammu1',
      uniformed: 'True',
      base_portrait: 'dormammu',
    };
    const sharedPassives = {
      Passive: {
        id: 101160401,
        type: 'Passive',
        name: 'Lingering Fear',
        cooldown: 300,
        stages: [{
          id: 101160401,
          activation: 'when dead',
          abils: [{
            id: 1011604011,
            abilityId: 253,
            ability: 'REVIVE',
            description: 'Revive with <b>100%</b> of Max HP',
          }],
        }],
      },
      'Tier-2 Passive': {
        id: 101167001,
        type: 'Tier-2 Passive',
        name: 'Impending Demise',
        cooldown: 7,
        stages: [{
          id: 101167001,
          activation: '<b>25</b>% chance when attacking',
          abils: [{
            id: 1011670011,
            abilityId: 18,
            ability: 'HP RECOVERY',
            duration: 1,
            tick: 1,
            description: 'Recovers <b>20%</b> of HP.',
          }],
        }],
      },
    };
    const basePayload: ApiCharacterSkillPayload = {
      portrait: 'dormammu',
      skills: {
        ...sharedPassives,
        'Leader Skill': {
          id: 101162006,
          type: 'Leader Skill',
          name: 'Dread One',
          cooldown: 0,
          stages: [{
            id: 101162006,
            target: 'All Allies',
            abils: [{
              id: 1011620061,
              abilityId: 10,
              ability: 'ALL BASIC DEFENSES INCREASE',
              description: 'Increases all Basic Defenses by <b>24%</b>.',
            }],
          }],
        },
      },
    };
    const repeatedUniformStage = {
      id: 101165001,
      activation: 'when attacked',
      abils: [{
        id: 1011650011,
        abilityId: 258,
        ability: 'ALL DAMAGE IMMUNE',
        duration: 5,
        description: '<b>100%</b> chance to grant All Damage Immunity',
      }],
    };
    const uniformPayload: ApiCharacterSkillPayload = {
      portrait: 'dormammu1',
      skills: {
        ...sharedPassives,
        'Leader Skill': {
          id: 101163006,
          type: 'Leader Skill',
          name: 'Lord of the Dark Dimension',
          cooldown: 0,
          stages: [{
            id: 101163006,
            target: 'All Allies',
            abils: [{
              id: 1011630061,
              abilityId: 10,
              ability: 'ALL BASIC DEFENSES INCREASE',
              description: 'Increases all Basic Defenses by <b>45%</b>.',
            }],
          }],
        },
        'Uniform Passive': {
          id: 101165001,
          type: 'Uniform Passive',
          name: 'Damnation',
          cooldown: 10,
          stages: [repeatedUniformStage, repeatedUniformStage],
        },
      },
    };

    const result = parseApiCharacterSkills(
      [basePayload, uniformPayload],
      [dormammu, dormammuUniform],
    );
    const baseSummary = result.supports.find((row) => row.portraitId === 'dormammu');
    const uniformSummary = result.supports.find((row) => row.portraitId === 'dormammu1');

    expect(baseSummary?.leadership[0]).toContain('Dread One');
    expect(baseSummary?.leadership[0]).toContain('Increases all Basic Defenses by 24%.');
    expect(uniformSummary?.leadership[0]).toContain('Lord of the Dark Dimension');
    expect(uniformSummary?.leadership[0]).toContain('Increases all Basic Defenses by 45%.');
    expect(baseSummary?.passive).toHaveLength(2);
    expect(baseSummary?.passive.join(' ')).toContain('Lingering Fear');
    expect(baseSummary?.passive.join(' ')).toContain('Impending Demise');
    expect(baseSummary?.passive.join(' ')).not.toContain('<b>');

    expect(result.coverage.find((row) => row.portraitId === 'dormammu' && row.kind === 'uniform_effect'))
      .toMatchObject({ status: 'not_applicable', abilityCount: 0, effectCount: 0 });
    expect(result.coverage.find((row) => row.portraitId === 'dormammu1' && row.kind === 'uniform_effect'))
      .toMatchObject({ status: 'complete', abilityCount: 1, effectCount: 1 });

    const passiveAbilityIds = result.appearanceAbilities
      .filter((row) => row.kind === 'passive')
      .map((row) => row.id);
    expect(passiveAbilityIds).toHaveLength(4);
    expect(new Set(passiveAbilityIds).size).toBe(4);
    expect(result.appearanceAbilityEffects.filter((row) =>
      row.appearanceAbilityId.includes('uniform-passive'))).toHaveLength(1);
    expect(result.appearanceAbilityEffects.find((row) => row.effectId === '1011620061')?.valueMetadata)
      .toMatchObject({ rawDescription: 'Increases all Basic Defenses by <b>24%</b>.' });
  });

  it('applies the published Black Swan Tier-2 passive type correction', () => {
    const blackSwan: ApiCharacter = {
      ...baseCharacter,
      character: 'Black Swan',
      uniform: 'Default',
      portrait: 'blackswan',
      uniformed: false,
    };
    const result = parseApiCharacterSkills([{
      portrait: 'blackswan',
      skills: {
        'Active 3': {
          id: 102707001,
          type: 'Active 3',
          name: 'Brutal Incursion',
          icon: 'icon_blackswan_skill70',
          stages: [{
            id: 102707001,
            abils: [{
              id: 1027070011,
              abilityId: 304,
              ability: 'SKILL AND BONUS DAMAGE INCREASE',
              description: 'Increases Skill damage by <b>35%</b>.',
            }],
          }],
        },
      },
    }], [blackSwan]);

    expect(result.appearanceAbilities).toContainEqual(expect.objectContaining({
      portraitId: 'blackswan',
      sourceSkillType: 'Tier-2 Passive',
      kind: 'passive',
      skillName: 'Brutal Incursion',
    }));
    expect(result.appearanceAbilities).toContainEqual(expect.objectContaining({
      id: 'appearance-ability:blackswan:passive',
      portraitId: 'blackswan',
      sourceSkillType: 'Passive',
      kind: 'passive',
      skillName: 'Uncompromising Precision',
      icon: 'icon_blackswan_skill30',
      sourceUrl: 'https://forum.netmarble.com/futurefight_en/view/2196/1809909',
    }));
    const manualAbility = result.appearanceAbilities.find((row) => row.skillId === '102703001');
    expect(result.appearanceAbilityEffects
      .filter((row) => row.appearanceAbilityId === manualAbility?.id)
      .map((row) => row.abilityCode)).toEqual([120, 208, 304]);
    expect(result.coverage.find((row) => row.kind === 'passive')).toMatchObject({
      status: 'complete',
      abilityCount: 2,
      effectCount: 4,
    });
  });

  it('stops applying a manual supplement after the upstream publishes that skill type', () => {
    const blackSwan: ApiCharacter = {
      ...baseCharacter,
      character: 'Black Swan',
      uniform: 'Default',
      portrait: 'blackswan',
      uniformed: false,
    };
    const result = parseApiCharacterSkills([{
      portrait: 'blackswan',
      skills: {
        Passive: {
          id: 999703001,
          type: 'Passive',
          name: 'Published Precision',
          stages: [{ id: 999703001, abils: [] }],
        },
      },
    }], [blackSwan]);

    expect(result.appearanceAbilities.filter((row) => row.sourceSkillType === 'Passive'))
      .toHaveLength(1);
    expect(result.appearanceAbilities.find((row) => row.sourceSkillType === 'Passive'))
      .toMatchObject({ skillId: '999703001', skillName: 'Published Precision' });
  });

  it('records an explicit empty uniform passive as complete audited coverage', () => {
    const uniform: ApiCharacter = {
      ...baseCharacter,
      uniform: 'Legacy Look',
      portrait: 'testhero1',
      uniformed: true,
      base_portrait: 'testhero',
    };
    const result = parseApiCharacterSkills([{
      portrait: 'testhero1',
      skills: {
        'Uniform Passive': {
          id: 100345001,
          type: 'Uniform Passive',
          name: 'Legacy Look',
          cooldown: 0,
          stages: [{ id: 100345001, abils: [] }],
        },
      },
    }], [baseCharacter, uniform]);

    expect(result.supports.find((row) => row.portraitId === 'testhero1')?.uniformEffect).toEqual([]);
    expect(result.coverage.find((row) => row.portraitId === 'testhero1' && row.kind === 'uniform_effect'))
      .toMatchObject({ status: 'complete', abilityCount: 1, effectCount: 0 });
  });
});
