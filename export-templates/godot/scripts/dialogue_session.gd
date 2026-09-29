extends RefCounted
## Engine-independent traversal. Variables are shared with the playground.

var character: Dictionary
var variables: Dictionary
var nodes: Dictionary = {}
var current: Dictionary = {}

func _init(data: Dictionary, game_variables: Dictionary) -> void:
	character = data
	variables = game_variables
	for node in character.get("dialogueNodes", []):
		nodes[str(int(node.dialogueID))] = node

func go(id: Variant) -> Dictionary:
	current = nodes.get(str(int(id)) if id != null else "", {})
	return current

func allows(line: Dictionary) -> bool:
	for condition in line.get("transitionConditions", []):
		var actual: Variant = variables.get(condition.variableName)
		var expected: Variant = condition.variableValue
		# JSON numbers are floats. Compare numbers numerically, strings as strings.
		var same_type := (actual is float or actual is int) and (expected is float or expected is int)
		same_type = same_type or (actual is String and expected is String)
		var passes := false
		match condition.comparisonOperator:
			"=": passes = same_type and actual == expected
			"!=": passes = not same_type or actual != expected
			"<": passes = same_type and actual < expected
			">": passes = same_type and actual > expected
			"<=": passes = same_type and actual <= expected
			">=": passes = same_type and actual >= expected
		if not passes:
			return false
	return true

func start() -> Dictionary:
	current = {}
	for line in character.get("outgoingLines", []):
		if allows(line):
			return go(line.toNode)
	return current

func can_advance(node: Dictionary) -> bool:
	var lines: Array = node.get("outgoingLines", [])
	if lines.is_empty():
		return true
	for line in lines:
		if allows(line):
			return true
	return false

func advance(node: Dictionary) -> Dictionary:
	var lines: Array = node.get("outgoingLines", [])
	if lines.is_empty():
		return go(node.get("nextNode", -1))
	for line in lines:
		if allows(line):
			return go(line.toNode)
	return current

func options() -> Array:
	var result: Array = []
	if current.is_empty():
		return result
	var lines: Array = current.get("outgoingLines", [])
	match current.dialogueType:
		"question":
			for line in lines:
				var answer: Dictionary = nodes.get(str(int(line.toNode)), {})
				result.append({"text": answer.get("dialogueText", "(Empty answer)"),
					"enabled": allows(line) and can_advance(answer), "node": answer})
		"fight":
			for index in range(lines.size()):
				var label := "Win the fight" if index == 0 else "Lose the fight"
				if index > 1:
					label = "Outcome %d" % (index + 1)
				result.append({"text": label, "enabled": allows(lines[index]), "target": lines[index].toNode})
		_:
			var label := "Continue" if not lines.is_empty() or int(current.get("nextNode", -1)) > 0 else "Finish"
			result.append({"text": label, "enabled": can_advance(current), "node": current})
	return result

func choose(index: int) -> Dictionary:
	var choices := options()
	if index < 0 or index >= choices.size() or not choices[index].enabled:
		return current
	var choice: Dictionary = choices[index]
	if choice.has("target"):
		return go(choice.target)
	return advance(choice.node)
