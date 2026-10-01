extends SceneTree
## Runs inside the real engine against an exported fixture, including physics/UI.
var failures: int = 0

func expect(value: bool, message: String) -> void:
	if not value:
		failures += 1
		printerr("FAIL: " + message)

func _initialize() -> void:
	_run.call_deferred()

func press_number(ui: Node, code: Key, repeated: bool = false) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.pressed = true
	event.echo = repeated
	ui._input(event)

func _run() -> void:
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await process_frame
	var player = game.get_node("Player")
	var ui = game.get_node("DialogueUI")
	var npc = game.get_node("NPCs/NPC_1")
	expect(game.get_node("NPCs").get_child_count() == 2, "one native NPC per character")
	expect(npc.get_node("NameLabel").text == 'Mira / 森 "Hello"', "Unicode and duplicate names preserved")
	for binding in [["move_left", KEY_LEFT], ["move_right", KEY_RIGHT], ["move_up", KEY_UP], ["move_down", KEY_DOWN]]:
		var codes: Array = []
		for event in InputMap.action_get_events(binding[0]):
			codes.append(event.physical_keycode)
		expect(binding[1] in codes, "correct physical arrow key for " + binding[0])
	Input.action_press("move_down")
	for frame in range(65):
		await physics_frame
	Input.action_release("move_down")
	expect(player.position.y > 200, "CharacterBody2D moves with mapped input")
	expect(ui.panel.visible, "Area2D contact opens dialogue")
	expect(player.movement_locked, "movement pauses during conversation")
	expect(ui.session != null and int(ui.session.current.get("dialogueID", 0)) == 10, "correct NPC start node")
	if ui.session == null:
		quit(1)
		return
	var stopped: Vector2 = player.position
	ui.session.current.dialogueSpeakers = ["player", "npc"]
	ui._render()
	expect(ui.content.get_node("Speaker").text == "You", "player speaker label is separate")
	ui.session.character.characterName = "Renamed NPC"
	Input.action_press("move_right")
	for frame in range(5):
		await physics_frame
	Input.action_release("move_right")
	expect(player.position == stopped, "input cannot move player during conversation")
	expect(ui.content.get_node("Choices").get_child(0).get_child(0).text == "1", "continue has a separate number label")
	press_number(ui, KEY_1, true)
	expect(ui.page == 0, "held key does not skip dialogue")
	press_number(ui, KEY_2)
	expect(ui.page == 0, "missing choice does not advance")
	press_number(ui, KEY_1)
	expect(ui.content.get_node("Line").text == "Welcome to the playground.", "newline advances one page")
	expect(ui.content.get_node("Speaker").text == "Renamed NPC", "NPC speaker follows root name")
	press_number(ui, KEY_KP_1)
	expect(int(ui.session.current.dialogueID) == 20, "continue reaches question")
	expect(ui.content.get_node("Choices").get_child_count() == 3, "question shows all answers")
	expect(ui.content.get_node("AnswerSpeaker").visible, "answer options are labelled You")
	expect(ui.content.get_node("Choices").get_child(2).disabled, "conditional answer is disabled")
	press_number(ui, KEY_3)
	expect(int(ui.session.current.dialogueID) == 20, "number shortcut cannot bypass a condition")
	ui.variable_panel.show()
	press_number(ui, KEY_2)
	expect(int(ui.session.current.dialogueID) == 20, "variable entry cannot select answers")
	ui.variable_panel.hide()
	ui._set_variable("keys", 1.0)
	expect(not ui.content.get_node("Choices").get_child(2).disabled, "test variable unlocks answer")
	press_number(ui, KEY_KP_3)
	expect(int(ui.session.current.dialogueID) == 60, "answer follows reaction edge")
	press_number(ui, KEY_1)
	expect(not ui.panel.visible and not player.movement_locked, "terminal node closes and resumes movement")
	for frame in range(5):
		await physics_frame
	expect(not ui.panel.visible, "standing in an NPC does not immediately reopen dialogue")
	# Move away, then return: test genuine physics signal re-entry.
	Input.action_press("move_up")
	for frame in range(12):
		await physics_frame
	Input.action_release("move_up")
	Input.action_press("move_down")
	for frame in range(20):
		await physics_frame
	Input.action_release("move_down")
	expect(ui.panel.visible, "leaving and re-entering NPC restarts dialogue")
	ui.close_dialogue()
	ui.open_character(1)
	expect(ui.content.get_node("Line").text.begins_with("No available"), "empty character has a useful message")
	ui.close_dialogue()
	ui._toggle_variables()
	expect(player.movement_locked, "test panel pauses movement")
	var escape := InputEventAction.new()
	escape.action = "ui_cancel"
	escape.pressed = true
	ui._input(escape)
	expect(not ui.is_busy() and not player.movement_locked, "Escape closes panels")
	# Test traversal independently of the UI using the shipped GDScript.
	var Session = load("res://scripts/dialogue_session.gd")
	var session = Session.new(ui.characters[0], {"keys": 0.0})
	session.start()
	session.choose(0)
	session.choose(0)
	expect(int(session.current.dialogueID) == 50, "long-road answer reaches fight")
	session.choose(1)
	expect(int(session.current.dialogueID) == 70, "lose fight reaches loss branch")
	session.choose(0)
	expect(int(session.current.dialogueID) == 10, "next-node loop returns to start")
	session.choose(0)
	session.choose(1)
	expect(int(session.current.dialogueID) == 60, "answer Next jump works")
	for comparison in [["=",2.0,true], ["!=",2.0,false], ["<",3.0,true], [">",1.0,true], ["<=",2.0,true], [">=",2.0,true], ["=","2",false]]:
		session.variables.x = 2.0
		expect(session.allows({"transitionConditions":[{"variableName":"x","comparisonOperator":comparison[0],"variableValue":comparison[1]}]}) == comparison[2], "typed condition " + comparison[0])
	# Verify close/reopen through the real UI cache, then release the waiting point.
	ui.close_dialogue()
	var request: Dictionary = ui.characters[0].dialogueNodes[5]
	var gate := {"variableName":"apple", "comparisonOperator":"=", "variableValue":1.0}
	request.outgoingLines = [{"toNode":70, "transitionConditions":[gate]}]
	ui.variables.apple = 0.0
	ui.open_character(0)
	ui.session.go(60)
	ui.close_dialogue()
	ui.open_character(0)
	expect(int(ui.session.current.dialogueID) == 60, "waiting line survives close")
	ui.close_dialogue()
	ui.variables.apple = 1.0
	ui.open_character(0)
	expect(int(ui.session.current.dialogueID) == 70, "unlocked condition resumes downstream")
	ui.close_dialogue()
	ui.open_character(0)
	expect(int(ui.session.current.dialogueID) == 10, "checkpoint consumed")
	gate.waitUntilMet = false
	ui.variables.apple = 0.0
	ui.session.go(60)
	ui.close_dialogue()
	ui.open_character(0)
	expect(int(ui.session.current.dialogueID) == 10, "unchecked condition restarts")
	for movement_key in [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN]:
		ui.open_character(0)
		press_number(ui, movement_key)
		expect(not ui.is_busy() and not player.movement_locked, "movement key closes dialogue and unlocks player")
	game.queue_free()
	await process_frame
	if failures == 0:
		print("GODOT_SMOKE_PASS: physics contact, movement, UI, pages, branching, conditions, loops and empty NPCs")
	quit(0 if failures == 0 else 1)
