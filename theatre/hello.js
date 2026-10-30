import {NeuralVoice, neuralVoices, recordedVocals} from './neural-voice.js?v=speech-6';
import {StageSound, soundNames} from './stage-sound.js?v=audio-unlock-1';
import {setupWorld} from './world-interactions.js?v=3';
import {setupStudio} from './studio-ui.js?v=2';
const neural = new NeuralVoice();
const stageSound = new StageSound();
const $ = (id) => document.getElementById(id);
const synth = window.speechSynthesis;
const supportsSpeech = Boolean(synth && window.SpeechSynthesisUtterance);
const names = {claude: 'Claude', gpt: 'GPT'};
const expressions = {neutral: 'neutral', happy: 'happy', curious: 'thinking', concerned: 'worried'};
const example = $('script').value;
let savedVoicePrefs = {};
try { const value = JSON.parse(localStorage.getItem('theatre-voice-v2')); if (value && typeof value === 'object') savedVoicePrefs = value; } catch {}
function saveVoicePreferences() {
  const engine = $('engine').value;
  savedVoicePrefs = {engine, rate:Number($('rate').value), tone:Number($('tone').value),
    pitch:{claude:Number($('pitch-claude').value),gpt:Number($('pitch-gpt').value)},
    voiceIds:{...savedVoicePrefs.voiceIds,[engine]:{claude:$('voice-claude').value,gpt:$('voice-gpt').value}}};
  try { localStorage.setItem('theatre-voice-v2',JSON.stringify(savedVoicePrefs)); } catch {}
}
let voices = [], controller = null, importedScene = null, utterance = null;
let mouthTimer = null;
const mouthLayers = new Map();
Object.keys(names).forEach((character) => {
  const layer = document.createElement('canvas'); layer.width = layer.height = 96;
  layer.className = 'mouth-layer'; layer.setAttribute('aria-hidden', 'true');
  $(`actor-${character}`).querySelector('.actor-art').append(layer);
  mouthLayers.set(character, layer);
});
function mouth(character, shape = 'sil', energy = .6) {
  const layer = mouthLayers.get(character), context = layer.getContext('2d');
  const still = String($('still').checked);
  const level = Math.round(Math.max(0,Math.min(1,energy))*4);
  if (layer.dataset.shape === shape && layer.dataset.still === still && layer.dataset.level === String(level)) return;
  layer.dataset.shape = shape; layer.dataset.still = still; layer.dataset.level = level;
  context.clearRect(0, 0, 96, 96);
  if (shape === 'rest' || $('still').checked) return;
  const gpt = character === 'gpt';
  const x = gpt ? 49 : ($(`actor-${character}`).dataset.expression === 'curious' ? 50 : 48);
  const y = gpt ? 55 : 51;
  context.fillStyle = gpt ? '#79dfb0' : '#d77757';
  // Cover the baked-in expression mouth, including during silence. Only rest restores it.
  context.fillRect(x - (gpt ? 7 : 12), y - 4, gpt ? 14 : 24, gpt ? 10 : 9);
  const closed = shape === 'sil' || shape === 'PP' || !level;
  const round = ['O','U','RR'].includes(shape), teeth = ['FF','SS','CH','TH'].includes(shape);
  const width = closed ? 6 : round ? 4 + Math.min(2,level) : 8 + Math.min(2,level);
  const height = closed ? 1 : teeth ? 2 + Math.round(level/3) : 2 + level;
  const left = Math.round(x-width/2), top = y-1;
  context.fillStyle = '#202531'; context.fillRect(left,top,width,height);
  if (teeth && !closed) { context.fillStyle='#f7e8d6'; context.fillRect(left+1,top,width-2,1); }
  if (!closed && !round && height>3) { context.fillStyle='#ef839f'; context.fillRect(x-2,top+height-2,4,1); }
}
function closeMouths() { clearInterval(mouthTimer); mouthTimer = null; Object.keys(names).forEach((id) => mouth(id,'rest',0)); }
function approximateMouth(character) {
  closeMouths(); let phase = 0;
  const shapes = ['aa', 'PP', 'E', 'O', 'sil', 'I'];
  mouth(character, 'aa'); mouthTimer = setInterval(() => mouth(character, shapes[phase++ % shapes.length]), 130);
}
const message = (text) => { $('status').textContent = text; };
function error(text = '') { $('error').textContent = text; $('error').hidden = !text; }
let captionWords = [], currentWord = -1, captionFallback = null, captionPageSize = 12;
function caption(speaker, text) {
  $('caption-speaker').textContent = speaker;
  const target = $('caption-text'); target.replaceChildren(); captionWords = []; currentWord = -1;
  captionPageSize = $('stage').clientWidth < 420 ? 6 : $('stage').clientWidth < 640 ? 9 : 12;
  clearInterval(captionFallback);
  let offset = 0;
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) target.append(document.createTextNode(token));
    else { const span = document.createElement('span'); span.className = 'word'; span.textContent = token; target.append(span); captionWords.push({span,start:offset,end:offset+token.length}); }
    offset += token.length;
  }
  target.classList.remove('caption-enter');
  if (captionWords.length > captionPageSize) {
    captionWords.forEach((word,index) => { word.span.hidden = index >= captionPageSize; });
    let estimated = 0;
    captionFallback = setInterval(() => {
      if (estimated >= captionWords.length - 1) { clearInterval(captionFallback); return; }
      highlightWord(++estimated,true);
    },370 / Number($('rate').value));
  }
  if (!$('still').checked) { void target.offsetWidth; target.classList.add('caption-enter'); }
}
function highlightWord(index,approximate = false) {
  if (!approximate) clearInterval(captionFallback);
  if (currentWord === index) return;
  captionWords[currentWord]?.span.classList.remove('is-current');
  captionWords[index]?.span.classList.add('is-current'); currentWord = index;
  if (index >= 0 && captionWords.length > captionPageSize) { const page = Math.floor(index/captionPageSize); captionWords.forEach((word,i) => { word.span.hidden = Math.floor(i/captionPageSize) !== page; }); }
}
function highlightChar(index) { highlightWord(captionWords.findIndex((word) => index >= word.start && index < word.end)); }
function progress(line = 0, total = 0) { $('line-progress').textContent = line ? `Line ${line} / ${total}` : 'Ready'; }
function pose(character, state = 'idle', expression = 'neutral', gaze = 'viewer') {
  const figure = $(`actor-${character}`);
  figure.dataset.state = state;
  figure.dataset.expression = expression;
  figure.dataset.gaze = gaze;
  figure.querySelector('.actor-state').textContent = {idle: 'Ready', speaking: 'Speaking', listening: 'Listening'}[state];
  const image = figure.querySelector('img');
  const path = `../assets/collection/${character}-v5/${expressions[expression] || 'neutral'}.png?v=9`;
  if (image.getAttribute('src') !== path) image.src = path;
}
function resetActors() { closeMouths(); clearInterval(captionFallback); stageSound.duck(false); Object.keys(names).forEach((id) => { pose(id); $(`actor-${id}`).classList.remove('nod'); }); }
function stop(text = 'Stopped. Ready to start again.') {
  const previous = controller;
  controller = null;
  previous?.abort();
  if (previous && supportsSpeech) synth.cancel();
  utterance = null;
  stageSound.stop(); $('stage').dataset.playing = 'false';
  resetActors();
  progress();
  $('play').disabled = false; $('play').removeAttribute('aria-busy');
  $('play').textContent = 'Play conversation'; $('stop').disabled = true;
  if (text) { message(text); caption('Your stage is ready', 'Start with Hello, or write your own exchange.'); }
}
const abortError = () => new DOMException('Playback stopped', 'AbortError');
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const done = () => { signal.removeEventListener('abort', cancel); resolve(); };
    const timer = setTimeout(done, ms);
    const cancel = () => { clearTimeout(timer); reject(abortError()); };
    signal.addEventListener('abort', cancel, {once: true});
  });
}
function speak(text, character, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const speech = new SpeechSynthesisUtterance(text);
    utterance = speech; // Keep a strong reference until completion.
    const selected = $(`voice-${character}`).value;
    const voice = voices.find((item) => item.voiceURI === selected);
    if (voice) { speech.voice = voice; speech.lang = voice.lang; }
    else speech.lang = 'en-US';
    speech.rate = Number($('rate').value);
    speech.pitch = Number($(`pitch-${character}`).value);
    speech.volume = Number($('voice-volume').value);
    let settled = false;
    const finish = (reason) => {
      if (settled) return;
      settled = true; clearTimeout(watchdog); signal.removeEventListener('abort', cancel);
      speech.onend = speech.onerror = speech.onstart = speech.onboundary = null;
      closeMouths();
      if (utterance === speech) utterance = null;
      reason ? reject(reason) : resolve();
    };
    const cancel = () => finish(abortError());
    const watchdog = setTimeout(() => {
      finish(new Error('The voice did not finish. Try another voice, a shorter line, or Captions only.'));
      synth.cancel();
    }, 90000);
    speech.onend = () => finish();
    speech.onerror = (event) => finish(new Error(`Speech could not play (${event.error || 'voice unavailable'}). Try another voice or Captions only.`));
    speech.onstart = () => { if (!signal.aborted) { caption(names[character],text); stageSound.duck(true); pose(character, 'speaking', activeExpression, activeGaze); approximateMouth(character); } };
    speech.onboundary = (event) => {
      if (signal.aborted || event.name !== 'word') return;
      const word = text.slice(event.charIndex).split(/\s/)[0].toLowerCase();
      highlightChar(event.charIndex);
      mouth(character, /^[bmp]/.test(word) ? 'PP' : /[ou]/.test(word) ? 'O' : 'aa');
    };
    signal.addEventListener('abort', cancel, {once: true});
    try { synth.speak(speech); } catch (reason) { finish(reason); }
  });
}
let activeExpression = 'neutral', activeGaze = 'viewer';
const settingNames = {campfire:'Campfire outpost', podcast:'The podcast room', room:'Rehearsal room'};
function settings() {
  return {pace:$('pace').value, textMode:$('stage').dataset.textmode || 'story', ambience:$('ambience').checked, effects:$('effects').checked,
    voiceVolume:Number($('voice-volume').value), effectsVolume:Number($('effects-volume').value),
    ambienceVolume:Number($('ambience-volume').value), soundPitch:Number($('sound-pitch').value), light:Number($('light').value)};
}
function updateStage() {
  $('stage').dataset.scene = $('setting').value;
  $('stage-name').textContent = settingNames[$('setting').value];
  $('stage').style.setProperty('--firelight', $('light').value);
  stageSound.configure(settings());
}
function applySettings(scene) {
  $('setting').value = scene.stage;
  const values = {pace:'natural',textMode:'story',ambience:true,effects:true,voiceVolume:1,effectsVolume:.25,ambienceVolume:.4,soundPitch:1,light:.6,...scene.settings};
  setTextMode(values.textMode);
  $('pace').value = values.pace; $('ambience').checked = values.ambience; $('effects').checked = values.effects;
  for (const [key,id] of Object.entries({voiceVolume:'voice-volume',effectsVolume:'effects-volume',ambienceVolume:'ambience-volume',soundPitch:'sound-pitch',light:'light'})) $(id).value = values[key];
  updateStage();
}
const paceScale = () => ({relaxed:1.5,natural:1,snappy:.6})[$('pace').value];
function parseScript() {
  const cast = [
    {id: 'a', character: 'claude', voice: 'warm', slot: 'seat-left'},
    {id: 'b', character: 'gpt', voice: 'bright', slot: 'seat-right'}
  ];
  const beats = $('script').value.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return null;
    const pause = line.match(/^\s*Pause:\s*(\d+)\s*$/i);
    if (pause) return {id: `beat-${index}`, type: 'pause', durationMs: Number(pause[1])};
    const sound = line.match(/^\s*Sound:\s*(\w+)\s*$/i);
    if (sound) return {id:`beat-${index}`,type:'sound',sound:sound[1].toLowerCase()};
    const match = line.match(/^\s*(Claude|GPT)(?:\s*\[(neutral|happy|curious|concerned)\])?\s*:\s*(.+)\s*$/i);
    if (!match) throw new Error(`Line ${index + 1}: use Claude: Hello!, GPT [happy]: Hi!, Pause: 400, or Sound: whoosh.`);
    const vocal = match[3].trim().toLowerCase() === '{hmm}' ? 'hmm' : null;
    return {id: `beat-${index}`, type: 'say', actor: match[1].toLowerCase() === 'claude' ? 'a' : 'b', text: vocal ? recordedVocals[vocal].text : match[3].trim(), ...(vocal ? {vocal} : {}), expression: (match[2] || 'neutral').toLowerCase(), afterMs: 300};
  }).filter(Boolean);
  return validate({format: 'mascot-scene', version: '0.2', stage: $('setting').value, settings:settings(), seed: 42, cast, beats});
}
function allowed(value, keys, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected an object.`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`${path}.${key}: unsupported field.`);
}
function milliseconds(value, path) {
  if (!Number.isInteger(value) || value < 0 || value > 5000) throw new Error(`${path}: use 0 to 5000 milliseconds.`);
}
function validate(scene) {
  allowed(scene, scene?.version === '0.1' ? ['format','version','stage','seed','targetDurationMs','cast','beats'] : ['format','version','stage','seed','targetDurationMs','cast','beats','settings'], 'scene');
  if (scene.format !== 'mascot-scene' || !['0.1','0.2'].includes(scene.version)) throw new Error('Use mascot-scene format version 0.1 or 0.2.');
  if (!Object.hasOwn(settingNames, scene.stage) || (scene.version === '0.1' && scene.stage !== 'campfire')) throw new Error('Choose a supported stage: campfire, podcast or room (new settings use version 0.2).');
  if (scene.settings !== undefined) {
    allowed(scene.settings,['pace','textMode','ambience','effects','voiceVolume','effectsVolume','ambienceVolume','soundPitch','light'],'settings');
    for (const [key,value] of Object.entries(scene.settings)) {
      if (key === 'pace') { if (!['relaxed','natural','snappy'].includes(value)) throw new Error('settings.pace: choose relaxed, natural or snappy.'); }
      else if (key === 'textMode') { if (!['off','subtitles','story'].includes(value)) throw new Error('settings.textMode: choose off, subtitles or story.'); }
      else if (['ambience','effects'].includes(key)) { if (typeof value !== 'boolean') throw new Error(`settings.${key}: use true or false.`); }
      else if (!Number.isFinite(value) || value < (key === 'soundPitch' ? .5 : 0) || value > (key === 'soundPitch' ? 1.5 : 1)) throw new Error(`settings.${key}: value is out of range.`);
    }
  }
  if (!Number.isInteger(scene.seed)) throw new Error('scene.seed: use an integer.');
  if (scene.targetDurationMs !== undefined && (!Number.isInteger(scene.targetDurationMs) || scene.targetDurationMs <= 0)) throw new Error('targetDurationMs must be a positive integer.');
  if (!Array.isArray(scene.cast) || scene.cast.length < 1 || scene.cast.length > 2) throw new Error('Use one or two actors.');
  const ids = new Set(), characters = new Set(), slots = new Set();
  for (const actor of scene.cast) {
    allowed(actor, ['id','character','voice','slot'], 'cast');
    if (typeof actor.id !== 'string' || !actor.id || ids.has(actor.id)) throw new Error('Each actor needs a unique nonempty ID.');
    if (!Object.hasOwn(names, actor.character) || characters.has(actor.character)) throw new Error('Use Claude and/or GPT once each.');
    if (typeof actor.voice !== 'string' || !actor.voice) throw new Error('Each actor needs a voice alias.');
    if (!['seat-left','seat-right'].includes(actor.slot) || slots.has(actor.slot)) throw new Error('Use a separate seat-left or seat-right slot for each actor.');
    ids.add(actor.id); characters.add(actor.character); slots.add(actor.slot);
  }
  if (!Array.isArray(scene.beats) || !scene.beats.length || scene.beats.length > 40) throw new Error('Use 1 to 40 dialogue/pause beats.');
  const beatIds = new Set(); let total = 0;
  scene.beats.forEach((beat, index) => {
    const path = `beats[${index}]`;
    allowed(beat, beat?.type === 'pause' ? ['id','type','durationMs'] : beat?.type === 'sound' ? ['id','type','sound'] : ['id','type','actor','text','expression','lookAt','afterMs','listener','vocal'], path);
    if (typeof beat.id !== 'string' || !beat.id || beatIds.has(beat.id)) throw new Error(`${path}: use a unique beat ID.`);
    beatIds.add(beat.id);
    if (beat.type === 'pause') { milliseconds(beat.durationMs, path); return; }
    if (beat.type === 'sound') { if (scene.version !== '0.2' || !soundNames.includes(beat.sound)) throw new Error(`${path}.sound: choose ${soundNames.join(', ')} in version 0.2.`); return; }
    if (beat.type !== 'say' || !ids.has(beat.actor)) throw new Error(`${path}: use say and an actor ID from cast.`);
    if (typeof beat.text !== 'string' || !beat.text.trim()) throw new Error(`${path}.text: add spoken words.`);
    if (beat.vocal !== undefined && (scene.version !== '0.2' || typeof beat.vocal !== 'string' || !Object.hasOwn(recordedVocals,beat.vocal))) throw new Error(`${path}.vocal: use hmm in version 0.2.`);
    if (beat.vocal && beat.text !== recordedVocals[beat.vocal].text) throw new Error(`${path}.text: the recorded hmm caption must be "Hmm?".`);
    total += beat.text.length;
    if (beat.expression !== undefined && !Object.hasOwn(expressions, beat.expression)) throw new Error(`${path}.expression: use neutral, happy, curious or concerned.`);
    if (beat.lookAt !== undefined && beat.lookAt !== 'viewer' && (!ids.has(beat.lookAt) || beat.lookAt === beat.actor)) throw new Error(`${path}.lookAt: choose another actor or viewer.`);
    if (beat.afterMs !== undefined) milliseconds(beat.afterMs, `${path}.afterMs`);
    if (beat.listener !== undefined) {
      allowed(beat.listener, ['actor','reaction'], `${path}.listener`);
      if (!ids.has(beat.listener.actor) || beat.listener.actor === beat.actor || !['nod','none'].includes(beat.listener.reaction)) throw new Error(`${path}.listener: choose another actor and nod or none.`);
    }
  });
  if (!total || total > 2000) throw new Error('Include dialogue, using at most 2,000 spoken characters.');
  return scene;
}
function currentScene() { const scene = importedScene || parseScript(); return validate({...scene,version:'0.2',stage:$('setting').value,settings:settings()}); }
function count() {
  try { const scene = currentScene(); $('line-count').textContent = `${scene.beats.filter((b) => b.type === 'say').length} spoken lines`; }
  catch { $('line-count').textContent = 'Check script'; }
  renderBeatCards();
}
function scriptText(scene) {
  const cast = new Map(scene.cast.map((actor) => [actor.id,actor]));
  return scene.beats.map((beat) => beat.type === 'pause' ? `Pause: ${beat.durationMs}` : beat.type === 'sound' ? `Sound: ${beat.sound}` : `${names[cast.get(beat.actor)?.character] || 'Claude'} [${beat.expression || 'neutral'}]: ${beat.vocal ? `{${beat.vocal}}` : beat.text}`).join('\n');
}
function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function renderBeatCards() {
  const container = $('beat-cards'); container.replaceChildren();
  let scene;
  try { scene = importedScene || parseScript(); } catch { container.append(element('p','Your source has an error. Open Source to edit it.','hint')); return; }
  const cast = new Map(scene.cast.map((a) => [a.id,a]));
  scene.beats.forEach((beat,index) => {
    const card = element('article',undefined,'beat-card'); card.dataset.index = index;
    const heading = element('div',undefined,'beat-card-heading'); heading.append(element('span',String(index+1),'beat-number'));
    const remove = element('button','×','remove-beat'); remove.type = 'button'; remove.dataset.remove = index; remove.setAttribute('aria-label',`Remove line ${index+1}`);
    if (beat.type === 'say') {
      card.dataset.character = cast.get(beat.actor)?.character;
      const actor = element('select'); actor.dataset.field = 'actor'; actor.setAttribute('aria-label',`Speaker for line ${index+1}`);
      scene.cast.forEach((item) => actor.add(new Option(names[item.character],item.id))); actor.value = beat.actor;
      const expression = element('select'); expression.dataset.field = 'expression'; expression.setAttribute('aria-label',`Expression for line ${index+1}`);
      Object.keys(expressions).forEach((id) => expression.add(new Option(id[0].toUpperCase()+id.slice(1),id))); expression.value = beat.expression || 'neutral';
      heading.append(actor,expression,remove);
      const words = element('textarea'); words.value = beat.text; words.rows = 2; words.maxLength = 2000; words.dataset.field = 'text'; words.setAttribute('aria-label',`Dialogue line ${index+1}`);
      card.append(heading,words);
      if (beat.vocal) { words.readOnly = true; card.append(element('p',`${recordedVocals[beat.vocal].name}. Separate performer; voice selection does not change this clip.`,'hint')); }
    } else {
      card.classList.add('pause-card');
      card.append(element('span',beat.type === 'pause' ? 'Pause' : 'Sound'));
      if (beat.type === 'pause') { const input = element('input'); input.type = 'number'; input.min = 0; input.max = 5000; input.step = 50; input.value = beat.durationMs; input.dataset.field = 'durationMs'; input.className = 'duration'; input.setAttribute('aria-label',`Pause ${index+1} in milliseconds`); card.append(input,element('span','ms')); }
      else { const select = element('select'); soundNames.forEach((name) => select.add(new Option(name,name))); select.value = beat.sound; select.dataset.field = 'sound'; select.setAttribute('aria-label',`Sound for cue ${index+1}`); card.append(select); }
      card.append(remove);
    }
    container.append(card);
  });
}
$('beat-cards').addEventListener('input',(event) => {
  const field = event.target.dataset.field, index = Number(event.target.closest('[data-index]')?.dataset.index);
  if (!field || !Number.isInteger(index)) return;
  const scene = importedScene || parseScript(), beat = scene.beats[index];
  beat[field] = field === 'durationMs' ? Number(event.target.value) : event.target.value;
  if (field === 'actor') { delete beat.listener; delete beat.lookAt; event.target.closest('article').dataset.character = scene.cast.find((a) => a.id === beat.actor)?.character; }
  importedScene = scene; $('script').value = scriptText(scene); stop('Script changed. Ready to play.'); error();
  $('line-count').textContent = `${scene.beats.filter((b) => b.type === 'say').length} spoken lines`;
});
$('beat-cards').addEventListener('click',(event) => {
  const button = event.target.closest('[data-remove]'); if (!button) return;
  const scene = importedScene || parseScript(); scene.beats.splice(Number(button.dataset.remove),1);
  importedScene = scene; $('script').value = scriptText(scene); stop('Line removed.'); count();
});
document.querySelectorAll('[data-editmode]').forEach((button) => button.addEventListener('click',() => {
  const source = button.dataset.editmode === 'source'; $('source-editor').hidden = !source; $('beat-cards').hidden = source;
  document.querySelectorAll('[data-editmode]').forEach((item) => item.setAttribute('aria-pressed',String(item === button)));
}));
function setTextMode(mode) {
  $('stage').dataset.textmode = mode;
  document.querySelectorAll('[data-textmode]').forEach((button) => button.setAttribute('aria-pressed',String(button.dataset.textmode === mode)));
  try { localStorage.setItem('theatre-text-mode',mode); } catch {}
}
document.querySelectorAll('[data-textmode]').forEach((button) => button.addEventListener('click',() => setTextMode(button.dataset.textmode)));
let initialMode = 'story'; try { const saved = localStorage.getItem('theatre-text-mode'); if (['off','subtitles','story'].includes(saved)) initialMode = saved; } catch {}
setTextMode(initialMode);
async function play() {
  stop(''); error();
  let scene;
  try { scene = currentScene(); } catch (reason) { error(reason.message); return; }
  const silent = $('silent').checked;
  const useNeural = $('engine').value === 'neural';
  if (!silent && !useNeural && !supportsSpeech) { error('Speech is unavailable here. Enable Captions only or load neural voices.'); return; }
  const run = new AbortController(); controller = run;
  $('play').textContent = 'Preparing voices…'; $('play').disabled = true;
  $('play').setAttribute('aria-busy','true'); $('stop').disabled = false;
  // Resume both audio contexts directly in the Play gesture, before model downloads
  // or synthesis consume transient user activation. A late resume can wait forever.
  const audioUnlock = !silent ? Promise.all([
    useNeural || scene.beats.some((beat) => beat.vocal) ? neural.unlock() : Promise.resolve(),
    $('effects').checked || $('ambience').checked ? stageSound.unlock() : Promise.resolve()
  ]) : Promise.resolve();
  const cast = new Map(scene.cast.map((actor) => [actor.id, actor]));
  Object.keys(names).forEach((id) => { $(`actor-${id}`).hidden = !scene.cast.some((actor) => actor.character === id); });
  for (const actor of scene.cast) $(`actor-${actor.character}`).style.order = actor.slot === 'seat-left' ? '0' : '1';
  let line = 0; const total = scene.beats.filter((b) => b.type === 'say').length;
  const preparedSpeech = new Map();
  try {
    await audioUnlock;
    if (useNeural && !silent && !neural.client && scene.beats.some((beat) => beat.type === 'say' && !beat.vocal)) {
      if (!await loadNeural(run)) { if (controller === run) stop('Neural loading stopped.'); return; }
    }
    if (run.signal.aborted) throw abortError();
    if (!silent && (useNeural || scene.beats.some((beat) => beat.vocal))) await neural.unlock();
    if (!silent) {
      const voiceBeats=scene.beats.filter((beat) => beat.type === 'say');
      const audioBuffers=new Set(); let preparedBytes=0;
      for (const [index,beat] of voiceBeats.entries()) {
        if (run.signal.aborted) throw abortError();
        message(`Preparing voice cue ${index+1} of ${voiceBeats.length}. The scene starts when every line is ready.`);
        $('play').textContent = `Preparing ${index+1} / ${voiceBeats.length}…`;
        progress(index+1,voiceBeats.length);
        if (beat.vocal) await neural.prepareVocal(beat.vocal,run.signal);
        else if (useNeural) {
          const actor=cast.get(beat.actor);
          const messages=await neural.prepare(beat.text,$(`voice-${actor.character}`).value,Number($('rate').value),run.signal);
          for (const response of messages) {
            const audio=response.data?.audio;
            if (audio && !audioBuffers.has(audio)) { audioBuffers.add(audio); preparedBytes+=audio.length*audio.numberOfChannels*4; }
          }
          if (preparedBytes>24*1024*1024) throw new Error('This scene needs too much prepared audio. Shorten the dialogue or use fewer lines.');
          preparedSpeech.set(beat.id,messages);
        }
      }
      if (run.signal.aborted) throw abortError();
    }
    if (!silent && ($('effects').checked || $('ambience').checked)) {
      const sounds = $('effects').checked ? scene.beats.filter((beat) => beat.type === 'sound').map((beat) => beat.sound) : [];
      const ready = await stageSound.ready(sounds, $('ambience').checked ? $('setting').value : null);
      if (!ready) throw abortError();
      if (run.signal.aborted) throw abortError();
      stageSound.configure(settings());
      if ($('ambience').checked && $('stage').dataset.fire !== 'off') stageSound.startAmbience($('setting').value);
    }
    $('stage').dataset.playing = 'true';
    $('play').disabled = false; $('play').removeAttribute('aria-busy');
    $('play').textContent = 'Restart conversation';
    for (const beat of scene.beats) {
      if (run.signal.aborted) throw abortError();
      if (beat.type === 'pause') { resetActors(); message('A little pause…'); await delay(beat.durationMs * paceScale(), run.signal); continue; }
      if (beat.type === 'sound') {
        const duration = !silent && $('effects').checked ? stageSound.effect(beat.sound) : 0;
        message(`${silent ? 'Silent cue' : 'Sound cue'}: ${beat.sound}`);
        await delay(duration + 80 * paceScale(), run.signal); continue;
      }
      line++;
      progress(line,total);
      const actor = cast.get(beat.actor), other = scene.cast.find((item) => item.id !== actor.id);
      activeExpression = beat.expression || 'neutral'; activeGaze = beat.lookAt || other?.id || 'viewer';
      pose(actor.character, silent ? 'speaking' : 'listening', activeExpression, activeGaze);
      if (other) pose(other.character, 'listening', 'neutral', actor.id);
      if (silent) caption(names[actor.character], beat.text);
      message(`${silent ? 'Caption preview' : 'Playing'} · Line ${line} of ${total}`);
      if (beat.listener?.reaction === 'nod') {
        const listener = cast.get(beat.listener.actor);
        $(`actor-${listener.character}`).classList.remove('nod');
        void $(`actor-${listener.character}`).offsetWidth;
        $(`actor-${listener.character}`).classList.add('nod');
      }
      if (silent) await delay(Math.max(1200, beat.text.split(/\s+/).length * 350), run.signal);
      else if (beat.vocal) {
        await neural.vocal(beat.vocal,run.signal,
          () => { caption(names[actor.character],beat.text); stageSound.duck(true); pose(actor.character,'speaking',activeExpression,activeGaze); message('Recorded vocal · esperar · CC0'); },
          (shape,energy) => { if (controller === run) mouth(actor.character,shape,energy); },Number($('voice-volume').value));
      } else if (useNeural) {
        await neural.speak(beat.text, $(`voice-${actor.character}`).value, Number($('rate').value), run.signal,
          () => {
            caption(names[actor.character],beat.text); stageSound.duck(true); pose(actor.character, 'speaking', activeExpression, activeGaze); message(`Neural speech · Line ${line} of ${total}`);
          },
          (shape,energy) => { if (controller === run) mouth(actor.character,shape,energy); }, Number($('voice-volume').value),highlightWord,preparedSpeech.get(beat.id));
      } else await speak(beat.text, actor.character, run.signal);
      resetActors();
      await delay((beat.afterMs ?? 250) * paceScale(), run.signal);
    }
    if (controller === run) {
      controller = null; resetActors(); stageSound.stop(); $('stage').dataset.playing = 'false'; $('play').textContent = 'Play again'; $('stop').disabled = true;
      $('line-progress').textContent = 'Finished'; highlightWord(-1); message('Finished. Change a line or play it again.');
    }
  } catch (reason) {
    if (controller !== run) return;
    stop('Playback stopped.');
    if (reason.name !== 'AbortError') error(reason.message || 'Playback failed. Try Captions only.');
  }
}
function populateVoices() {
  if ($('engine').value === 'neural') return;
  voices = supportsSpeech ? synth.getVoices() : [];
  const score = (v) => (/^en\b/i.test(v.lang) ? 100 : 0) + (/natural|neural|online/i.test(v.name) ? 50 : 0) + (/Google (US|UK) English/i.test(v.name) ? 25 : 0) - (/Microsoft (David|Zira|Mark) Desktop/i.test(v.name) ? 20 : 0);
  voices.sort((a,b) => score(b) - score(a));
  const preferred = voices.filter((v) => /^en\b/i.test(v.lang));
  for (const [index, id] of Object.keys(names).entries()) {
    const select = $(`voice-${id}`), previous = savedVoicePrefs.voiceIds?.device?.[id] || select.value;
    select.replaceChildren(new Option('Device default (English requested)', ''));
    for (const voice of voices) select.add(new Option(`${voice.name} · ${voice.lang}${voice.localService ? ' · device' : ' · online'}`, voice.voiceURI));
    if (voices.some((v) => v.voiceURI === previous)) select.value = previous;
    else if (preferred.length) select.value = preferred[index % preferred.length].voiceURI;
  }
  if (!controller) message(!supportsSpeech ? 'Speech is unavailable. Captions only is enabled.' : voices.length ? `${voices.length} browser voices available. Press Play to begin.` : 'No voices listed yet. Try Play with the device default, or use Captions only.');
}
$('play').addEventListener('click', play);
$('stop').addEventListener('click', () => stop());
$('script').addEventListener('input', () => { stop('Script changed. Ready to play.'); importedScene = null; error(); count(); });
$('load-example').addEventListener('click', () => {
  stop('Hello example loaded.'); importedScene = null; $('script').value = example;
  Object.keys(names).forEach((id) => { $(`actor-${id}`).hidden = false; }); error(); count();
});
document.querySelectorAll('[data-insert]').forEach((button) => button.addEventListener('click', () => {
  stop('Line added.'); importedScene = null;
  $('script').value += `${$('script').value.trim() ? '\n' : ''}${button.dataset.insert}`;
  $('script').focus(); count(); error();
}));
for (const id of ['voice-claude','voice-gpt','pitch-claude','pitch-gpt','rate','silent']) $(id).addEventListener('change', () => { stop('Voice settings changed. Ready to play.'); saveVoicePreferences(); });
function applyVoiceEngine(persist = true) {
  const useNeural = $('engine').value === 'neural';
  for (const [index, id] of Object.keys(names).entries()) {
    $(`pitch-${id}`).disabled = useNeural;
    $(`pitch-${id}`).closest('label').classList.toggle('pitch-hidden',useNeural);
    if (useNeural) {
      $(`voice-${id}`).replaceChildren(...neuralVoices.map((v) => new Option(v.name, v.id)));
      const saved = savedVoicePrefs.voiceIds?.neural?.[id];
      $(`voice-${id}`).value = neuralVoices.some((voice) => voice.id === saved) ? saved : index ? 'am_michael' : 'af_heart';
    }
  }
  if (!useNeural) populateVoices();
  $('tone').disabled = !useNeural;
  $('voice-note').textContent = useNeural ? 'Claude starts with Heart, a female Kokoro voice. Compare Bella, Nicole and Sarah with Preview Claude. Mouth shapes follow phoneme timing and the audio energy; recorded vocal cues use their own performer.' : 'Device voices are a fallback and may sound robotic. Choose Kokoro for neural speech and audio-based mouth timing.';
  if (persist) saveVoicePreferences();
}
$('engine').addEventListener('change', () => { stop('Voice engine changed. Ready to play.'); applyVoiceEngine(); });
async function loadNeural(run = null) {
  const ownRun = !run;
  if (ownRun) { stop('Loading neural voices…'); run = new AbortController(); controller = run; $('stop').disabled = false; }
  error(); $('load-neural').disabled = true;
  try {
    await neural.load((text) => { if (controller === run) message(text); });
    if (run.signal.aborted || controller !== run) return false;
    $('engine').value = 'neural'; applyVoiceEngine();
    $('load-neural').textContent = 'Neural voices loaded'; message('Neural voices ready. Press Play to generate your lines.');
    return true;
  } catch (reason) {
    if (run.signal.aborted || controller !== run) return false;
    error(`Could not load neural voices: ${reason?.message || String(reason)}. Device voices remain available.`);
    message('Neural loading failed. Retry or choose Device voices. No fallback voice was played.');
    return false;
  } finally {
    $('load-neural').disabled = false;
    $('load-neural').textContent = neural.client ? 'Neural voices loaded' : 'Load neural voices';
    if (ownRun && controller === run) { controller = null; $('stop').disabled = true; }
  }
}
$('load-neural').addEventListener('click', () => loadNeural());
$('preview-claude').addEventListener('click', () => previewVoice('claude'));
$('preview-gpt').addEventListener('click', () => previewVoice('gpt'));
$('preview-vocal').addEventListener('click', async () => {
  stop('Recorded vocal preview…'); error();
  const run = new AbortController(); controller = run; $('stop').disabled = false;
  try {
    await neural.vocal('hmm',run.signal,
      () => { caption('Claude · recorded cue','Hmm?'); pose('claude','speaking','curious'); },
      (shape,energy) => { if (controller === run) mouth('claude',shape,energy); },Number($('voice-volume').value));
    if (controller === run) { controller = null; resetActors(); $('stop').disabled = true; message('Recorded hmm preview finished · esperar · CC0.'); }
  } catch (reason) { if (controller === run) { stop('Preview stopped.'); if (reason.name !== 'AbortError') error(reason.message); } }
});
async function previewVoice(character) {
  stop('Voice preview…'); error(); const run = new AbortController(); controller = run; $('stop').disabled = false;
  activeExpression = 'happy'; activeGaze = 'viewer';
  let text = `Hello! I'm ${names[character]}. Come and sit by the fire, and tell me what you've been thinking about today.`;
  try { const scene = currentScene(); const actor = scene.cast.find((a) => a.character === character); text = scene.beats.find((b) => b.type === 'say' && !b.vocal && b.actor === actor?.id)?.text || text; } catch {}
  try {
    if ($('engine').value === 'neural') {
      if (!neural.client && !await loadNeural(run)) { if (controller === run) stop('Voice preview stopped.'); return; }
      if (run.signal.aborted) throw abortError();
      await neural.speak(text, $(`voice-${character}`).value, Number($('rate').value), run.signal, () => { caption(names[character],text); pose(character, 'speaking', 'happy'); stageSound.duck(true); message(`Playing ${names[character]} · ${$(`voice-${character}`).selectedOptions[0]?.textContent}`); }, (shape,energy) => { if (controller === run) mouth(character,shape,energy); },Number($('voice-volume').value),highlightWord);
    }
    else if (supportsSpeech) await speak(text, character, run.signal);
    else throw new Error('No device speech engine is available.');
    if (controller === run) { controller = null; resetActors(); $('stop').disabled = true; message('Voice preview finished.'); }
  } catch (reason) { if (controller === run) { stop('Preview stopped.'); if (reason.name !== 'AbortError') error(reason.message); } }
}
$('rate').addEventListener('input', () => { $('rate-value').value = `${Number($('rate').value)}×`; });
function updateTone() {
  neural.tone = Number($('tone').value);
  $('tone-value').value = neural.tone === 0 ? 'Neutral' : `${Math.round(Math.abs(neural.tone)*100)}% ${neural.tone > 0 ? 'warmer' : 'brighter'}`;
}
$('tone').addEventListener('input',updateTone);
$('tone').addEventListener('change', () => { stop('Tone changed. Replay a line to hear it.'); saveVoicePreferences(); });
document.querySelectorAll('[data-delivery]').forEach((button) => button.addEventListener('click', () => {
  stop('Delivery preset applied. Preview a voice to hear it.');
  const preset = {calm:[.9,.5],natural:[1,0],lively:[1.1,-.2]}[button.dataset.delivery];
  $('rate').value = preset[0]; $('rate-value').value = `${preset[0]}×`; $('tone').value = preset[1];
  updateTone(); saveVoicePreferences();
}));
$('still').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('still').addEventListener('change', () => { document.body.classList.toggle('still', $('still').checked); closeMouths(); });
document.body.classList.toggle('still', $('still').checked);
$('download').addEventListener('click', () => {
  try {
    const scene = currentScene();
    const url = URL.createObjectURL(new Blob([JSON.stringify(scene, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'hello.scene.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); error(); message('Scene saved. Device voice choices are not embedded.');
  } catch (reason) { error(reason.message); }
});
$('upload').addEventListener('change', async (event) => {
  stop('Opening scene…');
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 16384) throw new Error('Choose a scene JSON file smaller than 16 KB.');
    const scene = validate(JSON.parse(await file.text()));
    importedScene = scene;
    $('script').value = scriptText(scene);
    applySettings(scene);
    error(); count(); message('Scene opened. Directions are preserved until you edit the script; editing uses basic dialogue defaults.');
  } catch (reason) { error(reason.message); message('Could not open scene. Your previous script is preserved.'); }
  event.target.value = '';
});
// Explicitly started playback continues when switching between chat and the stage.
// Stop, page navigation and edits still cancel the active run.
window.addEventListener('pagehide', () => stop(''));
for (const id of ['setting','pace','ambience','effects']) $(id).addEventListener('change', () => { stop('Scene settings changed. Ready to play.'); updateStage(); });
for (const id of ['voice-volume','effects-volume','ambience-volume','sound-pitch','light']) $(id).addEventListener('input', updateStage);
document.querySelectorAll('[data-sound]').forEach((button) => button.addEventListener('click', async () => {
  stop(''); error();
  try {
    if (!await stageSound.ready([button.dataset.sound])) return;
    stageSound.configure(settings()); stageSound.effect(button.dataset.sound);
    message(`Previewing ${button.dataset.sound} · uisfx Zen pack.`);
  } catch (reason) { error(reason.message || 'Sound could not start. Check your browser audio settings.'); }
}));
$('preview-ambience').addEventListener('click', async () => {
  stop(''); error();
  const run = new AbortController(); controller = run; $('stop').disabled = false;
  try {
    const ready = await stageSound.ready([], 'campfire');
    if (!ready || run.signal.aborted) throw abortError();
    stageSound.configure(settings()); stageSound.startAmbience('campfire');
    $('stage').dataset.playing = 'true'; message('Previewing the recorded fireplace · 5 seconds.');
    await delay(5000, run.signal);
    if (controller === run) stop('Fireplace preview finished.');
  } catch (reason) {
    if (controller === run) {
      stop('');
      if (reason.name !== 'AbortError') error(reason.message || 'Fireplace preview could not start.');
    }
  }
});
updateStage();
if (supportsSpeech) synth.addEventListener('voiceschanged', populateVoices);
$('engine').value = savedVoicePrefs.engine === 'device' ? 'device' : 'neural';
applyVoiceEngine(false); count();
if (!supportsSpeech && $('engine').value === 'device') $('silent').checked = true;
if (Number.isFinite(savedVoicePrefs.rate)) $('rate').value = Math.max(.7,Math.min(1.3,savedVoicePrefs.rate));
if (Number.isFinite(savedVoicePrefs.tone)) $('tone').value = Math.max(-1,Math.min(1,savedVoicePrefs.tone));
for (const id of Object.keys(names)) if (Number.isFinite(savedVoicePrefs.pitch?.[id])) $(`pitch-${id}`).value = Math.max(.85,Math.min(1.15,savedVoicePrefs.pitch[id]));
$('rate-value').value = `${Number($('rate').value)}×`; updateTone();
saveVoicePreferences();
if ($('engine').value === 'neural') message(`Neural speech selected · Claude: ${$('voice-claude').selectedOptions[0]?.textContent}. Press Play or Preview to load voices.`);
setupWorld({stageSound,isPerforming:() => Boolean(controller)});
setupStudio({readScene:currentScene,restoreScene:(scene) => {
  const valid=validate(scene);importedScene=valid;$('script').value=scriptText(valid);
  applySettings(valid);count();
},restoreSource:(source) => {importedScene=null;$('script').value=source;count();}});
