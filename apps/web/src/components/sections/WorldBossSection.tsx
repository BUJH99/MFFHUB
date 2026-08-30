'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { catalogCharacters, thanosvibsAttributeIconUrl, type CatalogCharacter, type CatalogUniform, worldBosses, type WorldBoss, type WorldBossStageRule } from '@mff-data-hub/data';
import {
  createWorldBossStageTeam,
  hasWorldBossStageTeams,
  migrateLegacyWorldBossStagePicks,
  normalizeWorldBossStageTeamStore,
  WORLD_BOSS_TEAM_SIZE,
  type WorldBossStagePick,
  type WorldBossStageTeam,
  type WorldBossStageTeamStore,
} from '@/lib/worldBossTeams';

const noRestrictionIcon = thanosvibsAttributeIconUrl('nores');
const stageTeamsStorageKey = 'mff-data-hub:world-boss-stage-teams:v3';
const legacyPicksStorageKey = 'mff-data-hub:world-boss-stage-picks:v2';
const worldBossProgressStorageKey = 'mff-data-hub:world-boss-progress:v1';
const knownRestrictionLabels = new Set([
  'Agility',
  'Alien',
  'Blast',
  'Combat',
  'Command',
  'Durability',
  'Energy Projection',
  'Fast Movement',
  'Female',
  'Healing',
  'Hero',
  'Human',
  'Leadership',
  'Machine',
  'Magic',
  'Male',
  'Mutant',
  'Pure Evil',
  'Speed',
  'Strong',
  'Universal',
  'Villain',
  'Weapons Master',
]);

type BossProgress = {
  currentStage: string;
  conquestLevel: string;
};
type BossProgressStore = Record<string, BossProgress>;
type BossProgressField = keyof BossProgress;
type PickerState = {
  stageKey: string;
  bossName: string;
  stage: WorldBossStageRule;
} | null;
type UniformOption = {
  key: string;
  character: CatalogCharacter;
  uniform: CatalogUniform;
};
type CharacterOption = {
  key: string;
  character: CatalogCharacter;
  uniforms: CatalogUniform[];
};

