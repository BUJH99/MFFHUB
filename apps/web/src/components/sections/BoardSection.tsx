'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Filter, Inbox, MessageSquare, MessageSquarePlus, Pin, Search, Trash2, UserRound } from 'lucide-react';
import { readAppProfile, type AppProfile } from '@/lib/auth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

type BoardCategory = 'general' | 'strategy' | 'question' | 'notice';
type BoardPost = {
  id: string;
  userId: string;
  authorNickname: string;
  category: BoardCategory;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};
type BoardRow = {
  id?: string | null;
  user_id?: string | null;
  author_nickname?: string | null;
  category?: string | null;
  title?: string | null;
  body?: string | null;
  is_pinned?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const boardStorageKey = 'mff-data-hub:board-posts:v1';
const categories: Array<{ value: BoardCategory; label: string; badgeClass: string; filterClass: string; accentClass: string }> = [
  {
    value: 'general',
    label: '자유',
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200',
    filterClass: 'bg-slate-950 text-white',
    accentClass: 'border-l-slate-300',
  },
  {
    value: 'strategy',
    label: '공략',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-100',
    filterClass: 'bg-blue-600 text-white',
    accentClass: 'border-l-blue-500',
  },
  {
    value: 'question',
    label: '질문',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-100',
    filterClass: 'bg-violet-600 text-white',
    accentClass: 'border-l-violet-500',
  },
  {
    value: 'notice',
    label: '공지',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    filterClass: 'bg-amber-500 text-white',
    accentClass: 'border-l-amber-500',
  },
];

function normalizeCategory(value: unknown): BoardCategory {
  return categories.some((category) => category.value === value) ? value as BoardCategory : 'general';
}

function getCategoryMeta(value: BoardCategory) {
  return categories.find((category) => category.value === value) ?? categories[0];
}

function normalizePost(row: BoardRow): BoardPost | null {
  if (!row.id || !row.title || !row.body) return null;

  return {
    id: row.id,
    userId: row.user_id ?? 'local-user',
    authorNickname: row.author_nickname ?? 'Agent',
    category: normalizeCategory(row.category),
    title: row.title,
    body: row.body,
    isPinned: Boolean(row.is_pinned),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function readLocalPosts() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(boardStorageKey) ?? '[]') as BoardRow[];
    return parsed.map(normalizePost).filter((post): post is BoardPost => Boolean(post));
  } catch {
    return [];
  }
}

function writeLocalPosts(posts: BoardPost[]) {
  window.localStorage.setItem(boardStorageKey, JSON.stringify(posts));
}

