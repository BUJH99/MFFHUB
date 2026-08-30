import { supabase } from './supabase';

export type PersonalDataKey = {
  storageKey: string;
  contentKey: string;
  label: string;
};

type PersonalSettingsRow = {
  content_key?: string | null;
  settings?: unknown;
};

type PersonalSettingsPayload = {
  storageKey: string;
  raw: string;
  syncedAt: string;
  version: 1;
};

export const personalDataKeys: PersonalDataKey[] = [
  { storageKey: 'mff-data-hub:comic-card-editor:v1', contentKey: 'character_info.cards', label: '카드' },
  { storageKey: 'mff-data-hub:x-sword-editor:v1', contentKey: 'character_info.x_swords', label: 'X-소드' },
  { storageKey: 'mff-data-hub:team-up-editor:v1', contentKey: 'character_info.team_ups', label: '팀업' },
  { storageKey: 'mff-data-hub:ctp-inventory:v1', contentKey: 'character_info.ctp', label: 'CTP 인벤토리' },
  { storageKey: 'mff-data-hub:world-boss-stage-teams:v3', contentKey: 'world_boss.stage_picks', label: '월드보스 3인 세트' },
  { storageKey: 'mff-data-hub:world-boss-progress:v1', contentKey: 'world_boss.progress', label: '월드보스 진행' },
  { storageKey: 'mff-data-hub:pvp-deck-customizations:v1', contentKey: 'pvp.decks', label: 'PVP 덱' },
  { storageKey: 'mff-data-hub:pvp-restrictions:v1', contentKey: 'pvp.restrictions', label: 'PVP 제한' },
  { storageKey: 'mff-data-hub:my-character-builds:v1', contentKey: 'my_characters.builds', label: '나의 캐릭터' },
  { storageKey: 'mff-data-hub:alliance-score-analysis:v1', contentKey: 'analytics.scores', label: '통계 분석' },
  { storageKey: 'mff-data-hub:user-score-entries:v1', contentKey: 'scores.entries', label: '점수 입력' },
  { storageKey: 'mff-data-hub:board-posts:v1', contentKey: 'board.local_posts', label: '게시판' },
  { storageKey: 'mff-data-hub:sidebar-account-profile:v1', contentKey: 'account.profile', label: '계정 프로필' },
];

function isPayload(value: unknown): value is PersonalSettingsPayload {
  return typeof value === 'object'
    && value !== null
    && 'raw' in value
    && typeof (value as { raw?: unknown }).raw === 'string';
}

function readLocalRows(userId: string) {
  if (typeof window === 'undefined') return [];

  const syncedAt = new Date().toISOString();
  return personalDataKeys.flatMap((entry) => {
    const raw = window.localStorage.getItem(entry.storageKey);
    if (raw === null) return [];

    return [{
      user_id: userId,
      content_key: entry.contentKey,
      settings: {
        storageKey: entry.storageKey,
        raw,
        syncedAt,
        version: 1,
      } satisfies PersonalSettingsPayload,
      updated_at: syncedAt,
    }];
  });
}

export async function hydrateMissingPersonalData(userId: string) {
  if (!supabase || typeof window === 'undefined') return 0;

  const contentKeys = personalDataKeys.map((entry) => entry.contentKey);
  const { data, error } = await supabase
    .from('user_content_settings')
    .select('content_key, settings')
    .eq('user_id', userId)
    .in('content_key', contentKeys);

  if (error) throw error;

  const storageKeyByContent = new Map(personalDataKeys.map((entry) => [entry.contentKey, entry.storageKey]));
  let hydrated = 0;

  for (const row of (data ?? []) as PersonalSettingsRow[]) {
    const contentKey = row.content_key ?? '';
    const storageKey = storageKeyByContent.get(contentKey);
    if (!storageKey || window.localStorage.getItem(storageKey) !== null || !isPayload(row.settings)) continue;

    window.localStorage.setItem(storageKey, row.settings.raw);
    hydrated += 1;
  }

  if (hydrated > 0) {
    window.dispatchEvent(new CustomEvent('mff-data-hub:personal-data-hydrated', { detail: { hydrated } }));
  }

  return hydrated;
}

export async function uploadLocalPersonalData(userId: string) {
  if (!supabase || typeof window === 'undefined') return 0;

  const rows = readLocalRows(userId);
  if (!rows.length) return 0;

  const { error } = await supabase
    .from('user_content_settings')
    .upsert(rows, { onConflict: 'user_id,content_key' });

  if (error) throw error;
  return rows.length;
}

export async function syncPersonalData(userId: string) {
  const hydrated = await hydrateMissingPersonalData(userId);
  const uploaded = await uploadLocalPersonalData(userId);
  return { hydrated, uploaded };
}
