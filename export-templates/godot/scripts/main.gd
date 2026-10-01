extends Node2D

var apple: Area2D

func _ready() -> void:
	var text := FileAccess.get_file_as_string("res://dialogue.json")
	var data: Variant = JSON.parse_string(text)
	if not data is Dictionary or not data.get("characters") is Array:
		$DialogueUI.show_error("Could not load dialogue.json. Check its JSON syntax.")
		$Player.movement_locked = true
		return
	$DialogueUI.configure(data.characters)
	$DialogueUI.busy_changed.connect(_on_busy_changed)
	for npc in $NPCs.get_children():
		if not npc.character_id.is_empty():
			npc.character_index = -1
			for index in range(data.characters.size()):
				if str(int(data.characters[index].get("characterID", -1))) == npc.character_id:
					npc.character_index = index
					break
		if npc.character_index < 0 or npc.character_index >= data.characters.size():
			continue
		npc.set_character_name(str(data.characters[npc.character_index].get("characterName", "Unnamed character")))
		npc.talk_requested.connect($DialogueUI.open_character)
	$Player/Camera2D.limit_bottom = int($Player.world_size.y)
	if data.get("demoAppleQuest", false):
		apple = Area2D.new()
		apple.name = "Apple"
		apple.position = Vector2(580, 180)
		apple.collision_layer = 0
		apple.collision_mask = 1
		var sprite := Sprite2D.new()
		sprite.texture = load("res://art/apple.png")
		apple.add_child(sprite)
		var collision := CollisionShape2D.new()
		var shape := RectangleShape2D.new()
		shape.size = Vector2(28, 28)
		collision.shape = shape
		apple.add_child(collision)
		apple.body_entered.connect(_pick_up_apple)
		add_child(apple)
		$DialogueUI/HUD/Row/Instructions.text += "\nApple: not collected. Talk to Mira."

func _pick_up_apple(body: Node2D) -> void:
	if body != $Player or not is_instance_valid(apple) or $DialogueUI.is_busy():
		return
	$DialogueUI.set_game_variable("hasApple", 1.0)
	apple.queue_free()
	apple = null
	$DialogueUI/HUD/Row/Instructions.text = "Move: arrows / WASD. Apple collected! Return to Mira."

func _on_busy_changed(locked: bool) -> void:
	$Player.movement_locked = locked
