import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AnyNode } from 'domhandler';
import { BASE_URL, OUT_DEBUG, pages } from './thanosvibs/config';
import { cacheAssets, dedupeBy, fetchPage, writeOutputs } from './thanosvibs/output';
import type {
  AttributeRow,
  CombatType,
  Side,
  SyncedAllianceBattleCondition,
  SyncedArtifact,
  SyncedCharacter,
  SyncedComicCard,
  SyncedEffect,
  SyncedSupport,
  SyncedUniform,
  SyncPayload,
} from './thanosvibs/types';

const supportSectionLabels = [
  'Leadership',
  'Leadership (Secondary Effect)',
  'Tier-2 Passive',
  'Tier-3 Passive',
  'Tier-4 Passive',
  '4★ Passive',
  'Uniform Effect',
  'Uniform Effect (Secondary)',
  'Artifact Exclusive Skill',
];

const clean = (value: unknown) =>
  String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const titleCase = (value: string) =>
  clean(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').trim();

const normalizeName = (name: string) =>
  clean(name)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const portraitUrl = (nameOrPortraitId: string) =>
  `${BASE_URL}/static/assets/portraits/${slugify(nameOrPortraitId)}.png`;

function parsePortraitId(value?: string) {
  const src = clean(value);
  return src ? path.posix.basename(src, path.posix.extname(src)) : undefined;
}

function parseHxPortrait(value?: string) {
  const raw = clean(value)
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"');
  return raw.match(/"portrait"\s*:\s*"([^"]+)"/)?.[1];
}

