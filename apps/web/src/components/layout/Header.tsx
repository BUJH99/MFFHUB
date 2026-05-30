'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Check, Clipboard, Cog, Download, RefreshCw, Settings, Trash2, Upload, X } from 'lucide-react';
import type { Section } from '@/lib/navigation';
import {
  getAllianceBattleRoundForDate,
  getAllianceChallengeRulesForDate,
  getKoreanDayName,
} from '@/lib/allianceBattle';

const titles: Record<Section, string> = {
  accountCards: 'CARDS',
  accountXSwords: 'X-SWORD',
  accountTeamUps: 'TEAM-UP',
  ctpInventory: 'CTP INVENTORY',
  worldBoss: 'WORLD BOSS',
  abx: 'ABX',
  abl: 'ABL',
  seasonUniforms: 'SEASON UNIFORMS',
  pveTier: 'PVE TIER LIST',
  teamBattleArena: 'TEAM BATTLE ARENA',
  otherworld: 'OTHERWORLD',
  timeline: 'TIMELINE',
  pvpTier: 'PVP TIER LIST',
  db: 'CHARACTER DB',
  myCharacters: 'MY CHARACTERS',
  calculator: 'DAMAGE LAB',
  analysis: 'ANALYTICS',
  record: 'MY LOG',
  guide: 'GUIDE',
};

type HeaderPanel = 'settings' | 'today' | null;
type StorageSnapshot = Record<string, string>;
type StorageSummary = {
  count: number;
  bytes: number;
  updatedAt: string;
};
type DailyTaskId = 'abx' | 'abl' | 'worldBoss' | 'record' | 'roster';
type DailyTask = {
  id: DailyTaskId;
  label: string;
  detail: string;
};

const appStoragePrefix = 'mff-data-hub:';
const dailyTaskStoragePrefix = 'mff-data-hub:daily-tasks:';
const backupVersion = 1;

const defaultSummary: StorageSummary = {
  count: 0,
  bytes: 0,
  updatedAt: '-',
};

const defaultDailyTasks: DailyTask[] = [
  { id: 'abx', label: 'ABX', detail: '오늘 점수 기록' },
  { id: 'abl', label: 'ABL', detail: '오늘 점수 기록' },
  { id: 'worldBoss', label: '월드보스', detail: '진행도 체크' },
  { id: 'record', label: '내 기록', detail: '변경된 점수 저장' },
  { id: 'roster', label: '나의 캐릭터', detail: '성장/장비 변경 반영' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function collectAppStorage(): StorageSnapshot {
  if (typeof window === 'undefined') return {};

  return Object.fromEntries(
    Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith(appStoragePrefix)))
      .map((key) => [key, window.localStorage.getItem(key) ?? '']),
  );
}

function summarizeStorage(): StorageSummary {
  const data = collectAppStorage();
  const payload = JSON.stringify(data);

  return {
    count: Object.keys(data).length,
    bytes: payload.length,
    updatedAt: new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()),
  };
}

function createBackupJson() {
  return JSON.stringify(
    {
      app: 'mff-data-hub',
      version: backupVersion,
      exportedAt: new Date().toISOString(),
      data: collectAppStorage(),
    },
    null,
    2,
  );
}

function extractBackupData(raw: string): StorageSnapshot {
  const parsed = JSON.parse(raw) as unknown;
  const data = isRecord(parsed) && isRecord(parsed.data) ? parsed.data : parsed;

  if (!isRecord(data)) {
    throw new Error('Invalid backup shape');
  }

  return Object.fromEntries(
    Object.entries(data)
      .filter((entry): entry is [string, string] => entry[0].startsWith(appStoragePrefix) && typeof entry[1] === 'string')
      .map(([key, value]) => [key, value]),
  );
}

function dailyTaskStorageKey(today: string) {
  return `${dailyTaskStoragePrefix}${today}`;
}

function readDailyTaskState(today: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(dailyTaskStorageKey(today)) ?? '{}') as unknown;
    return isRecord(parsed)
      ? Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean>
      : {};
  } catch {
    return {};
  }
}

function writeDailyTaskState(today: string, state: Record<string, boolean>) {
  window.localStorage.setItem(dailyTaskStorageKey(today), JSON.stringify(state));
}

