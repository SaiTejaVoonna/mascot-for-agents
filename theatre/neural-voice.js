// Optional HeadTTS adapter. No network/model work occurs until load() is called.
// Upstream: https://github.com/met4citizen/HeadTTS (MIT); Kokoro model: Apache-2.0.
const packageURL = 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.3';
export const neuralVoices = [
  {id: 'af_bella', name: 'Bella · American English'},
  {id: 'af_heart', name: 'Heart · American English'},
  {id: 'am_fenrir', name: 'Fenrir · American English'},
  {id: 'am_michael', name: 'Michael · American English'}
];
export class NeuralVoice {
  client = null;
  context = null;
  loading = null;
  cache = new Map();
  tone = 0;
  async load(progress) {
    if (this.client) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const {HeadTTS} = await import(`${packageURL}/+esm`);
      this.context = new AudioContext();
      const client = new HeadTTS({
        audioCtx: this.context,
        endpoints: ['webgpu', 'wasm'], dtypeWebgpu: 'q8', dtypeWasm: 'q8',
        workerModule: `${packageURL}/modules/worker-tts.mjs`,
        dictionaryURL: `${packageURL}/dictionaries/`,
        languages: ['en-us'], voices: ['af_heart', 'am_michael'],
        splitSentences: false
      });
      try {
        await client.connect(null, () => progress('Downloading and preparing the neural voice model…'));
        if (!client.isConnected) throw new Error('Neural voice model could not connect.');
        this.client = client;
      } catch (reason) {
        await this.context.close(); this.context = null; throw reason;
      }
    })();
    try { await this.loading; } finally { this.loading = null; }
  }
  async unlock() { if (this.context) await this.context.resume(); }
  async speak(text, voice, speed, signal, onStart, onMouth, volume = 1, onWord = () => {}) {
    if (!this.client) throw new Error('Load neural voices before selecting this mode.');
    await this.unlock();
    if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
    const abort = () => this.client.clear();
    signal.addEventListener('abort', abort, {once: true});
    try {
      const key = JSON.stringify([text,voice,speed]);
      let messages = this.cache.get(key);
      if (!messages) {
        await this.client.setup({voice, language: 'en-us', speed, audioEncoding: 'wav'});
        messages = await this.client.synthesize({input: text});
        if (!signal.aborted && messages.some((m) => m.type === 'audio') && !messages.some((m) => m.type === 'error')) {
          this.cache.set(key,messages);
          const bytes = () => [...this.cache.values()].flat().reduce((sum,m) => sum + (m.data?.audio?.length || 0) * (m.data?.audio?.numberOfChannels || 1) * 4,0);
          while (this.cache.size > 6 || bytes() > 24 * 1024 * 1024) this.cache.delete(this.cache.keys().next().value);
        }
      }
      if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
      let wordBase = 0;
      for (const response of messages) {
        if (response.type === 'error') throw new Error(response.data?.error || 'Neural speech generation failed.');
        if (response.type !== 'audio') continue;
        const data = response.data;
        if (!data?.audio) throw new Error('The neural voice returned no audio.');
        await this.play(data, signal, onStart, onMouth, volume,(index) => onWord(wordBase+index));
        wordBase += data.words?.length || 0;
      }
      if (!messages.some((m) => m.type === 'audio')) throw new Error('No speech returned. Try a shorter line.');
    } finally { signal.removeEventListener('abort', abort); onMouth('sil'); }
  }
  play(data, signal, onStart, onMouth, volume,onWord) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new DOMException('Stopped', 'AbortError'));
      const source = this.context.createBufferSource();
      const gain = this.context.createGain(); gain.gain.value = volume;
      const warmth = this.context.createBiquadFilter(), presence = this.context.createBiquadFilter();
      warmth.type = 'lowshelf'; warmth.frequency.value = 220; warmth.gain.value = this.tone * 2;
      presence.type = 'highshelf'; presence.frequency.value = 3200; presence.gain.value = -this.tone * 3;
      source.buffer = data.audio; source.connect(warmth).connect(presence).connect(gain).connect(this.context.destination);
      let frame = 0, index = 0, wordIndex = -1, done = false;
      const start = this.context.currentTime;
      const finish = (reason) => {
        if (done) return; done = true; cancelAnimationFrame(frame);
        signal.removeEventListener('abort', cancel); source.onended = null;
        try { source.stop(); } catch { /* May already be ended. */ }
        source.disconnect(); warmth.disconnect(); presence.disconnect(); gain.disconnect(); onMouth('sil'); reason ? reject(reason) : resolve();
      };
      const cancel = () => finish(new DOMException('Stopped', 'AbortError'));
      signal.addEventListener('abort', cancel, {once: true});
      const tick = () => {
        const elapsed = (this.context.currentTime - start) * 1000;
        const times = data.vtimes || [], durations = data.vdurations || [];
        while (index + 1 < times.length && times[index + 1] <= elapsed) index++;
        const active = times[index] <= elapsed && elapsed <= times[index] + (durations[index] || 70);
        onMouth(active ? data.visemes?.[index] || 'sil' : 'sil');
        let nextWord = wordIndex;
        while (nextWord + 1 < (data.wtimes?.length || 0) && data.wtimes[nextWord+1] <= elapsed) nextWord++;
        if (nextWord !== wordIndex) { wordIndex = nextWord; onWord(wordIndex); }
        if (!done) frame = requestAnimationFrame(tick);
      };
      source.onended = () => finish();
      try { source.start(); onStart(); tick(); } catch (reason) { finish(reason); }
    });
  }
}
