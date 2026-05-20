import { describe, expect, it } from 'vitest';
import { createDefaultCardSlots, normalizeCardSlots } from './comicCardEditor';

describe('comic card editor', () => {
  it('removes duplicate card ids while normalizing stored slots', () => {
    const defaults = createDefaultCardSlots();
    const duplicateCardId = defaults[0].cardId;
    const duplicated = defaults.map((slot, index) => ({
      ...slot,
      cardId: index < 2 ? duplicateCardId : slot.cardId,
    }));

    const normalized = normalizeCardSlots(duplicated);
    const cardIds = normalized.map((slot) => slot.cardId);

    expect(new Set(cardIds).size).toBe(cardIds.length);
    expect(cardIds[0]).toBe(duplicateCardId);
    expect(cardIds[1]).not.toBe(duplicateCardId);
  });
});
