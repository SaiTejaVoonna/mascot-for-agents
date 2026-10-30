# Theatre audio credits

## UI cues

Whoosh, pop, tap, chime, click and success are edits of the Zen pack in **uisfx 0.4.0**, by Yuki Capital / Romain Simon, supplied by the **Real SFX** skill.

- Library: https://github.com/romainsimon/uisfx
- Skill: https://clipwing.pro/skills/real-sfx
- Audio license: CC0-1.0. See UISFX-LICENSE-AUDIO.txt.
- Upstream cues: swipe, reaction, press, notification, select, success.
- These are produced, synthesized UI sounds, not field recordings. They replace our earlier oscillator/noise implementations.
- Edits: mono duplication where needed, DC removal, peak ceiling, short edge fades and MP3 encoding. Each source/output hash is in manifest.json.

## Fireplace ambience

**Dry grass burning in open fireplace**, by **ezwa**, originally PDSounds (17 June 2007), via Wikimedia Commons.

- Source and license: https://commons.wikimedia.org/wiki/File:Dry_grass_burning_in_open_fireplace.ogg
- License: author dedicated the recording to the public domain; the source page includes a worldwide permission fallback.
- Original SHA-1: 641163a91e9bd87d0f3f4d4b10e75b99f74afcec.
- Edits: 2–22 second excerpt, 80–6500 Hz filtering, loudness preparation using real-sound, 500 ms overlap for looping, MP3 encoding. Final duration: 19.5 seconds.
- This is a fireplace recording used for the illustrated campfire; it is not described as an outdoor campfire recording.

## Female vocal cue

**Hmm question.wav**, by **esperar**, Freesound, 30 November 2012. Optional female vocal recording, not a cloned or matched TTS voice.

- Source and license: https://freesound.org/people/esperar/sounds/170768/
- License: CC0-1.0.
- Edition: public HQ MP3 preview at https://cdn.freesound.org/previews/170/170768_377731-hq.mp3 . The original WAV requires login and was not downloaded.
- Edits: 48 kHz stereo decode, DC removal, peak adjustment, edge fades and MP3 encoding. Source/output hashes are in manifest.json.
- The performer differs from Kokoro's voices. Choosing another voice does not change this recording. It plays only when explicitly auditioned or included as a vocal cue.

## Preparation and measurements

[real-sound](https://github.com/Leonxlnx/earshot/tree/main/skills/real-sound) supplied edge-fade and mastering functions. [earshot 0.4.0](https://github.com/Leonxlnx/earshot) supplied model-free asset measurements (`features.measure(light=True)`). Their MIT-licensed source runs in the agent's workspace; it is not needed by site visitors. No earshot analysis models or speech models were added to the sound pack.

Openverse discovery was attempted, but its API timed out. The fire recording was downloaded directly from its licensed Wikimedia source. No successful Openverse search is claimed.

measurements.json covers the individual encoded assets. It does not certify the live speech mix, perceptual quality, or frame synchronization. Dialogue still uses the separately configured Kokoro/device speech engine.
