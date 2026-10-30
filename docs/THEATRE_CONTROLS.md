# Theatre workspace

The existing framed-sheet direction (seed 667084596), Sora font, cream editor and original campfire artwork remain. The screen answers: **Can I move the cast, edit their lines and play the scene without hunting for controls?** The signature is a working mascot world with its tools immediately below it, plus a compact scene inspector.

## Controls

- Playback is separate from exploration. Play, Stop, caption mode and silent preview remain below the stage. Preparation progress and errors remain visible even when an inspector tab is closed.
- Exploration groups cast selection, a 44 px directional pad, sit/stand, greeting and fire actions. Clicking the ground and stage arrow keys still work. Reset positions is separate from dialogue reset.
- The inspector has Script, Voices, Scene and Sound tabs. Arrow keys, Home and End navigate its tab strip. Each panel retains the original controls and event bindings.
- Focus stage hides the inspector. Back to editor or Escape returns it.
- Sound sliders show percentages or pitch multiples.
- Large screens use an independently scrolling inspector; narrow screens stack it below the world. Mobile text fields use 16 px text.

## Local drafts

`studio-ui.js` saves scene JSON and raw dialogue to `little-theatre-draft-v1` in localStorage after input settles and on page navigation. Valid drafts restore their scene settings; unfinished source is also preserved. The inspector reports saving/restoring or unavailable local storage. Voice preferences use the existing separate storage. Scene export/import remains available. Exploration positions and fire state are temporary preview state and reset on reload. There is no cloud sync.

## Runtime and cost

This update adds plain JavaScript and CSS, with no new package or service. Exploration, the inspector, focus mode and saving need no model download. Existing neural speech still downloads its open-source model on explicit Load, Play or Preview and uses the visitor's browser resources. No account, paid speech endpoint or API key is introduced. Voice quality is unchanged.
