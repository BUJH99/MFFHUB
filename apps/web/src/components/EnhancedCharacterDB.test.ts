import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./EnhancedCharacterDB.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');

describe('EnhancedCharacterDB matrix layout', () => {
  it('renders all uniforms inside one fixed fourth column instead of one column per uniform', () => {
    expect(source).not.toContain('{index + 4}열');
    expect(source).not.toContain('Array.from({ length: maxUniformColumns }');
    expect(source).toContain('4열 유니폼 목록');
    expect(source).toContain('grid-cols-6');
  });

  it('uses the full table width without horizontal scroll or internal effect scrollbars', () => {
    expect(source).not.toContain('const matrixTableMinWidth = 1140');
    expect(source).toContain('className="w-full table-fixed border-separate border-spacing-0 text-left"');
    expect(source).not.toContain('overflow-y-auto');
    expect(source).not.toContain('max-h-40 space-y-3 overflow-auto');
    expect(source).not.toContain('max-h-[222px] grid-cols-4 gap-1.5 overflow-y-auto');
  });

  it('paginates the DB internally by 10 characters instead of virtual scrolling', () => {
    expect(source).toContain('const PAGE_SIZE = 10');
    expect(source).toContain('currentPageCharacters');
    expect(source).toContain('data-testid="character-db-pagination"');
    expect(source).toContain('onClick={prevPage}');
    expect(source).toContain('onClick={nextPage}');
    expect(source).not.toContain('scrollRef');
    expect(source).not.toContain('MATRIX_ROW_HEIGHT');
    expect(source).not.toContain('topSpacer');
    expect(source).not.toContain('bottomSpacer');
  });

  it('lays out selected uniform effects horizontally inside the third column', () => {
    expect(source).toContain('data-testid="uniform-effect-columns"');
    expect(source).toContain('grid gap-2 xl:grid-cols-3');
    expect(source).toContain('SkillGroup title="리더"');
    expect(source).toContain('SkillGroup title="패시브"');
    expect(source).toContain('SkillGroup title="유니폼 효과"');
  });

  it('uses catalog names directly because the data catalog stores Korean names', () => {
    expect(source).not.toContain('getKoreanCharacterName');
    expect(source).toContain('{character.name}');
  });

  it('shows each character instinct label under the name without a redundant prefix', () => {
    expect(source).toContain('getCharacterInstinctLabel');
    expect(source).not.toContain('천성 {instinctLabel');
    expect(source).toContain("{instinctLabel ?? '미등록'}");
    expect(source).toContain('data-testid={`character-instinct-${character.id}`}');
  });

  it('uses the selected uniform for the first-column portrait and core icons', () => {
    expect(source).toContain('selectedUniform?: CatalogUniform');
    expect(source).toContain('selectedUniform?.imageUrl ?? character.imageUrl');
    expect(source).toContain('<CharacterAttributeIcons character={character} selectedUniform={selectedUniform} />');
    expect(source).toContain('<CharacterCell character={character} selectedUniform={selectedUniform}');
    expect(source).toContain('data-testid={`character-core-icons-${character.id}`}');
  });

  it('shows ability icons above instinct and uses icon buttons for all filter groups', () => {
    expect(source).toContain('CharacterAbilityIcons');
    expect(source.indexOf('<CharacterAbilityIcons character={character} selectedUniform={selectedUniform} />')).toBeLessThan(source.indexOf('data-testid={`character-instinct-${character.id}`}'));
    expect(source).toContain('FilterIconGroup');
    expect(source).toContain('selectedFilters');
    expect(source).toContain('toggleFilter');
    expect(source).toContain('filterIconGroups.map');
  });

  it('uses the shared Korean effect translator for artifacts and uniform effect columns', () => {
    expect(source).not.toContain('function translateArtifactEffect');
    expect(source).toContain('translateMffEffectText');
    expect(source).toContain('artifactLinesByStar');
    expect(source).toContain('rows.map((row, index) =>');
  });
});
