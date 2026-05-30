'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { account } from '@/lib/data';
import type { Section } from '@/lib/navigation';

const pveItems = ['World Boss', 'ABL', 'ABX', '티어리스트'];
const pvpItems = ['Team Battle Arena', '아더월드', '타임라인', '티어리스트'];
const characterInfoItems = ['카드', 'X-소드', '팀업', 'CTP 인벤토리'];
const characterInfoSections: Record<string, Section> = {
  카드: 'accountCards',
  'X-소드': 'accountXSwords',
  팀업: 'accountTeamUps',
  'CTP 인벤토리': 'ctpInventory',
};
const pveSections: Record<string, Section> = {
  'World Boss': 'worldBoss',
  ABL: 'abl',
  ABX: 'abx',
  티어리스트: 'pveTier',
};
const pvpSections: Record<string, Section> = {
  'Team Battle Arena': 'teamBattleArena',
  아더월드: 'otherworld',
  타임라인: 'timeline',
  티어리스트: 'pvpTier',
};
type SidebarAccountProfile = {
  agentName: string;
  agentLevel: number;
  vip: number;
};
type SidebarAccountDraft = {
  agentName: string;
  agentLevel: string;
  vip: string;
};
type SidebarProps = {
  section: Section;
  setSection: (section: Section) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};
type SidebarPanelProps = {
  section: Section;
  selectSection: (section: Section) => void;
  showCloseButton?: boolean;
  onMobileClose?: () => void;
};

