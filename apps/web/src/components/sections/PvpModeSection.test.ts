import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./PvpModeSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('PvpModeSection shared catalog picker usage', () => {
  it('uses the shared catalog DB picker helpers instead of local duplicate name/uniform matching', () => {
    expect(source).toContain("from '@/lib/catalogCharacterPicker'");
    expect(source).toContain('buildCatalogCharacterOptions');
    expect(source).toContain('catalogFallbackUniform');
    expect(source).not.toContain('const appCharacterByCatalogKey = new Map');
    expect(source).not.toContain('function toRestrictionSearchText');
    expect(source).toContain('option.displayName');
  });
});
