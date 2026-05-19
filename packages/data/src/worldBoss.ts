import rawWorldBoss from '../generated/worldboss.json';

export type WorldBossMode = 'Legend' | 'Legend+';

export type WorldBossUnlock = {
  stage: number;
  character: string;
  portraitUrl: string;
};

export type WorldBossRestriction = {
  label: string;
  iconUrl: string;
};

export type WorldBossCandidate = {
  name: string;
  portraitUrl: string;
};

export type WorldBossStageRule = {
  range: string;
  restrictions: WorldBossRestriction[];
  candidateCount: number;
  candidates: WorldBossCandidate[];
};

export type WorldBoss = {
  id: string;
  name: string;
  mode: WorldBossMode;
  portraitUrl: string;
  bannerUrl: string;
  unlocks: WorldBossUnlock[];
  stages: WorldBossStageRule[];
};

export type WorldBossPayload = {
  syncedAt: string;
  sourceUrl: string;
  bosses: WorldBoss[];
};

export const worldBossPayload = rawWorldBoss as WorldBossPayload;
export const worldBosses = worldBossPayload.bosses;
export const worldBossSourceUrl = worldBossPayload.sourceUrl;
export const worldBossSyncedAt = worldBossPayload.syncedAt;
