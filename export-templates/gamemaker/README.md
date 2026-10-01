# Game Dialogue Maker â€” GameMaker playground

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

datafiles/dialogue.json is the ordinary JSON export, registered in Included Files. Replace only that file and restart Run to update writing. Keep your .yyp, rooms, objects, scripts and artwork. gdm_parse_dialogue converts it in memory. For your own room, set create_demo_world = false in the controller Create event and place your own objects. Set each NPC character_id to its stable Dialogue Maker ID; reordering JSON does not reassign existing NPCs.
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

Dialogue shortcuts: press 1–9 (top row or numeric keypad) to select the corresponding numbered option. Press 1 to continue a line or finish a conversation. Numbers appear separately from dialogue text; locked options cannot be selected. Shortcuts pause while Test variables is open. Options above 9 remain clickable.

Waiting conditions: waitUntilMet defaults to true. Blocked waiting connections remember their upstream node per character for the current game runtime. On returning, the same node is displayed until its condition passes, then the connection is followed. Questions and fights still require a choice. Uncheck this setting to restart normally. This progress is in memory; add your own save-game integration for persistence across reloads.

## Updating an existing integration

Export once to bootstrap the engine project. Afterwards export ordinary JSON and replace only `datafiles/dialogue.json`. Keep character/node IDs stable. Updates take effect at the next run, not mid-conversation; game saves need their own migration policy if nodes are deleted. Variable dictionaries remain game-owned while running; setting a condition never changes a variable automatically. New condition variables need wiring to your gameplay.

Older exports require a one-time integration upgrade. Merge the updated gdm_session script and controller/NPC events. Register dialogue.json in Included Files and remove the old gdm_dialogue.json dependency. Set character_id on existing NPCs. Set create_demo_world = false when using your own placed room objects.
