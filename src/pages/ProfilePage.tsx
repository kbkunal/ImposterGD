import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AvatarSelectorModal } from '../components/profile/AvatarSelectorModal';
import {
  User,
  Trophy,
  ShieldAlert,
  Flame,
  Award,
  Edit3,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useAuthStore();
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(user?.status_message || '');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) return null;

  const totalMatches = user.total_matches || 0;
  const wins = user.wins || 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStatus(true);
    await updateProfile({ status_message: statusMessage.trim() });
    setIsSavingStatus(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveCustomization = async (data: {
    avatarId: string;
    avatarBackground: string;
    displayName: string;
    avatarUrl?: string;
  }) => {
    await updateProfile({
      avatar_id: data.avatarId,
      avatar_background: data.avatarBackground,
      display_name: data.displayName,
      avatar_url: data.avatarUrl,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Header Profile Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#171536] via-[#11162C] to-[#0A0D1A] rounded-3xl border border-purple-500/30 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar with edit button */}
        <div className="relative group">
          <Avatar
            avatarId={user.avatar_id}
            avatarBackground={user.avatar_background}
            avatarUrl={user.avatar_url}
            size="2xl"
            className="shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="absolute bottom-1 right-1 bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-full shadow-lg border-2 border-[#11162C] transition-transform hover:scale-110"
            title="Change Avatar & Color"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                Official Player Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{user.display_name}</h2>
              <span className="text-xs text-slate-400 font-mono">@{user.username}</span>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setIsCustomizeModalOpen(true)}
            >
              Customize Character
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 italic pt-1">
            "{user.status_message || 'Ready to deduce the imposter!'}"
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
              <Calendar className="w-3 h-3 text-purple-400" /> Member since {new Date(user.created_at).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
              <Sparkles className="w-3 h-3 text-amber-400" /> {user.total_points} Career Points
            </span>
          </div>
        </div>
      </div>

      {/* Career Statistics Badges */}
      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-white">
          Game Night Career Statistics
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#10162B] border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 block uppercase">Total Matches</span>
            <span className="text-2xl font-black text-white block">{totalMatches}</span>
          </div>

          <div className="bg-[#10162B] border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1 shadow-lg">
            <span className="text-xs font-semibold text-emerald-400 block uppercase">Total Wins</span>
            <span className="text-2xl font-black text-emerald-400 block">{wins}</span>
          </div>

          <div className="bg-[#10162B] border border-rose-500/30 rounded-2xl p-4 text-center space-y-1 shadow-lg">
            <span className="text-xs font-semibold text-rose-400 block uppercase">Imposter Wins</span>
            <span className="text-2xl font-black text-rose-400 block">{user.imposter_wins || 0}</span>
          </div>

          <div className="bg-[#10162B] border border-amber-500/30 rounded-2xl p-4 text-center space-y-1 shadow-lg">
            <span className="text-xs font-semibold text-amber-400 block uppercase">Win Rate</span>
            <span className="text-2xl font-black text-amber-400 block">{winRate}%</span>
          </div>
        </div>
      </div>

      {/* Status Message Update Form */}
      <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-white">
          Update Party Status Message
        </h4>
        <form onSubmit={handleSaveStatus} className="flex flex-col sm:flex-row gap-3">
          <Input
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="e.g. Master of deception, never votes blindly!"
            maxLength={60}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="secondary"
            isLoading={isSavingStatus}
            icon={savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : undefined}
          >
            {savedSuccess ? 'Saved!' : 'Save Status'}
          </Button>
        </form>
      </div>

      {/* Character Customization Modal */}
      <AvatarSelectorModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentAvatarId={user.avatar_id}
        currentBackground={user.avatar_background}
        currentDisplayName={user.display_name}
        currentAvatarUrl={user.avatar_url}
        onSave={handleSaveCustomization}
      />
    </div>
  );
};
