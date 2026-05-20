import { describe, expect, it } from 'vitest';
import { catalogCharacters } from './catalog';
import { koreanCharacterNames } from './characterNames';

describe('Korean character display names', () => {
  it('stores every production catalog character name in Korean', () => {
    const nonKoreanNames = catalogCharacters
      .map((character) => character.name)
      .filter((name) => /[A-Za-z]/.test(name) || !/[가-힣]/.test(name));

    expect(nonKoreanNames).toEqual([]);
  });

  it('keeps source-name mappings aligned with the image sheet reference names', () => {
    expect(koreanCharacterNames['Spider-Man']).toBe('스파이더맨');
    expect(koreanCharacterNames['Spider-Man (Miles Morales)']).toBe('마일즈 모랄레스');
    expect(koreanCharacterNames['Nova (Richard Rider)']).toBe('리처드 라이더');
    expect(koreanCharacterNames['Corvus Glaive']).toBe('콜버스 글레이브');
  });
});
