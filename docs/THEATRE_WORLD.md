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

Caption pages use six, nine or twelve words according to stage width. The campsite now has a small interactive layer in `theatre/world-interactions.js`: choose a mascot, tap the ground or use arrow keys to move, return to a stool, stand, wave, reset positions and extinguish or relight the fire. Movement uses the existing walking WebP; greeting uses hello WebP. During dialogue, the speech renderer retains ownership of the face, so moving uses position changes without replacing its mouth artwork.

Ground bounds and the central fire ring constrain destinations. A crossing path passes in front of the fire. These are simple 2D constraints, not a general collision or pathfinding system. Sitting is a stylized compressed rest pose on the stool, not a new articulated seated rig. Reduced movement skips travel animation. Fire-off hides flame, ember and firelight and stops fireplace ambience. Free exploration does not generate speech or download the voice model.

Positions and fire state are temporary preview controls, not part of scene JSON 0.2. Reload resets the world. There is no free camera, 3D navigation, multiplayer or game map.

The environment geometry is original project art. This update uses no third-party image or game asset. The genre reference is a friendly cartoon space outpost.
