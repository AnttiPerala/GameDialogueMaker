const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fixture = require('./dialogue-fixture');
const template = require('../js/gameMakerTemplate');
const { buildGameMakerProject } = require('../js/exportGameMaker');
const { createExportZip } = require('../js/exportCommon');

test('GameMaker export preserves Unicode, typed data, source and live editor state', () => {
    const source = fixture();
    const dom = {}; dom.circular = dom;
    source.characters[0].nodeElement = dom;
    const files = buildGameMakerProject(source, template);
    const runtime = sessionHarness().gdm_parse_dialogue(JSON.parse(files['datafiles/dialogue.json']));
    assert.equal(source.characters[0].nodeElement, dom);
    assert.equal(runtime.characters[0].name, source.characters[0].characterName);
    assert.equal(runtime.characters[0].nodes[0].text, source.characters[0].dialogueNodes[0].dialogueText);
    assert.equal(runtime.characters[0].nodes[3].next, '60');
    assert.equal(runtime.characters[0].nodes[7].edges[0].conditions[0].value, 1);
    assert.equal(runtime.characters[1].nodes.length, 0);
    delete source.characters[0].nodeElement;
    assert.deepEqual(JSON.parse(files['datafiles/dialogue.json']), source);
    assert.equal(Buffer.from(files['datafiles/character.png']).subarray(1,4).toString(), 'PNG');
});

test('GameMaker project resources, event files, room order and included files resolve', () => {
    const files = buildGameMakerProject(fixture(), template);
    const project = JSON.parse(files['DialoguePlayground.yyp']);
    assert.equal(project.resourceType, 'GMProject');
    assert.equal(project.resources.length, 6);
    const folders = new Set(project.Folders.map(f => f.folderPath));
    const eventNames = {0:'Create',3:'Step',8:'Draw',12:'CleanUp'};
    for (const {id} of project.resources) {
        const resource = JSON.parse(files[id.path]);
        assert.equal(resource.name, id.name);
        assert.ok(folders.has(resource.parent.path));
        if (resource.resourceType === 'GMScript') assert.ok(files[id.path.replace(/\.yy$/, '.gml')]);
        for (const event of resource.eventList || [])
            assert.ok(files[`objects/${id.name}/${eventNames[event.eventType]}_${event.eventNum}.gml`]);
    }
    for (const file of project.IncludedFiles) {
        assert.ok(files[file.filePath + '/' + file.name]);
        assert.equal(file.CopyToMask, -1);
    }
    const room = JSON.parse(files[project.RoomOrderNodes[0].roomId.path]);
    assert.equal(room.layers[0].name, 'Instances');
    const instance = room.layers[0].instances[0];
    assert.ok(files[instance.objectId.path]);
    assert.equal(room.instanceCreationOrder[0].name, instance.name);
    assert.equal(JSON.parse(files['options/main/options_main.yy']).option_game_speed, 60);
});

test('large casts expand the room, malformed graphs and non-finite conditions are rejected', () => {
    const source = fixture();
    source.characters = Array.from({length:40}, () => structuredClone(source.characters[0]));
    const files = buildGameMakerProject(source, template);
    assert.equal(JSON.parse(files['rooms/rm_gdm_playground/rm_gdm_playground.yy']).roomSettings.Height, 1760);
    source.characters[0].outgoingLines[0].toNode = 999;
    assert.throws(() => buildGameMakerProject(source, template), /missing dialogue 999/);
    source.characters[0].outgoingLines[0].toNode = 10;
    const condition = source.characters[0].dialogueNodes[7].outgoingLines[0].transitionConditions[0];
    for (const value of [true, null, {}, Infinity]) {
        condition.variableValue = value;
        assert.throws(() => buildGameMakerProject(source, template), /finite number or text/);
    }
    condition.variableValue = '001';
    assert.equal(parsePlain(buildGameMakerProject(source, template)['datafiles/dialogue.json'])
        .characters[0].nodes[7].edges[0].conditions[0].value, '001');
});

test('GameMaker template bundle matches every editable source file', () => {
    for (const [name, content] of Object.entries(template))
        assert.equal(content, fs.readFileSync(path.join(__dirname, '..', 'export-templates/gamemaker', name), 'utf8'));
});

