import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeAppearanceSupports, validateAppearanceSkillSync } from './output';
import type {
  AppearanceAbilityKind,
  SyncedAppearanceAbilityCoverage,
  SyncedSupport,
} from './types';

const support = (portraitId: string, artifactExclusiveSkill: string[] = []): SyncedSupport => ({
  character: 'Test Hero',
  characterId: 'testhero',
  portraitId,
  uniform: portraitId === 'testhero' ? 'Default' : 'Test Uniform',
  leadership: [],
  passive: [],
  uniformEffect: [],
  artifactExclusiveSkill,
  sourceUrl: `https://thanosvibs.money/api/characters/${portraitId}/skills`,
});

const coverage = (kind: AppearanceAbilityKind): SyncedAppearanceAbilityCoverage => ({
  id: `appearance-coverage:testhero:${kind}`,
  portraitId: 'testhero',
  characterId: 'testhero',
  character: 'Test Hero',
  uniform: 'Default',
  baseCharacter: true,
  kind,
  status: kind === 'uniform_effect' ? 'not_applicable' : 'complete',
  abilityCount: kind === 'uniform_effect' ? 0 : 1,
  effectCount: kind === 'uniform_effect' ? 0 : 1,
  sourceUrl: 'https://thanosvibs.money/api/characters/testhero/skills',
});

describe('THANO$VIB$ normalized output', () => {
  it('merges artifact summaries by stable portrait id', () => {
    const rows = mergeAppearanceSupports(
      [support('testhero'), support('testhero1')],
      [support('testhero1', ['Artifact Effect'])],
    );

    expect(rows.find((row) => row.portraitId === 'testhero')?.artifactExclusiveSkill).toEqual([]);
    expect(rows.find((row) => row.portraitId === 'testhero1')?.artifactExclusiveSkill)
      .toEqual(['Artifact Effect']);
  });

  it('accepts a complete relational snapshot and rejects orphan effects', () => {
    const input = {
      fetchedPayloadCount: 1,
      appearanceCount: 1,
      supports: [support('testhero')],
      abilities: [{
        id: 'appearance-ability:testhero:leader-skill',
        portraitId: 'testhero',
        characterId: 'testhero',
        character: 'Test Hero',
        uniform: 'Default',
        baseCharacter: true,
        kind: 'leader' as const,
        sourceSkillType: 'Leader Skill',
        skillId: '1001',
        skillName: 'Test Leadership',
        sortOrder: 0,
        sourceUrl: 'https://thanosvibs.money/api/characters/testhero/skills',
      }],
      effects: [{
        id: 'appearance-ability:testhero:leader-skill:stage:1:0:effect:1:0',
        appearanceAbilityId: 'appearance-ability:testhero:leader-skill',
        stageId: '1',
        stageOrder: 0,
        effectId: '1',
        effectOrder: 0,
        effectName: 'ALL BASIC ATTACKS INCREASE',
        description: 'Increases all Basic Attacks by 45%.',
      }],
      coverage: [coverage('leader'), coverage('passive'), coverage('uniform_effect')],
    };

    expect(() => validateAppearanceSkillSync(input)).not.toThrow();
    expect(() => validateAppearanceSkillSync({
      ...input,
      effects: [{ ...input.effects[0], appearanceAbilityId: 'missing-ability' }],
    })).toThrow(/orphan effect/);
  });

  it('keeps the production import headers aligned with the normalized DB contract', () => {
    const header = (name: string) => readFileSync(
      new URL(`../../../../supabase/imports/${name}.csv`, import.meta.url),
      'utf8',
    ).split(/\r?\n/, 1)[0];

    expect(header('character_appearances')).toBe(
      'id,character_id,name,is_default,sort_order,image_url,image_local_url,combat_type,side,gender,species,tags,source_url',
    );
    expect(header('appearance_abilities')).toBe(
      'id,appearance_id,kind,source_skill_type,source_skill_id,name,cooldown,target,activation,icon,sort_order,source_url,raw_data',
    );
    expect(header('appearance_ability_effects')).toBe(
      'id,appearance_ability_id,stage_id,stage_order,effect_order,source_effect_id,ability_code,effect_name,description,duration,tick,persistent,metadata',
    );
    expect(header('appearance_ability_coverage')).toBe(
      'appearance_id,kind,status,source_url,note,reviewed_at',
    );
    expect(header('character_effects')).toBe(
      'character_id,portrait_id,uniform,source_kind,effect_name,magnitude,magnitude_text,restriction_text,raw_text,source_url',
    );
  });
});
