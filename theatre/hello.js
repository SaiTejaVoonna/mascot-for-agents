const $ = (id) => document.getElementById(id);
const synth = window.speechSynthesis;
const supportsSpeech = Boolean(synth && window.SpeechSynthesisUtterance);
const names = {claude: 'Claude', gpt: 'GPT'};
const expressions = {neutral: 'neutral', happy: 'happy', curious: 'thinking', concerned: 'worried'};
const example = $('script').value;
let voices = [], controller = null, importedScene = null, utterance = null;
const message = (text) => { $('status').textContent = text; };
function error(text = '') { $('error').textContent = text; $('error').hidden = !text; }
function caption(speaker, text) { $('caption-speaker').textContent = speaker; $('caption-text').textContent = text; }
function pose(character, state = 'idle', expression = 'neutral', gaze = 'viewer') {
  const figure = $(`actor-${character}`);
  figure.dataset.state = state;
  figure.dataset.gaze = gaze;
  figure.querySelector('.actor-state').textContent = {idle: 'Ready', speaking: 'Speaking', listening: 'Listening'}[state];
  const image = figure.querySelector('img');
  const path = `../assets/collection/${character}-v5/${expressions[expression] || 'neutral'}.png?v=9`;
  if (image.getAttribute('src') !== path) image.src = path;
}
function resetActors() { Object.keys(names).forEach((id) => { pose(id); $(`actor-${id}`).classList.remove('nod'); }); }
function stop(text = 'Stopped. Ready to start again.') {
  const previous = controller;
  controller = null;
  previous?.abort();
  if (previous && supportsSpeech) synth.cancel();
  utterance = null;
  resetActors();
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
    let settled = false;
    const finish = (reason) => {
      if (settled) return;
      settled = true; clearTimeout(watchdog); signal.removeEventListener('abort', cancel);
      speech.onend = speech.onerror = speech.onstart = null;
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
    speech.onstart = () => { if (!signal.aborted) pose(character, 'speaking', activeExpression, activeGaze); };
    signal.addEventListener('abort', cancel, {once: true});
    try { synth.speak(speech); } catch (reason) { finish(reason); }
  });
}
let activeExpression = 'neutral', activeGaze = 'viewer';
function parseScript() {
  const cast = [
    {id: 'a', character: 'claude', voice: 'warm', slot: 'seat-left'},
    {id: 'b', character: 'gpt', voice: 'bright', slot: 'seat-right'}
  ];
  const beats = $('script').value.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return null;
    const pause = line.match(/^\s*Pause:\s*(\d+)\s*$/i);
    if (pause) return {id: `beat-${index}`, type: 'pause', durationMs: Number(pause[1])};
    const match = line.match(/^\s*(Claude|GPT)(?:\s*\[(neutral|happy|curious|concerned)\])?\s*:\s*(.+)\s*$/i);
    if (!match) throw new Error(`Line ${index + 1}: use Claude: Hello!, GPT [happy]: Hi!, or Pause: 400.`);
    return {id: `beat-${index}`, type: 'say', actor: match[1].toLowerCase() === 'claude' ? 'a' : 'b', text: match[3].trim(), expression: (match[2] || 'neutral').toLowerCase(), afterMs: 300};
  }).filter(Boolean);
  return validate({format: 'mascot-scene', version: '0.1', stage: 'campfire', seed: 42, cast, beats});
}
function allowed(value, keys, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected an object.`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`${path}.${key}: unsupported field.`);
}
function milliseconds(value, path) {
  if (!Number.isInteger(value) || value < 0 || value > 5000) throw new Error(`${path}: use 0 to 5000 milliseconds.`);
}
function validate(scene) {
  allowed(scene, ['format','version','stage','seed','targetDurationMs','cast','beats'], 'scene');
  if (scene.format !== 'mascot-scene' || scene.version !== '0.1') throw new Error('Use mascot-scene format version 0.1.');
  if (scene.stage !== 'campfire') throw new Error('Only the campfire scene contract is supported; this prototype shows the rehearsal room.');
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
    allowed(beat, beat?.type === 'pause' ? ['id','type','durationMs'] : ['id','type','actor','text','expression','lookAt','afterMs','listener'], path);
    if (typeof beat.id !== 'string' || !beat.id || beatIds.has(beat.id)) throw new Error(`${path}: use a unique beat ID.`);
    beatIds.add(beat.id);
    if (beat.type === 'pause') { milliseconds(beat.durationMs, path); return; }
    if (beat.type !== 'say' || !ids.has(beat.actor)) throw new Error(`${path}: use say and an actor ID from cast.`);
    if (typeof beat.text !== 'string' || !beat.text.trim()) throw new Error(`${path}.text: add spoken words.`);
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
function currentScene() { return importedScene || parseScript(); }
function count() {
  try { const scene = currentScene(); $('line-count').textContent = `${scene.beats.filter((b) => b.type === 'say').length} spoken lines`; }
  catch { $('line-count').textContent = 'Check script'; }
}
async function play() {
  stop(''); error();
  let scene;
  try { scene = currentScene(); } catch (reason) { error(reason.message); return; }
  const silent = $('silent').checked;
  if (!silent && !supportsSpeech) { error('Speech is unavailable here. Enable Captions only to preview the conversation.'); return; }
  const run = new AbortController(); controller = run;
  $('play').textContent = 'Restart conversation'; $('stop').disabled = false;
  const cast = new Map(scene.cast.map((actor) => [actor.id, actor]));
  Object.keys(names).forEach((id) => { $(`actor-${id}`).hidden = !scene.cast.some((actor) => actor.character === id); });
  for (const actor of scene.cast) $(`actor-${actor.character}`).style.order = actor.slot === 'seat-left' ? '0' : '1';
  let line = 0; const total = scene.beats.filter((b) => b.type === 'say').length;
  try {
    for (const beat of scene.beats) {
      if (run.signal.aborted) throw abortError();
      if (beat.type === 'pause') { resetActors(); message('A little pause…'); await delay(beat.durationMs, run.signal); continue; }
      line++;
      const actor = cast.get(beat.actor), other = scene.cast.find((item) => item.id !== actor.id);
      activeExpression = beat.expression || 'neutral'; activeGaze = beat.lookAt || other?.id || 'viewer';
      pose(actor.character, silent ? 'speaking' : 'listening', activeExpression, activeGaze);
      if (other) pose(other.character, 'listening', 'neutral', actor.id);
      caption(names[actor.character], beat.text);
      message(`${silent ? 'Caption preview' : 'Playing'} · Line ${line} of ${total}`);
      if (beat.listener?.reaction === 'nod') {
        const listener = cast.get(beat.listener.actor);
        $(`actor-${listener.character}`).classList.remove('nod');
        void $(`actor-${listener.character}`).offsetWidth;
        $(`actor-${listener.character}`).classList.add('nod');
      }
      if (silent) await delay(Math.max(1200, beat.text.split(/\s+/).length * 350), run.signal);
      else await speak(beat.text, actor.character, run.signal);
      resetActors();
      await delay(beat.afterMs ?? 250, run.signal);
    }
    if (controller === run) {
      controller = null; resetActors(); $('play').textContent = 'Play again'; $('stop').disabled = true;
      message('Finished. Change a line or play it again.');
    }
  } catch (reason) {
    if (controller !== run) return;
    stop('Playback stopped.');
    if (reason.name !== 'AbortError') error(reason.message || 'Playback failed. Try Captions only.');
  }
}
function populateVoices() {
  voices = supportsSpeech ? synth.getVoices() : [];
  const preferred = voices.filter((v) => /^en\b/i.test(v.lang));
  for (const [index, id] of Object.keys(names).entries()) {
    const select = $(`voice-${id}`), previous = select.value;
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
for (const id of ['voice-claude','voice-gpt','rate','silent']) $(id).addEventListener('change', () => stop('Voice settings changed. Ready to play.'));
$('rate').addEventListener('input', () => { $('rate-value').value = `${Number($('rate').value)}×`; });
$('still').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('still').addEventListener('change', () => document.body.classList.toggle('still', $('still').checked));
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
    const cast = new Map(scene.cast.map((actor) => [actor.id, actor]));
    $('script').value = scene.beats.map((beat) => beat.type === 'pause' ? `Pause: ${beat.durationMs}` : `${names[cast.get(beat.actor).character]} [${beat.expression || 'neutral'}]: ${beat.text}`).join('\n');
    error(); count(); message('Scene opened. Directions are preserved until you edit the script; editing uses basic dialogue defaults.');
  } catch (reason) { error(reason.message); message('Could not open scene. Your previous script is preserved.'); }
  event.target.value = '';
});
document.addEventListener('visibilitychange', () => { if (document.hidden && controller) stop('Stopped because the page was hidden. Press Play to restart.'); });
window.addEventListener('pagehide', () => stop(''));
if (!supportsSpeech) $('silent').checked = true;
if (supportsSpeech) synth.addEventListener('voiceschanged', populateVoices);
populateVoices(); count();
