'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, Trophy } from 'lucide-react';
import { getKstDateKey } from '@/lib/allianceBattle';
import { readAppProfile, type AppProfile } from '@/lib/auth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { pveWeeklyModes, type PveWeeklyContent } from '@/lib/scoreDisplay';

type ScoreEntry = {
  userId: string;
  playerNickname: string;
  scoreDate: string;
  content: PveWeeklyContent;
  score: number;
  memo: string;
  isPublic: boolean;
  updatedAt: string;
};
type ScoreDraft = Record<PveWeeklyContent, { score: string; memo: string; isPublic: boolean }>;
type ScoreRow = {
  user_id?: string | null;
  player_nickname?: string | null;
  score_date?: string | null;
  content?: string | null;
  score?: string | number | null;
  memo?: string | null;
  is_public?: boolean | null;
  updated_at?: string | null;
};
type RankingRow = {
  userId: string;
  playerNickname: string;
  total: number;
  scores: Record<PveWeeklyContent, number>;
  isMine: boolean;
};

const userScoreStorageKey = 'mff-data-hub:user-score-entries:v1';

function emptyDraft(): ScoreDraft {
  return {
    ABX: { score: '', memo: '', isPublic: false },
    ABL: { score: '', memo: '', isPublic: false },
    'Infinity Challenge': { score: '', memo: '', isPublic: false },
  };
}

