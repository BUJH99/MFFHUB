import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./PvpModeSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');
const vibraniumTierIconPath = fileURLToPath(new URL('../../../public/mff-assets/pvp/tier-vibranium.svg', import.meta.url));

describe('PvpModeSection shared catalog picker usage', () => {
  it('uses the shared catalog DB picker helpers instead of local duplicate name/uniform matching', () => {
    expect(source).toContain("from '@/lib/catalogCharacterPicker'");
    expect(source).toContain('buildCatalogCharacterOptions');
    expect(source).toContain('catalogFallbackUniform');
    expect(source).not.toContain('const appCharacterByCatalogKey = new Map');
    expect(source).not.toContain('function toRestrictionSearchText');
    expect(source).toContain('option.displayName');
  });

  it('renders Team Battle Arena with one restriction panel and a 5 by 3 deck board', () => {
    expect(source).toContain('const TEAM_BATTLE_RESTRICTION_SLOT_COUNT = 5');
    expect(source).toContain('const TEAM_BATTLE_TEAM_COUNT = 5');
    expect(source).toContain('const TEAM_BATTLE_MEMBERS_PER_TEAM = 3');
    expect(source).toContain('function TeamBattleArenaLayout');
    expect(source).toContain('function TeamBattleRestrictionPanel');
    expect(source).toContain('캐릭터 제한 목록');
    expect(source).toContain("const deckTitle = '덱 구성';");
    expect(source).not.toContain('덱 구성 (5행 3열)');
    expect(source).toContain("content === 'Team Battle Arena'");
  });

  it('keeps Team Battle deck slots compact and shows uniform names under character names', () => {
    expect(source.match(/member\.uniformName/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('min-h-[92px]');
    expect(source).not.toContain('md:min-h-[122px]');
    expect(source).toContain('min-h-[78px]');
    expect(source).toContain('md:min-h-[96px]');
  });

  it('uses an English red Pretendard title for Team Battle Arena', () => {
    expect(source).toContain('modeTitle="TEAM BATTLE ARENA"');
    expect(source).toContain('text-red-600');
    expect(source).toContain("fontFamily: 'Pretendard");
    expect(source).not.toContain('>팀 배틀 아레나</h1>');
  });

  it('keeps one empty restriction slot available after the first five are filled', () => {
    expect(source).toContain('Math.max(TEAM_BATTLE_RESTRICTION_SLOT_COUNT, restrictions.length + 1)');
    expect(source).not.toContain('Math.max(TEAM_BATTLE_RESTRICTION_SLOT_COUNT, restrictions.length)');
  });

  it('shows a current tier button to the left of the Team Battle title', () => {
    expect(source).toContain('function TeamBattleTierButton');
    expect(source).toContain('const TEAM_BATTLE_TIERS');
    expect(source).toContain("useState<TeamBattleTierId>('vibranium')");
    expect(source).toContain('현재 티어: ${currentTier.label}');
    expect(source).toContain('/mff-assets/pvp/tier-vibranium.svg');
    expect(existsSync(vibraniumTierIconPath)).toBe(true);
  });

  it('uses a wide Team Battle layout with a right-side best combination deck panel', () => {
    expect(source).toContain('function TeamBattleBestDeckPanel');
    expect(source).toContain('function PvpBestIconButton');
    expect(source).toContain('xl:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]');
    expect(source).toContain('<TeamBattleBestDeckPanel');
  });

  it('renders Team Battle BEST as compact icon rows with one strongest team pinned above', () => {
    expect(source).toContain('strongestTeamIndex');
    expect(source).toContain('strongestTeamKey');
    expect(source).toContain('가장 강한팀');
    expect(source).toContain('role="button"');
    expect(source).toContain('onClick={() => setStrongestTeamKey(row.rowKey)}');
    expect(source).toContain("event.key === 'Enter' || event.key === ' '");
    expect(source).not.toContain('팀 ${teamIndex + 1} 대표 지정');
    expect(source).toContain('rounded-full');
    expect(source).toContain('{rows.length}행');
    expect(source).toContain('draggable');
    expect(source).toContain('moveTeamRow');
    expect(source).toContain('onDragEnter');
    expect(source).toContain('startViewTransition');
    expect(source).toContain('transition-[transform,opacity,background-color,border-color,box-shadow]');
    expect(source).toContain("event.dataTransfer.setData('text/plain', row.rowKey)");
    expect(source).not.toContain('베스트 조합 덱 구성');
  });

  it('adds separate Otherworld Bronze-Platinum and Vibranium-Challenger deck rows', () => {
    expect(source).toContain('function getPvpDeckRows');
    expect(source).toContain('function PvpTierIconStrip');
    expect(source).toContain('function PvpDeckRowBadge');
    expect(source).toContain("content === 'Otherworld'");
    expect(source).toContain('otherworld-bronze-platinum');
    expect(source).toContain('otherworld-vibranium-challenger');
    expect(source).toContain('브론즈~플래 덱');
    expect(source).toContain('비브라늄~챌린저 덱');
    expect(source).toContain("tierIds: ['bronze', 'silver', 'gold', 'platinum']");
    expect(source).toContain("tierIds: ['vibranium', 'challenger']");
    expect(source).not.toContain("content === 'Otherworld' ? '덱 구성 (5인 2행)'");
    expect(source).not.toContain('덱 구성 (5인 2행)');
  });

  it('reuses the arena edit layout for Otherworld and Timeline Battle', () => {
    expect(source).toContain('function PvpModeArenaLayout');
    expect(source).toContain('function PvpModeDeckBoard');
    expect(source).toContain('headerLead={<TeamBattleTierButton currentTier={currentTier} selectedTierId={selectedTierId} onSelectTier={setSelectedTierId} />}');
    expect(source).toContain("membersPerTeam === 5 ? 'grid-cols-5' : 'grid-cols-3'");
    expect(source).toContain('<PvpBestDeckPanel');
    expect(source).toContain("modeTitle={pvpArenaTitles[content]}");
    expect(source).not.toContain('function DeckCard');
  });

  it('removes PVP score logic and team-role labels from editable PVP decks', () => {
    expect(source).toContain('function PvpBestIconButton');
    expect(source).toContain('<h2 className="text-2xl font-black text-red-600">BEST</h2>');
    expect(source).toContain('pickerLabel={rowLabel ? `BEST · ${rowLabel} ${slot.slotIndex + 1}번 슬롯`');
    expect(source).not.toContain('function PvpBestSlotButton');
    expect(source).not.toContain('베스트 조합 덱 구성');
    expect(source).not.toContain('TOP PICK');
    expect(source).not.toContain('평균');
    expect(source).not.toContain('averageMemberScore');
    expect(source).not.toContain('scoreForCharacter');
    expect(source).not.toContain('option.score');
    expect(source).not.toContain('member.score');
    expect(source).not.toContain('slot.teamLabel');
    expect(source).not.toContain('team.label');
  });
});
