---
name: mascot-toolkit
description: Find, render, validate, and extend the Mascot for Agents expression library. Use for GPT or Claude mascot emotes, PNG stickers, expression searches, new character packs, and planning GIF or WebP animation exports in this repository.
---

# Mascot toolkit

1. Locate the repository root using README.md and AGENTS.md. Read site/catalog.json for available characters and expressions. Resolve all paths relative to the repository, not the working directory of this file.
2. For an existing emote, find the exact expression or a documented synonym, identify the character, and return the existing file path. Do not regenerate artwork unnecessarily. Report unsupported formats plainly.
3. For a new expression, read the mascot manifest and inspect its source/reference visually. Preserve the character identity, canvas and baseline. Modify editable source, not the reference image. Keep a new draft isolated until reviewed.
4. Rebuild the GPT pack with `python tools/build_mascot.py` from the repository root. This requires Pillow. Use the bitmap in assets/mascots/gpt/silhouette.json. The renderer writes PNGs and layers into that mascot folder.
5. Run `python tools/validate_catalog.py`. Inspect the rendered expression sheet and sprites at 32, 64 and full resolution. Check hands, face readability, transparency and baseline consistency. Automated validation does not replace visual inspection.
6. Update the mascot manifest and gallery catalog together when adding approved assets. Keep paths relative to site/ in the catalog. Add synonym/emoji aliases in site/app.js where appropriate.
7. For animation, first read docs/WORKFLOW.md. Create a short draft loop plus static fallback. Check seam, silhouette stability, timing, alpha and size. Do not report a GIF as ready until it exists and has been previewed.
8. Summarize actual outputs and limitations. Do not install packages, publish, change repository settings, or upload private material beyond the user's authorized task. Never claim agent compatibility that has not been tested.

Refer to docs/ROADMAP.md for planned features. Voice, MCP, hosted generation, Remotion integration and agent-specific installers are future work, not existing commands.
