'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  AlertTriangle,
  BarChart3,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  ensureAppProfile,
  formatAuthError,
  loginIdToAuthEmail,
  normalizeLoginId,
  validateLoginId,
  validatePassword,
  validateSignupCode,
} from '@/lib/auth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

type AuthGateMode = 'login' | 'signup';

type AuthGateDraft = {
  loginId: string;
  password: string;
  nickname: string;
  signupCode: string;
};

const emptyDraft: AuthGateDraft = {
  loginId: '',
  password: '',
  nickname: '',
  signupCode: '',
};

const savedLoginIdStorageKey = 'mff-data-hub:auth-login-id:v1';

function readSavedLoginId() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(savedLoginIdStorageKey) ?? '';
  } catch {
    return '';
  }
}

function writeSavedLoginId(loginId: string, remember: boolean) {
  try {
    if (remember) {
      window.localStorage.setItem(savedLoginIdStorageKey, normalizeLoginId(loginId));
    } else {
      window.localStorage.removeItem(savedLoginIdStorageKey);
    }
  } catch {
    // Remembering the ID is a convenience only; auth should keep working without it.
  }
}

function GateTextField({
  autoComplete,
  icon,
  label,
  onChange,
  placeholder,
  right,
  type = 'text',
  value,
}: {
  autoComplete?: string;
  icon: ReactNode;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  right?: ReactNode;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <span className="mt-2 flex min-h-[50px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
        <span className="grid h-7 w-7 shrink-0 place-items-center text-slate-500">{icon}</span>
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base font-bold text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        {right}
      </span>
    </label>
  );
}

function DividerLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-sm font-black text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      {children}
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function AuthGateShell({
  busy,
  children,
  mode,
  status,
}: {
  busy: boolean;
  children: ReactNode;
  mode: AuthGateMode;
  status: string;
}) {
  const year = new Date().getFullYear();
  const statusTone = status.includes('완료')
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <main className="mff-auth-gate flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8 text-slate-950">
      <section className="w-full max-w-[448px] rounded-xl border border-slate-200 bg-white px-8 py-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:px-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-[0_12px_32px_rgba(37,99,235,0.14)]">
          <BarChart3 size={31} strokeWidth={2.4} />
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-normal text-slate-950 sm:text-[42px]">
          <span className="text-blue-600">MFF</span> Data Hub
        </h1>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="flex shrink-0 items-center gap-2 text-sm font-black text-blue-600">
            <ShieldCheck size={17} />
            보안 연결됨
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {!hasSupabaseConfig ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm font-bold text-amber-900">
            <div className="flex items-start gap-3">
              <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-black">Supabase 설정이 필요합니다.</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">`.env.local`에 URL과 anon key를 넣으면 로그인 후 프로젝트에 입장할 수 있습니다.</p>
              </div>
            </div>
          </div>
        ) : null}

        {children}

        {status !== '준비됨' ? (
          <p className={`mt-5 rounded-lg border px-3 py-2 text-sm font-bold ${statusTone}`}>
            {busy ? '요청 처리 중입니다.' : status}
          </p>
        ) : null}
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-400">
        <span>© {year} MFF Data Hub. All rights reserved.</span>
        <span className="hidden h-4 w-px bg-slate-200 sm:block" />
        <button type="button" className="transition hover:text-slate-700">도움말</button>
        <span className="h-4 w-px bg-slate-200" />
        <button type="button" className="transition hover:text-slate-700">이용약관</button>
        <span className="h-4 w-px bg-slate-200" />
        <button type="button" className="transition hover:text-slate-700">개인정보처리방침</button>
      </footer>

      <div className="sr-only" aria-live="polite">
        {mode === 'login' ? '로그인 화면' : '회원가입 화면'}
        {busy ? ' 처리 중' : ''}
      </div>
    </main>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<AuthGateMode>('login');
  const [draft, setDraft] = useState<AuthGateDraft>(emptyDraft);
  const [rememberLoginId, setRememberLoginId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('준비됨');

  const refreshProfile = useCallback(async (user: User) => {
    try {
      await ensureAppProfile(user);
      void import('@/lib/personalization')
        .then((mod) => mod.syncPersonalData(user.id))
        .catch(() => undefined);
    } catch {
      // Profile sync should not block entry after a valid Supabase session.
    }
  }, []);

  useEffect(() => {
    const savedLoginId = readSavedLoginId();
    if (savedLoginId) {
      setDraft((current) => ({ ...current, loginId: savedLoginId }));
      setRememberLoginId(true);
    }

    if (!supabase) {
      setChecking(false);
      return;
    }

    let active = true;
    const checkingFallback = window.setTimeout(() => {
      if (active) setChecking(false);
    }, 1600);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (data.session?.user) void refreshProfile(data.session.user);
      })
      .catch((error) => {
        if (!active) return;
        setStatus(formatAuthError(error));
      })
      .finally(() => {
        window.clearTimeout(checkingFallback);
        if (active) setChecking(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setChecking(false);
      if (nextSession?.user) {
        void refreshProfile(nextSession.user);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(checkingFallback);
      listener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const updateDraft = (patch: Partial<AuthGateDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setStatus('준비됨');
  };

  const changeMode = (nextMode: AuthGateMode) => {
    setMode(nextMode);
    setStatus('준비됨');
    setDraft((current) => ({ ...current, password: '', signupCode: '' }));
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
      writeSavedLoginId(draft.loginId, rememberLoginId);
      setDraft((current) => ({ ...current, password: '' }));
      setSession(data.session);
      setStatus('로그인 완료');
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
      writeSavedLoginId(loginId, rememberLoginId);
      setDraft((current) => ({ ...current, password: '', signupCode: '' }));
      if (data.session?.user) {
        await refreshProfile(data.session.user);
        setSession(data.session);
        setStatus('회원가입 완료');
      } else {
        setMode('login');
        setStatus('회원가입 요청 완료. 로그인으로 입장해주세요.');
      }
    } catch (error) {
      setStatus(formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <AuthGateShell busy mode="login" status="준비됨">
        <div className="flex min-h-[224px] items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm font-black text-slate-500">
          <Loader2 size={20} className="mr-2 animate-spin text-blue-600" />
          세션 확인 중
        </div>
      </AuthGateShell>
    );
  }

  if (session?.user) return <>{children}</>;

  return (
    <AuthGateShell busy={busy} mode={mode} status={status}>
      {mode === 'login' ? (
        <form onSubmit={submitLogin} className="space-y-4">
          <GateTextField
            autoComplete="username"
            icon={<Fingerprint size={24} />}
            label="아이디"
            onChange={(value) => updateDraft({ loginId: value })}
            placeholder="아이디를 입력하세요"
            value={draft.loginId}
          />

          <GateTextField
            autoComplete="current-password"
            icon={<LockKeyhole size={23} />}
            label="비밀번호"
            onChange={(value) => updateDraft({ password: value })}
            placeholder="비밀번호를 입력하세요"
            right={(
              <button
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
            type={showPassword ? 'text' : 'password'}
            value={draft.password}
          />

          <div className="flex items-center justify-between gap-4 text-sm font-bold">
            <label className="flex min-w-0 items-center gap-2 text-slate-600">
              <input
                checked={rememberLoginId}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                onChange={(event) => setRememberLoginId(event.currentTarget.checked)}
                type="checkbox"
              />
              아이디 저장
            </label>
            <button
              className="shrink-0 text-blue-600 transition hover:text-blue-700"
              onClick={() => setStatus('비밀번호 찾기는 관리자에게 문의해주세요.')}
              type="button"
            >
              비밀번호 찾기
            </button>
          </div>

          <button
            className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.26)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            disabled={busy || !hasSupabaseConfig}
            type="submit"
          >
            {busy ? <Loader2 size={22} className="animate-spin" /> : <LogIn size={23} />}
            로그인
          </button>

          <DividerLabel>또는</DividerLabel>

          <button
            className="flex min-h-[50px] w-full items-center justify-center gap-3 rounded-lg border border-blue-200 bg-white px-5 text-base font-black text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
            onClick={() => changeMode('signup')}
            type="button"
          >
            <UserPlus size={23} />
            회원가입
          </button>
        </form>
      ) : (
        <form onSubmit={submitSignup} className="space-y-4">
          <GateTextField
            autoComplete="username"
            icon={<Fingerprint size={24} />}
            label="아이디"
            onChange={(value) => updateDraft({ loginId: value })}
            placeholder="영문/숫자 조합"
            value={draft.loginId}
          />
          <GateTextField
            autoComplete="nickname"
            icon={<UserPlus size={23} />}
            label="닉네임"
            onChange={(value) => updateDraft({ nickname: value })}
            placeholder="표시할 닉네임"
            value={draft.nickname}
          />
          <GateTextField
            autoComplete="new-password"
            icon={<LockKeyhole size={23} />}
            label="비밀번호"
            onChange={(value) => updateDraft({ password: value })}
            placeholder="6자 이상"
            type="password"
            value={draft.password}
          />
          <GateTextField
            autoComplete="one-time-code"
            icon={<ShieldCheck size={23} />}
            label="회원가입 코드"
            onChange={(value) => updateDraft({ signupCode: value })}
            placeholder="초대코드 입력"
            type="password"
            value={draft.signupCode}
          />

          <button
            className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.26)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            disabled={busy || !hasSupabaseConfig}
            type="submit"
          >
            {busy ? <Loader2 size={22} className="animate-spin" /> : <UserPlus size={23} />}
            가입
          </button>

          <button
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-base font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => changeMode('login')}
            type="button"
          >
            로그인으로 돌아가기
          </button>
        </form>
      )}
    </AuthGateShell>
  );
}
