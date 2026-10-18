import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldAlert, User, Lock, UserPlus, Sparkles } from 'lucide-react';

export interface SignUpPageProps {
  onNavigate: (page: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setFormError('Please enter a username');
      return;
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setFormError('Username must be between 3 and 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setFormError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const res = await signUp(cleanUsername, password, displayName.trim() || cleanUsername);
    if (res.success) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11162B] border border-purple-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Brand Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 p-0.5 shadow-lg shadow-purple-600/40">
          <div className="w-full h-full bg-[#080B14] rounded-[14px] flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-purple-400" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-wide">Create Player Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pick your unique username to join round tables worldwide
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Username (Unique ID)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. MysteryMaster_07"
            leftIcon={<User className="w-4 h-4" />}
            helperText="3-20 letters, numbers, or underscores"
            autoFocus
          />

          <Input
            label="Display Name (Shown at Table)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sherlock (optional)"
            leftIcon={<Sparkles className="w-4 h-4" />}
            helperText="Defaults to your username if left empty"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            showPasswordToggle
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            leftIcon={<Lock className="w-4 h-4" />}
            showPasswordToggle
          />

          {(formError || error) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium text-center">
              {formError || error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<UserPlus className="w-4 h-4" />}
            isLoading={isLoading}
            fullWidth
          >
            Create Player Profile
          </Button>
        </form>

        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};
