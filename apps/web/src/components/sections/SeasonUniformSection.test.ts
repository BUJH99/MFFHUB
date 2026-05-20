import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./SeasonUniformSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('SeasonUniformSection layout and ownership controls', () => {
  it('places the season matrix and PVP/PVE recommendation tables in the same first desktop row', () => {
    expect(source).toContain('xl:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]');
    expect(source).toContain('data-testid="season-recommendations"');
    expect(source).toContain('<SeasonMatrix ownedUniformKeys={ownedUniformKeys} onToggleOwned={toggleOwnedUniform} />');
  });

  it('adds persistent owned/unowned checkbox controls for season uniforms', () => {
    expect(source).toContain('seasonUniformOwnershipStorageKey');
    expect(source).toContain('type="checkbox"');
    expect(source).toContain('checked={owned}');
    expect(source).toContain("data-testid={`season-owned-${ownedKey}`}");
    expect(source).toContain("{owned ? '보유' : '미보유'}");
  });
});
