'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  Clipboard,
  Cog,
  Database,
  Download,
  Eraser,
  FileJson,
  Gauge,
  Laptop,
  Palette,
  RefreshCw,
  Search,
  Settings,
  Smartphone,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
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
  userScores: 'SCORE ENTRY',
  board: 'BOARD',
  admin: 'ADMIN CONSOLE',
  guide: 'GUIDE',
};

type HeaderPanel = 'settings' | 'today' | null;
type SettingsTab = 'appearance' | 'data' | 'diagnostics';
type StorageSnapshot = Record<string, string>;
type StorageSummary = {
  count: number;
  bytes: number;
  updatedAt: string;
};
type StorageRow = {
  key: string;
  label: string;
  bytes: number;
  preview: string;
};
type UiAccent = 'purple' | 'blue' | 'emerald' | 'rose';
type UiDensity = 'comfortable' | 'compact' | 'spacious';
type TextScale = 'normal' | 'large';
type UiPreferences = {
  accent: UiAccent;
  density: UiDensity;
  textScale: TextScale;
  reduceMotion: boolean;
  stickyHeader: boolean;
  mobileNav: boolean;
};
type AppDiagnostics = {
  viewport: string;
  screen: string;
  online: string;
  language: string;
  timezone: string;
  storage: string;
  userAgent: string;
};
type DailyTaskId = 'abx' | 'abl' | 'worldBoss' | 'record' | 'roster';
type DailyTask = {
  id: DailyTaskId;
  label: string;
  detail: string;
};

const appStoragePrefix = 'mff-data-hub:';
const uiPreferenceStorageKey = 'mff-data-hub:ui-preferences:v1';
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

const defaultUiPreferences: UiPreferences = {
  accent: 'purple',
  density: 'comfortable',
  textScale: 'normal',
  reduceMotion: false,
  stickyHeader: true,
  mobileNav: true,
};

const accentOptions: Array<{ value: UiAccent; label: string; className: string; swatch: string }> = [
  { value: 'purple', label: 'Purple', className: 'border-purple-300 bg-purple-50 text-purple-700', swatch: 'bg-purple-600' },
  { value: 'blue', label: 'Blue', className: 'border-blue-300 bg-blue-50 text-blue-700', swatch: 'bg-blue-600' },
  { value: 'emerald', label: 'Emerald', className: 'border-emerald-300 bg-emerald-50 text-emerald-700', swatch: 'bg-emerald-600' },
  { value: 'rose', label: 'Rose', className: 'border-rose-300 bg-rose-50 text-rose-700', swatch: 'bg-rose-600' },
];

const densityOptions: Array<{ value: UiDensity; label: string }> = [
  { value: 'comfortable', label: '기본' },
  { value: 'compact', label: '촘촘' },
  { value: 'spacious', label: '넓게' },
];

const textScaleOptions: Array<{ value: TextScale; label: string }> = [
  { value: 'normal', label: '기본' },
  { value: 'large', label: '크게' },
];

const storageLabels: Record<string, string> = {
  [uiPreferenceStorageKey]: 'UI 설정',
  'mff-data-hub:comic-card-editor:v1': '카드 편집',
  'mff-data-hub:x-sword-editor:v1': 'X-Sword 편집',
  'mff-data-hub:team-up-editor:v1': 'Team-Up 편집',
  'mff-data-hub:ctp-inventory:v1': 'CTP 인벤토리',
  'mff-data-hub:my-character-builds:v1': '나의 캐릭터',
  'mff-data-hub:alliance-battle-sheet:v1': 'ABX/ABL 커스텀',
  'mff-data-hub:alliance-score-analysis:v1': '점수 기록',
  'mff-data-hub:user-score-entries:v1': '점수 입력',
  'mff-data-hub:board-posts:v1': '게시판',
  'mff-data-hub:world-boss-stage-picks:v2': '월드보스 픽',
  'mff-data-hub:world-boss-progress:v1': '월드보스 진행',
  'mff-data-hub:season-uniform-ownership:v1': '시즌 유니폼',
  'mff-data-hub:pvp-deck-customizations:v1': 'PVP 덱',
  'mff-data-hub:pvp-restrictions:v1': 'PVP 제한',
  'mff-data-hub:tier-list-editor:pve:v1': 'PVE 티어 편집',
  'mff-data-hub:tier-list-editor:pvp:v1': 'PVP 티어 편집',
  'mff-data-hub:sidebar-account-profile:v1': '계정 프로필',
};

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

