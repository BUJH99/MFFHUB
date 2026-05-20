import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./AccountInsights.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('AccountInsights X-sword and team-up layout', () => {
  it('keeps X-sword option editing inside the attribute level panel and shows sword level effects', () => {
    expect(source).toContain('XSwordInlineOptionEditor');
    expect(source).toContain('XSwordLevelEffectTable');
    expect(source).toContain('formatXSwordLevelEffect');
    expect(source).toContain('data-testid="x-sword-inline-option-editor"');
    expect(source).not.toContain('<XSwordManagementPanel');
  });

  it('lays out team-up collections as four evenly sized cards per row on wide screens', () => {
    expect(source).toContain('xl:grid-cols-4');
    expect(source).not.toContain('md:grid-cols-2 2xl:grid-cols-5');
  });
});
