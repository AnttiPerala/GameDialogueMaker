extends SceneTree

var failures: int = 0
func expect(value: bool, message: String) -> void:
	if not value:
		failures += 1
		printerr("FAIL: " + message)

func _initialize() -> void:
	run.call_deferred()

func settle() -> void:
	for frame in range(5):
		await physics_frame
	await process_frame

func run() -> void:
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await settle()
	var player = game.get_node("Player")
	var ui = game.get_node("DialogueUI")
	expect(ui.variables.hasApple == 0.0, "initial hasApple is numeric zero")
	expect(is_instance_valid(game.apple), "native apple pickup exists")
	player.position = Vector2(140, 280)
	await settle()
	expect(ui.session != null and int(ui.session.current.dialogueID) == 200, "Mira asks for apple on contact")
	ui.close_dialogue()
	player.position = Vector2(140, 180)
	await settle()
	player.position = Vector2(140, 280)
	await settle()
	expect(ui.session != null and int(ui.session.current.dialogueID) == 200, "return without pickup still asks")
	ui.close_dialogue()
	player.position = Vector2(580, 180)
	await settle()
	expect(ui.variables.hasApple == 1.0, "native Area2D contact sets hasApple")
	expect(not is_instance_valid(game.apple), "apple disappears after pickup")
	for row in ui.variable_rows.get_children():
		if row.get_meta("variable_name", "") == "hasApple":
			expect(row.get_child(1).value == 1.0, "test variable UI stays synchronized")
	player.position = Vector2(140, 280)
	await settle()
	expect(ui.session != null and int(ui.session.current.dialogueID) == 210, "return contact chooses thank-you branch")
	ui.close_dialogue()
	player.position = Vector2(580, 180)
	await settle()
	expect(ui.variables.hasApple == 1.0, "pickup is not duplicated")
	game.queue_free()
	await process_frame
	if failures == 0: print("GODOT_APPLE_PASS")
	quit(0 if failures == 0 else 1)
