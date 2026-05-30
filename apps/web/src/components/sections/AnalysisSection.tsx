'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Download,
  Filter,
  Gem,
  Info,
  ListFilter,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { userRoster } from '@/lib/data';
import { ctpDefinitions, parseCtpName } from '@/lib/ctpInventory';
import { catalogCharacters, type CatalogCharacter, type CatalogUniform } from '@mff-data-hub/data';
import type { UserCharacter } from '@mff-data-hub/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

type StoredMyCharacterBuild = {
  tier?: string;
  level?: number;
  artifactStars?: number;
  ctp?: string;
  eliteGearUnlocked?: boolean;
  eliteGearLevel?: number;
  ownedUniforms?: Record<string, boolean>;
  uniformRanks?: Record<string, string[]>;
};

type AnalysisRow = {
  character: CatalogCharacter;
  build: {
    tier: string;
    level: number;
    artifactStars: number;
    ctp: string;
    eliteGearUnlocked: boolean;
    eliteGearLevel: number;
    ownedUniforms: Record<string, boolean>;
    uniformRanks: Record<string, string[]>;
  };
};

type SortKey = 'growth' | 'tier' | 'ctp' | 'artifact' | 'uniform';
type ViewKey = 'summary' | 'character' | 'tier' | 'gear' | 'ctp' | 'artifact';

const myCharacterStorageKey = 'mff-data-hub:my-character-builds:v1';
const uniformRankOrder = ['normal', 'advanced', 'rare', 'heroic', 'legendary', 'mythic'] as const;
const tierOrder = ['T4', 'T3', '초월', 'T2', 'T1'] as const;
const combatTypeOrder = ['Combat', 'Speed', 'Blast', 'Universal', 'Unknown'] as const;
const chartColors = ['bg-violet-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500', 'bg-slate-400'];

const uniformRankLabels: Record<(typeof uniformRankOrder)[number], string> = {
  normal: '일반',
  advanced: '고급',
  rare: '희귀',
  heroic: '영웅',
  legendary: '전설',
  mythic: '신화',
};

const tierLabels: Record<string, string> = {
  T4: '티어 4',
  T3: '티어 3',
  초월: '초월',
  T2: '티어 2',
  T1: '티어 1',
};

const combatTypeLabels: Record<CatalogCharacter['type'], string> = {
  Combat: '컴뱃',
  Speed: '스피드',
  Blast: '블래스트',
  Universal: '유니버셜',
  Unknown: '기타',
};

const sideLabels: Record<CatalogCharacter['side'], string> = {
  Hero: '영웅',
  Villain: '빌런',
  Neutral: '중립',
  Unknown: '기타',
};

const hexColors: Record<string, string> = {
  'bg-violet-500': '#7c3aed',
  'bg-purple-500': '#8b5cf6',
  'bg-blue-500': '#3b82f6',
  'bg-cyan-500': '#06b6d4',
  'bg-slate-400': '#94a3b8',
  'bg-slate-500': '#64748b',
  'bg-emerald-500': '#10b981',
  'bg-amber-500': '#f59e0b',
  'bg-rose-500': '#f43f5e',
};

const tierHexColors: Record<string, string> = {
  T4: '#6d28d9',
  T3: '#7c3aed',
  초월: '#3b82f6',
  T2: '#06b6d4',
  T1: '#94a3b8',
};

const rankScore: Record<string, number> = {
  normal: 1,
  advanced: 2,
  rare: 3,
  heroic: 4,
  legendary: 5,
  mythic: 6,
};

const tierScore: Record<string, number> = {
  T4: 5,
  T3: 4,
  초월: 3.5,
  T2: 2,
  T1: 1,
};

const viewTabs: Array<{ key: ViewKey; label: string }> = [
  { key: 'summary', label: '종합' },
  { key: 'character', label: '캐릭터' },
  { key: 'tier', label: '티어' },
  { key: 'gear', label: '장비' },
  { key: 'ctp', label: 'CTP' },
  { key: 'artifact', label: '아티팩트' },
];

const rosterByCharacterKey = new Map(userRoster.map((character) => [normalizeRosterKey(character.characterId), character]));

