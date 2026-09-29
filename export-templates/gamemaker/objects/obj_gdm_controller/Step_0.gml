if (error_message != "") exit;
if (keyboard_check_pressed(vk_escape)) {
    session = undefined;
    show_variables = false;
    editing = "";
}
if (instance_exists(player) && camera != -1) {
    camera_set_view_pos(camera, 0, clamp(player.y - 240, 0, max(0, room_height - 640)));
}
var _mx = device_mouse_x_to_gui(0);
var _my = device_mouse_y_to_gui(0);
if (!show_variables && !is_undefined(session) && point_in_rectangle(_mx, _my, 70, 288, 890, 580)) {
    scroll = clamp(scroll + (mouse_wheel_down() - mouse_wheel_up()) * 44, 0, scroll_max);
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
