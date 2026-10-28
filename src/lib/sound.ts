/**
 * Web Audio API based harmonic chime and alert synthesizer.
 * Creates an organic, calm singing-bowl resonance without needing external audio files.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Warm, gentle bell chime (528 Hz Solfeggio / calm harmonic) with exponential decay.
   */
  playCompletionChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.2, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      // Fundamental frequency (warm bell)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);

      // Gentle first harmonic overtone
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1056, now);
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      // Low foundation warmth
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(264, now);
      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.15, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc3.connect(gain3);
      gain3.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + 3.3);
      osc2.stop(now + 3.3);
      osc3.stop(now + 3.3);
    } catch {
      // Audio playback might be prevented by browser policy before first user gesture
    }
  }

  /**
   * Soft, wooden transition click
   */
  playSoftClick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }
}

export const soundService = new SoundService();
