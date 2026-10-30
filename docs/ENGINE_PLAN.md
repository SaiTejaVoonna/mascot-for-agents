# From reaction files to a living character

Planning note, 30 October 2026. These capabilities are proposed, not implemented. Preserve the current static gallery, authored character identities, existing formats and source exports.

## Product idea

Give an app or agent a small expressive face. The host app supplies meaningful events; the character responds with a coherent performance and returns to a quiet resting state. The same engine powers a simple website demo and an embeddable widget.

The feeling of life should come from attention, continuity, timing and appropriate responses. Character behaviour must reflect the actual task state. A success animation is triggered by a real completion event, not by an elapsed timer pretending the task completed.

## First demonstration

One character stage, a character selector and a small task demonstration with explicit controls. Show a simulated task as a labelled demo. Let visitors start, finish, fail or retry the demo and see the character respond. Show the short integration code beside it.

The visitor-facing model remains one line:

```js
mascot.setState('thinking');
```

Proposed embed:

```html
<agent-mascot character="claude" state="thinking"></agent-mascot>
```

These are proposed API shapes. The host app owns the real task and sends the state. A web page does not automatically receive private activity from ChatGPT, Claude or other applications.

## Small runtime first

Start with six states:

| State | Meaning | Behaviour |
| --- | --- | --- |
| idle | Nothing needs attention | Quiet rest with restrained authored variation |
| attentive | The user is interacting | A brief attentive response |
| thinking | Work is in progress | A calm, readable loop |
| waiting | User input is needed | An expectant pose with a visible text label |
| success | The host reports completion | One short celebration, then rest |
| error | The host reports a problem | A concerned pose; retry belongs to the host UI |

The event-driven controller owns state, pending events, motion preference, visibility and cooldowns. Use the current PNG/WebP assets for the first prototype. Preload likely next assets and use a neutral bridge or short visual transition where appropriate. Raster clip switching has limited frame control; it is the inexpensive proof of the interaction, not the final procedural renderer.

Behaviour priorities:

- Current task state wins over decorative idle behaviour.
- A new real task interrupts an obsolete celebration or rest animation.
- Success/error settle deliberately; urgent events are not trapped in a long animation queue.
- Hidden and offscreen characters pause. Reduced motion preserves a still state and text label.
- Variations are restricted to an authored set that matches the state and character.
- Local preferences may remember character and motion mode; no conversation content is required.

Plain JavaScript and the browser animation APIs are sufficient for this stage. Static hosting remains suitable. No account, paid model API or application backend is needed for local reactions and the demo.

## Procedural rig second

If the first prototype proves useful, expose the existing renderer's pose model as runtime data. A small Canvas 2D renderer can then control the body, face, eyes, existing tabs/hands and feet as separate authored parts.

That enables:

- Continuous transitions between compatible poses instead of a hard clip replacement.
- Gaze toward an explicitly integrated input or pointer, with touch and still alternatives.
- A controlled one-shot performance and exact playback timing.
- Consistent anticipation, contact, settling and follow-through across states.
- Gentle timing/energy adjustments with bounded ranges.

Keep foot contacts, limits on gestures and the original Claude/GPT silhouettes as constraints. Begin with the six core states rather than porting all 116 reactions. Evolve toward one authoring model that produces both runtime data and downloadable files, rather than maintaining unrelated rigs.

Canvas is a proposed implementation, not a requirement. Rive is an alternative if a visual state-machine editor is worth the additional tooling and artwork migration. Evaluate that tradeoff after the small prototype; changing libraries alone does not improve animation judgement.

## Agent integration third

Provide a small event adapter for apps that integrate the widget:

```text
task started -> thinking
input requested -> waiting
task completed -> success -> idle
task failed -> error
```

Keep the public API smaller than the internal animation system. The integration can be a property, JavaScript method or DOM event. An iframe embed can use postMessage with an explicit target origin, source/origin checks and a validated event schema.

An optional AI layer could later choose among approved expressions from an app-supplied event summary. The deterministic controller still governs actions, interruptions and animation safety. This is an extension, not a prerequisite for a character that feels responsive.

## Useful additions after the core

The broader scene-making direction is recorded in [SCENE_STUDIO_PLAN.md](SCENE_STUDIO_PLAN.md): agent-authored dialogue, approved characters, environments, voice adapters and a browser timeline player. The companion controller and layered rig should become reusable parts of that player.

- Context preview: see the companion in a chat bubble, app header or progress area.
- Save a small reaction pack and download it.
- Two bounded performance styles, calm and playful, that change timing and permitted variation.
- Short authored reaction sequences with clear start and end states.

## Decision order

1. Fix the current gallery's quality and packaging gaps.
2. Build the six-state event controller and one embeddable demo using existing assets.
3. Observe whether the responses are understandable, pleasant and useful.
4. Add the layered rig where clip switching limits the experience.
5. Add adapters for real host apps; consider optional AI only for a specific demonstrated need.

Success is understandable state, smooth transitions, reliable interruption, restrained behaviour and a small integration surface. Avoid adding a chat box, settings dashboard or new model dependency before the core interaction earns it.

## References

- Browser animation control: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- Embed communication: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- State-machine tooling alternative: https://rive.app/docs/
