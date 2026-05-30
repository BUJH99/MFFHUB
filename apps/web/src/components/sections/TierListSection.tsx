'use client';

import Image from 'next/image';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import {
  thanosVibsTierListMeta,
  tierListRowsByMode,
  type TierListCombatType,
  type TierListMode,
} from '@mff-data-hub/data';
import { ctpDefinitions } from '../../lib/ctpInventory';
import { normalizeTierSearch, resolveTierListEntry, type ResolvedTierEntry } from '../../lib/tierListResolver';

type TypeFilter = 'ALL' | TierListCombatType;
type TierGearId = string;
type TierListEditorState = {
  rows: Record<string, string[]>;
  ctpByKey: Record<string, TierGearId>;
};
type EditableTierEntry = ResolvedTierEntry & {
  key: string;
  tier: string;
};
type EditableTierRow = {
  tier: string;
  entries: EditableTierEntry[];
};
type FilteredTierRow = EditableTierRow & {
  entriesByType: Record<TierListCombatType, EditableTierEntry[]>;
};
type TierGearOption = {
  id: TierGearId;
  label: string;
  iconSrc: string;
};
type TierEntryLocation = {
  entry: EditableTierEntry;
  tier: string;
  type: TierListCombatType;
  typeEntries: EditableTierEntry[];
  typeIndex: number;
};
type TierDropTargetLocation = {
  tier: string;
  type: TierListCombatType;
  index: number;
};
type TierLookup = {
  entryByKey: Map<string, EditableTierEntry>;
  entryLocationByKey: Map<string, TierEntryLocation>;
  typeEntriesByContainerId: Map<string, EditableTierEntry[]>;
};
type PendingTierMove = {
  activeKey: string;
  signature: string;
  target: TierDropTargetLocation;
};
type IdleCallbackWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const typeOrder: TierListCombatType[] = ['Combat', 'Blast', 'Speed', 'Universal'];
const typeLabels: Record<TierListCombatType, string> = {
  Combat: '컴뱃',
  Blast: '블래스트',
  Speed: '스피드',
  Universal: '유니버셜',
};
const tierListEditorStorageKey = 'mff-data-hub:tier-list-editor:v1';
const ultimateObeliskIconSrc = '/mff-assets/items/ultimate-obelisk.svg';
const ctpOptions: TierGearOption[] = [
  ...ctpDefinitions.map((definition) => ({
    id: definition.id,
    label: definition.koreanName,
    iconSrc: `https://thanosvibs.money/static/assets/items/ctp_${definition.id}.png`,
  })),
  {
    id: 'ultimate-obelisk',
    label: '궁극의 오벨리스크',
    iconSrc: ultimateObeliskIconSrc,
  },
];
const ctpOptionIds = new Set(ctpOptions.map((option) => option.id));
const lowValueTiers = new Set(['B-Tier', 'C-Tier', 'Poop Tier']);
const elementalKeywords = ['elemental', 'fire', 'cold', 'lightning', 'mind', 'storm', 'scarlet', 'thor', 'luna', 'psylocke', 'mephisto'];
const procKeywords = ['proc', 'ironman', 'sharon', 'cable', 'knull', 'hawkeye'];
const typeTone: Record<TierListCombatType, string> = {
  Combat: 'border-red-100 bg-red-50 text-red-700',
  Blast: 'border-blue-100 bg-blue-50 text-blue-700',
  Speed: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  Universal: 'border-violet-100 bg-violet-50 text-violet-700',
};
const typeSurfaceTone: Record<TierListCombatType, string> = {
  Combat: 'border-red-100/80 bg-red-50/55',
  Blast: 'border-sky-100/90 bg-sky-50/65',
  Speed: 'border-emerald-100/90 bg-emerald-50/60',
  Universal: 'border-violet-100/90 bg-violet-50/60',
};
const tierTone: Record<string, string> = {
  Meta: 'bg-fuchsia-600 text-white',
  'Niche Meta': 'bg-purple-600 text-white',
  'S-Tier': 'bg-blue-600 text-white',
  'Support Meta': 'bg-emerald-600 text-white',
  'A-Tier': 'bg-amber-400 text-slate-950',
  'B-Tier': 'bg-slate-700 text-white',
  'C-Tier': 'bg-slate-500 text-white',
  'Poop Tier': 'bg-slate-300 text-slate-800',
};
const modeCopy: Record<TierListMode, { eyebrow: string; title: string; accent: string; soft: string; countLabel: string }> = {
  pve: {
    eyebrow: 'PVE Tier List',
    title: 'PVE 티어리스트',
    accent: 'text-purple-700',
    soft: 'bg-purple-50 text-purple-700 ring-purple-100',
    countLabel: 'PVE 기준',
  },
  pvp: {
    eyebrow: 'PVP Tier List',
    title: 'PVP 티어리스트',
    accent: 'text-red-600',
    soft: 'bg-red-50 text-red-700 ring-red-100',
    countLabel: 'PVP 기준',
  },
};
const tierContainerSeparator = '::';
const sortableTransition = 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)';

