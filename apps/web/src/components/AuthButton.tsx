'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Session, User } from '@supabase/supabase-js';
import { AlertTriangle, BadgeCheck, Fingerprint, KeyRound, Loader2, LockKeyhole, LogIn, LogOut, Save, ShieldCheck, UserRound, UserPlus, X } from 'lucide-react';
import {
  createProfileFallback,
  ensureAppProfile,
  formatAuthError,
  loginIdToAuthEmail,
  normalizeLoginId,
  updateAppProfile,
  validateLoginId,
  validatePassword,
  validateSignupCode,
  type AppProfile,
} from '@/lib/auth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'signup' | 'profile';
type AuthDraft = {
  loginId: string;
  password: string;
  nickname: string;
  newPassword: string;
  signupCode: string;
};

const emptyDraft: AuthDraft = {
  loginId: '',
  password: '',
  nickname: '',
  newPassword: '',
  signupCode: '',
};

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-end bg-slate-950/45 p-3 pt-16 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="배경을 눌러 계정 패널 닫기" onClick={onClose} className="absolute inset-0 cursor-default" />
      <section className="relative w-full max-w-[480px] overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_58%,#fff7ed_100%)] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white bg-white/85 text-blue-700 shadow-sm">
                <UserRound size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{subtitle}</p>
                <h3 className="mt-1 truncate text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">계정, 권한, 개인 데이터 동기화를 한 곳에서 관리합니다.</p>
              </div>
            </div>
            <button type="button" aria-label="계정 패널 닫기" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function Field({
  autoComplete,
  icon,
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
}: {
  autoComplete?: string;
  icon: ReactNode;
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">{icon}</span>
        <input
          autoComplete={autoComplete}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
        />
      </span>
    </label>
  );
}

