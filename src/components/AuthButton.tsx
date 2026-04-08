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

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('Login error:', err.code, err.message);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blockiert - bitte Popup-Blocker deaktivieren');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed it, no error needed
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain nicht autorisiert - Firebase Einstellungen pruefen');
      } else {
        setError('Login fehlgeschlagen: ' + (err.code || err.message || 'Unbekannter Fehler'));
      }
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
    <div className="flex items-center gap-2">
      <button
        onClick={handleLogin}
        className="px-3 py-1.5 text-sm text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors border border-gold-500/30 hover:border-gold-500"
      >
        Anmelden
      </button>
      {error && (
        <span className="text-xs text-soviet-400 max-w-[200px]">{error}</span>
      )}
    </div>
  );
}
