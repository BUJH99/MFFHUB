import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./TierListSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('TierListSection type backgrounds', () => {
  it('gives each combat type a subtle section background', () => {
    expect(source).toContain('typeSurfaceTone');
    expect(source).toContain("Combat: 'border-red-100/80 bg-red-50/55'");
    expect(source).toContain("Blast: 'border-sky-100/90 bg-sky-50/65'");
    expect(source).toContain("Speed: 'border-emerald-100/90 bg-emerald-50/60'");
    expect(source).toContain("Universal: 'border-violet-100/90 bg-violet-50/60'");
    expect(source).toContain('${typeSurfaceTone[type]}');
  });
});