const sidebarAccountStorageKey = 'mff-data-hub:sidebar-account-profile:v1';
const defaultSidebarAccountProfile: SidebarAccountProfile = {
  agentName: account.agentName,
  agentLevel: account.agentLevel,
  vip: account.vip,
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

function normalizeAccountProfile(value?: Partial<SidebarAccountProfile>): SidebarAccountProfile {
  return {
    agentName: value?.agentName?.trim() || defaultSidebarAccountProfile.agentName,
    agentLevel: clampNumber(value?.agentLevel, defaultSidebarAccountProfile.agentLevel, 1, 999),
    vip: clampNumber(value?.vip, defaultSidebarAccountProfile.vip, 0, 30),
  };
}

function toAccountDraft(value: SidebarAccountProfile): SidebarAccountDraft {
  return {
    agentName: value.agentName,
    agentLevel: String(value.agentLevel),
    vip: String(value.vip),
  };
}

function readStoredAccountProfile() {
  if (typeof window === 'undefined') return toAccountDraft(defaultSidebarAccountProfile);

  try {
    const parsed = JSON.parse(window.localStorage.getItem(sidebarAccountStorageKey) ?? '{}') as Partial<SidebarAccountProfile>;
    return toAccountDraft(normalizeAccountProfile(parsed));
  } catch {
    return toAccountDraft(defaultSidebarAccountProfile);
  }
}

function NavItem({ icon, label, active, sub, onClick, badge }: { icon: string; label: string; active?: boolean; sub?: string; badge?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-purple-50 text-hub-purple ring-1 ring-purple-200' : 'text-slate-700 hover:bg-slate-50'}`}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight">{label}</p>
        {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
      </div>
      {badge ? <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black text-white">{badge}</span> : null}
    </button>
  );
}

function SidebarPanel({ section, selectSection, showCloseButton, onMobileClose }: SidebarPanelProps) {
  const [profile, setProfile] = useState<SidebarAccountDraft>(toAccountDraft(defaultSidebarAccountProfile));
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [charInfoExpanded, setCharInfoExpanded] = useState(true);
  const [pveExpanded, setPveExpanded] = useState(true);
  const [pvpExpanded, setPvpExpanded] = useState(true);

  useEffect(() => {
    setProfile(readStoredAccountProfile());
  }, []);

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeAccountProfile({
      agentName: profile.agentName,
      agentLevel: Number(profile.agentLevel),
      vip: Number(profile.vip),
    });
    setProfile(toAccountDraft(normalized));
    try {
      window.localStorage.setItem(sidebarAccountStorageKey, JSON.stringify(normalized));
    } catch {
      // The visible draft still updates if browser storage is unavailable.
    }
    setSaveState('saved');
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">✦</div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-950">MFF DATA HUB</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">Marvel Future Fight</p>
          </div>
        </div>
        {showCloseButton ? (
          <button type="button" aria-label="좌측 메뉴 닫기" onClick={onMobileClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-700">×</button>
        ) : null}
      </div>

      <section className="mb-5 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-black text-slate-950">계정 정보</p>
        <form onSubmit={saveProfile}>
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-white ring-4 ring-white">⚔</div>
            <div className="min-w-0 flex-1">
              <input
                value={profile.agentName}
                onChange={(event) => {
                  setProfile((previous) => ({ ...previous, agentName: event.target.value }));
                  setSaveState('idle');
                }}
                aria-label="계정 이름"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-950 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_42px] items-end gap-2 text-xs">
            <label className="rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200">
              <span className="block font-black text-slate-500">AGENT Lv</span>
              <input
                type="number"
                min={1}
                max={999}
                value={profile.agentLevel}
                onChange={(event) => {
                  setProfile((previous) => ({ ...previous, agentLevel: event.target.value }));
                  setSaveState('idle');
                }}
                aria-label="Agent 레벨"
                className="mt-1 w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-sm font-black text-slate-950 outline-none focus:border-purple-300"
              />
            </label>
            <label className="rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200">
              <span className="block font-black text-slate-500">VIP</span>
              <input
                type="number"
                min={0}
                max={30}
                value={profile.vip}
                onChange={(event) => {
                  setProfile((previous) => ({ ...previous, vip: event.target.value }));
                  setSaveState('idle');
                }}
                aria-label="VIP 레벨"
                className="mt-1 w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-sm font-black text-slate-950 outline-none focus:border-purple-300"
              />
            </label>
            <button
              type="submit"
              aria-label="계정 정보 저장"
              title={saveState === 'saved' ? '저장됨' : '계정 정보 저장'}
              className={`grid h-[42px] w-[42px] place-items-center rounded-xl text-lg font-black text-white transition ${saveState === 'saved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              ✓
            </button>
          </div>
        </form>
      </section>

      <nav className="space-y-1 text-sm">
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setCharInfoExpanded(!charInfoExpanded)}
            className="mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-2 font-black text-hub-purple hover:bg-slate-50 transition"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-600 text-white">👤</span>
              캐릭터 정보
            </span>
            <span className="text-xs transition-transform duration-200">{charInfoExpanded ? '⌄' : '›'}</span>
          </button>
          {charInfoExpanded && (
            <div className="ml-8 space-y-1 border-l border-slate-200 pl-3">
              {characterInfoItems.map((item) => {
                const targetSection = characterInfoSections[item];
                const active = section === targetSection;
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => selectSection(targetSection)}
                    className={`block w-full rounded-xl px-2 py-2 text-left ${active ? 'bg-purple-50 font-black text-hub-purple' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setPveExpanded(!pveExpanded)}
            className="mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-2 font-black text-hub-purple hover:bg-slate-50 transition"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-600 text-white">✦</span>
              PVE
            </span>
            <span className="text-xs transition-transform duration-200">{pveExpanded ? '⌄' : '›'}</span>
          </button>
          {pveExpanded && (
            <div className="ml-8 space-y-1 border-l border-slate-200 pl-3">
              {pveItems.map((item) => {
                const targetSection = pveSections[item];
                const active = section === targetSection;
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => selectSection(targetSection)}
                    className={`block w-full rounded-xl px-2 py-2 text-left ${active ? 'bg-purple-50 font-black text-hub-purple' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <NavItem icon="▥" label="시즌 유니폼" active={section === 'seasonUniforms'} onClick={() => selectSection('seasonUniforms')} />
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setPvpExpanded(!pvpExpanded)}
            className="mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-2 font-black text-red-500 hover:bg-slate-50 transition"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-500 text-white">×</span>
              PVP
            </span>
            <span className="text-xs transition-transform duration-200">{pvpExpanded ? '⌄' : '›'}</span>
          </button>
          {pvpExpanded && (
            <div className="ml-8 space-y-1 border-l border-slate-200 pl-3">
              {pvpItems.map((item) => {
                const targetSection = pvpSections[item];
                const active = section === targetSection;
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => selectSection(targetSection)}
                    className={`block w-full rounded-xl px-2 py-2 text-left ${active ? 'bg-red-50 font-black text-red-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="my-3 h-px bg-slate-100" />
        <NavItem icon="📊" label="통계 / 분석" active={section === 'analysis'} onClick={() => selectSection('analysis')} />
        <NavItem icon="📋" label="내 기록" active={section === 'record'} onClick={() => selectSection('record')} />
        <NavItem icon="📖" label="캐릭터 가이드" active={section === 'guide'} onClick={() => selectSection('guide')} />
        <NavItem icon="▣" label="캐릭터 DB" sub="캐릭터명, 유니폼, 아티팩트, 버프" active={section === 'db'} onClick={() => selectSection('db')} />
        <NavItem icon="▤" label="나의 캐릭터" sub="티어, 레벨, CTP, 유니폼 보유" active={section === 'myCharacters'} onClick={() => selectSection('myCharacters')} />
        <NavItem icon="🧮" label="계산기" sub="버프/디버프, 데미지 효과 계산" active={section === 'calculator'} onClick={() => selectSection('calculator')} />
      </nav>
    </>
  );
}

export function Sidebar({ section, setSection, mobileOpen = false, onMobileClose }: SidebarProps) {
  const selectSection = (nextSection: Section) => {
    setSection(nextSection);
    onMobileClose?.();
  };

  return (
    <>
      <aside className="hidden h-screen w-[306px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 xl:block">
        <SidebarPanel section={section} selectSection={selectSection} />
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="좌측 메뉴 닫기" onClick={onMobileClose} className="absolute inset-0 bg-slate-950/40" />
          <aside className="relative z-10 h-full w-[306px] max-w-[84vw] overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 shadow-2xl">
            <SidebarPanel section={section} selectSection={selectSection} showCloseButton onMobileClose={onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
