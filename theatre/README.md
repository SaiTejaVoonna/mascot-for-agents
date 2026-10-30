# Hello Studio

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
