# Mascot for Agents

A community mascot toolkit and searchable emote gallery. Search a mood or emoji, choose GPT or Claude, preview the expression, then download a sticker. Animated loops and additional characters are the next stages.

**Status: early concept starter.** Ten transparent GPT PNGs and their code-drawn source are included. These are the separate Python expression study, not a replacement for the newer Claude-produced GPT v3 sheet. The supplied comparison sheet records the GPT/Claude concepts. Individual Claude exports and GIFs have not been imported yet. This project is not affiliated with OpenAI or Anthropic.

## Start here

```sh
git clone https://github.com/SaiTejaVoonna/mascot-for-agents.git
cd mascot-for-agents
python3 -m venv .venv
# macOS / Linux
. .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python tools/build_mascot.py
python tools/validate_catalog.py
python -m http.server 8000
```

Visit **http://localhost:8000/site/**. Serve the repository root: the gallery fetches JSON and cannot reliably run from a `file://` URL. Viewing/downloading the current gallery needs no model, API key, or paid subscription. A local Python environment is needed only for these preview/build commands.

## Use with an agent

Tell any coding agent with filesystem and command access:

> Work in this repository. Read AGENTS.md, then skills/mascot-toolkit/SKILL.md. Find the GPT happy PNG and give me its path. For a new expression, preserve the source silhouette, render a draft, validate the catalog, and show a preview before adding it to the gallery.

The repository skill is plain Markdown instructions, not an installed connector. Clone/download the repo and point an agent at it. Chat-only assistants can read the public docs but need an execution environment or another tool to render files. Agents do not receive GitHub access automatically. Installation mechanisms differ by agent; no universal plugin or subscription bridge is provided.

## What is included

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Repository rules and first steps |
| `skills/mascot-toolkit/SKILL.md` | Reusable agent workflow |
| `site/` | Static search, filters, previews and PNG downloads |
| `assets/mascots/gpt/` | Ten code-drawn concept PNGs, bitmap source, manifest and layers |
| `assets/mascots/claude/` | Supplied comparison reference; exports pending |
| `tools/build_mascot.py` | Deterministic Pillow renderer; writes directly to GPT assets |
| `tools/validate_catalog.py` | Validate entries, paths, transparency, image readability |
| `docs/WORKFLOW.md` | New characters, expressions, animations and release sequence |
| `docs/ROADMAP.md` | What works now and what remains |

The Pillow renderer uses a DejaVuSansMono font when available, with a fallback. Nearest-neighbor scaling preserves pixel edges. Regeneration preserves the authored mascot manifest and writes technical metadata to `render-info.json`.

## Contribute

Make changes on a branch, preserve references, include editable source and exports, validate, and attach previews to the pull request. See [CONTRIBUTING.md](CONTRIBUTING.md). Code is covered by [LICENSE](LICENSE); artwork and represented brands have separate [asset usage notes](assets/README.md). No third-party mascot toolkit has been vendored or installed.

## Website deployment

The site is static-host compatible but **not deployed by this starter**. A GitHub Pages deployment should publish the repository root so both `site/` and `assets/` are available; the gallery entry point is `/site/`. Enable publishing deliberately after reviewing the asset packs. Do not publish only `site/`, because its image paths point to the sibling `assets/` directory.
