// Simple Web Audio API utility for game sound effects

let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playEatSound = () => {
  playTone(600, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(800, 'sine', 0.1, 0.1), 50);
};

export const playJumpSound = () => {
  playTone(400, 'square', 0.1, 0.05);
};

export const playGameOverSound = () => {
  playTone(200, 'sawtooth', 0.3, 0.2);
  setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.2), 200);
};

export const playPopSound = () => {
  playTone(800, 'triangle', 0.05, 0.05);
};

export const playMergeSound = () => {
  playTone(300, 'sine', 0.15, 0.1);
};
