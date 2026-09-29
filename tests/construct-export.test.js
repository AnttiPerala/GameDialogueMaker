const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const template = require('../js/constructTemplate');
const exporter = require('../js/exportConstruct');
const { createConstructDialogueSession: session, startConstructDialogueGame: runner } = require('../js/constructRuntime');

const fixture = require('./dialogue-fixture');

test('downloadable demo has playable English characters and distinct player and NPC labels', () => {
    const sample = require('./dialogue-sample')();
    const files = exporter.buildConstructProject(sample, template, session, runner);
    const data = JSON.parse(files['files/dialogue.json']);
    assert.deepEqual(data.characters.map(character => character.characterName), ['Mira', 'Rowan']);
    for (const character of data.characters) {
        assert.ok(session(character, {hasApple:0}).start(), `${character.characterName} needs a starting conversation`);
    }
    const rowan = session(data.characters[1], {});
    assert.match(rowan.start().dialogueText, /Rowan/);
    rowan.options()[0].choose();
    assert.match(rowan.current.dialogueText, /Mira/);
    rowan.options()[0].choose();
    assert.equal(rowan.current, null);
    const instances = JSON.parse(files['layouts/Dialogue Playground.json']).layers[0].instances;
    const red = instances.find(instance => instance.type === 'NPC_1').world.color;
    const green = instances.find(instance => instance.type === 'NPC_2').world.color;
    assert.ok(red[0] > red[1] && red[0] > red[2]);
    assert.ok(green[1] > green[0] && green[1] > green[2]);
    assert.equal(instances.find(instance => instance.type === 'PlayerLabel').properties.text, 'Player');
    assert.ok(!instances.some(instance => instance.properties.text === 'START'));
    assert.ok(instances.some(instance => instance.type === 'Apple'));
    assert.ok(files['images/apple-default-000.png']);
    const variables = {hasApple:0};
    assert.equal(session(data.characters[0], variables).start().dialogueID, 200);
    variables.hasApple = 1;
    assert.equal(session(data.characters[0], variables).start().dialogueID, 210);
});

test('project settings use values accepted by Construct r495.2', () => {
    // Accepted serialized values checked against the actual editor loader:
    // https://editor.construct.net/r495-2/projectResources.js
    // These are file-format values, not the labels shown in the properties UI.
    const files = exporter.buildConstructProject(fixture(), template, session, runner);
    const project = JSON.parse(files['project.c3proj']);
    const properties = project.properties;
    assert.ok(['splash', 'progress-logo', 'progress', 'percent', 'none'].includes(properties.loaderStyle));
    assert.ok(['worker', 'auto', 'dom'].includes(project.useWorker));
    // The generated runner uses document/window, so auto/worker is unsuitable.
    assert.equal(project.useWorker, 'dom');
    assert.ok(['off', 'scale-inner', 'integer-scale-inner', 'scale-outer', 'integer-scale-outer', 'letterbox-scale', 'letterbox-integer-scale'].includes(properties.fullscreenMode));
    assert.ok(['2d', 'auto', '3d'].includes(properties.renderingMode));
    for (const layer of JSON.parse(files['layouts/Dialogue Playground.json']).layers) {
        assert.ok(['2d', '3d'].includes(layer.renderingMode));
    }
});

test('export preserves live DOM references, Unicode, quotes, newlines and duplicate names', () => {
    const source = fixture();
    const dom = {}; dom.circular = dom;
    source.characters[0].nodeElement = dom;
    source.characters[0].outgoingLines[0].lineElem = dom;
    const files = exporter.buildConstructProject(source, template, session, runner);
    assert.equal(source.characters[0].nodeElement, dom);
    const data = JSON.parse(files['files/dialogue.json']);
    assert.equal(data.characters[0].characterName, source.characters[0].characterName);
    assert.equal(data.characters[0].dialogueNodes[0].dialogueText, source.characters[0].dialogueNodes[0].dialogueText);
    assert.ok(files['objectTypes/NPC_1.json']); assert.ok(files['objectTypes/NPC_2.json']);
    assert.equal(data.characters[0].nodeElement, undefined);
});

