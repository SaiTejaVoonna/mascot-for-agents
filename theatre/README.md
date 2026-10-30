# Hello Studio

## Coded campfire world

The campsite is interactive: choose Claude or GPT, tap its ground to move, or focus the world and use arrow keys. Sit by fire returns the selected character to a stool in a stylized rest pose; Stand up, Wave, Put fire out / Light fire and Reset places provide quick actions. These controls work without loading speech. Exploration state is temporary and is not embedded in scene JSON. See `world-interactions.js` for the transform-based movement and ground constraints.

The campfire stage now uses an original SVG space outpost: flat outlined scenery, tent, landing pod, supplies, stools and a shared ground plane around the live fire. It replaces the raster forest in this stage. World geometry and proportional placement are editable in [the SVG](assets/campfire-outpost.svg) and world.css. Voice choices remain unchanged. See [world design notes](../docs/THEATRE_WORLD.md). This is a 2D set, with standing character artwork and existing dialogue playback.

## Speech and mouth update

Neural speech is now the initial engine, with female Heart for Claude and Bella/Nicole/Sarah alternatives. Device voices remain an explicit fallback. Mouth animation combines generated phoneme timing with the actual audio envelope and output-clock latency estimates; silence closes the speaking mouth. Play prepares neural dialogue before the scene starts, showing progress, so generation does not interrupt the conversation. A separately performed, credited CC0 female hmm is available as an optional cue. See [speech details and limitations](../docs/THEATRE_SPEECH.md). These are Kokoro voices; the sound-design skills do not contain a replacement TTS model.

## Prepared sound update

The player now uses Real SFX's bundled uisfx Zen cues (CC0) and a public-domain fireplace recording, prepared with real-sound functions and measured with earshot's model-free path. This replaces the procedural effects and filtered-noise ambience described in older notes below. Fire ambience is enabled by default for new campfire scenes, starts only on Play, ducks under speech and fades on Stop. A five-second fire audition does not need the speech model. Podcast/room have no background recording yet.

See [audio preparation](../docs/THEATRE_AUDIO.md), [credits](assets/audio/CREDITS.md), and [asset measurements](assets/audio/measurements.json). Skills/runtime are installed in the agent workspace, not in the visitor's browser. Global skill registration and earshot's larger analysis models are not installed. This is an effects/ambience change; it does not replace or improve the speech model.

## Director layout

A wide scene with a new original generated twilight background, smaller grounded mascot layers, compact Dialogue/Source editing and collapsed settings replaces the earlier oversized rehearsal layout. Off/Subtitles/Story text controls stage typography separately from Silent preview. Neural captions start with actual audio; active words use provided timing, with approximate fallback when unavailable. Text mode is included in scene 0.2 settings. See docs/THEATRE_DIRECTOR_DESIGN.md.

## Voice tuning

Heart/Michael are now the initial neural voice pair; Bella/Fenrir remain selectable. This is an alternative to audition, not a measured quality claim. Calm/Natural/Lively presets adjust speed and a modest audio EQ tone value. A Brighter–Warmer slider applies low/high shelves to neural playback without changing vocal pitch, duration or mouth timing. It does not infer emotions or create a different voice model. Unsupported neural pitch sliders are hidden.

Voice audition now reads the first actual script line for that actor. A six-entry/24 MiB session cache reuses generated audio for the same text, voice and speed, allowing tone/volume comparisons without regenerating it. Cache is in memory only; reload clears it. Changing voice or speed requires new generation.

Engine choice, voice IDs, rate, tone and device pitch stay in localStorage when available. A remembered neural preference loads on the next Play/Preview action rather than silently playing a device voice. Page load itself does not download the model. These voice preferences remain browser-local and are not serialized into scene 0.2. Preview and full playback share voice-volume handling.

These earlier tuning changes did not have an audio-quality review when implemented. The sound tools now prepare effects and ambience; they do not provide replacement speech synthesis.

## Little Theatre: first scene version

The current stage selector offers an illustrated campfire, a podcast room and the original rehearsal room. These are original HTML/CSS/SVG environments around the existing 2D mascots. Character rigging, walking and 3D environments remain future work.

