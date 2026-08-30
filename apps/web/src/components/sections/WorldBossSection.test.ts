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
    expect(source).toContain('h-[min(820px,calc(100dvh-3rem))]');
    expect(source).toContain('grid min-h-0 flex-1 grid-rows-2');
    expect(source).toContain('md:grid-rows-1');
    expect(source).toContain('min-h-0');
    expect(source).toContain('data-testid="world-boss-picker"');
    expect(source).toContain('data-testid="world-boss-character-scroll"');
    expect(source).toContain('data-testid="world-boss-uniform-scroll"');
  });

  it('uses catalog names directly because the data catalog stores Korean names', () => {
    expect(source).not.toContain('getKoreanCharacterName');
    expect(source).toContain('characterName: option.character.name');
  });

  it('adds a complete three-character set instead of appending one hero immediately', () => {
    expect(source).toContain('aria-label={`${boss.name} ${stage.range}층 캐릭터 Team 추가`}');
    expect(source).toContain('title="Team 추가"');
    expect(source).toContain('Team 저장');
    expect(source).toContain('draftMembers.length !== WORLD_BOSS_TEAM_SIZE');
    expect(source).toContain('onSubmit(draftMembers)');
    expect(source).toContain('current.some((member) => member.characterId === option.character.id)');
    expect(source).toContain('disabled={alreadySelected || draftMembers.length >= WORLD_BOSS_TEAM_SIZE}');
    expect(source).not.toContain('DB {stageOptionCounts.get(stageKey) ?? 0}명');
    expect(source).not.toContain('onSelect={addPick}');
    expect(source).not.toContain('추가된 월드보스 조건 영웅 없음');
  });

  it('keeps the original compact stage row while visually grouping each saved team', () => {
    expect(source).toContain('flex flex-nowrap justify-start gap-1 overflow-hidden');
    expect(source).toContain('grid h-8 w-8 shrink-0 place-items-center');
    expect(source).toContain('md:grid-cols-[max-content_max-content_minmax(0,1fr)]');
    expect(source).toContain('data-testid="world-boss-set-list"');
    expect(source).toContain('flex min-h-11 w-full flex-wrap gap-1');
    expect(source).toContain('data-testid="world-boss-character-set"');
    expect(source).toContain('role="group"');
    expect(source).toContain('Team{teamNumber}');
    expect(source).not.toContain('세트 {teamNumber}');
    expect(source).not.toContain('3인 완성');
    expect(source).not.toContain('이전 데이터 ·');
    expect(source).toContain('grid h-11 w-11 shrink-0 place-items-center');
    expect(source).not.toContain('min-h-[92px]');
    expect(source).not.toContain('min-h-[96px]');
    expect(source).toContain('<StageTeamCard');
    expect(source).toContain('<StageTeamMember');
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
    expect(source).not.toContain('<StagePickCard');
  });

  it('uses a versioned team store and migrates legacy individual picks', () => {
    expect(source).toContain("stageTeamsStorageKey = 'mff-data-hub:world-boss-stage-teams:v3'");
    expect(source).toContain("legacyPicksStorageKey = 'mff-data-hub:world-boss-stage-picks:v2'");
    expect(source).toContain('normalizeWorldBossStageTeamStore(parsed)');
    expect(source).toContain('migrateLegacyWorldBossStagePicks(parsed)');
    expect(source).toContain('setStageTeams(readStoredTeams())');
    expect(source).toContain('window.localStorage.setItem(stageTeamsStorageKey, JSON.stringify(stageTeams))');
  });

  it('exposes the team picker as a modal dialog with clear selection status', () => {
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-labelledby="world-boss-set-picker-title"');
    expect(source).toContain('data-testid="world-boss-set-selection-count"');
    expect(source).toContain('role="status"');
    expect(source).toContain('data-testid="world-boss-set-confirm"');
    expect(source).toContain('Team Choice');
    expect(source).toContain('>Clear</button>');
    expect(source).toContain('Team 저장');
    expect(source).toContain('Slot. {index + 1}');
    expect(source).not.toContain('선택한 캐릭터');
    expect(source).not.toContain('선택 초기화');
    expect(source).not.toContain('3인 세트 저장');
    expect(source).not.toContain('{index + 1}번 슬롯');
    expect(source).toContain('className="h-11 rounded-none border border-slate-200');
    expect(source).toContain('className="h-11 rounded-none bg-purple-600');
    expect(source).toContain('className="relative min-w-0 rounded-none border border-purple-100');
    expect(source).toContain('className="grid h-11 place-items-center rounded-none border border-dashed');
    expect(source).toContain("event.key === 'Escape'");
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
