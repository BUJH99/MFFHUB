import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./Header.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('Header action buttons', () => {
  it('removes the heart action and turns the gear into diagnostics', () => {
    expect(source).not.toContain('♡');
    expect(source).toContain('label="앱 진단"');
    expect(source).toContain("openSettings('diagnostics')");
  });

  it('adds settings/data management controls backed by local storage', () => {
    expect(source).toContain('설정 / 데이터 관리');
    expect(source).toContain("appStoragePrefix = 'mff-data-hub:'");
    expect(source).toContain("uiPreferenceStorageKey = 'mff-data-hub:ui-preferences:v1'");
    expect(source).toContain('createBackupJson()');
    expect(source).toContain('extractBackupData(importText)');
    expect(source).toContain('clearAppData');
    expect(source).toContain('createStorageRows');
    expect(source).toContain('createDiagnosticsText');
  });

  it('adds today todo and notification checklist state', () => {
    expect(source).toContain('오늘 할 일 / 알림');
    expect(source).toContain("dailyTaskStoragePrefix = 'mff-data-hub:daily-tasks:'");
    expect(source).toContain('getAllianceChallengeRulesForDate(today)');
    expect(source).toContain('defaultDailyTasks');
    expect(source).toContain('remainingTasks');
  });
});
