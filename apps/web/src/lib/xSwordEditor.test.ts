import { describe, expect, it } from 'vitest';
import {
  createDefaultXSwordSlots,
  masteryAttackForLevel,
  normalizeXSwordSlots,
  summarizeXSwordSlots,
  xSwordOptionDefinitions,
} from './xSwordEditor';

describe('x-sword editor', () => {
  it('sums per-sword mastery levels for all-attack calculation', () => {
    const summary = summarizeXSwordSlots(createDefaultXSwordSlots());

    expect(summary.swords).toHaveLength(6);
    expect(summary.masteryLevel).toBe(28);
    expect(summary.masteryAllAttack).toBe(masteryAttackForLevel(28));
  });

  it('normalizes every sword to six real option rows', () => {
    const slots = createDefaultXSwordSlots();

    expect(slots).toHaveLength(6);
    expect(slots.every((slot) => slot.options.length === 6)).toBe(true);
    expect(xSwordOptionDefinitions.length).toBeGreaterThan(20);
  });

  it('applies editable option rows to mapped account stats', () => {
    const defaults = createDefaultXSwordSlots();
    const custom = normalizeXSwordSlots(defaults.map((slot, index) => (
      index === 0
        ? {
          ...slot,
          masteryLevel: 6,
          options: [
            { optionId: 'cooldownDuration', value: 7.5 },
            { optionId: 'lightningDamage', value: 6 },
            { optionId: 'instinctAttack', value: 600 },
            { optionId: 'damageDealtToAliens', value: 2.5 },
            { optionId: 'damageDealtToPureEvil', value: 2.5 },
            { optionId: 'damageDealtToDestructionInstinct', value: 2.5 },
          ],
        }
        : slot
    )));

    const summary = summarizeXSwordSlots(custom);

    expect(summary.masteryLevel).toBe(29);
    expect(summary.stats.cooldownDuration).toBeGreaterThanOrEqual(7.5);
    expect(summary.stats.elementalDamage).toBeGreaterThanOrEqual(6);
    expect(summary.stats.instinctAttack).toBeGreaterThanOrEqual(600);
  });
});
