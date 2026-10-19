import { supabase, isSupabaseConfigured } from '../supabase/client';
import { UserProfile } from '../../types/game';

const SESSION_STORAGE_USER_KEY = 'imposter_active_user';
const LOCAL_STORAGE_USER_KEY = 'imposter_user_session';
const LOCAL_STORAGE_USERS_DB_KEY = 'imposter_local_users_db';
const RATE_LIMIT_KEY = 'imposter_login_attempts';

interface LoginAttemptTracker {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

/**
 * Validates username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }
  const clean = username.trim();
  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (clean.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

/**
 * Validates password format
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

/**
 * Checks rate limiting for login attempts
 */
function checkRateLimit(username: string): { allowed: boolean; waitSeconds?: number } {
  try {
    const raw = sessionStorage.getItem(`${RATE_LIMIT_KEY}_${username.toLowerCase()}`);
    if (!raw) return { allowed: true };

    const tracker: LoginAttemptTracker = JSON.parse(raw);
    const now = Date.now();

    if (tracker.blockedUntil && tracker.blockedUntil > now) {
      const waitSeconds = Math.ceil((tracker.blockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }

    if (now - tracker.lastAttempt > 120000) {
      sessionStorage.removeItem(`${RATE_LIMIT_KEY}_${username.toLowerCase()}`);
      return { allowed: true };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

function recordFailedLogin(username: string) {
  try {
    const key = `${RATE_LIMIT_KEY}_${username.toLowerCase()}`;
    const raw = sessionStorage.getItem(key);
    const now = Date.now();
    let tracker: LoginAttemptTracker = raw ? JSON.parse(raw) : { count: 0, lastAttempt: now };

    tracker.count += 1;
    tracker.lastAttempt = now;

    if (tracker.count >= 5) {
      tracker.blockedUntil = now + 60000;
    }

    sessionStorage.setItem(key, JSON.stringify(tracker));
  } catch {
    // ignore
  }
}

function clearRateLimit(username: string) {
  try {
    sessionStorage.removeItem(`${RATE_LIMIT_KEY}_${username.toLowerCase()}`);
  } catch {
    // ignore
  }
}

/**
 * Hash password locally for offline fallback mode (using Web Crypto API SHA-256)
 */
async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'imposter_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return btoa(password);
}

function usernameToInternalEmail(username: string): string {
  const sanitized = encodeURIComponent(username.trim().toLowerCase());
  return `${sanitized}@identity.impostergd.internal`;
}

export const authService = {
  /**
   * Check if a username is already taken
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    const cleanUsername = username.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username uniqueness:', error);
      }
      return Boolean(data);
    }

    // Check central API server first
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(cleanUsername)}`);
      if (res.ok) {
        const json = await res.json();
        const found = (json.users || []).some(
          (u: any) => u.username.toLowerCase() === cleanUsername
        );
        if (found) return true;
      }
    } catch {
      // fallback to localStorage
    }

    const rawDb = localStorage.getItem(LOCAL_STORAGE_USERS_DB_KEY);
    if (!rawDb) return false;
    try {
      const db: Record<string, { username: string }> = JSON.parse(rawDb);
      return Object.values(db).some(u => u.username.toLowerCase() === cleanUsername);
    } catch {
      return false;
    }
  },

  /**
   * Register a new player with username and password
   */
  async signUp(username: string, password: string, displayName?: string): Promise<{ user: UserProfile | null; error?: string }> {
    const userVal = validateUsername(username);
    if (!userVal.valid) return { user: null, error: userVal.error };

    const passVal = validatePassword(password);
    if (!passVal.valid) return { user: null, error: passVal.error };

    const cleanUsername = username.trim();
    const taken = await this.isUsernameTaken(cleanUsername);
    if (taken) {
      return { user: null, error: 'Username is already taken. Please choose another one.' };
    }

    const cleanDisplayName = displayName?.trim() || cleanUsername;
    const internalEmail = usernameToInternalEmail(cleanUsername);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: internalEmail,
        password: password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
            avatar_id: 'detective',
            avatar_background: '#8B5CF6',
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Registration failed. Please try again.' };
      }

      const profile: UserProfile = {
        id: data.user.id,
        username: cleanUsername,
        display_name: cleanDisplayName,
        avatar_id: 'detective',
        avatar_background: '#8B5CF6',
        total_matches: 0,
        wins: 0,
        losses: 0,
        imposter_wins: 0,
        total_points: 0,
        is_online: true,
        created_at: new Date().toISOString(),
      };

      sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(profile));
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return { user: profile };
    }

    // Try central server API
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password, displayName: cleanDisplayName }),
      });

      if (res.ok) {
        const json = await res.json();
        const profile = json.user as UserProfile;
        sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(profile));
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        return { user: profile };
      } else {
        const json = await res.json();
        if (json.error) return { user: null, error: json.error };
      }
    } catch {
      // fallback to local storage
    }

    const hashedPassword = await hashPassword(password);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const profile: UserProfile = {
      id: userId,
      username: cleanUsername,
      display_name: cleanDisplayName,
      avatar_id: 'detective',
      avatar_background: '#8B5CF6',
      status_message: 'Ready for deception!',
      total_matches: 0,
      wins: 0,
      losses: 0,
      imposter_wins: 0,
      total_points: 0,
      is_online: true,
      created_at: new Date().toISOString(),
    };

    const rawDb = localStorage.getItem(LOCAL_STORAGE_USERS_DB_KEY);
    const db = rawDb ? JSON.parse(rawDb) : {};
    db[cleanUsername.toLowerCase()] = {
      ...profile,
      passwordHash: hashedPassword,
    };
    localStorage.setItem(LOCAL_STORAGE_USERS_DB_KEY, JSON.stringify(db));
    sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(profile));
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));

    return { user: profile };
  },

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<{ user: UserProfile | null; error?: string }> {
    const userVal = validateUsername(username);
    if (!userVal.valid) return { user: null, error: userVal.error };

    const passVal = validatePassword(password);
    if (!passVal.valid) return { user: null, error: passVal.error };

    const cleanUsername = username.trim();
    const rateCheck = checkRateLimit(cleanUsername);
    if (!rateCheck.allowed) {
      return {
        user: null,
        error: `Too many failed attempts. Please wait ${rateCheck.waitSeconds}s before trying again.`,
      };
    }

    const internalEmail = usernameToInternalEmail(cleanUsername);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: password,
      });

      if (error) {
        recordFailedLogin(cleanUsername);
        return { user: null, error: 'Invalid username or password' };
      }

      clearRateLimit(cleanUsername);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const profile: UserProfile = profileData || {
        id: data.user.id,
        username: cleanUsername,
        display_name: data.user.user_metadata?.display_name || cleanUsername,
        avatar_id: data.user.user_metadata?.avatar_id || 'detective',
        avatar_background: data.user.user_metadata?.avatar_background || '#8B5CF6',
        total_matches: 0,
        wins: 0,
        losses: 0,
        imposter_wins: 0,
        total_points: 0,
        is_online: true,
        created_at: new Date().toISOString(),
      };

      sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(profile));
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return { user: profile };
    }

    // Try central server API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      if (res.ok) {
        clearRateLimit(cleanUsername);
        const json = await res.json();
        const profile = json.user as UserProfile;
        sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(profile));
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        return { user: profile };
      } else {
        recordFailedLogin(cleanUsername);
        return { user: null, error: 'Invalid username or password' };
      }
    } catch {
      // fallback to localStorage
    }

    const rawDb = localStorage.getItem(LOCAL_STORAGE_USERS_DB_KEY);
    const db = rawDb ? JSON.parse(rawDb) : {};
    const existing = db[cleanUsername.toLowerCase()];

    if (!existing) {
      recordFailedLogin(cleanUsername);
      return { user: null, error: 'Invalid username or password' };
    }

    const hashedPassword = await hashPassword(password);
    if (existing.passwordHash !== hashedPassword) {
      recordFailedLogin(cleanUsername);
      return { user: null, error: 'Invalid username or password' };
    }

    clearRateLimit(cleanUsername);

    const { passwordHash: _, ...profile } = existing;
    profile.is_online = true;
    sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(profile));
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    return { user: profile as UserProfile };
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    // 1. Check current tab's sessionStorage first (allows distinct logins across tabs)
    const sessionCached = sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
    if (sessionCached) {
      try {
        return JSON.parse(sessionCached) as UserProfile;
      } catch {
        // ignore
      }
    }

    // 2. Check localStorage
    const localCached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached) as UserProfile;
        sessionStorage.setItem(SESSION_STORAGE_USER_KEY, localCached);
        return parsed;
      } catch {
        // ignore
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();

      if (profile) return profile as UserProfile;
    }

    return null;
  },

  /**
   * Update player profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = await this.getCurrentUser();
    if (!current) return null;

    const updatedProfile: UserProfile = {
      ...current,
      ...updates,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('profiles')
        .update({
          display_name: updatedProfile.display_name,
          avatar_id: updatedProfile.avatar_id,
          avatar_background: updatedProfile.avatar_background,
          avatar_url: updatedProfile.avatar_url,
          status_message: updatedProfile.status_message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id);
    } else {
      try {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: current.id, updates }),
        });
      } catch {
        // ignore
      }
    }

    sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(updatedProfile));
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedProfile));

    const rawDb = localStorage.getItem(LOCAL_STORAGE_USERS_DB_KEY);
    if (rawDb) {
      try {
        const db = JSON.parse(rawDb);
        if (db[current.username.toLowerCase()]) {
          db[current.username.toLowerCase()] = {
            ...db[current.username.toLowerCase()],
            ...updatedProfile,
          };
          localStorage.setItem(LOCAL_STORAGE_USERS_DB_KEY, JSON.stringify(db));
        }
      } catch {
        // ignore
      }
    }

    return updatedProfile;
  },

  /**
   * Log out
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  },
};
