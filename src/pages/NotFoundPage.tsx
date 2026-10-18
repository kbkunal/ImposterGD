import React from 'react';
import { Button } from '../components/ui/Button';
import { Home, ShieldAlert } from 'lucide-react';

export interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-4xl font-black text-white">404 — Table Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm">
        Looks like this room doesn't exist or has already wrapped up!
      </p>
      <Button
        variant="primary"
        icon={<Home className="w-4 h-4" />}
        onClick={() => onNavigate('dashboard')}
      >
        Return to Lobby
      </Button>
    </div>
  );
};
