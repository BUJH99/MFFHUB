import rawWorldBoss from '../generated/worldboss.json';
import { normalizeMffImageUrl } from './imageUrls';

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

function normalizeWorldBossPayload(payload: WorldBossPayload): WorldBossPayload {
  return {
    ...payload,
    bosses: payload.bosses.map((boss) => ({
      ...boss,
      portraitUrl: normalizeMffImageUrl(boss.portraitUrl),
      bannerUrl: normalizeMffImageUrl(boss.bannerUrl),
      unlocks: boss.unlocks.map((unlock) => ({
        ...unlock,
        portraitUrl: normalizeMffImageUrl(unlock.portraitUrl),
      })),
      stages: boss.stages.map((stage) => ({
        ...stage,
        restrictions: stage.restrictions.map((restriction) => ({
          ...restriction,
          iconUrl: normalizeMffImageUrl(restriction.iconUrl),
        })),
        candidates: stage.candidates.map((candidate) => ({
          ...candidate,
          portraitUrl: normalizeMffImageUrl(candidate.portraitUrl),
        })),
      })),
    })),
  };
}

export const worldBossPayload = normalizeWorldBossPayload(rawWorldBoss as WorldBossPayload);
export const worldBosses = worldBossPayload.bosses;
export const worldBossSourceUrl = worldBossPayload.sourceUrl;
export const worldBossSyncedAt = worldBossPayload.syncedAt;
