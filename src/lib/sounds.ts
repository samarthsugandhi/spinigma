// Synthesized sound effects using Web Audio API — no external dependencies

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function playSpinSound() {
  const ctx = getCtx();
  const duration = 3.5;
  const now = ctx.currentTime;

  // Whooshing noise via filtered noise
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(800, now);
  bandpass.frequency.exponentialRampToValueAtTime(200, now + duration);
  bandpass.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0.08, now + duration * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(bandpass).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration);

  // Tick sounds that slow down
  const ticks = 20;
  for (let i = 0; i < ticks; i++) {
    const t = now + (i / ticks) * duration * 0.9;
    const delay = (i / ticks) * 0.15; // ticks slow down
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600 + Math.random() * 400;
    g.gain.setValueAtTime(0.12 * (1 - i / ticks), t + delay);
    g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.05);
    osc.connect(g).connect(ctx.destination);
    osc.start(t + delay);
    osc.stop(t + delay + 0.05);
  }
}

export function playCorrectSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Ascending triumphant arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const t = now + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });

  // Sparkle shimmer
  for (let i = 0; i < 6; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 2000 + Math.random() * 3000;
    const t = now + 0.3 + i * 0.06;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }
}

export function playWrongSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Descending buzz
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'square';
  osc1.frequency.setValueAtTime(300, now);
  osc1.frequency.exponentialRampToValueAtTime(150, now + 0.4);
  osc2.frequency.setValueAtTime(310, now);
  osc2.frequency.exponentialRampToValueAtTime(155, now + 0.4);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.5);
  osc2.stop(now + 0.5);

  // Second buzz hit
  const osc3 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc3.type = 'sawtooth';
  osc3.frequency.value = 180;
  g2.gain.setValueAtTime(0.1, now + 0.25);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc3.connect(filter);
  osc3.start(now + 0.25);
  osc3.stop(now + 0.6);
}

export function playSkipSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function playEntrySound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Dramatic rising whoosh + fanfare
  const notes = [261.63, 329.63, 392, 523.25, 659.25]; // C4 E4 G4 C5 E5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i < 3 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.1;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });

  // Shimmer
  for (let i = 0; i < 8; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1500 + Math.random() * 3000;
    const t = now + 0.4 + i * 0.04;
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export function playGameCompleteSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Victory fanfare
  const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]; // C5 E5 G5 C6 G5 C6
  fanfare.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.18;
    const dur = i === fanfare.length - 1 ? 0.8 : 0.35;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
    gain.gain.setValueAtTime(0.22, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  });

  // Sparkle cascade
  for (let i = 0; i < 12; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 2000 + Math.random() * 4000;
    const t = now + 0.8 + i * 0.05;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Deep bass hit
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.value = 80;
  bassGain.gain.setValueAtTime(0.2, now + 1.2);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
  bass.connect(bassGain).connect(ctx.destination);
  bass.start(now + 1.2);
  bass.stop(now + 2);
}

export function playTabSwitchWarning() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Alert siren
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    const t = now + i * 0.2;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.1);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }
}
