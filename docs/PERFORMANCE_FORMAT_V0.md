# Performance format 0.1: implementation contract

Draft, 30 October 2026. This is the next implementation specification, not a supported live upload format. It narrows THEATRE_PLATFORM_PLAN.md into a single buildable contract. The accompanying scene and skill are authoring drafts. There is no compiler/player for them yet.

Implementation update: feature/video-theatre now includes theatre/index.html, a 2D Hello Studio prototype with text editing, browser speech, caption preview and JSON import/export. It provides the initial seated-dialogue validation/execution path. Prepared-audio compilation, accurate timing, 3D staging and public main-site deployment remain unimplemented. See theatre/README.md for supported behavior and verification limits; the original specification below records the intended broader contract.

## Decision

Use a **small JSON screenplay** as the language. It captures dialogue, intentional pauses, expressions, gaze and a limited number of reactions. Agents already produce JSON; we do not need a programming-language ecosystem or a new compiler toolchain. A future readable screenplay editor must serialize this same model rather than create a second public language.

Agent responsibility: choose dramatic intent and write the screenplay. Compiler responsibility: resolve media and supported stage/actor capabilities. Runtime responsibility: perform the resolved actions coherently. No agent-generated frame coordinates, guessed speech durations or raw JavaScript in uploaded scenes.

## First experience

1. Copy the skill and a dialogue into a capable agent.
2. Agent returns one .scene.json file, preserving the requested dialogue.
3. Open it on the theatre page; select a compatible stage and voice mapping.
4. Draft mode uses browser speech. Prepared mode uses supplied audio and optional mouth timing.
5. Press Play. The player manages speaking, pauses, listening and returning to rest.

The useful new feature is **automatic staging with explicit overrides**: a person can provide only dialogue. The system supplies conservative speaker/listener behavior. An agent can add performance directions where they improve a particular line. More directions should not be required for a good basic scene.

## Root contract

- format: exactly "mascot-scene".
- version: exactly "0.1".
- stage: pack ID. Prototype allowlist: "campfire". "snow" and "park" are planned; reject them until packs exist.
- seed: integer controlling bounded nonessential variations.
- targetDurationMs: optional positive integer; advisory target, never authority to truncate speech.
- cast: one or two actor entries with unique id, character, voice alias and starting slot.
- beats: ordered list of dialogue or pause beats, at most 40 for the prototype.

Prototype character IDs: "claude" and "gpt". Starting slots: "seat-left" and "seat-right", no duplicate occupancy. Characters begin seated; this contract does not require walking. Voice aliases are user-facing labels resolved to available voices, not universal provider voice IDs.

Draft input limits: 16 KB JSON, 2,000 spoken characters total and no more than two actors. Prepared first-release playback limit: 30 seconds. Longer resolved performances produce a clear edit-required message; they are not cut mid-line. The preview may reveal duration before the author revises. These are proposed defaults to implement, not limits enforced today.

## Beat contract

### Speech

```json
{
  "id": "line-1",
  "type": "say",
  "actor": "a",
  "text": "We finally made it.",
  "expression": "happy",
  "lookAt": "b",
  "afterMs": 350,
  "listener": {"actor": "b", "reaction": "nod"}
}
```

Required fields: id, type, actor, text. Optional expression defaults to neutral; lookAt defaults to the other actor or viewer if alone; afterMs defaults to 250. Listener reaction is optional. All beat IDs are unique. Speaker/listener references resolve to cast IDs. A listener must differ from the speaker.

Initial expressions: neutral, happy, curious, concerned. Initial listener reactions: nod, none. Both are character-specific semantic actions; the renderer owns exact pose and amplitude. Expression does not imply that a voice provider supports emotional delivery. Do not insert audible laughter, sighs or sound effects unless audio is actually supplied for them.

The listener reaction is a single quiet nod shortly after speech begins, using authored timing bounded by the actual line duration. It finishes or blends to rest before the next beat. It is not claimed to match a particular word. Precise cue-relative reactions can be added in a later version.

### Pause

```json
{"id": "breath-1", "type": "pause", "durationMs": 600}
```

