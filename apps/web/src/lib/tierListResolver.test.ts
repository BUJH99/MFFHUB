import { describe, expect, it } from 'vitest';
import { type TierListEntry } from '@mff-data-hub/data';
import { getLatestUniform, resolveTierListEntry } from './tierListResolver';

function entry(sourceName: string): TierListEntry {
  return {
    sourceName,
    sourceImageUrl: 'https://example.com/portrait.png',
    type: 'Combat',
    order: 1,
  };
}

describe('tier list resolver', () => {
  it('prefers the leading character identity over later uniform or subtitle words', () => {
    expect(resolveTierListEntry(entry('ares punisher')).displayName).toBe('아레스');
    expect(resolveTierListEntry(entry("kingpin marvel televisions daredevil: born again")).displayName).toBe('킹핀');
    expect(resolveTierListEntry(entry('taskmaster marvel studios black widow')).displayName).toBe('태스크마스터');
    expect(resolveTierListEntry(entry('mordo marvel studios doctor strange 2')).displayName).toBe('모르도');
  });

  it('maps a resolved character to the latest catalog uniform automatically', () => {
    expect(resolveTierListEntry(entry('taskmaster marvel studios black widow')).sourceLabel).toBe("Marvel Studios' Thunderbolts*");
    expect(resolveTierListEntry(entry('storm marvel animations x-men 97')).sourceLabel).toBe("Marvel Animation's X-Men '97");
    expect(resolveTierListEntry(entry('venom king in black')).sourceLabel).toBe('Snow Symbiote');
  });

  it('detects the current catalog portrait uniform even when uniform rows are not chronological', () => {
    const storm = resolveTierListEntry(entry('storm marvel animations x-men 97')).character;
    const venom = resolveTierListEntry(entry('venom snow symbiote')).character;

    expect(storm ? getLatestUniform(storm)?.name : undefined).toBe("Marvel Animation's X-Men '97");
    expect(venom ? getLatestUniform(venom)?.name : undefined).toBe('Snow Symbiote');
  });
});
