---
name: theatre-scene
description: Draft a Mascot for Agents dialogue scene using its proposed JSON screenplay format. Use for short mascot conversations and theatre scene files, rather than sticker rendering or general video generation.
---

# Theatre scene authoring draft

Status: an initial 2D Hello Studio player is implemented on feature/video-theatre at theatre/index.html. The public main gallery is unchanged. The prototype supports browser speech or estimated captions-only playback for the seated-dialogue subset; it does not implement a 3D campfire, prepared audio or precise lip sync. Do not claim successful playback, installation or validation that has not occurred.

Read [the format contract](../../docs/PERFORMANCE_FORMAT_V0.md) for fields, sequencing and timing. Use [the reference scene](../../theatre/examples/campfire-hello.scene.json) as the starting shape. These paths assume the repository layout; standalone distribution must bundle or correctly resolve those references before release.

## Create a scene

1. Preserve supplied dialogue unless the user requests edits. Infer simple casting when possible. For an approximately 30-second scene, keep dialogue brief; duration is unknown until the selected voice is rendered.
2. Use only the versioned contract's actors, stage, slots and supported beats. The draft example is seated dialogue. Do not invent walking, props, cameras, languages or provider voice IDs as supported capabilities.
3. Set logical voice aliases, readable text and a few meaningful expressions/pauses. Let engine defaults handle quiet listening. Avoid annotating every word or adding unrelated gestures.
4. Return a .scene.json file. Explain that a target duration is advisory and actual duration requires audio preparation. If no runtime validator exists, report that limitation rather than asserting the file has passed it.

## Optional prepared audio

If an authorized voice tool is available, produce audio for each say beat and the audio sidecar described in the contract. Use filenames relative to the bundle and preserve beat IDs. Otherwise provide the screenplay alone, suitable for future draft browser speech or later audio attachment. Never fabricate generated files, timestamps, consent or credentials.

A skill does not supply a voice engine. A user should be able to create the author file without a paid connector. Rendering, execution and publication remain separate capabilities and follow the user's requested scope.
