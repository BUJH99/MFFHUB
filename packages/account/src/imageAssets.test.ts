import { describe, expect, it } from 'vitest';
import { comicCardDatabase, xSwordElements } from './index';

describe('account image assets', () => {
  it('uses the current item route for every X-Sword image', () => {
    expect(xSwordElements).toHaveLength(6);
    expect(xSwordElements.every((element) => element.sourceImageUrl.startsWith('https://thanosvibs.money/images/items/sword_'))).toBe(true);
    expect(xSwordElements.every((element) => !element.sourceImageUrl.includes('/static/'))).toBe(true);
  });

  it('normalizes generated comic-card fallback URLs', () => {
    expect(comicCardDatabase.length).toBeGreaterThan(100);
    expect(comicCardDatabase.every((card) => card.sourceImageUrl.startsWith('https://thanosvibs.money/images/cards/'))).toBe(true);
    expect(comicCardDatabase.every((card) => !card.sourceImageUrl.includes('/static/'))).toBe(true);
  });
});