function normalizeUiPreferences(value: unknown): UiPreferences {
  if (!isRecord(value)) return defaultUiPreferences;

  return {
    accent: accentOptions.some((option) => option.value === value.accent) ? value.accent as UiAccent : defaultUiPreferences.accent,
    density: densityOptions.some((option) => option.value === value.density) ? value.density as UiDensity : defaultUiPreferences.density,
    textScale: textScaleOptions.some((option) => option.value === value.textScale) ? value.textScale as TextScale : defaultUiPreferences.textScale,
    reduceMotion: typeof value.reduceMotion === 'boolean' ? value.reduceMotion : defaultUiPreferences.reduceMotion,
    stickyHeader: typeof value.stickyHeader === 'boolean' ? value.stickyHeader : defaultUiPreferences.stickyHeader,
    mobileNav: typeof value.mobileNav === 'boolean' ? value.mobileNav : defaultUiPreferences.mobileNav,
  };
}

function readUiPreferences(): UiPreferences {
  if (typeof window === 'undefined') return defaultUiPreferences;

  try {
    return normalizeUiPreferences(JSON.parse(window.localStorage.getItem(uiPreferenceStorageKey) ?? '{}'));
  } catch {
    return defaultUiPreferences;
  }
}

function writeUiPreferences(preferences: UiPreferences) {
  window.localStorage.setItem(uiPreferenceStorageKey, JSON.stringify(preferences));
}

function applyUiPreferences(preferences: UiPreferences) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.mffAccent = preferences.accent;
  root.dataset.mffDensity = preferences.density;
  root.dataset.mffTextScale = preferences.textScale;
  root.dataset.mffMotion = preferences.reduceMotion ? 'reduce' : 'default';
  root.dataset.mffStickyHeader = preferences.stickyHeader ? 'on' : 'off';
  root.dataset.mffMobileNav = preferences.mobileNav ? 'on' : 'off';
}

function storageDisplayName(key: string) {
  if (storageLabels[key]) return storageLabels[key];
  if (key.startsWith(dailyTaskStoragePrefix)) return `체크리스트 ${key.replace(dailyTaskStoragePrefix, '')}`;
  return key.replace(appStoragePrefix, '').replace(/:v\d+$/, '').replaceAll('-', ' ');
}

