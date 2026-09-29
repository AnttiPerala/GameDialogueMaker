// Engine-independent functions. Uses GML structs and arrays, with explicit value types.
function gdm_session(_character, _variables) {
    return { character: _character, variables: _variables, current: undefined };
}
function gdm_find(_session, _id) {
    var _nodes = _session.character.nodes;
    for (var _i = 0; _i < array_length(_nodes); ++_i)
        if (_nodes[_i].id == _id) return _nodes[_i];
    return undefined;
}
function gdm_go(_session, _id) {
    _session.current = gdm_find(_session, _id);
    return _session.current;
}
function gdm_allows(_session, _edge) {
    for (var _i = 0; _i < array_length(_edge.conditions); ++_i) {
        var _c = _edge.conditions[_i];
        var _actual = variable_struct_get(_session.variables, _c.name);
        var _expected = _c.value;
        var _same = (is_real(_actual) && is_real(_expected)) || (is_string(_actual) && is_string(_expected));
        var _pass = false;
        switch (_c.op) {
            case "=": _pass = _same && _actual == _expected; break;
            case "!=": _pass = !_same || _actual != _expected; break;
            case "<": _pass = _same && _actual < _expected; break;
            case ">": _pass = _same && _actual > _expected; break;
            case "<=": _pass = _same && _actual <= _expected; break;
            case ">=": _pass = _same && _actual >= _expected; break;
        }
        if (!_pass) return false;
    }
    return true;
}
function gdm_start(_session) {
    _session.current = undefined;
    var _edges = _session.character.start;
    for (var _i = 0; _i < array_length(_edges); ++_i)
        if (gdm_allows(_session, _edges[_i])) return gdm_go(_session, _edges[_i].target);
    return undefined;
}
function gdm_can_advance(_session, _node) {
    if (array_length(_node.edges) == 0) return true;
    for (var _i = 0; _i < array_length(_node.edges); ++_i)
        if (gdm_allows(_session, _node.edges[_i])) return true;
    return false;
}
function gdm_advance(_session, _node) {
    for (var _i = 0; _i < array_length(_node.edges); ++_i)
        if (gdm_allows(_session, _node.edges[_i])) return gdm_go(_session, _node.edges[_i].target);
    if (array_length(_node.edges) == 0) return gdm_go(_session, _node.next);
    return _session.current;
}
function gdm_options(_session) {
    var _result = [];
    var _node = _session.current;
    if (is_undefined(_node)) return _result;
    if (_node.type == "question") {
        for (var _i = 0; _i < array_length(_node.edges); ++_i) {
            var _edge = _node.edges[_i];
            var _answer = gdm_find(_session, _edge.target);
            array_push(_result, { text: _answer.text, enabled: gdm_allows(_session, _edge) && gdm_can_advance(_session, _answer), node: _answer, target: "" });
        }
    } else if (_node.type == "fight") {
        for (var _j = 0; _j < array_length(_node.edges); ++_j) {
            var _fight_edge = _node.edges[_j];
            array_push(_result, { text: _j == 0 ? "Win the fight" : _j == 1 ? "Lose the fight" : "Outcome " + string(_j + 1),
                enabled: gdm_allows(_session, _fight_edge), node: undefined, target: _fight_edge.target });
        }
    } else {
        array_push(_result, { text: array_length(_node.edges) > 0 || _node.next != "" ? "Continue" : "Finish",
            enabled: gdm_can_advance(_session, _node), node: _node, target: "" });
    }
    return _result;
}
function gdm_choose(_session, _index) {
    var _options = gdm_options(_session);
    if (_index < 0 || _index >= array_length(_options)) return _session.current;
    var _choice = _options[_index];
    if (!_choice.enabled) return _session.current;
    if (is_undefined(_choice.node)) return gdm_go(_session, _choice.target);
    return gdm_advance(_session, _choice.node);
}
function gdm_default_edges(_variables, _edges) {
    for (var _i = 0; _i < array_length(_edges); ++_i) {
        for (var _j = 0; _j < array_length(_edges[_i].conditions); ++_j) {
            var _c = _edges[_i].conditions[_j];
            if (!variable_struct_exists(_variables, _c.name))
                variable_struct_set(_variables, _c.name, is_real(_c.value) ? 0 : "");
        }
    }
}
function gdm_defaults(_characters) {
    var _variables = {};
    for (var _i = 0; _i < array_length(_characters); ++_i) {
        var _person = _characters[_i];
        gdm_default_edges(_variables, _person.start);
        for (var _j = 0; _j < array_length(_person.nodes); ++_j)
            gdm_default_edges(_variables, _person.nodes[_j].edges);
    }
    return _variables;
}
