// Engine-independent functions. Uses GML structs and arrays, with explicit value types.
function gdm_session(_character, _variables) {
    return { character: _character, variables: _variables, current: undefined, waiting: [] };
}
function gdm_find(_session, _id) {
    var _nodes = _session.character.nodes;
    for (var _i = 0; _i < array_length(_nodes); ++_i)
        if (_nodes[_i].id == _id) return _nodes[_i];
    return undefined;
}
function gdm_go(_session, _id) {
    _session.current = gdm_find(_session, _id);
    _session.waiting = [];
    if (!is_undefined(_session.current)) {
        var _edges = _session.current.edges;
        for (var _i = 0; _i < array_length(_edges); ++_i)
            for (var _j = 0; _j < array_length(_edges[_i].conditions); ++_j) {
                var _c = _edges[_i].conditions[_j];
                if ((!variable_struct_exists(_c, "waitUntilMet") || _c.waitUntilMet) && !gdm_allows(_session, _edges[_i])) {
                    array_push(_session.waiting, _edges[_i]); break;
                }
            }
    }
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
    if (!is_undefined(_session.current) && array_length(_session.waiting) > 0) {
        if (_session.current.type != "question" && _session.current.type != "fight")
            for (var _w = 0; _w < array_length(_session.waiting); ++_w)
                if (gdm_allows(_session, _session.waiting[_w])) return gdm_go(_session, _session.waiting[_w].target);
        return _session.current;
    }
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


// Convert the ordinary Dialogue Maker JSON once; the rest of the game uses stable runtime structs.
function gdm_field(_object, _name, _fallback) {
    var _value = variable_struct_get(_object, _name);
    return is_undefined(_value) ? _fallback : _value;
}
function gdm_parse_edges(_lines) {
    var _result = [];
    for (var _i = 0; _i < array_length(_lines); ++_i) {
        var _line = _lines[_i];
        var _conditions = gdm_field(_line, "transitionConditions", []);
        var _converted = [];
        for (var _j = 0; _j < array_length(_conditions); ++_j) {
            var _c = _conditions[_j];
            if (!is_real(_c.variableValue) && !is_string(_c.variableValue)) throw "Condition value must be number or text";
            array_push(_converted, {name:_c.variableName, op:_c.comparisonOperator, value:_c.variableValue,
                waitUntilMet:gdm_field(_c, "waitUntilMet", true)});
        }
        array_push(_result, {target:string(_line.toNode), conditions:_converted});
    }
    return _result;
}
function gdm_parse_dialogue(_source) {
    var _result = {demoAppleQuest:gdm_field(_source, "demoAppleQuest", false), characters:[]};
    var _people = gdm_field(_source, "characters", []);
    for (var _i = 0; _i < array_length(_people); ++_i) {
        var _c = _people[_i];
        var _nodes = gdm_field(_c, "dialogueNodes", []);
        var _person = {id:string(_c.characterID), name:gdm_field(_c, "characterName", "Unnamed character"),
            color:16222902, start:gdm_parse_edges(gdm_field(_c,"outgoingLines",[])), nodes:[]};
        var _hex = string_lower(gdm_field(_c, "bgColor", "#b68af7"));
        if (string_length(_hex) == 7) {
            var _rgb = [];
            for (var _h = 1; _h < 7; _h += 2) {
                var _high = string_pos(string_char_at(_hex, _h + 1), "0123456789abcdef") - 1;
                var _low = string_pos(string_char_at(_hex, _h + 2), "0123456789abcdef") - 1;
                array_push(_rgb, max(90, _high * 16 + _low));
            }
            _person.color = make_colour_rgb(_rgb[0], _rgb[1], _rgb[2]);
        }
        for (var _n = 0; _n < array_length(_nodes); ++_n) {
            var _node = _nodes[_n];
            var _next = gdm_field(_node,"nextNode",-1);
            array_push(_person.nodes, {id:string(_node.dialogueID), type:_node.dialogueType,
                text:gdm_field(_node,"dialogueText",""), speakers:gdm_field(_node,"dialogueSpeakers",[]),
                next:_next > 0 ? string(_next) : "", edges:gdm_parse_edges(gdm_field(_node,"outgoingLines",[]))});
        }
        array_push(_result.characters, _person);
    }
    return _result;
}
