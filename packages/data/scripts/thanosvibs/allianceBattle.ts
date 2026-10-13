import type { SyncedAllianceBattleCondition } from './types';

const contentByMode = {
  Normal: 'AB',
  Extreme: 'ABX',
  Legend: 'ABL',
  'Infinite Challenge': 'Infinity Challenge',
} as const;

const allowedRestrictions = new Set([
  'Combat', 'Blast', 'Speed', 'Universal', 'Hero', 'Villain', 'Neutral',
  'Male', 'Female', 'Other', 'Human', 'Alien', 'Mutant', 'Inhuman',
]);

export function parseApiAllianceBattleConditions(
  payload: unknown,
  sourceUrl: string,
): SyncedAllianceBattleCondition[] {
  if (!payload || typeof payload !== 'object' || !('restrictions' in payload) || !Array.isArray(payload.restrictions)) {
    throw new Error('THANO$VIB$ alliance battle API is missing its restrictions array');
  }

  const conditions = payload.restrictions.map((raw: unknown): SyncedAllianceBattleCondition => {
    if (!raw || typeof raw !== 'object' || !('day' in raw) || !('mode' in raw) || !('restriction' in raw)) {
      throw new Error('THANO$VIB$ alliance battle API returned an invalid condition');
    }
    const roundNo = Number(raw.day);
    if (!Number.isInteger(roundNo) || roundNo < 1 || roundNo > 28 ||
        typeof raw.mode !== 'string' || !Object.hasOwn(contentByMode, raw.mode) ||
        typeof raw.restriction !== 'string' || !raw.restriction.trim()) {
      throw new Error('THANO$VIB$ alliance battle API returned an invalid round, mode, or restriction');
    }
    const mode = raw.mode as SyncedAllianceBattleCondition['mode'];
    const content = contentByMode[mode];
    const restrictions = /^No Restrictions?$/i.test(raw.restriction.trim())
      ? []
      : raw.restriction.trim().split(/\s+/);
    if (restrictions.some((restriction) => !allowedRestrictions.has(restriction))) {
      throw new Error(`THANO$VIB$ alliance battle API returned unknown restrictions: ${raw.restriction}`);
    }
    const requiredType = restrictions.find((item) => ['Combat', 'Blast', 'Speed', 'Universal'].includes(item));
    const requiredAlignment = restrictions.find((item) => ['Hero', 'Villain', 'Neutral'].includes(item));
    const requiredGender = restrictions.find((item) => ['Male', 'Female', 'Other'].includes(item));

    return {
      id: `mff-abxl-r${String(roundNo).padStart(2, '0')}-${content.toLowerCase().replace(/[^a-z]/g, '')}`,
      roundNo,
      mode,
      content,
      isResetDay: (roundNo - 1) % 7 === 0,
      restrictions: restrictions.length ? restrictions : ['No Restrictions'],
      requiredType,
      requiredAlignment,
      requiredGender,
      requiredTags: restrictions
        .filter((item) => ![requiredType, requiredAlignment, requiredGender].includes(item))
        .map((item) => item.toLowerCase()),
      // The new page exposes the available roar cancels per mode, independently of recommended teams.
      cancelEffects: mode === 'Extreme' ? ['silence', 'paralyze', 'burn']
        : mode === 'Legend' ? ['snare', 'shock', 'fracture'] : [],
      sourceUrl,
      note: restrictions.length ? restrictions.join(' + ') : 'No Restrictions',
    };
  });

  const ids = new Set(conditions.map((condition) => condition.id));
  if (ids.size !== conditions.length) throw new Error('THANO$VIB$ alliance battle API returned duplicate conditions');
  for (let roundNo = 1; roundNo <= 28; roundNo += 1) {
    const modes = new Set(conditions.filter((condition) => condition.roundNo === roundNo).map((condition) => condition.mode));
    const complete = modes.size === 1 && modes.has('Infinite Challenge') ||
      modes.size === 3 && modes.has('Normal') && modes.has('Extreme') && modes.has('Legend');
    if (!complete) throw new Error(`THANO$VIB$ alliance battle API is incomplete at round ${roundNo}`);
  }
  return conditions.sort((a, b) => a.roundNo - b.roundNo || a.mode.localeCompare(b.mode));
}