// The actual GML session is deliberately limited to shared JS/GML syntax.
// This checks its logic, NOT GML compiler compatibility or engine behavior.
function parsePlain(json) { return sessionHarness().gdm_parse_dialogue(JSON.parse(json)); }
function sessionHarness() {
    const context = vm.createContext({
        string_lower:s=>s.toLowerCase(),string_length:s=>s.length,string_pos:(a,b)=>b.indexOf(a)+1,string_char_at:(s,i)=>s[i-1], max:Math.max,make_colour_rgb:(r,g,b)=>r+256*g+65536*b,
        array_length:a => a.length, array_push:(a,v) => a.push(v), string:String,
        is_real:v => typeof v === 'number', is_string:v => typeof v === 'string', is_undefined:v => v === undefined,
        variable_struct_get:(s,k) => Object.hasOwn(s,k) ? s[k] : undefined,
        variable_struct_exists:(s,k) => Object.hasOwn(s,k),
        variable_struct_set:(s,k,v) => Object.defineProperty(s,k,{value:v,writable:true,enumerable:true,configurable:true})
    });
    vm.runInContext(template['scripts/gdm_session/gdm_session.gml'], context);
    return context;
}

test('unchanged GML session logic traverses exported branches, conditions, fights, loops and empty trees', () => {
    const api = sessionHarness();
    const data = parsePlain(buildGameMakerProject(fixture(), template)['datafiles/dialogue.json']);
    const vars = api.gdm_defaults(data.characters);
    const session = api.gdm_session(data.characters[0], vars);
    assert.equal(vars.keys, 0);
    assert.equal(api.gdm_start(session).id, '10');
    assert.equal(api.gdm_choose(session, 0).id, '20');
    assert.equal(api.gdm_options(session).length, 3);
    assert.equal(api.gdm_options(session)[2].enabled, false);
    assert.equal(api.gdm_choose(session, 2).id, '20');
    assert.equal(api.gdm_choose(session, 0).id, '50');
    assert.equal(api.gdm_choose(session, 1).id, '70');
    assert.equal(api.gdm_choose(session, 0).id, '10');
    api.gdm_go(session, '50'); assert.equal(api.gdm_choose(session, 0).id, '60');
    assert.equal(api.gdm_choose(session, 0), undefined);
    api.gdm_go(session, '20'); assert.equal(api.gdm_choose(session, 1).id, '60');
    api.gdm_go(session, '20'); vars.keys = 1;
    assert.equal(api.gdm_choose(session, 2).id, '60');
    assert.equal(api.gdm_start(api.gdm_session(data.characters[1],vars)), undefined);
    const edge = {target:'10',conditions:[{name:'keys',op:'>=',value:1},{name:'route',op:'=',value:'forest 森'}]};
    assert.equal(api.gdm_allows(session,edge), false);
    vars.route = 'forest 森'; assert.equal(api.gdm_allows(session,edge), true);
    vars.keys = '1'; assert.equal(api.gdm_allows(session,edge), false);
    data.characters[0].start = [edge]; assert.equal(api.gdm_start(session), undefined);
    vars.keys = 1; assert.equal(api.gdm_start(session).id, '10');
    for (const [op,expected] of [['=',true],['!=',false],['<',false],['>',false],['<=',true],['>=',true]]) {
        edge.conditions[0].op = op;
        assert.equal(api.gdm_allows(session,edge),expected);
    }
});

test('apple sample changes Mira root condition after player pickup', () => {
    const api = sessionHarness();
    const files = buildGameMakerProject(require('./dialogue-sample')(), template);
    const data = parsePlain(files['datafiles/dialogue.json']);
    const variables = api.gdm_defaults(data.characters);
    const mira = () => api.gdm_start(api.gdm_session(data.characters[0], variables)).id;
    assert.equal(mira(), '200');
    const controller = {error_message:'', session:undefined, show_variables:false, apple_sprite:1,
        apple_collected:false, apple_x:580, apple_y:180, variables};
    Object.assign(api, {global:{gdm:controller}, x:100, y:180, ord:c=>c.charCodeAt(0), keyboard_check:()=>false,
        vk_right:39,vk_left:37,vk_up:38,vk_down:40, point_distance:Math.hypot,abs:Math.abs});
    const step = template['objects/obj_gdm_player/Step_0.gml'];
    vm.runInContext(step, api);
    assert.equal(mira(), '200', 'no pickup when away from apple');
    api.x = 580;
    vm.runInContext(step, api);
    assert.equal(controller.apple_collected, true);
    assert.equal(variables.hasApple, 1);
    assert.equal(mira(), '210');
    vm.runInContext(step, api);
    assert.equal(variables.hasApple, 1, 'pickup only once');
    assert.ok(files['datafiles/apple.png']);
});

