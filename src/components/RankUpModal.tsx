import type { Rank } from '../data/ranks';

interface Props {
  rank: Rank;
  onClose: () => void;
}

export default function RankUpModal({ rank, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-soviet-900 border-2 border-gold-500 rounded-lg p-8 max-w-sm mx-4 text-center space-y-4 shadow-[0_0_40px_rgba(212,160,23,0.3)] animate-[scaleIn_0.3s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl animate-bounce">{rank.icon}</div>
        <h2 className="font-['Oswald'] text-2xl font-bold text-gold-400 uppercase tracking-wider">
          Befoerderung!
        </h2>
        <p className="text-soviet-200">
          Du bist jetzt
        </p>
        <div className="py-2">
          <p className="font-['Oswald'] text-3xl font-bold text-gold-400 uppercase">{rank.name}</p>
          <p className="text-lg text-soviet-300 mt-1">{rank.nameRu}</p>
        </div>
        <p className="text-sm text-soviet-400">Weiter so, Genosse!</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500 mt-4"
        >
          Weitermachen
        </button>
      </div>
    </div>
  );
}
