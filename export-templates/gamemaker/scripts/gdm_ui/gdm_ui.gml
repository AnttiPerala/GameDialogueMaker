function gdm_button(_x, _y, _w, _h, _text, _action, _index, _enabled) {
    draw_set_colour(_enabled ? make_colour_rgb(43, 65, 99) : make_colour_rgb(38, 43, 52));
    draw_rectangle(_x, _y, _x + _w, _y + _h, false);
    draw_set_colour(_enabled ? c_white : c_gray);
    draw_text_ext(_x + 10, _y + 8, _text, 20, _w - 20);
    array_push(global.gdm.buttons, { x:_x, y:_y, w:_w, h:_h, action:_action, index:_index, enabled:_enabled });
}
function gdm_panel(_x, _y, _w, _h) {
    draw_set_colour(make_colour_rgb(20, 29, 48));
    draw_rectangle(_x, _y, _x + _w, _y + _h, false);
    draw_set_colour(c_white);
}