function makeStageKey(bossId: string, stageRange: string) {
  return `${bossId}:${stageRange}`;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

function displayRestrictionLabel(label: string) {
  return knownRestrictionLabels.has(label) ? label : label.replace(/_/g, ' ');
}

function characterMatchesRestriction(character: CatalogCharacter, label: string) {
  const normalizedLabel = normalizeText(label);
  if (!normalizedLabel) return true;
  const acceptedLabels = normalizedLabel === 'weaponsmaster' ? [normalizedLabel, 'weaponmaster'] : [normalizedLabel];

  if (acceptedLabels.includes(normalizeText(character.type))) return true;
  if (acceptedLabels.includes(normalizeText(character.side))) return true;
  return character.tags.some((tag) => acceptedLabels.includes(normalizeText(tag.replace(/^Gender:/, '').replace(/^Species:/, ''))));
}

function uniformMatchesRestriction(character: CatalogCharacter, uniform: CatalogUniform, label: string) {
  if (characterMatchesRestriction(character, label)) return true;

  const normalizedLabel = normalizeText(label);
  const acceptedLabels = normalizedLabel === 'weaponsmaster' ? [normalizedLabel, 'weaponmaster'] : [normalizedLabel];
  const uniformWithTags = uniform as CatalogUniform & {
    gender?: string;
    side?: string;
    species?: string;
    tags?: string[];
    type?: string;
  };
  const uniformLabels = [
    uniformWithTags.type,
    uniformWithTags.side,
    uniformWithTags.gender,
    uniformWithTags.species,
    ...(uniformWithTags.tags ?? []),
  ];

  return uniformLabels.some((value) => value ? acceptedLabels.includes(normalizeText(value.replace(/^Gender:/, '').replace(/^Species:/, ''))) : false);
}

function uniformMatchesStage(character: CatalogCharacter, uniform: CatalogUniform, stage: WorldBossStageRule) {
  return stage.restrictions.every((restriction) => uniformMatchesRestriction(character, uniform, restriction.label));
}

function toCharacterOptionSearchText(option: CharacterOption) {
  return [
    option.character.name,
    option.character.type,
    option.character.side,
    option.character.tags.join(' '),
  ].join(' ').toLowerCase();
}

function getCharacterOptions(stage: WorldBossStageRule): CharacterOption[] {
  return catalogCharacters
    .map((character) => ({
      key: character.id,
      character,
      uniforms: character.uniforms.filter((uniform) => uniformMatchesStage(character, uniform, stage)),
    }))
    .filter((option) => option.uniforms.length > 0);
}

function parseStoredTeams(raw: string | null): WorldBossStageTeamStore {
  if (raw === null) return {};

  const parsed = JSON.parse(raw) as unknown;
  const normalized = normalizeWorldBossStageTeamStore(parsed);
  return hasWorldBossStageTeams(normalized) ? normalized : migrateLegacyWorldBossStagePicks(parsed);
}

function readStoredTeams(): WorldBossStageTeamStore {
  if (typeof window === 'undefined') return {};

  try {
    const currentRaw = window.localStorage.getItem(stageTeamsStorageKey);
    if (currentRaw !== null) {
      const current = parseStoredTeams(currentRaw);
      if (hasWorldBossStageTeams(current) || window.localStorage.getItem(legacyPicksStorageKey) === null) return current;
    }
    return parseStoredTeams(window.localStorage.getItem(legacyPicksStorageKey));
  } catch {
    return {};
  }
}

function sanitizeNumericInput(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.max(0, Math.round(value)));
  if (typeof value !== 'string') return '';
  return value.replace(/\D/g, '').slice(0, 3);
}

function numericProgressValue(value: string) {
  const sanitized = sanitizeNumericInput(value);
  return sanitized ? Number(sanitized) : undefined;
}

function stageRangeIncludes(range: string, stage?: number) {
  if (typeof stage !== 'number' || !Number.isFinite(stage)) return false;
  const parsedRange = parseStageRange(range);
  if (!parsedRange) return false;
  const { start, end: normalizedEnd } = parsedRange;
  return stage >= start && stage <= normalizedEnd;
}

function parseStageRange(range: string) {
  const [start, end] = range.split('-').map((part) => Number(part));
  if (!Number.isFinite(start)) return undefined;
  return { start, end: Number.isFinite(end) ? end : start };
}

function unlockBelongsToStageRange(range: string, unlockStage: number) {
  const unlockBucketStart = unlockBucketStartForStageRange(range);
  return typeof unlockBucketStart === 'number' && unlockStage === unlockBucketStart;
}

function unlockBucketStartForStageRange(range: string) {
  const parsedRange = parseStageRange(range);
  if (!parsedRange || parsedRange.start < 10) return undefined;
  return Math.floor(parsedRange.start / 10) * 10;
}

function unlockBucketLabel(range: string) {
  const unlockBucketStart = unlockBucketStartForStageRange(range);
  return typeof unlockBucketStart === 'number' ? `${unlockBucketStart}-${unlockBucketStart + 9}층` : undefined;
}

function createEmptyBossProgress(): BossProgress {
  return { currentStage: '', conquestLevel: '' };
}

function normalizeBossProgress(value: unknown): BossProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createEmptyBossProgress();
  const progress = value as Partial<Record<BossProgressField, unknown>>;

  return {
    currentStage: sanitizeNumericInput(progress.currentStage),
    conquestLevel: sanitizeNumericInput(progress.conquestLevel),
  };
}

function readStoredProgress(): BossProgressStore {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(worldBossProgressStorageKey) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([bossId]) => worldBosses.some((boss) => boss.id === bossId))
        .map(([bossId, value]) => [bossId, normalizeBossProgress(value)]),
    );
  } catch {
    return {};
  }
}

