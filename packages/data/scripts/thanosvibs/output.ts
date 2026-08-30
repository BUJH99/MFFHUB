import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  parseApiCharacterSkills,
  type ApiCharacter,
  type ApiCharacterSkillPayload,
} from './api';
import { OUT_IMPORTS, OUT_JSON_PACKAGE, PUBLIC_ASSET_ROOT, WEBP_QUALITY } from './config';
import type {
  SyncedAppearanceAbility,
  SyncedAppearanceAbilityCoverage,
  SyncedAppearanceAbilityEffect,
  SyncedSupport,
  SyncPayload,
} from './types';

const execFileAsync = promisify(execFile);

const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();

function publicAssetLocation(group: string, url?: string) {
  if (!url) return undefined;
  const parsed = new URL(url);
  const rawName = path.posix.basename(parsed.pathname) || `${slugify(url)}.png`;
  const ext = path.posix.extname(rawName) || '.png';
  const base = path.posix.basename(rawName, ext);
  const filename = `${slugify(base)}.webp`;
  return {
    publicUrl: `/mff-assets/${group}/${filename}`,
    filePath: path.join(PUBLIC_ASSET_ROOT, group, filename),
  };
}

export function dedupeBy<T extends object>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    const previous = map.get(key);
    map.set(key, previous ? { ...previous, ...item } : item);
  }
  return Array.from(map.values());
}

export function mergeAppearanceSupports(
  appearanceSupports: SyncedSupport[],
  legacySupports: SyncedSupport[],
) {
  const legacySupportByPortrait = new Map<string, SyncedSupport>();
  for (const row of legacySupports) {
    if (row.portraitId) legacySupportByPortrait.set(row.portraitId, row);
  }
  return appearanceSupports.map((row) => ({
    ...row,
    artifactExclusiveSkill:
      (row.portraitId ? legacySupportByPortrait.get(row.portraitId)?.artifactExclusiveSkill : undefined) ??
      row.artifactExclusiveSkill,
  }));
}

export function validateAppearanceSkillSync(input: {
  fetchedPayloadCount: number;
  appearanceCount: number;
  supports: SyncedSupport[];
  abilities: SyncedAppearanceAbility[];
  effects: SyncedAppearanceAbilityEffect[];
  coverage: SyncedAppearanceAbilityCoverage[];
}) {
  if (input.fetchedPayloadCount !== input.appearanceCount || input.supports.length !== input.appearanceCount) {
    throw new Error('THANO$VIB$ character skill sync did not cover every appearance');
  }
  if (input.coverage.length !== input.appearanceCount * 3) {
    throw new Error('THANO$VIB$ character skill coverage matrix is incomplete');
  }
  const unresolved = input.coverage.filter(
    (row) => row.status === 'missing' || row.status === 'needs_review',
  );
  if (unresolved.length) {
    const sample = unresolved
      .slice(0, 10)
      .map((row) => `${row.portraitId}:${row.kind}:${row.status}`)
      .join(', ');
    throw new Error(`THANO$VIB$ character skill coverage needs review (${sample})`);
  }
  if (new Set(input.abilities.map((row) => row.id)).size !== input.abilities.length) {
    throw new Error('THANO$VIB$ character skill sync produced duplicate ability ids');
  }
  if (new Set(input.effects.map((row) => row.id)).size !== input.effects.length) {
    throw new Error('THANO$VIB$ character skill sync produced duplicate effect ids');
  }
  const abilityIds = new Set(input.abilities.map((row) => row.id));
  if (input.effects.some((row) => !abilityIds.has(row.appearanceAbilityId))) {
    throw new Error('THANO$VIB$ character skill sync produced an orphan effect');
  }
}

async function runLimited<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function fetchJsonWithRetry(url: string, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'MFF Data Hub catalog sync/0.4 (+https://openai.com/chatgpt)',
        },
      });
      if (!res.ok) throw new Error(`${url} returned ${res.status}`);
      return await res.json() as unknown;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  }
  throw lastError;
}

