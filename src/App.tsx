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
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { user, isLoading, initAuth } = useAuthStore();
  const { currentRoom, joinRoomByCode, subscribeToRoomEvents } = useGameStore();
  const [currentPage, setCurrentPage] = useState<string>('landing');

  // Initialize Auth on start
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Check URL query parameters for invite links (e.g., ?join=ABCD12)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && user) {
      joinRoomByCode(joinCode, user).then((ok) => {
        if (ok) {
          setCurrentPage('waiting-room');
          // clean url
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [user, joinRoomByCode]);

  // Update starting page once auth resolves
  useEffect(() => {
    if (!isLoading) {
      if (user && currentPage === 'landing') {
        setCurrentPage('dashboard');
      }
    }
  }, [isLoading, user]);

  // Subscribe to real-time room events whenever currentRoom changes
  useEffect(() => {
    if (currentRoom?.id && user?.id) {
      const unsubscribe = subscribeToRoomEvents(currentRoom.id, user.id);
      return () => unsubscribe();
    }
  }, [currentRoom?.id, user?.id, subscribeToRoomEvents]);

  const handleNavigate = (page: string) => {
    // Auth guards
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
        {!['landing', 'login', 'signup', 'dashboard', 'friends', 'profile', 'create-room', 'waiting-room', 'game', 'settings'].includes(currentPage) && (
          <NotFoundPage onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
}

export default App;
