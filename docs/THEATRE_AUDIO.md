# Prepared browser audio

The theatre now plays prepared assets instead of its former procedural oscillators and filtered-noise bed. Visitors need only the browser. There is no new service, account, paid API or Python requirement for playback.

## What is integrated

- Six uisfx Zen cues bundled with Clipwing's Real SFX skill, CC0-1.0.
- A public-domain fireplace recording by ezwa for the campfire. Podcast and rehearsal room remain quiet rather than using the old synthetic rumble.
- real-sound edge fades and loudness preparation, followed by earshot's lightweight measurements of the encoded assets.
- On-demand decoding, in-memory reuse, actual cue-duration waits, speech ducking and short Stop fades. Stop invalidates pending auditions; a completed download cannot start a cancelled preview.
- A five-second fireplace audition, independent of the speech model. Previews stop the conversation and obey their volume sliders.

The fire source, license, transformations and file hashes are in [audio credits](../theatre/assets/audio/CREDITS.md) and [manifest](../theatre/assets/audio/manifest.json). The source SHA-1 is checked before preparation. Openverse's API timed out; the recording came directly from Wikimedia Commons.

## Workspace setup used

The requested skills are installed under the workspace's `work/audio-tools/skills`: `real-sfx` from Clipwing/skills, and `earshot` plus `real-sound` from Leonxlnx/earshot. Global skill-directory writes were blocked by Windows, so this is a workspace installation, not an automatically registered global Codex skill or MCP server.

An isolated `audio-tools/.venv` contains numpy (from the host), scipy, soundfile, pyloudnorm, imageio-ffmpeg and earshot 0.4.0 installed with `--no-deps`. This is intentionally the **measurement-only path**, not a complete earshot analysis installation. Torch, Transformers, librosa and the larger semantic models are absent; commands that need them will not work. The browser downloads none of these preparation dependencies.

To reproduce after installing the skills and these Python dependencies:

```text
python -I tools/prepare_theatre_audio.py --skills-dir PATH_TO_AUDIO_TOOLS/skills --source PATH_TO_ORIGINAL_FIREPLACE.ogg --vocal-source PATH_TO_HMM_PUBLIC_PREVIEW.mp3
```

Obtain the original Ogg from the source linked in CREDITS.md. The tool prepares MP3 assets and records source/output SHA-256 values, edit notes, and earshot measurements. FFmpeg is provided by imageio-ffmpeg; this preparation path does not require ffprobe. The full upstream Real SFX video CLI and its semantic-analysis runtime have not been configured.

## Review scope

The source licenses were checked and all eight final assets were measured through earshot. The report includes true peak and clipping; file measurements do not establish that a sound is pleasing, appropriate to every scene, or indistinguishable from a recording.

This adapts the skills' asset preparation to a live interactive player. It does not run the full film workflow: no final video, whole-mix mastering, semantic realness/ranking, contact-sheet critique, or frame-accurate rendered-film sync assessment is claimed. Scripted effects remain serial cues between spoken lines. Silent preview mutes speech, cues and ambience. Effect pitch changes playback rate; it does not change speech.

These tools handle sound design and measurement. **They are not voice generators:** Kokoro/device TTS and its current limitations remain separate.
