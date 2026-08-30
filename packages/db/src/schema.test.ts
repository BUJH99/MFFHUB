import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const drizzleSchema = readFileSync(new URL('./schema.ts', import.meta.url), 'utf8');
const supabaseSchema = readFileSync(new URL('../../../supabase/schema.sql', import.meta.url), 'utf8');
const appearanceMigration = readFileSync(
  new URL('../../../supabase/migrations/202608300001_normalize_appearance_abilities.sql', import.meta.url),
  'utf8',
);
const appearanceImport = readFileSync(
  new URL('../../../supabase/imports/import_appearance_catalog.psql', import.meta.url),
  'utf8',
);
const appearanceImportWrapper = readFileSync(
  new URL('../../../scripts/import-appearance-catalog.ps1', import.meta.url),
  'utf8',
);

function uniqueMatches(source: string, pattern: RegExp) {
  return Array.from(new Set(Array.from(source.matchAll(pattern), (match) => match[1]))).sort();
}

function readCsvRecords(path: URL) {
  const source = readFileSync(path, 'utf8');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  const [headers, ...values] = rows;
  return {
    headers,
    records: values.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))),
  };
}

describe('database schema sources', () => {
  it('keeps the Supabase SQL snapshot aligned with the Drizzle table list', () => {
    expect(uniqueMatches(supabaseSchema, /create table if not exists public\.([a-z_]+)/gi)).toEqual(
      uniqueMatches(drizzleSchema, /pgTable\('([^']+)'/g),
    );
  });

  it('keeps normalized appearance tables in Drizzle, the snapshot, and the migration', () => {
    const tables = [
      'character_appearances',
      'appearance_abilities',
      'appearance_ability_effects',
      'appearance_ability_coverage',
    ];

    for (const table of tables) {
      expect(drizzleSchema).toContain(`pgTable('${table}'`);
      expect(supabaseSchema).toMatch(new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
      expect(appearanceMigration).toMatch(new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
    }

    expect(supabaseSchema).toContain('create or replace view public.v_uniform_skill_matrix');
    expect(appearanceMigration).toContain('create or replace view public.v_uniform_skill_matrix');
    for (const column of ['leader', 'passive', 'uniform_effect', 'coverage']) {
      expect(supabaseSchema).toMatch(new RegExp(`as ${column}\\b`, 'i'));
      expect(appearanceMigration).toMatch(new RegExp(`as ${column}\\b`, 'i'));
    }
  });

  it('enforces appearance identity, ordering, kind, and coverage constraints', () => {
    const constraintNames = [
      'character_appearances_character_name_uniq',
      'character_appearances_sort_order_check',
      'appearance_abilities_kind_check',
      'appearance_abilities_cooldown_check',
      'appearance_abilities_sort_order_check',
      'appearance_abilities_appearance_source_type_uniq',
      'appearance_ability_effects_stage_order_check',
      'appearance_ability_effects_effect_order_check',
      'appearance_ability_effects_duration_check',
      'appearance_ability_effects_tick_check',
      'appearance_ability_effects_ability_order_uniq',
      'appearance_ability_coverage_kind_check',
      'appearance_ability_coverage_status_check',
    ];

    for (const constraint of constraintNames) {
      expect(drizzleSchema).toContain(constraint);
      expect(supabaseSchema).toContain(constraint);
      expect(appearanceMigration).toContain(constraint);
    }

    for (const sqlSchema of [supabaseSchema, appearanceMigration]) {
      expect(sqlSchema).toMatch(/where is_default = true/i);
      expect(sqlSchema).toMatch(/check \(stage_order > 0\)/i);
      expect(sqlSchema).toMatch(/check \(effect_order > 0\)/i);
      expect(sqlSchema).toContain("('complete','not_applicable','missing','needs_review')");
      expect(sqlSchema).toContain("('leader','passive','uniform_effect')");
    }
  });

  it('uses invoker-security views and exposes the new catalog as read-only', () => {
    for (const view of [
      'v_uniform_skill_matrix',
      'v_character_db_matrix',
      'v_account_spec_matrix',
      'v_alliance_battle_monthly_conditions',
    ]) {
      expect(supabaseSchema).toMatch(
        new RegExp(`create or replace view public\\.${view}\\s+with \\(security_invoker = true\\)`, 'i'),
      );
    }
    expect(appearanceMigration).toMatch(
      /create or replace view public\.v_uniform_skill_matrix\s+with \(security_invoker = true\)/i,
    );

    const tables = [
      'character_appearances',
      'appearance_abilities',
      'appearance_ability_effects',
      'appearance_ability_coverage',
    ];

    for (const sqlSchema of [supabaseSchema, appearanceMigration]) {
      for (const table of tables) {
        expect(sqlSchema).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
        const policies = Array.from(
          sqlSchema.matchAll(new RegExp(`create policy [^;]+ on public\\.${table}[^;]+;`, 'gi')),
          (match) => match[0],
        );
        expect(policies).toHaveLength(1);
        expect(policies[0]).toMatch(/for select to anon, authenticated using \(true\)/i);
      }
      expect(sqlSchema).toMatch(/revoke all privileges on table[\s\S]+?from anon, authenticated;/i);
      expect(sqlSchema).toMatch(/grant select on table[\s\S]+?to anon, authenticated;/i);
    }

    expect(supabaseSchema.lastIndexOf('revoke all privileges on table')).toBeGreaterThan(
      supabaseSchema.lastIndexOf('grant insert, update, delete on all tables'),
    );
  });

  it('keeps legacy character effects addressable by appearance', () => {
    expect(drizzleSchema).toContain("portraitId: text('portrait_id').references(() => characterAppearances.id");
    expect(drizzleSchema).toContain("uniform: text('uniform')");
    for (const sqlSchema of [supabaseSchema, appearanceMigration]) {
      expect(sqlSchema).toMatch(/add column if not exists portrait_id text references public\.character_appearances\(id\)/i);
      expect(sqlSchema).toMatch(/add column if not exists uniform text/i);
      expect(sqlSchema).toContain('character_effects_portrait_idx');
    }
  });

  it('imports a normalized snapshot parent-first with transactional upserts', () => {
    expect(appearanceImport).toContain('\\set ON_ERROR_STOP on');
    expect(appearanceImport).toContain('begin;');
    expect(appearanceImport).toContain('commit;');
    expect(appearanceImport).toContain('pg_advisory_xact_lock');

    const csvFiles = [
      'character_appearances.csv',
      'appearance_abilities.csv',
      'appearance_ability_effects.csv',
      'appearance_ability_coverage.csv',
    ];
    let previousCopy = -1;
    for (const csvFile of csvFiles) {
      const copyPosition = appearanceImport.indexOf(csvFile);
      expect(copyPosition).toBeGreaterThan(previousCopy);
      previousCopy = copyPosition;
    }

    const targets = [
      'public.character_appearances',
      'public.appearance_abilities',
      'public.appearance_ability_effects',
      'public.appearance_ability_coverage',
    ];
    let previousInsert = -1;
    for (const target of targets) {
      const insertPosition = appearanceImport.indexOf(`insert into ${target}`);
      expect(insertPosition).toBeGreaterThan(previousInsert);
      expect(appearanceImport.slice(insertPosition)).toMatch(/on conflict[\s\S]+?do update set/i);
      previousInsert = insertPosition;
    }

    expect(appearanceImport).toContain('missing public.characters row');
    expect(appearanceImport).toContain('ability rows reference an appearance outside this snapshot');
    expect(appearanceImport).toContain('effect rows reference an ability outside this snapshot');
    expect(appearanceImport).toContain('do not have all three coverage states');
    expect(appearanceImport).toContain('expected at least 882 rows');
    expect(appearanceImport).toContain("coverage.status in ('missing', 'needs_review')");
    expect(appearanceImport).toContain("coverage.kind = 'uniform_effect'");
    expect(appearanceImport).toContain("coverage.status <> 'not_applicable'");
    expect(appearanceImport).toContain("coverage.status <> 'complete'");
    expect(appearanceImport).toContain('complete/not_applicable appearance invariant');
  });

  it('makes stale cleanup explicit, guarded, and child-first', () => {
    expect(appearanceImport).toContain('\\if :prune_stale');
    expect(appearanceImport).toContain('below 80%% of existing');
    expect(appearanceImport).toContain('below 50%% of existing');

    const deleteTargets = [
      'public.appearance_ability_effects',
      'public.appearance_abilities',
      'public.appearance_ability_coverage',
      'public.character_appearances',
    ];
    let previousDelete = -1;
    for (const target of deleteTargets) {
      const deletePosition = appearanceImport.indexOf(`delete from ${target}`);
      expect(deletePosition).toBeGreaterThan(previousDelete);
      previousDelete = deletePosition;
    }

    expect(appearanceImportWrapper).toContain("DATABASE_URL is not set. No database changes were made.");
    expect(appearanceImportWrapper).toContain("Required catalog snapshot is missing:");
    expect(appearanceImportWrapper).toContain("psql was not found in PATH. No database changes were made.");
    expect(appearanceImportWrapper).toContain('--set "prune_stale=$pruneValue"');
  });

  it('keeps generated normalized CSVs complete and foreign-key safe', () => {
    const appearances = readCsvRecords(
      new URL('../../../supabase/imports/character_appearances.csv', import.meta.url),
    );
    const abilities = readCsvRecords(
      new URL('../../../supabase/imports/appearance_abilities.csv', import.meta.url),
    );
    const effects = readCsvRecords(
      new URL('../../../supabase/imports/appearance_ability_effects.csv', import.meta.url),
    );
    const coverage = readCsvRecords(
      new URL('../../../supabase/imports/appearance_ability_coverage.csv', import.meta.url),
    );

    expect(appearances.headers).toEqual([
      'id', 'character_id', 'name', 'is_default', 'sort_order', 'image_url', 'image_local_url',
      'combat_type', 'side', 'gender', 'species', 'tags', 'source_url',
    ]);
    expect(abilities.headers).toEqual([
      'id', 'appearance_id', 'kind', 'source_skill_type', 'source_skill_id', 'name', 'cooldown',
      'target', 'activation', 'icon', 'sort_order', 'source_url', 'raw_data',
    ]);
    expect(effects.headers).toEqual([
      'id', 'appearance_ability_id', 'stage_id', 'stage_order', 'effect_order', 'source_effect_id',
      'ability_code', 'effect_name', 'description', 'duration', 'tick', 'persistent', 'metadata',
    ]);
    expect(coverage.headers).toEqual([
      'appearance_id', 'kind', 'status', 'source_url', 'note', 'reviewed_at',
    ]);

    expect(appearances.records.length).toBeGreaterThanOrEqual(882);
    expect(coverage.records).toHaveLength(appearances.records.length * 3);

    const appearanceIds = new Set(appearances.records.map((row) => row.id));
    const abilityIds = new Set(abilities.records.map((row) => row.id));
    expect(appearanceIds.size).toBe(appearances.records.length);
    expect(abilityIds.size).toBe(abilities.records.length);
    expect(new Set(effects.records.map((row) => row.id)).size).toBe(effects.records.length);
    expect(abilities.records.every((row) => appearanceIds.has(row.appearance_id))).toBe(true);
    expect(effects.records.every((row) => abilityIds.has(row.appearance_ability_id))).toBe(true);
    expect(effects.records.every((row) => Number(row.stage_order) > 0 && Number(row.effect_order) > 0)).toBe(true);
    expect(effects.records.every((row) => typeof JSON.parse(row.metadata).rawDescription === 'string')).toBe(true);

    const defaultByAppearance = new Map(
      appearances.records.map((row) => [row.id, row.is_default === 'true']),
    );
    expect(coverage.records.every((row) => {
      const expected = defaultByAppearance.get(row.appearance_id) && row.kind === 'uniform_effect'
        ? 'not_applicable'
        : 'complete';
      return row.status === expected;
    })).toBe(true);
  });
});
