extends Area2D

signal talk_requested(character_index: int)
@export var character_index: int = 0
@export var tint := Color("b68af7")

func _ready() -> void:
	$Body.color = tint
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		talk_requested.emit(character_index)

func set_character_name(value: String) -> void:
	$NameLabel.text = value