function AuthSubmitButton({ busy, icon, children }: { busy: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-300 disabled:shadow-none"
    >
      {busy ? <Loader2 size={18} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [draft, setDraft] = useState<AuthDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('준비됨');

  const refreshProfile = useCallback(async (user: User) => {
    try {
      const nextProfile = await ensureAppProfile(user);
      setProfile(nextProfile);
      setDraft((current) => ({ ...current, nickname: nextProfile.nickname }));
      void import('@/lib/personalization')
        .then((mod) => mod.syncPersonalData(user.id))
        .catch(() => undefined);
    } catch {
      const fallback = createProfileFallback(user);
      setProfile(fallback);
      setDraft((current) => ({ ...current, nickname: fallback.nickname }));
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) void refreshProfile(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void refreshProfile(nextSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const openAuth = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStatus('준비됨');
    setOpen(true);
  };

  const updateDraft = (patch: Partial<AuthDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setStatus('준비됨');
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const loginError = validateLoginId(draft.loginId);
    const passwordError = validatePassword(draft.password);
    if (loginError || passwordError) {
      setStatus(loginError ?? passwordError ?? '입력값을 확인해주세요.');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginIdToAuthEmail(draft.loginId),
        password: draft.password,
      });
      if (error) throw error;
      if (data.user) await refreshProfile(data.user);
      setDraft((current) => ({ ...current, password: '' }));
      setStatus('로그인 완료');
      setOpen(false);
    } catch (error) {
      setStatus(formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const loginError = validateLoginId(draft.loginId);
    const passwordError = validatePassword(draft.password);
    const signupCodeError = validateSignupCode(draft.signupCode);
    const nickname = draft.nickname.trim();
    if (loginError || passwordError || signupCodeError || !nickname) {
      setStatus(loginError ?? passwordError ?? signupCodeError ?? '닉네임을 입력해주세요.');
      return;
    }

    const loginId = normalizeLoginId(draft.loginId);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginIdToAuthEmail(loginId),
        password: draft.password,
        options: {
          data: {
            login_id: loginId,
            nickname,
          },
        },
      });
      if (error) throw error;
      if (data.session?.user) {
        await refreshProfile(data.session.user);
        setStatus('회원가입 완료');
        setOpen(false);
      } else {
        setStatus('회원가입 요청 완료');
      }
      setDraft((current) => ({ ...current, password: '', signupCode: '' }));
    } catch (error) {
      setStatus(formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !session?.user || !profile) return;

    const nickname = draft.nickname.trim();
    const password = draft.newPassword.trim();
    if (!nickname) {
      setStatus('닉네임을 입력해주세요.');
      return;
    }
    if (password) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setStatus(passwordError);
        return;
      }
    }

    setBusy(true);
    try {
      const nextProfile = await updateAppProfile(profile.userId, nickname);
      await supabase.auth.updateUser({
        data: {
          login_id: nextProfile.loginId,
          nickname: nextProfile.nickname,
        },
        ...(password ? { password } : {}),
      });
      setProfile(nextProfile);
      setDraft((current) => ({ ...current, newPassword: '' }));
      setStatus('프로필 저장 완료');
    } catch (error) {
      setStatus(formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setDraft(emptyDraft);
      setStatus('로그아웃 완료');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const signedIn = Boolean(session?.user);
  const roleLabel = profile?.role === 'admin' ? '관리자' : '일반';
  const statusClass = status.includes('완료')
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status.includes('실패') || status.includes('필요') || status.includes('확인') || status.includes('입력')
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <>
      <button
        type="button"
        onClick={() => openAuth(signedIn ? 'profile' : 'login')}
        className={`flex h-10 max-w-[168px] shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-black shadow-sm transition ${signedIn ? 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'}`}
      >
        {signedIn ? <UserRound size={18} /> : <LogIn size={18} />}
        <span className="min-w-0 truncate">{signedIn ? profile?.nickname ?? 'Agent' : '로그인'}</span>
      </button>

      {open && typeof document !== 'undefined' ? createPortal((
        <ModalShell title={signedIn ? '내 계정' : mode === 'signup' ? '회원가입' : '로그인'} subtitle="Account" onClose={() => setOpen(false)}>
          {!hasSupabaseConfig ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-black">Supabase 환경변수가 필요합니다.</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">`.env.local`에 URL과 anon key를 넣으면 로그인, 회원가입, 개인 데이터 저장이 활성화됩니다.</p>
                </div>
              </div>
            </div>
          ) : null}

          {hasSupabaseConfig && signedIn && profile ? (
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
                      {(profile.nickname || profile.loginId).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{profile.loginId}</p>
                      <p className="truncate text-xs font-bold text-slate-500">{profile.userId}</p>
                    </div>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${profile.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {profile.role === 'admin' ? <ShieldCheck size={14} /> : <BadgeCheck size={14} />}
                    {roleLabel}
                  </span>
                </div>
              </div>
              <Field icon={<UserRound size={17} />} label="닉네임" value={draft.nickname} onChange={(value) => updateDraft({ nickname: value })} autoComplete="nickname" placeholder="표시할 닉네임" />
              <Field icon={<LockKeyhole size={17} />} label="새 비밀번호" type="password" value={draft.newPassword} onChange={(value) => updateDraft({ newPassword: value })} autoComplete="new-password" placeholder="변경할 때만 입력" />
              <div className="grid grid-cols-2 gap-2">
                <AuthSubmitButton busy={busy} icon={<Save size={18} />}>저장</AuthSubmitButton>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <LogOut size={18} /> 로그아웃
                </button>
              </div>
            </form>
          ) : null}

          {hasSupabaseConfig && !signedIn && mode === 'login' ? (
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                <button type="button" onClick={() => openAuth('login')} className="rounded-md bg-white px-3 py-2 text-sm font-black text-slate-950 shadow-sm">로그인</button>
                <button type="button" onClick={() => openAuth('signup')} className="rounded-md px-3 py-2 text-sm font-black text-slate-500 transition hover:text-slate-900">회원가입</button>
              </div>
              <Field icon={<Fingerprint size={17} />} label="아이디" value={draft.loginId} onChange={(value) => updateDraft({ loginId: value })} autoComplete="username" placeholder="mff_agent" />
              <Field icon={<LockKeyhole size={17} />} label="비밀번호" type="password" value={draft.password} onChange={(value) => updateDraft({ password: value })} autoComplete="current-password" placeholder="6자 이상" />
              <AuthSubmitButton busy={busy} icon={<LogIn size={18} />}>로그인</AuthSubmitButton>
              <button type="button" onClick={() => openAuth('signup')} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                회원가입
              </button>
            </form>
          ) : null}

          {hasSupabaseConfig && !signedIn && mode === 'signup' ? (
            <form onSubmit={submitSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                <button type="button" onClick={() => openAuth('login')} className="rounded-md px-3 py-2 text-sm font-black text-slate-500 transition hover:text-slate-900">로그인</button>
                <button type="button" onClick={() => openAuth('signup')} className="rounded-md bg-white px-3 py-2 text-sm font-black text-slate-950 shadow-sm">회원가입</button>
              </div>
              <Field icon={<Fingerprint size={17} />} label="아이디" value={draft.loginId} onChange={(value) => updateDraft({ loginId: value })} autoComplete="username" placeholder="영문/숫자 조합" />
              <Field icon={<KeyRound size={17} />} label="비밀번호" type="password" value={draft.password} onChange={(value) => updateDraft({ password: value })} autoComplete="new-password" placeholder="6자 이상" />
              <Field icon={<UserPlus size={17} />} label="닉네임" value={draft.nickname} onChange={(value) => updateDraft({ nickname: value })} autoComplete="nickname" placeholder="게시판 표시 이름" />
              <Field icon={<ShieldCheck size={17} />} label="회원가입 코드" type="password" value={draft.signupCode} onChange={(value) => updateDraft({ signupCode: value })} autoComplete="one-time-code" placeholder="초대코드 입력" />
              <AuthSubmitButton busy={busy} icon={<KeyRound size={18} />}>가입</AuthSubmitButton>
              <button type="button" onClick={() => openAuth('login')} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                로그인으로 이동
              </button>
            </form>
          ) : null}

          <p className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${statusClass}`}>
            <BadgeCheck size={16} />
            {status}
          </p>
        </ModalShell>
      ), document.body) : null}
    </>
  );
}