function urlFromPath(src?: string) {
  if (!src) return undefined;
  if (/^https?:\/\//.test(src)) return src;
  return `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

function valuesForLabel($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>, label: string) {
  const values: string[] = [];
  root
    .find('h6')
    .filter((_, el) => clean($(el).text()).toLowerCase() === label.toLowerCase())
    .each((_, el) => {
      const parent = $(el).parent();
      if (parent.children('h6').length <= 1) {
        const parentValues = parent
          .children('h5')
          .map((__, h5) => clean($(h5).text()))
          .get()
          .filter(Boolean);
        if (parentValues.length) {
          values.push(...parentValues);
          return;
        }
      }

      let next = $(el).next();
      while (next.length && clean(next.prop('tagName')).toLowerCase() !== 'h6') {
        if (clean(next.prop('tagName')).toLowerCase() === 'h5') values.push(clean(next.text()));
        next = next.next();
      }
    });
  return values;
}

function valueForLabel($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>, label: string) {
  return valuesForLabel($, root, label)[0];
}

function mergeStringList(...lists: Array<Array<string | undefined>>) {
  return Array.from(new Set(lists.flat().map((item) => clean(item)).filter(Boolean)));
}

function inferSeason(acquisition?: string) {
  const text = clean(acquisition);
  if (/Summer/i.test(text)) return 'Summer';
  if (/Halloween/i.test(text)) return 'Halloween';
  if (/Christmas/i.test(text)) return 'Christmas';
  if (/April Fools/i.test(text)) return "April Fool's";
  if (/Seasonal/i.test(text)) return 'Seasonal';
  return undefined;
}

function inferCost(acquisition?: string) {
  const text = clean(acquisition);
  const crystal = text.match(/\d{3,4}\s*Crystals/i)?.[0];
  if (crystal) return clean(crystal);
  if (/Paywall/i.test(text)) return 'Paywall';
  if (/Gold/i.test(text)) return text.match(/\d[\d,]*\s*Gold/i)?.[0]?.replace(/,/g, '') ?? 'Gold';
  if (/Free/i.test(text)) return 'Free';
  if (/Unavailable/i.test(text)) return 'Unavailable';
  return undefined;
}

function scoreForLabel($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>, label: string) {
  const header = root
    .find('h6')
    .filter((_, el) => clean($(el).text()).toLowerCase() === label.toLowerCase())
    .first();
  const tooltip = clean(header.closest('.tooltipped').attr('data-tooltip'));
  if (tooltip) return tooltip;

  const cardClass = clean(root.attr('class'));
  const key = label.toLowerCase().includes('pve') ? 'pve' : 'pvp';
  const match = cardClass.match(new RegExp(`${key}_(low|medium|high)`, 'i'));
  return match ? titleCase(match[1]) : undefined;
}

function tableRows($: cheerio.CheerioAPI, table: cheerio.Cheerio<AnyNode>) {
  const rows: string[][] = [];
  table.find('tbody tr').each((_, row) => {
    const cells = $(row)
      .children('td')
      .map((__, cell) => clean($(cell).text()))
      .get()
      .filter(Boolean);
    if (cells.length) rows.push(cells);
  });
  return rows;
}

function parseMagnitude(text?: string) {
  const match = clean(text).match(/-?\d+(?:\.\d+)?(?=%)?/);
  return match ? Number(match[0]) : undefined;
}

function parseUniforms(html: string, sourceUrl: string): SyncedUniform[] {
  const $ = cheerio.load(html);
  const result: SyncedUniform[] = [];

  $('div.card').each((_, element) => {
    const card = $(element);
    const character = valueForLabel($, card, 'Character');
    const name = valueForLabel($, card, 'Uniform');
    const acquisition = valueForLabel($, card, 'Acquisition');
    if (!character || !name || !acquisition) return;

    const releaseValues = valuesForLabel($, card, 'Release');
    const imageSrc = card.find('img[data-src*="portraits_128"]').first().attr('data-src');
    const portraitId = parsePortraitId(imageSrc);
    const imageUrl = urlFromPath(imageSrc);

    result.push({
      character,
      characterId: slugify(character),
      name,
      acquisition,
      season: inferSeason(acquisition),
      cost: inferCost(acquisition),
      releaseUpdate: releaseValues.find((value) => /^Update\s+/i.test(value)) ?? releaseValues[0],
      releaseDate: releaseValues.find((value) => /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(value)),
      portraitId,
      portraitUrl: imageUrl,
      imageUrl,
      sourceUrl,
    });
  });

  return dedupeBy(result, (row) => `${row.characterId}|${slugify(row.name)}`).sort((a, b) =>
    a.character.localeCompare(b.character) || a.name.localeCompare(b.name),
  );
}

function parseArtifactEffects($: cheerio.CheerioAPI, card: cheerio.Cheerio<AnyNode>) {
  const effects: string[] = [];

  card.find('.card-content.grey.lighten-4 > div[id]').each((_, panel) => {
    const id = clean($(panel).attr('id'));
    if (id.endsWith('_info')) return;
    const star = id.match(/_(\d)$/)?.[1];
    const prefix = star ? `${star}★` : 'effect';

    $(panel)
      .find('li')
      .each((__, item) => {
        const text = clean($(item).text());
        if (text) effects.push(`${prefix}: ${text}`);
      });

    $(panel)
      .find('tbody tr')
      .each((__, row) => {
        const cells = $(row)
          .children('td')
          .map((___, cell) => clean($(cell).text()))
          .get()
          .filter(Boolean);
        if (cells.length) effects.push(`${prefix}: ${cells.join(' | ')}`);
      });
  });

  return Array.from(new Set(effects));
}

function parseArtifacts(html: string, sourceUrl: string): SyncedArtifact[] {
  const $ = cheerio.load(html);
  const result: SyncedArtifact[] = [];

  $('div.card').each((_, element) => {
    const card = $(element);
    const character = valueForLabel($, card, 'Character');
    const name = valueForLabel($, card, 'Artifact Name');
    if (!character || !name) return;

    const image = card.find('img[data-src*="/static/assets/items/"]').first();
    const popupPortrait = parseHxPortrait(image.attr('hx-vals'));
    const sourceImageUrl = urlFromPath(image.attr('data-src'));
    const popupImageUrl = popupPortrait ? `${BASE_URL}/static/assets/items/artifact_${slugify(popupPortrait)}.png` : undefined;
    const imageUrl = sourceImageUrl?.includes('artifact_silversurfershallabal.png') ? popupImageUrl ?? sourceImageUrl : sourceImageUrl;
    const acquisitionValues = valuesForLabel($, card, 'ACQUISITION');
    result.push({
      character,
      characterId: slugify(character),
      name,
      exclusiveSkill: valueForLabel($, card, 'Exclusive Skill'),
      pveScore: scoreForLabel($, card, 'PvE Score'),
      pvpScore: scoreForLabel($, card, 'PvP Score'),
      effects: parseArtifactEffects($, card),
      acquisition: acquisitionValues.join(' | ') || undefined,
      releaseUpdate: valueForLabel($, card, 'RELEASE'),
      imageUrl,
      sourceUrl,
    });
  });

  return dedupeBy(result, (row) => row.characterId).sort((a, b) => a.character.localeCompare(b.character));
}

function cellList($: cheerio.CheerioAPI, cell: cheerio.Cheerio<AnyNode>) {
  const html = cell.html() ?? '';
  return html
    .split(/<br\s*\/?>/i)
    .map((part) => clean(cheerio.load(part).text()))
    .filter(Boolean);
}

function parseComicCards(html: string, sourceUrl: string): SyncedComicCard[] {
  const $ = cheerio.load(html);
  const result: SyncedComicCard[] = [];

  $('.modal .modal-content').each((_, element) => {
    const root = $(element);
    const name = clean(root.children('h3').first().text());
    if (!name) return;

    const fixedStats: string[] = [];
    const optionStats: Record<string, string[]> = {};
    let cardType: string | undefined;

    root.find('table tbody tr').each((__, row) => {
      const cells = $(row).children('td');
      if (cells.length < 2) return;
      const label = clean(cells.eq(0).text());
      const values = cellList($, cells.eq(1));
      if (!values.length) return;

      if (label === 'Type') cardType = values.join(' ');
      else if (/^Stat [1-3]$/.test(label)) fixedStats.push(...values);
      else if (/^Stat [4-6]$/.test(label)) optionStats[label.toLowerCase().replace(/\s+/g, '')] = values;
    });

    const imageUrl = urlFromPath(root.find('img.bigcard[data-src*="/static/cards/"], img[data-src*="/static/cards/"]').first().attr('data-src'));
    if (!cardType || !fixedStats.length) return;

    result.push({
      id: slugify(name),
      name,
      cardType,
      fixedStats,
      optionStats,
      imageUrl,
      sourceUrl,
    });
  });

  return dedupeBy(result, (row) => row.id).sort((a, b) => a.name.localeCompare(b.name));
}

function contentForAllianceBattleMode(mode: SyncedAllianceBattleCondition['mode']): SyncedAllianceBattleCondition['content'] {
  if (mode === 'Extreme') return 'ABX';
  if (mode === 'Legend') return 'ABL';
  if (mode === 'Infinite Challenge') return 'Infinity Challenge';
  return 'AB';
}

function parseRequiredAllianceBattleFields(restrictions: string[]) {
  const active = restrictions.includes('No Restrictions') ? [] : restrictions;
  return {
    requiredType: active.find((item) => ['Combat', 'Blast', 'Speed', 'Universal'].includes(item)),
    requiredAlignment: active.find((item) => ['Hero', 'Villain', 'Neutral'].includes(item)),
    requiredGender: active.find((item) => ['Male', 'Female', 'Other'].includes(item)),
    requiredTags: active
      .filter((item) => !['Combat', 'Blast', 'Speed', 'Universal', 'Hero', 'Villain', 'Neutral', 'Male', 'Female', 'Other'].includes(item))
      .map((item) => item.toLowerCase().replace(/\s+/g, '-')),
  };
}

function parseAllianceBattleConditions(html: string, sourceUrl: string): SyncedAllianceBattleCondition[] {
  const $ = cheerio.load(html);
  const result: SyncedAllianceBattleCondition[] = [];

  $('.abxl-round-card').each((index, element) => {
    const card = $(element);
    const roundNo = Number(clean(card.children('h6.center-align').first().text()).match(/\d+/)?.[0] ?? index + 1);
    const isResetDay = card
      .children('h6.center-align')
      .map((_, heading) => clean($(heading).text()))
      .get()
      .some((text) => /reset day/i.test(text));

    card.find('div.abxl-mode-div').each((_, modeElement) => {
      const mode = clean($(modeElement).children('h6').first().text()) as SyncedAllianceBattleCondition['mode'];
      if (!['Normal', 'Extreme', 'Legend', 'Infinite Challenge'].includes(mode)) return;
      const restrictions =
        $(modeElement)
          .children('p.abxl-restrictions-parent')
          .first()
          .find('img.restriction')
          .map((__, img) => clean($(img).attr('data-tooltip')))
          .get()
          .filter(Boolean) || [];
      const cancelEffects = Array.from(
        new Set(
          $(modeElement)
            .children('div.abxl-team')
            .first()
            .find('img.abxl-cancel')
            .map((__, img) => clean($(img).attr('src')).match(/buff_([a-z]+)/)?.[1])
            .get()
            .filter(Boolean),
        ),
      );
      const content = contentForAllianceBattleMode(mode);
      const required = parseRequiredAllianceBattleFields(restrictions);
      result.push({
        id: `mff-abxl-r${String(roundNo).padStart(2, '0')}-${slugify(content)}`,
        roundNo,
        mode,
        content,
        isResetDay,
        restrictions: restrictions.length ? restrictions : ['No Restrictions'],
        ...required,
        cancelEffects,
        sourceUrl,
        note: restrictions.length ? restrictions.join(' + ') : 'No Restrictions',
      });
    });
  });

  return dedupeBy(result, (row) => row.id).sort((a, b) => a.roundNo - b.roundNo || a.mode.localeCompare(b.mode));
}

function normalizeSourceKind(section: string) {
  if (section === '4★ Passive') return '4★ Passive';
  if (section.startsWith('Leadership')) return 'Leadership';
  if (section.startsWith('Uniform Effect')) return 'Uniform Effect';
  return section;
}

function restrictionText($: cheerio.CheerioAPI, segment: cheerio.Cheerio<AnyNode>) {
  const restrictions = segment
    .find('[data-tooltip]')
    .map((_, el) =>
      clean(
        $(el)
          .attr('data-tooltip')
          ?.replace(/<[^>]+>/g, ' ')
          .replace(/\.$/, ''),
      ),
    )
    .get()
    .filter(Boolean);
  return restrictions.join(' | ') || undefined;
}

function parseSupportCards(html: string, sourceUrl: string) {
  const $ = cheerio.load(html);
  const effects: SyncedEffect[] = [];
  const supportMap = new Map<string, SyncedSupport>();

  $('div.card.has-table').each((_, element) => {
    const card = $(element);
    const names = card
      .children('.flex-container')
      .first()
      .find('h5')
      .map((__, h5) => clean($(h5).text()))
      .get()
      .filter(Boolean);
    const [character, uniform = 'Modern'] = names;
    if (!character) return;

    const characterId = slugify(character);
    const supportKey = `${characterId}|${slugify(uniform)}`;
    const support = supportMap.get(supportKey) ?? {
      character,
      characterId,
      uniform,
      leadership: [],
      passive: [],
      uniformEffect: [],
      artifactExclusiveSkill: [],
      sourceUrl,
    };

    card
      .children('h6')
      .filter((__, h6) => supportSectionLabels.includes(clean($(h6).text())))
      .each((__, h6) => {
        const section = clean($(h6).text());
        const sourceKind = normalizeSourceKind(section);
        const segment = $(h6).nextUntil('h6');
        const restriction = restrictionText($, segment);

        segment
          .filter('table')
          .add(segment.find('table'))
          .each((___, table) => {
          for (const row of tableRows($, $(table))) {
            if (row.length < 2) continue;
            const [effectName, magnitudeText, ...rest] = row;
            const rawText = [effectName, magnitudeText, ...rest].filter(Boolean).join(' | ');
            const syncedEffect: SyncedEffect = {
              character,
              characterId,
              uniform,
              sourceKind,
              effectName,
              magnitude: parseMagnitude(magnitudeText),
              magnitudeText,
              restrictionText: restriction,
              rawText,
              sourceUrl,
            };
            effects.push(syncedEffect);

            const aggregate = [effectName, magnitudeText, ...rest].filter(Boolean).join(' ');
            if (sourceKind === 'Leadership') support.leadership.push(aggregate);
            else if (sourceKind === 'Uniform Effect') support.uniformEffect.push(aggregate);
            else if (sourceKind === 'Artifact Exclusive Skill') support.artifactExclusiveSkill.push(aggregate);
            else support.passive.push(aggregate);
          }
        });
      });

    support.leadership = mergeStringList(support.leadership);
    support.passive = mergeStringList(support.passive);
    support.uniformEffect = mergeStringList(support.uniformEffect);
    support.artifactExclusiveSkill = mergeStringList(support.artifactExclusiveSkill);
    if (
      support.leadership.length ||
      support.passive.length ||
      support.uniformEffect.length ||
      support.artifactExclusiveSkill.length
    ) {
      supportMap.set(supportKey, support);
    }
  });

  return {
    effects: dedupeBy(effects, (row) =>
      [row.characterId, slugify(row.uniform ?? 'modern'), row.sourceKind, row.effectName, row.magnitudeText, row.rawText].join('|'),
    ).sort((a, b) => a.character.localeCompare(b.character) || clean(a.uniform).localeCompare(clean(b.uniform))),
    supports: Array.from(supportMap.values()).sort(
      (a, b) => a.character.localeCompare(b.character) || clean(a.uniform).localeCompare(clean(b.uniform)),
    ),
  };
}

function readClassToken(classes: string, prefix: string) {
  return classes
    .split(/\s+/)
    .find((token) => token.startsWith(prefix))
    ?.slice(prefix.length);
}

function mapCombatType(value?: string): CombatType {
  if (value === 'combat') return 'Combat';
  if (value === 'blast') return 'Blast';
  if (value === 'speed') return 'Speed';
  if (value === 'universal') return 'Universal';
  return 'Unknown';
}

function mapSide(value?: string): Side {
  if (value === 'hero') return 'Hero';
  if (value === 'villain') return 'Villain';
  if (value === 'neutral') return 'Neutral';
  return 'Unknown';
}

function matchKnownCharacter(raw: string, knownNames: string[]) {
  const normalized = normalizeName(raw);
  return knownNames
    .map((name) => ({ name, normalized: normalizeName(name) }))
    .filter((item) => normalized === item.normalized || normalized.startsWith(`${item.normalized} `))
    .sort((a, b) => b.normalized.length - a.normalized.length)[0]?.name;
}

function parseAttributes(html: string, sourceUrl: string, knownNames: string[]): AttributeRow[] {
  const $ = cheerio.load(html);
  const result: AttributeRow[] = [];

  $('img.mix[data-src*="portraits_128"]').each((_, element) => {
    const img = $(element);
    const rawChar = clean(img.attr('char'));
    const character = matchKnownCharacter(rawChar, knownNames);
    if (!character) return;

    const classes = clean(img.attr('class'));
    const classTokens = classes.split(/\s+/).filter(Boolean);
    const portraitId = parsePortraitId(img.attr('data-src'));
    const abilityTags = classTokens
      .filter((token) => token.startsWith('attr-ability-'))
      .map((token) => titleCase(token.slice('attr-ability-'.length)));
    const elementTags = classTokens
      .filter((token) => token.startsWith('attr-element-'))
      .map((token) => titleCase(token.slice('attr-element-'.length)));

    result.push({
      character,
      characterId: slugify(character),
      uniform: normalizeName(rawChar).slice(normalizeName(character).length).trim() || undefined,
      portraitId,
      portraitUrl: urlFromPath(img.attr('data-src')),
      combatType: mapCombatType(readClassToken(classes, 'attr-type-')),
      side: mapSide(readClassToken(classes, 'attr-side-')),
      gender: titleCase(readClassToken(classes, 'attr-gender-') ?? ''),
      species: titleCase(readClassToken(classes, 'attr-allies-') ?? ''),
      tags: mergeStringList(
        abilityTags,
        elementTags,
        [
          readClassToken(classes, 'attr-instinct-') && `Instinct:${titleCase(readClassToken(classes, 'attr-instinct-') ?? '')}`,
          readClassToken(classes, 'attr-source-') && `Source:${titleCase(readClassToken(classes, 'attr-source-') ?? '')}`,
          classes.includes('attr-tier-4-true') ? 'Tier-4' : undefined,
          classes.includes('attr-skill-6-tier-3') ? 'Tier-3' : undefined,
          classes.includes('attr-skill-6-transcended') ? 'Transcended' : undefined,
        ],
      ),
      latestUniform: classes.includes('attr-latest-uniform-true'),
      baseCharacter: classes.includes('attr-uniformed-false'),
    });
  });

  return dedupeBy(result, (row) => `${row.characterId}|${row.portraitId ?? clean(row.uniform)}`).sort((a, b) =>
    a.character.localeCompare(b.character),
  );
}

function buildCharacters(
  uniforms: SyncedUniform[],
  artifacts: SyncedArtifact[],
  supports: SyncedSupport[],
  attributes: AttributeRow[],
): SyncedCharacter[] {
  const names = mergeStringList(
    uniforms.map((row) => row.character),
    artifacts.map((row) => row.character),
    supports.map((row) => row.character),
    attributes.map((row) => row.character),
  ).sort((a, b) => a.localeCompare(b));

  return names.map((name) => {
    const id = slugify(name);
    const characterAttributes = attributes.filter((row) => row.characterId === id);
    const preferred =
      characterAttributes.find((row) => row.latestUniform) ??
      characterAttributes.find((row) => row.baseCharacter) ??
      characterAttributes[0];
    const uniformPortrait = uniforms.find((row) => row.characterId === id && row.portraitId);

    return {
      id,
      name,
      portraitUrl:
        preferred?.portraitUrl ?? uniformPortrait?.portraitUrl ?? portraitUrl(name),
      combatType: preferred?.combatType ?? 'Unknown',
      side: preferred?.side ?? 'Unknown',
      gender: preferred?.gender || undefined,
      species: preferred?.species || undefined,
      tags: mergeStringList(
        preferred?.tags ?? [],
        characterAttributes.flatMap((row) => row.tags),
        supports.some((row) => row.characterId === id) ? ['lead-support-data'] : [],
        artifacts.some((row) => row.characterId === id) ? ['artifact-data'] : [],
        uniforms.some((row) => row.characterId === id) ? ['uniform-data'] : [],
      ),
      source: 'thanosvibs',
      sourceUrl: BASE_URL,
    };
  });
}

async function main() {
  console.log('Fetching THANO$VIB$ pages...');
  await mkdir(OUT_DEBUG, { recursive: true });

  const [uniformPage, artifactPage, cardPage, abxlPage, supportPage, attributePage] = await Promise.all([
    fetchPage(pages.uniforms),
    fetchPage(pages.artifacts),
    fetchPage(pages.cards),
    fetchPage(pages.abxl),
    fetchPage(pages.supports),
    fetchPage(pages.attributes),
  ]);

  await writeFile(path.join(OUT_DEBUG, 'uniforms.html'), uniformPage.html, 'utf8');
  await writeFile(path.join(OUT_DEBUG, 'artifacts.html'), artifactPage.html, 'utf8');
  await writeFile(path.join(OUT_DEBUG, 'cards.html'), cardPage.html, 'utf8');
  await writeFile(path.join(OUT_DEBUG, 'abxl.html'), abxlPage.html, 'utf8');
  await writeFile(path.join(OUT_DEBUG, 'supports.html'), supportPage.html, 'utf8');
  await writeFile(path.join(OUT_DEBUG, 'attributes.html'), attributePage.html, 'utf8');

  const uniforms = parseUniforms(uniformPage.html, uniformPage.url);
  const artifacts = parseArtifacts(artifactPage.html, artifactPage.url);
  const comicCards = parseComicCards(cardPage.html, cardPage.url);
  const allianceBattleConditions = parseAllianceBattleConditions(abxlPage.html, abxlPage.url);
  const { supports, effects } = parseSupportCards(supportPage.html, supportPage.url);
  const knownNames = mergeStringList(
    uniforms.map((row) => row.character),
    artifacts.map((row) => row.character),
    supports.map((row) => row.character),
  );
  const attributes = parseAttributes(attributePage.html, attributePage.url, knownNames);
  const characters = buildCharacters(uniforms, artifacts, supports, attributes);

  const warnings: string[] = [];
  if (characters.length === 0) warnings.push('characters parser returned 0 rows');
  if (uniforms.length === 0) warnings.push('uniforms parser returned 0 rows');
  if (artifacts.length === 0) warnings.push('artifacts parser returned 0 rows');
  if (comicCards.length === 0) warnings.push('comic cards parser returned 0 rows');
  if (allianceBattleConditions.length === 0) warnings.push('alliance battle parser returned 0 rows');
  if (supports.length === 0) warnings.push('supports parser returned 0 rows');
  if (effects.length === 0) warnings.push('character effects parser returned 0 rows');
  if (attributes.length === 0) warnings.push('attributes parser returned 0 rows');

  const payload: SyncPayload = {
    syncedAt: new Date().toISOString(),
    source: BASE_URL,
    pages,
    characters,
    uniforms,
    artifacts,
    comicCards,
    allianceBattleConditions,
    supports,
    characterEffects: effects,
    attributes,
    warnings,
  };

  await cacheAssets(payload);
  await writeOutputs(payload);

  console.log('Done:', {
    characters: characters.length,
    uniforms: uniforms.length,
    artifacts: artifacts.length,
    comicCards: comicCards.length,
    allianceBattleConditions: allianceBattleConditions.length,
    supports: supports.length,
    characterEffects: effects.length,
    attributes: attributes.length,
    assets: payload.assetStats,
  });
  if (warnings.length) console.warn('Warnings:', warnings.join(' / '));
  console.log('Wrote packages/data/generated/thanosvibs.json and supabase/imports/*.csv');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
