import { describe, it, expect, beforeEach } from 'vitest';
import { validateUsername, validatePassword, authService } from '../services/auth/authService';

describe('Authentication & Username Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('validates username lengths and character sets correctly', () => {
    expect(validateUsername('').valid).toBe(false);
    expect(validateUsername('ab').valid).toBe(false); // < 3 chars
    expect(validateUsername('valid_user123').valid).toBe(true);
    expect(validateUsername('user with space').valid).toBe(false);
    expect(validateUsername('a'.repeat(21)).valid).toBe(false); // > 20 chars
  });

  it('validates password minimum length requirement', () => {
    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword('12345').valid).toBe(false); // < 6 chars
    expect(validatePassword('123456').valid).toBe(true);
  });

  it('registers new user and protects against duplicate usernames case-insensitively', async () => {
    const signup1 = await authService.signUp('DetectiveHolmes', 'Password123!', 'Sherlock');
    expect(signup1.user).not.toBeNull();
    expect(signup1.user?.username).toBe('DetectiveHolmes');

    // Duplicate attempt with different casing
    const signup2 = await authService.signUp('detectiveholmes', 'DifferentPass123!');
    expect(signup2.user).toBeNull();
    expect(signup2.error).toContain('already taken');
  });

  it('successfully logs in with valid credentials and fails on wrong password', async () => {
    await authService.signUp('MasterMind', 'SecretPass123!');

    const successLogin = await authService.login('MasterMind', 'SecretPass123!');
    expect(successLogin.user).not.toBeNull();
    expect(successLogin.user?.username).toBe('MasterMind');

    const failLogin = await authService.login('MasterMind', 'WrongPass!');
    expect(failLogin.user).toBeNull();
    expect(failLogin.error).toContain('Invalid username or password');
  });

  it('allows updating player display name and avatar background', async () => {
    const signup = await authService.signUp('DrWatson', 'Password123!');
    expect(signup.user).not.toBeNull();

    const updated = await authService.updateProfile({
      display_name: 'John Watson, MD',
      avatar_id: 'ninja',
      avatar_background: '#F43F5E',
    });

    expect(updated).not.toBeNull();
    expect(updated?.display_name).toBe('John Watson, MD');
    expect(updated?.avatar_id).toBe('ninja');
    expect(updated?.avatar_background).toBe('#F43F5E');
  });
});