function normalizeRosterKey(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function normalizeTier(value?: string) {
  if (value === 'T4' || value === 'Native T4' || value === '4') return 'T4';
  if (value === 'Awakened') return '초월';
  if (value === 'T3' || value === 'Native T3' || value === '3') return 'T3';
  if (value === 'T2' || value === 'Native T2' || value === '2') return 'T2';
  return 'T1';
}

function normalizeUniformRank(value?: string) {
  const rank = String(value ?? '').toLowerCase();
  if (['normal', 'advanced', 'rare', 'heroic', 'legendary', 'mythic'].includes(rank)) return rank;
  return '';
}

function readStoredMyBuilds(): Record<string, StoredMyCharacterBuild> {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(myCharacterStorageKey) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, StoredMyCharacterBuild>) : {};
  } catch {
    return {};
  }
}

function getRosterForCharacter(character: CatalogCharacter): UserCharacter | undefined {
  return rosterByCharacterKey.get(normalizeRosterKey(character.id)) ?? rosterByCharacterKey.get(normalizeRosterKey(character.name));
}

function uniformOwnershipKey(uniform: CatalogUniform, index: number) {
  return `${index}:${uniform.name}`;
}

function isRosterUniformOwned(roster: UserCharacter | undefined, uniform: CatalogUniform, index: number) {
  if (!roster?.uniformOwned) return false;
  if (!roster.uniformId) return index === 0;
  const rosterUniformKey = normalizeRosterKey(roster.uniformId);
  return index === 0 || normalizeRosterKey(uniform.name) === rosterUniformKey;
}

function defaultOwnedUniforms(character: CatalogCharacter, roster: UserCharacter | undefined) {
  return character.uniforms.reduce((acc, uniform, index) => {
    acc[uniformOwnershipKey(uniform, index)] = isRosterUniformOwned(roster, uniform, index);
    return acc;
  }, {} as Record<string, boolean>);
}

function defaultUniformRanks(character: CatalogCharacter, roster: UserCharacter | undefined) {
  const rank = normalizeUniformRank(roster?.uniformRank);
  if (!rank || rank === 'none') return {};

  return character.uniforms.reduce((acc, uniform, index) => {
    if (isRosterUniformOwned(roster, uniform, index)) acc[uniformOwnershipKey(uniform, index)] = [rank];
    return acc;
  }, {} as Record<string, string[]>);
}

function normalizeUniformRanks(uniformRanks?: Record<string, string[]>) {
  return Object.entries(uniformRanks ?? {}).reduce<Record<string, string[]>>((normalized, [key, ranks]) => {
    if (!Array.isArray(ranks)) return normalized;
    const validRanks = ranks.map(normalizeUniformRank).filter(Boolean);
    if (validRanks.length > 0) normalized[key] = [...new Set(validRanks)];
    return normalized;
  }, {});
}

function normalizeBuild(character: CatalogCharacter, stored?: StoredMyCharacterBuild) {
  const roster = getRosterForCharacter(character);
  const fallback = {
    tier: normalizeTier(roster?.tier),
    level: clampInteger(roster?.level, roster?.owned === false ? 60 : 70, 60, 80),
    artifactStars: clampInteger(roster?.artifactStars, 0, 0, 6),
    ctp: roster?.ctp ?? '미장착',
    eliteGearUnlocked: false,
    eliteGearLevel: 0,
    ownedUniforms: defaultOwnedUniforms(character, roster),
    uniformRanks: defaultUniformRanks(character, roster),
  };

  return {
    tier: normalizeTier(stored?.tier ?? fallback.tier),
    level: clampInteger(stored?.level, fallback.level, 60, 80),
    artifactStars: clampInteger(stored?.artifactStars, fallback.artifactStars, 0, 6),
    ctp: typeof stored?.ctp === 'string' ? stored.ctp : fallback.ctp,
    eliteGearUnlocked: Boolean(stored?.eliteGearUnlocked ?? fallback.eliteGearUnlocked),
    eliteGearLevel: clampInteger(stored?.eliteGearLevel, fallback.eliteGearLevel, 0, 20),
    ownedUniforms: { ...fallback.ownedUniforms, ...(stored?.ownedUniforms ?? {}) },
    uniformRanks: { ...fallback.uniformRanks, ...normalizeUniformRanks(stored?.uniformRanks) },
  };
}

