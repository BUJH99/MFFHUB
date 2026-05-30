import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./Sidebar.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('Sidebar account profile editor', () => {
  it('lets account name, agent level, and VIP be edited and saved locally', () => {
    expect(source).toContain("'use client'");
    expect(source).toContain('sidebarAccountStorageKey');
    expect(source).toContain('readStoredAccountProfile');
    expect(source).toContain('window.localStorage.setItem(sidebarAccountStorageKey');
    expect(source).toContain('aria-label="계정 이름"');
    expect(source).toContain('aria-label="Agent 레벨"');
    expect(source).toContain('aria-label="VIP 레벨"');
    expect(source).toContain('aria-label="계정 정보 저장"');
    expect(source).toContain('grid-cols-[minmax(0,1fr)_minmax(0,1fr)_42px]');
    expect(source).toContain('✓');
    expect(source).not.toContain('>저장</button>');
    expect(source).not.toContain('저장됨</span>');
  });

  it('removes pierce and max character count from the account card', () => {
    expect(source).not.toContain('account.pierce');
    expect(source).not.toContain('account.maxCharacters');
    expect(source).not.toContain('피어스');
    expect(source).not.toContain('287명');
  });

  it('removes account attack from the account card', () => {
    expect(source).not.toContain('계정공');
    expect(source).not.toContain('account.accountAttack');
    expect(source).not.toContain('account.cardAttack');
  });

  it('keeps season uniforms as a standalone page outside the PVE submenu', () => {
    const pveItemsLine = source.match(/const pveItems = \[(.*)\];/)?.[1] ?? '';

    expect(pveItemsLine).not.toContain('시즌 유니폼');
    expect(source).not.toContain("'시즌 유니폼': 'seasonUniforms'");
    expect(source).toContain('<NavItem icon="▥" label="시즌 유니폼" active={section === \'seasonUniforms\'} onClick={() => selectSection(\'seasonUniforms\')} />');
  });
});
