import { BASE_URL } from './config';
import type {
  AppearanceAbilityKind,
  AttributeRow,
  CombatType,
  Side,
  SyncedAppearanceAbility,
  SyncedAppearanceAbilityCoverage,
  SyncedAppearanceAbilityEffect,
  SyncedArtifact,
  SyncedComicCard,
  SyncedEffect,
  SyncedSupport,
  SyncedUniform,
} from './types';

export type ApiCharacter = {
  character: string;
  uniform: string;
  uniformed: string | boolean;
  portrait: string;
  type?: string;
  allies?: string;
  gender?: string;
  side?: string;
  ability?: string[];
  original?: string;
  skill6?: string;
  'tier-4'?: string;
  new?: string;
  base_portrait?: string;
};

export type ApiUniform = {
  cost?: string;
  update?: string;
  flags?: string[];
};

export type ApiArtifact = {
  portrait: string;
  character: string;
  artifact_name: string;
  passive_name?: string;
  update?: string;
  pve_score?: number;
  pvp_score?: number;
  text?: string[];
  values?: Record<string, Array<string | number>>;
  acquisition?: string[];
};

export type ApiComicCard = {
  name: string;
  type?: string;
  img?: string;
  stat1?: string;
  stat2?: string;
  stat3?: string | string[];
  stat4?: string[];
  stat5?: string[];
  stat6?: string[];
};

type ApiSupportAbility = {
  name?: string;
  restrictions?: string[];
  activation?: string;
  cooltime?: string | number;
  effect?: unknown[][];
  effect3?: unknown[][];
  effect4?: unknown[][];
  effect5?: unknown[][];
  effect6?: unknown[][];
};

export type ApiSupport = {
  portrait: string;
  leader?: ApiSupportAbility | null;
  leader2?: ApiSupportAbility | null;
  passive?: ApiSupportAbility | null;
  passive2?: ApiSupportAbility | null;
  t2?: ApiSupportAbility | null;
  t22?: ApiSupportAbility | null;
  uniform?: ApiSupportAbility | null;
  uniform2?: ApiSupportAbility | null;
  artifact?: ApiSupportAbility | null;
};

export type ApiCharacterSkillAbility = {
  id?: string | number;
  abilityId?: string | number;
  ability?: string;
  description?: string;
  duration?: string | number | boolean | null;
  tick?: string | number | boolean | null;
  persistent?: string | number | boolean | null;
  [key: string]: unknown;
};

export type ApiCharacterSkillStage = {
  id?: string | number;
  abils?: ApiCharacterSkillAbility[];
  target?: string;
  activation?: string;
  [key: string]: unknown;
};

export type ApiCharacterSkill = {
  id?: string | number;
  type?: string;
  name?: string;
  cooldown?: string | number;
  icon?: string;
  target?: string;
  activation?: string;
  sourceUrl?: string;
  stages?: ApiCharacterSkillStage[];
  [key: string]: unknown;
};

export type ApiCharacterSkillPayload = {
  portrait: string;
  skills: Record<string, ApiCharacterSkill | null | undefined>;
  key_abilities?: Record<string, unknown>;
};