test('GameMaker keyboard step advances pages and branches without bypassing conditions', () => {
    const api = sessionHarness();
    const data = parsePlain(buildGameMakerProject(fixture(), template)['datafiles/dialogue.json']);
    let pressed = 0;
    Object.assign(api, {error_message:'', show_variables:false, player:null, page:0, scroll:0, buttons:[],
        instance_exists:()=>false, device_mouse_x_to_gui:()=>0, device_mouse_y_to_gui:()=>0,
        point_in_rectangle:()=>false, keyboard_check:()=>false, keyboard_check_pressed:k=>k===pressed,
        mouse_check_button_pressed:()=>false, ord:c=>c.charCodeAt(0),
        vk_left:37, vk_up:38, vk_right:39, vk_down:40, vk_escape:27, vk_control:17, vk_alt:18, vk_shift:16, vk_numpad1:97, mb_left:1,
        string_replace_all:(s,a,b)=>s.replaceAll(a,b), string_split:(s,separator)=>s.split(separator)});
    api.session = api.gdm_session(data.characters[0], api.gdm_defaults(data.characters));
    api.gdm_start(api.session);
    // Only translate GML's event exit statement; execute the actual exported step.
    const step = '(function(){' + template['objects/obj_gdm_controller/Step_0.gml'].replace(/\bexit;/g,'return;') + '})()';
    const key = code=>{ pressed=code; vm.runInContext(step,api); };
    key(50); assert.equal(api.page,0);
    key(49); assert.equal(api.page,1);
    key(97); assert.equal(api.session.current.id,'20');
    key(51); assert.equal(api.session.current.id,'20');
    api.show_variables=true; key(50); assert.equal(api.session.current.id,'20'); api.show_variables=false;
    key(98); assert.equal(api.session.current.id,'60');
    key(49); assert.equal(api.session,undefined);
});

test('GameMaker NPC contact does not restart a closed conversation until exit and re-entry',()=>{
    const api=sessionHarness();
    const data=parsePlain(buildGameMakerProject(fixture(),template)['datafiles/dialogue.json']);
    const controller={data,sessions:{},variables:api.gdm_defaults(data.characters),session:undefined,show_variables:false};
    let touching=true;
    Object.assign(api,{global:{gdm:controller},x:0,y:0,obj_gdm_player:1,character_index:0,character_id:"",was_touching:false,place_meeting:()=>touching});
    const step=()=>vm.runInContext(template['objects/obj_gdm_npc/Step_0.gml'],api);
    step();assert.ok(controller.session);
    controller.session=undefined;
    for(let i=0;i<5;i++)step();
    assert.equal(controller.session,undefined);
    touching=false;step();touching=true;step();assert.ok(controller.session);
});

if (process.argv.includes('--sample')) {
    const output = path.join(__dirname, '..', 'artifacts', 'gamemaker-playground');
    const files = buildGameMakerProject(require('./dialogue-sample')(), template);
    for (const [name, content] of Object.entries(files)) {
        const target = path.join(output,name);
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.writeFileSync(target,content);
    }
    createExportZip(files).arrayBuffer().then(buffer => fs.writeFileSync(
        path.join(output,'..','dialogue-gamemaker.zip'),Buffer.from(buffer)));
}


test('GameMaker remembers waiting conditions and respects opt-out',()=>{
    for(const waitUntilMet of [true,false]) {
        const source=fixture(), c=source.characters[0];
        c.dialogueNodes.find(n=>n.dialogueID===60).outgoingLines=[{toNode:70,transitionConditions:[{variableName:'apple',comparisonOperator:'=',variableValue:1,waitUntilMet}]}];
        const data=parsePlain(buildGameMakerProject(source,template)['datafiles/dialogue.json']);
        const api=sessionHarness(), vars=api.gdm_defaults(data.characters), session=api.gdm_session(data.characters[0],vars);
        api.gdm_start(session);api.gdm_go(session,'60');
        assert.equal(api.gdm_start(session).id,waitUntilMet?'60':'10');
        vars.apple=1;assert.equal(api.gdm_start(session).id,waitUntilMet?'70':'10');
        assert.equal(api.gdm_start(session).id,'10');
    }
});


test('GameMaker plain JSON replacement preserves existing NPC character identity',()=>{
    const api=sessionHarness(),source=fixture();
    source.characters.reverse();
    source.characters[1].dialogueNodes[0].dialogueText='Updated princess greeting';
    const data=api.gdm_parse_dialogue(JSON.parse(JSON.stringify(source)));
    const controller={data,sessions:{},variables:api.gdm_defaults(data.characters),session:undefined,show_variables:false};
    Object.assign(api,{global:{gdm:controller},x:0,y:0,obj_gdm_player:1,character_index:0,character_id:'9',was_touching:false,place_meeting:()=>true});
    vm.runInContext(template['objects/obj_gdm_npc/Step_0.gml'],api);
    assert.equal(api.character_index,1);assert.equal(controller.session.current.text,'Updated princess greeting');
});
