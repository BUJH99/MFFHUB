import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const appShellSource = readSource('./AppShell.tsx');
const headerSource = readSource('./layout/Header.tsx');
const sidebarSource = readSource('./Sidebar.tsx');

describe('mobile sidebar toggle', () => {
  it('wires the mobile header menu button to app state', () => {
    expect(appShellSource).toContain('mobileSidebarOpen');
    expect(appShellSource).toContain('setMobileSidebarOpen(true)');
    expect(appShellSource).toContain('mobileOpen={mobileSidebarOpen}');
    expect(appShellSource).toContain('onMobileClose={() => setMobileSidebarOpen(false)}');
    expect(appShellSource).toContain('onOpenMobileMenu={() => setMobileSidebarOpen(true)}');
  });

  it('makes the hamburger button accessible and clickable', () => {
    expect(headerSource).toContain('onOpenMobileMenu');
    expect(headerSource).toContain('aria-label="좌측 메뉴 열기"');
    expect(headerSource).toContain('onClick={onOpenMobileMenu}');
  });

  it('renders a mobile drawer and closes it after navigation', () => {
    expect(sidebarSource).toContain('mobileOpen?: boolean');
    expect(sidebarSource).toContain('onMobileClose?: () => void');
    expect(sidebarSource).toContain('fixed inset-0 z-50 xl:hidden');
    expect(sidebarSource).toContain('aria-label="좌측 메뉴 닫기"');
    expect(sidebarSource).toContain('selectSection');
    expect(sidebarSource).toContain('onMobileClose?.()');
  });
});
