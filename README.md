# Mascot for Agents

## Expression revision 9

Animated motion is now calculated at the 288 px export resolution, retaining
crisp pixel shapes while moving in one-output-pixel steps. Both GIF and WebP
use exact 40 ms frame intervals. Idle breathing, in-between blink drawings,
held greeting poses and hand-launched confetti improve performance rhythm.
The website previews WebP with GIF fallback, pauses off-screen/background
previews, and responds to reduced-motion preference changes.

Claude's original side tabs now articulate as thick overlapping blocks without
long outlined forearms. Four separate leg contacts support torso leans; the
near-side knees bend more under a weight shift. Greetings and flag waving keep
their toes planted. Excitement and celebration use timed crouch, takeoff,
flight, landing compression and delayed hand follow-through. This is a community
interpretation of reference motion, not Anthropic's source rig or official art.

All 58 reactions for both characters now have explicit face, hand, accent and
action directions in `PERFORMANCES` and `FACES` in tools/animate_mascots.py.
General hands are broad mittens; only the named thumbs-up and pointing designs
use an explicit digit. Distinct facial drawings replace the previous generic
pose/motion combinations. Quiet emotions stay grounded; excitement and
celebration can hop. Typing hands remain visible over the keyboard, peeking
uses a real occluding barrier, and the flag stays attached to its grip.

Every animation returns exactly to its meaningful opening pose. Static exports
use an intentional key pose. Each loop has 64–99 rendered frames at a consistent 25 fps; per-reaction
timing ranges from 2.56 to 3.96 seconds. Catalog and manifests record timings.
The main gallery and ZIP downloads use revision-9 cache keys at the existing
v5 paths. Earlier artwork remains in Git history. These web downloads are not
installable WhatsApp or iMessage packs, and the art has not undergone a formal
user comprehension study.

**[Open the live gallery](https://saitejavoonna.github.io/mascot-for-agents/)**

A shared character toolkit for reactions, stickers and short animations. Browse 58 matching expressions for GPT and Claude: **116 transparent PNGs, 116 GIF loops and 116 animated WebPs**. Download individual files or a complete character ZIP with editable Python source.

## Quick start

```sh
git clone https://github.com/SaiTejaVoonna/mascot-for-agents.git
cd mascot-for-agents
python3 -m venv .venv
# macOS / Linux:
. .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python tools/build_collection.py
python tools/validate_catalog.py
python tools/check_claude_shape.py
python -m http.server 8000
```

Visit http://localhost:8000/. The build runs without API keys or an AI subscription. The gallery itself needs only a browser. Python 3.10+ and Pillow are needed to rebuild exports. DejaVuSansMono is used where installed, otherwise Pillow's default font.

## Collection and formats

Each mascot has the same 50 expression IDs, including everyday reactions, gestures, work states, joy, surprise and attitude. PNG stickers are 384×384; GIF/WebP loops are 288×288, with 12 authored frames at 90 ms each. Loops use eye blinks, pose motion and expression-specific accents. These are procedural pixel-art studies, not hand-animated final character performances.

The gallery offers text/emoji search, character and mood filters, static/animated previews, accessible detail dialogs, format-specific downloads, and source packs. Animated previews respect reduced motion; an explicit Play button can preview a loop. Transparent assets contain no card backgrounds or labels.

## Work with any coding agent

> Read AGENTS.md, then skills/mascot-toolkit/SKILL.md. Use the catalog to find an existing expression. Preserve the character identity when editing; rebuild, validate and visually inspect before publishing.

This is a repository workflow, not an installed connector. A coding agent needs a checkout and command access. Chat-only assistants can read the public docs but require an execution tool to render files. GitHub permissions and AI subscriptions are not transferred by this repo.

| Path | Purpose |
| --- | --- |
| `index.html` | Root GitHub Pages homepage |
| `site/` | Website, interactions, styles and catalog v2 |
| `assets/collection/{gpt,claude-v4}/` | Current PNG, GIF, WebP, contact sheet and manifest exports |
| `assets/mascots/` | Preserved original studies and comparison reference |
| `tools/build_collection.py` | Shared 50-expression definitions and deterministic multi-format renderer |
| `tools/build_mascot.py` | Original GPT silhouette and bitmap drawing helpers |
| `tools/validate_catalog.py` | Validate exports, alpha, animation changes, unique stills and ZIPs |
| `packs/` | Downloadable per-character packs with source |
| `skills/mascot-toolkit/SKILL.md` | Agent workflow |
| `docs/` | Contribution workflow and roadmap |

## Publishing and contributions

GitHub Pages publishes `main` at `/ (root)`. Root index uses the gallery's `site/` assets; `/site/` also works. Use a branch for contributions, include source and previews, and run validation before opening a PR. Preserve older reference files.

This is a community project, not an official OpenAI or Anthropic product. GPT uses the project's mint knot concept; Claude uses a code-drawn Clawd-style character. Code and documentation are MIT licensed; see [asset usage](assets/README.md) for artwork and brand notes. No external mascot skill, image service, TTS service, Remotion dependency or MCP server is bundled.

Claude revision v4 restores straight sides, a flat top, block side tabs and four short rectangular legs. It retains the mouth, fixes the sad eyebrow direction, and uses versioned asset/pack paths to avoid stale images. Earlier Claude folders are legacy exports, not the active gallery pack.


### Expressive motion and dark mode (v5)

Both characters now have 58 paired reactions: the original 50 plus walking, dancing, pointing, flag waving, typing, peeking, stumbling and foot tapping. The procedural renderer articulates hands, feet and body with preparation, a held gesture and recovery. Each loop has 36 authored poses at 70 ms (2.52 seconds); encoders may combine identical consecutive frames.

GPT keeps its reference knot with fuller outer strands and a compact face. Claude keeps the flat original resting block; its existing side tabs act as attached chunky hands during movement. These are community character studies.

The gallery has light/dark themes: it follows the system setting until you choose the sun/moon button, then remembers that choice on your device.

```sh
python -m pip install -r requirements.txt
python tools/build_collection.py
python tools/validate_catalog.py
python tools/check_claude_shape.py
```

The workflow `.github/workflows/build-collection.yml` runs these checks before committing generated v5 assets and packs. Render code is in `tools/animate_mascots.py`; the catalog is generated from `SPECS` in `tools/build_collection.py`. PNG stickers are 384 px; GIF and animated WebP are 288 px with transparency. Keep the pixel grid crisp when scaling.
