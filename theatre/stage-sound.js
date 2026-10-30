// Original small procedural sound palette. No recordings or external sound model.
export const soundNames = ['whoosh', 'pop', 'tap', 'chime', 'click', 'success'];
export class StageSound {
  context = null; ambience = null; effectsBus = null; sources = new Set();
  gain = 0.25; ambienceLevel = 0.2; pitch = 1; ducked = false;
  async ready() {
    this.context ||= new AudioContext();
    if (!this.effectsBus) { this.effectsBus = this.context.createGain(); this.effectsBus.connect(this.context.destination); this.updateEffects(); }
    await this.context.resume();
  }
  configure(settings) {
    this.gain = settings.effectsVolume; this.ambienceLevel = settings.ambienceVolume; this.pitch = settings.soundPitch;
    this.updateAmbience();
    this.updateEffects();
  }
  duck(on) { this.ducked = on; this.updateAmbience(); this.updateEffects(); }
  updateEffects() { if (this.effectsBus) this.effectsBus.gain.setTargetAtTime(this.gain * (this.ducked ? .3 : 1), this.context.currentTime, .07); }
  updateAmbience() {
    if (!this.ambience) return;
    this.ambience.gain.gain.setTargetAtTime(this.ambienceLevel * (this.ducked ? 0.16 : 0.4), this.context.currentTime, 0.12);
  }
  noise(seconds, seed = 42) {
    const length = Math.ceil(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate), data = buffer.getChannelData(0);
    let state = seed;
    for (let i = 0; i < length; i++) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; data[i] = state / 2147483648 - 1; }
    return buffer;
  }
  track(source, nodes) {
    this.sources.add(source);
    source.onended = () => { this.sources.delete(source); source.disconnect(); nodes.forEach((node) => node.disconnect()); };
  }
  effect(name) {
    if (!this.context || !soundNames.includes(name)) return;
    const now = this.context.currentTime, output = this.context.createGain();
    output.connect(this.effectsBus);
    const duration = name === 'whoosh' ? 0.38 : name === 'success' ? 0.65 : name === 'chime' ? 0.8 : 0.14;
    output.gain.setValueAtTime(0, now);
    output.gain.linearRampToValueAtTime(0.7, now + 0.012);
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    if (name === 'whoosh' || name === 'tap' || name === 'click') {
      const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter();
      source.buffer = this.noise(duration, name === 'whoosh' ? 12 : 32);
      source.playbackRate.value = this.pitch;
      filter.type = 'bandpass'; filter.Q.value = name === 'whoosh' ? 0.65 : 1.3;
      filter.frequency.setValueAtTime((name === 'whoosh' ? 500 : name === 'tap' ? 350 : 1800) * this.pitch, now);
      if (name === 'whoosh') filter.frequency.exponentialRampToValueAtTime(2800 * this.pitch, now + duration);
      source.connect(filter).connect(output); this.track(source, [filter,output]); source.start(); source.stop(now + duration);
    } else {
      const source = this.context.createOscillator(); source.type = 'sine';
      source.frequency.setValueAtTime((name === 'pop' ? 550 : 660) * this.pitch, now);
      if (name === 'pop') source.frequency.exponentialRampToValueAtTime(160 * this.pitch, now + duration);
      if (name === 'success') { source.frequency.setValueAtTime(825 * this.pitch, now + 0.13); source.frequency.setValueAtTime(990 * this.pitch, now + 0.27); }
      source.connect(output); this.track(source,[output]); source.start(); source.stop(now + duration);
    }
  }
  startAmbience(stage) {
    this.stopAmbience(); if (!this.context || stage === 'room') return;
    const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
    source.buffer = this.noise(4); source.loop = true;
    filter.type = 'lowpass'; filter.frequency.value = stage === 'campfire' ? 420 : 110;
    source.connect(filter).connect(gain).connect(this.context.destination);
    this.ambience = {source, filter, gain}; gain.gain.value = 0;
    source.start(); this.updateAmbience();
  }
  stopAmbience() {
    if (!this.ambience) return;
    this.ambience.source.stop();
    for (const node of Object.values(this.ambience)) node.disconnect();
    this.ambience = null;
  }
  stop() {
    this.stopAmbience();
    for (const source of this.sources) { try { source.stop(); } catch {} }
    this.duck(false);
  }
}
