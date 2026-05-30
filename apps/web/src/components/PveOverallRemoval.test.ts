import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const appShellSource = readSource('./AppShell.tsx');
const sidebarSource = readSource('./Sidebar.tsx');
const headerSource = readSource('./layout/Header.tsx');
const navigationSource = readSource('../lib/navigation.ts');

describe('PVE Overall page removal', () => {
  it('removes PVE Overall from the visible app navigation and shell routing', () => {
    expect(sidebarSource).not.toContain('PVE Overall');
    expect(sidebarSource).not.toContain('pveOverall');
    expect(appShellSource).not.toContain('PveOverallSection');
    expect(appShellSource).not.toContain("section === 'pveOverall'");
  });

  it('removes the PVE Overall section id and header title', () => {
    expect(navigationSource).not.toContain("'pveOverall'");
    expect(headerSource).not.toContain('pveOverall');
    expect(headerSource).not.toContain('PVE OVERALL');
  });
});
