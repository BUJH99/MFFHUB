import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { OUT_IMPORTS, OUT_JSON_PACKAGE, PUBLIC_ASSET_ROOT, WEBP_QUALITY } from './config';
import type { SyncPayload } from './types';

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
        (row) => [row.characterId, row.sourceKind, row.effectName, row.magnitudeText, row.restrictionText, row.rawText].join('|'),
      ).map((row) => ({
        character_id: row.characterId,
        source_kind: row.sourceKind,
        effect_name: row.effectName,
        magnitude: row.magnitude,
        magnitude_text: row.magnitudeText,
        restriction_text: row.restrictionText,
        raw_text: row.rawText,
        source_url: row.sourceUrl,
      })),
      ['character_id', 'source_kind', 'effect_name', 'magnitude', 'magnitude_text', 'restriction_text', 'raw_text', 'source_url'],
    ),
    'utf8',
  );
}
