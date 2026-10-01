var _touching = place_meeting(x, y, obj_gdm_player);
var _controller = global.gdm;
if (character_id != "") {
    character_index = -1;
    for (var _i = 0; _i < array_length(_controller.data.characters); ++_i)
        if (_controller.data.characters[_i].id == character_id) { character_index = _i; break; }
}
if (character_index < 0 || character_index >= array_length(_controller.data.characters)) exit;
if (_touching && !was_touching && is_undefined(_controller.session) && !_controller.show_variables) {
    var _key = string(character_index);
    if (!variable_struct_exists(_controller.sessions, _key))
        variable_struct_set(_controller.sessions, _key, gdm_session(_controller.data.characters[character_index], _controller.variables));
    _controller.session = variable_struct_get(_controller.sessions, _key);
    gdm_start(_controller.session);
    _controller.page = 0;
    _controller.scroll = 0;
}
was_touching = _touching;