function imageFallback(event: SyntheticEvent<HTMLImageElement>, label: string) {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=f8fafc&color=334155&bold=true`;
}

function createEmptyTierListEditorState(): TierListEditorState {
  return { rows: {}, ctpByKey: {} };
}

function editorStorageKey(mode: TierListMode) {
  return `${tierListEditorStorageKey}:${mode}`;
}

function sanitizeStoredStringMap(value: unknown, allowedValues?: Set<string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => (
        typeof entry[0] === 'string'
        && typeof entry[1] === 'string'
        && (!allowedValues || allowedValues.has(entry[1]))
      )),
  );
}

function sanitizeStoredRows(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string[]] => (
        typeof entry[0] === 'string'
        && Array.isArray(entry[1])
      ))
      .map(([tier, keys]) => [tier, keys.filter((key) => typeof key === 'string')]),
  );
}

function readTierListEditorState(mode: TierListMode): TierListEditorState {
  if (typeof window === 'undefined') return createEmptyTierListEditorState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(editorStorageKey(mode)) ?? '{}') as Partial<TierListEditorState>;
    return {
      rows: sanitizeStoredRows(parsed.rows),
      ctpByKey: sanitizeStoredStringMap(parsed.ctpByKey, ctpOptionIds),
    };
  } catch {
    return createEmptyTierListEditorState();
  }
}

function writeTierListEditorState(mode: TierListMode, state: TierListEditorState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(editorStorageKey(mode), JSON.stringify(state));
}

function scheduleTierListEditorStateWrite(mode: TierListMode, state: TierListEditorState) {
  if (typeof window === 'undefined') return undefined;
  const idleWindow = window as IdleCallbackWindow;
  const save = () => writeTierListEditorState(mode, state);

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const handle = idleWindow.requestIdleCallback(save, { timeout: 500 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(save, 120);
  return () => window.clearTimeout(handle);
}

function makeTierEntryKey(mode: TierListMode, entry: ResolvedTierEntry) {
  return normalizeTierSearch([
    mode,
    entry.catalogId,
    entry.character?.id,
    entry.sourceName,
    entry.type,
    entry.order,
  ].filter(Boolean).join(':'));
}

function getGearOption(gearId: TierGearId) {
  return ctpOptions.find((option) => option.id === gearId) ?? ctpOptions[0];
}

function defaultGearForEntry(entry: EditableTierEntry, mode: TierListMode): TierGearId {
  const text = `${entry.searchText} ${normalizeTierSearch(entry.tier)}`;
  if (lowValueTiers.has(entry.tier)) return 'ultimate-obelisk';

  if (mode === 'pvp') {
    if (entry.tier === 'A-Tier' || lowValueTiers.has(entry.tier)) return 'ultimate-obelisk';
    if (text.includes('jeangrey') || text.includes('thanos') || text.includes('wolverine')) return 'greed';
    if (text.includes('boss') || text.includes('tank') || text.includes('revive')) return 'regeneration';
    return 'authority';
  }

  if (entry.tier === 'Support Meta' || text.includes('support') || text.includes('leadership')) return 'insight';
  if (elementalKeywords.some((keyword) => text.includes(keyword))) return 'judgement';
  if (procKeywords.some((keyword) => text.includes(keyword))) return 'energy';
  return 'rage';
}

function applyEditorRows(baseRows: EditableTierRow[], editorState: TierListEditorState) {
  const rowEntries = new Map(baseRows.map((row) => [row.tier, [] as EditableTierEntry[]]));
  const entryByKey = new Map(baseRows.flatMap((row) => row.entries.map((entry) => [entry.key, entry] as const)));
  const usedKeys = new Set<string>();

  for (const row of baseRows) {
    const storedKeys = editorState.rows[row.tier] ?? [];
    const nextEntries = rowEntries.get(row.tier);
    if (!nextEntries) continue;

    for (const key of storedKeys) {
      const entry = entryByKey.get(key);
      if (!entry || usedKeys.has(key)) continue;
      usedKeys.add(key);
      nextEntries.push(entry.tier === row.tier ? entry : { ...entry, tier: row.tier });
    }
  }

  for (const row of baseRows) {
    const nextEntries = rowEntries.get(row.tier);
    if (!nextEntries) continue;

    for (const entry of row.entries) {
      if (usedKeys.has(entry.key)) continue;
      usedKeys.add(entry.key);
      nextEntries.push(entry);
    }
  }

  return baseRows.map((row) => ({
    ...row,
    entries: rowEntries.get(row.tier) ?? [],
  }));
}

function makeTierContainerId(tier: string, type: TierListCombatType) {
  return `${tier}${tierContainerSeparator}${type}`;
}

function parseTierContainerId(id: string) {
  const [tier, type] = id.split(tierContainerSeparator);
  if (!tier || !typeOrder.includes(type as TierListCombatType)) return undefined;
  return { tier, type: type as TierListCombatType };
}

function uniqueIdentifierToString(id: UniqueIdentifier) {
  return String(id);
}

function createEmptyTypeEntryBuckets() {
  return typeOrder.reduce((buckets, type) => {
    buckets[type] = [];
    return buckets;
  }, {} as Record<TierListCombatType, EditableTierEntry[]>);
}

function buildTierLookup(rows: EditableTierRow[]): TierLookup {
  const entryByKey = new Map<string, EditableTierEntry>();
  const entryLocationByKey = new Map<string, TierEntryLocation>();
  const typeEntriesByContainerId = new Map<string, EditableTierEntry[]>();

  for (const row of rows) {
    const entriesByType = createEmptyTypeEntryBuckets();

    for (const entry of row.entries) {
      entryByKey.set(entry.key, entry);
      entriesByType[entry.type].push(entry);
    }

    for (const type of typeOrder) {
      const typeEntries = entriesByType[type];
      typeEntriesByContainerId.set(makeTierContainerId(row.tier, type), typeEntries);

      typeEntries.forEach((entry, typeIndex) => {
        entryLocationByKey.set(entry.key, {
          entry,
          tier: row.tier,
          type,
          typeEntries,
          typeIndex,
        });
      });
    }
  }

  return { entryByKey, entryLocationByKey, typeEntriesByContainerId };
}

function getTierMoveSignature(activeKey: string, target: TierDropTargetLocation) {
  return `${activeKey}:${target.tier}:${target.type}:${target.index}`;
}

function resolveTierDropTarget(lookup: TierLookup, overId: string, activeType: TierListCombatType): TierDropTargetLocation | undefined {
  const container = parseTierContainerId(overId);
  if (container) {
    return {
      tier: container.tier,
      type: activeType,
      index: lookup.typeEntriesByContainerId.get(makeTierContainerId(container.tier, activeType))?.length ?? 0,
    };
  }

  const overLocation = lookup.entryLocationByKey.get(overId);
  if (!overLocation) return undefined;

  if (overLocation.type !== activeType) {
    return {
      tier: overLocation.tier,
      type: activeType,
      index: lookup.typeEntriesByContainerId.get(makeTierContainerId(overLocation.tier, activeType))?.length ?? 0,
    };
  }

  return {
    tier: overLocation.tier,
    type: activeType,
    index: overLocation.typeIndex,
  };
}

function insertIndexForTierType(
  entryByKey: Map<string, EditableTierEntry>,
  targetKeys: string[],
  targetType: TierListCombatType,
  targetTypeIndex: number,
) {
  const sameTypePositions = targetKeys
    .map((key, index) => (entryByKey.get(key)?.type === targetType ? index : -1))
    .filter((index) => index >= 0);

  if (sameTypePositions.length === 0) {
    const targetTypeOrder = typeOrder.indexOf(targetType);
    const firstLaterTypeIndex = targetKeys.findIndex((key) => {
      const type = entryByKey.get(key)?.type;
      return type ? typeOrder.indexOf(type) > targetTypeOrder : false;
    });
    return firstLaterTypeIndex >= 0 ? firstLaterTypeIndex : targetKeys.length;
  }

  if (targetTypeIndex >= sameTypePositions.length) {
    return sameTypePositions[sameTypePositions.length - 1] + 1;
  }

  return sameTypePositions[Math.max(0, targetTypeIndex)];
}

function moveTierEntryToTypeIndex(
  rows: EditableTierRow[],
  entryByKey: Map<string, EditableTierEntry>,
  entryKey: string,
  targetTier: string,
  targetType: TierListCombatType,
  targetTypeIndex: number,
) {
  const nextRows = Object.fromEntries(
    rows.map((row) => [
      row.tier,
      row.entries.map((entry) => entry.key).filter((key) => key !== entryKey),
    ]),
  );
  const targetKeys = nextRows[targetTier] ?? [];
  const insertIndex = insertIndexForTierType(entryByKey, targetKeys, targetType, targetTypeIndex);
  targetKeys.splice(insertIndex, 0, entryKey);
  nextRows[targetTier] = targetKeys;
  return nextRows;
}

function reorderVisibleTierEntries(
  rows: EditableTierRow[],
  targetTier: string,
  visibleKeys: string[],
  nextVisibleEntries: EditableTierEntry[],
) {
  const nextRows = Object.fromEntries(rows.map((row) => [row.tier, row.entries.map((entry) => entry.key)]));
  const targetRow = rows.find((row) => row.tier === targetTier);
  if (!targetRow) return nextRows;

  const visibleKeySet = new Set(visibleKeys);
  const nextVisibleKeys = nextVisibleEntries.map((entry) => entry.key);
  let nextVisibleIndex = 0;
  nextRows[targetTier] = targetRow.entries.map((entry) => {
    if (!visibleKeySet.has(entry.key)) return entry.key;
    const nextKey = nextVisibleKeys[nextVisibleIndex];
    nextVisibleIndex += 1;
    return nextKey ?? entry.key;
  });
  return nextRows;
}

const TierCharacterCard = memo(function TierCharacterCard({
  entry,
  mode,
  gearId,
  gearMenuOpen,
  onToggleGearMenu,
  onSelectGear,
}: {
  entry: EditableTierEntry;
  mode: TierListMode;
  gearId: TierGearId;
  gearMenuOpen: boolean;
  onToggleGearMenu: (entryKey: string) => void;
  onSelectGear: (entryKey: string, gearId: TierGearId) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: entry.key });
  const style: CSSProperties = {
    opacity: isDragging ? 0.28 : 1,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? sortableTransition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`tier-card-${mode}-${entry.key}`}
      data-tier-entry-key={entry.key}
      data-dragging={isDragging ? 'true' : undefined}
      className="tier-motion-card group relative touch-none cursor-grab select-none active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <TierCharacterCardBody
        entry={entry}
        mode={mode}
        gearId={gearId}
        gearMenuOpen={gearMenuOpen}
        onToggleGearMenu={() => onToggleGearMenu(entry.key)}
        onSelectGear={(nextGearId) => onSelectGear(entry.key, nextGearId)}
      />
    </div>
  );
});

TierCharacterCard.displayName = 'TierCharacterCard';

function TierCharacterCardBody({
  entry,
  mode,
  gearId,
  gearMenuOpen,
  onToggleGearMenu,
  onSelectGear,
  overlay = false,
}: {
  entry: EditableTierEntry;
  mode: TierListMode;
  gearId: TierGearId;
  gearMenuOpen: boolean;
  onToggleGearMenu?: () => void;
  onSelectGear?: (gearId: TierGearId) => void;
  overlay?: boolean;
}) {
  const gearOption = getGearOption(gearId);
  return (
      <article className={`relative grid min-h-[76px] w-full grid-cols-[42px_minmax(0,1fr)] gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:border-[#3182f6]/40 ${
        overlay ? 'scale-[1.04] border-blue-200 shadow-2xl ring-2 ring-blue-100' : ''
      }`}>
        <div className="relative h-[42px] w-[42px] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
          <Image
            src={entry.imageUrl}
            alt={entry.displayName}
            fill
            sizes="42px"
            unoptimized
            draggable={false}
            className="object-cover"
            onError={(event) => imageFallback(event, entry.displayName)}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-start gap-1">
            <p className="line-clamp-2 min-h-8 text-[11px] font-black leading-tight text-slate-950">{entry.displayName}</p>
          </div>
          <p className="mt-1 line-clamp-1 text-[10px] font-bold leading-tight text-slate-500">{entry.sourceLabel}</p>
          <div className="relative mt-1 flex items-center gap-1">
            <button
              type="button"
              data-testid={`tier-ctp-button-${mode}-${entry.key}`}
              onClick={onToggleGearMenu}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-100 bg-slate-50 shadow-sm transition hover:border-purple-200 hover:bg-white"
              aria-label={`${entry.displayName} CTP 편집`}
              title={gearOption.label}
              disabled={!onToggleGearMenu}
            >
              <Image src={gearOption.iconSrc} alt={gearOption.label} width={22} height={22} unoptimized className="h-[22px] w-[22px] object-contain" />
            </button>
            <span className="sr-only">{gearOption.label}</span>
            {gearMenuOpen ? (
              <div className="absolute bottom-8 left-0 z-30 grid w-48 grid-cols-5 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {ctpOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectGear?.(option.id)}
                    onMouseDown={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                    className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                      option.id === gearOption.id
                        ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-100'
                        : 'border-slate-100 bg-slate-50 hover:border-purple-200 hover:bg-white'
                    }`}
                    aria-label={`${option.label} 선택`}
                    title={option.label}
                  >
                    <Image src={option.iconSrc} alt={option.label} width={24} height={24} unoptimized className="h-6 w-6 object-contain" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/20 to-white/50 opacity-0 transition-opacity group-hover:opacity-100" />
      </article>
  );
}

