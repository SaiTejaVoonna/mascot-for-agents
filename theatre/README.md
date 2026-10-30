# Hello Studio

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

This is a rehearsal room, not the planned 3D campfire. campfire is the saved scene contract ID; there are no rendered campfire assets or walking/sitting transitions yet. Raster expressions and speech-activity movement are not phoneme lip sync. Character lean only approximates attention.

Browser voices vary by device; some are network services. No promise of offline speech, emotional voice delivery, audio export, exact duration or cross-device voice consistency. Browser speech is not captured into an audio file. Use Stop/Restart; precise Pause/Resume and seeking are intentionally absent from this draft-speech player.

The 30-second target is advisory in this prototype; it is not measured or enforced. A prepared-audio compiler is still needed to resolve duration and mouth cues. JSON input is capped at 16 KB; dialogue at 2,000 characters and 40 beats. One instance of each existing mascot is supported.

No new dependency installation, automated tests or browser QA was performed for this implementation task. Runtime speech, device layout and accessibility need user verification. The public gallery on main remains unchanged.
