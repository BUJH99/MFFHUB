import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT_JSON = path.join(ROOT, 'packages/data/generated/worldboss.json');
const SOURCE_URL = 'https://thanosvibs.money/worldboss';
const ATTRIBUTES_URL = 'https://thanosvibs.money/attributes_popup';
const ORIGIN = 'https://thanosvibs.money';
const LEGEND_BOSSES = [
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
];

const fullUrl = (src?: string) => (src ? new URL(src, `${ORIGIN}/`).toString() : '');
const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleize = (value: string) => value.replace(/\b\w/g, (match) => match.toUpperCase());

type CandidatePoolItem = {
  name: string;
  portraitUrl: string;
  classes: string[];
  rank: number;
};

async function fetchText(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function candidateMatches(candidate: CandidatePoolItem, filters: string[]) {
  return filters.every((filter) => candidate.classes.includes(filter.replace(/^\./, '')));
}

function buildCandidatePool(html: string) {
  const $ = cheerio.load(html);
  return $('img[class*=popup-attr]')
    .map((_, element) => {
      const image = $(element);
      const rawName = image.attr('char') ?? '';
      return {
        name: titleize(rawName),
        portraitUrl: fullUrl(image.attr('data-src') ?? image.attr('src')),
        classes: (image.attr('class') ?? '').split(/\s+/).filter(Boolean),
        rank: Number(image.attr('data-rank') ?? 0),
      } satisfies CandidatePoolItem;
    })
    .get()
    .filter((candidate) => candidate.name && candidate.portraitUrl);
}

function pickCandidates(pool: CandidatePoolItem[], filters: string[]) {
  return pool
    .filter((candidate) => candidateMatches(candidate, filters))
    .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map(({ name, portraitUrl }) => ({ name, portraitUrl }));
}

async function main() {
  const [worldBossHtml, attributesHtml] = await Promise.all([fetchText(SOURCE_URL), fetchText(ATTRIBUTES_URL)]);
  const $ = cheerio.load(worldBossHtml);
  const candidatePool = buildCandidatePool(attributesHtml);

  const bosses = LEGEND_BOSSES.map((name) => {
    const heading = $('h3').filter((_, element) => $(element).text().trim() === name).first();
    const listItem = heading.parents('li').first();
    const mode = (heading.parents('ul').first().attr('class') ?? '').includes('legendplus') ? 'Legend+' : 'Legend';

    const unlocks = listItem.find('div[id$=reqs] table tbody tr').map((_, row) => {
      const cells = $(row).find('td');
      return {
        stage: Number($(cells[0]).text().trim()),
        character: $(cells[2]).text().trim(),
        portraitUrl: fullUrl($(cells[1]).find('img').attr('data-src') ?? $(cells[1]).find('img').attr('src')),
      };
    }).get();

    const stages = listItem.find('div[id$=res] table tbody tr').map((_, row) => {
      const cells = $(row).find('td');
      const filters = ($(row).find('a').attr('filter') ?? '').split(',').map((item) => item.trim()).filter(Boolean);
      const restrictions = $(row).find('td').slice(1, 6).find('img').map((__, image) => {
        const label = $(image).attr('data-tooltip') ?? '';
        return label && label !== 'No Restrictions'
          ? { label, iconUrl: fullUrl($(image).attr('src')) }
          : undefined;
      }).get().filter(Boolean);
      const matching = filters.length
        ? candidatePool.filter((candidate) => candidateMatches(candidate, filters))
        : candidatePool;

      return {
        range: $(cells[0]).text().trim(),
        restrictions,
        candidateCount: matching.length,
        candidates: pickCandidates(candidatePool, filters),
      };
    }).get();

    return {
      id: slugify(name),
      name,
      mode,
      portraitUrl: fullUrl(listItem.find('.card-title img').first().attr('data-src')),
      bannerUrl: fullUrl(listItem.find('.card-image > img').first().attr('data-src')),
      unlocks,
      stages,
    };
  });

  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, `${JSON.stringify({ syncedAt: new Date().toISOString(), sourceUrl: SOURCE_URL, bosses }, null, 2)}\n`);
  console.log(`Wrote ${bosses.length} world bosses to ${OUT_JSON}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
