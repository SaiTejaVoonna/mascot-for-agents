# Campfire outpost

## Direction

The stage answers: **Do these two mascots belong in the same little world?**

An original cartoon space campsite uses the mascots' flat colours, strong silhouettes and chunky geometry. The world contains a tent, landing pod, antenna, supplies, camp stools, a stone fire ring, distant mountains and framing vegetation. It is drawn in code rather than using the earlier raster forest background.

The design-taste frontend draw dealt `framed-sheet`, seed **667084596**, with the existing palette and Sora type retained. The user's scope is the world inside the stage; the established editor and controls remain its neutral frame. The signature is the outpost itself, with orange shelter details echoing Claude and mint pod details echoing GPT. No application-wide sidebar or dashboard redesign is added.

Subject inventory: Claude's rectangular orange body and four feet; GPT's mint knot and compact hands; the 96 px art grid; two-character dialogue; the central fire; the existing fire recording; timed captions; browser-only playback; the existing scene selector; original community artwork. These determine the scenery, palette, contact points and dialogue space.

## Editable source

- `theatre/assets/campfire-outpost.svg`: original 960 × 540 world, named groups for sky, tent, landing pod, supplies, stools, contact shadows and fire ring. Edit its coordinates and colours directly.
- `theatre/world.css`: stage-specific placement, proportional flame shapes, firelight and caption treatment. It is loaded after the existing editor styles.
- `theatre/index.html`: decorative world image and the existing live fire/cast layers.

The SVG defines Claude's ground contact near **(283,351)**, GPT's near **(710,351)**, and the fire near **(480,350)**. Character positions use percentages of that same 16:9 space, so artwork and floor scale together. The old forest WebP remains in the repository as an earlier asset; the campfire stage now displays the SVG.

## Behaviour and scope

A quiet flame moves while the outpost is idle; Play adds the existing ember and firelight motion. All of this respects reduced movement. Firelight continues to use the existing slider. Speech, voice selection and audio adapters are unchanged. The campfire stage ID and JSON contract remain compatible. Podcast and rehearsal room retain their existing worlds.

Caption pages now use six, nine or twelve words according to stage width, keeping dialogue from covering most of a small stage. The artwork remains a 2D illustrated set with standing mascot artwork around camp furniture. Walking, seated character rigs, free camera movement, collision and a playable game map are not implemented by this visual update.

The environment geometry is original project art. This update uses no third-party image or game asset. The genre reference is a friendly cartoon space outpost.
