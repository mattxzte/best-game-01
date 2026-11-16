// Prismweave — all sound is synthesized with the Web Audio API; the game
// ships no audio files. A tiny synth plays a blip for every action, a
// chime when a prism wakes, and a short phrase for a win or a loss.
// The context is created on the first user gesture (browsers block audio
// before one), and M toggles mute at any time.

const NOTES = {
  place: [520, 0.07, 'triangle'],
  rotate: [340, 0.05, 'square'],
  remove: [220, 0.08, 'triangle'],
  lit: [880, 0.16, 'sine'],
  win: [523, 659, 784, 1047],
  fail: [392, 330, 262],
  click: [660, 0.04, 'sine'],
};

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  unlock() {
    if (!this.context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
      } catch {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, seconds, type, when = 0, gain = 0.12) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(amp);
    amp.connect(this.context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  play(name) {
    if (!this.context || this.muted) return;
    if (name === 'win') {
      NOTES.win.forEach((freq, i) => this.tone(freq, 0.22, 'sine', i * 0.11, 0.14));
      return;
    }
    if (name === 'fail') {
      NOTES.fail.forEach((freq, i) => this.tone(freq, 0.25, 'triangle', i * 0.14, 0.12));
      return;
    }
    const [freq, seconds, type] = NOTES[name] ?? NOTES.click;
    this.tone(freq, seconds, type);
  }

  prismLit() {
    if (!this.context || this.muted) return;
    this.tone(880, 0.14, 'sine', 0, 0.12);
    this.tone(1318, 0.2, 'sine', 0.07, 0.1);
  }
}
