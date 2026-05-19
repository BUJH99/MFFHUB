import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('thanosvibs sync script structure', () => {
  it('keeps IO/export responsibilities outside the parser orchestration file', () => {
    const script = readFileSync(new URL('./thanosvibs-sync.ts', import.meta.url), 'utf8');

    expect(script.split('\n').length).toBeLessThan(800);
    expect(script).not.toMatch(/function cacheAssets/);
    expect(script).not.toMatch(/function writeOutputs/);
    expect(script).not.toMatch(/function fetchPage/);
  });
});
