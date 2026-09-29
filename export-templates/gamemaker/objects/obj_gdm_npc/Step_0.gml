var _touching = place_meeting(x, y, obj_gdm_player);
var _controller = global.gdm;
if (_touching && !was_touching && is_undefined(_controller.session) && !_controller.show_variables) {
    _controller.session = gdm_session(_controller.data.characters[character_index], _controller.variables);
    gdm_start(_controller.session);
    _controller.page = 0;
    _controller.scroll = 0;
}
was_touching = _touching;