function formatNumber(value: number, digits = 0) {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function formatPercent(value: number, digits = 1) {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: digits })}%`;
}

function getHexColor(tailwindColor: string) {
  return hexColors[tailwindColor] || tailwindColor || '#64748b';
}

function chartItem(label: string, value: number, color: string): ChartDatum {
  return { label, value, color };
}

function hasEquippedCtp(ctp: string) {
  const value = ctp.trim();
  return Boolean(value && value !== '미장착' && value.toLowerCase() !== 'none');
}

function ctpKindLabel(ctp: string) {
  if (ctp === 'Ultimate Obelisk') return '특장';
  const parsed = parseCtpName(ctp);
  const definition = parsed ? ctpDefinitions.find((item) => item.id === parsed.ctpId) : undefined;
  return definition?.koreanName ?? ctp;
}

function ctpKindData(rows: AnalysisRow[]) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    if (!hasEquippedCtp(row.build.ctp)) return;
    const label = ctpKindLabel(row.build.ctp);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  const equippedTotal = Array.from(counts.values()).reduce((total, value) => total + value, 0);
  const missing = Math.max(0, rows.length - equippedTotal);
  if (missing > 0) counts.set('보유 없음', missing);

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ko'))
    .map(([label, value], index) => chartItem(label, value, chartColors[index % chartColors.length]));
}

function artifactStarData(rows: AnalysisRow[]) {
  return [
    chartItem('미보유', rows.filter((row) => row.build.artifactStars < 3).length, 'bg-slate-500'),
    chartItem('3성', rows.filter((row) => row.build.artifactStars === 3).length, 'bg-cyan-500'),
    chartItem('4성', rows.filter((row) => row.build.artifactStars === 4).length, 'bg-blue-500'),
    chartItem('5성', rows.filter((row) => row.build.artifactStars === 5).length, 'bg-violet-500'),
    chartItem('6성', rows.filter((row) => row.build.artifactStars >= 6).length, 'bg-amber-500'),
  ];
}

function strongestUniformRank(ranks: string[] | undefined) {
  const normalized = (ranks ?? []).map(normalizeUniformRank).filter(Boolean);
  if (!normalized.length) return 'normal';
  return [...uniformRankOrder].reverse().find((rank) => normalized.includes(rank)) ?? 'normal';
}

function getOwnedUniformEntries(row: AnalysisRow) {
  return row.character.uniforms
    .map((uniform, index) => {
      const key = uniformOwnershipKey(uniform, index);
      return {
        key,
        owned: Boolean(row.build.ownedUniforms[key]),
        rank: strongestUniformRank(row.build.uniformRanks[key]),
      };
    })
    .filter((entry) => entry.owned);
}

function hasMythicUniform(row: AnalysisRow) {
  return getOwnedUniformEntries(row).some((entry) => entry.rank === 'mythic');
}

function uniformRankData(rows: AnalysisRow[]) {
  const counts = {
    missing: 0,
    normal: 0,
    advanced: 0,
    rare: 0,
    heroic: 0,
    legendary: 0,
    mythic: 0,
  };

  rows.forEach((row) => {
    row.character.uniforms.forEach((uniform, index) => {
      const key = uniformOwnershipKey(uniform, index);
      if (!row.build.ownedUniforms[key]) {
        counts.missing += 1;
        return;
      }
      counts[strongestUniformRank(row.build.uniformRanks[key])] += 1;
    });
  });

  return [
    chartItem('미보유', counts.missing, 'bg-slate-500'),
    ...uniformRankOrder.map((rank, index) => chartItem(uniformRankLabels[rank], counts[rank], chartColors[index % chartColors.length])),
  ];
}

function growthScore(row: AnalysisRow) {
  const levelScore = Math.max(0, row.build.level - 60) * 1.6;
  const artifactScore = row.build.artifactStars * 6;
  const ctpScore = hasEquippedCtp(row.build.ctp) ? 14 : 0;
  const uniformScore = getOwnedUniformEntries(row).reduce((total, entry) => total + rankScore[entry.rank] * 1.5, 0);
  const eliteScore = row.build.eliteGearUnlocked ? Math.min(10, row.build.eliteGearLevel / 2) : 0;
  return tierScore[row.build.tier] * 22 + levelScore + artifactScore + ctpScore + uniformScore + eliteScore;
}

function getAverageUniformRank(rows: AnalysisRow[]) {
  const ranks = rows.flatMap((row) => getOwnedUniformEntries(row).map((entry) => rankScore[entry.rank]));
  if (!ranks.length) return 0;
  return ranks.reduce((sum, value) => sum + value, 0) / ranks.length;
}

function getAverageArtifactStars(rows: AnalysisRow[]) {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + row.build.artifactStars, 0) / rows.length;
}

function getSpecRadarData(rows: AnalysisRow[]) {
  const count = Math.max(1, rows.length);
  const avgTier = rows.reduce((sum, row) => sum + (tierScore[row.build.tier] ?? 1), 0) / count;
  const avgLevel = rows.reduce((sum, row) => sum + ((row.build.level - 60) / 20) * 5, 0) / count;
  const avgCtp = (rows.filter((row) => hasEquippedCtp(row.build.ctp)).length / count) * 5;
  const avgArtifact = rows.reduce((sum, row) => sum + Math.min(5, row.build.artifactStars), 0) / count;
  const avgUniform = getAverageUniformRank(rows) * (5 / 6);

  return [
    { label: '공격력', max: 5, target: 4, current: Math.max(1, avgTier) },
    { label: '방어력', max: 5, target: 4, current: Math.max(1, avgLevel) },
    { label: '생명력', max: 5, target: 4, current: Math.max(1, avgUniform) },
    { label: '스킬 쿨타임', max: 5, target: 4, current: Math.max(1, avgCtp) },
    { label: '에너지 공격력', max: 5, target: 4, current: Math.max(1, avgArtifact) },
  ];
}

function buildTypeTierMatrix(rows: AnalysisRow[]) {
  return combatTypeOrder.map((type) => {
    const matchingRows = rows.filter((row) => row.character.type === type);
    return {
      type,
      label: combatTypeLabels[type],
      total: matchingRows.length,
      T4: matchingRows.filter((row) => row.build.tier === 'T4').length,
      T3: matchingRows.filter((row) => row.build.tier === 'T3').length,
      초월: matchingRows.filter((row) => row.build.tier === '초월').length,
      T2: matchingRows.filter((row) => row.build.tier === 'T2').length,
      T1: matchingRows.filter((row) => row.build.tier === 'T1').length,
    };
  }).filter((item) => item.total > 0);
}

function buildTierSummaryRows(matrix: ReturnType<typeof buildTypeTierMatrix>) {
  const total = {
    label: '합계',
    total: matrix.reduce((sum, item) => sum + item.total, 0),
    T4: matrix.reduce((sum, item) => sum + item.T4, 0),
    T3: matrix.reduce((sum, item) => sum + item.T3, 0),
    초월: matrix.reduce((sum, item) => sum + item.초월, 0),
    T2: matrix.reduce((sum, item) => sum + item.T2, 0),
    T1: matrix.reduce((sum, item) => sum + item.T1, 0),
  };

  return [...matrix, total];
}

function rowMatchesRank(row: AnalysisRow, label: string) {
  if (label === '미보유') {
    return row.character.uniforms.some((uniform, index) => !row.build.ownedUniforms[uniformOwnershipKey(uniform, index)]);
  }

  const targetRankKey = (Object.keys(uniformRankLabels) as Array<keyof typeof uniformRankLabels>).find(
    (key) => uniformRankLabels[key] === label,
  );

  if (!targetRankKey) return false;
  return getOwnedUniformEntries(row).some((entry) => entry.rank === targetRankKey);
}

function sortRows(rows: AnalysisRow[], sortKey: SortKey) {
  return [...rows].sort((left, right) => {
    if (sortKey === 'tier') return (tierScore[right.build.tier] ?? 0) - (tierScore[left.build.tier] ?? 0) || right.build.level - left.build.level;
    if (sortKey === 'ctp') return Number(hasEquippedCtp(right.build.ctp)) - Number(hasEquippedCtp(left.build.ctp)) || growthScore(right) - growthScore(left);
    if (sortKey === 'artifact') return right.build.artifactStars - left.build.artifactStars || growthScore(right) - growthScore(left);
    if (sortKey === 'uniform') return getOwnedUniformEntries(right).length - getOwnedUniformEntries(left).length || growthScore(right) - growthScore(left);
    return growthScore(right) - growthScore(left);
  });
}

function SmallInfoIcon() {
  return <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-10 min-w-[132px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function MetricPanel({
  title,
  value,
  detail,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'purple' | 'cyan' | 'blue';
  children?: React.ReactNode;
}) {
  const accentStyles = {
    purple: 'text-purple-700 bg-purple-50',
    cyan: 'text-cyan-700 bg-cyan-50',
    blue: 'text-blue-700 bg-blue-50',
  }[accent];

  return (
    <article className="min-h-[156px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-black text-slate-950">{title}</h3>
            <SmallInfoIcon />
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${accentStyles}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-3xl font-black ${accent === 'purple' ? 'text-purple-700' : accent === 'cyan' ? 'text-cyan-700' : 'text-blue-700'}`}>{value}</p>
        {children ? <div className="min-w-0 flex-1">{children}</div> : null}
      </div>
    </article>
  );
}

