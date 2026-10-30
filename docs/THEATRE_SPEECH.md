# Speech and vocal cues

## Neural speech

Kokoro is now the initial engine. Claude starts with female **Heart**, with **Bella, Nicole and Sarah** available to audition. GPT starts with male **Fenrir**; Michael and Puck are also available. Saved explicit choices are preserved. HeadTTS is pinned to 1.3.0. These are Kokoro voices, not new speech models supplied by the sound-effect skills.

Play/Preview loads the model on demand. Failed loading never silently plays a device voice. Preferences use `theatre-voice-v2`, replacing the old device-first default; subsequent explicit device selections are respected. Stop invalidates pending playback while a model loads, although the download can finish for later reuse.

The upstream [voice notes](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) describe short-utterance weaknesses, so the example uses longer conversational sentences. Voice grades estimate training-data quality, not subjective listener preference. This does not add native emotions, singing, or human-equivalent speech.

## Mouth and timing

Explicitly started speech/preparation now continues when switching between chat and the browser. Stop, edits and page navigation still cancel it. While hidden, an inexpensive timer advances the audio-clock player because browsers can pause animation frames; returning to the stage restores animation-frame updates. Browser or OS audio policies can still interrupt sound.

The player combines HeadTTS's millisecond phoneme/viseme timing with a cached 10 ms RMS envelope of the actual AudioBuffer. Opening is smoothed; silence closes the mouth; PP retains closed lips; rounded and teeth shapes are distinct. The overlay covers the baked-in mouth during speaking silence. Rest restores the original expression; reduced movement disables the overlay.

Captions and mouth updates use estimated audible output time from `AudioContext.getOutputTimestamp()`, with reported latency as fallback. This cannot guarantee physical synchronization across all Bluetooth/headphone/device paths. It remains a simplified pixel mouth.

Play prepares all neural lines and recorded vocal clips before starting the scene, with progress and Stop available. Each request carries its own voice/speed. Prepared speech for a run is limited to 24 MiB and released when the run ends; the reusable cache remains limited to six entries / 24 MiB, sharing the same buffers where applicable. Initial preparation can take time, but neural generation no longer runs between dialogue lines. Device speech remains live and has no equivalent prepared-audio guarantee.

## Optional recorded hmm

Use **+ Hmm**, **Preview recorded hmm**, or `Claude [curious]: {hmm}`. Scene 0.2 stores it as:

```json
{"id":"thinking","type":"say","actor":"a","text":"Hmm?","vocal":"hmm","expression":"curious","afterMs":250}
```

It plays a real female recording by **esperar**, CC0-1.0, through the same audio-clock player. The source is Freesound's publicly linked HQ MP3 preview, not the login-required original WAV. The performer is separate from Kokoro voices and is not cloned or timbre-matched. The caption must be `Hmm?`. Changing the selected TTS voice does not change the recording. Silent preview mutes it; ordinary dialogue never gains an automatic vocal cue. The sample includes one explicit cue.

JSON accepts only the bundled `hmm` preset, not arbitrary audio URLs. Source/output hashes, edits and earshot asset measurements are in [credits](../theatre/assets/audio/CREDITS.md), [manifest](../theatre/assets/audio/manifest.json) and [measurements](../theatre/assets/audio/measurements.json). Measurements do not constitute a listening or lip-sync quality assessment.

## Credits

- [HeadTTS](https://github.com/met4citizen/HeadTTS), Mika Suominen, MIT: browser speech integration and phoneme timestamps.
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), hexgrad, Apache-2.0: model and voices.
- [Timestamped ONNX conversion](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped), ONNX Community, Apache-2.0.
- [Hmm question.wav](https://freesound.org/people/esperar/sounds/170768/), esperar, CC0-1.0: recorded vocal.

Openverse handles discovery; Real SFX/real-sound prepare effects and recordings; earshot analyzes audio and renders effects. The conversational TTS voices come from Kokoro. Playback remains static-host compatible, with no paid speech API or backend added.
