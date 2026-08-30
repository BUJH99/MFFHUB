export const WORLD_BOSS_TEAM_SIZE = 3;

export type WorldBossStagePick = {
  id: string;
  characterId: string;
  characterName: string;
  characterImageUrl: string;
  uniformName: string;
  uniformImageUrl?: string;
};

export type WorldBossStageTeam = {
  id: string;
  members: WorldBossStagePick[];
  migratedFromLegacy?: boolean;
};

export type WorldBossStageTeamStore = Record<string, WorldBossStageTeam[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeStagePick(value: unknown): WorldBossStagePick | undefined {
  if (!isRecord(value)) return undefined;

  const id = readRequiredString(value.id);
  const characterId = readRequiredString(value.characterId);
  const characterName = readRequiredString(value.characterName);
  const characterImageUrl = readRequiredString(value.characterImageUrl);
  const uniformName = readRequiredString(value.uniformName);
  const uniformImageUrl = readRequiredString(value.uniformImageUrl);

  if (!id || !characterId || !characterName || !characterImageUrl || !uniformName) return undefined;

  return {
    id,
    characterId,
    characterName,
    characterImageUrl,
    uniformName,
    ...(uniformImageUrl ? { uniformImageUrl } : {}),
  };
}

function normalizeTeam(value: unknown): WorldBossStageTeam | undefined {
  if (!isRecord(value) || !Array.isArray(value.members)) return undefined;

  const id = readRequiredString(value.id);
  const members = value.members
    .map(normalizeStagePick)
    .filter((member): member is WorldBossStagePick => Boolean(member))
    .slice(0, WORLD_BOSS_TEAM_SIZE);

  if (!id || members.length === 0) return undefined;

  return {
    id,
    members,
    ...(value.migratedFromLegacy === true ? { migratedFromLegacy: true } : {}),
  };
}

export function normalizeWorldBossStageTeamStore(value: unknown): WorldBossStageTeamStore {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([stageKey, teams]) => {
      if (!Array.isArray(teams)) return [];
      const normalizedTeams = teams
        .map(normalizeTeam)
        .filter((team): team is WorldBossStageTeam => Boolean(team));
      return normalizedTeams.length ? [[stageKey, normalizedTeams]] : [];
    }),
  );
}

export function migrateLegacyWorldBossStagePicks(value: unknown): WorldBossStageTeamStore {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([stageKey, picks]) => {
      if (!Array.isArray(picks)) return [];
      const normalizedPicks = picks
        .map(normalizeStagePick)
        .filter((pick): pick is WorldBossStagePick => Boolean(pick));
      if (!normalizedPicks.length) return [];

      const teams: WorldBossStageTeam[] = [];
      for (let index = 0; index < normalizedPicks.length; index += WORLD_BOSS_TEAM_SIZE) {
        const members = normalizedPicks.slice(index, index + WORLD_BOSS_TEAM_SIZE);
        teams.push({
          id: `legacy:${stageKey}:${Math.floor(index / WORLD_BOSS_TEAM_SIZE) + 1}`,
          members,
          migratedFromLegacy: true,
        });
      }

      return [[stageKey, teams]];
    }),
  );
}

export function hasWorldBossStageTeams(store: WorldBossStageTeamStore) {
  return Object.values(store).some((teams) => teams.length > 0);
}

export function createWorldBossStageTeam(id: string, members: WorldBossStagePick[]): WorldBossStageTeam {
  if (members.length !== WORLD_BOSS_TEAM_SIZE) {
    throw new Error(`World Boss teams require exactly ${WORLD_BOSS_TEAM_SIZE} characters.`);
  }

  if (new Set(members.map((member) => member.characterId)).size !== WORLD_BOSS_TEAM_SIZE) {
    throw new Error('World Boss teams cannot contain the same character more than once.');
  }

  return { id, members: [...members] };
}
