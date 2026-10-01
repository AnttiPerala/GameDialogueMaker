global.gdm = id;
create_demo_world = true; // Set false when using your own room and placed objects.
session = undefined;
sessions = {};
show_variables = false;
editing = "";
edit_error = "";
page = 0;
scroll = 0;
scroll_max = 0;
variable_offset = 0;
buttons = [];
error_message = "";
character_sprite = -1;
apple_sprite = -1;
apple_collected = false;
apple_x = 580;
apple_y = 180;
camera = -1;
player = noone;
display_set_gui_size(960, 640);
window_set_size(960, 640);
window_set_caption("Dialogue Playground - Game Dialogue Maker");
try {
    var _buffer = buffer_load("dialogue.json");
    if (_buffer < 0) throw "Cannot load dialogue.json from Included Files.";
    var _json = buffer_read(_buffer, buffer_string);
    buffer_delete(_buffer);
    data = gdm_parse_dialogue(json_parse(_json));
    variables = gdm_defaults(data.characters);
    if (data.demoAppleQuest) apple_sprite = sprite_add("apple.png", 1, false, false, 16, 16);
    variable_names = variable_struct_get_names(variables);
    character_sprite = sprite_add("character.png", 1, false, false, 16, 16);
    if (character_sprite < 0) throw "Cannot load character.png from Included Files.";
    sprite_collision_mask(character_sprite, false, bboxmode_fullimage, 0, 0, 0, 0, bboxkind_rectangular, 0);
    if (create_demo_world) {
    player = instance_create_layer(140, 120, "Instances", obj_gdm_player);
    for (var _i = 0; _i < array_length(data.characters); ++_i) {
        var _npc = instance_create_layer(140 + (_i mod 4) * 220, 280 + floor(_i / 4) * 150, "Instances", obj_gdm_npc);
        _npc.character_index = _i;
        _npc.character_id = data.characters[_i].id;
        _npc.image_blend = data.characters[_i].color;
    }
    } else player = instance_find(obj_gdm_player, 0);
    view_enabled = true;
    view_visible[0] = true;
    view_wport[0] = 960;
    view_hport[0] = 640;
    camera = camera_create_view(0, 0, 960, 640);
    view_camera[0] = camera;
} catch (_exception) {
    error_message = "Could not start playground: " + string(_exception);
}
