# Workflow

## Find an existing emote

Read `site/catalog.json`, choose the mascot and expression, and resolve the PNG path. The gallery adds emoji/synonym aliases. The current version includes both characters in PNG, GIF and animated WebP. Resolve expression files through catalog v2.

## Add an expression or character

1. Create a working branch and inspect the current sources and references.
2. Record the creator, origin, reuse terms and concept status in the mascot manifest.
3. Render a neutral pose and four expressive drafts first. Review at small size.
4. Keep canvas dimensions, baseline, pixel scale and palette consistent across the pack.
5. Export transparent PNGs with predictable names and editable source alongside them.
6. Register available exports in site/catalog.json, validate, and inspect the gallery.
7. Open a pull request with before/after contact sheets and any readability limitations.

## Animate after expression approval

Begin with idle, blink and happy loops. Separate body, eyes and arms; keep fixed anchors. Use the deterministic renderer for pixel animation; evaluate SVG or Remotion separately for future motion-graphics scenes. Export PNG fallback plus GIF and preferably WebP. GIF has limited transparency, so inspect matte/fringe artifacts carefully. Preview the seam at normal speed and verify no jitter, clipped limbs or palette flicker. Include reduced-motion/static behavior if animations autoplay on the website.

## Optional future integrations

Remotion's official skills can inform social video composition; public mascot-maker, SVG rig and sprite tools can be evaluated as separate dependencies. Review their licenses, execution requirements and output quality before adoption. None is required or bundled here. Voice narration should be an optional adapter: imported audio or a user-configured TTS provider, with no hardcoded credentials or required subscription.

## Release check

Run build and validation, inspect transparent assets on light/dark backgrounds, test search and downloads on a narrow viewport, review per-pack rights, and publish a versioned release. Only advertise formats that are downloadable. Publishing and settings changes require the user's request; a content change alone does not enable deployment.
