import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldAlert, User, Lock, LogIn, Sparkles } from 'lucide-react';

export interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, signUp, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!username.trim()) {
      setFormError('Please enter your username');
      return;
    }
    if (!password) {
      setFormError('Please enter your password');
      return;
    }

    const res = await login(username.trim(), password);
    if (res.success) {
      onNavigate('dashboard');
    }
  };

  // Quick Demo Player generator for easy multiplayer testing across multiple tabs
  const handleQuickDemoLogin = async () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const demoUsername = `Player_${randomSuffix}`;
    const demoPassword = 'Password123!';

    const res = await signUp(demoUsername, demoPassword, `Player ${randomSuffix}`);
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
          <h2 className="text-2xl font-black text-white tracking-wide">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">
            Log in to rejoin your party table and track your stats
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            leftIcon={<User className="w-4 h-4" />}
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
            icon={<LogIn className="w-4 h-4" />}
            isLoading={isLoading}
            fullWidth
          >
            Log In to Game
          </Button>
        </form>

        {/* Quick Demo Login Option for instant testing */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-xs font-bold text-purple-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Test Guest Login (1-Click)
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};
