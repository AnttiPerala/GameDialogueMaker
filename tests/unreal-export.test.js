const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const fixture = require('./dialogue-fixture');
const template = require('../js/unrealTemplate');
const { buildUnrealProject, unrealString } = require('../js/exportUnreal');
const {buildUnrealFixtureHeader} = require('./unreal-fixture');
const { createExportZip } = require('../js/exportCommon');
const root = 'Source/DialoguePlayground/';

test('Unreal exports preserve live editor state and original data with a self-contained C++ project', () => {
    const source = fixture();
    const dom = {}; dom.circular = dom;
    source.characters[0].nodeElement = dom;
    const files = buildUnrealProject(source, template);
    assert.equal(source.characters[0].nodeElement, dom);
    delete source.characters[0].nodeElement;
    assert.deepEqual(JSON.parse(files['Content/Dialogue/dialogue.json']), source);
    const project = JSON.parse(files['DialoguePlayground.uproject']);
    assert.equal(project.Modules[0].Name, 'DialoguePlayground');
    assert.ok(files[root + 'DialoguePlayground.Build.cs']);
    assert.ok(files['Source/DialoguePlaygroundEditor.Target.cs']);
    for (const name of Object.keys(files).filter(n => n.endsWith('.cpp') || n.endsWith('.h')))
        for (const [, include] of files[name].matchAll(/#include "(Dialogue[^"\n]+|GDM[^"\n]+)"/g))
            if (!include.endsWith('.generated.h')) assert.ok(files[root + include], `Missing ${include}`);
    assert.match(files['Config/DefaultEngine.ini'], /GlobalDefaultGameMode=\/Script\/DialoguePlayground.GDMGameMode/);
    assert.equal(files[root + 'DialogueData.h'],undefined,'dialogue is no longer compiled into the game');
    assert.match(files[root+'GDMPlayground.cpp'],/GDM::LoadDialogue/);
});

test('Unreal rejects invalid graphs, unsupported condition values, and embedded nulls', () => {
    const source = fixture();
    const condition = source.characters[0].dialogueNodes[7].outgoingLines[0].transitionConditions[0];
    for (const value of [null, true, {}, Infinity]) {
        condition.variableValue = value;
        assert.throws(() => buildUnrealProject(source, template), /finite number or text/);
    }
    condition.variableValue = '001';
    assert.ok(buildUnrealFixtureHeader(source).includes('{false,0.0,' + unrealString('001')));
    source.characters[0].characterName = 'bad\0name';
    assert.throws(() => buildUnrealProject(source, template), /null characters/);
    source.characters[0].characterName = 'okay';
    source.characters[0].outgoingLines[0].toNode = 999;
    assert.throws(() => buildUnrealProject(source, template), /missing dialogue 999/);
});

test('Unreal template bundle matches every editable source file', () => {
    for (const [name, content] of Object.entries(template))
        assert.equal(content, fs.readFileSync(path.join(__dirname, '..', 'export-templates/unreal', name), 'utf8'));
});

function writeProject(output, source = fixture()) {
    const files = buildUnrealProject(source, template);
    for (const [name, content] of Object.entries(files)) {
        const target = path.join(output, name);
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.writeFileSync(target, content);
    }
    fs.writeFileSync(path.join(output,root,'DialogueData.h'),buildUnrealFixtureHeader(source));
    return files;
}

const vcvars = process.env.VCVARS64 || 'C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Auxiliary/Build/vcvars64.bat';
const compiler = process.env.CXX;
test('actual exported C++ data and traversal compile and run, including Unicode and code-like text',
    {skip: !compiler && !fs.existsSync(vcvars)}, () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'gdm-unreal-test-'));
    const source = fixture();
    source.characters[0].dialogueNodes.push({dialogueID:90, dialogueType:'line', dialogueText:'"}; #include <evil> \\n 😀', nextNode:-1,
        outgoingLines:[{toNode:60, transitionConditions:[
            {variableName:'big', comparisonOperator:'=', variableValue:1e20},
            {variableName:'small', comparisonOperator:'=', variableValue:-1.23456789e-100}
        ]}]});
    writeProject(output, source);
    const exe = path.join(output, process.platform === 'win32' ? 'smoke.exe' : 'smoke');
    const smoke = path.join(__dirname, 'unreal-session-smoke.cpp');
    let compile;
    if (compiler) compile = spawnSync(compiler, ['-std=c++17', '-I' + path.join(output, root), smoke, '-o', exe], {encoding:'utf8', timeout:60000, windowsHide:true});
    else {
        const script = path.join(output, 'compile.cmd');
        fs.writeFileSync(script, `@echo off\r\ncall "${vcvars}" >nul\r\nif errorlevel 1 exit /b 1\r\ncl /nologo /EHsc /std:c++17 /utf-8 /Fe:"${exe}" /Fo:"${path.join(output, 'smoke.obj')}" /I"${path.resolve(output, root)}" "${smoke}"\r\n`);
        compile = spawnSync('cmd.exe', ['/d', '/c', script], {encoding:'utf8', timeout:60000, windowsHide:true});
    }
    assert.equal(compile.status, 0, compile.stdout + compile.stderr);
    const run = spawnSync(exe, [], {encoding:'utf8', timeout:10000, windowsHide:true});
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(run.stdout, /UNREAL_SESSION_PASS/);
    writeProject(output, require('./dialogue-sample')());
    const questCompile = compiler
        ? spawnSync(compiler, ['-std=c++17', '-I' + path.join(output, root), smoke, '-o', exe], {encoding:'utf8', timeout:60000, windowsHide:true})
        : spawnSync('cmd.exe', ['/d', '/c', path.join(output, 'compile.cmd')], {encoding:'utf8', timeout:60000, windowsHide:true});
    assert.equal(questCompile.status, 0, questCompile.stdout + questCompile.stderr);
    const quest = spawnSync(exe, [], {encoding:'utf8', timeout:10000, windowsHide:true});
    assert.equal(quest.status, 0, quest.stdout + quest.stderr);
    assert.match(quest.stdout, /UNREAL_APPLE_PASS/);
});

if (process.argv.includes('--sample')) {
    const output = path.join(__dirname, '..', 'artifacts', 'unreal-playground');
    const files = writeProject(output, require('./dialogue-sample')());
    createExportZip(files).arrayBuffer().then(buffer => fs.writeFileSync(
        path.join(output, '..', 'dialogue-unreal.zip'), Buffer.from(buffer)));
}