function stagePickFromOption(option: UniformOption): WorldBossStagePick {
  return {
    id: `${option.character.id}:${option.uniform.name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    characterId: option.character.id,
    characterName: option.character.name,
    characterImageUrl: option.character.imageUrl,
    uniformName: option.uniform.name,
    uniformImageUrl: option.uniform.imageUrl,
  };
}

function imageFallback(e: React.SyntheticEvent<HTMLImageElement>, label: string) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=ede9fe&color=6d28d9&bold=true`;
}

function BossButton({
  boss,
  active,
  progress,
  onClick,
}: {
  boss: WorldBoss;
  active: boolean;
  progress: BossProgress;
  onClick: () => void;
}) {
  const currentStageLabel = progress.currentStage ? `도전 ${progress.currentStage}층` : '도전 -';
  const conquestLevelLabel = progress.conquestLevel ? `정복 Lv.${progress.conquestLevel}` : '정복 -';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[72px] overflow-hidden rounded-xl border text-left shadow-sm transition ${
        active ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200 hover:border-purple-200'
      }`}
    >
      <Image src={boss.bannerUrl} alt="" fill sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover transition duration-300 group-hover:scale-[1.02]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-slate-950/20" />
      <span className="relative z-10 flex min-h-[72px] items-center gap-2 p-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-950 ring-2 ring-white/30">
          <Image src={boss.portraitUrl} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-black text-white drop-shadow">{boss.name}</span>
          <span className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-black shadow-sm ${boss.mode === 'Legend+' ? 'bg-fuchsia-500 text-white' : 'bg-blue-500 text-white'}`}>
            {boss.mode}
          </span>
          <span className="mt-1 flex flex-wrap gap-1 text-[8px] font-black text-white/90">
            <span className="truncate rounded bg-white/15 px-1 py-0.5 ring-1 ring-white/15">{currentStageLabel}</span>
            <span className="truncate rounded bg-white/15 px-1 py-0.5 ring-1 ring-white/15">{conquestLevelLabel}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

function adjustProgressValue(value: string, delta: number) {
  const current = numericProgressValue(value) ?? 0;
  return sanitizeNumericInput(current + delta);
}

function RestrictionIcons({ stage }: { stage: WorldBossStageRule }) {
  const restrictions = stage.restrictions.length
    ? stage.restrictions
    : [{ label: 'No Restrictions', iconUrl: noRestrictionIcon }];

  return (
    <div className="flex flex-nowrap justify-start gap-1 overflow-hidden">
      {restrictions.map((restriction) => (
        <span key={`${stage.range}-${restriction.label}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 p-1 ring-1 ring-slate-200" title={displayRestrictionLabel(restriction.label)}>
          <Image src={restriction.iconUrl} alt={displayRestrictionLabel(restriction.label)} width={32} height={32} unoptimized className="h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

function StageUnlockIcons({ boss, stage, active }: { boss: WorldBoss; stage: WorldBossStageRule; active: boolean }) {
  const unlocks = boss.unlocks.filter((unlock) => unlockBelongsToStageRange(stage.range, unlock.stage));
  const unlockBucket = unlockBucketLabel(stage.range);

  return (
    <div className="flex min-h-9 items-center gap-1.5 overflow-hidden">
      <span className={`grid min-h-9 min-w-[58px] place-items-center rounded-xl px-2 py-2 text-xs font-black text-white ${active ? 'bg-purple-600' : 'bg-slate-950'}`}>{stage.range}</span>
      {unlocks.map((unlock) => (
        <Image
          key={`${boss.id}-${stage.range}-${unlock.stage}`}
          src={unlock.portraitUrl}
          alt={unlock.character}
          title={`${unlockBucket ?? `${unlock.stage}층`} · ${unlock.character}`}
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 shrink-0 rounded-lg object-cover ring-2 ring-white"
        />
      ))}
    </div>
  );
}

function StageTeamMember({ pick, slot }: { pick?: WorldBossStagePick; slot: number }) {
  if (!pick) {
    return (
      <span
        data-testid="world-boss-set-slot"
        className="grid h-11 min-w-0 place-items-center rounded-lg border border-dashed border-slate-200 bg-white/70 text-[10px] font-black text-slate-300"
        aria-label={`${slot}번 빈 슬롯`}
      >
        {slot}
      </span>
    );
  }

  return (
    <span
      data-testid="world-boss-set-slot"
      className="group relative grid h-11 min-w-0 place-items-center overflow-hidden rounded-lg border border-purple-100 bg-white p-0.5 shadow-sm"
      title={`${slot}번 · ${pick.characterName} · ${pick.uniformName}`}
    >
      <Image
        src={pick.uniformImageUrl ?? pick.characterImageUrl}
        alt={`${pick.characterName} ${pick.uniformName}`}
        width={44}
        height={44}
        unoptimized
        onError={(event) => imageFallback(event, pick.characterName)}
        className="h-full w-full rounded-md object-cover"
      />
      <span className="absolute bottom-0.5 left-0.5 grid h-4 min-w-4 place-items-center rounded bg-slate-950/85 px-1 text-[9px] font-black text-white">{slot}</span>
    </span>
  );
}

function StageTeamCard({
  bossName,
  stageRange,
  team,
  teamNumber,
  onRemove,
}: {
  bossName: string;
  stageRange: string;
  team: WorldBossStageTeam;
  teamNumber: number;
  onRemove: () => void;
}) {
  const complete = team.members.length === WORLD_BOSS_TEAM_SIZE;

  return (
    <div
      data-testid="world-boss-character-set"
      role="group"
      aria-label={`${bossName} ${stageRange}층 세트 ${teamNumber}`}
      className={`min-w-0 rounded-xl border p-2 shadow-sm ${complete ? 'border-purple-200 bg-purple-50/80' : 'border-amber-200 bg-amber-50/80'}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black text-slate-950">세트 {teamNumber}</p>
          <p className={`text-[9px] font-black ${complete ? 'text-purple-600' : 'text-amber-700'}`}>
            {complete ? '3인 완성' : `이전 데이터 · ${team.members.length}/3`}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${bossName} ${stageRange}층 세트 ${teamNumber} 삭제`}
          title="세트 삭제"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: WORLD_BOSS_TEAM_SIZE }, (_, index) => (
          <StageTeamMember key={`${team.id}:slot:${index + 1}`} pick={team.members[index]} slot={index + 1} />
        ))}
      </div>
    </div>
  );
}

function StagePickerPanel({
  picker,
  onClose,
  onSubmit,
}: {
  picker: PickerState;
  onClose: () => void;
  onSubmit: (members: WorldBossStagePick[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedCharacterKey, setSelectedCharacterKey] = useState<string | null>(null);
  const [draftMembers, setDraftMembers] = useState<WorldBossStagePick[]>([]);
  const deferredQuery = useDeferredValue(query);
  const pickerStageKey = picker?.stageKey;
  const allCharacterOptions = useMemo(() => (picker ? getCharacterOptions(picker.stage) : []), [picker]);
  const selectedCharacterIds = useMemo(() => new Set(draftMembers.map((member) => member.characterId)), [draftMembers]);
  const selectedCharacter = useMemo(
    () => allCharacterOptions.find((option) => option.key === selectedCharacterKey) ?? null,
    [allCharacterOptions, selectedCharacterKey],
  );
  const visibleCharacters = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return allCharacterOptions.slice(0, 48);

    return allCharacterOptions.filter((option) => toCharacterOptionSearchText(option).includes(q)).slice(0, 72);
  }, [allCharacterOptions, deferredQuery]);

  useEffect(() => {
    if (!pickerStageKey) return;
    setQuery('');
    setSelectedCharacterKey(null);
    setDraftMembers([]);
  }, [pickerStageKey]);

  if (!picker) return null;

  const addDraftMember = (option: UniformOption) => {
    setDraftMembers((current) => {
      if (current.length >= WORLD_BOSS_TEAM_SIZE || current.some((member) => member.characterId === option.character.id)) return current;
      return [...current, stagePickFromOption(option)];
    });
    setSelectedCharacterKey(null);
  };

  const removeDraftMember = (pickId: string) => {
    setDraftMembers((current) => current.filter((member) => member.id !== pickId));
  };

  const submitDraft = () => {
    if (draftMembers.length !== WORLD_BOSS_TEAM_SIZE) return;
    onSubmit(draftMembers);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/45 p-3 backdrop-blur-[2px] sm:place-items-center sm:p-6">
      <div
        data-testid="world-boss-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-boss-set-picker-title"
        className="flex h-[min(820px,calc(100dvh-3rem))] w-[min(900px,calc(100vw-1.5rem))] flex-col overscroll-contain overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-purple-600">World Boss 3인 세트 추가</p>
            <h3 id="world-boss-set-picker-title" className="truncate text-sm font-black text-slate-950">{picker.bossName} · {picker.stage.range}층</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{picker.stage.restrictions.map((restriction) => displayRestrictionLabel(restriction.label)).join(' + ') || '제한 없음'}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 min-w-11 place-items-center rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 hover:bg-slate-50">닫기</button>
        </div>

        <div className="border-b border-purple-100 bg-purple-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-950">선택한 캐릭터</p>
              <p data-testid="world-boss-set-selection-count" role="status" aria-live="polite" className="text-[11px] font-black text-purple-700">{draftMembers.length}/{WORLD_BOSS_TEAM_SIZE}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraftMembers([])} disabled={!draftMembers.length} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">선택 초기화</button>
              <button
                type="button"
                data-testid="world-boss-set-confirm"
                onClick={submitDraft}
                disabled={draftMembers.length !== WORLD_BOSS_TEAM_SIZE}
                className="h-11 rounded-xl bg-purple-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                3인 세트 저장
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.from({ length: WORLD_BOSS_TEAM_SIZE }, (_, index) => {
              const member = draftMembers[index];
              return (
                <div key={`draft-slot:${index + 1}`} className="relative min-w-0 rounded-xl border border-purple-100 bg-white p-2">
                  {member ? (
                    <>
                      <div className="flex min-w-0 items-center gap-2">
                        <Image src={member.uniformImageUrl ?? member.characterImageUrl} alt={`${member.characterName} ${member.uniformName}`} width={44} height={44} unoptimized onError={(event) => imageFallback(event, member.characterName)} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                        <div className="hidden min-w-0 sm:block">
                          <p className="truncate text-[11px] font-black text-slate-950">{member.characterName}</p>
                          <p className="truncate text-[9px] font-bold text-slate-500">{member.uniformName}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeDraftMember(member.id)} aria-label={`${index + 1}번 ${member.characterName} 선택 취소`} className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-xs font-black text-white shadow hover:bg-rose-600">×</button>
                    </>
                  ) : (
                    <div className="grid h-11 place-items-center rounded-lg border border-dashed border-slate-200 text-[10px] font-black text-slate-400">{index + 1}번 슬롯</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-b border-slate-100 p-3">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="세트 캐릭터 검색"
              aria-label="월드보스 세트 캐릭터 검색"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">{visibleCharacters.length}/{allCharacterOptions.length}</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 overscroll-contain overflow-hidden p-3 md:grid-cols-[minmax(0,1fr)_280px] md:grid-rows-1">
          <div data-testid="world-boss-character-scroll" className="min-h-0 overscroll-contain overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
            <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-wide text-slate-500">1. 캐릭터 선택</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2">
              {visibleCharacters.length ? visibleCharacters.map((option) => {
                const active = selectedCharacter?.key === option.key;
                const alreadySelected = selectedCharacterIds.has(option.character.id);

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedCharacterKey(option.key)}
                    disabled={alreadySelected || draftMembers.length >= WORLD_BOSS_TEAM_SIZE}
                    className={`relative min-w-0 rounded-xl border p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50'}`}
                  >
                    <Image
                      src={option.character.imageUrl}
                      alt={option.character.name}
                      width={72}
                      height={72}
                      unoptimized
                      onError={(event) => imageFallback(event, option.character.name)}
                      className="mx-auto h-[72px] w-[72px] rounded-xl object-cover"
                    />
                    <p className="mt-2 truncate text-xs font-black text-slate-950">{option.character.name}</p>
                    <p className="mt-1 text-[10px] font-black text-purple-600">{alreadySelected ? '선택됨' : `${option.uniforms.length} 유니폼`}</p>
                  </button>
                );
              }) : (
                <p className="col-span-full rounded-xl bg-white p-4 text-center text-xs font-black text-slate-400">검색 결과 없음</p>
              )}
            </div>
          </div>
          <div data-testid="world-boss-uniform-scroll" className="min-h-0 overscroll-contain overflow-y-auto rounded-xl border border-purple-100 bg-white p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-purple-600">2. 조건 유니폼 선택</p>
            {selectedCharacter ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                  <Image
                    src={selectedCharacter.character.imageUrl}
                    alt={selectedCharacter.character.name}
                    width={44}
                    height={44}
                    unoptimized
                    onError={(event) => imageFallback(event, selectedCharacter.character.name)}
                    className="h-11 w-11 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-950">{selectedCharacter.character.name}</p>
                    <p className="text-[10px] font-bold text-slate-500">조건 충족 {selectedCharacter.uniforms.length}개</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCharacter.uniforms.map((uniform, index) => (
                    <button
                      key={`${selectedCharacter.key}-${uniform.name}-${index}`}
                      type="button"
                      onClick={() => addDraftMember({ key: `${selectedCharacter.key}:${index}:${uniform.name}`, character: selectedCharacter.character, uniform })}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-purple-300 hover:bg-purple-50"
                    >
                      <Image
                        src={uniform.imageUrl ?? selectedCharacter.character.imageUrl}
                        alt={`${selectedCharacter.character.name} ${uniform.name}`}
                        width={92}
                        height={92}
                        unoptimized
                        onError={(event) => imageFallback(event, selectedCharacter.character.name)}
                        className="mx-auto h-[92px] w-[92px] rounded-xl object-cover"
                      />
                      <span className="mt-2 line-clamp-2 block min-h-8 text-[10px] font-black leading-tight text-slate-950">{uniform.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-black text-slate-400">
                캐릭터를 먼저 선택
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StageRuleGrid({
  boss,
  currentStage,
  teams,
  onOpenPicker,
  onRemoveTeam,
}: {
  boss: WorldBoss;
  currentStage?: number;
  teams: WorldBossStageTeamStore;
  onOpenPicker: (picker: PickerState) => void;
  onRemoveTeam: (stageKey: string, teamId: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">층 조건</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{boss.stages.length}구간</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {boss.stages.map((stage) => {
          const stageKey = makeStageKey(boss.id, stage.range);
          const stageTeams = teams[stageKey] ?? [];
          const stageActive = stageRangeIncludes(stage.range, currentStage);

          return (
            <article
              key={`${boss.id}-${stage.range}`}
              className={`rounded-xl border p-2 transition ${
                stageActive
                  ? 'border-purple-300 bg-purple-50/80 shadow-[0_0_0_3px_rgba(168,85,247,0.12),0_12px_26px_rgba(88,28,135,0.08)]'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="grid gap-2 md:grid-cols-[max-content_minmax(0,1fr)] md:items-center">
                <StageUnlockIcons boss={boss} stage={stage} active={stageActive} />
                <RestrictionIcons stage={stage} />
              </div>
              <div
                data-testid="world-boss-set-list"
                data-stage-key={stageKey}
                className="mt-2 grid min-h-[96px] grid-cols-[repeat(auto-fit,minmax(156px,1fr))] gap-2 rounded-xl border border-dashed border-slate-200 bg-white/75 p-2"
              >
                {stageTeams.map((team, index) => (
                  <StageTeamCard
                    key={team.id}
                    bossName={boss.name}
                    stageRange={stage.range}
                    team={team}
                    teamNumber={index + 1}
                    onRemove={() => onRemoveTeam(stageKey, team.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => onOpenPicker({ stageKey, bossName: boss.name, stage })}
                  aria-label={`${boss.name} ${stage.range}층 캐릭터 세트 추가`}
                  title="3인 세트 추가"
                  className="flex min-h-[92px] min-w-0 items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 bg-white px-3 text-purple-700 shadow-sm transition hover:border-purple-500 hover:bg-purple-50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-100 text-xl font-black">+</span>
                  <span className="text-left text-xs font-black leading-tight">3인 세트<br />추가</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BossHero({
  boss,
  progress,
  onProgressChange,
}: {
  boss: WorldBoss;
  progress: BossProgress;
  onProgressChange: (bossId: string, field: BossProgressField, value: string) => void;
}) {
  const updateProgress = (field: BossProgressField, value: string) => onProgressChange(boss.id, field, value);

  return (
    <section className="relative min-h-[388px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
      <Image src={boss.bannerUrl} alt="" fill priority unoptimized className="object-cover opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/40 to-slate-950/20" />
      <div className="relative grid min-h-[388px] gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="flex items-end gap-5 self-end">
          <Image src={boss.portraitUrl} alt={boss.name} width={108} height={108} unoptimized className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white/20" />
          <div className="pb-2">
            <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${boss.mode === 'Legend+' ? 'bg-fuchsia-500 text-white' : 'bg-blue-500 text-white'}`}>{boss.mode}</span>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{boss.name}</h1>
          </div>
        </div>
        <div className="self-end rounded-[28px] border border-white/20 bg-slate-950/35 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="text-[11px] font-black uppercase tracking-wide text-white/60">Progress</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black text-white/75">LOCAL</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <BossProgressControl
              label="도전 층"
              helper="현재 클리어 목표"
              value={progress.currentStage}
              ariaLabel={`${boss.name} 도전중인 층`}
              onChange={(value) => updateProgress('currentStage', value)}
            />
            <BossProgressControl
              label="정복 Lv"
              helper="보스 정복 레벨"
              value={progress.conquestLevel}
              ariaLabel={`${boss.name} 현재 정복 레벨`}
              onChange={(value) => updateProgress('conquestLevel', value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BossProgressControl({
  label,
  helper,
  value,
  ariaLabel,
  onChange,
}: {
  label: string;
  helper: string;
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="group grid min-h-[136px] min-w-0 rounded-2xl border border-white/70 bg-white/[0.92] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-white/80">
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-600">{label}</span>
        <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-80" />
      </span>
      <span className="mt-1 text-[10px] font-bold text-slate-400">{helper}</span>
      <span className="mt-3 grid min-h-[54px] grid-cols-[38px_minmax(0,1fr)_38px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          aria-label={`${label} 감소`}
          onClick={() => onChange(adjustProgressValue(value, -1))}
          className="grid h-full w-full place-items-center border-r border-slate-200 bg-white text-xl font-black text-slate-500 transition hover:bg-slate-100"
        >
          -
        </button>
        <input
          type="number"
          min={0}
          max={999}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={ariaLabel}
          placeholder="-"
          className="h-full min-w-0 bg-transparent px-1 text-center text-3xl font-black leading-none text-slate-950 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          aria-label={`${label} 증가`}
          onClick={() => onChange(adjustProgressValue(value, 1))}
          className="grid h-full w-full place-items-center border-l border-slate-200 bg-white text-xl font-black text-slate-500 transition hover:bg-slate-100"
        >
          +
        </button>
      </span>
    </div>
  );
}

export function WorldBossSection() {
  const [selectedId, setSelectedId] = useState(worldBosses[0]?.id ?? '');
  const [stageTeams, setStageTeams] = useState<WorldBossStageTeamStore>({});
  const [bossProgress, setBossProgress] = useState<BossProgressStore>({});
  const [teamsReady, setTeamsReady] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);
  const selectedBoss = useMemo(
    () => worldBosses.find((boss) => boss.id === selectedId) ?? worldBosses[0],
    [selectedId],
  );
  const selectedBossProgress = selectedBoss ? bossProgress[selectedBoss.id] ?? createEmptyBossProgress() : createEmptyBossProgress();
  const selectedCurrentStage = numericProgressValue(selectedBossProgress.currentStage);

  useEffect(() => {
    const hydratePersonalData = () => {
      setStageTeams(readStoredTeams());
      setBossProgress(readStoredProgress());
      setTeamsReady(true);
      setProgressReady(true);
    };

    hydratePersonalData();
    window.addEventListener('mff-data-hub:personal-data-hydrated', hydratePersonalData);
    return () => window.removeEventListener('mff-data-hub:personal-data-hydrated', hydratePersonalData);
  }, []);

  useEffect(() => {
    if (!teamsReady) return;
    try {
      window.localStorage.setItem(stageTeamsStorageKey, JSON.stringify(stageTeams));
      window.localStorage.removeItem(legacyPicksStorageKey);
    } catch {
      // Custom stage teams are local convenience data; the World Boss screen remains usable without storage.
    }
  }, [stageTeams, teamsReady]);

  useEffect(() => {
    if (!progressReady) return;
    try {
      window.localStorage.setItem(worldBossProgressStorageKey, JSON.stringify(bossProgress));
    } catch {
      // Progress inputs are personal local data; the World Boss screen remains usable without storage.
    }
  }, [bossProgress, progressReady]);

  useEffect(() => {
    if (!picker) return;

    const previousBodyOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPicker(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [picker]);

  if (!selectedBoss) return null;

  const addTeam = (members: WorldBossStagePick[]) => {
    if (!picker) return;
    const teamId = `${picker.stageKey}:team:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const team = createWorldBossStageTeam(teamId, members);
    setStageTeams((current) => ({
      ...current,
      [picker.stageKey]: [...(current[picker.stageKey] ?? []), team],
    }));
    setPicker(null);
  };

  const removeTeam = (stageKey: string, teamId: string) => {
    setStageTeams((current) => ({
      ...current,
      [stageKey]: (current[stageKey] ?? []).filter((team) => team.id !== teamId),
    }));
  };

  const updateBossProgress = (bossId: string, field: BossProgressField, value: string) => {
    const nextValue = sanitizeNumericInput(value);

    setBossProgress((current) => {
      const nextProgress = {
        ...(current[bossId] ?? createEmptyBossProgress()),
        [field]: nextValue,
      };

      return {
        ...current,
        [bossId]: nextProgress,
      };
    });
  };

  return (
    <section className="space-y-5">
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
          {worldBosses.map((boss) => (
            <BossButton
              key={boss.id}
              boss={boss}
              active={boss.id === selectedBoss.id}
              progress={bossProgress[boss.id] ?? createEmptyBossProgress()}
              onClick={() => setSelectedId(boss.id)}
            />
          ))}
        </div>
        <BossHero boss={selectedBoss} progress={selectedBossProgress} onProgressChange={updateBossProgress} />
      </section>

      <StageRuleGrid boss={selectedBoss} currentStage={selectedCurrentStage} teams={stageTeams} onOpenPicker={setPicker} onRemoveTeam={removeTeam} />
      <StagePickerPanel picker={picker} onClose={() => setPicker(null)} onSubmit={addTeam} />
    </section>
  );
}