function createLocalId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `local-${Date.now()}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function BoardSection() {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [category, setCategory] = useState<BoardCategory>('general');
  const [filter, setFilter] = useState<BoardCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('준비됨');
  const [busy, setBusy] = useState(false);

  const canWrite = !hasSupabaseConfig || Boolean(profile);

  const loadPosts = async () => {
    if (!supabase) {
      setPosts(readLocalPosts());
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setProfile(await readAppProfile(userData.user.id));
    } else {
      setProfile(null);
    }

    const { data, error } = await supabase
      .from('board_posts')
      .select('id, user_id, author_nickname, category, title, body, is_pinned, created_at, updated_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setPosts((data ?? []).map((row) => normalizePost(row as BoardRow)).filter((post): post is BoardPost => Boolean(post)));
  };

  useEffect(() => {
    loadPosts().catch((error) => setStatus(error instanceof Error ? error.message : '불러오기 실패'));
  }, []);

  const boardStats = useMemo(() => {
    const mine = profile ? posts.filter((post) => post.userId === profile.userId).length : (!hasSupabaseConfig ? posts.length : 0);
    return {
      mine,
      pinned: posts.filter((post) => post.isPinned).length,
      total: posts.length,
    };
  }, [posts, profile]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(categories.map((item) => [item.value, 0])) as Record<BoardCategory, number>;
    posts.forEach((post) => {
      counts[post.category] += 1;
    });
    return counts;
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesFilter = filter === 'all' || post.category === filter;
      const matchesQuery = !normalizedQuery
        || post.title.toLowerCase().includes(normalizedQuery)
        || post.body.toLowerCase().includes(normalizedQuery)
        || post.authorNickname.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, posts, query]);

  const submitPost = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setStatus('제목과 내용을 입력해주세요.');
      return;
    }

    setBusy(true);
    try {
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('로그인이 필요합니다.');

        const author = profile?.nickname ?? 'Agent';
        const { error } = await supabase.from('board_posts').insert({
          user_id: userData.user.id,
          author_nickname: author,
          category,
          title: trimmedTitle,
          body: trimmedBody,
        });
        if (error) throw error;
        await loadPosts();
      } else {
        const now = new Date().toISOString();
        const nextPost: BoardPost = {
          id: createLocalId(),
          userId: 'local-user',
          authorNickname: 'LOCAL',
          category,
          title: trimmedTitle,
          body: trimmedBody,
          isPinned: false,
          createdAt: now,
          updatedAt: now,
        };
        const nextPosts = [nextPost, ...readLocalPosts()];
        writeLocalPosts(nextPosts);
        setPosts(nextPosts);
      }

      setTitle('');
      setBody('');
      setStatus('등록 완료');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '등록 실패');
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async (post: BoardPost) => {
    setBusy(true);
    try {
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('로그인이 필요합니다.');

        const { error } = await supabase.from('board_posts').delete().eq('id', post.id);
        if (error) throw error;
        await loadPosts();
      } else {
        const nextPosts = readLocalPosts().filter((item) => item.id !== post.id);
        writeLocalPosts(nextPosts);
        setPosts(nextPosts);
      }
      setStatus('삭제 완료');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '삭제 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5" data-testid="board-section">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f8fbff_62%,#fff7ed)] p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white shadow-sm">
                <MessageSquare size={18} />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Community</p>
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">게시판</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {profile?.nickname ?? (hasSupabaseConfig ? '로그인 전' : 'LOCAL')} · 전략 공유, 질문, 공지 기록
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-black text-slate-400">전체글</p>
              <p className="mt-1 text-lg font-black text-slate-950">{boardStats.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-black text-slate-400">내 글</p>
              <p className="mt-1 text-lg font-black text-blue-700">{boardStats.mine}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-black text-slate-400">공지</p>
              <p className="mt-1 text-lg font-black text-amber-600">{boardStats.pinned}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
              <Filter size={15} /> 분류
            </span>
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-2 text-xs font-black transition ${filter === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              전체 {boardStats.total}
            </button>
            {categories.map((item) => (
              <button
                type="button"
                aria-pressed={filter === item.value}
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-2 text-xs font-black transition ${filter === item.value ? item.filterClass : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item.label} {categoryCounts[item.value]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="제목, 내용, 작성자 검색"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white">
                  <MessageSquarePlus size={18} />
                </span>
                <h3 className="text-lg font-black text-slate-950">글쓰기</h3>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">{canWrite ? '새 글을 등록해 팀 기록을 남깁니다.' : '로그인 후 게시글을 작성할 수 있습니다.'}</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">{status}</span>
          </div>
          <div className="grid gap-3 p-4">
            <label className="block">
              <span className="text-xs font-black text-slate-500">분류</span>
              <select
                value={category}
                onChange={(event) => setCategory(normalizeCategory(event.currentTarget.value))}
                disabled={!canWrite || busy}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:text-slate-400"
              >
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                disabled={!canWrite || busy}
                placeholder="예: 이번 주 ABL 추천 조합"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:text-slate-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">내용</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.currentTarget.value)}
                disabled={!canWrite || busy}
                placeholder="공략, 질문, 기록 공유 내용을 적어주세요."
                className="mt-2 h-44 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:text-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={submitPost}
              disabled={!canWrite || busy}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none"
            >
              <MessageSquarePlus size={18} /> 게시글 등록
            </button>
          </div>
        </aside>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <BadgeCheck size={17} className="text-blue-600" />
              {filter === 'all' ? '전체 게시글' : `${getCategoryMeta(filter).label} 게시글`}
            </div>
            <span className="text-xs font-bold text-slate-500">{visiblePosts.length}개 표시</span>
          </div>

          {visiblePosts.length ? visiblePosts.map((post) => {
            const owned = profile?.userId === post.userId || !hasSupabaseConfig;
            const meta = getCategoryMeta(post.category);
            const initial = (post.authorNickname || 'A').slice(0, 1).toUpperCase();
            return (
              <article key={post.id} className={`rounded-xl border border-l-4 border-slate-200 ${meta.accentClass} bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${meta.badgeClass}`}>{meta.label}</span>
                        {post.isPinned ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                            <Pin size={13} /> 공지
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <UserRound size={13} /> {post.authorNickname} · {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-3 break-words text-xl font-black text-slate-950">{post.title}</h3>
                    </div>
                  </div>
                  {owned ? (
                    <button type="button" onClick={() => deletePost(post)} disabled={busy} aria-label={`${post.title} 삭제`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:text-slate-300">
                      <Trash2 size={18} />
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700">{post.body}</p>
              </article>
            );
          }) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm">
              <Inbox size={28} className="mx-auto text-slate-400" />
              <p className="mt-3 text-slate-700">게시글 없음</p>
              <p className="mt-1 text-xs text-slate-500">필터나 검색어를 바꾸거나 첫 게시글을 작성해보세요.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
