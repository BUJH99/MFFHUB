import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const accountInsightsSource = readSource('./AccountInsights.tsx');
const ctpInventorySource = readSource('./CtpInventoryPanel.tsx');
const dashboardSectionSource = readSource('./sections/DashboardSection.tsx');
const analysisSectionSource = readSource('./sections/AnalysisSection.tsx');
const usageStatsPath = fileURLToPath(new URL('./UsageStats.tsx', import.meta.url));
const rankingsPath = fileURLToPath(new URL('./Rankings.tsx', import.meta.url));

describe('dashboard text cleanup', () => {
  it('removes explanatory log-style copy from account panels', () => {
    expect(accountInsightsSource).not.toContain('카드별 교체 버튼으로 장착 카드를 선택하고, 옵션과 세공 색상으로 공격/피어스를 자동 계산합니다.');
    expect(accountInsightsSource).not.toContain('각 소드별 마스터리 숫자와 실제 게임 옵션 6줄을 편집합니다.');
    expect(accountInsightsSource).not.toContain('각 팀업 컬렉션 레벨을 개별 입력하고 대상 캐릭터 적용 범위를 확인합니다.');
    expect(ctpInventorySource).not.toContain('일반, 강력, 찬란 수량을 CTP별로 관리합니다.');
  });

  it('removes monthly usage and top recommendation panels from dashboard and analysis routes', () => {
    expect(dashboardSectionSource).not.toContain('UsageStats');
    expect(dashboardSectionSource).not.toContain('Rankings');
    expect(analysisSectionSource).not.toContain('UsageStats');
    expect(analysisSectionSource).not.toContain('Rankings');
    expect(existsSync(usageStatsPath)).toBe(false);
    expect(existsSync(rankingsPath)).toBe(false);
  });

  it('splits character info into dedicated card, X-sword, team-up, and CTP pages', () => {
    expect(accountInsightsSource).toContain("export type AccountSpecPage = 'cards' | 'xSwords' | 'teamUps'");
    expect(accountInsightsSource).toContain('data-testid={pageMeta.testId}');
    expect(accountInsightsSource).not.toContain('카드 / X-소드 / 팀업');
    expect(dashboardSectionSource).toContain("page: AccountSpecPage | 'ctp'");
    expect(dashboardSectionSource).toContain('<AccountSpecPanel page={page} />');
  });

  it('keeps CTP equipped and spare counts compact in each inventory card header', () => {
    expect(ctpInventorySource).toContain('function CompactCtpStat');
    expect(ctpInventorySource).toContain("'SEMI PVE': \"S'PVE\"");
    expect(ctpInventorySource).toContain("'SEMI PVP': \"S'PVP\"");
    expect(ctpInventorySource).toContain('xl:grid-cols-2');
    expect(ctpInventorySource).toContain('rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm');
    expect(ctpInventorySource).toContain('h-20 w-20');
    expect(ctpInventorySource).toContain('min-w-0 flex-[1_1_220px]');
    expect(ctpInventorySource).toContain('min-w-0 truncate text-3xl font-black text-slate-950');
    expect(ctpInventorySource).toContain('{ctpRoleDisplayLabels[definition.role]}</span>');
    expect(ctpInventorySource).toContain('<CompactCtpStat label="장착" value={equippedTotal} icon={<ShieldCheck size={22} strokeWidth={2.4} />} />');
    expect(ctpInventorySource).toContain('<CompactCtpStat label="여유" value={spare} icon={<RotateCcw size={22} strokeWidth={2.4} />} tone="text-emerald-700" />');
    expect(ctpInventorySource).toContain('text-5xl font-black leading-none text-slate-950');
    expect(ctpInventorySource).toContain('grid place-items-center gap-2 rounded-none');
    expect(ctpInventorySource).toContain('[font-family:Pretendard,system-ui,sans-serif]');
    expect(ctpInventorySource).toContain('grid h-full w-full place-items-center');
    expect(ctpInventorySource).not.toContain('mt-3 grid grid-cols-2 gap-2 text-center text-[11px] font-black');
  });

  it('shows card attack as physical and energy totals with Korean pierce wording', () => {
    expect(accountInsightsSource).toContain('물리공격력 +{formatNumber(cardPhysicalAttack)}%');
    expect(accountInsightsSource).toContain('에너지공격력 +{formatNumber(cardEnergyAttack)}%');
    expect(accountInsightsSource).toContain('const cardPhysicalAttack = round1(cardAllBasicAttack + Number(cardTotalStats.physicalAttack ?? 0))');
    expect(accountInsightsSource).toContain('const cardEnergyAttack = round1(cardAllBasicAttack + Number(cardTotalStats.energyAttack ?? 0))');
    expect(accountInsightsSource).toContain('관통 {formatNumber(customTotalPierce)}%');
    expect(accountInsightsSource).not.toContain('계정공 {formatNumber(customAccountAttack)}%');
    expect(accountInsightsSource).not.toContain('피어스 {formatNumber(customTotalPierce)}%');
    expect(accountInsightsSource).not.toContain('Number(xSwordSummary.stats.physicalAttack');
    expect(accountInsightsSource).not.toContain('Number(xSwordSummary.stats.energyAttack');
  });

  it('removes duplicated card deck summary metrics from the card effects panel', () => {
    expect(accountInsightsSource).not.toContain('CardEffectMetric');
    expect(accountInsightsSource).not.toContain('카드 덱 1');
    expect(accountInsightsSource).not.toContain('옵션 자동 합산');
    expect(accountInsightsSource).not.toContain('파랑 별');
  });

  it('moves the card effects label into the card section heading', () => {
    expect(accountInsightsSource).toContain('<p className="text-xs font-bold text-slate-500">전체 카드 효과</p>');
    expect(accountInsightsSource).not.toContain('Comic Card Effects');
    expect(accountInsightsSource).not.toContain('<h4 className="text-2xl font-black text-slate-950">전체 카드 효과</h4>');
  });
});
