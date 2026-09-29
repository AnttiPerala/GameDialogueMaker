extends CharacterBody2D

@export var speed: float = 220.0
@export var world_size := Vector2(960, 640)
var movement_locked: bool = false

func _physics_process(_delta: float) -> void:
	if movement_locked:
		velocity = Vector2.ZERO
		return
	velocity = Input.get_vector("move_left", "move_right", "move_up", "move_down") * speed
	move_and_slide()
	position = position.clamp(Vector2(20, 100), world_size - Vector2(20, 20))
