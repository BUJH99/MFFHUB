import { describe, expect, it } from 'vitest';
import {
  buildMonthlyAllianceBattleCalendar,
  getAllianceChallengeRulesForDate,
  getKstDateKey,
} from './allianceBattle';

describe('alliance battle calendar', () => {
  it('formats runtime dates in KST', () => {
    expect(getKstDateKey(new Date('2026-05-18T15:00:00.000Z'))).toBe('2026-05-19');
  });

  it('builds date-specific challenge rules without module-level today constants', () => {
    const rules = getAllianceChallengeRulesForDate('2026-05-19');

    expect(rules).toHaveLength(2);
    expect(rules.every((rule) => rule.date === '2026-05-19')).toBe(true);
  });

  it('marks the selected date in a generated month', () => {
    const selected = buildMonthlyAllianceBattleCalendar('2026-05', '2026-05-19').find((day) => day.date === '2026-05-19');

    expect(selected?.isToday).toBe(true);
  });
});
