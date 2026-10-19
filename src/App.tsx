import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useGameStore } from './stores/useGameStore';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { GamePage } from './pages/GamePage';
import { SettingsPage } from './pages/SettingsPage';
import { OfflineSetupPage } from './pages/OfflineSetupPage';
import { OfflineGamePage } from './pages/OfflineGamePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { user, isLoading, initAuth } = useAuthStore();
  const { currentRoom, currentRound, joinRoomByCode, subscribeToRoomEvents } = useGameStore();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // Initialize Auth on start
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Check URL query parameters for invite links (e.g., ?join=ABCD12) & persist in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join') || sessionStorage.getItem('pending_join_code');

    if (joinCode) {
      const clean = joinCode.trim().toUpperCase();
      sessionStorage.setItem('pending_join_code', clean);
      setPendingCode(clean);

      if (user) {
        sessionStorage.removeItem('pending_join_code');
        setPendingCode(null);
        joinRoomByCode(clean, user).then((ok) => {
          if (ok) {
            setCurrentPage('waiting-room');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
      } else {
        // If not logged in, direct to login
        setCurrentPage('login');
      }
    }
  }, [user, joinRoomByCode]);

  // Update starting page once auth resolves
  useEffect(() => {
    if (!isLoading) {
      if (user && currentPage === 'landing') {
        const storedJoin = sessionStorage.getItem('pending_join_code');
        if (storedJoin) {
          sessionStorage.removeItem('pending_join_code');
          setPendingCode(null);
          joinRoomByCode(storedJoin, user).then((ok) => {
            if (ok) {
              setCurrentPage('waiting-room');
            } else {
              setCurrentPage('dashboard');
            }
          });
        } else {
          setCurrentPage('dashboard');
        }
      }
    }
  }, [isLoading, user, currentPage, joinRoomByCode]);

  // Subscribe to real-time room events whenever currentRoom changes
  useEffect(() => {
    if (currentRoom?.id && user?.id) {
      const unsubscribe = subscribeToRoomEvents(currentRoom.id, user.id);
      return () => unsubscribe();
    }
  }, [currentRoom?.id, user?.id, subscribeToRoomEvents]);

  // Auto-navigate all room players to 'game' when round starts
  useEffect(() => {
    if (
      currentRound &&
      ['DEALING_CARDS', 'CARD_REVEAL', 'CLUE_ROUND'].includes(currentRound.phase) &&
      currentPage === 'waiting-room'
    ) {
      setCurrentPage('game');
    }
  }, [currentRound?.id, currentRound?.phase, currentPage]);

  const handleNavigate = (page: string) => {
    // Auth guards (offline mode does not require auth!)
    const protectedPages = ['dashboard', 'friends', 'profile', 'create-room', 'waiting-room', 'game'];
    if (!user && protectedPages.includes(page)) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinCode = async (code: string) => {
    if (!user) {
      sessionStorage.setItem('pending_join_code', code.trim().toUpperCase());
      setCurrentPage('login');
      return false;
    }
    const ok = await joinRoomByCode(code, user);
    if (ok) {
      setCurrentPage('waiting-room');
    }
    return ok;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        <span className="text-sm font-bold text-slate-400">Loading Who's the Imposter...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 flex flex-col">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onAcceptGameInvite={(code) => handleJoinCode(code)}
      />

      {/* Invite Link Banner if player has pending invitation code */}
      {pendingCode && !user && (
        <div className="bg-gradient-to-r from-purple-900/90 to-rose-900/90 py-2.5 px-4 text-center text-xs font-bold text-white flex items-center justify-center gap-2 border-b border-purple-500/40">
          <span>🎮 You have been invited to join room <strong className="font-mono text-amber-300 text-sm">{pendingCode}</strong>! Log in or Sign Up below to take your seat!</span>
        </div>
      )}

      <main className="flex-1">
        {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentPage === 'signup' && <SignUpPage onNavigate={handleNavigate} />}
        {currentPage === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} onJoinRoomByCode={handleJoinCode} />
        )}
        {currentPage === 'friends' && <FriendsPage onNavigate={handleNavigate} />}
        {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
        {currentPage === 'create-room' && <CreateRoomPage onNavigate={handleNavigate} />}
        {currentPage === 'waiting-room' && <WaitingRoomPage onNavigate={handleNavigate} />}
        {currentPage === 'game' && <GamePage onNavigate={handleNavigate} />}
        {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
        {currentPage === 'offline-setup' && <OfflineSetupPage onNavigate={handleNavigate} />}
        {currentPage === 'offline-game' && <OfflineGamePage onNavigate={handleNavigate} />}
        {!['landing', 'login', 'signup', 'dashboard', 'friends', 'profile', 'create-room', 'waiting-room', 'game', 'settings', 'offline-setup', 'offline-game'].includes(currentPage) && (
          <NotFoundPage onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
}

export default App;
