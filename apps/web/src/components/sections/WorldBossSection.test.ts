import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./WorldBossSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('WorldBossSection picker scroll behavior', () => {
  it('locks page scrolling while the hero picker is open', () => {
    expect(source).toContain('document.body.style.overflow');
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('previousBodyOverflow');
  });

  it('keeps wheel and touch scrolling inside the picker panes', () => {
    expect(source.match(/overscroll-contain/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(source).toContain('grid h-[58vh]');
    expect(source).toContain('min-h-0');
    expect(source).toContain('data-testid="world-boss-picker"');
    expect(source).toContain('data-testid="world-boss-character-scroll"');
    expect(source).toContain('data-testid="world-boss-uniform-scroll"');
  });

  it('uses catalog names directly because the data catalog stores Korean names', () => {
    expect(source).not.toContain('getKoreanCharacterName');
    expect(source).toContain('characterName: option.character.name');
  });

  it('keeps the add hero control inside the white pick bar without DB count text', () => {
    expect(source).toContain('aria-label={`${boss.name} ${stage.range}층 조건 영웅 추가`}');
    expect(source).toContain('title="영웅 추가"');
    expect(source).toContain('grid h-9 w-9 shrink-0 place-items-center');
    expect(source).not.toContain('DB {stageOptionCounts.get(stageKey) ?? 0}명');
    expect(source).not.toContain('+ 영웅');
    expect(source).not.toContain('추가된 월드보스 조건 영웅 없음');
  });

  it('keeps stage rows thin while fitting up to four condition icons in one line', () => {
    expect(source).toContain('flex flex-nowrap justify-start gap-1 overflow-hidden');
    expect(source).toContain('grid h-8 w-8 shrink-0 place-items-center');
    expect(source).toContain('md:grid-cols-[max-content_max-content_minmax(0,1fr)]');
    expect(source).toContain('flex min-h-9 w-full flex-wrap gap-1 rounded-lg');
    expect(source).toContain('<StageUnlockIcons boss={boss} stage={stage} active={stageActive} />');
    expect(source).toContain('function StageUnlockIcons');
    expect(source).toContain('unlockBelongsToStageRange(stage.range, unlock.stage)');
    expect(source).toContain('function unlockBucketStartForStageRange');
    expect(source).toContain('if (!parsedRange || parsedRange.start < 10) return undefined;');
    expect(source).toContain('Math.floor(parsedRange.start / 10) * 10');
    expect(source).toContain('unlockStage === unlockBucketStart');
    expect(source).toContain('function unlockBucketLabel');
    expect(source).toContain('`${unlockBucketStart}-${unlockBucketStart + 9}층`');
    expect(source).not.toContain('function UnlockStrip');
    expect(source).not.toContain('<UnlockStrip boss={selectedBoss} />');
    expect(source).not.toContain('층 해금');
    expect(source).not.toContain('md:grid-cols-[minmax(104px,auto)_148px_176px]');
    expect(source).not.toContain('md:grid-cols-[72px_150px_minmax(0,1fr)]');
    expect(source).not.toContain('flex min-h-12 flex-wrap gap-2');
  });

  it('stores current stage and conquest level separately for each world boss', () => {
    expect(source).toContain("worldBossProgressStorageKey = 'mff-data-hub:world-boss-progress:v1'");
    expect(source).toContain('type BossProgress');
    expect(source).toContain('readStoredProgress');
    expect(source).toContain('updateBossProgress');
    expect(source).toContain('bossProgress[boss.id] ?? createEmptyBossProgress()');
  });

  it('renders editable current stage and conquest level fields on the selected boss hero image', () => {
    expect(source).toContain('function BossHero');
    expect(source).toContain('function BossProgressControl');
    expect(source).toContain('adjustProgressValue');
    expect(source).toContain('도전 층');
    expect(source).toContain('정복 Lv');
    expect(source).toContain('aria-label={`${label} 감소`}');
    expect(source).toContain('aria-label={`${label} 증가`}');
    expect(source).toContain('bg-white/[0.92]');
    expect(source).toContain('<BossHero boss={selectedBoss} progress={selectedBossProgress} onProgressChange={updateBossProgress} />');
    expect(source).not.toContain('function BossProgressPanel');
  });

  it('places compact boss cards as a left two-column list beside the selected boss image', () => {
    expect(source).toContain('min-h-[72px]');
    expect(source).toContain('xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]');
    expect(source).toContain('grid gap-2 sm:grid-cols-2 xl:grid-cols-2');
    expect(source).toContain('{currentStageLabel}');
    expect(source).toContain('{conquestLevelLabel}');
    expect(source).not.toContain('grid gap-2 sm:grid-cols-2 lg:grid-cols-5');
    expect(source).not.toContain('min-h-[148px]');
    expect(source).not.toContain('pb-[70px]');
  });

  it('subtly highlights the condition row containing the entered challenge stage', () => {
    expect(source).toContain('stageRangeIncludes(stage.range, currentStage)');
    expect(source).toContain('currentStage={selectedCurrentStage}');
    expect(source).toContain('border-purple-300 bg-purple-50/80');
    expect(source).toContain('shadow-[0_0_0_3px_rgba(168,85,247,0.12),0_12px_26px_rgba(88,28,135,0.08)]');
  });
});
