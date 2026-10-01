const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const fixture = require('./dialogue-fixture');
const template = require('../js/unityTemplate');
const { buildUnityProject } = require('../js/exportUnity');
const { createExportZip } = require('../js/exportCommon');
const root = 'Assets/GameDialogueMaker/';
const output = path.join(__dirname, '..', 'artifacts', 'unity-test-playground');

test('Unity export preserves source and normalizes typed runtime data without mutating the editor', () => {
    const source = fixture();
    const dom = {}; dom.circular = dom;
    source.characters[0].nodeElement = dom;
    const files = buildUnityProject(source, template);
    const runtime = JSON.parse(files[root + 'Resources/dialogue.json']);
    assert.equal(source.characters[0].nodeElement, dom);
    assert.equal(runtime.characters.length, 2);
    assert.equal(runtime.characters[0].characterName, source.characters[0].characterName);
    assert.equal(runtime.characters[0].dialogueNodes[0].dialogueText, source.characters[0].dialogueNodes[0].dialogueText);
    assert.equal(runtime.characters[0].dialogueNodes[3].nextNode, 60);
    assert.deepEqual(runtime.characters[1].dialogueNodes, []);
    assert.deepEqual(runtime.characters[0].dialogueNodes[7].outgoingLines[0].transitionConditions[0],
        {variableName:'keys', comparisonOperator:'>=', variableValue:1});
    delete source.characters[0].nodeElement;
    assert.deepEqual(JSON.parse(files[root + 'Resources/dialogue.json']), source);
    assert.equal(Buffer.from(files[root + 'Art/character.png']).subarray(1, 4).toString(), 'PNG');
});

test('Unity rejects dangling links and unsupported condition values; numeric text stays text', () => {
    const source = fixture();
    const condition = source.characters[0].dialogueNodes[7].outgoingLines[0].transitionConditions[0];
    for (const value of [null, true, {}, Infinity]) {
        condition.variableValue = value;
        assert.throws(() => buildUnityProject(source, template), /finite number or text/);
    }
    condition.variableValue = '001';
    const runtime = JSON.parse(buildUnityProject(source, template)[root + 'Resources/dialogue.json']);
    assert.equal(runtime.characters[0].dialogueNodes[7].outgoingLines[0].transitionConditions[0].variableValue, '001');

    source.characters[0].outgoingLines[0].toNode = 999;
    assert.throws(() => buildUnityProject(source, template), /missing dialogue 999/);
});

test('Unity bundled sources match the editable template', () => {
    for (const [name, content] of Object.entries(template))
        assert.equal(content, fs.readFileSync(path.join(__dirname, '..', 'export-templates/unity', name), 'utf8'));
});

function writeProject(source = fixture(), destination = output) {
    const files = buildUnityProject(source, template);
    for (const [name, content] of Object.entries(files)) {
        const target = path.join(destination, name);
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.writeFileSync(target, content);
    }
    return files;
}
const compiler = process.env.CSC_BIN || 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe';
test('exported data runs through the actual C# dialogue session', {skip: !fs.existsSync(compiler)}, () => {
    writeProject();
    const exe = path.join(output, '..', 'unity-session-smoke.exe');
    const jsonDll = process.env.NEWTONSOFT_DLL || 'C:/Program Files/Microsoft Visual Studio/2022/Community/Common7/Tools/Newtonsoft.Json.dll';
    fs.copyFileSync(jsonDll,path.join(path.dirname(exe),'Newtonsoft.Json.dll'));
    const compile = spawnSync(compiler, ['/nologo', '/out:' + exe, '/reference:System.Web.Extensions.dll', '/reference:'+jsonDll, path.join(output,root,'Scripts/DialogueJson.cs'),
        path.join(output, root, 'Scripts/DialogueData.cs'), path.join(__dirname, 'unity-session-smoke.cs')],
        {encoding:'utf8', windowsHide:true});
    assert.equal(compile.status, 0, compile.stdout + compile.stderr);
    const run = spawnSync(exe, [path.join(output, root, 'Resources/dialogue.json')], {encoding:'utf8', windowsHide:true});
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(run.stdout, /UNITY_SESSION_PASS/);
    writeProject(require('./dialogue-sample')());
    const quest = spawnSync(exe, [path.join(output, root, 'Resources/dialogue.json')], {encoding:'utf8', windowsHide:true});
    assert.equal(quest.status, 0, quest.stdout + quest.stderr);
    assert.match(quest.stdout, /UNITY_APPLE_PASS/);
});

if (process.argv.includes('--sample')) {
    const files = writeProject(require('./dialogue-sample')(), path.join(output, '..', 'unity-playground'));
    createExportZip(files).arrayBuffer().then(buffer => fs.writeFileSync(
        path.join(output, '..', 'dialogue-unity.zip'), Buffer.from(buffer)));
}