Conversation pace is separate from speaking speed. Prepared effects (whoosh/pop/tap/chime/click/success), fireplace ambience, volume controls, effect pitch and firelight are editable. Sound: whoosh adds a serial effect cue to the script. Ambience ducks under dialogue. Credits now identify the actual bundled recordings/cues, rather than linking to the tools only as references.

New saves use scene format 0.2, including scene and sound settings. Earlier 0.1 imports remain supported. See docs/PERFORMANCE_FORMAT_V02.md and theatre/examples/podcast.scene.json. Voice choices and generated speech are still not embedded in exported files.

The neural playback path was subsequently exercised in Chrome: all four Hello lines completed with Bella/Fenrir, and Stop followed by another audition completed. These observations preceded the scene/sound extension. New scene/sound behavior has not had a full playback or device review in this implementation turn.

## Voice and mouth update

Device voice selection now prioritizes English candidates with Natural/Neural/Online or Google English names over legacy desktop voices. This is a naming heuristic, not an audio quality measurement. Separate voice audition buttons and modest pitch controls help choose delivery. Pitch controls do not turn an old voice into a neural voice.

The active mascot gets a small canvas mouth overlay: timed speech-activity shapes with optional word-boundary updates in device mode. These are approximate, not phoneme alignment. Reduced movement disables the overlay; idle and Stop restore the original artwork. Mouth placement follows the existing render's face layout and needs visual review across expressions.

An optional experimental HeadTTS/Kokoro adapter dynamically imports @met4citizen/headtts@1.3 only when Load neural voices is selected. It uses WebGPU with WASM fallback, q8 model precision, a separate worker and generated audio buffers with model viseme timing. Four voice choices are exposed. This path has not been loaded or benchmarked in this change; it may be slow or fail on limited devices. The UI explains the substantial model download before activation. Code/dictionaries come from jsDelivr, model/voice files from Hugging Face. No application voice API key or generation server is used. Dependency-provided assets are cached according to their runtime behavior; offline readiness is not promised.

HeadTTS source and documentation: https://github.com/met4citizen/HeadTTS (MIT). Its Kokoro model/runtime dependencies have their own notices, including Apache-2.0; no upstream source or model weights are vendored in this repository. HeadTTS does inference; the local adapter owns playback and maps mouth cues to simplified mascot shapes. Neural pitch adjustment is disabled rather than claiming unsupported control.

Original prototype verification observed device voice sequencing, completion, Stop, captions-only mode and invalid-input feedback in Chrome on 30 October 2026. Those checks predate this update. New mouth positioning and the neural adapter have not been tested in this implementation turn.

First 2D rehearsal prototype on feature/video-theatre. Open theatre/ through an HTTP server rooted at this repository. No build step or third-party JavaScript dependency is required.

Example local serving command from the repository root:

```text
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/theatre/.

## Implemented

- Existing Claude and GPT artwork, speaking/listening states, four expressions and a restrained optional nod.
- Simple English screenplay editor: Claude [happy]: Hello!, GPT: Hi!, Pause: 400.
- Browser speech synthesis with separate actor voice selection and shared speaking speed.
- Captions-only preview using estimated reading time, clearly separate from speech completion timing.
- Serial speech sequencing from completion callbacks, Stop/Restart cancellation, stale-run protection and a voice timeout.
- JSON import/export for the supported 0.1 seated-dialogue contract. Unknown fields and unsupported actors/actions produce errors.
- Imported directions remain in memory until text editing replaces them with basic editor defaults; the UI explains this behavior.
- Hidden pages stop playback, reduced-motion support and plain-text captions.

## Limitations

These are illustrated 2D stages, not the planned 3D theatre. Walking/sitting transitions are not implemented. Character lean only approximates attention; simplified neural mouth shapes do not reproduce a full facial rig.

Browser voices vary by device; some are network services. No promise of offline speech, emotional voice delivery, audio export, exact duration or cross-device voice consistency. Browser speech is not captured into an audio file. Use Stop/Restart; precise Pause/Resume and seeking are intentionally absent from this draft-speech player.

The 30-second target is advisory in this prototype; it is not measured or enforced. A prepared-audio compiler is still needed to resolve duration and mouth cues. JSON input is capped at 16 KB; dialogue at 2,000 characters and 40 beats. One instance of each existing mascot is supported.

No new dependency installation, automated tests or browser QA was performed for this implementation task. Runtime speech, device layout and accessibility need user verification. The public gallery on main remains unchanged.
