import { signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useState } from 'react';

interface Props {
  user: User | null;
  syncing: boolean;
}

export default function AuthButton({ user, syncing }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('Login error:', err.code, err.message);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.code || 'Fehler');
      }
    } finally {
      setLoading(false);
    }
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
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="px-3 py-1.5 text-sm text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors border border-gold-500/30 hover:border-gold-500 disabled:opacity-50"
      >
        {loading ? 'Laden...' : 'Anmelden'}
      </button>
      {error && (
        <span className="text-xs text-soviet-400">{error}</span>
      )}
    </div>
  );
}
