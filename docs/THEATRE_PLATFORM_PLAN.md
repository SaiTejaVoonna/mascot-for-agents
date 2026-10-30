# Agent Theatre: implementation and community plan

Planning decision, 30 October 2026. Proposed features; this document does not ship a runtime, voice service or installable skill.

Next implementation contract: [PERFORMANCE_FORMAT_V0.md](PERFORMANCE_FORMAT_V0.md), with a draft agent skill and example screenplay in the repository. This narrows the first format to seated dialogue, pauses and listener reactions; movement follows later.

## 1. Product decision

We provide the theatre. Agents and people write performances for it.

Build on the existing mascot project, with a separate Theatre entry point and a reusable runtime. Preserve gallery URLs, downloads and original artwork. Start with the existing character identities; add a low-detail 3D stage and deliberately authored character rigs. The existing GIF/WebP collection is reference material and remains useful for reactions; it is not a complete 3D animation rig.

The initial stage family is **campfire, snowy campsite and park**. This updates the earlier podcast/riverside shortlist in SCENE_STUDIO_PLAN.md. A consistent 3D space is the theatre target; a small talking-mascot prototype can use the existing 2D identity before that stage is built. A flat prototype must not be described as finished 3D.

First promise: a person can open an agent-created short scene, select a compatible theme and voice mapping, and play a coherent performance. Target 30 seconds and two actors initially. Actual speech duration determines whether a script fits; never silently speed speech up to force the limit.

## 2. Three ways to use it

| User | Workflow |
| --- | --- |
| Visitor | Open sample, choose theme/voice, press Play |
| Agent user | Give agent a script and our skill; upload its JSON or prepared bundle |
| Community creator | Use the SDK and pack examples to contribute a stage, actor or voice adapter |

Keep the visible interface small: stage preview, scene input, theme, actor voices, Play/Pause/Restart, captions, volume and a useful error message. Advanced technical settings belong in developer documentation. A separate settings drawer can hold performance quality and ambience.

Skill-aware coding agents can load SKILL.md. Other agents can read the same public schema/examples and produce JSON. A chat-only agent can write a scene; preparing audio or files requires appropriate tools. An install command does not grant tools, credentials, compute or subscription access.

## 3. Architecture and responsibility

```text
Person's script
    -> agent + theatre skill
    -> scene.json (portable intentions)
    -> validator + compiler + optional voice adapter
    -> prepared performance (resolved timing and media)
    -> browser theatre player

Approved stage packs + actor packs + voice mappings
    -> compiler and player
```

Use two representations:

1. **Author scene:** simple lines, named destinations, expressions and action ordering. The agent does not calculate foot motion or phoneme timing.
2. **Prepared performance:** resolved asset versions, audio durations, scheduled actions and optional mouth cues. The player uses this for repeatable playback.

Both are versioned JSON with public schemas. Keep the initial author format tiny. Add detailed timeline control only when the runtime supports it. Record compiler version and performance settings in the prepared result.

The player owns animation, collision-aware authored paths, seat contacts, transitions, gaze, voice playback and captions. Voice adapters supply audio and timing when available. AI chooses dramatic intent and supported actions; our engine makes those actions look consistent.

## 4. Technical direction

Recommended theatre stack: TypeScript with Babylon.js, loaded only on the Theatre page; DOM controls and captions; Web Audio for prepared sound; JSON Schema for scene and pack contracts; GLB assets where appropriate. Pin actual dependency versions during implementation. The current gallery can retain its plain JavaScript and static hosting.

Babylon.js is a practical choice for a small game-like stage with character animation. Begin with simple authored geometry for mascot bodies and stage props, then adopt GLB for assets that benefit from external authoring. Keep provider-specific voice code outside the renderer. React, a database and accounts are unnecessary for the first release.

Use one renderer. Build only the abstractions needed to separate scene intent, animation and voices; a universal rendering framework would delay the first performance.

Theatre runs on static hosting. Remote speech generation needs either the user's agent/local environment or a separately operated service. Private API keys never go into the public player or scene file.

## 5. A small authoring language

Illustrative design, not an implemented API:

```json
{
  "schemaVersion": "0.1",
  "stage": "campfire@1",
  "seed": 42,
  "actors": [
    {"id": "a", "character": "claude@1", "voice": "warm"},
    {"id": "b", "character": "gpt@1", "voice": "bright"}
  ],
  "sequence": [
    {"actor": "a", "action": "moveTo", "target": "seat-left-entry"},
    {"actor": "a", "action": "sit", "target": "seat-left"},
    {"actor": "b", "action": "lookAt", "target": "a"},
    {"actor": "a", "action": "say", "text": "We finally made it.", "delivery": "relieved"},
    {"actor": "b", "action": "say", "text": "Save me a seat.", "delivery": "warm"}
  ]
}
```