function MiniBars({ data, total }: { data: ChartDatum[]; total: number }) {
  return (
    <div className="space-y-1.5">
      {data.slice(0, 5).map((item) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label} className="grid grid-cols-[54px_minmax(0,1fr)_42px] items-center gap-2 text-[10px] font-black text-slate-500">
            <span className="truncate text-slate-700">{item.label}</span>
            <span className="h-1.5 rounded-full bg-slate-100">
              <span className="block h-full rounded-full" style={{ width: `${Math.max(3, percent)}%`, backgroundColor: getHexColor(item.color) }} />
            </span>
            <span className="text-right">{formatPercent(percent, 1)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const angle = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div className="flex items-center justify-end gap-3">
      <div
        className="grid h-[88px] w-[88px] place-items-center rounded-full"
        style={{ background: `conic-gradient(#6d28d9 ${angle}deg, #eef2ff 0deg)` }}
      >
        <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-center">
          <span className="text-xs font-black text-slate-950">{label}</span>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="mt-3 flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(value) ? 'fill-blue-500 text-blue-500' : 'fill-slate-200 text-slate-200'}`}
        />
      ))}
    </div>
  );
}

function TypeTierChart({ data }: { data: ReturnType<typeof buildTypeTierMatrix> }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fill: '#334155', fontSize: 11, fontWeight: 800 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
        <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
        {tierOrder.map((tier) => (
          <Bar key={tier} dataKey={tier} name={tierLabels[tier]} stackId="tier" fill={tierHexColors[tier]} radius={tier === 'T4' ? [5, 5, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function CtpDonutChart({ data, total }: { data: ChartDatum[]; total: number }) {
  const formatted = data.map((item) => ({ ...item, hexColor: getHexColor(item.color) }));

  return (
    <div className="grid min-h-[244px] gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={formatted} cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={1} dataKey="value">
              {formatted.map((entry) => <Cell key={entry.label} fill={entry.hexColor} />)}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] font-black text-slate-500">전체</p>
            <p className="text-2xl font-black text-slate-950">{formatNumber(total)}</p>
          </div>
        </div>
      </div>
      <div className="grid content-center gap-2">
        {formatted.slice(0, 6).map((item) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 text-xs font-bold text-slate-600">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.hexColor }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-right text-slate-700">{formatNumber(item.value)} ({formatPercent(percent, 1)})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpecRadarChart({ data }: { data: ReturnType<typeof getSpecRadarData> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="label" tick={{ fill: '#334155', fontSize: 11, fontWeight: 800 }} />
        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Radar name="상한" dataKey="max" stroke="#6d28d9" fill="#6d28d9" fillOpacity={0.05} />
        <Radar name="기준" dataKey="target" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.05} />
        <Radar name="현재" dataKey="current" stroke="#0284c7" fill="#06b6d4" fillOpacity={0.2} />
        <RechartsTooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function PanelShell({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-base font-black text-slate-950">
          {title}
          <SmallInfoIcon />
        </h3>
      </div>
      {children}
    </section>
  );
}

function CharacterAvatar({ row }: { row: AnalysisRow }) {
  return (
    <img
      src={row.character.imageUrl}
      alt={row.character.name}
      className="h-8 w-8 rounded-md border border-slate-200 bg-slate-100 object-cover"
      onError={(event) => {
        event.currentTarget.src = `https://thanosvibs.money/static/assets/portraits/${row.character.id}.png`;
      }}
    />
  );
}

export function AnalysisSection() {
  const [storedMyBuilds, setStoredMyBuilds] = useState<Record<string, StoredMyCharacterBuild>>({});
  const [activeView, setActiveView] = useState<ViewKey>('summary');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [sideFilter, setSideFilter] = useState('전체');
  const [tierFilter, setTierFilter] = useState('전체');
  const [sortKey, setSortKey] = useState<SortKey>('growth');

  useEffect(() => {
    setStoredMyBuilds(readStoredMyBuilds());
  }, []);

  const analysis = useMemo(() => {
    const storedByNormalizedKey = new Map(Object.entries(storedMyBuilds).map(([key, value]) => [normalizeRosterKey(key), value]));
    const rows = catalogCharacters
      .map((character) => {
        const stored = storedMyBuilds[character.id] ?? storedByNormalizedKey.get(normalizeRosterKey(character.id));
        const roster = getRosterForCharacter(character);
        if (!stored && !roster?.owned) return null;
        return { character, build: normalizeBuild(character, stored) };
      })
      .filter((row): row is AnalysisRow => Boolean(row));

    const filteredRows = rows.filter((row) => (
      (typeFilter === '전체' || row.character.type === typeFilter) &&
      (sideFilter === '전체' || row.character.side === sideFilter) &&
      (tierFilter === '전체' || row.build.tier === tierFilter)
    ));

    const t3PlusCount = filteredRows.filter((row) => ['T4', 'T3', '초월'].includes(row.build.tier)).length;
    const equippedCtpCount = filteredRows.filter((row) => hasEquippedCtp(row.build.ctp)).length;
    const artifactReadyCount = filteredRows.filter((row) => row.build.artifactStars >= 4).length;
    const mythicUniformCount = filteredRows.filter(hasMythicUniform).length;
    const allUniformData = uniformRankData(rows);
    const allArtifactData = artifactStarData(rows);
    const allCtpData = ctpKindData(rows);
    const ctpData = ctpKindData(filteredRows);
    const artifactData = artifactStarData(filteredRows);
    const uniformData = uniformRankData(filteredRows);
    const typeTierMatrix = buildTypeTierMatrix(filteredRows);
    const topRows = sortRows(filteredRows, sortKey).slice(0, 10);
    const rosterGrowthRate = filteredRows.length > 0 ? (t3PlusCount / filteredRows.length) * 100 : 0;
    const ctpRate = filteredRows.length > 0 ? (equippedCtpCount / filteredRows.length) * 100 : 0;
    const avgUniformRank = getAverageUniformRank(filteredRows);
    const avgArtifactStars = getAverageArtifactStars(filteredRows);

    return {
      rows,
      filteredRows,
      t3PlusCount,
      equippedCtpCount,
      artifactReadyCount,
      mythicUniformCount,
      allUniformData,
      allArtifactData,
      allCtpData,
      ctpData,
      artifactData,
      uniformData,
      typeTierMatrix,
      tierSummaryRows: buildTierSummaryRows(typeTierMatrix),
      topRows,
      rosterGrowthRate,
      ctpRate,
      avgUniformRank,
      avgArtifactStars,
      specRadarData: getSpecRadarData(filteredRows),
    };
  }, [sideFilter, sortKey, storedMyBuilds, tierFilter, typeFilter]);

  const resetFilters = () => {
    setTypeFilter('전체');
    setSideFilter('전체');
    setTierFilter('전체');
    setSortKey('growth');
    setActiveView('summary');
  };

  const totalFiltered = Math.max(1, analysis.filteredRows.length);
  const primaryTierData = tierOrder.map((tier, index) => chartItem(tierLabels[tier], analysis.filteredRows.filter((row) => row.build.tier === tier).length, chartColors[index % chartColors.length]));
  const dominantTierLabel = primaryTierData.reduce((best, item) => item.value > best.value ? item : best, primaryTierData[0]).label;

  return (
    <section className="space-y-3" data-testid="owned-character-analysis">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-1 flex h-10 items-center gap-2 text-sm font-black text-slate-950">
            <Filter className="h-4 w-4 text-slate-500" />
            필터
          </div>
          <label className="grid gap-1.5 text-xs font-black text-slate-500">
            기간
            <span className="flex h-10 min-w-[180px] items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">
              2025-05-01 ~ 2025-05-31
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </span>
          </label>
          <SelectField label="콘텐츠" value={activeView} onChange={(value) => setActiveView(value as ViewKey)} options={viewTabs.map((tab) => ({ label: tab.label, value: tab.key }))} />
          <SelectField
            label="정렬 기준"
            value={sortKey}
            onChange={(value) => setSortKey(value as SortKey)}
            options={[
              { label: '성장률', value: 'growth' },
              { label: '티어', value: 'tier' },
              { label: 'CTP', value: 'ctp' },
              { label: '아티팩트', value: 'artifact' },
              { label: '유니폼', value: 'uniform' },
            ]}
          />
          <SelectField
            label="티어"
            value={tierFilter}
            onChange={setTierFilter}
            options={[{ label: '전체', value: '전체' }, ...tierOrder.map((tier) => ({ label: tierLabels[tier], value: tier }))]}
          />
          <SelectField
            label="진영"
            value={sideFilter}
            onChange={setSideFilter}
            options={[
              { label: '전체', value: '전체' },
              { label: '영웅', value: 'Hero' },
              { label: '빌런', value: 'Villain' },
              { label: '중립', value: 'Neutral' },
              { label: '기타', value: 'Unknown' },
            ]}
          />
          <SelectField
            label="타입"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ label: '전체', value: '전체' }, ...combatTypeOrder.map((type) => ({ label: combatTypeLabels[type], value: type }))]}
          />
          <button type="button" onClick={resetFilters} className="ml-auto flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700">
            <RefreshCw className="h-4 w-4" />
            필터 초기화
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-black text-slate-950">차트 모드</p>
            <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-xs font-black text-slate-500 sm:flex">
              {viewTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setActiveView(tab.key)}
                  className={`h-8 min-w-[74px] rounded-md px-3 transition ${activeView === tab.key ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-white hover:text-slate-800'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-50">
              <Download className="h-4 w-4" />
              CSV 다운로드
            </button>
            <button type="button" className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-50">
              <Share2 className="h-4 w-4" />
              공유
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-5">
        <MetricPanel title="로스터 성장 분포" value={formatPercent(analysis.rosterGrowthRate, 1)} detail="전체 평균 성장률" icon={Users} accent="purple">
          <ProgressRing value={analysis.rosterGrowthRate} label={`${formatNumber(analysis.t3PlusCount)} / ${formatNumber(analysis.filteredRows.length)}`} />
        </MetricPanel>
        <MetricPanel title="티어 분포" value={dominantTierLabel} detail="최다 비중 티어" icon={Trophy} accent="purple">
          <MiniBars data={primaryTierData} total={totalFiltered} />
        </MetricPanel>
        <MetricPanel title="CTP 보유율" value={formatPercent(analysis.ctpRate, 1)} detail="전체 보유율" icon={Swords} accent="cyan">
          <MiniBars data={analysis.ctpData} total={totalFiltered} />
        </MetricPanel>
        <MetricPanel title="유니폼 랭크" value={formatNumber(analysis.avgUniformRank, 2)} detail="평균 유니폼 랭크" icon={Sparkles} accent="purple">
          <StarRating value={analysis.avgUniformRank} />
        </MetricPanel>
        <MetricPanel title="아티팩트 별" value={formatNumber(analysis.avgArtifactStars, 2)} detail="평균 아티팩트 별" icon={Gem} accent="blue">
          <StarRating value={analysis.avgArtifactStars} max={6} />
        </MetricPanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <PanelShell title="티어별 캐릭터 보유 분포">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-black text-slate-500">
            {tierOrder.map((tier) => (
              <span key={tier} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: tierHexColors[tier] }} />
                {tierLabels[tier]}
              </span>
            ))}
          </div>
          <TypeTierChart data={analysis.typeTierMatrix} />
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-center text-xs">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500">
                <tr>
                  <th className="px-2 py-2 text-left">티어</th>
                  <th className="px-2 py-2">전체</th>
                  {analysis.typeTierMatrix.map((item) => <th key={item.label} className="px-2 py-2">{item.label}</th>)}
                </tr>
              </thead>
              <tbody className="font-bold text-slate-700">
                {tierOrder.map((tier) => (
                  <tr key={tier} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-black">{tierLabels[tier]}</td>
                    <td className="px-2 py-2">{analysis.filteredRows.filter((row) => row.build.tier === tier).length}</td>
                    {analysis.typeTierMatrix.map((item) => <td key={`${tier}-${item.label}`} className="px-2 py-2">{item[tier]}</td>)}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-slate-50 font-black text-slate-950">
                  <td className="px-2 py-2 text-left">합계</td>
                  <td className="px-2 py-2">{analysis.filteredRows.length}</td>
                  {analysis.typeTierMatrix.map((item) => <td key={`total-${item.label}`} className="px-2 py-2">{item.total}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </PanelShell>

        <div className="grid gap-3">
          <PanelShell title="CTP 보유 분포">
            <CtpDonutChart data={analysis.ctpData} total={analysis.filteredRows.length} />
          </PanelShell>
          <PanelShell title="평균 스펙 분포 (티어 기준)">
            <SpecRadarChart data={analysis.specRadarData} />
          </PanelShell>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PanelShell title="전용 아티팩트 보유">
          <div className="mb-3 grid grid-cols-5 gap-2 text-center text-xs font-black text-slate-600">
            {analysis.artifactData.map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 px-2 py-2">
                <p className="text-[11px] text-slate-500">{item.label}</p>
                <p className="mt-1 text-lg text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
          <MiniBars data={analysis.artifactData} total={totalFiltered} />
        </PanelShell>

        <PanelShell title="유니폼 보유 분석">
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.uniformData.slice(0, 8).map((item) => {
              const percent = analysis.uniformData.reduce((sum, datum) => sum + datum.value, 0) > 0
                ? (item.value / analysis.uniformData.reduce((sum, datum) => sum + datum.value, 0)) * 100
                : 0;
              return (
                <div key={item.label} className="grid grid-cols-[70px_minmax(0,1fr)_52px] items-center gap-2 text-xs font-black text-slate-600">
                  <span>{item.label}</span>
                  <span className="h-2 rounded-full bg-slate-100">
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(2, percent)}%`, backgroundColor: getHexColor(item.color) }} />
                  </span>
                  <span className="text-right">{formatPercent(percent, 1)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">성장 단계 분포, 레벨 구간 분포, CTP/특장 장착 종류와 함께 나의 캐릭터 입력 기반 통계를 구성합니다.</p>
        </PanelShell>
      </section>

      <PanelShell title="캐릭터 성장을 TOP 10">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">순위</th>
                <th className="px-3 py-2 text-left">캐릭터</th>
                <th className="px-3 py-2">티어</th>
                <th className="px-3 py-2">성장률</th>
                <th className="px-3 py-2">타입</th>
                <th className="px-3 py-2">진영</th>
                <th className="px-3 py-2">유니폼 랭크</th>
                <th className="px-3 py-2">아티팩트 별</th>
                <th className="px-3 py-2">CTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {analysis.topRows.map((row, index) => {
                const uniformRanks = getOwnedUniformEntries(row).map((entry) => entry.rank);
                const bestRank = [...uniformRankOrder].reverse().find((rank) => uniformRanks.includes(rank)) ?? 'normal';
                return (
                  <tr key={row.character.id} className="hover:bg-purple-50/40">
                    <td className="px-3 py-2 font-black text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CharacterAvatar row={row} />
                        <span className="font-black text-slate-950">{row.character.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-black text-slate-950">{tierLabels[row.build.tier] ?? row.build.tier}</td>
                    <td className="px-3 py-2 text-center">{formatPercent(Math.min(150, growthScore(row)), 1)}</td>
                    <td className="px-3 py-2 text-center">{combatTypeLabels[row.character.type]}</td>
                    <td className="px-3 py-2 text-center">{sideLabels[row.character.side]}</td>
                    <td className="px-3 py-2 text-center">{uniformRankLabels[bestRank]}</td>
                    <td className="px-3 py-2 text-center">{row.build.artifactStars >= 3 ? `${row.build.artifactStars}★` : '미보유'}</td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-center">{hasEquippedCtp(row.build.ctp) ? ctpKindLabel(row.build.ctp) : '미장착'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-black text-slate-500">
          <ListFilter className="h-4 w-4" />
          더보기
        </div>
      </PanelShell>

      <div className="hidden">
        <BarChart3 aria-hidden="true" />
      </div>
    </section>
  );
}
