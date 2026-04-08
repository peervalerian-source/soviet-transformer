import { signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface Props {
  user: User | null;
  syncing: boolean;
}

export default function AuthButton({ user, syncing }: Props) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Login failed:', e);
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
            <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center text-xs text-soviet-900 font-bold">
              {user.displayName?.[0] || '?'}
            </span>
          )}
          <span className="hidden md:inline">{user.displayName?.split(' ')[0]}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-3 py-1.5 text-sm text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors border border-gold-500/30 hover:border-gold-500"
    >
      Anmelden
    </button>
  );
}