function TierDragOverlayCard({
  entry,
  mode,
  gearId,
}: {
  entry: EditableTierEntry;
  mode: TierListMode;
  gearId: TierGearId;
}) {
  return (
    <div className="w-[156px]">
      <TierCharacterCardBody
        entry={entry}
        mode={mode}
        gearId={gearId}
        gearMenuOpen={false}
        overlay
      />
    </div>
  );
}

function TierSortableGrid({
  children,
  entries,
  id,
  mode,
  tier,
  type,
}: {
  children: ReactNode;
  entries: EditableTierEntry[];
  id: string;
  mode: TierListMode;
  tier: string;
  type: TierListCombatType;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const itemIds = useMemo(() => entries.map((entry) => entry.key), [entries]);

  return (
    <SortableContext
      id={id}
      items={itemIds}
      strategy={rectSortingStrategy}
    >
      <div
        ref={setNodeRef}
        data-testid={`tier-drop-zone-${mode}-${tier}-${type}`}
        data-tier-drop-zone={tier}
        data-tier-type={type}
        className={`grid min-h-[76px] gap-2 overflow-visible tier-type-grid transition-[background-color,box-shadow] duration-150 ${
          isOver ? 'rounded-xl bg-white/60 shadow-[inset_0_0_0_2px_rgba(49,130,246,0.18)]' : ''
        }`}
      >
        {children}
      </div>
    </SortableContext>
  );
}

export function TierListSection({ mode }: { mode: TierListMode }) {
  const copy = modeCopy[mode];
  const rows = tierListRowsByMode[mode];
  const tierOptions = useMemo(() => ['ALL', ...rows.map((row) => row.tier)] as const, [rows]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [openGearKey, setOpenGearKey] = useState<string | null>(null);
  const [activeEntryKey, setActiveEntryKey] = useState<string | null>(null);
  const [editorStates, setEditorStates] = useState<Record<TierListMode, TierListEditorState>>({
    pve: createEmptyTierListEditorState(),
    pvp: createEmptyTierListEditorState(),
  });
  const [editorHydrated, setEditorHydrated] = useState(false);
  const editorState = editorStates[mode] ?? createEmptyTierListEditorState();

  useEffect(() => {
    setEditorStates({
      pve: readTierListEditorState('pve'),
      pvp: readTierListEditorState('pvp'),
    });
    setEditorHydrated(true);
  }, []);

  useEffect(() => {
    setOpenGearKey(null);
  }, [mode]);

  useEffect(() => {
    if (!editorHydrated) return;
    return scheduleTierListEditorStateWrite(mode, editorState);
  }, [editorHydrated, editorState, mode]);

  const baseRows = useMemo<EditableTierRow[]>(() => rows.map((row) => ({
    ...row,
    entries: row.entries.map((entry) => {
      const resolved = resolveTierListEntry(entry);
      return {
        ...resolved,
        key: makeTierEntryKey(mode, resolved),
        tier: row.tier,
      };
    }),
  })), [mode, rows]);
  const resolvedRows = useMemo(() => applyEditorRows(baseRows, editorState), [baseRows, editorState]);
  const tierLookup = useMemo(() => buildTierLookup(resolvedRows), [resolvedRows]);
  const allResolvedEntries = useMemo(() => resolvedRows.flatMap((row) => row.entries), [resolvedRows]);
  const normalizedQuery = normalizeTierSearch(query);
  const filteredRows = useMemo<FilteredTierRow[]>(() => resolvedRows
    .filter((row) => tierFilter === 'ALL' || row.tier === tierFilter)
    .map((row) => {
      const entriesByType = createEmptyTypeEntryBuckets();
      const entries = row.entries.filter((entry) => {
        const typeMatches = typeFilter === 'ALL' || entry.type === typeFilter;
        const queryMatches = !normalizedQuery || entry.searchText.includes(normalizedQuery);
        return typeMatches && queryMatches;
      });

      for (const entry of entries) {
        entriesByType[entry.type].push(entry);
      }

      return { ...row, entries, entriesByType };
    }), [normalizedQuery, resolvedRows, tierFilter, typeFilter]);
  const matchedCount = allResolvedEntries.filter((entry) => entry.matched).length;
  const visibleCount = filteredRows.reduce((sum, row) => sum + row.entries.length, 0);
  const activeEntry = activeEntryKey ? tierLookup.entryByKey.get(activeEntryKey) : undefined;
  const latestResolvedRowsRef = useRef(resolvedRows);
  const latestTierLookupRef = useRef(tierLookup);
  const dragOverFrameRef = useRef<number | null>(null);
  const pendingTierMoveRef = useRef<PendingTierMove | null>(null);
  const lastDragOverSignatureRef = useRef<string | null>(null);
  latestResolvedRowsRef.current = resolvedRows;
  latestTierLookupRef.current = tierLookup;
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => () => {
    if (dragOverFrameRef.current !== null) {
      window.cancelAnimationFrame(dragOverFrameRef.current);
    }
  }, []);

  const updateEditorState = useCallback((updater: (state: TierListEditorState) => TierListEditorState) => {
    setEditorStates((previous) => ({
      ...previous,
      [mode]: updater(previous[mode] ?? createEmptyTierListEditorState()),
    }));
  }, [mode]);

  const cancelPendingTierMove = useCallback(() => {
    if (dragOverFrameRef.current !== null) {
      window.cancelAnimationFrame(dragOverFrameRef.current);
      dragOverFrameRef.current = null;
    }
    pendingTierMoveRef.current = null;
  }, []);

  const queueTierMove = useCallback((move: PendingTierMove) => {
    pendingTierMoveRef.current = move;
    if (dragOverFrameRef.current !== null) return;

    dragOverFrameRef.current = window.requestAnimationFrame(() => {
      dragOverFrameRef.current = null;
      const pendingMove = pendingTierMoveRef.current;
      pendingTierMoveRef.current = null;
      if (!pendingMove) return;

      const rows = latestResolvedRowsRef.current;
      const lookup = latestTierLookupRef.current;
      const activeLocation = lookup.entryLocationByKey.get(pendingMove.activeKey);
      if (!activeLocation) return;
      if (activeLocation.tier === pendingMove.target.tier && activeLocation.type === pendingMove.target.type) return;

      lastDragOverSignatureRef.current = pendingMove.signature;
      updateEditorState((state) => ({
        ...state,
        rows: moveTierEntryToTypeIndex(
          rows,
          lookup.entryByKey,
          pendingMove.activeKey,
          pendingMove.target.tier,
          pendingMove.target.type,
          pendingMove.target.index,
        ),
      }));
    });
  }, [updateEditorState]);

  const tierCollisionDetection = useCallback<CollisionDetection>((args) => {
    const activeLocation = latestTierLookupRef.current.entryLocationByKey.get(uniqueIdentifierToString(args.active.id));
    if (!activeLocation) return closestCenter(args);

    const filteredDroppableContainers = args.droppableContainers.filter((container) => {
      const id = uniqueIdentifierToString(container.id);
      const parsedContainer = parseTierContainerId(id);
      if (parsedContainer) return parsedContainer.type === activeLocation.type;
      return latestTierLookupRef.current.entryLocationByKey.get(id)?.type === activeLocation.type;
    });

    return closestCenter({
      ...args,
      droppableContainers: filteredDroppableContainers.length > 0 ? filteredDroppableContainers : args.droppableContainers,
    });
  }, []);

  const handleToggleGearMenu = useCallback((entryKey: string) => {
    setOpenGearKey((current) => (current === entryKey ? null : entryKey));
  }, []);

  const handleSelectGear = useCallback((entryKey: string, gearId: TierGearId) => {
    updateEditorState((state) => ({
      ...state,
      ctpByKey: {
        ...state.ctpByKey,
        [entryKey]: gearId,
      },
    }));
    setOpenGearKey(null);
  }, [updateEditorState]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    cancelPendingTierMove();
    lastDragOverSignatureRef.current = null;
    setOpenGearKey(null);
    setActiveEntryKey(uniqueIdentifierToString(event.active.id));
  }, [cancelPendingTierMove]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const lookup = latestTierLookupRef.current;
    const activeKey = uniqueIdentifierToString(active.id);
    const activeLocation = lookup.entryLocationByKey.get(activeKey);
    if (!activeLocation) return;

    const target = resolveTierDropTarget(lookup, uniqueIdentifierToString(over.id), activeLocation.type);
    if (!target) return;
    if (activeLocation.tier === target.tier && activeLocation.type === target.type) return;

    const signature = getTierMoveSignature(activeKey, target);
    if (signature === lastDragOverSignatureRef.current || signature === pendingTierMoveRef.current?.signature) return;

    const targetEntriesLength = lookup.typeEntriesByContainerId.get(makeTierContainerId(target.tier, target.type))?.length ?? target.index;
    queueTierMove({
      activeKey,
      signature,
      target: {
        ...target,
        index: Math.min(target.index, targetEntriesLength),
      },
    });
  }, [queueTierMove]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    cancelPendingTierMove();
    lastDragOverSignatureRef.current = null;
    setActiveEntryKey(null);
    if (!over) return;

    const rows = latestResolvedRowsRef.current;
    const lookup = latestTierLookupRef.current;
    const activeKey = uniqueIdentifierToString(active.id);
    const activeLocation = lookup.entryLocationByKey.get(activeKey);
    if (!activeLocation) return;

    const target = resolveTierDropTarget(lookup, uniqueIdentifierToString(over.id), activeLocation.type);
    if (!target) return;

    if (activeLocation.tier === target.tier && activeLocation.type === target.type) {
      if (activeLocation.typeIndex === target.index) return;
      const nextEntries = arrayMove(activeLocation.typeEntries, activeLocation.typeIndex, target.index);
      const visibleKeys = activeLocation.typeEntries.map((entry) => entry.key);
      updateEditorState((state) => ({
        ...state,
        rows: reorderVisibleTierEntries(rows, activeLocation.tier, visibleKeys, nextEntries),
      }));
      return;
    }

    updateEditorState((state) => ({
      ...state,
      rows: moveTierEntryToTypeIndex(rows, lookup.entryByKey, activeKey, target.tier, target.type, target.index),
    }));
  }, [cancelPendingTierMove, updateEditorState]);

  const handleDragCancel = useCallback(() => {
    cancelPendingTierMove();
    lastDragOverSignatureRef.current = null;
    setActiveEntryKey(null);
  }, [cancelPendingTierMove]);

  return (
    <section className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-sm font-black ${copy.accent}`}>{copy.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{copy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-slate-500">
              THANO$VIB$ {thanosVibsTierListMeta.version} · {thanosVibsTierListMeta.updateName} · {thanosVibsTierListMeta.updatedAt}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <span className={`rounded-2xl px-4 py-3 ring-1 ${copy.soft}`}><b className="block text-xl">{allResolvedEntries.length}</b>{copy.countLabel}</span>
            <span className="rounded-2xl bg-slate-950 px-4 py-3 text-white"><b className="block text-xl">{matchedCount}</b>DB 매칭</span>
            <span className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-700"><b className="block text-xl">{visibleCount}</b>표시</span>
          </div>
        </div>

        <div className="mt-5 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="캐릭터 / 유니폼 검색"
            className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-300 focus:bg-white"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700 outline-none"
            aria-label="타입 필터"
          >
            <option value="ALL">ALL TYPE</option>
            {typeOrder.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
          </select>
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700 outline-none"
            aria-label="티어 필터"
          >
            {tierOptions.map((tier) => <option key={tier} value={tier}>{tier === 'ALL' ? 'ALL TIER' : tier}</option>)}
          </select>
        </div>
      </section>

      <DndContext
        collisionDetection={tierCollisionDetection}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          {filteredRows.map((row) => (
            <div key={row.tier} className="flex min-h-[132px] border-b border-slate-100 last:border-b-0 group/row">
              <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-white p-3 xl:w-36 xl:p-4">
                <span className={`inline-flex rounded-2xl px-4 py-2 text-sm font-black ${tierTone[row.tier] ?? 'bg-slate-950 text-white'}`}>{row.tier}</span>
                <p className="mt-2 text-xs font-black text-slate-500">{row.entries.length}명</p>
              </div>

              <div className="grid flex-1 gap-px bg-slate-100 lg:grid-cols-2 2xl:grid-cols-4">
                {typeOrder.map((type) => {
                  const entries = row.entriesByType[type];
                  const containerId = makeTierContainerId(row.tier, type);

                  return (
                    <div key={`${row.tier}-${type}`} className={`min-h-[132px] p-3 transition-colors duration-200 ${typeSurfaceTone[type]}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${typeTone[type]}`}>{typeLabels[type]}</span>
                        <span className="text-[10px] font-black text-slate-400">{entries.length}</span>
                      </div>

                      <TierSortableGrid
                        entries={entries}
                        id={containerId}
                        mode={mode}
                        tier={row.tier}
                        type={type}
                      >
                        {entries.map((entry) => (
                          <TierCharacterCard
                            key={entry.key}
                            entry={entry}
                            mode={mode}
                            gearId={editorState.ctpByKey[entry.key] ?? defaultGearForEntry(entry, mode)}
                            gearMenuOpen={openGearKey === entry.key}
                            onToggleGearMenu={handleToggleGearMenu}
                            onSelectGear={handleSelectGear}
                          />
                        ))}
                        {entries.length === 0 ? (
                          <div className="grid min-h-[76px] place-items-center rounded-xl border border-dashed border-white/80 bg-white/60 text-xs font-black text-slate-300">DROP</div>
                        ) : null}
                      </TierSortableGrid>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
        <DragOverlay adjustScale={false}>
          {activeEntry ? (
            <TierDragOverlayCard
              entry={activeEntry}
              mode={mode}
              gearId={editorState.ctpByKey[activeEntry.key] ?? defaultGearForEntry(activeEntry, mode)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {visibleCount === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black text-slate-400">검색 결과 없음</p>
        </section>
      ) : null}
    </section>
  );
}
