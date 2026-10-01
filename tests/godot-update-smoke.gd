extends SceneTree

func _initialize() -> void:
    run.call_deferred()

func run() -> void:
    var source: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://dialogue.json"))
    source.characters.reverse()
    source.characters[1].dialogueNodes[0].dialogueText = "Updated princess greeting."
    var file := FileAccess.open("res://dialogue.json", FileAccess.WRITE)
    file.store_string(JSON.stringify(source))
    file.close()
    var game = load("res://scenes/main.tscn").instantiate()
    root.add_child(game)
    await process_frame
    var npc = game.get_node("NPCs/NPC_1")
    var ui = game.get_node("DialogueUI")
    if npc.character_id != "9" or npc.character_index != 1:
        printerr("FAIL: reordered JSON reassigned the existing NPC")
        quit(1)
        return
    ui.open_character(npc.character_index)
    if ui.content.get_node("Line").text != "Updated princess greeting.":
        printerr("FAIL: plain JSON replacement did not update dialogue")
        quit(1)
        return
    print("GODOT_UPDATE_PASS")
    game.queue_free()
    await process_frame
    quit()
