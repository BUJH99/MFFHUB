import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./AllianceBattleSchedule.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('AllianceBattleSchedule picker scroll behavior', () => {
  it('locks page scrolling and keeps ABX/ABL character picking inside the modal panes', () => {
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('previousBodyOverflow');
    expect(source).toContain('data-testid="alliance-battle-picker"');
    expect(source).toContain('data-testid="alliance-battle-character-scroll"');
    expect(source).toContain('data-testid="alliance-battle-uniform-scroll"');
    expect(source.match(/overscroll-contain/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('fixed bottom-4 right-4');
  });

  it('uses a team-kind toggle instead of rendering monster and normal combos together', () => {
    expect(source).toContain('data-testid={`alliance-battle-team-toggle-${kind}`}');
    expect(source).toContain('activeTeamKind');
    expect(source).toContain('UsageRankingPanel');
    expect(source).toContain('딜러 순위');
    expect(source).toContain('버퍼 순위');
    expect(source).not.toContain('<th className="border border-black px-2 py-2">조건명</th>');
    expect(source).not.toContain('<th className="border border-black px-2 py-2">캔슬</th>');
    expect(source).not.toContain('<th className="border border-black px-2 py-2">굇수 조합</th>');
    expect(source).not.toContain('<th className="border border-black px-2 py-2">일반 조합</th>');
    expect(source).not.toContain('<th className="border border-black px-2 py-2">딜러 사용횟수</th>');
    expect(source).not.toContain('<th className="border border-black px-2 py-2">버퍼 사용횟수</th>');
  });

  it('lets each character slot toggle between dealer and buffer independently', () => {
    expect(source).toContain('roleOverrides');
    expect(source).toContain('getSlotRole');
    expect(source).toContain('toggleSlotRole');
    expect(source).toContain('data-testid={`alliance-battle-toggle-role-${slotKey}`}');
    expect(source).toContain('role={getSlotRole(content, round, teamKind, index, roleOverrides)}');
    expect(source).toContain("previous[slotKey] === 'dealer' ? 'buffer' : 'dealer'");
    expect(source).not.toContain("index === 0 ? '리더' : index === 1 ? '딜러' : '지원'");
    expect(source).not.toContain("const role: UsageRoleGroup = index === 1 ? 'dealer' : 'buffer';");
    expect(source).not.toContain("role={index === dealerIndex ? 'dealer' : 'buffer'}");
    expect(source).not.toContain('getDealerSlotIndex(content, day.round, teamKind');
  });

  it('keeps the ABX/ABL sheet compact and renders dealer and buffer rankings without inner scrollbars', () => {
    expect(source).toContain('data-testid="alliance-battle-compact-table-layout"');
    expect(source).toContain('grid min-w-[276px] grid-cols-3 items-center gap-1');
    expect(source).toContain('grid-cols-[18px_40px_22px]');
    expect(source).toContain('flex flex-nowrap items-center justify-center gap-1 leading-none');
    expect(source).toContain('min-h-[64px]');
    expect(source).toContain('max-w-[112px] whitespace-normal break-words text-[9px] font-bold leading-[1.05] text-purple-600');
    expect(source).not.toContain('max-w-[64px] truncate text-[9px] font-bold leading-tight text-purple-600');
    expect(source).toContain('w-[136px] border border-black bg-white px-0.5 py-0.5 align-middle');
    expect(source).toContain('w-[104px] border border-black bg-white px-0.5 py-0.5 align-middle');
    expect(source).toContain('max-w-[76px] grid-cols-2 border-t border-black text-center text-[10px] font-black leading-none');
    expect(source).toContain('data-testid="alliance-battle-usage-ranking-lists"');
    expect(source).toContain('lg:grid-cols-2');
    expect(source).toContain('table className="w-full min-w-[680px]');
    expect(source).not.toContain('max-h-[420px] overflow-y-auto');
    expect(source).not.toContain('max-h-[390px] overflow-y-auto');
  });

  it('splits the ABX/ABL rotation into two 14-round table chunks and places rankings below the tables', () => {
    expect(source).toContain('calendar.slice(0, 14)');
    expect(source).toContain('calendar.slice(14, 28)');
    expect(source).toContain('data-testid="alliance-battle-round-split"');
    expect(source).toContain('data-testid={`alliance-battle-round-chunk-${chunk.label}`}');
    expect(source).toContain('1-14회');
    expect(source).toContain('15-28회');
    expect(source).toContain('2xl:grid-cols-2');
    expect(source).not.toContain('xl:grid-cols-[minmax(0,600px)_minmax(520px,1fr)]');

    const tableLayoutIndex = source.indexOf('data-testid="alliance-battle-compact-table-layout"');
    const analysisIndex = source.indexOf('<UsageAnalysisPanel summary={usageSummary}');
    expect(analysisIndex).toBeGreaterThan(tableLayoutIndex);
  });

  it('packs usage rankings to the left and places detailed dealer/buffer rankings on the right', () => {
    expect(source).toContain('function UsageAnalysisPanel');
    expect(source).toContain('data-testid="alliance-battle-usage-analysis-layout"');
    expect(source).toContain('xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]');
    expect(source).toContain('data-testid="alliance-battle-usage-detail-panel"');
    expect(source).toContain('data-testid="alliance-battle-usage-detail-sections"');
    expect(source).toContain('2xl:grid-cols-2');
    expect(source).toContain('<UsageRoleSection role="dealer" groups={summary.dealers} teamKind={teamKind} />');
    expect(source).toContain('<UsageRoleSection role="buffer" groups={summary.buffers} teamKind={teamKind} />');
    expect(source).toContain('<UsageAnalysisPanel summary={usageSummary} teamKind={activeTeamKind} />');
    expect(source).not.toContain('<UsageRankingPanel summary={usageSummary} content={content} teamKind={activeTeamKind} />');
    expect(source).not.toContain('<UsageCountSummaryPanel summary={usageSummary} content={content} teamKind={activeTeamKind} />');
  });

  it('summarizes ABX and ABL usage together while following the selected team-kind toggle', () => {
    expect(source).toContain('buildUsageLookup(calendar, savedMemberOverrides, savedCtpOverrides, { contents: usageContents, teamKinds: [activeTeamKind], roleOverrides: savedRoleOverrides })');
    expect(source).toContain('ABX + ABL');
    expect(source).not.toContain('ABX/ABL 합산 · 현재 토글 기준 · 많이 쓰는 순');
    expect(source).not.toContain('buildUsageLookup(calendar, memberOverrides, ctpOverrides, { contents: usageContents, teamKinds: [activeTeamKind], roleOverrides })');
    expect(source).not.toContain('{ contents: [content], teamKinds: [activeTeamKind], roleOverrides }');
    expect(source).not.toContain('UsageAnalysisPanel({ summary, content, teamKind }');
  });

  it('uses the active ABX or ABL table title and keeps reset rounds uncolored unless today', () => {
    expect(source).toContain('<h2 className="text-2xl font-black text-yellow-300">{meta.title}</h2>');
    expect(source).toContain("day.isToday ? 'bg-lime-50' : 'bg-white'");
    expect(source).not.toContain('ABX & ABL 표');
    expect(source).not.toContain("day.isToday ? 'bg-lime-50' : day.isResetDay ? 'bg-amber-50' : 'bg-white'");
  });

  it('uses an explicit full save to refresh usage rankings after character or dealer edits', () => {
    expect(source).toContain('savedMemberOverrides');
    expect(source).toContain('savedCtpOverrides');
    expect(source).toContain('savedRoleOverrides');
    expect(source).toContain('hasPendingCustomizations');
    expect(source).toContain('writeStoredCustomizations({ memberOverrides, ctpOverrides, roleOverrides })');
    expect(source).toContain('const saveAllCustomizations = () => {');
    expect(source).toContain('data-testid="alliance-battle-save-all"');
    expect(source).toContain('전체 저장');
    expect(source).toContain('사용순위 갱신');
    expect(source).not.toContain('[customizationsReady, memberOverrides, ctpOverrides, roleOverrides]');
  });

  it('filters ABX/ABL replacement choices by each round condition', () => {
    expect(source).toContain('type AllianceBattleCondition');
    expect(source).toContain('condition?: AllianceBattleCondition');
    expect(source).toContain('matchesAllianceBattleCondition');
    expect(source).toContain('getRestrictedPickerMembers');
    expect(source).toContain('picker.condition');
    expect(source).toContain('data-testid="alliance-battle-picker-condition"');
    expect(source).toContain("conditionLabel: formatRestrictionLabel(condition)");
    expect(source).toContain('picker.conditionLabel ? (');
    expect(source).toContain('const restrictedCharacterPickerMembers = useMemo(() => getRestrictedPickerMembers(picker?.condition), [picker?.condition]);');
    expect(source).not.toContain('if (!query) return characterPickerMembers;');
  });

  it('renders the ABX/ABL CTP picker as a fixed 5 by 3 grid', () => {
    expect(source).toContain('data-testid="alliance-battle-ctp-grid"');
    expect(source).toContain('grid-cols-5 grid-rows-3');
    expect(source).toContain('flex min-h-[64px] flex-col items-center justify-center gap-1.5');
    expect(source).not.toContain('grid-cols-[repeat(auto-fill,minmax(96px,1fr))]');
  });

  it('uses the requested ABX/ABL combo schedule and places Infinity Challenge on ABL', () => {
    const expectedAbxCombos = [
      "1: combo(['whiteFox', 'mistyKnight', 'lunaSnow'], ['whiteFox', 'mistyKnight', 'lunaSnow']),",
      '2: abxFreeCombo,',
      "5: combo(['sin', 'bullseye', 'blackCat'], ['sin', 'blackCat', 'bullseye']),",
      "7: combo(['wolverine', 'gambit', 'cyclops'], ['silverSamurai', 'cyclops', 'gambit']),",
      "18: combo(['mysterio', 'doctorStrange', 'ironMan'], ['mysterio', 'doctorStrange', 'enchantress']),",
      "26: combo(['hulk', 'ares', 'winterSoldier'], ['taskmaster', 'ares', 'redHulk']),",
      "28: combo(['sin', 'scarletWitch', 'enchantress'], ['sin', 'scarletWitch', 'enchantress']),",
    ];
    const expectedAblCombos = [
      "1: combo(['doctorVoodoo', 'mephisto', 'ghostPanther'], ['doctorVoodoo', 'mephisto', 'ghostPanther']),",
      '2: ablFireCombo,',
      "6: combo(['taskmaster', 'winterSoldier', 'ares'], ['taskmaster', 'ares', 'redHulk']),",
      "7: combo(['enchantress', 'hades', 'ares'], ['proximaMidnight', 'hades', 'enchantress']),",
      "13: combo(['x23', 'storm', 'dazzler'], ['dazzler', 'polaris', 'storm']),",
      "22: combo(['novaRichardRider', 'zeus', 'odin'], ['novaRichardRider', 'ronan', 'loki']),",
      "27: combo(['kidOmega', 'cyclops', 'gambit'], ['silverSamurai', 'cyclops', 'gambit']),",
      "28: combo(['agentVenom', 'mbaku', 'venom'], ['agentVenom', 'mbaku', 'venom']),",
    ];

    expectedAbxCombos.forEach((comboLine) => expect(source).toContain(comboLine));
    expectedAblCombos.forEach((comboLine) => expect(source).toContain(comboLine));
    expect(source).toContain("if (content === 'ABL' && !condition && day.infinite) return infinityChallengeCombo;");
    expect(source).toContain("content === 'ABX' ? day.abx : day.abl || day.infinite");
    expect(source).toContain('data-testid="alliance-battle-empty-combo"');
    expect(source).toContain('없음');
    expect(source).not.toContain('3: infinityChallengeCombo,');
    expect(source).not.toContain("if (content === 'ABX' && !condition && day.infinite) return infinityChallengeCombo;");
    expect(source).not.toContain('if (!condition && day.infinite) return infinityChallengeCombo;');
  });
});
