# Dialogue Playground — Godot 4

The downloadable apple-quest demo: talk to Mira, close the conversation, touch
the red apple with green leaves, then return to Mira. Pickup removes the apple
and sets numeric `hasApple = 1`; Mira's root conditions select the request at
`hasApple = 0` and the thank-you at `hasApple = 1`. Returning before pickup still
shows the request. Restart Play/Preview to reset. The pickup is enabled only
when the source demo's `demoAppleQuest` flag is true.

Extract this ZIP, import project.godot in Godot 4.5 or newer, and press F6
(current scene) or F5 (project). No plugins, .NET, or external assets are required.

Move the blue player with arrows or WASD and touch a colored NPC to talk.
Click choices or use Tab and Enter. Escape closes dialogue and the variable
panel. Move away and return to the NPC to restart the conversation.

Every character tree has its own NPC scene instance, even if names are identical.
The world grows vertically for larger casts, and the player's camera follows.
Empty trees show a message instead of failing. Newlines advance as dialogue pages;
long pages and lists of answers scroll in the dialogue panel.

Use Test variables to change conditions. Numeric variables start at 0 and strings
start empty. All conditions on an edge must pass. Normal nodes select the first
available outgoing edge; Next is used only when there are no outgoing edges.
Fight nodes offer simulated win/loss choices, not a combat system.

Edit scenes/main.tscn to reposition characters, scenes/player.tscn and
scenes/npc.tscn to customize their shapes, and scenes/dialogue_ui.tscn for the UI.
NPCs use Area2D.body_entered to detect the CharacterBody2D player. Movement pauses
while a conversation or test panel is open. The areas are contact triggers;
they do not act as solid obstacles.

Dialogue is in dialogue.json. NPC character_index maps to its characters array.
Export again after adding or removing characters. To integrate with your game,
set DialogueUI.variables, replace the test panel with your own game state,
and use dialogue_session.gd for traversal. The exporter preserves original
names and text in JSON rather than treating them as scene names or script code.
