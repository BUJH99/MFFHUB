import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function uniqueMatches(source: string, pattern: RegExp) {
  return Array.from(new Set(Array.from(source.matchAll(pattern), (match) => match[1]))).sort();
}

describe('database schema sources', () => {
  it('keeps the Supabase SQL snapshot aligned with the Drizzle table list', () => {
    const drizzleSchema = readFileSync(new URL('./schema.ts', import.meta.url), 'utf8');
    const supabaseSchema = readFileSync(new URL('../../../supabase/schema.sql', import.meta.url), 'utf8');

    expect(uniqueMatches(supabaseSchema, /create table if not exists public\.([a-z_]+)/gi)).toEqual(
      uniqueMatches(drizzleSchema, /pgTable\('([^']+)'/g),
    );
  });
});