Pauses and afterMs use integer milliseconds from 0 to 5,000. Pause beats require id, type and durationMs. Text is plain text, not HTML, SSML or executable instructions. Reject unknown fields with a location and suggestion so spelling mistakes cannot silently change a performance.

## Timing semantics

Beats run serially. A say beat sets expression/gaze, starts its audio and any permitted listener response, then waits for audio completion and afterMs. A pause advances the performance without speech. Idle blinking and gentle listening motion are engine defaults, bounded by character identity and motion preferences.

Prepared mode: load/decode audio, measure duration, resolve every beat to a timeline, then schedule playback and animation from a shared audio clock. Use phoneme/viseme timing if present, otherwise disclose approximate mouth motion. A fixed-duration timeline cannot be known before audio exists.

Draft browser-speech mode: advance on utterance completion/cancellation callbacks, not a guessed text-length timer. Browser speech is not an audio file we can assume can be captured or exported. Timing, voice and callback behavior vary across devices. Draft mode supports Play, Stop and Restart initially; do not promise precise pause/resume or seeking until implemented reliably. Prepared mode adds synchronized Pause/Resume.

During prepared pause freeze the performance clock, sound, mouth and scheduled cues together. Stop cancels all speech/audio/cues, returns actors to initial state and invalidates stale callbacks. Use a playback generation ID to ensure a cancelled utterance cannot advance a restarted scene. A new stage or voice mapping stops playback and requires preparation again.

## Audio sidecar

Keep provider output separate from the authored screenplay:

```json
{
  "format": "mascot-audio",
  "version": "0.1",
  "lines": [
    {"beat": "line-1", "file": "audio/line-1.wav"}
  ]
}
```

Media entries map to beat IDs and match the exact spoken text, voice mapping and generation settings. Compiler cache keys include those values so changed dialogue cannot reuse stale audio. For prepared mode every say beat requires matching audio. Missing lines offer draft mode or an actionable preparation error, not an invisible mixed-mode timing change.

Agent voice connectors can produce this sidecar plus files. Recorded voices use the same mechanism. The first compiler measures duration rather than trusting an agent-provided number. Add a versioned timing sidecar when actual word/viseme integration is implemented.

No paid generation is necessary to read a script or play uploaded audio. Connectors remain optional and may have independent costs. Never describe a voice alias or a skill as a working speech backend.

## Validation and compilation

Input -> parse -> structural schema -> pack/voice compatibility -> media resolution -> timing -> prepared performance -> playback.

Separate errors by phase and include a path, e.g. beats[2].actor: "c" is not in cast. A structurally valid scene is not necessarily playable before required assets/voices resolve. Compilation happens locally in the browser for built-in packs and supplied files. Agent CLI preparation can use the same contract later.

Prepared output is internal at first; avoid promising a stable low-level timeline API before one performance works. Record scene hash, runtime/pack versions, voice mapping and media hashes for reproduction. Seed controls approved variations; audio and versions must also match to reproduce timing.

## One example, one skill, one implementation

Reference author file: ../theatre/examples/campfire-hello.scene.json.

Agent entry point: ../skills/theatre-scene/SKILL.md. It must state draft status until supported by a published player. It should teach this contract and preserve the user's dialogue, not become a general writing/directing manual.

Implementation sequence:

1. Load the reference file into a small demo using existing mascot identity, render captions and run draft speech with Stop/Restart.
2. Add supplied-audio playback and its shared clock. Review actual mouth/speech behavior.
3. Use those lifecycle controls for a real 3D campfire with seated actors.
4. Publish upload support and the validated skill against actual runtime capabilities.
5. Add moveTo/sit/stand, snow/park and community packs through explicit format/capability revisions.

Acceptance scenarios for later verification: a new scene can be made by replacing dialogue alone; an agent can author it from the skill; interrupted speech never leaks into a restart; missing voices/audio have useful fallbacks; keyboard users can operate controls; gallery downloads remain available. No tests are added or run in this documentation task.

## What changes from previous planning

The public authoring format is now concrete, limited and example-backed. The 3D theatre/community direction remains, but the initial language supports seated dialogue only. No giant DSL, walking system, voice marketplace or MCP service is required before Hello works. Subsequent discussion should amend this contract or produce the next implementation rather than restart the roadmap.
