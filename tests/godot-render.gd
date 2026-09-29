extends SceneTree
## Optional visual check: run with a graphical Godot binary, not --headless.
func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	current_scene = game
	await process_frame
	var ui = game.get_node("DialogueUI")
	ui.open_character(0)
	ui.session.go(20)
	ui._render()
	for frame in range(5):
		await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://godot-preview.png")
	game.queue_free()
	await process_frame
	quit()
