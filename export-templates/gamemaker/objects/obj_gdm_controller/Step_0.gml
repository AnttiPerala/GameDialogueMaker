if (error_message != "") exit;
if (keyboard_check_pressed(vk_escape)) {
    session = undefined;
    show_variables = false;
    editing = "";
}
if (!show_variables && !is_undefined(session) &&
    (keyboard_check_pressed(vk_left) || keyboard_check_pressed(vk_right) ||
     keyboard_check_pressed(vk_up) || keyboard_check_pressed(vk_down) ||
     keyboard_check_pressed(ord("W")) || keyboard_check_pressed(ord("A")) ||
     keyboard_check_pressed(ord("S")) || keyboard_check_pressed(ord("D")))) session = undefined;
if (instance_exists(player) && camera != -1) {
    camera_set_view_pos(camera, 0, clamp(player.y - 240, 0, max(0, room_height - 640)));
}
var _mx = device_mouse_x_to_gui(0);
var _my = device_mouse_y_to_gui(0);
if (!show_variables && !is_undefined(session) && point_in_rectangle(_mx, _my, 70, 288, 890, 580)) {
    scroll = clamp(scroll + (mouse_wheel_down() - mouse_wheel_up()) * 44, 0, scroll_max);
}
// Read the current session, not the previous draw's (possibly clipped) hit regions.
if (!show_variables && !is_undefined(session) && !keyboard_check(vk_control) && !keyboard_check(vk_alt) && !keyboard_check(vk_shift)) {
    for (var _digit = 0; _digit < 9; ++_digit) {
        if (!keyboard_check_pressed(ord("1") + _digit) && !keyboard_check_pressed(vk_numpad1 + _digit)) continue;
        if (is_undefined(session.current)) {
            if (_digit == 0) { gdm_start(session); page = 0; scroll = 0; }
        } else {
            var _pages = string_split(string_replace_all(session.current.text, "\r\n", "\n"), "\n", false);
            if (page + 1 < array_length(_pages)) {
                if (_digit == 0) { page++; scroll = 0; }
            } else {
                var _choices = gdm_options(session);
                if (_digit < array_length(_choices) && _choices[_digit].enabled) {
                    gdm_choose(session, _digit);
                    if (is_undefined(session.current)) session = undefined;
                    page = 0; scroll = 0;
                }
            }
        }
        buttons = [];
        exit;
    }
}
if (!mouse_check_button_pressed(mb_left)) exit;
for (var _i = 0; _i < array_length(buttons); ++_i) {
    var _b = buttons[_i];
    if (!_b.enabled || !point_in_rectangle(_mx, _my, _b.x, _b.y, _b.x + _b.w, _b.y + _b.h)) continue;
    switch (_b.action) {
        case "variables": show_variables = !show_variables; editing = ""; break;
        case "close": session = undefined; break;
        case "page": page++; scroll = 0; break;
        case "retry": gdm_start(session); page = 0; scroll = 0; break;
        case "choice":
            gdm_choose(session, _b.index);
            if (is_undefined(session.current)) session = undefined;
            page = 0; scroll = 0;
            break;
        case "var_prev": variable_offset = max(0, variable_offset - 5); editing = ""; break;
        case "var_next": variable_offset += 5; editing = ""; break;
        case "edit":
            editing = variable_names[_b.index];
            keyboard_string = string(variable_struct_get(variables, editing));
            edit_error = "";
            break;
        case "apply":
            var _old = variable_struct_get(variables, editing);
            try {
                var _new = is_real(_old) ? real(keyboard_string) : keyboard_string;
                if (is_real(_new) && (is_nan(_new) || is_infinity(_new))) throw "Use a finite number.";
                variable_struct_set(variables, editing, _new);
                editing = "";
                edit_error = "";
            } catch (_exception) { edit_error = "Enter a finite number; use a dot for decimals."; }
            break;
    }
    buttons = [];
    break;
}