export async function fetchCharacterSkillPayloads<T extends { portrait?: string }>(
  baseUrl: string,
  portraits: string[],
): Promise<T[]> {
  const results = new Array<T>(portraits.length);
  await runLimited(portraits.map((portrait, index) => ({ portrait, index })), 12, async ({ portrait, index }) => {
    const url = `${baseUrl}/api/characters/${encodeURIComponent(portrait)}/skills`;
    const payload = await fetchJsonWithRetry(url) as T;
    if (payload.portrait !== portrait) {
      throw new Error(`character skills response mismatch: expected ${portrait}, received ${payload.portrait ?? 'missing'}`);
    }
    results[index] = payload;
  });
  return results;
}

export async function fetchCompleteAppearanceSkillData(
  baseUrl: string,
  characterRows: ApiCharacter[],
  legacySupports: SyncedSupport[],
) {
  const payloads = await fetchCharacterSkillPayloads<ApiCharacterSkillPayload>(
    baseUrl,
    characterRows.map((row) => row.portrait),
  );
  const parsed = parseApiCharacterSkills(payloads, characterRows);
  const supports = mergeAppearanceSupports(parsed.supports, legacySupports);
  validateAppearanceSkillSync({
    fetchedPayloadCount: payloads.length,
    appearanceCount: characterRows.length,
    supports,
    abilities: parsed.appearanceAbilities,
    effects: parsed.appearanceAbilityEffects,
    coverage: parsed.coverage,
  });
  return { ...parsed, supports };
}

async function isValidWebpFile(filePath: string) {
  if (!existsSync(filePath)) return false;
  try {
    const header = await readFile(filePath);
    return header.length >= 12 && header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  } catch {
    return false;
  }
}