Initial sequencing is serial: each blocking action finishes before the next starts. Explicit look targets can persist. The listener controller supplies restrained gaze and blinking automatically. Later add explicit parallel blocks and cue-relative reactions with conflict checks.

Start with idle, lookAt, say, nod and a character-appropriate greeting. Add moveTo, turn, sit and stand in the walking milestone. Expose laugh only after a suitable visual action exists; audible laughter requires supplied audio or a voice capability that supports it.

Named stage positions avoid hard-coded agent coordinates. Seat positions include orientation, contact height and approach paths. The compiler checks actor/stage compatibility and rejects unavailable actions rather than inventing substitutes silently.

## 6. Stage packs: how community theatres work

A stage pack describes:

- Stable ID and version, display name, thumbnail and attribution.
- Geometry/props, environment lighting and optional licensed ambience.
- Coordinates in meters, Y up, documented forward direction and neutral scale.
- Named spawn points, seat anchors, gaze targets and camera presets.
- Authored safe routes and seat approach/exit points.
- Supported actors/actions, performance tier and required runtime capabilities.
- Theme-family mapping such as seat-left and seat-right.

Campfire, snow and park implement the same basic two-actor stage contract. Switching between compatible stages recompiles the scene against the new anchors. Disable incompatible choices with an explanation. An arbitrary community stage cannot be assumed to support every performance.

First community stages use declarative manifests plus approved asset formats. A creator can develop custom behavior with the SDK locally and submit reviewed code. Uploaded scene bundles do not execute arbitrary JavaScript.

## 7. Actor packs and convincing motion

Each actor defines its rig, identity constraints, dimensions, gaze/mouth controls, idle behavior, action clips or procedural handlers, movement speeds, seat compatibility and gesture limits.

Preserve Claude's flat orange block, attached chunky tabs and four short feet. Preserve GPT's knot silhouette and compact hands. Human motion clips are not automatically appropriate for these bodies. Use authored procedures or clips suited to each rig.

Motion layers: body locomotion/contact, gaze, expression, mouth and optional gesture. The controller resolves ownership: speaking controls the mouth; sitting constrains the body; gaze tracks the conversational target. Decorative motion cannot break foot contacts or interrupt dialogue.

Use anticipation, smooth transition/settling, grounded feet and restrained variation. Do not randomize broad hand gestures. A fixed seed stabilizes permitted variations, although pixel-identical rendering across different GPUs is not promised.

First seated scene can start with characters already sitting. Walking and sit/stand transitions are a later milestone, with explicit contact checks. Accurate human/anime acting requires additional rigs and animation work and is not implied by the initial mascot support.

## 8. Voices: separate personality from provider

Give each actor a logical voice alias such as warm or bright. A voice mapping binds that alias to an available browser voice, uploaded recording or configured generation adapter.

| Mode | Purpose | Limitation |
| --- | --- | --- |
| Browser speech | Immediate Hello preview | Device-dependent voices; timing and mouth synchronization are approximate |
| Prepared audio | Repeatable short performances | Audio must be recorded or generated first |
| Optional local/remote adapter | Agent prepares speech | Requires configured runtime/provider and any applicable credentials |

First adapter interface: list voices/capabilities, synthesize a line, return audio, duration and optional word/phoneme timestamps. Capabilities disclose supported languages, rate, pitch, expression and timing. A warm preset describes intent; it cannot guarantee a provider supports that emotion or an identical voice.

Uploaded human audio is a first-class option. Kokoro ONNX is a candidate local adapter for this laptop; installation and measured speed are a separate task. No required ElevenLabs dependency. Avoid maintaining many community TTS wrappers until one prepared-audio path works.

For prepared scenes, audio playback position drives captions and animation. Pause suspends the performance; restart clears pending cues; replay cannot duplicate queued audio. Hidden-tab behavior pauses both together. Seek, if added, must reconstruct scene state rather than replay all side effects.

Provide three explicit mouth quality levels: approximate speech activity, audio-envelope movement, and timed mouth-shape cues when supported. Audio amplitude is not phoneme-accurate lip sync. Selecting a new generated voice invalidates old timing; regenerate/recompile before playback.

## 9. Bundle, skill and tooling

Use a JSON-only scene when it references bundled public assets or draft speech. Use a portable ZIP when it includes prepared audio:

```text
performance.zip
  scene.json
  performance.json
  audio/line-001.wav
  audio/line-002.wav
  manifest.json
```

Manifest records schema/runtime requirements, pack versions, asset hashes, attribution and voice provenance where known. The first runtime loads built-in stage/actor packs. Importing third-party packs follows once validation and compatibility reporting exist. Explicit asset versions avoid silently changing saved performances.

Recommended repository layout, introduced incrementally:

```text
theatre/
  runtime/          # timeline, actor controllers, audio, loader
  schemas/         # author scene, prepared performance, packs
  packs/stages/    # campfire, snow, park
  packs/actors/    # approved mascot rigs
  examples/        # hello and campfire reference performances
tools/theatre/     # validation, preparation and packaging
skills/theatre-scene/
  SKILL.md
  references/      # schema guide and action catalog, read as needed
```

Keep the skill concise: inspect supported packs, create a scene, validate, prepare audio if a configured tool exists, package and explain how to open it. It links to canonical schemas and examples instead of duplicating them. Return useful errors such as: "Actor a cannot sit at this anchor; choose a compatible seat."

CLI commands such as validate, prepare and pack are proposed only. Publish working PowerShell and Bash examples after commands exist. An optional MCP server can expose list_packs, validate_scene and prepare_scene later, reusing those same functions. It must not require a second scene language.

## 10. Milestones and completion criteria

| Milestone | Deliverable | Completion criterion |
| --- | --- | --- |
| 0: Hello | One mascot, text, available browser voice, captions, Speak/Stop | Finishes and returns to idle; cancellation/repeated clicks behave correctly; voice availability is explained |
| 1: Theatre foundation | One 3D campfire, two seated actors, a short prepared conversation | Speech, gaze, mouth cues and captions share playback state; Pause/Restart remain coherent |
| 2: Agent file | Public schema, JSON/bundle import, example skill and validator | A compatible agent can produce a valid scene using the published docs; failures identify the actual unsupported field/action |
| 3: Movement | Walk, turn, approach, sit and stand | Feet, seat contacts, turns and transitions look coherent for both actors; impossible paths are rejected |
| 4: Three stages | Snow and park using common anchors | The same supported scene plays on all three after recompilation; cameras and seats fit each actor |
| 5: Community release | Stage/actor pack starter, contribution guide, version compatibility | A contributor can make a small stage without modifying core playback; origin/license and compatibility are visible |

Review each milestone before expanding scope. These are release gates, not work already verified. Do not promise delivery dates without measuring the Hello and first rig work.

## 11. Performance, accessibility and reliability

This laptop has an i5-8250U, 8 GB RAM and MX150 2 GB. Start with low-detail geometry, one active stage, bounded effects, capped rendering resolution and modest textures. Aim for smooth 30 fps on that hardware and scale quality upward only after measurement. Proposed initial budgets: roughly 10 MB compressed for built-in theatre assets excluding optional voice models; at most a few modest textures per stage. These are engineering targets, not achieved measurements.

Lazy-load the theatre so gallery visitors do not download its engine/assets. Pause background rendering; dispose replaced stages and audio resources. Provide reduced motion and a readable transcript. Core playback controls must be keyboard accessible; captions do not exist only inside the canvas.

Validation checks schema, sizes, references, supported actions, estimated/resolved duration and actor/action conflicts. ZIP import limits expansion/file counts, rejects traversal paths, and accepts known media formats. No secrets or executable scripts in scene bundles. Local file import can stay local; make any external voice request explicit.

Before public release, plan checks for malformed imports, audio failures, voice changes, repeated playback, background tabs, stage switching, keyboard controls, small screens and performance. Existing gallery browser checks and ZIP source lists also need updating as identified in ROADMAP.md. No implementation tests are being added or run by this planning task.

## 12. Community and ownership

Provide documented extension points and one complete reference pack before a registry or marketplace. Initially review community contributions through GitHub and curate a manifest of compatible packs. Users can host/fork their own theatres. A code license does not automatically license character trademarks, artwork, recordings or provider voices; record those separately and avoid claiming official brand affiliation.

Reuse existing installed design/motion/accessibility guidance during implementation. The theatre-scene skill becomes the public agent interface. Add other skills only for a demonstrated need; installing a skill does not supply a voice backend or animation assets.

Defer: accounts, cloud generation billing, real-time autonomous conversations, general physics simulation, unrestricted user scripts, hundreds of templates and video rendering infrastructure. Consider video export after browser playback and portable bundles are reliable.

## 13. Immediate next implementation

Build milestone 0 as a separate website demo: select mascot, short text, voice selector, Speak/Stop and captions. Establish a small actor controller and speech adapter. Then build a 3D campfire proof with the same speech lifecycle and author-scene concepts, replacing the renderer where needed. Do not convert all 116 gallery reactions before the first scene works.

The public-facing promise should grow with demonstrated capability: talking mascot, then short theatre, then an agent/community toolkit.

## References

- Existing repo: https://github.com/SaiTejaVoonna/mascot-for-agents
- Current website: https://saitejavoonna.github.io/mascot-for-agents/?revision=11
- Babylon.js character workflow: https://doc.babylonjs.com/features/featuresDeepDive/animation/animatedCharacter
- Animation blending: https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations
- Browser voices vary by device: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
- Optional local speech runtime: https://github.com/thewh1teagle/kokoro-onnx
- Comparable scene/dialogue product: https://plotagon.com/
