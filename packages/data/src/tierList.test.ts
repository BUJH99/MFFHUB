import { describe, expect, it } from 'vitest';
import { pveTierListRows, pvpTierListRows, tierListRowsByMode } from './tierList';

describe('tier list mode data', () => {
  it('keeps PVE and PVP tier seeds independent while showing the full PVP roster', () => {
    const pveSourceNames = new Set(pveTierListRows.flatMap((row) => row.entries.map((entry) => entry.sourceName)));
    const pvpSourceNames = new Set(pvpTierListRows.flatMap((row) => row.entries.map((entry) => entry.sourceName)));

    expect(tierListRowsByMode.pve).toBe(pveTierListRows);
    expect(tierListRowsByMode.pvp).toBe(pvpTierListRows);
    expect(pvpTierListRows).not.toEqual(pveTierListRows);
    expect(pvpTierListRows[0]?.entries.map((entry) => entry.sourceName)).not.toEqual(
      pveTierListRows[0]?.entries.map((entry) => entry.sourceName),
    );
    expect(pvpSourceNames.size).toBe(pveSourceNames.size);
    expect([...pveSourceNames].every((sourceName) => pvpSourceNames.has(sourceName))).toBe(true);
    expect(pvpTierListRows[0]?.entries[0]?.sourceName).toBe('jean grey dark phoenix');
    expect(pvpSourceNames.has('gorgon war of kings')).toBe(true);
  });
});
