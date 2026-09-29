# Game Dialogue Maker — GameMaker playground

The downloadable apple-quest demo: talk to Mira, close the conversation, touch
the red apple with green leaves, then return to Mira. Pickup removes the apple
and sets numeric `hasApple = 1`; Mira's root conditions select the request at
`hasApple = 0` and the thank-you at `hasApple = 1`. Returning before pickup still
shows the request. Restart Play/Preview to reset. The pickup is enabled only
when the source demo's `demoAppleQuest` flag is true.

Targets current GameMaker 2026.x, desktop VM runner. This is a native GML project.
No extensions, C++ tools, or external artwork are needed.

1. Extract the ZIP to a local folder.
2. Open DialoguePlayground.yyp in GameMaker. Select your desktop target and VM.
3. Press F5 (Run). Move the blue square with WASD or arrows and touch an NPC.
4. Click dialogue choices; use the mouse wheel over the dialogue to scroll.
   Escape or Close conversation exits. Leave an NPC and return to restart it.

The test room contains a controller which loads Included Files, creates a square
sprite, and spawns the player and one native NPC object per character. The camera
follows larger casts. Native sprite-mask overlap checks start conversations;
NPCs are triggers and do not block movement. Movement pauses while either panel
is open. Questions, newline pages, Next jumps, conditions, and simulated fight
outcomes are supported. All conditions on an edge must pass. Normal nodes take
the first available connection; Next is used only when there are no connections.
Empty characters and blocked roots show a retry/close panel.

Test variables start at zero (numbers) or empty text (strings). Click Test
variables, click a value, use backspace/type to edit, then Apply value. Previous/
Next navigates long lists. Invalid numbers leave the previous value unchanged.
Numeric and string types stay distinct. Edit global.gdm.variables in your game
code to drive conditions; fights here are test choices, not a combat system.

datafiles/gdm_dialogue.json is the normalized runtime data. The untouched editable
dialogue is in datafiles/dialogue-source.json. These are Included Files, so they
travel with desktop builds. User text stays in JSON and never becomes GML code,
resource identifiers, or filenames. Re-export to update dialogue and world size.
The simple sprite is loaded from character.png and tinted per NPC.

Scripts and events are editable GML. Replace the runtime square with your own
sprite by changing the controller's sprite loading and NPC/player Create events.
The default GameMaker font may lack glyphs for some languages. Add a font asset
with the required Unicode ranges and select it in the Draw/Draw GUI events for
those projects; the export preserves Unicode data. Desktop mouse/keyboard only;
HTML5/GX.games asynchronous loading and mobile controls are not implemented.

Validation: metadata/resource links, data preservation, browser downloads, and
dialogue logic are tested. The engine-independent GML session uses syntax shared
with JavaScript and is exercised unchanged in a Node harness with GML array and
struct helpers. That is not a GameMaker compiler/runtime test. GameMaker was not
installed during development, so IDE import, compilation, collision, rendering,
and GUI interaction still need verification in the actual engine.

Smoke test: run, contact the first NPC, advance pages, choose both branches, try
win/loss, set keys to 1 for the locked gate, close, leave/re-enter the NPC, and
open the empty character. Also try long text/answers, scrolling, and resizing.

Project metadata follows GameMaker's published format and the structural layout
of the official YoYoGames/GMEXT-Photon example; no example gameplay or assets are
included.
https://manual.gamemaker.io/monthly/en/Additional_Information/Project_Format.htm
https://github.com/YoYoGames/GMEXT-Photon/tree/main/source/Photon_gml
