import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./AllianceBattleSchedule.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('AllianceBattleSchedule picker scroll behavior', () => {
  it('locks page scrolling and keeps ABX/ABL character picking inside the modal panes', () => {
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('previousBodyOverflow');
    expect(source).toContain('data-testid="alliance-battle-picker"');
    expect(source).toContain('data-testid="alliance-battle-character-scroll"');
    expect(source).toContain('data-testid="alliance-battle-uniform-scroll"');
    expect(source.match(/overscroll-contain/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('fixed bottom-4 right-4');
  });
});
