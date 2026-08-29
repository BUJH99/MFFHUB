import { BASE_URL } from './config';
import type {
  AttributeRow,
  CombatType,
  Side,
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
    .trim();

const titleCase = (value: string) =>
  clean(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const portraitUrl = (portrait: string) =>
  `${BASE_URL}/images-thumbnails/portraits/md/${portrait}.png`;

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
    const character = rows.find((row) => row.portrait === portrait);
    if (!character) continue;
    const characterId = slugify(character.character);
    const current = latestPortraitByCharacter.get(characterId);
    if (!current || compareVersions(uniform.update, current.update) > 0) {
      latestPortraitByCharacter.set(characterId, { portrait, update: uniform.update });
    }
  }

  return rows
    .map((row) => {
      const characterId = slugify(row.character);
      const previousRow = previousByPortrait.get(row.portrait);
      const side = mapSide(row.side);
      const fallbackInstinct =
        previousInstinctByCharacter.get(characterId) ?? `Instinct:${inferredInstinct(side, row.allies)}`;
      const derivedTags = mergeStrings(
        row.ability ?? [],
        [fallbackInstinct],
        row.original ? [`Source:${titleCase(row.original)}`] : [],
        row['tier-4'] === 'True' ? ['Tier-4'] : [],
        row.skill6 && row.skill6 !== 'False' ? [row.skill6] : [],
      );
      const isBase = row.uniformed === false || clean(row.uniformed).toLowerCase() === 'false';
      const latest = latestPortraitByCharacter.get(characterId);

      return {
        character: row.character,
        characterId,
        uniform: row.uniform || previousRow?.uniform,
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
  const previousByPortrait = new Map(previous.map((row) => [row.portraitId, row]));
  const dates = updateDates(updates);

  return Object.entries(uniformRows)
    .flatMap(([portrait, raw]) => {
      const character = characterByPortrait.get(portrait);
      if (!character) return [];
      const old = previousByPortrait.get(portrait);
      return [{
        character: character.character,
        characterId: slugify(character.character),
        name: character.uniform,
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
    .sort((a, b) => a.character.localeCompare(b.character) || a.name.localeCompare(b.name));
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
    const support: SyncedSupport = {
      character: character.character,
      characterId: slugify(character.character),
      uniform: character.uniform,
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
      const parsed = ranks.flatMap((rank) => effectRows(character, ability, section.sourceKind, rank));
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
