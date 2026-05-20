'use client';

import Image from 'next/image';
import { useMemo, useState, type SyntheticEvent } from 'react';
import {
  thanosVibsTierListMeta,
  tierListRowsByMode,
  type TierListCombatType,
  type TierListMode,
} from '@mff-data-hub/data';
import { normalizeTierSearch, resolveTierListEntry, type ResolvedTierEntry } from '../../lib/tierListResolver';

type TypeFilter = 'ALL' | TierListCombatType;

const typeOrder: TierListCombatType[] = ['Combat', 'Blast', 'Speed', 'Universal'];
const typeLabels: Record<TierListCombatType, string> = {
  Combat: '컴뱃',
  Blast: '블래스트',
  Speed: '스피드',
  Universal: '유니버셜',
};
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

function imageFallback(event: SyntheticEvent<HTMLImageElement>, label: string) {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=f8fafc&color=334155&bold=true`;
}

function TierCharacterCard({ entry }: { entry: ResolvedTierEntry }) {
  return (
    <article className="grid min-h-[76px] grid-cols-[46px_minmax(0,1fr)] gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className="relative h-[46px] w-[46px] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
        <Image
          src={entry.imageUrl}
          alt={entry.displayName}
          fill
          sizes="46px"
          unoptimized
          className="object-cover"
          onError={(event) => imageFallback(event, entry.displayName)}
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-2 min-h-8 text-[11px] font-black leading-tight text-slate-950">{entry.displayName}</p>
          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500">#{entry.order}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-[10px] font-bold leading-tight text-slate-500">{entry.sourceLabel}</p>
        <div className="mt-1 flex items-center gap-1">
          <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black ${typeTone[entry.type]}`}>{typeLabels[entry.type]}</span>
          {entry.matched ? <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">DB</span> : null}
        </div>
      </div>
    </article>
  );
}

export function TierListSection({ mode }: { mode: TierListMode }) {
  const copy = modeCopy[mode];
  const rows = tierListRowsByMode[mode];
  const tierOptions = useMemo(() => ['ALL', ...rows.map((row) => row.tier)] as const, [rows]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const resolvedRows = useMemo(() => rows.map((row) => ({
    ...row,
    entries: row.entries.map(resolveTierListEntry),
  })), [rows]);
  const allResolvedEntries = useMemo(() => resolvedRows.flatMap((row) => row.entries), [resolvedRows]);
  const normalizedQuery = normalizeTierSearch(query);
  const filteredRows = useMemo(() => resolvedRows
    .filter((row) => tierFilter === 'ALL' || row.tier === tierFilter)
    .map((row) => ({
      ...row,
      entries: row.entries.filter((entry) => {
        const typeMatches = typeFilter === 'ALL' || entry.type === typeFilter;
        const queryMatches = !normalizedQuery || entry.searchText.includes(normalizedQuery);
        return typeMatches && queryMatches;
      }),
    }))
    .filter((row) => row.entries.length > 0), [normalizedQuery, resolvedRows, tierFilter, typeFilter]);
  const matchedCount = allResolvedEntries.filter((entry) => entry.matched).length;
  const visibleCount = filteredRows.reduce((sum, row) => sum + row.entries.length, 0);

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

      <section className="space-y-4">
        {filteredRows.map((row) => (
          <article key={row.tier} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-px bg-slate-100 xl:grid-cols-[160px_repeat(4,minmax(0,1fr))]">
              <div className="bg-white p-3 xl:p-4">
                <span className={`inline-flex rounded-2xl px-4 py-2 text-sm font-black ${tierTone[row.tier] ?? 'bg-slate-950 text-white'}`}>{row.tier}</span>
                <p className="mt-2 text-xs font-black text-slate-500">{row.entries.length}명</p>
              </div>
              {typeOrder.map((type) => {
                const entries = row.entries.filter((entry) => entry.type === type);
                return (
                  <div key={`${row.tier}-${type}`} className={`min-h-[128px] border-l p-3 ${typeSurfaceTone[type]}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${typeTone[type]}`}>{typeLabels[type]}</span>
                      <span className="text-[10px] font-black text-slate-400">{entries.length}</span>
                    </div>
                    {entries.length ? (
                      <div className="grid gap-2 2xl:grid-cols-2">
                        {entries.map((entry) => (
                          <TierCharacterCard key={`${row.tier}-${entry.type}-${entry.order}-${entry.sourceName}`} entry={entry} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid min-h-[76px] place-items-center rounded-xl border border-dashed border-white/80 bg-white/60 text-xs font-black text-slate-300">EMPTY</div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      {filteredRows.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-black text-slate-400">검색 결과 없음</p>
        </section>
      ) : null}
    </section>
  );
}
