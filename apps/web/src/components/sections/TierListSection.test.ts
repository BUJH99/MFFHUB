import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourcePath = fileURLToPath(new URL('./TierListSection.tsx', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');
const globalsPath = fileURLToPath(new URL('../../app/globals.css', import.meta.url));
const globals = readFileSync(globalsPath, 'utf8');

describe('TierListSection reorder engine', () => {
  it('keeps type filters while rendering tier rows as reorder containers', () => {
    expect(source).toContain('typeLabels');
    expect(source).toContain("Combat: '컴뱃'");
    expect(source).toContain("Blast: '블래스트'");
    expect(source).toContain("Speed: '스피드'");
    expect(source).toContain("Universal: '유니버셜'");
    expect(source).toContain('typeFilter ===');
  });

  it('supports editable tier cards with CTP and ultimate obelisk controls', () => {
    expect(source).toContain('tierListEditorStorageKey');
    expect(source).toContain('moveTierEntryToTypeIndex');
    expect(source).toContain('onPointerDown');
    expect(source).toContain('onMouseDown');
    expect(source).toContain('onTouchStart');
    expect(source).toContain('ctpOptions');
    expect(source).toContain('ultimate-obelisk');
    expect(source).toContain('/mff-assets/items/ultimate-obelisk.svg');
    expect(source).toContain('data-testid={`tier-ctp-button-${mode}-${entry.key}`}');
    expect(source).not.toContain('DB</span>');
    expect(source).not.toContain('{typeLabels[entry.type]}</span>');
  });

  it('uses dnd-kit sortable grid primitives for 2d tier card movement', () => {
    expect(source).toContain("from '@dnd-kit/core'");
    expect(source).toContain("from '@dnd-kit/sortable'");
    expect(source).toContain('MouseSensor');
    expect(source).toContain('TouchSensor');
    expect(source).toContain('DndContext');
    expect(source).toContain('SortableContext');
    expect(source).toContain('DragOverlay');
    expect(source).toContain('useSortable');
    expect(source).toContain('useDroppable');
    expect(source).toContain('rectSortingStrategy');
    expect(source).toContain('closestCenter');
    expect(source).toContain('type CollisionDetection');
    expect(source).not.toContain("from 'framer-motion'");
    expect(source).not.toContain('PointerSensor');
    expect(source).not.toContain('distance: 6');
    expect(source).not.toContain('Reorder.Group');
    expect(source).not.toContain('Reorder.Item');
    expect(source).not.toContain('startViewTransition');
    expect(source).not.toContain('flushSync');
  });

  it('keeps type-separated 2d grids with max-three-column layout and no insertion-line previews', () => {
    expect(source).toContain('scheduleTierListEditorStateWrite');
    expect(source).toContain('requestIdleCallback');
    expect(source).toContain('makeTierContainerId(row.tier, type)');
    expect(source).toContain('data-tier-type={type}');
    expect(source).toContain('function TierSortableGrid');
    expect(source).toContain('lg:grid-cols-2 2xl:grid-cols-4');
    expect(source).toContain('tier-type-grid transition-[background-color,box-shadow]');
    expect(source).toContain('handleDragOver');
    expect(source).toContain('handleDragEnd');
    expect(source).toContain('arrayMove');
    expect(source).toContain('resolveTierDropTarget');
    expect(source).toContain('data-tier-entry-key={entry.key}');
    expect(source).toContain('data-tier-drop-zone={tier}');
    expect(source).toContain('entriesByType');
    expect(source).not.toContain('function TierDragPreview');
    expect(source).not.toContain('function getTierDropTargetFromPoint');
    expect(source).not.toContain('tier-card-drop-before');
    expect(source).not.toContain('tier-card-drop-after');
    expect(globals).not.toContain('tier-list-spring-transition');
    expect(globals).not.toContain('tier-list-pointer-dragging');
    expect(globals).not.toContain('.tier-drag-preview');
    expect(globals).not.toContain('.tier-card-drop-before::before');
    expect(globals).not.toContain('.tier-card-drop-after::after');
    expect(globals).toContain(".tier-motion-card[data-dragging='true']");
    expect(globals).toContain('will-change: transform');
    expect(globals).toContain('.tier-type-grid');
    expect(globals).toContain('repeat(auto-fit, minmax(min(100%, 112px), 1fr))');
    expect(globals).toContain('width: min(100%, calc(112px * 3 + 0.5rem * 2))');
  });

  it('throttles drag-over work and narrows collision checks without changing the sortable animation engine', () => {
    expect(source).toContain('useRef');
    expect(source).toContain('buildTierLookup');
    expect(source).toContain('entryLocationByKey');
    expect(source).toContain('typeEntriesByContainerId');
    expect(source).toContain('requestAnimationFrame');
    expect(source).toContain('pendingTierMoveRef');
    expect(source).toContain('lastDragOverSignatureRef');
    expect(source).toContain('tierCollisionDetection');
    expect(source).toContain('collisionDetection={tierCollisionDetection}');
    expect(source).toContain('filteredDroppableContainers');
    expect(source).toContain('useSensor(MouseSensor)');
    expect(source).toContain('delay: 120');
    expect(source).toContain('tolerance: 6');
    expect(source).toContain("data-dragging={isDragging ? 'true' : undefined}");
    expect(source).toContain('onToggleGearMenu={handleToggleGearMenu}');
    expect(source).toContain('onSelectGear={handleSelectGear}');
    expect(source).toContain('strategy={rectSortingStrategy}');
    expect(source).toContain('<DragOverlay adjustScale={false}>');
  });
});
