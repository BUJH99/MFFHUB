import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./RecordSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('RecordSection alliance score log', () => {
  it('keeps persistent date-based ABX, ABL, and Infinity Challenge score records in My Record', () => {
    expect(source).toContain("recordScoreStorageKey = 'mff-data-hub:alliance-score-analysis:v1'");
    expect(source).toContain("ABX: 0");
    expect(source).toContain("ABL: 0");
    expect(source).toContain("'Infinity Challenge': 0");
    expect(source).toContain('recordTotal(record)');
    expect(source).toContain('modeTotal(records, mode.content)');
    expect(source).toContain('recordsLoaded');
    expect(source).toContain('if (!recordsLoaded || typeof window ===');
    expect(source).toContain('data-testid="my-record-score-log"');
  });

  it('uses small round character icons for combo entry and an icon-only picker', () => {
    expect(source).toContain('function ComboIconSlots');
    expect(source).toContain('data-testid={`record-combo-icons-${record.date}-${content}`}');
    expect(source).toContain('grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full');
    expect(source).toContain('data-testid="record-combo-picker"');
    expect(source).toContain('grid h-10 w-10 place-items-center overflow-hidden rounded-full');
  });
});
