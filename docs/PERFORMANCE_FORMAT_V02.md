# Scene format 0.2: illustrated stages and sound

30 October 2026. Implemented authoring surface on feature/video-theatre, extending the original 0.1 dialogue contract.

Root fields remain format, version, stage, seed, cast, beats and optional targetDurationMs. Version is "0.2". Supported stage IDs are campfire, podcast and room. These are original illustrated 2D environments; existing character PNGs are arranged on them. They are not 3D, seated rigs or physics-based scenes. Earlier 0.1 campfire dialogue files still import.

Optional settings object:

Presentation addition: optional settings.textMode accepts "off", "subtitles" or "story". It controls on-stage dialogue only; silent preview is a separate local playback choice. See THEATRE_DIRECTOR_DESIGN.md for timing behavior.

```json
{
  "pace": "natural",
  "ambience": false,
  "effects": true,
  "voiceVolume": 1,
  "effectsVolume": 0.25,
  "ambienceVolume": 0.2,
  "soundPitch": 1,
  "light": 0.6
}
```

Pace accepts relaxed, natural, snappy and scales inter-line gaps, pause beats and sound-cue waits by 1.5, 1 and 0.6 respectively. Speaking speed is a separate voice control. Volume/light ranges are 0–1; soundPitch is 0.5–1.5. Ambience/effects are booleans. Missing settings use editor defaults. Voice-volume changes apply to subsequent utterances; effects gain/pitch apply to subsequent sounds. Ambience gain and firelight respond while playing.

Sound beat:

```json
{"id": "intro-sound", "type": "sound", "sound": "whoosh"}
```

Allowed sounds: whoosh, pop, tap, chime, click, success. The editor equivalent is Sound: whoosh. Effects are original procedural Web Audio synthesis, with no sample pack. A sound beat starts its sound and waits 400 ms times the pace factor; longer tails may overlap following speech and are softened while speaking. This first version uses serial cues rather than claiming animation-contact synchronization. Captions-only mode and the effects toggle suppress script sounds. Sound palette previews are explicit user actions and work separately from that toggle.

Ambience is optional synthesized filtered noise, a stylized texture rather than a real fire recording. Campfire and podcast use different filtering; room is silent. It starts only on playback, ducks under speech and ends on Stop/completion/background-tab cancellation. The simple firelight/flame animation runs during playback and respects reduced motion.

Agent instructions should use canonical character IDs and supported actions only. Community-created characters, Among Us-style characters, walking, custom recordings, detailed cue editing and video export are not implemented. No arbitrary code runs from imported JSON. Existing parse limits, plain-text rules and actor/beat reference checks remain.

Credits: HeadTTS/Kokoro supply neural speech under their respective licenses; Openverse, Clipwing Real SFX and earshot are linked as workflow references. Their code, models and recordings are not part of this sound implementation.
