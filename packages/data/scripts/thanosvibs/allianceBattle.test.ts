import { describe, expect, it } from 'vitest';
import { parseApiAllianceBattleConditions } from './allianceBattle';

const sourceUrl = 'https://thanosvibs.money/api/abxl-data';
const createPayload = () => ({
  restrictions: Array.from({ length: 28 }, (_, index) => index + 1).flatMap((day) =>
    (day - 3) % 7 === 0
      ? [{ day, mode: 'Infinite Challenge', restriction: 'No Restriction' }]
      : ['Normal', 'Extreme', 'Legend'].map((mode) => ({ day, mode, restriction: 'No Restriction' })),
  ),
});

describe('alliance battle JSON API sync', () => {
  it('maps all 28 rounds and normalizes restrictions while retaining stable condition ids', () => {
    const payload = createPayload();
    payload.restrictions.find((row) => row.day === 1 && row.mode === 'Extreme')!.restriction = 'Speed Hero Female';
    payload.restrictions.find((row) => row.day === 1 && row.mode === 'Legend')!.restriction = 'Villain Alien';
    const rows = parseApiAllianceBattleConditions(payload, sourceUrl);
    expect(rows).toHaveLength(76);
    expect(rows.find((row) => row.id === 'mff-abxl-r01-abx')).toMatchObject({
      restrictions: ['Speed', 'Hero', 'Female'], requiredType: 'Speed', requiredAlignment: 'Hero',
      requiredGender: 'Female', requiredTags: [], cancelEffects: ['silence', 'paralyze', 'burn'],
    });
    expect(rows.find((row) => row.id === 'mff-abxl-r01-abl')).toMatchObject({
      requiredAlignment: 'Villain', requiredTags: ['alien'], cancelEffects: ['snare', 'shock', 'fracture'],
    });
    expect(rows.find((row) => row.id === 'mff-abxl-r03-infinitychallenge')).toMatchObject({
      restrictions: ['No Restrictions'], requiredTags: [], cancelEffects: [],
    });
    expect([...new Set(rows.filter((row) => row.isResetDay).map((row) => row.roundNo))]).toEqual([1, 8, 15, 22]);
  });

  it('rejects empty, partial, duplicate, or changed payloads instead of overwriting valid schedules', () => {
    expect(() => parseApiAllianceBattleConditions('<html>Loading...</html>', sourceUrl)).toThrow(/restrictions array/);
    expect(() => parseApiAllianceBattleConditions({ restrictions: [] }, sourceUrl)).toThrow(/incomplete/);
    const partial = createPayload();
    partial.restrictions.pop();
    expect(() => parseApiAllianceBattleConditions(partial, sourceUrl)).toThrow(/incomplete/);
    const duplicate = createPayload();
    duplicate.restrictions.push(duplicate.restrictions[0]);
    expect(() => parseApiAllianceBattleConditions(duplicate, sourceUrl)).toThrow(/duplicate/);
    const unknown = createPayload();
    unknown.restrictions[0].restriction = 'Unrecognized';
    expect(() => parseApiAllianceBattleConditions(unknown, sourceUrl)).toThrow(/unknown restrictions/);
  });
});
