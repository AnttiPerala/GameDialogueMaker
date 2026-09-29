# Game Dialogue Maker — Unity playground kit

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
Resources/GDMDialogue.json contains runtime data adapted for JsonUtility.
Source/dialogue.json preserves the original editable data for Dialogue Maker.
Names and arbitrary text are data, not code or Unity object identifiers.
Set DialogueController.Variables from your game to integrate conditions.

Re-export and replace this kit's files to update dialogue; use Rebuild Playground
when characters are added or removed. Back up scene customizations first. Use one
kit per Unity project, as the namespace, resource paths, and menu are shared.

No external assets, paid addons, TextMesh Pro, uGUI, or new packages are required.
If your existing project changes the default 2D collision matrix, make sure
Default-layer objects interact. For a standalone game build, add the generated
scene to your project's build scene list.

Validation: the exporter and plain C# dialogue traversal have automated tests.
An actual Unity Editor import/Play test is still required; Unity was not installed
in the environment where this kit was generated.
