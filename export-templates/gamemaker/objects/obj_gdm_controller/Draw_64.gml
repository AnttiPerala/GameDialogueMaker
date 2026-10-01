buttons = [];
draw_set_font(-1);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_set_alpha(1);
gdm_panel(12, 12, 936, 70);
draw_text(26, 24, "Blue square = you | Move: WASD / arrows | Touch an NPC to talk\nClick answers | Mouse wheel: scroll dialogue | Esc: close");
if (error_message != "") { draw_text_ext(26, 100, error_message, 22, 890); exit; }
gdm_button(766, 26, 164, 38, "Test variables", "variables", 0, true);
if (data.demoAppleQuest) draw_text(26, 88, apple_collected ? "Apple collected! Return to Mira." : "Apple: not collected. Talk to Mira, then touch the red apple.");

if (show_variables) {
    gdm_panel(130, 100, 700, 520);
    draw_text(150, 118, "Test variables - click a value to edit; backspace to replace it.");
    var _end = min(variable_offset + 5, array_length(variable_names));
    var _y = 154;
    for (var _i = variable_offset; _i < _end; ++_i) {
        var _name = variable_names[_i];
        var _value = string(variable_struct_get(variables, _name));
        // Full variable names/values are shown while editing below.
        gdm_button(150, _y, 660, 42, string_copy(_name + " = " + _value, 1, 75), "edit", _i, true);
        _y += 48;
    }
    if (array_length(variable_names) == 0) draw_text(150, _y, "No conditions in this dialogue.");
    gdm_button(150, 398, 140, 36, "Previous", "var_prev", 0, variable_offset > 0);
    gdm_button(310, 398, 140, 36, "Next", "var_next", 0, _end < array_length(variable_names));
    if (editing != "") {
        draw_text_ext(150, 442, "Editing: " + editing, 18, 650);
        // Show the tail of long input so the caret position stays visible.
        draw_text(150, 488, string_copy(keyboard_string, max(1, string_length(keyboard_string) - 70), 71) + "|");
        draw_text(150, 520, edit_error);
        gdm_button(150, 558, 150, 38, "Apply value", "apply", 0, true);
    }
    gdm_button(570, 558, 240, 38, "Close test variables", "variables", 0, true);
    exit;
}

if (is_undefined(session)) exit;
gdm_panel(60, 234, 840, 394);
var _role = "npc";
if (!is_undefined(session.current)) {
    _role = session.current.type == "answer" ? "player" : "npc";
    if (variable_struct_exists(session.current, "speakers") && page < array_length(session.current.speakers)) _role = session.current.speakers[page];
}
draw_set_colour(make_colour_rgb(155, 217, 255));
draw_text_ext(80, 246, _role == "player" ? "You" : _role == "scene" ? "Scene" : session.character.name, 20, 800);
draw_set_colour(c_white);
// Draw GUI scissor coordinates are back-buffer pixels, not GUI coordinates.
var _old_scissor = gpu_get_scissor();
var _sx = window_get_width() / 960;
var _sy = window_get_height() / 640;
gpu_set_scissor(70 * _sx, 288 * _sy, 820 * _sx, 292 * _sy);
var _top = 298 - scroll;
var _yy = _top;
if (is_undefined(session.current)) {
    draw_text_ext(80, _yy, "No available starting dialogue. Check the root connection and test variables.", 22, 800);
    _yy += 64;
    gdm_button(80, _yy, 800, 38, "Try again", "retry", 0, true);
    _yy += 46;
} else {
    var _pages = string_split(string_replace_all(session.current.text, "\r\n", "\n"), "\n", false);
    if (array_length(_pages) == 0) _pages = [""];
    page = clamp(page, 0, array_length(_pages) - 1);
    draw_text_ext(80, _yy, _pages[page], 22, 800);
    _yy += max(30, string_height_ext(_pages[page], 22, 800)) + 16;
    if (page + 1 < array_length(_pages)) {
        gdm_button(80, _yy, 800, 38, "Continue", "page", 0, true);
        _yy += 46;
    } else {
        if (session.current.type == "question") {
            draw_set_colour(make_colour_rgb(155, 217, 255));
            draw_text(80, _yy, "You");
            draw_set_colour(c_white);
            _yy += 28;
        }
        var _choices = gdm_options(session);
        for (var _j = 0; _j < array_length(_choices); ++_j) {
            var _choice = _choices[_j];
            var _height = max(38, string_height_ext(_choice.text, 20, 754) + 16);
            gdm_button(80, _yy, 800, _height, _choice.text, "choice", _j, _choice.enabled);
            _yy += _height + 8;
        }
    }
}
scroll_max = max(0, _yy - _top - 272);
scroll = clamp(scroll, 0, scroll_max);
gpu_set_scissor(_old_scissor);
// Crop mouse hit regions to match the visible scroll area.
for (var _k = 1; _k < array_length(buttons); ++_k) {
    var _button = buttons[_k];
    var _bottom = min(580, _button.y + _button.h);
    _button.y = max(288, _button.y);
    _button.h = max(0, _bottom - _button.y);
    if (_button.h == 0) _button.enabled = false;
}
gdm_button(80, 588, 230, 30, "Close conversation", "close", 0, true);
draw_set_colour(c_white);
draw_text(330, 595, "Scroll for more text / choices. Locked choices are dimmed.");
