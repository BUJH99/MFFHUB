import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./WorldBossSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('WorldBossSection picker scroll behavior', () => {
  it('locks page scrolling while the hero picker is open', () => {
    expect(source).toContain('document.body.style.overflow');
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('previousBodyOverflow');
  });

  it('keeps wheel and touch scrolling inside the picker panes', () => {
    expect(source.match(/overscroll-contain/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(source).toContain('grid h-[58vh]');
    expect(source).toContain('min-h-0');
    expect(source).toContain('data-testid="world-boss-picker"');
    expect(source).toContain('data-testid="world-boss-character-scroll"');
    expect(source).toContain('data-testid="world-boss-uniform-scroll"');
  });

  it('uses catalog names directly because the data catalog stores Korean names', () => {
    expect(source).not.toContain('getKoreanCharacterName');
    expect(source).toContain('characterName: option.character.name');
  });
});
