import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./AnalysisSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('AnalysisSection owned roster charts', () => {
  it('renders my-character build charts instead of removed score/type charts', () => {
    expect(source).toContain('data-testid="owned-character-analysis"');
    expect(source).toContain('나의 캐릭터 입력 기반 통계');
    expect(source).toContain('성장 단계 분포');
    expect(source).toContain('레벨 구간 분포');
    expect(source).toContain('유니폼 보유 분석');
    expect(source).toContain('전용 아티팩트 보유');
    expect(source).toContain('CTP/특장 장착 종류');
    expect(source).toContain('미보유');
    expect(source).toContain('일반');
    expect(source).toContain('고급');
    expect(source).toContain('희귀');
    expect(source).toContain('영웅');
    expect(source).toContain('전설');
    expect(source).toContain('신화');
    expect(source).not.toContain('장비 선택 현황');
    expect(source).not.toContain('장비 보강 포인트');
    expect(source).not.toContain('전투 타입 분포');
    expect(source).not.toContain('콘텐츠 평균 점수');
    expect(source).not.toContain('상위 PVE 후보');
    expect(source).not.toContain('type="number"');
    expect(source).not.toContain('recordScoreStorageKey');
  });

  it('builds charts from My Character local storage and roster fallbacks', () => {
    expect(source).toContain("myCharacterStorageKey = 'mff-data-hub:my-character-builds:v1'");
    expect(source).toContain('readStoredMyBuilds()');
    expect(source).toContain('catalogCharacters');
    expect(source).toContain('storedMyBuilds[character.id]');
    expect(source).toContain('normalizeBuild(character, stored)');
    expect(source).toContain('uniformRankData(rows)');
    expect(source).toContain('artifactStarData(rows)');
    expect(source).toContain('ctpKindData(rows)');
    expect(source).toContain('parseCtpName(ctp)');
  });
});
