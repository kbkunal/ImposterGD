import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import {
  ShieldAlert,
  Play,
  HelpCircle,
  Users,
  Eye,
  MessageSquare,
  Sparkles,
  Award,
  Lock,
  ArrowRight,
} from 'lucide-react';

export interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-purple-900/25 via-indigo-900/20 to-rose-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-8 text-center space-y-6">
        {/* Game Tag Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          The Ultimate Social Deduction Party Game
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight">
          WHO'S THE <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-400 to-cyan-400">
            IMPOSTER?
          </span>
        </h1>

        {/* Memorable Tagline */}
        <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-medium leading-relaxed">
          Gather around the virtual table with friends. One player is bluffing with a secret hint, while everyone else knows the word. Can you uncover the imposter before they blend in?
        </p>

        {/* Two Separate Game Modes Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-4 text-left">
          {/* Online Multiplayer */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C1636] to-[#100E26] border-2 border-purple-500/40 hover:border-purple-400 transition-all shadow-xl cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/30 text-purple-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors">
                Online Multiplayer
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Play across separate devices with a 6-letter room code. Private cards distributed automatically by the server.
              </p>
            </div>
            <Button size="md" variant="primary" icon={<Play className="w-4 h-4 fill-current" />} fullWidth>
              Play Online
            </Button>
          </div>

          {/* Offline Pass-and-Play */}
          <div
            onClick={() => onNavigate('offline-setup')}
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0F2236] to-[#0A1624] border-2 border-cyan-500/40 hover:border-cyan-400 transition-all shadow-xl cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600/30 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                Offline Pass & Play
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gather around one phone, tablet, or laptop. No login or internet required. Confidential card handover built-in.
              </p>
            </div>
            <Button size="md" variant="secondary" icon={<ArrowRight className="w-4 h-4" />} fullWidth>
              Play Pass & Play (No Login)
            </Button>
          </div>
        </div>

        {/* How to play trigger */}
        <div className="pt-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<HelpCircle className="w-4 h-4" />}
            onClick={() => setShowHowToPlay(true)}
            className="text-slate-400 hover:text-white"
          >
            How to Play Rules & Instructions
          </Button>
        </div>

        {/* Animated Virtual Round Table Preview */}
        <div className="relative pt-12 pb-6 flex justify-center">
          <div className="relative w-full max-w-2xl h-72 sm:h-80 bg-radial from-[#151D36] via-[#0E1326] to-[#080B14] rounded-full border-4 border-[#1E2748] shadow-2xl flex items-center justify-center table-glow overflow-hidden">
            {/* Center table neon hub */}
            <div className="w-36 h-36 rounded-full bg-[#11172E] border border-purple-500/30 flex flex-col items-center justify-center p-3 text-center shadow-inner">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Secret Word</span>
              <span className="text-xl font-black text-white uppercase drop-shadow">APPLE</span>
              <span className="text-[9px] text-rose-400 font-bold mt-1">Imposter Hint: RED</span>
            </div>

            {/* Orbiting Sample Characters */}
            <div className="absolute top-4 left-1/4 -translate-x-1/2 flex flex-col items-center">
              <Avatar avatarId="detective" avatarBackground="#8B5CF6" size="md" />
              <span className="text-[11px] font-bold text-white mt-1">Alex</span>
            </div>
            <div className="absolute top-4 right-1/4 translate-x-1/2 flex flex-col items-center">
              <Avatar avatarId="astronaut" avatarBackground="#0EA5E9" size="md" />
              <span className="text-[11px] font-bold text-white mt-1">Jordan</span>
            </div>
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 flex flex-col items-center">
              <Avatar avatarId="fox" avatarBackground="#F43F5E" size="md" isSpeaking={true} />
              <span className="text-[11px] font-bold text-amber-300 mt-1">Sam (Bluffing?)</span>
            </div>
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 flex flex-col items-center">
              <Avatar avatarId="ninja" avatarBackground="#10B981" size="md" />
              <span className="text-[11px] font-bold text-white mt-1">Maya</span>
            </div>
            <div className="absolute bottom-4 left-1/3 -translate-x-1/2 flex flex-col items-center">
              <Avatar avatarId="robot" avatarBackground="#6366F1" size="md" />
              <span className="text-[11px] font-bold text-white mt-1">Liam</span>
            </div>
            <div className="absolute bottom-4 right-1/3 translate-x-1/2 flex flex-col items-center">
              <Avatar avatarId="wizard" avatarBackground="#F59E0B" size="md" />
              <span className="text-[11px] font-bold text-white mt-1">Zoe</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left relative z-10">
        <div className="p-5 rounded-2xl bg-[#10162B]/80 border border-slate-800 shadow-xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <h4 className="text-base font-extrabold text-white">Private Secret Roles</h4>
          <p className="text-xs text-slate-400">
            Server-authoritative encryption guarantees only you see your secret card on your personal device.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#10162B]/80 border border-slate-800 shadow-xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h4 className="text-base font-extrabold text-white">Clever Clues & Bluffing</h4>
          <p className="text-xs text-slate-400">
            Give subtle hints aloud or in text. Be vague enough to keep the imposter guessing, but clear enough for your crew!
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#10162B]/80 border border-slate-800 shadow-xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-base font-extrabold text-white">Real-Time Multiplayer</h4>
          <p className="text-xs text-slate-400">
            Play with friends across separate phones, tablets, or computers with instantaneous synchronized room states.
          </p>
        </div>
      </section>

      {/* How to Play Interactive Modal */}
      <Modal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        title="How to Play Who's the Imposter?"
        maxWidth="lg"
      >
        <div className="space-y-4 text-left text-xs sm:text-sm text-slate-300">
          <div className="p-4 bg-[#090D1A] rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <div>
                <strong className="text-white block font-bold">Secret Roles Assigned</strong>
                At the start of the round, one player is secretly chosen as the Imposter. Normal players receive the Secret Word (e.g., <span className="text-cyan-400 font-bold">APPLE</span>), while the Imposter receives only a related hint (e.g., <span className="text-rose-400 font-bold">RED</span>).
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <div>
                <strong className="text-white block font-bold">The Clue Phase</strong>
                Each player takes turns giving a subtle one-word clue or phrase. The Imposter must pretend they know the secret word using clues other players have given!
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <div>
                <strong className="text-white block font-bold">Discussion & Secret Voting</strong>
                The floor opens for discussion. Everyone casts a secret vote for the suspected Imposter.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                4
              </span>
              <div>
                <strong className="text-white block font-bold">Scoring & Last-Chance Guess</strong>
                If normal players catch the Imposter, they earn points. If the Imposter survives or guesses the secret word on their last-chance redemption, the Imposter takes the win!
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="md" onClick={() => { setShowHowToPlay(false); onNavigate('signup'); }}>
              Ready to Play →
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>© 2026 Who's the Imposter? • Built for game nights with friends</p>
      </footer>
    </div>
  );
};
