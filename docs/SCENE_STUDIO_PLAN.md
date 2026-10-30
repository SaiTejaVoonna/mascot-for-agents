# Scene Studio: dialogue becomes a performance

Planning note, 30 October 2026. Proposed direction, not implemented functionality.

Latest implementation direction: [THEATRE_PLATFORM_PLAN.md](THEATRE_PLATFORM_PLAN.md). It specifies the talking Hello milestone, a consistent 3D theatre, campfire/snow/park stages, public agent scene files and community pack interfaces. Its decisions supersede the initial 2D-first stage shortlist below.

## Vision

A small browser scene studio for short conversations, podcast clips, reels and animated stories. An agent or person chooses an approved setting, characters, dialogue, voice tracks and stage directions. The browser plays the result using a shared character and scene engine.

The first version remains a simple webpage. Generation can happen in an external agent's environment through a skill, command-line tool or voice-provider adapter. Playback runs in the browser from a portable scene bundle.

## Simple user flow

1. Pick a setting.
2. Pick two characters.
3. Paste or write a short conversation.
4. Choose existing voice tracks or provide recordings.
5. Press Play; optionally choose portrait or landscape framing.

Keep advanced timing and rig controls inside presets initially.

## Start with three authored scenes

- Campfire: two seated characters, fire, warm light and restrained listening reactions.
- Podcast desk: microphones, speaker/listener framing and a clean caption area.
- Riverside: two characters, water, breeze and a calm ambient sound bed.

Mountain, field, cafe, train, rooftop, space and weather variants follow by reusing background layers, prop slots, lighting, camera layouts and ambience. A combination is not automatically a finished template; curate the variants that read well and frame the actors properly.

## What makes the scene believable

- One audio clock drives the timeline, captions and mouth cues.
- The listener looks, blinks and reacts while the speaker talks.
- Authored turn-taking, pauses and emphasis create conversational rhythm.
- Gestures match the line and the emotion; their range respects the character's rig.
- Seated/standing positions preserve contacts, proportions and the existing character design.
- Ambient sound is quiet and optional; camera changes follow the conversation.
- Precise lip sync needs suitable timing/phoneme data, not a timer that randomly opens the mouth.

Use stylized 2D characters and scenes first. Human or anime-style actors need their own approved, reusable character packs with face, mouth, gaze, body and gesture definitions.

## The engine

Keep five clear responsibilities:

1. Scene loader: validates the scene specification and resolves approved assets.
2. Timeline: schedules lines, pauses, reactions and camera cues from a shared clock.
3. Character runtime: renders the existing rig and approved actions, with interruptible state transitions.
4. Audio adapter: provides recorded or generated audio and timing metadata.
5. Player: Play, Pause, Replay, captions, volume and framing.

A lightweight Canvas 2D player can reuse the planned companion runtime. A visual rig tool such as Rive is an optional alternative. Remotion is an optional later path for frame-based compositions and video export, rather than a prerequisite for the first working scene.

## Agent integration and reproducibility

An agent skill teaches the scene schema, character identities, allowed actions, timing rules and quality checks. A CLI usable from PowerShell or Bash prepares the scene bundle and calls configured voice tools in the agent's environment. Shell commands run there; the browser player reads the resulting data and media.

Generate a checked scene specification for the trusted player. New rendering code is a separate reviewed contribution. Version the scene schema, character packs, templates and audio. A fixed seed controls permitted gesture variations. This lets compatible agents recreate the same character design and performance direction without inventing new artwork for every frame.

Proposed bundle:

```text
scene.json
audio/actor-a-line-1.wav
audio/actor-b-line-1.wav
timing/lines.json
assets/manifest.json
```

Illustrative scene specification, not a current API:

```json
{
  "version": 1,
  "template": "campfire-evening",
  "seed": 42,
  "actors": [
    {"id": "a", "character": "claude", "voice": "voice-a"},
    {"id": "b", "character": "gpt", "voice": "voice-b"}
  ],
  "dialogue": [
    {"speaker": "a", "text": "We shipped it.", "emotion": "relieved"},
    {"speaker": "b", "text": "Time for marshmallows.", "emotion": "happy"}
  ],
  "output": {"aspectRatio": "9:16", "captions": true}
}
```

## Voices

Support uploaded human recordings and licensed provider voices through one adapter interface. An optional provider plugin or MCP tool returns audio and, where available, timing data. Generation happens in the configured host environment; the scene player can remain provider-independent and play prepared audio files on static hosting.

Browser speech synthesis can serve a quick draft preview, but available voices and delivery vary by device. For a repeatable finished performance, use prepared audio and suitable timing metadata. The first audio playback begins with a user action.

## First milestone

One campfire conversation, two existing mascots, a short script, prepared audio, captions, simple mouth cues and one listening reaction. Play/Pause/Replay must work before expanding the template library.

Next: the podcast and river scenes, portable scene loading, an agent skill/CLI, then short-video export. A small number of working scenes is the foundation for a larger curated template library.

## Additional ideas that reuse the same engine

- Branching conversations: choose the next line and continue the scene.
- Two performances of one script: calm conversation and playful conversation.
- A small task report acted out by the mascots, driven by actual task results supplied by the host.
- Interview and explainer presets with an active listener and timed captions.
- Scene postcards: a short shareable conversation with saved character and environment settings.

## References checked

- Remotion Player: https://www.remotion.dev/docs/player/
- ElevenLabs TTS and linked MCP integration: https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- Browser speech synthesis: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
- Rive state machines: https://rive.app/docs/editor/state-machine/state-machine
