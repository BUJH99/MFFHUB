'use client';

import {
  ctpDefinitions,
  ctpGradeLabels,
  createDefaultCtpInventory,
  equippedCtpCounts,
  normalizeCtpInventory,
  summarizeCtpInventory,
  updateCtpInventoryCount,
  type CtpGrade,
  type CtpInventoryEntry,
  type CtpRole,
} from '@/lib/ctpInventory';
import { userRoster } from '@/lib/data';
import { Archive, PackageCheck, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ctpInventoryStorageKey = 'mff-data-hub:ctp-inventory:v1';
const ctpInventoryCookieKey = 'mff_ctp_inventory_v1';
const grades: CtpGrade[] = ['normal', 'mighty', 'brilliant'];

function readCtpInventoryCookie() {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${ctpInventoryCookieKey}=`;
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : undefined;
}

function parseStoredCtpInventory(stored?: string | null) {
  if (!stored) return createDefaultCtpInventory(userRoster);
  try {
    return normalizeCtpInventory(JSON.parse(stored));
  } catch {
    return createDefaultCtpInventory(userRoster);
  }
}

function readStoredCtpInventory() {
  if (typeof window === 'undefined') return createDefaultCtpInventory(userRoster);
  try {
    return parseStoredCtpInventory(window.localStorage?.getItem(ctpInventoryStorageKey) ?? readCtpInventoryCookie());
  } catch {
    return parseStoredCtpInventory(readCtpInventoryCookie());
  }
}

function writeStoredCtpInventory(inventory: CtpInventoryEntry[]) {
  if (typeof window === 'undefined') return;
  const stored = JSON.stringify(inventory);
  try {
    window.localStorage?.setItem(ctpInventoryStorageKey, stored);
  } catch {
    // Cookie fallback keeps CTP counts editable when localStorage is unavailable.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${ctpInventoryCookieKey}=${encodeURIComponent(stored)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}

function useCtpInventory() {
  const [inventory, setInventory] = useState(() => createDefaultCtpInventory(userRoster));

  useEffect(() => {
    setInventory(readStoredCtpInventory());
  }, []);

  const updateCount = useCallback((ctpId: string, grade: CtpGrade, value: number) => {
    setInventory((current) => {
      const next = updateCtpInventoryCount(current, ctpId, grade, value);
      writeStoredCtpInventory(next);
      return next;
    });
  }, []);

  const resetInventory = useCallback(() => {
    const next = createDefaultCtpInventory(userRoster);
    writeStoredCtpInventory(next);
    setInventory(next);
  }, []);

  return { inventory, updateCount, resetInventory };
}

function formatCount(value: number) {
  return String(Math.max(0, value));
}

function ctpIconSrc(ctpId: string) {
  return `https://thanosvibs.money/static/assets/items/ctp_${ctpId}.png`;
}

function roleBadgeClass(role: CtpRole) {
  switch (role) {
    case 'PVE':
      return 'bg-blue-50 text-blue-700';
    case 'SEMI PVE':
      return 'bg-cyan-50 text-cyan-700';
    case 'PVP':
      return 'bg-rose-50 text-rose-700';
    case 'SEMI PVP':
      return 'bg-orange-50 text-orange-700';
    case 'Support':
      return 'bg-emerald-50 text-emerald-700';
    case 'WASTE':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function roleBarClass(role: CtpRole) {
  switch (role) {
    case 'PVE':
      return 'bg-blue-600';
    case 'SEMI PVE':
      return 'bg-cyan-500';
    case 'Support':
      return 'bg-emerald-500';
    case 'PVP':
      return 'bg-rose-600';
    case 'SEMI PVP':
      return 'bg-orange-500';
    case 'WASTE':
      return 'bg-slate-500';
    default:
      return 'bg-slate-950';
  }
}

function getRoleDefinitions(role: CtpRole) {
  return ctpDefinitions.filter((definition) => definition.role === role);
}

function gradeInputClass(grade: CtpGrade) {
  switch (grade) {
    case 'brilliant':
      return 'focus-within:border-amber-400 focus-within:bg-amber-50/40';
    case 'mighty':
      return 'focus-within:border-sky-400 focus-within:bg-sky-50/40';
    default:
      return 'focus-within:border-slate-400 focus-within:bg-white';
  }
}

function CountStepper({
  label,
  value,
  grade,
  onChange,
}: {
  label: string;
  value: number;
  grade: CtpGrade;
  onChange: (value: number) => void;
}) {
  const applyValue = (nextValue: number) => onChange(Math.max(0, Math.round(Number.isFinite(nextValue) ? nextValue : value)));

  return (
    <label className={`grid gap-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 ${gradeInputClass(grade)}`}>
      <span className="text-[10px] font-black text-slate-400">{ctpGradeLabels[grade]}</span>
      <span className="grid grid-cols-[28px_minmax(0,1fr)_28px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          aria-label={`${label} 감소`}
          onClick={() => applyValue(value - 1)}
          className="bg-white text-sm font-black text-slate-500 hover:bg-slate-100"
        >
          -
        </button>
        <input
          aria-label={label}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(event) => applyValue(Number(event.target.value))}
          className="min-w-0 bg-transparent px-1 py-2 text-center text-sm font-black text-slate-950 outline-none"
        />
        <button
          type="button"
          aria-label={`${label} 증가`}
          onClick={() => applyValue(value + 1)}
          className="bg-white text-sm font-black text-slate-500 hover:bg-slate-100"
        >
          +
        </button>
      </span>
    </label>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone ?? 'text-slate-950'}`}>{formatCount(value)}</p>
    </div>
  );
}

export function CtpInventoryPanel() {
  const { inventory, updateCount, resetInventory } = useCtpInventory();
  const equippedInventory = useMemo(() => equippedCtpCounts(userRoster), []);
  const equippedById = useMemo(() => new Map(equippedInventory.map((entry) => [entry.ctpId, entry])), [equippedInventory]);
  const summary = useMemo(() => summarizeCtpInventory(inventory, equippedInventory), [equippedInventory, inventory]);
  const rows = useMemo(() => ctpDefinitions.map((definition) => {
    const entry = inventory.find((item) => item.ctpId === definition.id) ?? { ctpId: definition.id, normal: 0, mighty: 0, brilliant: 0 };
    const equipped = equippedById.get(definition.id) ?? { ctpId: definition.id, normal: 0, mighty: 0, brilliant: 0 };
    const total = entry.normal + entry.mighty + entry.brilliant;
    const equippedTotal = equipped.normal + equipped.mighty + equipped.brilliant;
    return { definition, entry, total, equippedTotal, spare: Math.max(0, total - equippedTotal) };
  }), [equippedById, inventory]);
  const maxRoleTotal = Math.max(1, ...summary.byRole.map((row) => row.total));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-slate-950 p-3 text-white"><PackageCheck size={20} /></span>
          <div>
            <p className="text-sm font-black text-slate-500">보유 장비</p>
            <h2 className="text-2xl font-black text-slate-950">CTP 인벤토리 현황</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={resetInventory}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:border-purple-200 hover:text-purple-700"
        >
          <RotateCcw size={14} />
          장착값 기준
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-2">
            <SummaryTile label="총 CTP" value={summary.total} />
            <SummaryTile label="장착 중" value={summary.equipped} tone="text-purple-700" />
            <SummaryTile label="일반" value={summary.normal} />
            <SummaryTile label="강력" value={summary.mighty} tone="text-sky-700" />
            <SummaryTile label="찬란" value={summary.brilliant} tone="text-amber-600" />
            <SummaryTile label="여유" value={summary.spare} tone="text-emerald-700" />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <Archive size={15} className="text-slate-500" />
              <p className="text-xs font-black text-slate-500">역할별 보유</p>
            </div>
            <div className="mt-3 space-y-2">
              {summary.byRole.map((row) => (
                <div key={row.role}>
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-500">
                    <span>{row.role}</span>
                    <span>{row.total}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {getRoleDefinitions(row.role).map((definition) => (
                      <span key={`${row.role}-${definition.id}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${roleBadgeClass(row.role)}`}>
                        <Image src={ctpIconSrc(definition.id)} alt={definition.koreanName} width={16} height={16} unoptimized className="h-4 w-4 object-contain" />
                        {definition.koreanName}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${roleBarClass(row.role)}`} style={{ width: `${Math.round((row.total / maxRoleTotal) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-600">
            <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-purple-600" />강력/찬란은 합산 {summary.reforged}개</p>
            <p className="flex items-center gap-2"><Sparkles size={14} className="text-amber-500" />입력값이 장착 수량보다 적으면 여유 수량은 0으로 표시됩니다.</p>
          </div>
        </aside>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map(({ definition, entry, total, equippedTotal, spare }) => (
            <article key={definition.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Image src={ctpIconSrc(definition.id)} alt={`${definition.koreanName} CTP`} width={42} height={42} unoptimized className="h-11 w-11 object-contain" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-black text-slate-950">{definition.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${roleBadgeClass(definition.role)}`}>{definition.role}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">{definition.koreanName}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black text-slate-950">{total}</p>
                  <p className="text-[10px] font-black text-slate-400">보유</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {grades.map((grade) => (
                  <CountStepper
                    key={`${definition.id}-${grade}`}
                    label={`${definition.name} ${ctpGradeLabels[grade]} 수량`}
                    grade={grade}
                    value={entry[grade]}
                    onChange={(value) => updateCount(definition.id, grade, value)}
                  />
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px] font-black">
                <div className="rounded-2xl bg-white p-2 text-slate-500">
                  <span className="block text-slate-400">장착</span>
                  {equippedTotal}
                </div>
                <div className="rounded-2xl bg-white p-2 text-emerald-700">
                  <span className="block text-slate-400">여유</span>
                  {spare}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