export type ApiUpdate = {
  potes?: Array<{ version?: string; date?: string }>;
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();

const clean = (value: unknown) =>
  String(value ?? '')
    .replace(/&emsp;|&#8195;/gi, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

const titleCase = (value: string) =>
  clean(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const portraitUrl = (portrait: string) =>
  `${BASE_URL}/images-thumbnails/portraits/md/${portrait}.png`;

const isBaseCharacterRow = (row: ApiCharacter) =>
  row.uniformed === false || clean(row.uniformed).toLowerCase() === 'false';

function baseCharacterRowsByPortrait(rows: ApiCharacter[]) {
  return new Map(
    rows
      .filter(isBaseCharacterRow)
      .map((row) => [row.portrait, row]),
  );
}

function canonicalCharacterIdentity(
  row: ApiCharacter,
  baseRowsByPortrait: Map<string, ApiCharacter>,
) {
  const baseRow = baseRowsByPortrait.get(clean(row.base_portrait)) ?? row;
  return {
    character: baseRow.character,
    characterId: slugify(baseRow.character),
  };
}

function canonicalUniformNamesByPortrait(
  rows: ApiCharacter[],
  baseRowsByPortrait: Map<string, ApiCharacter>,
) {
  const groups = new Map<string, ApiCharacter[]>();
  for (const row of rows) {
    const identity = canonicalCharacterIdentity(row, baseRowsByPortrait);
    const key = `${identity.characterId}|${slugify(row.uniform || 'Modern')}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const result = new Map<string, string>();
  for (const group of groups.values()) {
    for (const row of group) {
      const identity = canonicalCharacterIdentity(row, baseRowsByPortrait);
      const name = clean(row.uniform) || 'Modern';
      // Some transformed uniforms reuse a base character's uniform name while exposing
      // an alter-ego as `character`. Qualify only those collisions so no appearance is lost.
      result.set(
        row.portrait,
        group.length > 1 && row.character !== identity.character
          ? `${name} · ${row.character}`
          : name,
      );
    }
  }
  return result;
}

const mapCombatType = (value?: string): CombatType => {
  if (value === 'Combat' || value === 'Blast' || value === 'Speed' || value === 'Universal') return value;
  return 'Unknown';
};

const mapSide = (value?: string): Side => {
  if (value === 'Super Hero' || value === 'Hero') return 'Hero';
  if (value === 'Super Villain' || value === 'Villain') return 'Villain';
  if (value === 'Neutral') return 'Neutral';
  return 'Unknown';
};

const mergeStrings = (...lists: Array<Array<string | undefined>>) =>
  Array.from(new Set(lists.flat().map(clean).filter(Boolean)));

function mergeTags(previous: string[] = [], current: string[] = []) {
  const result = new Map(previous.map((tag) => [slugify(tag), tag]));
  for (const tag of current) result.set(slugify(tag), tag);
  return Array.from(result.values());
}

const scoreLabel = (value?: number) => {
  if (value === 1) return 'Low';
  if (value === 2) return 'Medium';
  if (value === 3) return 'High';
  return undefined;
};

function compareVersions(a?: string, b?: string) {
  const parts = (value?: string) =>
    clean(value)
      .split('.')
      .flatMap((part) => {
        const match = part.match(/^(\d+)([a-z]*)$/i);
        return match ? [Number(match[1]), match[2]?.toLowerCase().charCodeAt(0) || 0] : [0, 0];
      });
  const left = parts(a);
  const right = parts(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

function inferredInstinct(side: Side, species?: string) {
  if (species === 'Human' && side === 'Hero') return 'Justice';
  if (species === 'Human' && side === 'Villain') return 'Cruelty';
  if (side === 'Hero') return 'Order';
  return 'Destruction';
}

export function parseApiAttributes(
  rows: ApiCharacter[],
  uniformRows: Record<string, ApiUniform>,
  previous: AttributeRow[] = [],
): AttributeRow[] {
  const characterByPortrait = new Map(rows.map((row) => [row.portrait, row]));
  const baseRowsByPortrait = baseCharacterRowsByPortrait(rows);
  const uniformNamesByPortrait = canonicalUniformNamesByPortrait(rows, baseRowsByPortrait);
  const previousByPortrait = new Map(previous.map((row) => [row.portraitId, row]));
  const previousInstinctByCharacter = new Map<string, string>();
  for (const row of previous) {
    const instinct = row.tags.find((tag) => tag.startsWith('Instinct:'));
    if (instinct && !previousInstinctByCharacter.has(row.characterId)) {
      previousInstinctByCharacter.set(row.characterId, instinct);
    }
  }

  const latestPortraitByCharacter = new Map<string, { portrait: string; update?: string }>();
  for (const [portrait, uniform] of Object.entries(uniformRows)) {
    const character = characterByPortrait.get(portrait);
    if (!character) continue;
    const { characterId } = canonicalCharacterIdentity(character, baseRowsByPortrait);
    const current = latestPortraitByCharacter.get(characterId);
    if (!current || compareVersions(uniform.update, current.update) > 0) {
      latestPortraitByCharacter.set(characterId, { portrait, update: uniform.update });
    }
  }

  return rows
    .map((row) => {
      const identity = canonicalCharacterIdentity(row, baseRowsByPortrait);
      const { characterId } = identity;
      const previousRow = previousByPortrait.get(row.portrait);
      const side = mapSide(row.side);
      const fallbackInstinct =
        previousInstinctByCharacter.get(characterId) ?? `Instinct:${inferredInstinct(side, row.allies)}`;
      const derivedTags = mergeStrings(
        row.ability ?? [],
        [fallbackInstinct],
        row.character !== identity.character ? [`Alias:${row.character}`] : [],
        row.original ? [`Source:${titleCase(row.original)}`] : [],
        row['tier-4'] === 'True' ? ['Tier-4'] : [],
        row.skill6 && row.skill6 !== 'False' ? [row.skill6] : [],
      );
      const isBase = isBaseCharacterRow(row);
      const latest = latestPortraitByCharacter.get(characterId);

      return {
        character: identity.character,
        characterId,
        uniform: uniformNamesByPortrait.get(row.portrait) || previousRow?.uniform,
        portraitId: row.portrait,
        portraitUrl: portraitUrl(row.portrait),
        combatType: mapCombatType(row.type),
        side,
        gender: row.gender,
        species: row.allies,
        tags: mergeTags(previousRow?.tags, derivedTags),
        latestUniform: latest ? latest.portrait === row.portrait : isBase,
        baseCharacter: isBase,
      };
    })
    .sort((a, b) => a.character.localeCompare(b.character) || clean(a.uniform).localeCompare(clean(b.uniform)));
}

function uniformSeason(flags: string[] = []) {
  if (flags.includes('Summer')) return 'Summer';
  if (flags.includes('Halloween')) return 'Halloween';
  if (flags.includes('Christmas')) return 'Christmas';
  if (flags.includes('April')) return "April Fool's";
  if (flags.includes('Seasonal')) return 'Seasonal';
  return undefined;
}

function uniformAcquisition(cost?: string, flags: string[] = []) {
  const usefulFlags = flags.filter(
    (flag) => !/^Crystal\d+$/i.test(flag) && !['FullPrice', 'Native', 'Mutant'].includes(flag),
  );
  return mergeStrings(cost ? [cost] : [], usefulFlags).join(' | ') || undefined;
}

function updateDates(rows: ApiUpdate[]) {
  const result = new Map<string, string>();
  for (const row of rows) {
    for (const update of row.potes ?? []) {
      if (update.version && update.date) result.set(update.version, update.date);
    }
  }
  return result;
}

export function parseApiUniforms(
  uniformRows: Record<string, ApiUniform>,
  characterRows: ApiCharacter[],
  updates: ApiUpdate[],
  previous: SyncedUniform[] = [],
): SyncedUniform[] {
  const characterByPortrait = new Map(characterRows.map((row) => [row.portrait, row]));
  const baseRowsByPortrait = baseCharacterRowsByPortrait(characterRows);
  const uniformNamesByPortrait = canonicalUniformNamesByPortrait(characterRows, baseRowsByPortrait);
  const previousByPortrait = new Map(previous.map((row) => [row.portraitId, row]));
  const previousOrderByPortrait = new Map(previous.map((row, index) => [row.portraitId, index]));
  const dates = updateDates(updates);

  return Object.entries(uniformRows)
    .flatMap(([portrait, raw]) => {
      const character = characterByPortrait.get(portrait);
      if (!character) return [];
      const identity = canonicalCharacterIdentity(character, baseRowsByPortrait);
      const old = previousByPortrait.get(portrait);
      return [{
        character: identity.character,
        characterId: identity.characterId,
        name: uniformNamesByPortrait.get(character.portrait) ?? character.uniform,
        acquisition: uniformAcquisition(raw.cost, raw.flags) ?? old?.acquisition,
        season: uniformSeason(raw.flags) ?? old?.season,
        cost: raw.cost ?? old?.cost,
        releaseUpdate: raw.update ? `Update ${raw.update}` : old?.releaseUpdate,
        releaseDate: dates.get(clean(raw.update)) ?? old?.releaseDate,
        portraitId: portrait,
        portraitUrl: portraitUrl(portrait),
        imageUrl: portraitUrl(portrait),
        sourceUrl: `${BASE_URL}/uniforms`,
      } satisfies SyncedUniform];
    })
    .sort((a, b) => {
      const characterOrder = a.character.localeCompare(b.character);
      if (characterOrder) return characterOrder;

      const oldA = previousByPortrait.get(a.portraitId);
      const oldB = previousByPortrait.get(b.portraitId);
      // Keep existing canonical uniform indexes stable. Uniforms that previously lived
      // under an alter-ego name, plus genuinely new uniforms, are appended afterwards.
      const priorityA = oldA ? (oldA.characterId === a.characterId ? 0 : 1) : 2;
      const priorityB = oldB ? (oldB.characterId === b.characterId ? 0 : 1) : 2;
      if (priorityA !== priorityB) return priorityA - priorityB;

      const previousOrderA = previousOrderByPortrait.get(a.portraitId);
      const previousOrderB = previousOrderByPortrait.get(b.portraitId);
      if (previousOrderA != null && previousOrderB != null && previousOrderA !== previousOrderB) {
        return previousOrderA - previousOrderB;
      }
      return a.name.localeCompare(b.name) || clean(a.portraitId).localeCompare(clean(b.portraitId));
    });
}

function replacePlaceholders(text: string, values: Array<string | number> = []) {
  return clean(text).replace(/\[P(\d+)\]/g, (match, index: string) => {
    const value = values[Number(index) - 1];
    return value == null ? match : String(value);
  });
}

export function parseApiArtifacts(rows: ApiArtifact[]): SyncedArtifact[] {
  return rows
    .map((row) => ({
      character: row.character,
      characterId: slugify(row.character),
      name: row.artifact_name,
      exclusiveSkill: row.passive_name,
      pveScore: scoreLabel(row.pve_score),
      pvpScore: scoreLabel(row.pvp_score),
      effects: ['3', '4', '5', '6'].flatMap((star) =>
        (row.text ?? []).map((text) => `${star}★: ${replacePlaceholders(text, row.values?.[star])}`),
      ),
      acquisition: row.acquisition?.map(clean).filter(Boolean).join(' | ') || undefined,
      releaseUpdate: row.update ? `Update ${row.update}` : undefined,
      imageUrl: `${BASE_URL}/images/artifacts/artifact_${row.portrait}.png`,
      sourceUrl: `${BASE_URL}/api/artifacts`,
    }))
    .sort((a, b) => a.character.localeCompare(b.character));
}

function statName(value?: string) {
  return value
    ? titleCase(value)
        .replace(/\bHp\b/g, 'HP')
        .replace(/\bAtk\b/g, 'ATK')
        .replace(/\bPve\b/g, 'PVE')
        .replace(/\bPvp\b/g, 'PVP')
    : undefined;
}

function stringList(value?: string | string[]) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function parseApiComicCards(rows: ApiComicCard[]): SyncedComicCard[] {
  return rows
    .map((row) => ({
      id: slugify(row.name),
      name: row.name,
      cardType: row.type,
      fixedStats: mergeStrings(
        row.stat1 ? [statName(row.stat1)] : [],
        row.stat2 ? [statName(row.stat2)] : [],
        stringList(row.stat3).map(statName),
      ),
      optionStats: {
        stat4: (row.stat4 ?? []).map((value) => statName(value) ?? value),
        stat5: (row.stat5 ?? []).map((value) => statName(value) ?? value),
        stat6: (row.stat6 ?? []).map((value) => statName(value) ?? value),
      },
      imageUrl: row.img ? `${BASE_URL}/images/cards/${row.img}.png` : undefined,
      sourceUrl: `${BASE_URL}/api/cards`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const APPEARANCE_ABILITY_KINDS: AppearanceAbilityKind[] = ['leader', 'passive', 'uniform_effect'];

const SOURCE_SKILL_TYPES = new Map<string, { type: string; kind: AppearanceAbilityKind; order: number }>([
  ['leaderskill', { type: 'Leader Skill', kind: 'leader', order: 0 }],
  ['passive', { type: 'Passive', kind: 'passive', order: 1 }],
  ['tier2passive', { type: 'Tier-2 Passive', kind: 'passive', order: 2 }],
  ['uniformpassive', { type: 'Uniform Passive', kind: 'uniform_effect', order: 3 }],
]);

// THANO$VIB$ currently publishes this one passive under `Active 3`. Keeping the
// correction here makes the upstream exception explicit, reviewable, and stable.
const CHARACTER_SKILL_TYPE_OVERRIDES = new Map<string, string>([
  ['blackswan|102707001', 'Tier-2 Passive'],
]);

const MANUAL_APPEARANCE_SKILL_SUPPLEMENTS = new Map<string, ApiCharacterSkill[]>([
  ['blackswan', [{
    id: 102703001,
    type: 'Passive',
    name: 'Uncompromising Precision',
    cooldown: 3,
    icon: 'icon_blackswan_skill30',
    target: 'Self',
    activation: 'Effect reactivates in 3 seconds after removal.',
    sourceUrl: 'https://forum.netmarble.com/futurefight_en/view/2196/1809909',
    stages: [{
      id: 102703001,
      target: 'Self',
      abils: [{
        id: 1027030011,
        abilityId: 120,
        ability: 'PIERCE',
        description: '50% chance to penetrate with Super Armor, Barrier, Shield, All Damage Immune, and Invincible effects.',
        manualSupplement: true,
      }, {
        id: 1027030012,
        abilityId: 208,
        ability: 'SUPER ARMOR',
        description: 'Grants Super Armor and increases all Basic Defenses by 50%.',
        manualSupplement: true,
      }, {
        id: 1027030013,
        abilityId: 304,
        ability: 'SKILL AND BONUS DAMAGE INCREASE',
        description: 'Increases Skill Damage by 45% and Bonus Damage by 45%.',
        manualSupplement: true,
      }],
    }],
  }]],
]);

const sourceSkillTypeToken = (value: unknown) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');

const stableIdToken = (value: unknown, fallback: string) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

function normalizedScalar(value: unknown): string | number | boolean | null | undefined {
  if (value == null) return value === null ? null : undefined;
  if (typeof value === 'string') return clean(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return clean(value) || undefined;
}

function normalizedTextOrNumber(value: unknown): string | number | undefined {
  if (typeof value === 'number') return value;
  return clean(value) || undefined;
}

function appearanceSkillSourceUrl(portrait: string) {
  return `${BASE_URL}/api/characters/${encodeURIComponent(portrait)}/skills`;
}

function appearanceSkillEntries(payload: ApiCharacterSkillPayload | undefined, portrait: string) {
  const entries = Object.entries(payload?.skills ?? {});
  const publishedSkillIds = new Set(entries.map(([, skill]) => clean(skill?.id)).filter(Boolean));
  const publishedSkillTypes = new Set(
    entries.map(([recordType, skill]) => sourceSkillTypeToken(clean(skill?.type) || recordType)),
  );
  for (const supplement of MANUAL_APPEARANCE_SKILL_SUPPLEMENTS.get(portrait) ?? []) {
    if (
      publishedSkillIds.has(clean(supplement.id)) ||
      publishedSkillTypes.has(sourceSkillTypeToken(supplement.type))
    ) continue;
    entries.push([`Manual ${clean(supplement.type) || 'Skill'} ${clean(supplement.id)}`, supplement]);
  }
  return entries;
}

function canonicalSourceSkillType(
  portrait: string,
  recordType: string,
  skill: ApiCharacterSkill,
) {
  const override = CHARACTER_SKILL_TYPE_OVERRIDES.get(`${portrait}|${clean(skill.id)}`);
  if (override) return override;
  const rawType = clean(skill.type) || clean(recordType);
  return SOURCE_SKILL_TYPES.get(sourceSkillTypeToken(rawType))?.type ?? rawType;
}

function appearanceAbilityKind(sourceSkillType: string) {
  return SOURCE_SKILL_TYPES.get(sourceSkillTypeToken(sourceSkillType));
}

function appearanceEffectValueMetadata(effect: ApiCharacterSkillAbility) {
  const reserved = new Set([
    'id',
    'abilityId',
    'ability',
    'description',
    'duration',
    'tick',
    'persistent',
  ]);
  const entries = Object.entries(effect).filter(([key, value]) => !reserved.has(key) && value !== undefined);
  const metadata = Object.fromEntries(entries);
  if (typeof effect.description === 'string' && effect.description.trim()) {
    metadata.rawDescription = effect.description;
  }
  return Object.keys(metadata).length ? metadata : undefined;
}

function appearanceEffectSignature(
  stageId: string,
  effectId: string,
  effect: ApiCharacterSkillAbility,
  valueMetadata?: Record<string, unknown>,
) {
  return JSON.stringify([
    stageId,
    effectId,
    normalizedScalar(effect.abilityId),
    clean(effect.ability),
    clean(effect.description),
    normalizedScalar(effect.duration),
    normalizedScalar(effect.tick),
    normalizedScalar(effect.persistent),
    valueMetadata,
  ]);
}

function summarizeAppearanceAbility(
  ability: SyncedAppearanceAbility,
  effects: SyncedAppearanceAbilityEffect[],
) {
  const context = [
    ability.skillName,
    ability.target ? `Target: ${ability.target}` : undefined,
    ability.activation ? `Activation: ${ability.activation}` : undefined,
    ability.cooldown != null && ability.cooldown !== '' ? `Cooldown ${ability.cooldown}s` : undefined,
  ];
  return [...context, ...mergeStrings(effects.map((effect) => effect.description))]
    .filter(Boolean)
    .join(' | ');
}

export function parseApiCharacterSkills(
  payloads: ApiCharacterSkillPayload[],
  characterRows: ApiCharacter[],
) {
  const payloadByPortrait = new Map(payloads.map((payload) => [payload.portrait, payload]));
  const baseRowsByPortrait = baseCharacterRowsByPortrait(characterRows);
  const uniformNamesByPortrait = canonicalUniformNamesByPortrait(characterRows, baseRowsByPortrait);
  const supports: SyncedSupport[] = [];
  const appearanceAbilities: SyncedAppearanceAbility[] = [];
  const appearanceAbilityEffects: SyncedAppearanceAbilityEffect[] = [];
  const coverage: SyncedAppearanceAbilityCoverage[] = [];

  for (const characterRow of characterRows) {
    const portraitId = clean(characterRow.portrait);
    if (!portraitId) continue;
    const payload = payloadByPortrait.get(portraitId);
    const sourceUrl = appearanceSkillSourceUrl(portraitId);
    const identity = canonicalCharacterIdentity(characterRow, baseRowsByPortrait);
    const uniform = uniformNamesByPortrait.get(portraitId) ?? (clean(characterRow.uniform) || undefined);
    const baseCharacter = isBaseCharacterRow(characterRow);
    const support: SyncedSupport = {
      character: identity.character,
      characterId: identity.characterId,
      portraitId,
      uniform,
      leadership: [],
      passive: [],
      uniformEffect: [],
      artifactExclusiveSkill: [],
      sourceUrl,
    };
    const abilityCountByKind = new Map(APPEARANCE_ABILITY_KINDS.map((kind) => [kind, 0]));
    const effectCountByKind = new Map(APPEARANCE_ABILITY_KINDS.map((kind) => [kind, 0]));
    const reviewCountByKind = new Map(APPEARANCE_ABILITY_KINDS.map((kind) => [kind, 0]));

    const parsedSkills = appearanceSkillEntries(payload, portraitId)
      .map(([recordType, skill], sourceOrder) => {
        if (!skill) return undefined;
        const sourceSkillType = canonicalSourceSkillType(portraitId, recordType, skill);
        const classification = appearanceAbilityKind(sourceSkillType);
        return classification
          ? { skill, sourceOrder, sourceSkillType, classification }
          : undefined;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((left, right) =>
        left.classification.order - right.classification.order || left.sourceOrder - right.sourceOrder,
      );

    for (let sortOrder = 0; sortOrder < parsedSkills.length; sortOrder += 1) {
      const { skill, sourceOrder, sourceSkillType, classification } = parsedSkills[sortOrder];
      const skillId = clean(skill.id) || `${stableIdToken(sourceSkillType, 'skill')}-${sourceOrder}`;
      const appearanceAbilityId = [
        'appearance-ability',
        stableIdToken(portraitId, 'portrait'),
        stableIdToken(sourceSkillType, 'skill-type'),
      ].join(':');
      const stages = Array.isArray(skill.stages) ? skill.stages : [];
      const targets = mergeStrings(
        clean(skill.target) ? [clean(skill.target)] : [],
        stages.map((stage) => clean(stage.target)).filter(Boolean),
      );
      const activations = mergeStrings(
        clean(skill.activation) ? [clean(skill.activation)] : [],
        stages.map((stage) => clean(stage.activation)).filter(Boolean),
      );
      const ability: SyncedAppearanceAbility = {
        id: appearanceAbilityId,
        portraitId,
        characterId: identity.characterId,
        character: identity.character,
        uniform,
        baseCharacter,
        kind: classification.kind,
        sourceSkillType,
        skillId,
        skillName: clean(skill.name) || sourceSkillType,
        cooldown: normalizedTextOrNumber(skill.cooldown),
        target: targets.join(' | ') || undefined,
        activation: activations.join(' | ') || undefined,
        icon: clean(skill.icon) || undefined,
        sortOrder,
        sourceUrl: clean(skill.sourceUrl) || sourceUrl,
      };
      const parsedEffects: SyncedAppearanceAbilityEffect[] = [];
      const seenEffects = new Set<string>();

      for (let stageOrder = 0; stageOrder < stages.length; stageOrder += 1) {
        const stage = stages[stageOrder];
        const stageId = clean(stage.id) || `stage-${stageOrder}`;
        const effects = Array.isArray(stage.abils) ? stage.abils : [];
        for (let effectOrder = 0; effectOrder < effects.length; effectOrder += 1) {
          const effect = effects[effectOrder];
          const effectId = clean(effect.id) || `effect-${effectOrder}`;
          const valueMetadata = appearanceEffectValueMetadata(effect);
          const signature = appearanceEffectSignature(stageId, effectId, effect, valueMetadata);
          if (seenEffects.has(signature)) continue;
          seenEffects.add(signature);

          parsedEffects.push({
            id: [
              appearanceAbilityId,
              'stage',
              stableIdToken(stageId, `stage-${stageOrder}`),
              stageOrder,
              'effect',
              stableIdToken(effectId, `effect-${effectOrder}`),
              effectOrder,
            ].join(':'),
            appearanceAbilityId,
            stageId,
            stageOrder,
            effectId,
            effectOrder,
            abilityCode: normalizedTextOrNumber(effect.abilityId),
            effectName: clean(effect.ability) || `Ability ${clean(effect.abilityId) || effectOrder + 1}`,
            description: clean(effect.description) || clean(effect.ability) || 'Unknown effect',
            duration: normalizedScalar(effect.duration),
            tick: normalizedScalar(effect.tick),
            persistent: normalizedScalar(effect.persistent),
            valueMetadata,
          });
        }
      }

      appearanceAbilities.push(ability);
      appearanceAbilityEffects.push(...parsedEffects);
      abilityCountByKind.set(classification.kind, (abilityCountByKind.get(classification.kind) ?? 0) + 1);
      if (!clean(skill.id) && !clean(skill.name)) {
        reviewCountByKind.set(classification.kind, (reviewCountByKind.get(classification.kind) ?? 0) + 1);
      }
      effectCountByKind.set(
        classification.kind,
        (effectCountByKind.get(classification.kind) ?? 0) + parsedEffects.length,
      );
      if (parsedEffects.length) {
        const summary = summarizeAppearanceAbility(ability, parsedEffects);
        if (classification.kind === 'leader') support.leadership.push(summary);
        if (classification.kind === 'passive') support.passive.push(summary);
        if (classification.kind === 'uniform_effect') support.uniformEffect.push(summary);
      }
    }

    support.leadership = mergeStrings(support.leadership);
    support.passive = mergeStrings(support.passive);
    support.uniformEffect = mergeStrings(support.uniformEffect);
    supports.push(support);

    for (const kind of APPEARANCE_ABILITY_KINDS) {
      const abilityCount = abilityCountByKind.get(kind) ?? 0;
      const effectCount = effectCountByKind.get(kind) ?? 0;
      const reviewCount = reviewCountByKind.get(kind) ?? 0;
      const isBaseUniformEffect = baseCharacter && kind === 'uniform_effect';
      const status = isBaseUniformEffect
        ? 'not_applicable'
        : !payload || abilityCount === 0
          ? 'missing'
          : reviewCount > 0
            ? 'needs_review'
            : 'complete';
      const reason = isBaseUniformEffect
        ? 'Base appearances do not have a uniform passive.'
        : !payload
          ? 'Character skill payload was not available.'
          : abilityCount === 0
            ? `No ${kind} skill was published for this appearance.`
            : reviewCount > 0
              ? `The ${kind} skill is missing both its source id and name.`
              : undefined;
      coverage.push({
        id: `appearance-coverage:${stableIdToken(portraitId, 'portrait')}:${kind}`,
        portraitId,
        characterId: identity.characterId,
        character: identity.character,
        uniform,
        baseCharacter,
        kind,
        status,
        abilityCount,
        effectCount,
        reason,
        sourceUrl,
      });
    }
  }

  return { supports, appearanceAbilities, appearanceAbilityEffects, coverage };
}

function restrictionText(restrictions: string[] = []) {
  const result: string[] = [];
  for (let index = 0; index < restrictions.length; index += 2) {
    const kind = clean(restrictions[index]);
    const value = clean(restrictions[index + 1]);
    if (kind && value) result.push(`${kind}: ${value}`);
    else if (kind) result.push(kind);
  }
  return result.join(' | ') || undefined;
}

function effectText(effect: unknown[], artifact = false) {
  const [rawName, ...values] = effect;
  const name = clean(rawName);
  const noMagnitude =
    !artifact &&
    (values.length === 0 ||
      /^(?:Remove All Debuffs|Debuff Immunity|Immortality \+ Death|Revive with % HP)$/i.test(name) ||
      /(?:Duration Increase|Immunity|Summon)$/i.test(name));
  if (noMagnitude) {
    return [name, 'N/A', ...values.map(clean)].filter(Boolean).join(' ');
  }
  const formatted = values.map((value, index) => {
    if (typeof value !== 'number') return clean(value);
    const isLast = index === values.length - 1;
    const isPercent = artifact ? !isLast || values.length <= 2 : index === 0;
    return `${value}${isPercent ? '%' : ''}`;
  });
  return [name, ...formatted].filter(Boolean).join(' ');
}

function effectRows(
  character: ApiCharacter,
  ability: ApiSupportAbility,
  sourceKind: string,
  rank?: string,
): SyncedEffect[] {
  const list = rank ? ability[`effect${rank}` as keyof ApiSupportAbility] : ability.effect;
  if (!Array.isArray(list)) return [];
  const restrictions = restrictionText(ability.restrictions);
  return list.filter((effect): effect is unknown[] => Array.isArray(effect)).map((effect) => {
    const [name, magnitude] = effect;
    const artifact = sourceKind === 'Artifact Exclusive Skill';
    const formatted = effectText(effect, artifact);
    const context = [rank ? `${rank}★` : undefined, ability.activation, ability.cooltime ? `Cooldown ${ability.cooltime}s` : undefined]
      .filter(Boolean)
      .join(' | ');
    return {
      character: character.character,
      characterId: slugify(character.character),
      portraitId: character.portrait,
      uniform: character.uniform,
      sourceKind,
      effectName: clean(name),
      magnitude: typeof magnitude === 'number' ? magnitude : Number.parseFloat(clean(magnitude)) || undefined,
      magnitudeText:
        clean(name) === 'Remove All Debuffs'
          ? 'N/A'
          : typeof magnitude === 'number'
            ? `${magnitude}%`
            : clean(magnitude) || undefined,
      restrictionText: restrictions,
      rawText: [context, formatted].filter(Boolean).join(' | '),
      sourceUrl: `${BASE_URL}/api/supports`,
    };
  });
}

export function parseApiSupports(rows: ApiSupport[], characterRows: ApiCharacter[]) {
  const characterByPortrait = new Map(characterRows.map((row) => [row.portrait, row]));
  const baseRowsByPortrait = baseCharacterRowsByPortrait(characterRows);
  const uniformNamesByPortrait = canonicalUniformNamesByPortrait(characterRows, baseRowsByPortrait);
  const supports: SyncedSupport[] = [];
  const effects: SyncedEffect[] = [];
  const sections: Array<{
    key: keyof ApiSupport;
    sourceKind: string;
    aggregate: keyof Pick<SyncedSupport, 'leadership' | 'passive' | 'uniformEffect' | 'artifactExclusiveSkill'>;
  }> = [
    { key: 'leader', sourceKind: 'Leadership', aggregate: 'leadership' },
    { key: 'leader2', sourceKind: 'Leadership', aggregate: 'leadership' },
    { key: 'passive', sourceKind: '4★ Passive', aggregate: 'passive' },
    { key: 'passive2', sourceKind: '4★ Passive', aggregate: 'passive' },
    { key: 't2', sourceKind: 'Tier-2 Passive', aggregate: 'passive' },
    { key: 't22', sourceKind: 'Tier-2 Passive', aggregate: 'passive' },
    { key: 'uniform', sourceKind: 'Uniform Effect', aggregate: 'uniformEffect' },
    { key: 'uniform2', sourceKind: 'Uniform Effect', aggregate: 'uniformEffect' },
    { key: 'artifact', sourceKind: 'Artifact Exclusive Skill', aggregate: 'artifactExclusiveSkill' },
  ];

  for (const row of rows) {
    const character = characterByPortrait.get(row.portrait);
    if (!character) continue;
    const identity = canonicalCharacterIdentity(character, baseRowsByPortrait);
    const canonicalUniformName = uniformNamesByPortrait.get(character.portrait) ?? character.uniform;
    const canonicalCharacter = {
      ...character,
      character: identity.character,
      uniform: canonicalUniformName,
    };
    const support: SyncedSupport = {
      character: identity.character,
      characterId: identity.characterId,
      portraitId: character.portrait,
      uniform: canonicalUniformName,
      leadership: [],
      passive: [],
      uniformEffect: [],
      artifactExclusiveSkill: [],
      sourceUrl: `${BASE_URL}/api/supports`,
    };

    for (const section of sections) {
      const ability = row[section.key] as ApiSupportAbility | null | undefined;
      if (!ability) continue;
      const ranks = section.key === 'artifact' ? ['3', '4', '5', '6'] : [undefined];
      const parsed = ranks.flatMap((rank) => effectRows(canonicalCharacter, ability, section.sourceKind, rank));
      effects.push(...parsed);
      support[section.aggregate].push(...parsed.map((effect) => effectTextFromSynced(effect)));
    }

    support.leadership = mergeStrings(support.leadership);
    support.passive = mergeStrings(support.passive);
    support.uniformEffect = mergeStrings(support.uniformEffect);
    support.artifactExclusiveSkill = mergeStrings(support.artifactExclusiveSkill);
    supports.push(support);
  }

  return {
    supports: supports.sort((a, b) => a.character.localeCompare(b.character) || clean(a.uniform).localeCompare(clean(b.uniform))),
    effects: effects.sort((a, b) => a.character.localeCompare(b.character) || clean(a.uniform).localeCompare(clean(b.uniform))),
  };
}

function effectTextFromSynced(effect: SyncedEffect) {
  return effect.rawText.split('|').at(-1)?.trim() || [effect.effectName, effect.magnitudeText].filter(Boolean).join(' ');
}
