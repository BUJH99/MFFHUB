import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const appShellSource = readSource('./AppShell.tsx');
const sidebarSource = readSource('./Sidebar.tsx');
const mobileNavSource = readSource('./MobileNav.tsx');
const headerSource = readSource('./layout/Header.tsx');
const navigationSource = readSource('../lib/navigation.ts');
const customOptimizerPath = fileURLToPath(new URL('./CustomOptimizer.tsx', import.meta.url));

describe('Custom optimizer page removal', () => {
  it('removes the custom optimizer route and desktop entry point', () => {
    expect(navigationSource).not.toContain("'custom'");
    expect(headerSource).not.toContain('CUSTOM OPTIMIZER');
    expect(appShellSource).not.toContain('CustomOptimizer');
    expect(appShellSource).not.toContain("section === 'custom'");
    expect(sidebarSource).not.toContain('커스텀 조합 추천');
    expect(sidebarSource).not.toContain("setSection('custom')");
  });

  it('removes the mobile recommendation tab and component file', () => {
    expect(mobileNavSource).not.toContain("'custom'");
    expect(mobileNavSource).not.toContain("['추천'");
    expect(mobileNavSource).toContain('grid-cols-4');
    expect(existsSync(customOptimizerPath)).toBe(false);
  });
});
