import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./SeasonUniformSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('SeasonUniformSection layout and ownership controls', () => {
  it('places the season matrix and PVP/PVE recommendation tables in the same first desktop row', () => {
    expect(source).toContain('xl:grid-cols-[minmax(0,1fr)_420px]');
    expect(source).toContain('data-testid="season-recommendations"');
    expect(source).toContain('<SeasonMatrix ownedUniformKeys={ownedUniformKeys} onToggleOwned={toggleOwnedUniform} />');
  });

  it('pre-creates season year columns through 2030', () => {
    expect(source).toContain('const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030] as const;');
    expect(source).toContain('min-w-[1320px]');
    expect(source).toContain('w-[150px] whitespace-nowrap border-2 border-slate-950 text-3xl');
    expect(source).toContain('2019-2030');
    expect(source).not.toContain('2019-2027');
  });

  it('adds persistent owned/unowned checkbox controls for season uniforms', () => {
    expect(source).toContain('seasonUniformOwnershipStorageKey');
    expect(source).toContain('type="checkbox"');
    expect(source).toContain('checked={owned}');
    expect(source).toContain("data-testid={`season-owned-${ownedKey}`}");
    expect(source).toContain("{owned ? '보유' : '미보유'}");
  });

  it('includes the 2026 summer Jean Grey and Sandman uniforms', () => {
    expect(source).toContain("2026: hero('진 그레이', 'jeangrey4')");
    expect(source).toContain("2026: hero('샌드맨', 'sandman1')");
  });

  it('tightens recommendation tables so hero rows stay on one line', () => {
    expect(source).toContain('overflow-hidden rounded-lg border border-slate-900 bg-white shadow-sm');
    expect(source).toContain('table className="w-full table-fixed border-collapse text-center"');
    expect(source).toContain('<col className="w-[36px]" />');
    expect(source).toContain('w-[36px] border-2 border-slate-950 px-0 py-2');
    expect(source).toContain('whitespace-nowrap border-2 border-slate-950 bg-[#c9c9c9] px-0 py-2 text-[13px]');
    expect(source).toContain('overflow-hidden border border-slate-950 px-1 py-2');
    expect(source).toContain('flex min-h-[74px] max-w-full flex-nowrap items-start justify-center gap-1.5 overflow-hidden');
    expect(source).toContain("dense ? 'truncate whitespace-nowrap text-[10px]' : 'text-[12px]'");
    expect(source).not.toContain('[writing-mode:vertical-rl]');
    expect(source).not.toContain('w-[40px] border-2 border-slate-950 py-2');
    expect(source).not.toContain('w-[52px] border-2 border-slate-950 py-2');
    expect(source).not.toContain('flex min-h-[78px] flex-wrap items-start justify-center gap-2');
  });
});