function isValidPngBuffer(buffer: Buffer) {
  return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

async function convertPngBufferToWebp(buffer: Buffer, filePath: string) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.source.png`;
  await writeFile(tempPath, buffer);
  try {
    await execFileAsync(
      'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', '-y', '-i', tempPath, '-c:v', 'libwebp', '-quality', String(WEBP_QUALITY), filePath],
      { windowsHide: true },
    );
  } finally {
    await rm(tempPath, { force: true });
  }

  if (!(await isValidWebpFile(filePath))) {
    await rm(filePath, { force: true });
    throw new Error('invalid webp output');
  }
}

export async function cacheAssets(payload: SyncPayload) {
  type AssetJob = {
    sourceUrl: string;
    filePath: string;
    publicUrl: string;
    apply: () => void;
  };

  const jobs: AssetJob[] = [];

  for (const character of payload.characters) {
    const loc = publicAssetLocation('characters', character.portraitUrl);
    if (!loc) continue;
    jobs.push({
      sourceUrl: character.portraitUrl,
      ...loc,
      apply: () => {
        character.localPortraitUrl = loc.publicUrl;
        character.localPortraitPath = loc.filePath;
      },
    });
  }

  for (const uniform of payload.uniforms) {
    const loc = publicAssetLocation('uniforms', uniform.imageUrl);
    if (!loc || !uniform.imageUrl) continue;
    jobs.push({
      sourceUrl: uniform.imageUrl,
      ...loc,
      apply: () => {
        uniform.localImageUrl = loc.publicUrl;
        uniform.localImagePath = loc.filePath;
      },
    });
  }

  for (const attribute of payload.attributes) {
    const loc = publicAssetLocation('uniforms', attribute.portraitUrl);
    if (!loc || !attribute.portraitUrl) continue;
    jobs.push({
      sourceUrl: attribute.portraitUrl,
      ...loc,
      apply: () => {
        attribute.localPortraitUrl = loc.publicUrl;
        attribute.localPortraitPath = loc.filePath;
      },
    });
  }

  for (const artifact of payload.artifacts) {
    const loc = publicAssetLocation('artifacts', artifact.imageUrl);
    if (!loc || !artifact.imageUrl) continue;
    jobs.push({
      sourceUrl: artifact.imageUrl,
      ...loc,
      apply: () => {
        artifact.localImageUrl = loc.publicUrl;
        artifact.localImagePath = loc.filePath;
      },
    });
  }

  for (const card of payload.comicCards) {
    const loc = publicAssetLocation('cards', card.imageUrl);
    if (!loc || !card.imageUrl) continue;
    jobs.push({
      sourceUrl: card.imageUrl,
      ...loc,
      apply: () => {
        card.localImageUrl = loc.publicUrl;
        card.localImagePath = loc.filePath;
      },
    });
  }

  const groupedJobs = Array.from(
    jobs.reduce((map, job) => {
      const existing = map.get(job.filePath);
      if (existing) {
        existing.applyFns.push(job.apply);
      } else {
        map.set(job.filePath, {
          sourceUrl: job.sourceUrl,
          filePath: job.filePath,
          publicUrl: job.publicUrl,
          applyFns: [job.apply],
        });
      }
      return map;
    }, new Map<string, { sourceUrl: string; filePath: string; publicUrl: string; applyFns: Array<() => void> }>()),
  ).map(([, job]) => job);
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  await runLimited(groupedJobs, 16, async (job) => {
    await mkdir(path.dirname(job.filePath), { recursive: true });
    if (await isValidWebpFile(job.filePath)) {
      job.applyFns.forEach((apply) => apply());
      skipped += 1;
      return;
    }

    try {
      const res = await fetch(job.sourceUrl, {
        headers: {
          'user-agent': 'MFF Data Hub asset cache/0.3 (+https://openai.com/chatgpt)',
        },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('image/png') || !isValidPngBuffer(buffer)) {
        throw new Error(`invalid png response: ${contentType || 'unknown content-type'}`);
      }
      await convertPngBufferToWebp(buffer, job.filePath);
      job.applyFns.forEach((apply) => apply());
      downloaded += 1;
    } catch {
      failed += 1;
    }
  });

  payload.assetStats = {
    requested: groupedJobs.length,
    downloaded,
    skipped,
    failed,
  };
  if (failed) payload.warnings.push(`asset download failed for ${failed} files`);
}

function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? `{${value.map((item) => `"${String(item).replace(/"/g, '\\"')}"`).join(',')}}` : value == null ? '' : String(value);
  return /[",\n{}]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv<T extends object>(rows: T[], columns: (keyof T | string)[]) {
  const keys = columns.map(String);
  return [keys.join(','), ...rows.map((row) => {
    const record = row as Record<string, unknown>;
    return keys.map((col) => csvEscape(record[col])).join(',');
  })].join('\n') + '\n';
}

function numericValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const text = String(value ?? '').trim();
  return text && /^-?\d+(?:\.\d+)?$/.test(text) ? text : undefined;
}

function integerValue(value: unknown) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : undefined;
  const text = String(value ?? '').trim();
  return text && /^-?\d+$/.test(text) ? text : undefined;
}

function persistentValue(value: unknown) {
  if (value === true || value === 1) return true;
  if (typeof value === 'string' && ['true', '1'].includes(value.trim().toLowerCase())) return true;
  return false;
}

function effectMetadata(
  row: SyncPayload['appearanceAbilityEffects'][number],
) {
  return {
    ...(row.valueMetadata ?? {}),
    ...(row.duration != null && numericValue(row.duration) == null ? { rawDuration: row.duration } : {}),
    ...(row.tick != null && numericValue(row.tick) == null ? { rawTick: row.tick } : {}),
    ...(row.persistent != null && typeof row.persistent !== 'boolean'
      ? { rawPersistent: row.persistent }
      : {}),
  };
}

export async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'MFF Data Hub personal sync/0.3 (+https://openai.com/chatgpt)',
    },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return { url, html: await res.text() };
}

export async function writeOutputs(payload: SyncPayload) {
  await mkdir(path.dirname(OUT_JSON_PACKAGE), { recursive: true });
  await mkdir(OUT_IMPORTS, { recursive: true });

  await writeFile(OUT_JSON_PACKAGE, JSON.stringify(payload, null, 2), 'utf8');

  await writeFile(
    path.join(OUT_IMPORTS, 'characters.csv'),
    toCsv(
      payload.characters.map((row) => ({
        id: row.id,
        name: row.name,
        portrait_url: row.portraitUrl,
        portrait_local_url: row.localPortraitUrl,
        combat_type: row.combatType,
        side: row.side,
        gender: row.gender,
        species: row.species,
        tags: row.tags,
        source: row.source,
        source_url: row.sourceUrl,
      })),
      ['id', 'name', 'portrait_url', 'portrait_local_url', 'combat_type', 'side', 'gender', 'species', 'tags', 'source', 'source_url'],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'uniforms.csv'),
    toCsv(
      payload.uniforms.map((row) => ({
        character_id: row.characterId,
        name: row.name,
        acquisition: row.acquisition,
        season: row.season,
        cost: row.cost,
        release_update: row.releaseUpdate,
        release_date: row.releaseDate,
        image_url: row.imageUrl,
        image_local_url: row.localImageUrl,
        source_url: row.sourceUrl,
      })),
      ['character_id', 'name', 'acquisition', 'season', 'cost', 'release_update', 'release_date', 'image_url', 'image_local_url', 'source_url'],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'artifacts.csv'),
    toCsv(
      payload.artifacts.map((row) => ({
        character_id: row.characterId,
        name: row.name,
        exclusive_skill: row.exclusiveSkill,
        pve_score: row.pveScore,
        pvp_score: row.pvpScore,
        effects: JSON.stringify(row.effects),
        acquisition: row.acquisition,
        release_update: row.releaseUpdate,
        image_url: row.imageUrl,
        image_local_url: row.localImageUrl,
        source_url: row.sourceUrl,
      })),
      ['character_id', 'name', 'exclusive_skill', 'pve_score', 'pvp_score', 'effects', 'acquisition', 'release_update', 'image_url', 'image_local_url', 'source_url'],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'comic_cards.csv'),
    toCsv(
      payload.comicCards.map((row) => ({
        id: row.id,
        name: row.name,
        card_type: row.cardType,
        fixed_stats: row.fixedStats,
        option_stats: JSON.stringify(row.optionStats),
        image_url: row.imageUrl,
        image_local_url: row.localImageUrl,
        source_url: row.sourceUrl,
      })),
      ['id', 'name', 'card_type', 'fixed_stats', 'option_stats', 'image_url', 'image_local_url', 'source_url'],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'alliance_battle_conditions.csv'),
    toCsv(
      payload.allianceBattleConditions.map((row) => ({
        id: row.id,
        rotation_id: 'mff-11-8-abxl-28-round',
        round_no: row.roundNo,
        mode: row.mode,
        content: row.content,
        is_reset_day: row.isResetDay,
        restrictions: row.restrictions,
        required_type: row.requiredType,
        required_alignment: row.requiredAlignment,
        required_gender: row.requiredGender,
        required_tags: row.requiredTags,
        cancel_effects: row.cancelEffects,
        source_url: row.sourceUrl,
        note: row.note,
      })),
      [
        'id',
        'rotation_id',
        'round_no',
        'mode',
        'content',
        'is_reset_day',
        'restrictions',
        'required_type',
        'required_alignment',
        'required_gender',
        'required_tags',
        'cancel_effects',
        'source_url',
        'note',
      ],
    ),
    'utf8',
  );

  const appearanceSourceByPortrait = new Map(
    payload.appearanceAbilityCoverage.map((row) => [row.portraitId, row.sourceUrl]),
  );
  const appearancesByCharacter = new Map<string, typeof payload.attributes>();
  for (const row of payload.attributes) {
    if (!row.portraitId) continue;
    appearancesByCharacter.set(row.characterId, [...(appearancesByCharacter.get(row.characterId) ?? []), row]);
  }
  const characterAppearances = Array.from(appearancesByCharacter.values()).flatMap((rows) =>
    [...rows]
      .sort((left, right) => Number(right.baseCharacter) - Number(left.baseCharacter))
      .map((row, sortOrder) => ({
        id: row.portraitId,
        character_id: row.characterId,
        name: row.baseCharacter ? 'Default' : row.uniform || 'Default',
        is_default: row.baseCharacter,
        sort_order: sortOrder,
        image_url: row.portraitUrl,
        image_local_url: row.localPortraitUrl,
        combat_type: row.combatType,
        side: row.side,
        gender: row.gender,
        species: row.species,
        tags: row.tags,
        source_url: appearanceSourceByPortrait.get(row.portraitId ?? ''),
      })),
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'character_appearances.csv'),
    toCsv(characterAppearances, [
      'id',
      'character_id',
      'name',
      'is_default',
      'sort_order',
      'image_url',
      'image_local_url',
      'combat_type',
      'side',
      'gender',
      'species',
      'tags',
      'source_url',
    ]),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'appearance_abilities.csv'),
    toCsv(
      payload.appearanceAbilities.map((row) => ({
        id: row.id,
        appearance_id: row.portraitId,
        kind: row.kind,
        source_skill_type: row.sourceSkillType,
        source_skill_id: integerValue(row.skillId),
        name: row.skillName,
        cooldown: numericValue(row.cooldown),
        target: row.target,
        activation: row.activation,
        icon: row.icon,
        sort_order: row.sortOrder,
        source_url: row.sourceUrl,
        raw_data: JSON.stringify({
          character: row.character,
          characterId: row.characterId,
          uniform: row.uniform,
          baseCharacter: row.baseCharacter,
          sourceSkillId: row.skillId,
        }),
      })),
      [
        'id',
        'appearance_id',
        'kind',
        'source_skill_type',
        'source_skill_id',
        'name',
        'cooldown',
        'target',
        'activation',
        'icon',
        'sort_order',
        'source_url',
        'raw_data',
      ],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'appearance_ability_effects.csv'),
    toCsv(
      payload.appearanceAbilityEffects.map((row) => ({
        id: row.id,
        appearance_ability_id: row.appearanceAbilityId,
        stage_id: integerValue(row.stageId),
        stage_order: row.stageOrder + 1,
        effect_order: row.effectOrder + 1,
        source_effect_id: integerValue(row.effectId),
        ability_code: integerValue(row.abilityCode),
        effect_name: row.effectName,
        description: row.description,
        duration: numericValue(row.duration),
        tick: numericValue(row.tick),
        persistent: persistentValue(row.persistent),
        metadata: JSON.stringify(effectMetadata(row)),
      })),
      [
        'id',
        'appearance_ability_id',
        'stage_id',
        'stage_order',
        'effect_order',
        'source_effect_id',
        'ability_code',
        'effect_name',
        'description',
        'duration',
        'tick',
        'persistent',
        'metadata',
      ],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'appearance_ability_coverage.csv'),
    toCsv(
      payload.appearanceAbilityCoverage.map((row) => ({
        appearance_id: row.portraitId,
        kind: row.kind,
        status: row.status,
        source_url: row.sourceUrl,
        note: row.reason,
        reviewed_at: payload.syncedAt,
      })),
      ['appearance_id', 'kind', 'status', 'source_url', 'note', 'reviewed_at'],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'supports.csv'),
    toCsv(
      payload.supports.map((row) => ({
        character_id: row.characterId,
        character: row.character,
        uniform: row.uniform,
        leadership: row.leadership.join(' | '),
        passive: row.passive.join(' | '),
        uniform_effect: row.uniformEffect.join(' | '),
        artifact_exclusive_skill: row.artifactExclusiveSkill.join(' | '),
        source_url: row.sourceUrl,
      })),
      ['character_id', 'character', 'uniform', 'leadership', 'passive', 'uniform_effect', 'artifact_exclusive_skill', 'source_url'],
    ),
    'utf8',
  );

  await writeFile(
    path.join(OUT_IMPORTS, 'character_effects.csv'),
    toCsv(
      dedupeBy(
        payload.characterEffects,
        (row) => [
          row.characterId,
          row.portraitId,
          row.uniform,
          row.sourceKind,
          row.effectName,
          row.magnitudeText,
          row.restrictionText,
          row.rawText,
        ].join('|'),
      ).map((row) => ({
        character_id: row.characterId,
        portrait_id: row.portraitId,
        uniform: row.uniform,
        source_kind: row.sourceKind,
        effect_name: row.effectName,
        magnitude: row.magnitude,
        magnitude_text: row.magnitudeText,
        restriction_text: row.restrictionText,
        raw_text: row.rawText,
        source_url: row.sourceUrl,
      })),
      [
        'character_id',
        'portrait_id',
        'uniform',
        'source_kind',
        'effect_name',
        'magnitude',
        'magnitude_text',
        'restriction_text',
        'raw_text',
        'source_url',
      ],
    ),
    'utf8',
  );
}
