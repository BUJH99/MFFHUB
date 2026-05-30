import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

const dbSource = readSource('./EnhancedCharacterDB.tsx');
const appShellSource = readSource('./AppShell.tsx');
const sidebarSource = readSource('./Sidebar.tsx');
const mobileNavSource = readSource('./MobileNav.tsx');
const headerSource = readSource('./layout/Header.tsx');
const navigationSource = readSource('../lib/navigation.ts');
const expectedOdinBlessingAssets = [
  'uru_amplify.png',
  'uru_balance.png',
  'uru_focus.png',
  'uru_fortitude.png',
  'uru_heal.png',
  'uru_insight.png',
  'uru_magic.png',
  'uru_resist.png',
  'uru_steel.png',
  'uru_strike.png',
  'uru_toughness.png',
  'uru_will.png',
  'uru_flame.png',
  'uru_chill.png',
  'uru_lightning.png',
  'uru_poison.png',
  'uru_mind.png',
];
const expectedTierIconAssets = [
  'tier-1.png',
  'tier-2.png',
  'tier-3.png',
  'tier-4.png',
];

describe('My Characters page', () => {
  it('adds a standalone My Characters section that reuses the character DB component', () => {
    expect(navigationSource).toContain("'myCharacters'");
    expect(headerSource).toContain("myCharacters: 'MY CHARACTERS'");
    expect(sidebarSource).toContain('label="나의 캐릭터"');
    expect(mobileNavSource).toContain("['내캐릭'");
    expect(appShellSource).toContain("section === 'myCharacters'");
    expect(appShellSource).toContain('<EnhancedCharacterDB mode="my"');
  });

  it('switches the DB matrix into roster editing columns for owned character data', () => {
    expect(dbSource).toContain("mode?: 'catalog' | 'my'");
    expect(dbSource).toContain('myCharacterStorageKey');
    expect(dbSource).toContain("'my-character-matrix'");
    expect(dbSource).toContain('1열 티어 / 레벨 / 캐릭터');
    expect(dbSource).toContain('2열 아티팩트 / CTP / ISO-8');
    expect(dbSource).toContain('3열 우루');
    expect(dbSource).toContain('4열 유니폼 보유');
    expect(dbSource).toContain('const myCharacterMatrixColumnCount = 4');
    expect(dbSource).not.toContain('3열 장착 CTP');
    expect(dbSource).not.toContain('3열 오딘의 축복');
    expect(dbSource).not.toContain('5열 유니폼 보유');
  });

  it('keeps my roster fields compact and editable without artifact effect text', () => {
    expect(dbSource).toContain('MyCharacterCell');
    expect(dbSource).toContain('MyCharacterArtifactCell');
    expect(dbSource).toContain('EquippedCtpCell');
    expect(dbSource).toContain('Iso8EffectCell');
    expect(dbSource).toContain('UruCell');
    expect(dbSource).toContain('UniformOwnershipCell');
    expect(dbSource).toContain('data-testid={`my-character-uniform-owned-${character.id}-${index}`}');
    expect(dbSource).toContain('data-testid={`my-character-type-enhancement-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-elite-gear-${character.id}`}');
    expect(dbSource).toContain('미보유');
    expect(dbSource).not.toContain('my-character-artifact-effect');
  });

  it('paginates uniform ownership inside the cell when a character has more than six uniforms', () => {
    expect(dbSource).toContain('const uniformOwnershipPageSize = 6');
    expect(dbSource).toContain('const uniformRankOptions = [');
    expect(dbSource).toContain("{ value: 'normal', label: '일반' }");
    expect(dbSource).toContain("{ value: 'advanced', label: '고급' }");
    expect(dbSource).toContain("{ value: 'rare', label: '희귀' }");
    expect(dbSource).toContain("{ value: 'heroic', label: '영웅' }");
    expect(dbSource).toContain("{ value: 'legendary', label: '전설' }");
    expect(dbSource).toContain("{ value: 'mythic', label: '신화' }");
    expect(dbSource).toContain('uniformRanks: Record<string, UniformRankValue[]>');
    expect(dbSource).toContain('normalizeUniformRanks');
    expect(dbSource).toContain('const [uniformCellPage, setUniformCellPage]');
    expect(dbSource).toContain('Math.ceil(character.uniforms.length / uniformOwnershipPageSize)');
    expect(dbSource).toContain('.slice(visibleUniformStart, visibleUniformStart + uniformOwnershipPageSize)');
    expect(dbSource).toContain('data-testid={`my-character-uniform-page-grid-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-uniform-page-prev-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-uniform-page-next-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-uniform-page-indicator-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-uniform-rank-${character.id}-${index}-${rank.value}`}');
    expect(dbSource).toContain('setUniformCellPage(Math.floor(selectedUniformIndex / uniformOwnershipPageSize))');
  });

  it('uses clickable icon GUI controls instead of dropdown menus for my build fields', () => {
    expect(dbSource).toContain('TierIconButton');
    expect(dbSource).toContain('LevelStepperButton');
    expect(dbSource).toContain('CtpIconButton');
    expect(dbSource).toContain('UruKindButton');
    expect(dbSource).toContain('UruOptionButton');
    expect(dbSource).toContain('data-testid={`my-character-tier-button-${character.id}-${tier}`}');
    expect(dbSource).toContain('data-testid={`my-character-level-step-${character.id}-${direction}`}');
    expect(dbSource).toContain('data-testid={`my-character-ctp-slot-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-ctp-picker-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-ctp-button-${character.id}-${option.value}`}');
    expect(dbSource).toContain('data-testid={`my-character-ctp-grade-${character.id}-${grade.value}`}');
    expect(dbSource).toContain('data-testid={`my-character-uru-kind-${character.id}-${selectedSlotIndex}-${kind}`}');
    expect(dbSource).toContain('data-testid={`my-character-uru-type-${character.id}-${selectedSlotIndex}-${value}`}');
    expect(dbSource).toContain('openCtpPicker');
    expect(dbSource).toContain('setOpenCtpPicker((current) => !current)');
    expect(dbSource).not.toContain('aria-label={`${character.name} 현재 티어`}');
    expect(dbSource).not.toContain('aria-label={`${character.name} 장착 CTP`}');
    expect(dbSource).not.toContain('aria-label={`${character.name} 오딘의 축복 종류`}');
  });

  it('places CTP under artifact and selects CTP through a slot-click GUI picker', () => {
    expect(dbSource).toContain('function MyCharacterArtifactCell');
    expect(dbSource).toContain('ctp: string;');
    expect(dbSource).toContain('iso8Set: Iso8SetValue;');
    expect(dbSource).toContain('onCtpChange: (ctp: string) => void;');
    expect(dbSource).toContain('onIso8SetChange: (iso8Set: Iso8SetValue) => void;');
    expect(dbSource).toContain('<EquippedCtpCell character={character} ctp={ctp} onCtpChange={onCtpChange} />');
    expect(dbSource).toContain('<Iso8EffectCell character={character} iso8Set={iso8Set} onIso8SetChange={onIso8SetChange} />');
    expect(dbSource).toContain('iso8Set={myBuild.iso8Set}');
    expect(dbSource).toContain('onCtpChange={(ctp) => updateMyBuild(character, { ctp })}');
    expect(dbSource).toContain('onIso8SetChange={(iso8Set) => updateMyBuild(character, { iso8Set })}');
    expect(dbSource).not.toContain('<td className="border-b border-slate-100 px-2 py-2">\n                          <EquippedCtpCell character={character} ctp={myBuild.ctp}');
    expect(dbSource).not.toContain('<div className="grid grid-cols-4 gap-1">\n        {ctpBaseOptions.map');
  });

  it('uses CTP icon frame emphasis for normal, mighty, and brilliant grades', () => {
    expect(dbSource).toContain('function ctpGradeFrameClass');
    expect(dbSource).toContain('function CtpIconFrame');
    expect(dbSource).toContain("normal: 'border-slate-200 bg-slate-50 shadow-sm'");
    expect(dbSource).toContain("mighty: 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200'");
    expect(dbSource).toContain("brilliant: 'border-amber-400 bg-amber-50 shadow-lg ring-2 ring-amber-200'");
    expect(dbSource).toContain('<CtpIconFrame option={selectedOption} grade={selectedGrade} size="lg" />');
    expect(dbSource).toContain('<CtpIconFrame option={option} grade={active ? selectedGrade : \'normal\'} size="md" active={active} />');
    expect(dbSource).toContain('<CtpIconFrame option={selectedOption} grade={grade.value} size="sm" active={selectedGrade === grade.value} />');
    expect(dbSource).toContain('<CtpIconFrame option={option} grade="normal" size="sm" active={active} />');
    expect(dbSource).not.toContain('<CtpIconFrame option={selectedOption} grade={selectedGrade} size="lg" active={canReforge} />');
  });

  it('lays out the first column as left tier rail, center character, and right level rail', () => {
    expect(dbSource).toContain("const tierIconOptions = [");
    expect(dbSource).toContain('const tierRailOptions = [...tierIconOptions].reverse()');
    expect(dbSource).toContain("{ value: 'T1', iconSrc: '/mff-assets/tier/tier-1.png' }");
    expect(dbSource).toContain("{ value: 'T2', iconSrc: '/mff-assets/tier/tier-2.png' }");
    expect(dbSource).toContain("{ value: 'T3', iconSrc: '/mff-assets/tier/tier-3.png' }");
    expect(dbSource).toContain("{ value: 'T4', iconSrc: '/mff-assets/tier/tier-4.png' }");
    expect(dbSource).toContain('function normalizeMyTier');
    expect(dbSource).toContain('function myTierPatch');
    expect(dbSource).toContain("if (tier === 'T4') return { tier, level: 80 };");
    expect(dbSource).toContain("if (tier === 'T3') return { tier, level: 70 };");
    expect(dbSource).toContain('data-testid={`my-character-build-layout-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-tier-rail-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-level-rail-${character.id}`}');
    expect(dbSource).toContain('grid-cols-[50px_minmax(0,1fr)_70px]');
    expect(dbSource).toContain('flex flex-nowrap justify-center gap-1 overflow-hidden');
    expect(dbSource).toContain('tierRailOptions.map');
    expect(dbSource).toContain('<Image src={iconSrc} alt={`${tier} 아이콘`}');
    expect(dbSource).toContain('onBuildChange(myTierPatch(tier))');
    expect(dbSource).toContain('compact?: boolean');
    expect(dbSource).toContain("compact ? 'p-1.5' : 'p-2'");
    expect(dbSource).toContain("compact ? 'h-[74px] w-[74px]' : 'h-[82px] w-[82px]'");
    expect(dbSource).toContain('mt-2 grid w-full grid-cols-[96px_minmax(0,1fr)] gap-1.5');
    expect(dbSource).toContain('bg-gradient-to-b from-white to-slate-50');
    expect(dbSource).toContain('data-testid={`my-character-type-enhancement-input-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-elite-gear-level-input-${character.id}`}');
    expect(dbSource).toContain('typeEnhancement: clampInteger(event.currentTarget.valueAsNumber, 0, 0, 6)');
    expect(dbSource).toContain('eliteGearUnlocked: eliteGearLevel > 0');
    expect(dbSource).toContain('<CharacterCell character={character} selectedUniform={selectedUniform} active={active} onSelect={onSelect} compact />');
    expect(dbSource).toContain('typeEnhancement: clampInteger(stored?.typeEnhancement, fallback.typeEnhancement, 0, 6)');
    expect(dbSource).toContain('eliteGearUnlocked: Boolean(stored?.eliteGearUnlocked ?? fallback.eliteGearUnlocked)');
    expect(dbSource).toContain('eliteGearLevel: clampInteger(stored?.eliteGearLevel, fallback.eliteGearLevel, 0, 20)');
    expect(dbSource).not.toContain('const displayIcon = tier ===');
    expect(dbSource).not.toContain("{ value: '미보유', icon: '∅' }");
    expect(dbSource).not.toContain("{ value: 'Awakened', icon: 'A' }");
    expect(dbSource).not.toContain("{ value: 'Native T2', icon: 'N2' }");
    expect(dbSource).not.toContain("{ value: 'Native T3', icon: 'N3' }");
    expect(dbSource).not.toContain("{ value: 'Native T4', icon: 'N4' }");
    expect(dbSource).not.toContain("grid gap-2 xl:grid-cols-[128px_minmax(0,1fr)]");

    for (const asset of expectedTierIconAssets) {
      expect(existsSync(fileURLToPath(new URL(`../../public/mff-assets/tier/${asset}`, import.meta.url)))).toBe(true);
    }
  });

  it('limits character levels to the real 60-80 range', () => {
    expect(dbSource).toContain('const levelQuickOptions = [60, 70, 80] as const');
    expect(dbSource).toContain('clampInteger(roster?.level, roster?.owned === false ? 60 : 70, 60, 80)');
    expect(dbSource).toContain('clampInteger(stored?.level, fallback.level, 60, 80)');
    expect(dbSource).toContain('disabled={build.level <= 60}');
    expect(dbSource).toContain('disabled={build.level >= 80}');
    expect(dbSource).not.toContain('[70, 80, 90]');
    expect(dbSource).not.toContain('0, 100');
  });

  it('maps Uru slots to general Uru and Odin blessing detail choices', () => {
    expect(dbSource).toContain('normalUruOptions');
    expect(dbSource).toContain("name: '일반 우루: 물리 공격력'");
    expect(dbSource).toContain('type UruSlotValue');
    expect(dbSource).toContain('function normalizeUruSlots');
    expect(dbSource).toContain('function updateUruSlot');
    expect(dbSource).toContain('function countUruStats');
    expect(dbSource).toContain('odinBlessingOptions');
    expect(dbSource).toContain('Odin\\\'s Blessing: Amplify');
    expect(dbSource).toContain('Odin\\\'s Blessing: Mind');
    expect(dbSource).toContain('/mff-assets/items/uru_amplify.png');
    expect(dbSource).toContain('/mff-assets/items/uru_mind.png');
    expect(dbSource).not.toContain("value: '물리 공격'");
    expect(dbSource).not.toContain("value: '에너지 공격'");

    for (const asset of expectedOdinBlessingAssets) {
      expect(existsSync(fileURLToPath(new URL(`../../public/mff-assets/items/${asset}`, import.meta.url)))).toBe(true);
    }
  });

  it('edits Uru through a 20 slot 5x4 grid and two-step slot-click GUI picker', () => {
    expect(dbSource).toContain('const uruSlotCount = 20');
    expect(dbSource).toContain('const uruSlotIndexes = Array.from({ length: uruSlotCount }');
    expect(dbSource).toContain('uruSlots: UruSlotValue[]');
    expect(dbSource).toContain('createEmptyUruSlots()');
    expect(dbSource).toContain('normalizeUruSlots(stored, fallback.uruSlots)');
    expect(dbSource).toContain('function countUruStats');
    expect(dbSource).toContain('data-testid={`my-character-uru-slot-grid-${character.id}`}');
    expect(dbSource).toContain('data-testid={`my-character-uru-slot-${character.id}-${slotIndex}`}');
    expect(dbSource).toContain('data-testid={`my-character-uru-picker-${character.id}-${openUruSlotIndex}`}');
    expect(dbSource).toContain('data-testid={`my-character-uru-summary-${character.id}`}');
    expect(dbSource).toContain('grid grid-cols-5');
    expect(dbSource).toContain('grid h-8 w-8 shrink-0 place-items-center');
    expect(dbSource).toContain('mt-1 grid grid-cols-5 justify-start gap-0.5');
    expect(dbSource).not.toContain('슬롯 선택 후 일반 우루 / 오딘의 축복 선택');
    expect(dbSource).toContain('openUruSlotIndex');
    expect(dbSource).toContain('setOpenUruSlotIndex(slotIndex)');
    expect(dbSource).toContain('setOpenUruKind(null)');
    expect(dbSource).toContain('countUruStats(build.uruSlots)');
    expect(dbSource).toContain('label="일반 우루"');
    expect(dbSource).toContain('label="오딘의 축복"');
    expect(dbSource).not.toContain('OdinBlessingCountButton');
    expect(dbSource).not.toContain('my-character-odin-count-step');
    expect(dbSource).not.toContain('mt-2 grid grid-cols-3 gap-1 2xl:grid-cols-4');
  });

  it('adds My Character filters for tier, CTP, and artifact ownership', () => {
    expect(dbSource).toContain('type MyRosterFilters = {');
    expect(dbSource).toContain('function createEmptyMyRosterFilters()');
    expect(dbSource).toContain('function myBuildMatchesRosterFilters');
    expect(dbSource).toContain('function MyRosterFilterPanel');
    expect(dbSource).toContain('data-testid="my-character-build-filters"');
    expect(dbSource).toContain('data-testid={`my-character-filter-tier-${tier}`}');
    expect(dbSource).toContain('data-testid={`my-character-filter-ctp-${option.value}`}');
    expect(dbSource).toContain('data-testid={`my-character-filter-artifact-${option.value}`}');
    expect(dbSource).toContain('const selectedCtpBase = ctpBaseValueFor(build.ctp);');
    expect(dbSource).toContain('const artifactOwned = build.artifactStars > 0;');
    expect(dbSource).toContain('myBuildMatchesRosterFilters(character, normalizeMyBuild(character, myCharacterBuilds[character.id]), myRosterFilters)');
    expect(dbSource).toContain('setMyRosterFilters(createEmptyMyRosterFilters())');
    expect(dbSource).toContain('{isMyMode ? <MyRosterFilterPanel filters={myRosterFilters} onToggle={toggleMyRosterFilter} /> : null}');
  });
});
