import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const appShellSource = readSource('./AppShell.tsx');
const sidebarSource = readSource('./Sidebar.tsx');
const mobileNavSource = readSource('./MobileNav.tsx');
const navigationSource = readSource('../lib/navigation.ts');
const userScoreSource = readSource('./sections/UserScoreSection.tsx');
const boardSource = readSource('./sections/BoardSection.tsx');
const dbSchemaSource = readSource('../../../../packages/db/src/schema.ts');
const supabaseSchemaSource = readSource('../../../../supabase/schema.sql');
const adminAccessSource = readSource('../../../../supabase/admin-access.sql');

describe('user score and board sections', () => {
  it('routes score entry and board pages through the app shell navigation', () => {
    expect(navigationSource).toContain("'userScores'");
    expect(navigationSource).toContain("'board'");
    expect(appShellSource).toContain('UserScoreSection');
    expect(appShellSource).toContain('BoardSection');
    expect(sidebarSource).toContain("selectSection('userScores')");
    expect(sidebarSource).toContain("selectSection('board')");
    expect(mobileNavSource).toContain("'userScores'");
    expect(mobileNavSource).toContain("'board'");
  });

  it('adds user-scoped score entry storage for ABX, ABL, and Infinity Challenge', () => {
    expect(userScoreSource).toContain("from('user_score_entries')");
    expect(userScoreSource).toContain('score-ranking-board');
    expect(userScoreSource).toContain('buildRankings');
    expect(userScoreSource).toContain('player_nickname');
    expect(userScoreSource).toContain("content: mode.content");
    expect(userScoreSource).toContain("'Infinity Challenge'");
    expect(userScoreSource).toContain("userScoreStorageKey = 'mff-data-hub:user-score-entries:v1'");
  });

  it('adds board posts backed by Supabase and local fallback storage', () => {
    expect(boardSource).toContain("from('board_posts')");
    expect(boardSource).toContain("boardStorageKey = 'mff-data-hub:board-posts:v1'");
    expect(boardSource).toContain('author_nickname');
    expect(dbSchemaSource).toContain("pgTable('user_score_entries'");
    expect(dbSchemaSource).toContain("playerNickname: text('player_nickname')");
    expect(dbSchemaSource).toContain("pgTable('board_posts'");
    expect(dbSchemaSource).toContain("pgTable('board_comments'");
  });

  it('keeps admin-only write policies for shared catalog and personal data isolation', () => {
    expect(supabaseSchemaSource).toContain('alter table public.raw_source_snapshots enable row level security');
    expect(supabaseSchemaSource).toContain('create policy "admin manage profiles"');
    expect(supabaseSchemaSource).toContain('create policy "admin write characters"');
    expect(supabaseSchemaSource).toContain('create policy "admin write uniforms"');
    expect(supabaseSchemaSource).toContain('create policy "admin write daily challenges"');
    expect(supabaseSchemaSource).toContain('create policy "own roster"');
    expect(supabaseSchemaSource).toContain('create policy "own world boss progress"');
    expect(supabaseSchemaSource).toContain('create policy "own pvp loadouts"');
    expect(supabaseSchemaSource).toContain('grant insert, update, delete on all tables in schema public to authenticated');
    expect(adminAccessSource).toContain("admin_login_id text := 'YOUR_LOGIN_ID'");
  });
});