function createStorageRows(snapshot: StorageSnapshot, filter: string): StorageRow[] {
  const query = filter.trim().toLowerCase();

  return Object.entries(snapshot)
    .map(([key, value]) => ({
      key,
      label: storageDisplayName(key),
      bytes: value.length,
      preview: value.slice(0, 96),
    }))
    .filter((row) => {
      const haystack = `${row.key} ${row.label} ${row.preview}`.toLowerCase();
      return !query || haystack.includes(query);
    })
    .sort((a, b) => b.bytes - a.bytes);
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

function createDiagnostics(summary: StorageSummary): AppDiagnostics {
  if (typeof window === 'undefined') {
    return {
      viewport: '-',
      screen: '-',
      online: '-',
      language: '-',
      timezone: '-',
      storage: `${summary.count} items / ${formatBytes(summary.bytes)}`,
      userAgent: '-',
    };
  }

  return {
    viewport: `${window.innerWidth} x ${window.innerHeight}`,
    screen: `${window.screen.width} x ${window.screen.height}`,
    online: navigator.onLine ? 'online' : 'offline',
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    storage: `${summary.count} items / ${formatBytes(summary.bytes)}`,
    userAgent: navigator.userAgent,
  };
}

function createDiagnosticsText(summary: StorageSummary, preferences: UiPreferences) {
  const diagnostics = createDiagnostics(summary);
  return JSON.stringify(
    {
      app: 'mff-data-hub',
      checkedAt: new Date().toISOString(),
      diagnostics,
      preferences,
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
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition sm:h-10 sm:w-10 ${active ? 'bg-purple-100 text-purple-700' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

function SettingsTabButton({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${active ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function ToggleRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
      <span className="min-w-0 text-sm font-black text-slate-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="h-5 w-5 shrink-0 accent-purple-600"
      />
    </label>
  );
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-end bg-slate-950/30 p-3 pt-20 backdrop-blur-sm xl:pt-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="배경을 눌러 패널 닫기" onClick={onClose} className="absolute inset-0 cursor-default" />
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

function SettingsPanel({
  activeTab,
  onClose,
  onResetTodayTasks,
  onTabChange,
  onUpdatePreferences,
  preferences,
}: {
  activeTab: SettingsTab;
  onClose: () => void;
  onResetTodayTasks: () => void;
  onTabChange: (tab: SettingsTab) => void;
  onUpdatePreferences: (preferences: UiPreferences) => void;
  preferences: UiPreferences;
}) {
  const [summary, setSummary] = useState<StorageSummary>(defaultSummary);
  const [storageSnapshot, setStorageSnapshot] = useState<StorageSnapshot>({});
  const [storageFilter, setStorageFilter] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('준비됨');
  const storageRows = useMemo(() => createStorageRows(storageSnapshot, storageFilter), [storageFilter, storageSnapshot]);
  const diagnostics = useMemo(() => createDiagnostics(summary), [summary]);

  const refreshStorage = () => {
    setStorageSnapshot(collectAppStorage());
    setSummary(summarizeStorage());
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  const updatePreferences = (next: UiPreferences, message: string) => {
    onUpdatePreferences(next);
    setStatus(message);
    window.setTimeout(refreshStorage, 0);
  };

  const downloadBackup = () => {
    const json = createBackupJson();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mff-data-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('백업 파일 생성됨');
    refreshStorage();
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
      onUpdatePreferences(readUiPreferences());
      setImportText('');
      setStatus(`${Object.keys(data).length}개 항목 가져옴`);
      refreshStorage();
    } catch {
      setStatus('가져오기 실패');
    }
  };

  const clearAppData = () => {
    if (!window.confirm('MFF Data Hub 저장 데이터를 초기화할까요?')) return;
    Object.keys(collectAppStorage()).forEach((key) => window.localStorage.removeItem(key));
    onUpdatePreferences(defaultUiPreferences);
    setStatus('앱 저장 데이터 초기화됨');
    refreshStorage();
  };

  const deleteStorageItem = (key: string) => {
    if (!window.confirm(`${storageDisplayName(key)} 데이터를 삭제할까요?`)) return;
    window.localStorage.removeItem(key);
    if (key === uiPreferenceStorageKey) onUpdatePreferences(defaultUiPreferences);
    setStatus(`${storageDisplayName(key)} 삭제됨`);
    refreshStorage();
  };

  const copyStorageItem = async (key: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ [key]: storageSnapshot[key] ?? '' }, null, 2));
      setStatus(`${storageDisplayName(key)} 복사됨`);
    } catch {
      setStatus('항목 복사 실패');
    }
  };

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(createDiagnosticsText(summary, preferences));
      setStatus('진단 정보 복사됨');
    } catch {
      setStatus('진단 정보 복사 실패');
    }
  };

  const resetTodayTasks = () => {
    onResetTodayTasks();
    setStatus('오늘 체크리스트 초기화됨');
    refreshStorage();
  };

  return (
    <ModalShell title="설정 / 데이터 관리" subtitle="Settings" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        <SettingsTabButton active={activeTab === 'appearance'} icon={<Palette size={16} />} onClick={() => onTabChange('appearance')}>
          화면
        </SettingsTabButton>
        <SettingsTabButton active={activeTab === 'data'} icon={<Database size={16} />} onClick={() => onTabChange('data')}>
          데이터
        </SettingsTabButton>
        <SettingsTabButton active={activeTab === 'diagnostics'} icon={<Gauge size={16} />} onClick={() => onTabChange('diagnostics')}>
          진단
        </SettingsTabButton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-4">
          <p className="text-xs font-bold text-slate-500">저장 항목</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{summary.count}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-4">
          <p className="text-xs font-bold text-slate-500">용량</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatBytes(summary.bytes)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-4">
          <p className="text-xs font-bold text-slate-500">확인</p>
          <p className="mt-2 text-sm font-black text-slate-950">{summary.updatedAt}</p>
        </div>
      </div>

      {activeTab === 'appearance' ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-black text-slate-500">강조색</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {accentOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => updatePreferences({ ...preferences, accent: option.value }, `${option.label} 적용됨`)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-black ${preferences.accent === option.value ? option.className : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`h-3 w-3 rounded-full ${option.swatch}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-black text-slate-500">간격</p>
              <div className="mt-2 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                {densityOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => updatePreferences({ ...preferences, density: option.value }, `${option.label} 간격 적용됨`)}
                    className={`min-w-0 rounded-lg px-2 py-2 text-xs font-black transition ${preferences.density === option.value ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-white'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-black text-slate-500">글자</p>
              <div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                {textScaleOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => updatePreferences({ ...preferences, textScale: option.value }, `${option.label} 글자 적용됨`)}
                    className={`min-w-0 rounded-lg px-3 py-2 text-xs font-black transition ${preferences.textScale === option.value ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-white'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ToggleRow checked={preferences.reduceMotion} label="모션 줄이기" onChange={(reduceMotion) => updatePreferences({ ...preferences, reduceMotion }, reduceMotion ? '모션 줄이기 켜짐' : '모션 줄이기 꺼짐')} />
            <ToggleRow checked={preferences.stickyHeader} label="모바일 상단 고정" onChange={(stickyHeader) => updatePreferences({ ...preferences, stickyHeader }, stickyHeader ? '상단 고정 켜짐' : '상단 고정 꺼짐')} />
            <ToggleRow checked={preferences.mobileNav} label="모바일 하단 메뉴" onChange={(mobileNav) => updatePreferences({ ...preferences, mobileNav }, mobileNav ? '하단 메뉴 켜짐' : '하단 메뉴 꺼짐')} />
            <button type="button" onClick={() => updatePreferences(defaultUiPreferences, '화면 설정 초기화됨')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Eraser size={18} /> 화면 초기화
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === 'data' ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={downloadBackup} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white hover:bg-slate-800">
              <Download size={18} /> 내보내기
            </button>
            <button type="button" onClick={copyBackup} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Clipboard size={18} /> 복사
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
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

          <div className="rounded-xl border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-xs font-black text-slate-500" htmlFor="storage-filter">
              <Search size={14} /> 저장 항목
            </label>
            <input
              id="storage-filter"
              value={storageFilter}
              onChange={(event) => setStorageFilter(event.currentTarget.value)}
              placeholder="검색"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {storageRows.length ? storageRows.map((row) => (
                <div key={row.key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{row.label}</p>
                      <p className="truncate text-[11px] font-bold text-slate-500">{row.key}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">{formatBytes(row.bytes)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => copyStorageItem(row.key)} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
                      <Clipboard size={14} /> 복사
                    </button>
                    <button type="button" onClick={() => deleteStorageItem(row.key)} className="flex items-center justify-center gap-1 rounded-lg border border-red-100 bg-white px-2 py-2 text-xs font-black text-red-600 hover:bg-red-50">
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                </div>
              )) : (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm font-bold text-slate-500">저장 항목 없음</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={resetTodayTasks} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Check size={18} /> 오늘 초기화
            </button>
            <button type="button" onClick={clearAppData} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-3 text-sm font-black text-red-600 hover:bg-red-50">
              <Trash2 size={18} /> 전체 초기화
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === 'diagnostics' ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-2 text-xs font-black text-slate-500"><Smartphone size={14} /> 뷰포트</p>
              <p className="mt-1 text-lg font-black text-slate-950">{diagnostics.viewport}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-2 text-xs font-black text-slate-500"><Laptop size={14} /> 화면</p>
              <p className="mt-1 text-lg font-black text-slate-950">{diagnostics.screen}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black text-slate-500">연결</p>
              <p className="mt-1 text-lg font-black text-slate-950">{diagnostics.online}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black text-slate-500">언어</p>
              <p className="mt-1 text-lg font-black text-slate-950">{diagnostics.language}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <div className="grid grid-cols-1 gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
              <p><span className="font-black text-slate-950">시간대</span> {diagnostics.timezone}</p>
              <p><span className="font-black text-slate-950">저장소</span> {diagnostics.storage}</p>
            </div>
            <p className="mt-3 break-words rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">{diagnostics.userAgent}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={copyDiagnostics} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white hover:bg-slate-800">
              <FileJson size={18} /> 진단 복사
            </button>
            <button type="button" onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              <RefreshCw size={18} /> 새로고침
            </button>
          </div>
        </div>
      ) : null}

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
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('appearance');
  const [taskState, setTaskState] = useState<Record<string, boolean>>({});
  const [uiPreferences, setUiPreferences] = useState<UiPreferences>(defaultUiPreferences);

  useEffect(() => {
    setTaskState(readDailyTaskState(today));
  }, [today]);

  useEffect(() => {
    const storedPreferences = readUiPreferences();
    setUiPreferences(storedPreferences);
    applyUiPreferences(storedPreferences);
  }, []);

  const remainingTasks = defaultDailyTasks.filter((task) => !taskState[task.id]).length;

  const toggleTask = (id: DailyTaskId) => {
    setTaskState((current) => {
      const next = { ...current, [id]: !current[id] };
      writeDailyTaskState(today, next);
      return next;
    });
  };

  const updateUiPreferences = (preferences: UiPreferences) => {
    writeUiPreferences(preferences);
    applyUiPreferences(preferences);
    setUiPreferences(preferences);
  };

  const openSettings = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setOpenPanel('settings');
  };

  const resetTodayTasks = () => {
    window.localStorage.removeItem(dailyTaskStorageKey(today));
    setTaskState({});
  };

  return (
    <header className="sticky top-0 z-[60] flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 py-4 backdrop-blur sm:px-4 xl:static xl:border-0 xl:bg-transparent xl:px-0">
      <div className="flex min-w-0 items-center gap-2 xl:hidden">
        <button type="button" aria-label="좌측 메뉴 열기" onClick={onOpenMobileMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200">☰</button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">✦</div>
          <p className="min-w-0 truncate text-sm font-black leading-tight sm:text-base">MFF DATA HUB</p>
        </div>
      </div>
      <div className="hidden items-center gap-5 xl:flex">
        <button className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-lg font-black shadow-sm">{today} ({getKoreanDayName(today)}) <span className="ml-5">▣</span></button>
        <h2 className="text-3xl font-black text-purple-700">{titles[section]}</h2>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xl text-slate-700 sm:gap-2">
        <AuthButton />
        <IconButton label="설정 / 데이터 관리" active={openPanel === 'settings'} onClick={() => openSettings('appearance')}>
          <Settings size={23} />
        </IconButton>
        <IconButton label="앱 진단" active={openPanel === 'settings' && settingsTab === 'diagnostics'} onClick={() => openSettings('diagnostics')}>
          <Cog size={25} className={openPanel === 'settings' && settingsTab === 'diagnostics' ? undefined : 'text-purple-500'} />
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
      {openPanel === 'settings' ? (
        <SettingsPanel
          activeTab={settingsTab}
          onClose={() => setOpenPanel(null)}
          onResetTodayTasks={resetTodayTasks}
          onTabChange={setSettingsTab}
          onUpdatePreferences={updateUiPreferences}
          preferences={uiPreferences}
        />
      ) : null}
      {openPanel === 'today' ? <TodayPanel today={today} taskState={taskState} onToggleTask={toggleTask} onClose={() => setOpenPanel(null)} /> : null}
    </header>
  );
}
