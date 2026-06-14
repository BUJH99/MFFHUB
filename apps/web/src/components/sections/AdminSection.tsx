'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  Crown,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  ensureAppProfile,
  formatAuthError,
  listAppProfiles,
  updateAppProfileRole,
  type AccountRole,
  type AppProfile,
} from '@/lib/auth';
import { hasSupabaseConfig, supabase, supabaseSqlEditorUrl } from '@/lib/supabase';

type AdminLoadState = 'loading' | 'ready' | 'blocked' | 'error';

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function roleBadgeClass(role: AccountRole) {
  return role === 'admin'
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-blue-200 bg-blue-50 text-blue-700';
}

function AdminMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
        </div>
      </div>
    </section>
  );
}

function EmptyNotice({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <ShieldOff size={24} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">{body}</p>
    </section>
  );
}

export function AdminSection({ standalone = false }: { standalone?: boolean }) {
  const [state, setState] = useState<AdminLoadState>('loading');
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('관리자 권한을 확인하는 중입니다.');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setState('blocked');
      setStatus('Supabase 환경변수가 설정되어야 관리자 콘솔을 사용할 수 있습니다.');
      return;
    }

    setState('loading');
    setStatus('관리자 권한을 확인하는 중입니다.');

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session?.user) {
        setState('blocked');
        setProfile(null);
        setProfiles([]);
        setStatus('로그인 후 관리자 콘솔에 접근할 수 있습니다.');
        return;
      }

      const currentProfile = await ensureAppProfile(data.session.user);
      setProfile(currentProfile);

      if (currentProfile.role !== 'admin') {
        setState('blocked');
        setProfiles([]);
        setStatus('현재 계정은 관리자 권한이 없습니다.');
        return;
      }

      const nextProfiles = await listAppProfiles();
      setProfiles(nextProfiles);
      setState('ready');
      setStatus('관리자 콘솔이 준비되었습니다.');
    } catch (error) {
      setState('error');
      setStatus(formatAuthError(error));
    }
  }, []);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const stats = useMemo(() => {
    const admins = profiles.filter((item) => item.role === 'admin').length;
    const users = profiles.length - admins;
    return {
      total: profiles.length,
      admins,
      users,
      recent: profiles[0] ? formatDate(profiles[0].createdAt) : '-',
    };
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return profiles;
    return profiles.filter((item) => (
      item.loginId.toLowerCase().includes(normalizedQuery)
      || item.nickname.toLowerCase().includes(normalizedQuery)
      || item.role.includes(normalizedQuery)
    ));
  }, [profiles, query]);

  const changeRole = async (target: AppProfile, role: AccountRole) => {
    if (!profile || target.userId === profile.userId) {
      setStatus('내 계정 권한은 이 화면에서 변경할 수 없습니다.');
      return;
    }

    setBusyUserId(target.userId);
    setStatus(`${target.loginId} 권한을 변경하는 중입니다.`);
    try {
      const updated = await updateAppProfileRole(target.userId, role);
      setProfiles((current) => current.map((item) => (item.userId === updated.userId ? updated : item)));
      setStatus(`${updated.loginId} 계정을 ${role === 'admin' ? '관리자' : '일반 사용자'}로 변경했습니다.`);
    } catch (error) {
      setStatus(formatAuthError(error));
    } finally {
      setBusyUserId(null);
    }
  };

  if (state === 'loading') {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Loader2 size={28} className="mx-auto animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-black text-slate-600">{status}</p>
      </section>
    );
  }

  if (state === 'blocked') {
    return (
      <div className={standalone ? 'mx-auto max-w-5xl px-4 py-10' : ''}>
        <EmptyNotice title="관리자 전용 페이지" body={status} />
        <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-black">첫 관리자는 Supabase SQL Editor에서 승격해야 합니다.</p>
              <p className="mt-1">앱에서는 권한을 자동 승격하지 않습니다. Supabase 대시보드에서 직접 `app_profiles.role`을 `admin`으로 변경하세요.</p>
            </div>
          </div>
        </section>

        {profile ? (
          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Current Account</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{profile.loginId}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{profile.nickname} 계정의 role 값을 Supabase에서 직접 admin으로 바꾸세요.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={supabaseSqlEditorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <ExternalLink size={17} />
                  Supabase SQL Editor 열기
                </a>
                <button
                  type="button"
                  onClick={() => void loadAdminData()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <RefreshCw size={17} />
                  실행 후 새로고침
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={standalone ? 'mx-auto max-w-5xl px-4 py-10' : ''}>
        <EmptyNotice title="관리자 콘솔 오류" body={status} />
      </div>
    );
  }

  return (
    <div className={standalone ? 'mx-auto max-w-7xl px-4 py-8' : 'space-y-5'}>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-600">
              <Crown size={18} />
              Admin Console
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">관리자 전용 페이지</h1>
            <p className="mt-2 text-sm font-bold text-slate-500">사용자 계정과 관리자 권한을 한 곳에서 관리합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {standalone ? (
              <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                앱으로 이동
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void loadAdminData()}
              className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={17} />
              새로고침
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric icon={<UsersRound size={22} />} label="전체 계정" value={stats.total} />
        <AdminMetric icon={<ShieldCheck size={22} />} label="관리자" value={stats.admins} />
        <AdminMetric icon={<UserRound size={22} />} label="일반 사용자" value={stats.users} />
        <AdminMetric icon={<Database size={22} />} label="최근 가입" value={stats.recent} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">사용자 권한 관리</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{status}</p>
          </div>
          <label className="block w-full max-w-sm">
            <span className="sr-only">사용자 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="아이디, 닉네임, 권한 검색"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">계정</th>
                <th className="px-4 py-3">권한</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">업데이트</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((item) => {
                const isCurrentUser = item.userId === profile?.userId;
                const nextRole: AccountRole = item.role === 'admin' ? 'user' : 'admin';
                const busy = busyUserId === item.userId;

                return (
                  <tr key={item.userId} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex min-w-[220px] items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
                          {(item.nickname || item.loginId || 'A').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">{item.loginId}</p>
                          <p className="truncate text-xs font-bold text-slate-500">{item.nickname}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${roleBadgeClass(item.role)}`}>
                        {item.role === 'admin' ? <ShieldCheck size={14} /> : <BadgeCheck size={14} />}
                        {item.role === 'admin' ? '관리자' : '일반'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-600">{formatDate(item.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-600">{formatDate(item.updatedAt)}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        disabled={busy || isCurrentUser}
                        onClick={() => void changeRole(item, nextRole)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
                        title={isCurrentUser ? '내 계정 권한은 직접 변경할 수 없습니다.' : undefined}
                      >
                        {busy ? <Loader2 size={15} className="animate-spin" /> : item.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                        {item.role === 'admin' ? '일반 전환' : '관리자 승격'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-slate-500">검색 결과가 없습니다.</div>
        ) : null}
      </section>
    </div>
  );
}
