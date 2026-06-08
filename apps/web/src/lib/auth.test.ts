import { describe, expect, it } from 'vitest';
import { loginIdToAuthEmail, normalizeLoginId, validateLoginId, validatePassword, validateSignupCode } from './auth';

describe('auth helpers', () => {
  it('normalizes login IDs for username-style Supabase auth', () => {
    expect(normalizeLoginId(' Agent_99 ')).toBe('agent_99');
    expect(loginIdToAuthEmail(' Agent_99 ')).toBe('agent_99@mffdatahub.com');
  });

  it('validates login ID and password rules used by signup and login', () => {
    expect(validateLoginId('agent-99')).toBeNull();
    expect(validateLoginId('ab')).toContain('3~32자');
    expect(validateLoginId('_agent')).toContain('영문/숫자로 시작');
    expect(validatePassword('123456')).toBeNull();
    expect(validatePassword('12345')).toContain('6자 이상');
  });

  it('requires the configured signup code before Supabase signup', () => {
    expect(validateSignupCode('3013')).toBeNull();
    expect(validateSignupCode(' 3013 ')).toBeNull();
    expect(validateSignupCode('0000')).toContain('회원가입 코드');
  });
});
