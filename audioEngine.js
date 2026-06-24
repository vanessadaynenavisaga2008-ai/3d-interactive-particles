/**
 * audioEngine.js
 * Lightweight, optional Web Audio layer:
 *  - ambient drone that fades in once unmuted
 *  - whoosh "burst" sound triggered on fist->open transitions
 *
 * No external audio files required — everything here is synthesized
 * with oscillators, so the project still runs with zero assets.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.droneGain = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggle() {
    this._ensureContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.enabled = !this.enabled;
    if (this.enabled) {
      this._startDrone();
    } else {
      this._stopDrone();
    }
    return this.enabled;
  }

  _startDrone() {
    const ctx = this.ctx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 60;
    osc2.frequency.value = 90.5; // slight detune for shimmer

    const gain = ctx.createGain();
    gain.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);

    this.droneGain = gain;
    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;
  }

  _stopDrone() {
    if (!this.droneGain) return;
    const ctx = this.ctx;
    this.droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    const osc1 = this.droneOsc1, osc2 = this.droneOsc2;
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
    }, 500);
  }

  /** Short synthesized whoosh for burst gesture transitions */
  playBurst() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

window.AudioEngine = AudioEngine;