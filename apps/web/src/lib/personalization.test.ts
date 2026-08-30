import { describe, expect, it } from 'vitest';
import { personalDataKeys } from './personalization';

describe('personal data key map', () => {
  it('covers account-specific website sections for cloud sync', () => {
    const contentKeys = personalDataKeys.map((entry) => entry.contentKey);

    expect(contentKeys).toContain('character_info.cards');
    expect(personalDataKeys).toContainEqual({
      storageKey: 'mff-data-hub:world-boss-stage-teams:v3',
      contentKey: 'world_boss.stage_picks',
      label: '월드보스 3인 세트',
    });
    expect(contentKeys).toContain('world_boss.progress');
    expect(contentKeys).toContain('pvp.decks');
    expect(contentKeys).toContain('my_characters.builds');
    expect(contentKeys).toContain('analytics.scores');
    expect(contentKeys).toContain('scores.entries');
    expect(contentKeys).toContain('board.local_posts');
  });
});