function IconButton({
  label,
  active,
  children,
  onClick,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-xl transition ${active ? 'bg-purple-100 text-purple-700' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-end bg-slate-950/30 p-3 pt-20 backdrop-blur-sm xl:pt-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="패널 닫기" onClick={onClose} className="absolute inset-0 cursor-default" />
      <section className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-500">{subtitle}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
          </div>
          <button type="button" aria-label="패널 닫기" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState<StorageSummary>(defaultSummary);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('준비됨');

  const refreshSummary = () => setSummary(summarizeStorage());

  useEffect(() => {
    refreshSummary();
  }, []);

  const downloadBackup = () => {
    const json = createBackupJson();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mff-data-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('백업 파일 생성됨');
    refreshSummary();
  };

  const copyBackup = async () => {
    try {
      await navigator.clipboard.writeText(createBackupJson());
      setStatus('클립보드에 복사됨');
    } catch {
      setStatus('클립보드 복사 실패');
    }
  };

  const importBackup = () => {
    try {
      const data = extractBackupData(importText);
      Object.entries(data).forEach(([key, value]) => {
        window.localStorage.setItem(key, value);
      });
      setImportText('');
      setStatus(`${Object.keys(data).length}개 항목 가져옴`);
      refreshSummary();
    } catch {
      setStatus('가져오기 실패');
    }
  };

  const clearAppData = () => {
    if (!window.confirm('MFF Data Hub 저장 데이터를 초기화할까요?')) return;
    Object.keys(collectAppStorage()).forEach((key) => window.localStorage.removeItem(key));
    setStatus('앱 저장 데이터 초기화됨');
    refreshSummary();
  };

  return (
    <ModalShell title="설정 / 데이터 관리" subtitle="Settings" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">저장 항목</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{summary.count}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">용량</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatBytes(summary.bytes)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">확인</p>
          <p className="mt-2 text-sm font-black text-slate-950">{summary.updatedAt}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={downloadBackup} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white hover:bg-slate-800">
          <Download size={18} /> 내보내기
        </button>
        <button type="button" onClick={copyBackup} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
          <Clipboard size={18} /> 복사
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-3">
        <label className="text-xs font-black text-slate-500" htmlFor="header-backup-json">백업 JSON</label>
        <textarea
          id="header-backup-json"
          value={importText}
          onChange={(event) => setImportText(event.currentTarget.value)}
          placeholder="백업 JSON"
          className="mt-2 h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
        />
        <button
          type="button"
          onClick={importBackup}
          disabled={!importText.trim()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-3 text-sm font-black text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Upload size={18} /> 가져오기
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
          <RefreshCw size={18} /> 새로고침
        </button>
        <button type="button" onClick={clearAppData} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-3 text-sm font-black text-red-600 hover:bg-red-50">
          <Trash2 size={18} /> 초기화
        </button>
      </div>

      <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">{status}</p>
    </ModalShell>
  );
}

function TodayPanel({ today, taskState, onToggleTask, onClose }: { today: string; taskState: Record<string, boolean>; onToggleTask: (id: DailyTaskId) => void; onClose: () => void }) {
  const round = useMemo(() => getAllianceBattleRoundForDate(today), [today]);
  const challengeRules = useMemo(() => getAllianceChallengeRulesForDate(today), [today]);
  const completedCount = defaultDailyTasks.filter((task) => taskState[task.id]).length;
  const challengeLabels = challengeRules.length
    ? challengeRules.map((rule) => `${rule.content} · ${rule.label.replace(`${rule.content} · `, '')}`)
    : ['인피니티 챌린지'];

  return (
    <ModalShell title="오늘 할 일 / 알림" subtitle={`${today} (${getKoreanDayName(today)})`} onClose={onClose}>
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-purple-600">ALLIANCE BATTLE</p>
            <p className="mt-1 text-lg font-black text-slate-950">Round {round.round}{round.isResetDay ? ' · 리셋데이' : ''}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 ring-1 ring-purple-100">{challengeLabels.length}개</span>
        </div>
        <div className="mt-3 space-y-2">
          {challengeLabels.map((label) => (
            <p key={label} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-purple-100">{label}</p>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-black text-slate-950">체크리스트</p>
        <p className="text-sm font-black text-purple-600">{completedCount}/{defaultDailyTasks.length}</p>
      </div>
      <div className="mt-2 space-y-2">
        {defaultDailyTasks.map((task) => {
          const checked = Boolean(taskState[task.id]);
          return (
            <button
              type="button"
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${checked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {checked ? <Check size={18} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block font-black text-slate-950">{task.label}</span>
                <span className="block text-xs font-bold text-slate-500">{task.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}

export function Header({ section, today, onOpenMobileMenu }: { section: Section; today: string; onOpenMobileMenu?: () => void }) {
  const [openPanel, setOpenPanel] = useState<HeaderPanel>(null);
  const [taskState, setTaskState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTaskState(readDailyTaskState(today));
  }, [today]);

  const remainingTasks = defaultDailyTasks.filter((task) => !taskState[task.id]).length;

  const toggleTask = (id: DailyTaskId) => {
    setTaskState((current) => {
      const next = { ...current, [id]: !current[id] };
      writeDailyTaskState(today, next);
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur xl:static xl:border-0 xl:bg-transparent xl:px-0">
      <div className="flex items-center gap-3 xl:hidden">
        <button type="button" aria-label="좌측 메뉴 열기" onClick={onOpenMobileMenu} className="rounded-xl border border-slate-200 p-2">☰</button>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">✦</div>
          <p className="font-black">MFF DATA HUB</p>
        </div>
      </div>
      <div className="hidden items-center gap-5 xl:flex">
        <button className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-black shadow-sm">{today} ({getKoreanDayName(today)}) <span className="ml-5">▣</span></button>
        <h2 className="text-3xl font-black text-purple-700">{titles[section]}</h2>
      </div>
      <div className="flex items-center gap-2 text-xl text-slate-700">
        <IconButton label="설정 / 데이터 관리" active={openPanel === 'settings'} onClick={() => setOpenPanel('settings')}>
          <Settings size={23} />
        </IconButton>
        <IconButton label="보류 중인 기능">
          <Cog size={25} className="text-purple-300" />
        </IconButton>
        <div className="relative">
          <IconButton label="오늘 할 일 / 알림" active={openPanel === 'today'} onClick={() => setOpenPanel('today')}>
            <Bell size={23} className="text-amber-500" />
          </IconButton>
          {remainingTasks > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{remainingTasks}</span>
          ) : null}
        </div>
      </div>
      {openPanel === 'settings' ? <SettingsPanel onClose={() => setOpenPanel(null)} /> : null}
      {openPanel === 'today' ? <TodayPanel today={today} taskState={taskState} onToggleTask={toggleTask} onClose={() => setOpenPanel(null)} /> : null}
    </header>
  );
}
