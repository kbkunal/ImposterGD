import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivatePlayerRole } from '../../types/game';
import { Button } from '../ui/Button';
import { soundEngine } from '../../services/game/soundEngine';
import { Eye, Shield, Skull, Sparkles, Check, HelpCircle, Lock } from 'lucide-react';

export interface CardRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateRole: PrivatePlayerRole | null;
  onAcknowledgeViewed: () => void;
  category: string;
}

export const CardRevealModal: React.FC<CardRevealModalProps> = ({
  isOpen,
  onClose,
  privateRole,
  onAcknowledgeViewed,
  category,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleFlip = () => {
    soundEngine.playCardFlip();
    setIsFlipped(true);
  };

  const handleDone = () => {
    setHasAcknowledged(true);
    onAcknowledgeViewed();
    onClose();
  };

  if (!isOpen || !privateRole) return null;

  const isImposter = privateRole.role === 'IMPOSTER';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          {/* Header Title */}
          <div className="text-center mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-purple-400">
              {category}
            </span>
            <h3 className="text-2xl font-black text-white tracking-wide mt-0.5">
              Your Secret Identity
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Keep your screen tilted away from other players!
            </p>
          </div>

          {/* 3D Flipping Card Container */}
          <div className="w-72 sm:w-80 h-96 perspective-1000 my-2">
            <motion.div
              className="w-full h-full relative preserve-3d cursor-pointer select-none"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', damping: 20, stiffness: 100 }}
              onClick={!isFlipped ? handleFlip : undefined}
            >
              {/* FACE DOWN (Before Reveal) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-[#1A2242] to-[#0A0D1A] border-2 border-purple-500/40 shadow-2xl p-6 flex flex-col items-center justify-between text-center overflow-hidden">
                {/* Decorative card pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#8B5CF6_1px,transparent_1px)] [background-size:14px_14px] opacity-15" />
                <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-400/20 flex items-center justify-center text-purple-400">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[#11172E] border border-purple-500/30 flex items-center justify-center shadow-inner">
                    <HelpCircle className="w-10 h-10 text-purple-400 animate-pulse" />
                  </div>
                  <h4 className="text-lg font-black text-white">Confidential Card</h4>
                  <p className="text-xs text-slate-400 px-4">
                    Tap anywhere on this card or click the button below to inspect your secret assignment.
                  </p>
                </div>

                <div className="relative z-10 text-[10px] font-bold text-purple-300 uppercase tracking-wider bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
                  Tap to Reveal
                </div>
              </div>

              {/* FACE UP (Revealed Role) */}
              <div
                className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-2xl border-2 overflow-hidden ${
                  isImposter
                    ? 'bg-gradient-to-br from-[#2A0E1A] via-[#1A0A13] to-[#0D0509] border-rose-500/60 shadow-rose-950/70'
                    : 'bg-gradient-to-br from-[#0B2136] via-[#0E1B2E] to-[#070E1A] border-cyan-500/60 shadow-cyan-950/70'
                }`}
              >
                {/* Background radial glow */}
                <div
                  className={`absolute top-0 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                    isImposter ? 'bg-rose-600/25' : 'bg-cyan-600/25'
                  }`}
                />

                {/* Role Header Badge */}
                <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border">
                  {isImposter ? (
                    <span className="text-rose-400 border-rose-500/30 bg-rose-950/60 flex items-center gap-1 px-2.5 py-0.5 rounded-full">
                      <Skull className="w-3.5 h-3.5" />
                      Role: Imposter
                    </span>
                  ) : (
                    <span className="text-cyan-400 border-cyan-500/30 bg-cyan-950/60 flex items-center gap-1 px-2.5 py-0.5 rounded-full">
                      <Shield className="w-3.5 h-3.5" />
                      Role: Normal Player
                    </span>
                  )}
                </div>

                {/* Secret Word or Hint Display */}
                <div className="relative z-10 w-full space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isImposter ? 'Your One-Word Hint' : 'The Secret Word'}
                  </span>

                  <div
                    className={`py-4 px-3 rounded-2xl border ${
                      isImposter
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    <h2 className="text-3xl sm:text-4xl font-black tracking-wider uppercase drop-shadow">
                      {isImposter
                        ? privateRole.private_hint || 'NO HINT'
                        : privateRole.secret_word || 'UNKNOWN'}
                    </h2>
                  </div>

                  {/* Role Instructions */}
                  <div className="text-xs text-slate-300 px-2 pt-1">
                    {isImposter ? (
                      <p className="text-rose-300 font-semibold">
                        Blend in! Normal players share a different secret word. Use your hint and their clues to pretend you know it!
                      </p>
                    ) : (
                      <p className="text-cyan-300 font-semibold">
                        Give clever clues about the secret word without making it too obvious for the listening Imposter!
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Category Info */}
                <div className="relative z-10 text-[11px] font-semibold text-slate-400">
                  Category: <span className="text-white font-bold">{category}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Button */}
          <div className="mt-5 w-full flex justify-center">
            {!isFlipped ? (
              <Button
                variant="primary"
                size="lg"
                icon={<Eye className="w-4 h-4" />}
                onClick={handleFlip}
                fullWidth
              >
                Reveal My Card
              </Button>
            ) : (
              <Button
                variant="success"
                size="lg"
                icon={<Check className="w-4 h-4" />}
                onClick={handleDone}
                fullWidth
              >
                I've Seen My Card
              </Button>
            )}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
