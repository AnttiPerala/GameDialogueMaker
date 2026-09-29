var _controller = global.gdm;
if (_controller.error_message != "" || !is_undefined(_controller.session) || _controller.show_variables) exit;
var _dx = (keyboard_check(ord("D")) || keyboard_check(vk_right)) - (keyboard_check(ord("A")) || keyboard_check(vk_left));
var _dy = (keyboard_check(ord("S")) || keyboard_check(vk_down)) - (keyboard_check(ord("W")) || keyboard_check(vk_up));
var _length = point_distance(0, 0, _dx, _dy);
// The sample pickup changes the same variable read by dialogue edge conditions.
if (_controller.apple_sprite != -1 && !_controller.apple_collected &&
    abs(x - _controller.apple_x) < 30 && abs(y - _controller.apple_y) < 30) {
    _controller.apple_collected = true;
    variable_struct_set(_controller.variables, "hasApple", 1);
}
if (_length > 0) {
    var _speed = move_speed * min(delta_time / 1000000, 0.05);
    x = clamp(x + _dx / _length * _speed, 24, room_width - 24);
    y = clamp(y + _dy / _length * _speed, 24, room_height - 24);
}
