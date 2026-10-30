# Little Theatre: director layout

30 October 2026. Visual direction and implementation record on feature/video-theatre.

## Direction

The old composition enlarged reaction assets until they dominated a plain illustrated backdrop, with controls pushed below the main interaction. The replacement uses a 16:9 scene, smaller actors grounded on matched platforms, a compact dialogue editor and collapsed settings. Page width adapts to viewport height as well as width so the stage and transport can remain visible on a short laptop display.

An imagegen UI mockup established the composition. A separately generated original twilight campsite supplies the production background; it contains no actors, UI text or flames. Existing approved mascot PNGs, runtime mouth shapes, fire and interface remain separate editable layers. The background is encoded as a 289 KB WebP without resizing. The UI mockup is a design reference, not a claim that every illustrated detail is executable. Character geometry remains the existing 2D art.

## Text and timing

- Off: hide on-stage dialogue without muting speech; the editor remains a readable script.
- Subtitles: smaller conventional dialogue text near the bottom of the picture.
- Story text: larger typography, a restrained accent and brief line entrance animation.
- Active-word highlighting uses neural word timestamps or browser boundary callbacks where available. Longer dialogue advances in short word groups. A reading-time approximation is used when word timing is absent, and in silent previews; it is not forced alignment.
- Neural dialogue appears on audio start, rather than during synthesis. Mouth and word callbacks use the same generated audio clock. The actor controller resets on Stop/completion.
- Text mode is remembered locally and saved as optional settings.textMode in scene 0.2. It accepts off, subtitles or story; earlier files default to story when opened.

## Editing

The Dialogue editor presents actor/expression selectors, plain-text fields, editable pause durations and sound cues. Source mode retains the simple English screenplay. Cards preserve imported advanced directions until an explicit actor change invalidates that line's gaze/listener references; source editing still returns to basic defaults. Remove-line buttons and existing add-line/file actions remain available.

The right-side editor deliberately stays compact. It is not an invented timeline with guessed durations. The transport reports line progress; exact total duration is not available before speech preparation.

## Runtime and ownership

The scene image was generated using the built-in imagegen tool. Prompt records and the UI mockup are saved with user-facing outputs in the workspace. Existing Sora and mascot identity remain. HeadTTS/Kokoro notices and sound-workflow references remain in the Credits panel. Audio effects are original code rather than imported samples.

This is an illustrated 2D studio. 3D rigs, reliable neural emotional acting, camera animation, arbitrary community characters, video export and an exact editable audio timeline are not shipped by this layout change.
