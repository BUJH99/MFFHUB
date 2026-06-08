import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AccountRole = 'admin' | 'user';

export type AppProfile = {
  userId: string;
  loginId: string;
  nickname: string;
  role: AccountRole;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ProfileRow = {
  user_id?: string | null;
  login_id?: string | null;
  nickname?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const authEmailDomain = (process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? 'mffdatahub.com')
  .replace(/^@/, '')
  .toLowerCase();
const signupCode = process.env.NEXT_PUBLIC_SIGNUP_CODE ?? '3013';
const loginIdPattern = /^[a-z0-9][a-z0-9_-]{2,31}$/;
const profileColumns = 'user_id, login_id, nickname, role, avatar_url, created_at, updated_at';

function normalizeRole(role: unknown): AccountRole {
  return role === 'admin' ? 'admin' : 'user';
}

export function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

export function validateLoginId(loginId: string) {
  const normalized = normalizeLoginId(loginId);
  if (!loginIdPattern.test(normalized)) {
    return '아이디는 영문/숫자로 시작하고 3~32자 영문, 숫자, _, - 만 사용할 수 있습니다.';
  }
  return null;
}

export function validatePassword(password: string) {
  if (password.length < 6) return '비밀번호는 6자 이상이어야 합니다.';
  return null;
}

export function validateSignupCode(code: string) {
  if (code.trim() !== signupCode) return '회원가입 코드를 확인해주세요.';
  return null;
}

export function loginIdToAuthEmail(loginId: string) {
  return `${normalizeLoginId(loginId)}@${authEmailDomain}`;
}

export function createProfileFallback(user: User): AppProfile {
  const loginId = normalizeLoginId(String(user.user_metadata?.login_id ?? user.email?.split('@')[0] ?? 'agent'));
  const nickname = String(user.user_metadata?.nickname ?? loginId);

  return {
    userId: user.id,
    loginId,
    nickname,
    role: 'user',
    avatarUrl: null,
    createdAt: null,
    updatedAt: null,
  };
}

function normalizeProfileRow(row: ProfileRow): AppProfile {
  return {
    userId: row.user_id ?? '',
    loginId: row.login_id ?? '',
    nickname: row.nickname ?? row.login_id ?? 'Agent',
    role: normalizeRole(row.role),
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export async function readAppProfile(userId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('app_profiles')
    .select(profileColumns)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeProfileRow(data as ProfileRow) : null;
}

export async function ensureAppProfile(user: User) {
  const existing = await readAppProfile(user.id);
  if (existing) return existing;
  if (!supabase) return createProfileFallback(user);

  const fallback = createProfileFallback(user);
  const { data, error } = await supabase
    .from('app_profiles')
    .insert({
      user_id: fallback.userId,
      login_id: fallback.loginId,
      nickname: fallback.nickname,
      role: 'user',
    })
    .select(profileColumns)
    .single();

  if (error) throw error;
  return normalizeProfileRow(data as ProfileRow);
}

export async function updateAppProfile(userId: string, nickname: string) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('app_profiles')
    .update({ nickname: nickname.trim(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select(profileColumns)
    .single();

  if (error) throw error;
  return normalizeProfileRow(data as ProfileRow);
}
