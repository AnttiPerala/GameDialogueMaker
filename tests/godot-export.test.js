const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fixture = require('./dialogue-fixture');
const template = require('../js/godotTemplate');
const { buildGodotProject } = require('../js/exportGodot');
const { createExportZip } = require('../js/exportCommon');

test('Godot export is self-contained, native and preserves editor state and text', () => {
    const source = fixture();
    const dom = {}; dom.circular = dom;
    source.characters[0].nodeElement = dom;
    const files = buildGodotProject(source, template);
    assert.equal(source.characters[0].nodeElement, dom);
    assert.equal(JSON.parse(files['dialogue.json']).characters[0].characterName, source.characters[0].characterName);
    assert.equal(JSON.parse(files['dialogue.json']).characters[0].nodeElement, undefined);
    assert.match(files['scenes/player.tscn'], /CharacterBody2D/);
    assert.match(files['scenes/npc.tscn'], /Area2D/);
    assert.match(files['scenes/dialogue_ui.tscn'], /CanvasLayer/);
    for (const text of Object.values(files)) {
        if (typeof text !== 'string') continue;
        for (const reference of text.matchAll(/res:\/\/([^"\n]+)/g)) assert.ok(files[reference[1]], `missing ${reference[1]}`);
    }
    assert.equal((files['scenes/main.tscn'].match(/character_index = /g) || []).length, 2);
    assert.ok(!files['scenes/main.tscn'].includes(source.characters[0].characterName));
});

test('Godot template bundle matches its editable source files', () => {
    for (const [name, content] of Object.entries(template)) {
        assert.equal(content, fs.readFileSync(path.join(__dirname, '..', 'export-templates/godot', name), 'utf8'));
    }
});

test('large casts expand the scene and invalid graphs fail before packaging', () => {
    const source = fixture();
    source.characters = Array.from({length: 40}, () => source.characters[0]);
    const files = buildGodotProject(source, template);
    assert.match(files['scenes/main.tscn'], /world_size = Vector2\(960, 1760\)/);
    assert.equal((files['scenes/main.tscn'].match(/character_index = /g) || []).length, 40);
    source.characters[0].outgoingLines[0].toNode = 999;
    assert.throws(() => buildGodotProject(source, template), /missing dialogue 999/);
});

const output = path.join(__dirname, '..', 'artifacts', 'godot-test-playground');
function writeProject(source = fixture(), destination = output) {
    const files = buildGodotProject(source, template);
    for (const [name, content] of Object.entries(files)) {
        const target = path.join(destination, name);
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.writeFileSync(target, content);
    }
    return files;
}

test('real Godot imports and runs the generated project, physics and dialogue UI', {skip: !process.env.GODOT_BIN}, () => {
    writeProject();
    const engine = process.env.GODOT_BIN;
    const run = args => {
        const result = spawnSync(engine, ['--headless', '--path', output, ...args], {encoding:'utf8', timeout:60000, windowsHide:true});
        const logs = (result.stdout || '') + (result.stderr || '');
        assert.equal(result.error, undefined, String(result.error));
        assert.equal(result.status, 0, logs);
        assert.doesNotMatch(logs, /SCRIPT ERROR|Parse Error|FAIL:|ERROR:/);
        return logs;
    };
    run(['--editor', '--import', '--quit']);
    const smokeFile = path.join(output, 'smoke_test.gd');
    fs.copyFileSync(path.join(__dirname, 'godot-smoke.gd'), smokeFile);
    assert.match(run(['--script', smokeFile, '--quit-after', '600']), /GODOT_SMOKE_PASS/);
    fs.unlinkSync(smokeFile);
    fs.copyFileSync(path.join(__dirname, 'godot-update-smoke.gd'), smokeFile);
    assert.match(run(['--script', smokeFile, '--quit-after', '600']), /GODOT_UPDATE_PASS/);
    fs.unlinkSync(smokeFile);
    writeProject(require('./dialogue-sample')());
    run(['--editor', '--import', '--quit']);
    fs.copyFileSync(path.join(__dirname, 'godot-apple-smoke.gd'), smokeFile);
    assert.match(run(['--script', smokeFile, '--quit-after', '600']), /GODOT_APPLE_PASS/);
    fs.unlinkSync(smokeFile);
});

if (process.argv.includes('--sample')) {
    createExportZip(writeProject(require('./dialogue-sample')(), path.join(output, '..', 'godot-playground'))).arrayBuffer().then(buffer =>
        fs.writeFileSync(path.join(output, '..', 'dialogue-godot.zip'), Buffer.from(buffer)));
}
