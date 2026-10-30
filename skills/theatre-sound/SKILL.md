---
name: theatre-sound
description: Prepare sound effects, ambience and audio cue plans for Mascot for Agents theatre scenes. Use for sourcing or synthesizing effects and reviewing scene audio; dialogue voice generation uses a separate configured speech tool.
---

# Theatre sound

Project-local skill draft. No audio runtime, third-party skill or MCP server is installed by this file. The current website does not yet play theatre scene bundles. Use for preparation artifacts and report which operations actually ran. To distribute this skill independently, bundle or resolve its scene-format references.

## Inspect the available tools

Determine whether local FFmpeg, Python and earshot are available before invoking them. An available MCP connection may expose the same functions. Do not assume that Claude's configuration files register tools with Codex. CLI execution is an alternative when the agent has shell access; model-based earshot analysis requires its dependencies and downloaded models.

Source documentation:

- Openverse audio discovery: https://api.openverse.org/v1/
- earshot runtime and agent skills: https://github.com/Leonxlnx/earshot
- Real SFX workflow: https://clipwing.pro/skills/real-sfx

These links are references, not implicit installation instructions. Inspect relevant source and requirements before adapting code. Keep upstream notices when reusing licensed code. This skill is an original project workflow, not a copy of an upstream skill.

## Prepare scene audio

1. Read the scene and its supported format at ../../docs/PERFORMANCE_FORMAT_V0.md. Keep dialogue audio separate from ambience and one-shot effects. Do not edit the supplied dialogue while adding sound.
2. Plan only sounds justified by visible actions or the environment. Start with quiet ambience and a few purposeful contacts. A nod, blink or every line of speech does not automatically need an effect.
3. Source real recordings through Openverse or a supplied library, or use a configured procedural tool for designed sounds. Openverse indexes assets; download/access and rights depend on the source. Preserve source URL, creator, license/version, attribution and edits in a credits file. Prefer CC0 for starter packs; other licenses require their actual terms to be satisfied. Do not treat search metadata as independent proof of ownership.
4. If earshot is installed, its measure command gives model-free level measurements; its sfx/kit commands render a shipped bank without loading analysis models. Semantic selection/review commands require the analysis setup. Invoke only commands supported by the installed version. On this 8 GB laptop, start with short clips and lightweight operations rather than a persistent model-heavy server.
5. Keep an audio cue preparation sheet outside the author scene until sound cues are implemented in its public schema. Record cue ID, asset, intended action/beat, relative placement, trim, loop intent, gain and attribution. Do not add unsupported fields to .scene.json or pretend this preparation sheet is already accepted by the player.
6. When timing is available, align contacts to the actual animation contact, not merely the start of a beat. Fade loop boundaries and duck ambience/effects under dialogue as appropriate. Resolve cues again if dialogue audio changes.
7. Report measured clipping/levels and any actual model observations separately from listening judgments. Tool scores are fallible evidence. Do not claim that sound has been heard, that synthesis is indistinguishable from recordings, or that a mix is production-ready solely from a score.

## Output

Produce only artifacts supported by available tools: cue preparation sheet, credits, and actual generated/downloaded/processed media. If audio generation was unavailable, return a useful plan with unresolved assets identified. File references should be relative to the proposed bundle where possible.

Keep the shipped browser lightweight: prepare/download/render audio in the agent environment, then play approved files through the browser's shared timeline. Visitors do not need Python, FFmpeg, PyTorch or the earshot models. Speech still needs browser synthesis, recordings or a separately configured TTS adapter.
