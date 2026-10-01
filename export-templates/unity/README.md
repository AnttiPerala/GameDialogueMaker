# Game Dialogue Maker â€” Unity playground kit

The downloadable apple-quest demo: talk to Mira, close the conversation, touch
the red apple with green leaves, then return to Mira. Pickup removes the apple
and sets numeric `hasApple = 1`; Mira's root conditions select the request at
`hasApple = 0` and the thank-you at `hasApple = 1`. Returning before pickup still
shows the request. Restart Play/Preview to reset. The pickup is enabled only
when the source demo's `demoAppleQuest` flag is true.

Requires Unity 2022.3 LTS or Unity 6. This is an asset kit, not a standalone Unity
project or a .unitypackage. It uses Unity's own editor APIs to create its scene.

1. Create or open a Unity 2D project (the built-in 2D renderer is recommended).
2. Extract this ZIP and copy Assets/GameDialogueMaker into your project's Assets
   folder. Unity generates its metadata on import; wait for compilation to finish.
3. Choose Tools > Game Dialogue Maker > Create or Open Playground.
4. Press Play, click the Game view, and move with arrows or WASD. Touch an NPC
   to talk. Click dialogue choices. Escape closes the dialogue/test panel.

The menu creates and saves Assets/GameDialogueMaker/Scenes/DialoguePlayground.unity
with a camera, Rigidbody2D player, SpriteRenderers, and one trigger NPC per
character tree. The scene is editable. Subsequent menu use opens the existing
scene without overwriting it. Rebuild Playground asks before replacing it.
There is no automatic modification of your scene or project settings on import.

Player movement pauses while dialogue or test variables are open. NPC colliders
are triggers: contact starts dialogue, but NPCs are not solid obstacles. Leave
and return to restart a conversation. The camera follows larger casts downward.

The built-in Unity IMGUI interface supports multiline dialogue pages, scrollable
long text/answer lists, next-node jumps, conditions, and simulated fight outcomes.
Test variables start at 0 (numbers) or empty (strings). All conditions on an edge
must pass. Normal nodes use the first available outgoing connection; Next is
used only when there are no outgoing connections. Fights are simulated choices,
not a combat system. Both the new Input System and legacy input are supported.

Scripts/DialogueData.cs contains plain C# traversal and typed data models.
Resources/dialogue.json is the ordinary JSON export from Dialogue Maker. DialogueJson.cs reads it at runtime.
Names and arbitrary text are data, not code or Unity object identifiers.
Set DialogueController.Variables from your game to integrate conditions.

To update writing, replace only Assets/GameDialogueMaker/Resources/dialogue.json and restart Play. Do not rebuild the playground or replace your scenes, scripts, sprites or UI. NPC characterId values remain stable if characters are reordered. Add/remove game objects yourself when the cast changes. Keep one kit per Unity project.

Install Unity's official com.unity.nuget.newtonsoft-json package (3.2.1) using Package Manager > Add package by name before importing the scripts. The included Packages/manifest.json lists the dependency for a new project; do not overwrite an existing project's manifest. No paid addons, TextMesh Pro or uGUI are needed.
If your existing project changes the default 2D collision matrix, make sure
Default-layer objects interact. For a standalone game build, add the generated
scene to your project's build scene list.

Validation: the exporter and plain C# dialogue traversal have automated tests.
An actual Unity Editor import/Play test is still required; Unity was not installed
in the environment where this kit was generated.

Dialogue shortcuts: press 1–9 (top row or numeric keypad) to select the corresponding numbered option. Press 1 to continue a line or finish a conversation. Numbers appear separately from dialogue text; locked options cannot be selected. Shortcuts pause while Test variables is open. Options above 9 remain clickable.

Waiting conditions: waitUntilMet defaults to true. Blocked waiting connections remember their upstream node per character for the current game runtime. On returning, the same node is displayed until its condition passes, then the connection is followed. Questions and fights still require a choice. Uncheck this setting to restart normally. This progress is in memory; add your own save-game integration for persistence across reloads.

## Updating an existing integration

Export once to bootstrap the engine project. Afterwards export ordinary JSON and replace only `Assets/GameDialogueMaker/Resources/dialogue.json`. Keep character/node IDs stable. Updates take effect at the next run, not mid-conversation; game saves need their own migration policy if nodes are deleted. Variable dictionaries remain game-owned while running; setting a condition never changes a variable automatically. New condition variables need wiring to your gameplay.

Older exports require a one-time integration upgrade. Install com.unity.nuget.newtonsoft-json, add DialogueJson.cs, merge the controller/NPC updates, and assign Resources/dialogue.json to your existing controller. Keep the existing .meta file when replacing this asset. Set each NPC characterId; custom interactions can call OpenCharacterId. Do not rerun Rebuild Playground or overwrite Packages/manifest.json.
