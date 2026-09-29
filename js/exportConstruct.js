/* Construct exporter: no network requests or build step required by the editor. */
const exportHelpers = typeof module !== 'undefined' ? require('./exportCommon') : { createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

function buildConstructProject(source, template, sessionFactory, gameRunner) {
    const data = exportHelpers.cleanDialogueProject(source);
    for (const character of data.characters || []) {
        character.dialogueNodes = character.dialogueNodes || [];
        character.outgoingLines = character.outgoingLines || [];
        for (const node of character.dialogueNodes) node.outgoingLines = node.outgoingLines || [];
    }
    exportHelpers.validateDialogueProject(data);
    const clone = value => JSON.parse(JSON.stringify(value));
    const base = clone(template), project = base.project, layout = base.layout;
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
    // A simple white square, tinted per instance. Generated locally, no third-party artwork.
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKUlEQVR4nO3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBgXdgl/rw4unIZ5cAAAAASUVORK5CYII='), char => char.charCodeAt(0));
    const addType = object => {
        assignSids(object);
        project.objectTypes.items.push(object.name);
        json(`objectTypes/${object.name}.json`, object);
    };
    const addSprite = (name, x, y, color) => {
        const object = clone(base.sprite);
        object.name = name;
        object.animations.items[0].frames[0].imageSpriteId = imageId++;
        addType(object);
        files[`images/${name.toLowerCase()}-default-000.png`] = png;
        const instance = clone(base.spriteInstance);
        instance.type = name; instance.uid = uid++;
        Object.assign(instance.world, { x, y, width: 32, height: 32, color });
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
    addLabel('Player', 120, 140, 'PlayerLabel');
    if (data.demoAppleQuest === true) {
        addSprite('Apple', 580, 180, [1, 1, 1, 1]);
        files['images/apple-default-000.png'] = exportHelpers.createDemoApplePng();
    }
    data.characters.forEach((character, index) => {
        const x = 140 + (index % 4) * 220, y = 280 + Math.floor(index / 4) * 130;
        const hex = /^#[0-9a-f]{6}$/i.test(character.bgColor) ? character.bgColor : '#b68af7';
        const color = [1, 3, 5].map(start => Math.max(0.35, parseInt(hex.slice(start, start + 2), 16) / 255));
        addSprite(`NPC_${index + 1}`, x, y, [...color, 1]);
        addLabel(character.characterName || `Character ${index + 1}`, x, y);
    });
    const keyboard = clone(base.keyboard); keyboard['singleglobal-inst'].uid = uid++; addType(keyboard);
    project.layouts.items = [layout.name];
    project.eventSheets.items = ['Dialogue events'];
    project.rootFileFolders.script.items = [{ name: 'main.js', type: 'application/javascript', sid: sid++, 'script-info': { purpose: 'main' } }];
    project.rootFileFolders.general.items = [{ name: 'dialogue.json', type: 'application/json', sid: sid++, 'file-info': { purpose: 'none' } }];
    assignSids(layout);
    json('layouts/Dialogue Playground.json', layout);
    json('eventSheets/Dialogue events.json', { name: 'Dialogue events', events: [{ eventType: 'comment', text: 'Movement, collision conversations and branching dialogue: see Scripts / main.js. Edit Files / dialogue.json to change dialogue. Use Test variables in preview to exercise conditional paths.' }], sid: sid++ });
    json('project.c3proj', project);
    json('files/dialogue.json', data);
    files['scripts/main.js'] = `${sessionFactory.toString()}\n\n${gameRunner.toString()}\n\nrunOnStartup(runtime => {\n  runtime.addEventListener("beforeprojectstart", async () => {\n    try {\n      const data = await runtime.assets.fetchJson("dialogue.json");\n      startConstructDialogueGame(runtime, data, createConstructDialogueSession);\n    } catch (error) {\n      console.error(error);\n      const message = document.createElement("p");\n      message.textContent = "Dialogue failed to load: " + error.message;\n      message.style.cssText = "position:fixed;inset:20px;background:white;color:black;padding:20px;z-index:9999";\n      document.body.append(message);\n    }\n  });\n});\n`;
    return files;
}

function exportConstruct() {
    const files = buildConstructProject(gameDialogueMakerProject, constructTemplate, createConstructDialogueSession, startConstructDialogueGame);
    exportHelpers.downloadDialogueBlob(exportHelpers.createExportZip(files), 'dialogue-playground.c3p');
}

if (typeof module !== 'undefined') module.exports = { ...exportHelpers, validateConstructDialogue: exportHelpers.validateDialogueProject, createConstructZip: exportHelpers.createExportZip, buildConstructProject };