test('traverses questions, answer jumps, fight outcomes, cycles and terminal nodes', () => {
    const state = session(fixture().characters[0], {keys: 0});
    assert.equal(state.start().dialogueID, 10);
    state.options()[0].choose(); assert.equal(state.current.dialogueID, 20);
    assert.equal(state.options()[2].enabled, false);
    state.options()[0].choose(); assert.equal(state.current.dialogueID, 50);
    state.options()[1].choose(); assert.equal(state.current.dialogueID, 70);
    state.options()[0].choose(); assert.equal(state.current.dialogueID, 10);
    state.options()[0].choose(); state.options()[1].choose(); assert.equal(state.current.dialogueID, 60);
    state.options()[0].choose(); assert.equal(state.current, null);
});

test('condition operators use typed values, all conditions and mutable game variables', () => {
    for (const [operator, value, expected] of [['=', 2, true], ['!=', 2, false], ['<', 3, true], ['>', 1, true], ['<=', 2, true], ['>=', 2, true], ['=', '2', false]]) {
        const character = fixture().characters[0];
        character.outgoingLines[0].transitionConditions = [{variableName: 'x', comparisonOperator: operator, variableValue: value}];
        assert.equal(!!session(character, {x: 2}).start(), expected);
    }
    const vars = {keys: 0}, state = session(fixture().characters[0], vars);
    state.start(); state.options()[0].choose();
    vars.keys = 1;
    assert.equal(state.options()[2].enabled, true);
    state.options()[2].choose(); assert.equal(state.current.dialogueID, 60);
    const character = fixture().characters[0];
    character.outgoingLines[0].transitionConditions = [
        {variableName:'keys', comparisonOperator:'>=', variableValue:1},
        {variableName:'time', comparisonOperator:'=', variableValue:'night'}
    ];
    assert.equal(session(character, {keys:1,time:'day'}).start(), null);
    assert.equal(session(character, {keys:1,time:'night'}).start().dialogueID, 10);
});

test('rejects dangling links, duplicate IDs and disconnected starts with useful errors', () => {
    let source = fixture(); source.characters[0].dialogueNodes[0].nextNode = 999;
    assert.throws(() => exporter.validateConstructDialogue(source), /missing dialogue 999/);
    source = fixture(); source.characters[0].dialogueNodes.push(source.characters[0].dialogueNodes[0]);
    assert.throws(() => exporter.validateConstructDialogue(source), /unique/);
    source = fixture(); source.characters[0].outgoingLines = [];
    assert.throws(() => exporter.validateConstructDialogue(source), /starting dialogue/);
});

test('archive references all assets with unique SIDs and UIDs and scales for many NPCs', async () => {
    const source = fixture();
    source.characters = Array.from({length: 30}, (_, index) => ({...source.characters[0], characterID: index}));
    const files = exporter.buildConstructProject(source, template, session, runner);
    const project = JSON.parse(files['project.c3proj']);
    assert.doesNotThrow(() => new Function(files['scripts/main.js']));
    const sids = new Set(), uids = new Set();
    function inspect(value) {
        if (!value || typeof value !== 'object') return;
        for (const [key, item] of Object.entries(value)) {
            if (key === 'sid') { assert.ok(!sids.has(item), `duplicate SID ${item}`); sids.add(item); }
            else if (key === 'uid') { assert.ok(!uids.has(item), `duplicate UID ${item}`); uids.add(item); }
            else inspect(item);
        }
    }
    for (const [name, content] of Object.entries(files)) if (name.endsWith('.json') || name.endsWith('.c3proj')) inspect(JSON.parse(content));
    for (const name of project.objectTypes.items) assert.ok(files[`objectTypes/${name}.json`]);
    const layout = JSON.parse(files['layouts/Dialogue Playground.json']);
    assert.ok(layout.height > 640);
    for (const instance of layout.layers[0].instances) {
        assert.ok(project.objectTypes.items.includes(instance.type));
        assert.ok(instance.world.y + instance.world.height < layout.height);
    }
    const blob = exporter.createConstructZip(files);
    assert.ok(blob.size > 10000);
});

if (process.argv.includes('--sample')) {
    const sample = require('./dialogue-sample')();
    const output = path.join(__dirname, '..', 'artifacts');
    fs.mkdirSync(output, {recursive: true});
    const files = exporter.buildConstructProject(sample, template, session, runner);
    fs.writeFileSync(path.join(output, 'dialogue-fixture.json'), JSON.stringify(sample, null, 2));
    exporter.createConstructZip(files).arrayBuffer().then(buffer => fs.writeFileSync(path.join(output, 'dialogue-playground.c3p'), Buffer.from(buffer)));
}
