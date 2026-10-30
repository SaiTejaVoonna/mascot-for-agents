// HeadTTS 1.3.0 (Mika Suominen, MIT), Kokoro (hexgrad, Apache-2.0).
// Model loading is explicit on Play/Preview; no paid speech service is used.
const packageURL = 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.3.0';
export const neuralVoices = [
  {id:'af_heart', name:'Heart · female · American English'},
  {id:'af_bella', name:'Bella · female · American English'},
  {id:'af_nicole', name:'Nicole · female · American English'},
  {id:'af_sarah', name:'Sarah · female · American English'},
  {id:'am_michael', name:'Michael · male · American English'},
  {id:'am_fenrir', name:'Fenrir · male · American English'},
  {id:'am_puck', name:'Puck · male · American English'}
];
export const recordedVocals = {
  hmm: {file:'hmm-female.mp3', text:'Hmm?', mouth:'PP', name:'Recorded female hmm · esperar (CC0)'}
};
const stopped = () => new DOMException('Stopped', 'AbortError');

export class NeuralVoice {
  client = null; context = null; loading = null; tone = 0;
  cache = new Map(); pending = new Map(); clips = new Map(); envelopes = new WeakMap();
  generationQueue = Promise.resolve();
  audioContext() {
    if (!this.context || this.context.state === 'closed') this.context = new AudioContext();
    return this.context;
  }
  async load(progress) {
    if (this.client) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const {HeadTTS} = await import(`${packageURL}/+esm`);
      const client = new HeadTTS({
        audioCtx:this.audioContext(), endpoints:['webgpu','wasm'],
        dtypeWebgpu:'q8', dtypeWasm:'q8',
        workerModule:`${packageURL}/modules/worker-tts.mjs`,
        dictionaryURL:`${packageURL}/dictionaries/`,
        languages:['en-us'], voices:['af_heart','am_michael'], splitSentences:false
      });
      await client.connect(null, () => progress('Preparing Kokoro neural voices…'));
      if (!client.isConnected) throw new Error('Neural voice model could not connect.');
      this.client = client;
    })();
    try { await this.loading; } finally { this.loading = null; }
  }
  async unlock() { await this.audioContext().resume(); }
  async prepare(text, voice, speed, signal) {
    if (signal.aborted) throw stopped();
    if (!this.client) throw new Error('Load neural voices before selecting this mode.');
    const key = JSON.stringify([text,voice,speed]);
    if (this.cache.has(key)) return this.cache.get(key);
    const pending = this.pending.get(key);
    if (pending && pending.signal === signal) return pending.promise;
    const entry = {signal};
    const generation = this.generationQueue.then(async () => {
      if (signal.aborted) throw stopped();
      const abort = () => this.client.clear();
      signal.addEventListener('abort',abort,{once:true});
      try {
        // HeadTTS 1.3's worker path overwrites request-level values from ttsSetup.
        // Serialize setup + synthesis until the response completes so actors cannot cross voices.
        await this.client.setup({voice,language:'en-us',speed,audioEncoding:'wav'});
        if (signal.aborted) throw stopped();
        if (this.client.ttsSetup.voice !== voice || this.client.ttsSetup.speed !== speed) {
          throw new Error('The selected voice could not be applied. No fallback speech was played.');
        }
        const messages = await this.client.synthesize({input:text});
        if (signal.aborted) throw stopped();
        const failure = messages.find((message) => message.type === 'error');
        if (failure) throw new Error(failure.data?.error || 'Neural speech generation failed.');
        if (!messages.some((message) => message.type === 'audio')) throw new Error('No speech returned. Try a shorter line.');
        this.cache.set(key,messages);
        const bytes = () => [...this.cache.values()].flat().reduce((sum,message) =>
          sum + (message.data?.audio?.length || 0) * (message.data?.audio?.numberOfChannels || 1) * 4,0);
        while (this.cache.size > 6 || bytes() > 24 * 1024 * 1024) this.cache.delete(this.cache.keys().next().value);
        return messages;
      } finally {
        signal.removeEventListener('abort',abort);
      }
    });
    this.generationQueue = generation.then(()=>{},()=>{});
    entry.promise = generation.finally(() => { if (this.pending.get(key) === entry) this.pending.delete(key); });
    this.pending.set(key,entry);
    return entry.promise;
  }
  async speak(text, voice, speed, signal, onStart, onMouth, volume=1, onWord=()=>{}, prepared=null) {
    await this.unlock();
    try {
      const messages = prepared || await this.prepare(text,voice,speed,signal);
      if (signal.aborted) throw stopped();
      let wordBase = 0;
      for (const response of messages) {
        if (response.type !== 'audio') continue;
        const data = response.data;
        if (!data?.audio) throw new Error('The neural voice returned no audio.');
        await this.play(data,signal,onStart,onMouth,volume,(index) => onWord(wordBase+index));
        wordBase += data.words?.length || 0;
      }
    } finally { onMouth('sil',0); }
  }
  async prepareVocal(cue, signal) {
    const preset = recordedVocals[cue];
    if (!preset) throw new Error('Unknown recorded vocal cue.');
    await this.unlock();
    if (!this.clips.has(cue)) {
      const response = await fetch(new URL(`./assets/audio/${preset.file}`,import.meta.url),{signal});
      if (!response.ok) throw new Error('The recorded vocal cue could not load.');
      this.clips.set(cue,await this.context.decodeAudioData(await response.arrayBuffer()));
    }
    if (signal.aborted) throw stopped();
    return this.clips.get(cue);
  }
  async vocal(cue, signal, onStart, onMouth, volume=1) {
    const preset = recordedVocals[cue];
    await this.prepareVocal(cue,signal);
    await this.play({audio:this.clips.get(cue),vocalMouth:preset.mouth},signal,onStart,onMouth,volume,()=>{});
  }
  envelope(buffer) {
    if (this.envelopes.has(buffer)) return this.envelopes.get(buffer);
    const hop = Math.max(1,Math.round(buffer.sampleRate*.01));
    const levels = new Float32Array(Math.ceil(buffer.length/hop));
    const channels = Array.from({length:buffer.numberOfChannels},(_,index) => buffer.getChannelData(index));
    const stride = Math.max(1,Math.floor(buffer.sampleRate/12000));
    let peak = 0;
    for (let frame=0;frame<levels.length;frame++) {
      let energy=0,count=0;
      for (let i=frame*hop;i<Math.min((frame+1)*hop,buffer.length);i+=stride) {
        for (const channel of channels) { energy+=channel[i]*channel[i]; count++; }
      }
      levels[frame]=Math.sqrt(energy/Math.max(1,count)); peak=Math.max(peak,levels[frame]);
    }
    const envelope={levels,hopMs:hop/buffer.sampleRate*1000,peak};
    this.envelopes.set(buffer,envelope); return envelope;
  }
  audibleTime() {
    const stamp = this.context.getOutputTimestamp?.();
    if (stamp?.contextTime > 0 && stamp.performanceTime > 0) {
      return Math.min(this.context.currentTime,stamp.contextTime+(performance.now()-stamp.performanceTime)/1000);
    }
    return this.context.currentTime-Math.min(.4,(this.context.baseLatency||0)+(this.context.outputLatency||0));
  }
  play(data, signal, onStart, onMouth, volume, onWord) {
    return new Promise((resolve,reject) => {
      if (signal.aborted) return reject(stopped());
      const source=this.context.createBufferSource(), gain=this.context.createGain();
      gain.gain.value=volume;
      const warmth=this.context.createBiquadFilter(),presence=this.context.createBiquadFilter();
      warmth.type='lowshelf'; warmth.frequency.value=220; warmth.gain.value=this.tone*2;
      presence.type='highshelf'; presence.frequency.value=3200; presence.gain.value=-this.tone*3;
      source.buffer=data.audio; source.connect(warmth).connect(presence).connect(gain).connect(this.context.destination);
      const envelope=this.envelope(data.audio),duration=data.audio.duration*1000;
      const start=this.context.currentTime+.025;
      let frame=0,timer=0,index=0,wordIndex=-1,done=false,started=false,endedAt=0,level=0,previous=performance.now();
      const finish=(reason) => {
        if (done) return; done=true; cancelAnimationFrame(frame); clearTimeout(timer);
        document.removeEventListener('visibilitychange',reschedule);
        signal.removeEventListener('abort',cancel); source.onended=null;
        try { source.stop(); } catch {}
        source.disconnect(); warmth.disconnect(); presence.disconnect(); gain.disconnect();
        onMouth('sil',0); reason ? reject(reason) : resolve();
      };
      const cancel=()=>finish(stopped());
      signal.addEventListener('abort',cancel,{once:true});
      const schedule=()=>{
        if (document.hidden) timer=setTimeout(tick,100);
        else frame=requestAnimationFrame(tick);
      };
      const reschedule=()=>{ cancelAnimationFrame(frame); clearTimeout(timer); if (!done) schedule(); };
      document.addEventListener('visibilitychange',reschedule);
      const tick=()=>{
        if (done) return;
        const now=performance.now(),elapsed=(this.audibleTime()-start)*1000;
        if (elapsed>=0) {
          if (!started) { started=true; onStart(); }
          const times=data.vtimes||[],durations=data.vdurations||[];
          while (index+1<times.length && times[index+1]<=elapsed) index++;
          const active=times[index]<=elapsed && elapsed<=times[index]+(durations[index]||70);
          const rms=elapsed<duration ? envelope.levels[Math.floor(elapsed/envelope.hopMs)]||0 : 0;
          const gate=Math.max(.0025,envelope.peak*.03);
          const target=Math.max(0,Math.min(1,(rms-gate)/Math.max(.025,envelope.peak*.55)));
          const dt=Math.min(.1,(now-previous)/1000);
          level+=(target-level)*(1-Math.exp(-dt/(target > level ? .025 : .06)));
          const shape=target<.015 ? 'sil' : data.vocalMouth || (times.length ? active ? data.visemes?.[index]||'sil' : 'sil' : 'aa');
          onMouth(shape,level);
          let nextWord=wordIndex;
          while (nextWord+1<(data.wtimes?.length||0) && data.wtimes[nextWord+1]<=elapsed) nextWord++;
          if (nextWord!==wordIndex) { wordIndex=nextWord; onWord(wordIndex); }
        }
        previous=now;
        // Keep the last phoneme until audio has reached the output device.
        if (endedAt && (elapsed>=duration || now-endedAt>500)) return finish();
        schedule();
      };
      source.onended=()=>{endedAt=performance.now(); reschedule();};
      try { source.start(start); tick(); } catch (reason) { finish(reason); }
    });
  }
}
