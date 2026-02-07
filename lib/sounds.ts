let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  rampDown = true
) {
  try {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {
    // never break gameplay
  }
}

function playNoise(duration: number, volume = 0.08) {
  try {
    const c = getCtx();
    if (!c) return;
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start(c.currentTime);
  } catch {
    // never break gameplay
  }
}

/** Short percussive tap — chip landing on board */
export function playChipPlace() {
  playTone(220, 0.08, 'triangle', 0.2);
  playNoise(0.05, 0.06);
}

/** Soft rising tone — selecting/lifting a card */
export function playCardLift() {
  playTone(440, 0.12, 'sine', 0.1);
  setTimeout(() => playTone(660, 0.08, 'sine', 0.08), 40);
}

/** Quick swish — drawing a new card */
export function playCardDraw() {
  playNoise(0.1, 0.1);
}

/** Subtle low click — passing turn */
export function playPass() {
  playTone(180, 0.06, 'triangle', 0.1);
}

/** Ascending chime — winning the game */
export function playWin() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 150);
  });
}

/** Short UI click — button interactions */
export function playButtonClick() {
  playTone(600, 0.04, 'square', 0.06);
}

/** Gentle notification — it's your turn */
export function playYourTurn() {
  playTone(587, 0.15, 'sine', 0.1); // D5
  setTimeout(() => playTone(784, 0.2, 'sine', 0.1), 120); // G5
}

/** Timer warning beep — progressively higher pitch at 15s, 10s, 5s */
export function playTimerBeep(urgency: number) {
  const frequencies = [440, 660, 880]; // A4, E5, A5
  const volumes = [0.08, 0.10, 0.14];
  playTone(frequencies[urgency] ?? 880, 0.12, 'sine', volumes[urgency] ?? 0.14);
}
