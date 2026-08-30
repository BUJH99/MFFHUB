import { describe, expect, it } from 'vitest';
import {
  createWorldBossStageTeam,
  hasWorldBossStageTeams,
  migrateLegacyWorldBossStagePicks,
  normalizeWorldBossStageTeamStore,
  WORLD_BOSS_TEAM_SIZE,
  type WorldBossStagePick,
} from './worldBossTeams';

const picks: WorldBossStagePick[] = Array.from({ length: 5 }, (_, index) => ({
  id: `pick-${index + 1}`,
  characterId: `character-${index + 1}`,
  characterName: `캐릭터 ${index + 1}`,
  characterImageUrl: `/character-${index + 1}.webp`,
  uniformName: `유니폼 ${index + 1}`,
  uniformImageUrl: `/uniform-${index + 1}.webp`,
}));

describe('World Boss three-character team storage', () => {
  it('keeps normalized v3 teams and discards malformed rows', () => {
    const normalized = normalizeWorldBossStageTeamStore({
      'boss:1-9': [
        { id: 'team-1', members: picks.slice(0, WORLD_BOSS_TEAM_SIZE) },
        { id: '', members: picks.slice(0, WORLD_BOSS_TEAM_SIZE) },
        { id: 'empty-team', members: [] },
      ],
      invalid: 'not-an-array',
    });

    expect(normalized).toEqual({
      'boss:1-9': [{ id: 'team-1', members: picks.slice(0, WORLD_BOSS_TEAM_SIZE) }],
    });
    expect(hasWorldBossStageTeams(normalized)).toBe(true);
  });

  it('migrates legacy individual picks into ordered groups of three without dropping leftovers', () => {
    const migrated = migrateLegacyWorldBossStagePicks({ 'boss:10-14': picks });

    expect(migrated['boss:10-14']).toHaveLength(2);
    expect(migrated['boss:10-14'][0]?.members.map((pick) => pick.id)).toEqual(['pick-1', 'pick-2', 'pick-3']);
    expect(migrated['boss:10-14'][1]?.members.map((pick) => pick.id)).toEqual(['pick-4', 'pick-5']);
    expect(migrated['boss:10-14'].every((team) => team.migratedFromLegacy)).toBe(true);
  });

  it('creates only complete teams with three unique characters', () => {
    expect(createWorldBossStageTeam('team-1', picks.slice(0, 3))).toEqual({
      id: 'team-1',
      members: picks.slice(0, 3),
    });
    expect(() => createWorldBossStageTeam('team-2', picks.slice(0, 2))).toThrow(/exactly 3/);
    expect(() => createWorldBossStageTeam('team-3', [picks[0]!, picks[0]!, picks[1]!])).toThrow(/same character/);
  });
});
