/* Construct exporter: no network requests or build step required by the editor. */
const exportHelpers = typeof module !== 'undefined' ? require('./exportCommon') : { createSolidSpritePng, createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };
const constructNative = typeof module !== 'undefined' ? require('./constructNative') : {startConstructNativeDialogue, buildConstructNativeEvents};

function buildConstructProject(source, template, sessionFactory, gameRunner) {
    const data = exportHelpers.cleanDialogueProject(source);
    const plainDialogueJson = JSON.stringify(data);
    for (const character of data.characters || []) {
        character.dialogueNodes = character.dialogueNodes || [];
        character.outgoingLines = character.outgoingLines || [];
        for (const node of character.dialogueNodes) node.outgoingLines = node.outgoingLines || [];
    }
    exportHelpers.validateDialogueProject(data);
    const clone = value => JSON.parse(JSON.stringify(value));
    const base = clone(template), project = base.project, layout = base.layout;
    layout.layers[0].backgroundColor = [0.18, 0.21, 0.27, 1];
    project.uniqueId = 'gdm' + Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, '0')).join('');
    const files = {};
    let sid = 100000, uid = 1, imageId = 1;
    const assignSids = value => {
        if (!value || typeof value !== 'object') return;
        for (const key of Object.keys(value)) {
            if (key === 'sid') value[key] = sid++;
            else assignSids(value[key]);
        }
    };
    const json = (path, value) => { files[path] = JSON.stringify(value, null, 2); };
    const addType = object => {
        assignSids(object);
        project.objectTypes.items.push(object.name);
        json(`objectTypes/${object.name}.json`, object);
    };
    const addSprite = (name, x, y, color, settings = {}) => {
        const object = clone(base.sprite);
        object.name = name;
        object.animations.items[0].frames[0].imageSpriteId = imageId++;
        if (name === 'Player') object.behaviorTypes = [{behaviorId:'EightDir',name:'Movement',sid:0},{behaviorId:'ScrollTo',name:'ScrollTo',sid:0}];
        if (name.startsWith('NPC_')) object.instanceVariables = [{name:'Touching',type:'number',desc:'Contact latch. Resets only when the player leaves.',show:true,sid:0}];
        if (Object.keys(settings).length) object.instanceVariables = Object.entries(settings).map(([name,value])=>({name,type:'number',desc:'Dialogue layout percentage (editable).',show:true,sid:0}));
        addType(object);
        files[`images/${name.toLowerCase()}-default-000.png`] = exportHelpers.createSolidSpritePng(color);
        const instance = clone(base.spriteInstance);
        instance.type = name; instance.uid = uid++;
        if (Object.keys(settings).length) instance.instanceVariables = {...settings};
        if (name.startsWith('NPC_')) instance.instanceVariables = {Touching:0};
        if (name === 'Player') instance.behaviors = {Movement:{properties:{
            'max-speed':220,acceleration:1200,deceleration:1600,directions:'dir-8','set-angle':'no','allow-sliding':true,'default-controls':true,enabled:true
        }},ScrollTo:{properties:{enabled:true}}};
        Object.assign(instance.world, { x, y, width: 32, height: 32, color: [1,1,1,1] });
        layout.layers[0].instances.push(instance);
    };
    const text = clone(base.text); text.name = 'CharacterLabel'; addType(text);
    const playerText = clone(base.text); playerText.name = 'PlayerLabel'; addType(playerText);
    const addLabel = (name, x, y, type = 'CharacterLabel') => {
        const instance = clone(base.textInstance);
        instance.type = type; instance.uid = uid++;
        instance.properties.text = name;
        instance.properties['horizontal-alignment'] = 'center';
        Object.assign(instance.world, { x: x - 85, y: type === 'PlayerLabel' ? y - 44 : y + 24, width: 170, height: type === 'PlayerLabel' ? 28 : 56 });
        layout.layers[0].instances.push(instance);
    };
    layout.height = Math.max(640, 260 + Math.ceil(data.characters.length / 4) * 130);
    addSprite('Player', 120, 140, [0.35, 0.8, 1, 1]);
    project.usedAddons.push({type:'behavior',id:'EightDir',name:'8 Direction',author:'Scirra',bundled:false});
    project.usedAddons.push({type:'behavior',id:'ScrollTo',name:'Scroll To',author:'Scirra',bundled:false});
    addLabel('Player', 120, 140, 'PlayerLabel');
    if (data.demoAppleQuest === true) {
        addSprite('Apple', 580, 180, [1, 1, 1, 1]);
        files['images/apple-default-000.png'] = exportHelpers.createDemoApplePng();
    }
    // Construct object identifiers and image filenames are case-insensitive.
    const npcNames = [];
    const usedNpcNames = new Set();
    data.characters.forEach((character, index) => {
        const label = String(character.characterName || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'Character';
        const baseName = `NPC_${label}`;
        let npcName = baseName, suffix = 2;
        while (usedNpcNames.has(npcName.toLowerCase())) npcName = `${baseName}_${suffix++}`;
        usedNpcNames.add(npcName.toLowerCase());
        npcNames.push(npcName);
        const x = 140 + (index % 4) * 220, y = 280 + Math.floor(index / 4) * 130;
        const hex = /^#[0-9a-f]{6}$/i.test(character.bgColor) ? character.bgColor : '#b68af7';
        const color = [1, 3, 5].map(start => Math.max(0.35, parseInt(hex.slice(start, start + 2), 16) / 255));
        addSprite(npcName, x, y, [...color, 1]);
        addLabel(character.characterName || `Character ${index + 1}`, x, y);
    });
    const keyboard = clone(base.keyboard); keyboard['singleglobal-inst'].uid = uid++; addType(keyboard);
    // Construct names are case-insensitive identifiers. Keep ordinary names intact,
    // and record a mapping when a dialogue name needs sanitizing or disambiguating.
    const definitions = new Map();
    const addVariable = (name, type, initialValue, comment = '') => {
        if (!['number', 'string'].includes(type) || (type === 'number' && !Number.isFinite(initialValue)) || typeof initialValue !== type)
            throw new Error(`Variable ${name}: use a finite number or text initial value.`);
        if (definitions.has(name)) {
            if (definitions.get(name).type !== type) throw new Error(`Variable ${name} is used as both number and text. Use one type consistently.`);
            return;
        }
        definitions.set(name, {dialogueName:name, type, initialValue, comment});
    };
    for (const [name, definition] of Object.entries(data.gameIntegration?.variables || {}))
        addVariable(name, definition.type === 'text' ? 'string' : definition.type, definition.initialValue ?? (definition.type === 'number' ? 0 : ''), definition.setBy || '');
    for (const character of data.characters) for (const node of [character, ...character.dialogueNodes])
        for (const line of node.outgoingLines) for (const condition of line.transitionConditions || [])
            addVariable(condition.variableName, typeof condition.variableValue, typeof condition.variableValue === 'number' ? 0 : '');
    if (data.demoAppleQuest === true) addVariable('hasApple', 'number', 0);
    const uiNames = ['Mouse','GameInstructions','DialogueSpeaker','DialogueText','AnswersSpeaker','DialogueClose','DialogueHeader','DialoguePanel','StartDialogue','ChooseAnswer','CloseDialogue',
        'Answers','Answer','AnswerNumber','DialogueReady','DialogueActive','ScrollOffset','ScrollLimit','AnswerY','PageHeight',
        'SpeakerName','LineText','AnswerSpeaker','CurrentCharacter','CurrentNode','DialogueOutcome','LoadError'];
    const usedNames = new Set([...project.objectTypes.items, ...uiNames, 'System', 'Layout', 'true', 'false', 'null', 'self'].map(name => name.toLowerCase()));
    data.constructVariables = [...definitions.values()].map(definition => {
        let baseName = definition.dialogueName.replace(/[^A-Za-z0-9_]/g, '_');
        if (!/^[A-Za-z_]/.test(baseName)) baseName = 'Dialogue_' + baseName;
        let name = baseName, suffix = 2;
        name = baseName;
        while (usedNames.has(name.toLowerCase())) name = `${baseName}_${suffix++}`;
        usedNames.add(name.toLowerCase());
        return {...definition, name};
    });
    const nativeEvents = constructNative.buildConstructNativeEvents({data, npcNames, base, project, layout, addType, addSprite, nextUid:()=>uid++, nextSid:()=>sid++});
    project.layouts.items = [layout.name];
    project.eventSheets.items = ['Dialogue events'];
    project.rootFileFolders.script.items = [{ name: 'main.js', type: 'application/javascript', sid: sid++, 'script-info': { purpose: 'main' } }];
    project.rootFileFolders.general.items = [{ name: 'dialogue.json', type: 'application/json', sid: sid++, 'file-info': { purpose: 'none' } }];
    project.rootFileFolders.general.items.push({name:'construct-bindings.json',type:'application/json',sid:sid++,'file-info':{purpose:'none'}});
    project.rootFileFolders.general.items.push({name:'INTEGRATION.txt',type:'text/plain',sid:sid++,'file-info':{purpose:'none'}});
    files['files/INTEGRATION.txt'] = `CONSTRUCT DIALOGUE INTEGRATION

This is the standard Construct export. Presentation, input and demo gameplay use native objects and events.

START HERE
1. Open the Dialogue UI layer. Make it visible in the editor to style its native Text objects: DialogueSpeaker, DialogueText, AnswersSpeaker, Answer and AnswerNumber. Answer instances display the choices; AnswerNumber instances display separate faint keyboard hints. Change fonts, colours and alignment in Properties. The layout events calculate widths from the panel.
2. Select DialoguePanel on the Dialogue UI layer. Its four instance variables control HeightPercent (viewport height), MarginPercent (viewport margin), PaddingPercent (panel width) and GapPercent (panel height). The Dialogue layout event group anchors the panel to the bottom of the CURRENT viewport and calculates all text widths, header bounds and mouse hit limits from it. Positions are rounded to logical pixels. The Dialogue presentation group stacks text and answers using their measured heights. You no longer need to resize a list of coordinates when changing the project viewport. Fonts are never overwritten by events: for a 320 x 180 pixel-art game, choose appropriately small fonts on DialogueSpeaker, DialogueText, AnswersSpeaker, Answer, AnswerNumber and DialogueClose (for example 6-8pt, depending on your font). Integer letterbox scaling can then scale the game window without blurring the pixels. The world sprites and demo level remain yours to resize.
Player and NPC placeholder colours are baked into their PNG images; instance Color stays white. Replace the image to use your own artwork without inherited tint. In older exports, reset existing sprite instances to white once.
3. Replace the Demo movement and interactions group with your own events. Call StartDialogue(CharacterID) when the player interacts with an NPC. Player uses the native 8 Direction behavior named Movement and an enabled Scroll To behavior for camera follow. No camera-follow events are needed. Change speed, acceleration and deceleration in its Properties. Arrow keys use the behavior’s enabled default controls; no simulated movement input events are needed. Dialogue events stop and disable Movement during conversations. Each NPC has a Touching instance variable tracked even while dialogue is open. Closing or reaching an ending never resets that latch: the player must leave and re-enter before contact starts a new conversation.
4. Call ChooseAnswer(Selection) with a ONE-BASED number. CloseDialogue closes the conversation. The Dialogue input group has one DialogueActive parent check. Number-row and numpad ranges share an OR block; Escape, arrow-key presses and click-to-close share an OR block. Pressing a movement key closes the dialogue; keep holding it to walk away. Mouse answer selection uses the clicked instance Index. Long dialogue is split using the native DialogueText object’s actual wrapping and measured height, within the calculated PageHeight budget. Changes to width, font or viewport recalculate pages while retaining the current reading position. Speaker changes remain separate portions. To read long dialogue: press 1 or click Continue to read the next portion before answers appear. No Page Up/Page Down controls are used. The mouse wheel scrolls larger answer lists. Options after 9 remain clickable and scrollable.
5. Game condition globals are at the top of the event sheet. Set them with System > Set value, or inspect/change them in the Construct debugger. Changes are read while dialogue is open, and conditions are checked again when choosing an answer. The script never maintains a second copy of these values.

CHARACTER IDS FOR StartDialogue (string parameter)
${data.characters.map(c => `${JSON.stringify(String(c.characterID))} = ${c.characterName}`).join('\n')}

YOUR OWN UI
Keep the Dialogue API group. Replace the Dialogue presentation and Dialogue input groups and their UI objects with your own.
Read DialogueActive, SpeakerName, LineText and AnswerSpeaker from your events. Answers is a native Array: Answers.Width is the answer count, Answers.At(index, 0) is the text, and Answers.At(index, 1) is 1 for an available choice or 0 for a blocked choice. Array indices start at 0. Pass index + 1 to ChooseAnswer. Native events create Answer/AnswerNumber instances dynamically and match their Index instance variables, with no fixed answer limit. These are output values; change game condition globals to unlock paths.
CurrentCharacter and CurrentNode identify the current conversation/node; DialogueOutcome exposes optional training feedback metadata. Process an outcome on a node change or with Trigger once, not every tick.
DialogueReady becomes 1 after loading; LoadError holds loading errors.
The background layer and header sprite are native too. Scrolling uses ScrollOffset and ScrollLimit; text heights settle after Construct renders.

WAITING CONDITIONS
Conditions wait by default (waitUntilMet in dialogue.json). A reached node with a blocked waiting connection is remembered separately for each character. Close still hides the UI and releases movement. Returning repeats the node while blocked, or follows its unlocked connection. Questions and fights still require a choice. Uncheck the condition setting to restart normally. Progress lasts for this runtime, not across saved games or reloads.

FILES AND UPDATES
Replace ONLY Files/dialogue.json with the plain JSON export from Dialogue Maker when updating dialogue. It is the same file format as the JSON inside this C3P. Keep your existing Construct project, layouts, sprites, objects, events, globals and UI; do not import a newly generated C3P over your game. Stop preview and start it again after replacing the file.
Files/construct-bindings.json belongs to your Construct integration. Keep it when replacing dialogue.json. It maps dialogue variable names to native Construct globals. Scripts/main.js reads both files; dialogue files do not set or reset live variable values.
New conditions can use a new global with the exact same name and matching number/string type. If the name needs renaming or conflicts with an existing binding or dialogue state global, add an entry to construct-bindings.json's variables array: {"dialogueName":"door open","name":"door_open","type":"number"}. Create the corresponding native global yourself. Missing globals and type mismatches produce a specific LoadError instead of silently locking dialogue. Removed conditions do not require deleting old bindings or globals.
Keep character IDs and node IDs stable when editing. Existing NPC events call StartDialogue using the character ID, not its name. A new character needs its own game object/interaction calling StartDialogue with the new ID. Dialogue updates do not create or delete sprites. Replacing a file takes effect on the next preview/run; it is not an in-session reload or save-game migration.

UPGRADING A PREVIOUSLY EXPORTED CONSTRUCT PROJECT (ONCE)
Export a fresh C3P from the same dialogue project and copy its scripts/main.js into your existing Construct project. Add its files/construct-bindings.json under Files, then replace files/dialogue.json with your plain JSON export. Keep all your existing events, layouts and sprites. If you renamed any native game globals, adjust the binding names to match. For a renamed/sanitized variable in an older project, preserve the dialogueName/name pairs from the old dialogue.json's constructVariables list in the new binding file. After this one-time upgrade, normal writing updates replace only dialogue.json.
The responsive layout upgrade also needs the fresh Dialogue layout and Dialogue presentation/input groups, the PageHeight number global, and the four DialoguePanel instance variables. Copy these from a fresh export; replacing dialogue.json alone updates writing, not layout code. Keep your existing fonts and gameplay events.
The script upgrade assumes the current native integration (Answers array and native Text UI). Projects from the older DOM-based exporter need the native integration first.

For another game's layout, copy the Dialogue API and your chosen presentation/input events, globals, objects, main.js, construct-bindings.json and dialogue.json. Ensure required instances exist in that layout. Call CloseDialogue when leaving a layout.
`;
    assignSids(layout);
    json('layouts/Dialogue Playground.json', layout);
    json('eventSheets/Dialogue events.json', { name: 'Dialogue events', events: [
        {eventType:'comment', text:'GAME VARIABLES — Change these with System → Set value in your game events or the Construct debugger. Dialogue conditions read these globals directly.'},
        ...data.constructVariables.map(variable => ({eventType:'variable', name:variable.name, type:variable.type,
            initialValue:String(variable.initialValue),
            comment:`Dialogue condition: ${variable.dialogueName}. ${variable.comment}`.trim(), isStatic:false, isConstant:false, sid:sid++})),
        ...nativeEvents
    ], sid: sid++ });
    json('project.c3proj', project);
    files['files/dialogue.json'] = plainDialogueJson;
    json('files/construct-bindings.json', {version:1, variables:data.constructVariables.map(({dialogueName,name,type})=>({dialogueName,name,type}))});
    files['scripts/main.js'] = `${sessionFactory.toString()}\n\n${exportHelpers.validateDialogueProject.toString()}\n\n${constructNative.startConstructNativeDialogue.toString()}\n\nrunOnStartup(runtime => {\n  runtime.addEventListener("beforeprojectstart", async () => {\n    try {\n      const [data, bindings] = await Promise.all([runtime.assets.fetchJson("dialogue.json"), runtime.assets.fetchJson("construct-bindings.json")]);\n      if (bindings.version !== 1 || !Array.isArray(bindings.variables)) throw new Error("construct-bindings.json requires version 1 and a variables array.");\n      validateDialogueProject(data);\n      startConstructNativeDialogue(runtime, data, createConstructDialogueSession, bindings.variables);\n    } catch (error) {\n      runtime.globalVars.DialogueReady = 0;\n      runtime.globalVars.LoadError = String(error.message);\n      console.error(error);\n    }\n  });\n});\n`;
    return files;
}

function exportConstruct() {
    const files = buildConstructProject(gameDialogueMakerProject, constructTemplate, createConstructDialogueSession, startConstructDialogueGame);
    exportHelpers.downloadDialogueBlob(exportHelpers.createExportZip(files), 'dialogue-playground.c3p');
}

if (typeof module !== 'undefined') module.exports = { ...exportHelpers, validateConstructDialogue: exportHelpers.validateDialogueProject, createConstructZip: exportHelpers.createExportZip, buildConstructProject };
