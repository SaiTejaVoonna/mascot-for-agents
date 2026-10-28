---
name: mascot-toolkit
description: Find, render and extend the Mascot for Agents library of 50 paired GPT and Claude expressions. Use for PNG stickers, GIF/WebP loops, emoji or mood search, character packs and source-based mascot edits.
---

# Mascot toolkit

1. Locate the repository root via README.md and AGENTS.md. Read site/catalog.json: version 2 has shared expression IDs and mascot base paths. Resolve catalog paths relative to site/.
2. Reuse existing emotes where possible. Return the requested character/expression and format path; do not regenerate unnecessarily. The current collection is assets/collection/{gpt,claude}/{expression}.{png,gif,webp}.
3. Inspect character references and the existing contact sheets before changing proportions. Keep identity, baseline, canvas and pixel scale consistent. Preserve original references under assets/mascots/.
4. Edit SPECS and the renderer in tools/build_collection.py. Run `python tools/build_collection.py` from the root. The script exports both characters, manifests, contact sheets, catalog and source packs. It uses Pillow and the GPT bitmap source; no model call is required.
5. Run `python tools/validate_catalog.py`. Inspect contact sheets and selected animated loops at normal speed, including small-size readability, loop seams, hand overlap and transparency on light/dark backgrounds. Automated checks do not replace visual review.
6. Keep docs and counts consistent with actual exports. Preserve root index.html's base path when editing the website; site/index.html is the direct gallery entry point.
7. For new characters, first prototype neutral and four contrasting expressions. For new motion, keep anchors fixed and inspect jitter and clipping. Update manifests and packs through the renderer.
8. Stay within the requested publishing scope. Report tested outputs and any procedural-animation limitations. Voice, MCP and hosted generation are not implemented.
