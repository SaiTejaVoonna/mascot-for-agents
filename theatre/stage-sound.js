// Prepared CC0 UI samples and a public-domain fire recording. See assets/audio/CREDITS.md.
export const soundNames = ['whoosh', 'pop', 'tap', 'chime', 'click', 'success'];
export class StageSound {
  context = null; ambience = null; effectsBus = null;
  sources = new Map(); buffers = new Map(); pending = new Map(); generation = 0;
  gain = .25; ambienceLevel = .4; pitch = 1; ducked = false;
  async unlock() {
    this.context ||= new AudioContext();
    await this.context.resume();
  }
  async load(name) {
    if (this.buffers.has(name)) return;
    if (!this.pending.has(name)) {
      const task = (async () => {
        const response = await fetch(new URL(`./assets/audio/${name}.mp3`, import.meta.url));
        if (!response.ok) throw new Error(`Could not load the ${name} sound. Reload and try again.`);
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(name, buffer);
      })().finally(() => this.pending.delete(name));
      this.pending.set(name, task);
    }
    await this.pending.get(name);
  }
  async ready(names = soundNames, stage = null) {
    const generation = this.generation;
    this.context ||= new AudioContext();
    if (!this.effectsBus) {
      this.effectsBus = this.context.createGain();
      this.effectsBus.connect(this.context.destination); this.updateEffects();
    }
    await this.context.resume();
    const needed = [...new Set(names.filter((name) => soundNames.includes(name)))];
    if (stage === 'campfire') needed.push('fireplace');
    await Promise.all(needed.map((name) => this.load(name)));
    return generation === this.generation;
  }
  configure(settings) {
    this.gain = settings.effectsVolume; this.ambienceLevel = settings.ambienceVolume;
    this.pitch = settings.soundPitch; this.updateAmbience(); this.updateEffects();
  }
  target(parameter, value, seconds) {
    const now = this.context.currentTime;
    parameter.cancelScheduledValues(now); parameter.setTargetAtTime(value, now, seconds);
  }
  duck(on) { this.ducked = on; this.updateAmbience(); this.updateEffects(); }
  updateEffects() {
    if (this.effectsBus) this.target(this.effectsBus.gain, this.gain * (this.ducked ? .3 : 1), .07);
  }
  updateAmbience() {
    if (this.ambience) this.target(this.ambience.gain.gain,
      this.ambienceLevel * (this.ducked ? .35 : .8), this.ducked ? .08 : .4);
  }
  effect(name) {
    const buffer = this.buffers.get(name);
    if (!this.context || !buffer || !soundNames.includes(name)) return 0;
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = buffer; source.playbackRate.value = this.pitch;
    source.connect(gain).connect(this.effectsBus); this.sources.set(source, gain);
    source.onended = () => { this.sources.delete(source); source.disconnect(); gain.disconnect(); };
    source.start();
    return buffer.duration / this.pitch * 1000;
  }
  startAmbience(stage) {
    this.stopAmbience();
    // No invented rumble for podcast/room: silence until an appropriate recording exists.
    const buffer = this.buffers.get('fireplace');
    if (!this.context || stage !== 'campfire' || !buffer) return;
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = buffer; source.loop = true; gain.gain.value = 0;
    source.connect(gain).connect(this.context.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    this.ambience = {source, gain}; source.start(); this.updateAmbience();
  }
  stopAmbience() {
    if (!this.ambience) return;
    const {source, gain} = this.ambience, now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now); gain.gain.setTargetAtTime(0, now, .02);
    source.stop(now + .12); this.ambience = null;
  }
  stop() {
    this.generation++; this.stopAmbience();
    if (this.context) for (const [source, gain] of this.sources) {
      const now = this.context.currentTime;
      gain.gain.cancelScheduledValues(now); gain.gain.setTargetAtTime(0, now, .008);
      try { source.stop(now + .04); } catch {}
    }
    this.duck(false);
  }
}
