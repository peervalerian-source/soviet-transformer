let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playCorrect() {
  playTone(523, 0.1, 'sine', 0.25);  // C5
  setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 80);  // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 160);  // G5
}

export function playWrong() {
  playTone(200, 0.2, 'square', 0.15);
  setTimeout(() => playTone(180, 0.25, 'square', 0.12), 120);
}

export function playMatch() {
  playTone(880, 0.08, 'sine', 0.2);  // A5
  setTimeout(() => playTone(1108, 0.15, 'sine', 0.18), 60);  // C#6
}

export function playComplete() {
  playTone(523, 0.12, 'sine', 0.25);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.25), 120);
  setTimeout(() => playTone(784, 0.12, 'sine', 0.25), 240);
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.2), 360);  // C6
}

/** Flash the screen green or red */
export function flashScreen(correct: boolean) {
  const el = document.getElementById('game-flash');
  if (!el) return;
  el.className = correct ? 'flash-correct' : 'flash-wrong';
  // Force reflow to restart animation
  void el.offsetWidth;
  el.className = correct ? 'flash-correct flash-active' : 'flash-wrong flash-active';
  setTimeout(() => { el.className = ''; }, 500);
}