function normalizeEntry(row: ScoreRow, fallbackNickname = 'Agent'): ScoreEntry | null {
  const content = row.content;
  if (content !== 'ABX' && content !== 'ABL' && content !== 'Infinity Challenge') return null;

  return {
    userId: row.user_id ?? 'local-user',
    playerNickname: row.player_nickname ?? fallbackNickname,
    scoreDate: row.score_date ?? getKstDateKey(),
    content,
    score: Math.max(0, Math.round(Number(row.score ?? 0))),
    memo: row.memo ?? '',
    isPublic: Boolean(row.is_public),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function readLocalEntries() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(userScoreStorageKey) ?? '[]') as ScoreRow[];
    return parsed.map((row) => normalizeEntry(row, 'LOCAL')).filter((entry): entry is ScoreEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function writeLocalEntries(entries: ScoreEntry[]) {
  window.localStorage.setItem(userScoreStorageKey, JSON.stringify(entries));
}

function formatScore(value: number) {
  return value.toLocaleString('ko-KR');
}

function modeTotal(entries: ScoreEntry[], content: PveWeeklyContent) {
  return entries.filter((entry) => entry.content === content).reduce((sum, entry) => sum + entry.score, 0);
}

function mergeEntries(primaryEntries: ScoreEntry[], overrideEntries: ScoreEntry[]) {
  const entryMap = new Map<string, ScoreEntry>();

  for (const entry of primaryEntries) {
    entryMap.set(`${entry.userId}:${entry.scoreDate}:${entry.content}`, entry);
  }
  for (const entry of overrideEntries) {
    entryMap.set(`${entry.userId}:${entry.scoreDate}:${entry.content}`, entry);
  }

  return Array.from(entryMap.values());
}

function buildRankings(entries: ScoreEntry[], scoreDate: string, currentUserId?: string): RankingRow[] {
  const rankingMap = new Map<string, RankingRow>();

  for (const entry of entries) {
    if (entry.scoreDate !== scoreDate) continue;

    const current = rankingMap.get(entry.userId) ?? {
      userId: entry.userId,
      playerNickname: entry.playerNickname,
      total: 0,
      scores: { ABX: 0, ABL: 0, 'Infinity Challenge': 0 },
      isMine: currentUserId === entry.userId,
    };

    current.playerNickname = entry.playerNickname || current.playerNickname;
    current.scores[entry.content] = entry.score;
    current.total = pveWeeklyModes.reduce((sum, mode) => sum + current.scores[mode.content], 0);
    current.isMine = current.isMine || currentUserId === entry.userId;
    rankingMap.set(entry.userId, current);
  }

  return Array.from(rankingMap.values()).sort((left, right) => right.total - left.total).slice(0, 20);
}

export function UserScoreSection() {
  const today = getKstDateKey();
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [publicEntries, setPublicEntries] = useState<ScoreEntry[]>([]);
  const [scoreDate, setScoreDate] = useState(today);
  const [draft, setDraft] = useState<ScoreDraft>(() => emptyDraft());
  const [status, setStatus] = useState('준비됨');
  const [busy, setBusy] = useState(false);

  const loadEntries = async () => {
    if (!supabase) {
      const localEntries = readLocalEntries();
      setEntries(localEntries);
      setPublicEntries(localEntries);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    let ownEntries: ScoreEntry[] = [];
    let nickname = 'Agent';

    if (!userData.user) {
      setProfile(null);
      ownEntries = readLocalEntries();
    } else {
      const nextProfile = await readAppProfile(userData.user.id);
      setProfile(nextProfile);
      nickname = nextProfile?.nickname ?? 'Agent';

      const { data, error } = await supabase
        .from('user_score_entries')
        .select('user_id, player_nickname, score_date, content, score, memo, is_public, updated_at')
        .eq('user_id', userData.user.id)
        .order('score_date', { ascending: false })
        .limit(90);

      if (error) throw error;
      ownEntries = (data ?? []).map((row) => normalizeEntry(row as ScoreRow, nickname)).filter((entry): entry is ScoreEntry => Boolean(entry));
    }

    const { data: rankingData, error: rankingError } = await supabase
      .from('user_score_entries')
      .select('user_id, player_nickname, score_date, content, score, memo, is_public, updated_at')
      .eq('is_public', true)
      .order('score_date', { ascending: false })
      .limit(300);

    if (rankingError) throw rankingError;
    setEntries(ownEntries);
    setPublicEntries((rankingData ?? []).map((row) => normalizeEntry(row as ScoreRow)).filter((entry): entry is ScoreEntry => Boolean(entry)));
  };

  useEffect(() => {
    loadEntries().catch((error) => setStatus(error instanceof Error ? error.message : '불러오기 실패'));
  }, []);

  const selectedEntries = useMemo(() => entries.filter((entry) => entry.scoreDate === scoreDate), [entries, scoreDate]);
  const selectedTotal = useMemo(() => selectedEntries.reduce((sum, entry) => sum + entry.score, 0), [selectedEntries]);
  const grandTotal = useMemo(() => entries.reduce((sum, entry) => sum + entry.score, 0), [entries]);
  const rankingEntries = useMemo(() => mergeEntries(publicEntries, entries), [entries, publicEntries]);
  const rankings = useMemo(() => buildRankings(rankingEntries, scoreDate, profile?.userId), [profile?.userId, rankingEntries, scoreDate]);
  const myRankingIndex = useMemo(() => rankings.findIndex((rank) => rank.isMine), [rankings]);

  const updateDraft = (content: PveWeeklyContent, patch: Partial<ScoreDraft[PveWeeklyContent]>) => {
    setDraft((current) => ({ ...current, [content]: { ...current[content], ...patch } }));
  };

  const saveScores = async () => {
    const now = new Date().toISOString();
    const playerNickname = profile?.nickname ?? 'LOCAL';
    const draftUserId = profile?.userId ?? 'local-user';
    const nextEntries = pveWeeklyModes.map((mode) => ({
      userId: draftUserId,
      playerNickname,
      scoreDate,
      content: mode.content,
      score: Math.max(0, Math.round(Number(draft[mode.content].score) || 0)),
      memo: draft[mode.content].memo.trim(),
      isPublic: draft[mode.content].isPublic,
      updatedAt: now,
    }));

    setBusy(true);
    try {
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('로그인이 필요합니다.');
        const userId = userData.user.id;
        const scoreOwner = profile?.nickname ?? (await readAppProfile(userId))?.nickname ?? 'Agent';

        const { error } = await supabase.from('user_score_entries').upsert(
          nextEntries.map((entry) => ({
            user_id: userId,
            player_nickname: scoreOwner,
            score_date: entry.scoreDate,
            content: entry.content,
            score: entry.score,
            memo: entry.memo,
            is_public: entry.isPublic,
            updated_at: now,
          })),
          { onConflict: 'user_id,score_date,content' },
        );
        if (error) throw error;
        await loadEntries();
      } else {
        const others = readLocalEntries().filter((entry) => entry.scoreDate !== scoreDate);
        const merged = [...nextEntries, ...others].sort((left, right) => right.scoreDate.localeCompare(left.scoreDate));
        writeLocalEntries(merged);
        setEntries(merged);
      }

      setDraft(emptyDraft());
      setStatus('저장 완료');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  const removeDate = async (targetDate: string) => {
    setBusy(true);
    try {
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('로그인이 필요합니다.');

        const { error } = await supabase
          .from('user_score_entries')
          .delete()
          .eq('user_id', userData.user.id)
          .eq('score_date', targetDate);
        if (error) throw error;
        await loadEntries();
      } else {
        const next = readLocalEntries().filter((entry) => entry.scoreDate !== targetDate);
        writeLocalEntries(next);
        setEntries(next);
      }
      setStatus('삭제 완료');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '삭제 실패');
    } finally {
      setBusy(false);
    }
  };

  const groupedByDate = useMemo(() => {
    const dateMap = new Map<string, ScoreEntry[]>();
    for (const entry of entries) {
      dateMap.set(entry.scoreDate, [...(dateMap.get(entry.scoreDate) ?? []), entry]);
    }
    return Array.from(dateMap.entries()).sort((left, right) => right[0].localeCompare(left[0]));
  }, [entries]);

  return (
    <section className="space-y-5" data-testid="user-score-section">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-purple-600">User Scores</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">점수 입력</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{profile?.nickname ?? (hasSupabaseConfig ? '로그인 전' : 'LOCAL')}</p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-5 py-3 text-right text-white">
            <p className="text-xs font-black text-slate-300">누적 합계</p>
            <p className="mt-1 text-2xl font-black">{formatScore(grandTotal)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-black text-slate-500">날짜</span>
            <input
              type="date"
              value={scoreDate}
              onChange={(event) => setScoreDate(event.currentTarget.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
          </label>
          {pveWeeklyModes.map((mode) => (
            <div key={`total-${mode.content}`} className={`rounded-2xl p-4 ring-1 ${mode.accent}`}>
              <p className="text-xs font-black">{mode.label}</p>
              <p className="mt-2 text-2xl font-black">{formatScore(modeTotal(entries, mode.content))}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="score-ranking-board">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-amber-600">Ranking</p>
            <h3 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-950">
              <Trophy size={24} className="text-amber-500" /> 합산 랭킹
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-500">{scoreDate} · ABX + ABL + 인피니티 챌린지</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right text-amber-700 ring-1 ring-amber-100">
            <p className="text-xs font-black">내 순위</p>
            <p className="mt-1 text-2xl font-black">{myRankingIndex >= 0 ? `${myRankingIndex + 1}위` : '-'}</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[64px_minmax(120px,1fr)_108px_repeat(3,92px)] bg-slate-950 px-3 py-3 text-xs font-black text-white max-xl:hidden">
            <span>순위</span>
            <span>닉네임</span>
            <span className="text-right">합산</span>
            {pveWeeklyModes.map((mode) => <span key={`rank-head-${mode.content}`} className="text-right">{mode.shortLabel}</span>)}
          </div>
          <div className="divide-y divide-slate-100">
            {rankings.length ? rankings.map((rank, index) => (
              <article
                key={`${rank.userId}-${scoreDate}`}
                className={`grid gap-3 px-3 py-3 xl:grid-cols-[64px_minmax(120px,1fr)_108px_repeat(3,92px)] xl:items-center ${rank.isMine ? 'bg-purple-50/70' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span>
                  <div className="min-w-0 xl:hidden">
                    <p className="truncate text-sm font-black text-slate-950">{rank.playerNickname}</p>
                    <p className="text-xs font-bold text-slate-500">합산 {formatScore(rank.total)}</p>
                  </div>
                </div>
                <p className="hidden truncate text-sm font-black text-slate-950 xl:block">{rank.playerNickname}{rank.isMine ? ' · MY' : ''}</p>
                <p className="hidden text-right text-lg font-black text-purple-700 xl:block">{formatScore(rank.total)}</p>
                <div className="grid grid-cols-3 gap-2 xl:contents">
                  {pveWeeklyModes.map((mode) => (
                    <div key={`${rank.userId}-${mode.content}`} className="rounded-xl bg-slate-50 px-3 py-2 text-right xl:bg-transparent xl:p-0">
                      <p className="text-[11px] font-black text-slate-500 xl:hidden">{mode.shortLabel}</p>
                      <p className="text-sm font-black text-slate-800">{formatScore(rank.scores[mode.content])}</p>
                    </div>
                  ))}
                </div>
              </article>
            )) : (
              <p className="p-6 text-center text-sm font-bold text-slate-500">공개된 점수 없음</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {pveWeeklyModes.map((mode) => (
          <article key={mode.content} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">{mode.label}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${mode.accent}`}>{formatScore(selectedEntries.find((entry) => entry.content === mode.content)?.score ?? 0)}</span>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black text-slate-500">점수</span>
              <input
                type="number"
                min={0}
                value={draft[mode.content].score}
                onChange={(event) => updateDraft(mode.content, { score: event.currentTarget.value })}
                placeholder="0"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-right text-lg font-black text-slate-950 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-black text-slate-500">메모</span>
              <textarea
                value={draft[mode.content].memo}
                onChange={(event) => updateDraft(mode.content, { memo: event.currentTarget.value })}
                className="mt-2 h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </label>
            <label className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700">
              공개
              <input
                type="checkbox"
                checked={draft[mode.content].isPublic}
                onChange={(event) => updateDraft(mode.content, { isPublic: event.currentTarget.checked })}
                className="h-5 w-5 accent-purple-600"
              />
            </label>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-black text-slate-600">{scoreDate} 합계 <span className="text-purple-700">{formatScore(selectedTotal)}</span></p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={saveScores} disabled={busy} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:bg-slate-300">
            <Save size={18} /> 저장
          </button>
          <span className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">{status}</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[120px_repeat(3,minmax(0,1fr))_72px] bg-slate-950 px-3 py-3 text-xs font-black text-white max-lg:hidden">
          <span>날짜</span>
          {pveWeeklyModes.map((mode) => <span key={`head-${mode.content}`}>{mode.label}</span>)}
          <span className="text-right">관리</span>
        </div>
        <div className="divide-y divide-slate-100">
          {groupedByDate.length ? groupedByDate.map(([dateKey, dateEntries]) => (
            <article key={dateKey} className="grid gap-3 p-4 lg:grid-cols-[120px_repeat(3,minmax(0,1fr))_72px] lg:items-center">
              <p className="text-sm font-black text-slate-950">{dateKey}</p>
              {pveWeeklyModes.map((mode) => {
                const entry = dateEntries.find((item) => item.content === mode.content);
                return (
                  <div key={`${dateKey}-${mode.content}`} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-black text-slate-500 lg:hidden">{mode.label}</p>
                    <p className="text-base font-black text-slate-950">{formatScore(entry?.score ?? 0)}</p>
                    {entry?.memo ? <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">{entry.memo}</p> : null}
                  </div>
                );
              })}
              <button type="button" onClick={() => removeDate(dateKey)} disabled={busy} aria-label={`${dateKey} 점수 삭제`} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600 disabled:text-slate-300">
                <Trash2 size={18} />
              </button>
            </article>
          )) : (
            <p className="p-6 text-center text-sm font-bold text-slate-500">기록 없음</p>
          )}
        </div>
      </section>
    </section>
  );
}
