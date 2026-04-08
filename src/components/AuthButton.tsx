import { signInWithPopup, signInWithRedirect, signOut, getRedirectResult } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useEffect, useState } from 'react';

interface Props {
  user: User | null;
  syncing: boolean;
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function AuthButton({ user, syncing }: Props) {
  const [loggingIn, setLoggingIn] = useState(false);

  // Handle redirect result on page load (for mobile)
  useEffect(() => {
    getRedirectResult(auth).catch(e => {
      console.error('Redirect result error:', e);
    });
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      if (isMobile()) {
        // Redirect works better on mobile browsers
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e) {
      console.error('Login failed:', e);
      // Fallback: try redirect if popup fails
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (e2) {
        console.error('Redirect also failed:', e2);
      }
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {syncing && (
          <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" title="Syncing..." />
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors"
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center text-xs text-soviet-900 font-bold">
              {user.displayName?.[0] || '?'}
            </span>
          )}
          <span>{user.displayName?.split(' ')[0] || 'Eingeloggt'}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loggingIn}
      className="px-3 py-1.5 text-sm text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors border border-gold-500/30 hover:border-gold-500 disabled:opacity-50"
    >
      {loggingIn ? 'Laden...' : 'Anmelden'}
    </button>
  );
}
