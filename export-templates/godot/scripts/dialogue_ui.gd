extends CanvasLayer
## Native Godot controls; no web view or external dependencies.

signal busy_changed(locked: bool)
const Session = preload("res://scripts/dialogue_session.gd")
var characters: Array = []
var variables: Dictionary = {}
var session: RefCounted
var page: int = 0
@onready var panel: PanelContainer = $DialoguePanel
@onready var content: VBoxContainer = $DialoguePanel/Margin/Scroll/Content
@onready var variable_panel: PanelContainer = $VariablePanel
@onready var variable_rows: VBoxContainer = $VariablePanel/Margin/Scroll/Rows

func _ready() -> void:
	content.get_node("Close").pressed.connect(close_dialogue)
	$HUD/Row/Variables.pressed.connect(_toggle_variables)
	variable_rows.get_node("Close").pressed.connect(_toggle_variables)

func configure(data: Array) -> void:
	characters = data
	for character in characters:
		var sources: Array = [character] + character.get("dialogueNodes", [])
		for source in sources:
			for line in source.get("outgoingLines", []):
				for condition in line.get("transitionConditions", []):
					if not variables.has(condition.variableName):
						variables[condition.variableName] = 0.0 if condition.variableValue is float or condition.variableValue is int else ""
	for key in variables:
		var row := HBoxContainer.new()
		row.set_meta("variable_name", key)
		var label := Label.new()
		label.text = key
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(label)
		if variables[key] is float or variables[key] is int:
			var input := SpinBox.new()
			input.allow_greater = true
			input.allow_lesser = true
			input.step = 0.01
			input.custom_minimum_size.x = 150
			input.value_changed.connect(func(value: float): _set_variable(key, value))
			row.add_child(input)
		else:
			var input := LineEdit.new()
			input.custom_minimum_size.x = 150
			input.text_changed.connect(func(value: String): _set_variable(key, value))
			row.add_child(input)
		variable_rows.add_child(row)

func _set_variable(key: String, value: Variant) -> void:
	variables[key] = value
	if session != null:
		_render(false)

func set_game_variable(key: String, value: Variant) -> void:
	_set_variable(key, value)
	for row in variable_rows.get_children():
		if row.get_meta("variable_name", "") == key:
			var input = row.get_child(1)
			if input is SpinBox:
				input.set_value_no_signal(float(value))
			elif input is LineEdit:
				input.text = str(value)

func is_busy() -> bool:
	return panel.visible or variable_panel.visible

func _toggle_variables() -> void:
	variable_panel.visible = not variable_panel.visible
	busy_changed.emit(is_busy())

func open_character(index: int) -> void:
	if is_busy() or index < 0 or index >= characters.size():
		return
	session = Session.new(characters[index], variables)
	session.start()
	page = 0
	panel.show()
	busy_changed.emit(true)
	_render()

func close_dialogue() -> void:
	panel.hide()
	session = null
	busy_changed.emit(is_busy())

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and is_busy():
		variable_panel.hide()
		close_dialogue()
		get_viewport().set_input_as_handled()

func _render(focus_choice: bool = true) -> void:
	if session == null:
		return
	content.get_node("Speaker").text = str(session.character.get("characterName", "Unnamed character"))
	var choices: VBoxContainer = content.get_node("Choices")
	for child in choices.get_children():
		choices.remove_child(child)
		child.queue_free()
	content.get_node("Hint").text = ""
	if session.current.is_empty():
		content.get_node("Line").text = "No available starting dialogue. Check the root connection or test variables."
		_add_button("Try again", func(): session.start(); page = 0; _render())
	else:
		var pages := str(session.current.get("dialogueText", "")).replace("\r\n", "\n").split("\n")
		content.get_node("Line").text = pages[page]
		if page < pages.size() - 1:
			_add_button("Continue", func(): page += 1; _render())
		else:
			var options: Array = session.options()
			for index in range(options.size()):
				var option: Dictionary = options[index]
				_add_button(str(option.text), _choose.bind(index), option.enabled)
				if not option.enabled:
					content.get_node("Hint").text = "Some paths are locked. Use Test variables to try them."
	$DialoguePanel/Margin/Scroll.scroll_vertical = 0
	if focus_choice:
		for child in choices.get_children():
			if not child.disabled:
				child.grab_focus()
				break

func _add_button(text: String, action: Callable, enabled: bool = true) -> void:
	var button := Button.new()
	button.text = text
	button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	button.custom_minimum_size.y = 40
	button.disabled = not enabled
	button.pressed.connect(action)
	content.get_node("Choices").add_child(button)

func _choose(index: int) -> void:
	session.choose(index)
	page = 0
	if session.current.is_empty():
		close_dialogue()
	else:
		_render()

func show_error(message: String) -> void:
	panel.show()
	content.get_node("Speaker").text = "Dialogue error"
	content.get_node("Line").text = message
