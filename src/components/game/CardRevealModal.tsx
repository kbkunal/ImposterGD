import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivatePlayerRole } from '../../types/game';
import { cardService } from '../../services/game/cardService';
import { Button } from '../ui/Button';
import { soundEngine } from '../../services/game/soundEngine';
import { Eye, Shield, Skull, Check, HelpCircle, Lock, RotateCcw, AlertCircle } from 'lucide-react';

export interface CardRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateRole: PrivatePlayerRole | null;
  onAcknowledgeViewed: () => void;
  category: string;
  playerName?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const CardRevealModal: React.FC<CardRevealModalProps> = ({
  isOpen,
  onClose,
  privateRole,
  onAcknowledgeViewed,
  category,
  playerName = 'Player',
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    soundEngine.playCardFlip();
    setIsFlipped(true);
  };

  const handleDone = () => {
    setIsFlipped(false);
    onAcknowledgeViewed();
    onClose();
  };

  if (!isOpen) return null;

  const presentation = cardService.getPresentation(privateRole);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          {/* Header Title with Player Name */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider mb-2">
              <span>{category || 'Category'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {playerName}'s Card
            </h3>
            <p className="text-xs text-amber-300/90 font-medium mt-1 flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Tilt your screen away from other players! Keep it secret.
            </p>
          </div>

          {/* Loading or Error Fallback if privateRole is pending */}
          {isLoading && !privateRole && (
            <div className="w-72 sm:w-80 h-96 rounded-3xl bg-[#10162B] border-2 border-purple-500/30 flex flex-col items-center justify-center p-6 text-center space-y-4 my-2 shadow-2xl">
              <div className="w-14 h-14 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Retrieving Secret Card...</h4>
                <p className="text-xs text-slate-400">Securely loading your encrypted assignment from the game engine.</p>
              </div>
              {onRetry && (
                <Button size="sm" variant="secondary" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={onRetry}>
                  Retry Now
                </Button>
              )}
            </div>
          )}

          {error && !privateRole && (
            <div className="w-72 sm:w-80 h-96 rounded-3xl bg-rose-950/40 border-2 border-rose-500/50 flex flex-col items-center justify-center p-6 text-center space-y-4 my-2 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Card Not Yet Available</h4>
                <p className="text-xs text-rose-300/80">{error}</p>
              </div>
              {onRetry && (
                <Button size="md" variant="primary" icon={<RotateCcw className="w-4 h-4" />} onClick={onRetry}>
                  Retry Retrieving Card
                </Button>
              )}
            </div>
          )}

          {/* 3D Flipping Card Container when privateRole is available */}
          {privateRole && presentation && (
            <>
              <div className="w-72 sm:w-80 h-[400px] perspective-1000 my-2">
                <motion.div
                  className="w-full h-full relative preserve-3d cursor-pointer select-none"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', damping: 20, stiffness: 100 }}
                  onClick={!isFlipped ? handleFlip : undefined}
                >
                  {/* FACE DOWN (Before Reveal) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-[#1C1F38] via-[#12162B] to-[#0A0D1A] border-2 border-purple-500/50 shadow-2xl p-6 flex flex-col items-center justify-between text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#8B5CF6_1px,transparent_1px)] [background-size:14px_14px] opacity-15" />
                    
                    <div className="w-16 h-16 rounded-full bg-purple-600/15 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-lg">
                      <Lock className="w-8 h-8" />
                    </div>

                    <div className="relative z-10 space-y-2">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0F1428] border border-purple-500/40 flex items-center justify-center shadow-inner">
                        <HelpCircle className="w-10 h-10 text-purple-400 animate-pulse" />
                      </div>
                      <h4 className="text-xl font-black text-white uppercase tracking-wider">Top Secret Card</h4>
                      <p className="text-xs text-slate-300 px-2 leading-relaxed">
                        Tap anywhere on this card or press <strong>“Reveal My Card”</strong> below to view your secret role.
                      </p>
                    </div>

                    <div className="relative z-10 text-[11px] font-black text-purple-300 uppercase tracking-widest bg-purple-950/70 px-4 py-1.5 rounded-full border border-purple-500/40 shadow-sm animate-pulse">
                      Tap To Reveal
                    </div>
                  </div>

                  {/* FACE UP (Revealed Role) */}
                  <div
                    className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-2xl border-2 overflow-hidden ${
                      presentation.isImposter
                        ? 'bg-gradient-to-br from-[#300E1D] via-[#1F0A14] to-[#0D0509] border-rose-500 shadow-rose-950/80'
                        : 'bg-gradient-to-br from-[#0B253D] via-[#0D1D30] to-[#070F1A] border-cyan-500 shadow-cyan-950/80'
                    }`}
                  >
                    {/* Background radial glow */}
                    <div
                      className={`absolute top-0 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                        presentation.isImposter ? 'bg-rose-600/30' : 'bg-cyan-600/30'
                      }`}
                    />

                    {/* Prominent Role Header */}
                    <div className="relative z-10 w-full pt-1">
                      <div
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest border shadow-lg ${
                          presentation.isImposter
                            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                            : 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                        }`}
                      >
                        {presentation.isImposter ? <Skull className="w-4 h-4 text-rose-400" /> : <Shield className="w-4 h-4 text-cyan-400" />}
                        {presentation.roleTitle}
                      </div>
                    </div>

                    {/* Word / Hint Box */}
                    <div className="relative z-10 w-full space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                        {presentation.keywordLabel}
                      </span>

                      <div
                        className={`py-4 px-3 rounded-2xl border-2 shadow-inner ${
                          presentation.isImposter
                            ? 'bg-rose-950/50 border-rose-500/50 text-rose-100'
                            : 'bg-cyan-950/50 border-cyan-500/50 text-cyan-100'
                        }`}
                      >
                        <h2 className="text-3xl sm:text-4xl font-black tracking-widest uppercase drop-shadow-md">
                          {presentation.keywordValue}
                        </h2>
                      </div>

                      {/* Explicit gameplay instructions */}
                      <div
                        className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${
                          presentation.isImposter
                            ? 'bg-rose-900/30 border-rose-500/30 text-rose-200'
                            : 'bg-cyan-900/30 border-cyan-500/30 text-cyan-200'
                        }`}
                      >
                        <span className="block font-black uppercase text-[10px] tracking-wider mb-0.5 opacity-80">
                          Instruction
                        </span>
                        {presentation.instruction}
                      </div>
                    </div>

                    {/* Category footnote */}
                    <div className="relative z-10 text-[11px] font-semibold text-slate-400">
                      Category: <span className="text-white font-bold">{category}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 w-full flex justify-center">
                {!isFlipped ? (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<Eye className="w-5 h-5" />}
                    onClick={handleFlip}
                    fullWidth
                    className="text-base py-3.5 shadow-purple-600/50 font-black tracking-wide"
                  >
                    Reveal My Card
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="lg"
                    icon={<Check className="w-5 h-5" />}
                    onClick={handleDone}
                    fullWidth
                    className="text-base py-3.5 font-black tracking-wide shadow-emerald-600/50"
                  >
                    I've Seen My Card
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};
