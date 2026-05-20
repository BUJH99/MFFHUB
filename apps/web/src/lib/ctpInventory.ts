import type { UserCharacter } from '@mff-data-hub/types';

export type CtpGrade = 'normal' | 'mighty' | 'brilliant';
export type CtpRole = 'PVE' | 'SEMI PVE' | 'Support' | 'PVP' | 'SEMI PVP' | 'WASTE';

export type CtpDefinition = {
  id: string;
  name: string;
  koreanName: string;
  role: CtpRole;
  priority: 'core' | 'situational' | 'low';
};

export type CtpInventoryEntry = {
  ctpId: string;
  normal: number;
  mighty: number;
  brilliant: number;
};

export type CtpInventorySummary = {
  total: number;
  normal: number;
  mighty: number;
  brilliant: number;
  reforged: number;
  equipped: number;
  spare: number;
  byRole: Array<{ role: CtpRole; total: number }>;
};

export const ctpGradeLabels: Record<CtpGrade, string> = {
  normal: '일반',
  mighty: '강력',
  brilliant: '찬란',
};

export const ctpRoleOrder: CtpRole[] = ['PVE', 'SEMI PVE', 'Support', 'PVP', 'SEMI PVP', 'WASTE'];

export const ctpDefinitions: CtpDefinition[] = [
  { id: 'rage', name: 'Rage', koreanName: '분노', role: 'PVE', priority: 'core' },
  { id: 'competition', name: 'Competition', koreanName: '경쟁', role: 'PVE', priority: 'core' },
  { id: 'judgement', name: 'Judgement', koreanName: '심판', role: 'SEMI PVE', priority: 'core' },
  { id: 'energy', name: 'Energy', koreanName: '격동[에너지]', role: 'SEMI PVE', priority: 'core' },
  { id: 'destruction', name: 'Destruction', koreanName: '파괴', role: 'SEMI PVE', priority: 'situational' },
  { id: 'insight', name: 'Insight', koreanName: '통찰', role: 'Support', priority: 'core' },
  { id: 'liberation', name: 'Liberation', koreanName: '해방', role: 'Support', priority: 'situational' },
  { id: 'conquest', name: 'Conquest', koreanName: '극복', role: 'PVP', priority: 'situational' },
  { id: 'greed', name: 'Greed', koreanName: '탐욕', role: 'PVP', priority: 'situational' },
  { id: 'regeneration', name: 'Regeneration', koreanName: '재생', role: 'SEMI PVP', priority: 'situational' },
  { id: 'refinement', name: 'Refinement', koreanName: '제련', role: 'SEMI PVP', priority: 'situational' },
  { id: 'authority', name: 'Authority', koreanName: '권능', role: 'SEMI PVP', priority: 'situational' },
  { id: 'transcendence', name: 'Transcendence', koreanName: '초월', role: 'WASTE', priority: 'low' },
  { id: 'patience', name: 'Patience', koreanName: '인내', role: 'WASTE', priority: 'low' },
];

const ctpAliases: Record<string, string> = {
  judgment: 'judgement',
  judgement: 'judgement',
  regen: 'regeneration',
  regeneration: 'regeneration',
};

function normalizeCount(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

export function parseCtpName(value?: string) {
  if (!value) return undefined;
  const grade: CtpGrade = value.toLowerCase().startsWith('brilliant ')
    ? 'brilliant'
    : value.toLowerCase().startsWith('mighty ')
      ? 'mighty'
      : 'normal';
  const baseName = value.replace(/^(brilliant|mighty)\s+/i, '').trim();
  const id = ctpAliases[baseName.toLowerCase()] ?? baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const definition = ctpDefinitions.find((ctp) => ctp.id === id);

  return definition ? { ctpId: definition.id, grade } : undefined;
}

export function createEmptyCtpInventory(): CtpInventoryEntry[] {
  return ctpDefinitions.map((definition) => ({
    ctpId: definition.id,
    normal: 0,
    mighty: 0,
    brilliant: 0,
  }));
}

export function equippedCtpCounts(roster: UserCharacter[] = []) {
  const equipped = createEmptyCtpInventory();
  const byId = new Map(equipped.map((entry) => [entry.ctpId, entry]));

  for (const character of roster) {
    const parsed = parseCtpName(character.ctp);
    if (!parsed) continue;
    const entry = byId.get(parsed.ctpId);
    if (entry) entry[parsed.grade] += 1;
  }

  return equipped;
}

export function createDefaultCtpInventory(roster: UserCharacter[] = []) {
  return equippedCtpCounts(roster);
}

export function normalizeCtpInventory(value: unknown): CtpInventoryEntry[] {
  const rawEntries = Array.isArray(value) ? value : [];
  const byId = new Map(
    rawEntries
      .filter((entry): entry is Partial<CtpInventoryEntry> => Boolean(entry) && typeof entry === 'object')
      .map((entry) => [entry.ctpId, entry]),
  );

  return ctpDefinitions.map((definition) => {
    const raw = byId.get(definition.id);
    return {
      ctpId: definition.id,
      normal: normalizeCount(raw?.normal),
      mighty: normalizeCount(raw?.mighty),
      brilliant: normalizeCount(raw?.brilliant),
    };
  });
}

export function updateCtpInventoryCount(
  inventory: CtpInventoryEntry[],
  ctpId: string,
  grade: CtpGrade,
  value: unknown,
) {
  return normalizeCtpInventory(
    inventory.map((entry) => (
      entry.ctpId === ctpId ? { ...entry, [grade]: normalizeCount(value) } : entry
    )),
  );
}

function sumEntry(entry: Pick<CtpInventoryEntry, CtpGrade>) {
  return entry.normal + entry.mighty + entry.brilliant;
}

export function summarizeCtpInventory(
  inventory: CtpInventoryEntry[],
  equippedInventory: CtpInventoryEntry[] = equippedCtpCounts(),
): CtpInventorySummary {
  const normalized = normalizeCtpInventory(inventory);
  const equippedById = new Map(equippedInventory.map((entry) => [entry.ctpId, entry]));
  const totals = normalized.reduce(
    (summary, entry) => {
      summary.normal += entry.normal;
      summary.mighty += entry.mighty;
      summary.brilliant += entry.brilliant;
      summary.total += sumEntry(entry);
      summary.equipped += sumEntry(equippedById.get(entry.ctpId) ?? { normal: 0, mighty: 0, brilliant: 0 });
      return summary;
    },
    { total: 0, normal: 0, mighty: 0, brilliant: 0, equipped: 0 },
  );
  const roleTotals = new Map<CtpRole, number>();

  for (const entry of normalized) {
    const definition = ctpDefinitions.find((ctp) => ctp.id === entry.ctpId);
    if (!definition) continue;
    roleTotals.set(definition.role, (roleTotals.get(definition.role) ?? 0) + sumEntry(entry));
  }

  return {
    ...totals,
    reforged: totals.mighty + totals.brilliant,
    spare: Math.max(0, totals.total - totals.equipped),
    byRole: ctpRoleOrder.map((role) => ({ role, total: roleTotals.get(role) ?? 0 })),
  };
}
