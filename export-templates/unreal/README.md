# Game Dialogue Maker â€” Unreal Engine playground

The downloadable apple-quest demo: talk to Mira, close the conversation, touch
the red apple with green leaves, then return to Mira. Pickup removes the apple
and sets numeric `hasApple = 1`; Mira's root conditions select the request at
`hasApple = 0` and the thank-you at `hasApple = 1`. Returning before pickup still
shows the request. Restart Play/Preview to reset. The pickup is enabled only
when the source demo's `demoAppleQuest` flag is true.

This is a complete UE5 C++ source project, targeting UE 5.3 or newer. It needs an
installed Unreal Editor and the C++ toolchain supported by that editor version.
On Windows this normally means Visual Studio with Game development with C++
and the Windows SDK. This ZIP does not contain precompiled binaries.

1. Extract the ZIP to a writable local folder.
2. Open DialoguePlayground.uproject, select your installed UE5 version if asked,
   and allow Unreal to build the game module. If rebuilding from that dialog
   fails, generate project files and build the Development Editor target in
   your IDE, then open the project again.
3. Press Play (Selected Viewport or New Editor Window, not Simulate).
4. Click the game viewport. Move the sphere with WASD or arrows, and touch an
   NPC cube to open its dialogue. Click choices and Close conversation to exit.
   Leave the trigger area and return to restart a conversation.

The Entry map from the installed engine is the starting level. The configured
GDMGameMode spawns the floor, lighting, player, and NPCs at Play time. The editor
viewport is initially empty; this is expected. No binary map or Blueprint
assets are fabricated. The top-down camera follows the player through larger
casts. NPC cubes are contact triggers, not solid obstacles. Names use the
character's color. The player is a sphere so it remains distinguishable.

The native Slate UI has scrollable dialogue and variable panels. Newlines
advance as pages. Questions show answer buttons, unavailable choices are
disabled, and fights offer simulated win/loss outcomes. Normal nodes follow
the first allowed outgoing link; Next is used only without outgoing links.
All conditions on an edge must pass; strings and numbers keep their types.
Movement pauses while dialogue or test variables are open. Use the close
buttons: Escape normally ends Play-in-Editor.

Test variables start at zero or empty text. Press Enter after editing a value.
Only finite numbers are accepted; invalid numeric input leaves the previous
value unchanged. Empty characters and blocked roots show a retry/close panel.
This starter is desktop, single-player only; it does not implement combat,
multiplayer replication, save games, or touch/gamepad controls.

Source/DialoguePlayground/DialogueSession.h is engine-independent C++ traversal.
Content/Dialogue/dialogue.json is the ordinary JSON export. DialogueJson.h reads it at game startup using Unreal's native JSON module. Replace only this file and restart Play to update writing; no C++ recompilation is needed for text changes. Packaged releases must be repackaged/restaged to include the updated data. DefaultGame.ini stages the Dialogue folder.
Null characters in strings are rejected because Unreal text uses null terminators.

GDMPlayground.h/.cpp contains reusable native NPC, player, game mode, controller,
and HUD classes. To use your own level, create/save it in this project and set
GDMGameMode as its GameMode override. The prototype actors are spawned at runtime;
disable Create Demo World on your GameMode subclass to keep your placed level, lighting and actors. Place AGDMNpc actors (or subclasses), set CharacterId to the original dialogue character ID, and use OpenCharacterById from Blueprint or C++. NPC identity survives JSON character reordering.
Set AGDMController::Variables from game code to control conditions.

The project uses only engine-provided meshes, Slate, and native overlap queries.
No Marketplace assets, plugins, external downloads, or hand-authored binary
assets are required. Engine content remains part of your Unreal installation.
Before distributing a packaged build, verify cooking and the startup map with
your engine version; this export is intended first for Editor playtesting.

Validation: the exported data and actual C++ session are compiled and tested
outside Unreal. Unreal Editor was unavailable during development, so Unreal
Header Tool, engine compilation, Slate rendering, and Play mode remain unverified.
Smoke test: move to the first NPC, advance pages, try each answer and win/loss
outcome, unlock conditional paths with Test variables, close, leave/re-enter,
and try a character with no dialogue.

References:
- https://dev.epicgames.com/documentation/en-us/unreal-engine/setting-up-visual-studio-for-unreal-engine
- https://dev.epicgames.com/documentation/en-us/unreal-engine/game-mode-and-game-state-in-unreal-engine

Dialogue shortcuts: press 1–9 (top row or numeric keypad) to select the corresponding numbered option. Press 1 to continue a line or finish a conversation. Numbers appear separately from dialogue text; locked options cannot be selected. Shortcuts pause while Test variables is open. Options above 9 remain clickable.

Waiting conditions: waitUntilMet defaults to true. Blocked waiting connections remember their upstream node per character for the current game runtime. On returning, the same node is displayed until its condition passes, then the connection is followed. Questions and fights still require a choice. Uncheck this setting to restart normally. This progress is in memory; add your own save-game integration for persistence across reloads.

## Updating an existing integration

Export once to bootstrap the engine project. Afterwards export ordinary JSON and replace only `Content/Dialogue/dialogue.json`. Keep character/node IDs stable. Updates take effect at the next run, not mid-conversation; game saves need their own migration policy if nodes are deleted. Variable dictionaries remain game-owned while running; setting a condition never changes a variable automatically. New condition variables need wiring to your gameplay.

Older exports require a one-time integration upgrade. Merge DialogueJson.h and the GameMode/controller/NPC changes, add the Json module and the DefaultGame.ini staging entry, then rebuild once. Set CharacterId on your existing NPC actors. Disable Create Demo World for a custom level. After this initial upgrade, writing updates only replace Content/Dialogue/dialogue.json.
