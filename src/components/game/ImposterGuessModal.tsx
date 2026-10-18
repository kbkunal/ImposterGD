import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Skull, Key, Sparkles, Send } from 'lucide-react';

export interface ImposterGuessModalProps {
  isOpen: boolean;
  isImposter: boolean;
  category: string;
  imposterDisplayName?: string;
  onSubmitGuess: (guess: string) => Promise<boolean>;
  onSkip?: () => void;
}

export const ImposterGuessModal: React.FC<ImposterGuessModalProps> = ({
  isOpen,
  isImposter,
  category,
  imposterDisplayName = 'The Imposter',
  onSubmitGuess,
  onSkip,
}) => {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onSubmitGuess(guess.trim());
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Last Chance Redemption!"
      description={
        isImposter
          ? "You were discovered! But you can still win if you can guess the secret word."
          : `${imposterDisplayName} was caught! They are taking their final guess...`
      }
      maxWidth="md"
      showCloseButton={false}
    >
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
          <Skull className="w-8 h-8 animate-pulse" />
        </div>

        {isImposter ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300">
              Category: <span className="text-white font-bold">{category}</span>. Type the exact word you think everyone else received!
            </div>

            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your final guess (e.g. APPLE)..."
              leftIcon={<Key className="w-4 h-4" />}
              autoFocus
            />

            <div className="flex gap-2">
              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  disabled={isSubmitting}
                >
                  Give Up
                </Button>
              )}
              <Button
                type="submit"
                variant="danger"
                size="lg"
                icon={<Send className="w-4 h-4" />}
                isLoading={isSubmitting}
                disabled={!guess.trim()}
                fullWidth
              >
                Submit Final Guess
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-6 space-y-3">
            <div className="flex justify-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce"></span>
            </div>
            <p className="text-sm font-bold text-slate-300">
              Holding our breath... Will {imposterDisplayName} figure out the secret word?
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
