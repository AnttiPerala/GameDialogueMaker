const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fixture = require('./dialogue-fixture');
const template = require('../js/gdevelopTemplate');
const {buildGDevelopProject} = require('../js/exportGDevelop');
const {createConstructDialogueSession} = require('../js/constructRuntime');
const {startGDevelopDialogueGame} = require('../js/gdevelopRuntime');
const {createExportZip} = require('../js/exportCommon');
const build = source => buildGDevelopProject(source,template,createConstructDialogueSession,startGDevelopDialogueGame);

test('GDevelop project preserves live editor state and embeds all characters as native sprites and labels', () => {
    const source = fixture();
    const dom = {}; dom.circular = dom; source.characters[0].nodeElement = dom;
    const files = build(source);
    const project = JSON.parse(files['game.json']), scene = project.layouts[0];
    assert.equal(source.characters[0].nodeElement,dom);
    delete source.characters[0].nodeElement;
    assert.deepEqual(JSON.parse(files['dialogue.json']),source);
    assert.deepEqual(JSON.parse(scene.variables[0].value).map(b=>b.characterId),source.characters.map(c=>String(c.characterID)));
    assert.equal(scene.objects.filter(o => o.type === 'Sprite').length,3);
    assert.equal(scene.objects.filter(o => o.type === 'TextObject::Text').length,3);
    assert.equal(scene.objects.find(o => o.name === 'Label_1').content.text,source.characters[0].characterName);
    const names = new Set(scene.objects.map(o => o.name));
    for (const instance of scene.instances) assert.ok(names.has(instance.name));
    for (const resource of project.resources.resources) assert.ok(files[resource.file]);
    assert.equal(new Set(scene.instances.map(i => i.persistentUuid)).size,scene.instances.length);
    assert.equal(project.firstLayout,scene.name);
    assert.doesNotThrow(() => new Function('runtimeScene','gdjs',scene.events[1].inlineCode.join('\n')));
});

test('GDevelop handles optional arrays and rejects invalid graph links and condition values', () => {
    const source = fixture();
    delete source.characters[1].dialogueNodes; delete source.characters[1].outgoingLines;
    assert.equal(JSON.parse(build(source)['game.json']).layouts[0].objects.length,6);
    source.characters[0].outgoingLines[0].toNode = 999;
    assert.throws(() => build(source),/missing dialogue 999/);
    source.characters[0].outgoingLines[0].toNode = 10;
    source.characters[0].dialogueNodes[7].outgoingLines[0].transitionConditions[0].variableValue = Infinity;
    assert.throws(() => build(source),/finite number or text/);
});

test('GDevelop bundled defaults and README match their editable sources', () => {
    assert.deepEqual(template.project,JSON.parse(fs.readFileSync(path.join(__dirname,'../export-templates/gdevelop/project-base.json'),'utf8')));
    assert.equal(template.readme,fs.readFileSync(path.join(__dirname,'../export-templates/gdevelop/README.md'),'utf8'));
});

test('official GDevelop core deserializes and round-trips the project, sprite animations and JavaScript event',
    {skip:!process.env.LIBGD_JS}, async () => {
    const gd = await require(process.env.LIBGD_JS)();
    gd.ProjectHelper.initializePlatforms();
    const project = gd.ProjectHelper.createNewGDJSProject();
    // This bundled WASM binding reuses fromJSON handles; leave those temporaries to worker teardown.
    const input = gd.Serializer.fromJSON(build(fixture())['game.json']);
    project.unserializeFrom(input);
    assert.equal(project.getLayoutsCount(),1);
    assert.equal(project.getLayoutAt(0).getObjects().getObjectsCount(),6);
    assert.equal(project.getLayoutAt(0).getEvents().getEventsCount(),2);
    const output = new gd.SerializerElement(); project.serializeTo(output);
    const data = JSON.parse(gd.Serializer.toJSON(output)), scene = data.layouts[0];
    assert.equal(scene.objects.find(o => o.name === 'Player').animations[0].directions[0].sprites[0].image,'character.png');
    assert.equal(scene.objects.find(o => o.name === 'Label_1').type,'TextObject::Text');
    assert.equal(scene.events[1].type,'BuiltinCommonInstructions::JsCode');
    assert.match(scene.events[1].inlineCode.join('\n'),/startGDevelopDialogueGame/);
    assert.doesNotThrow(() => new Function('runtimeScene','gdjs',scene.events[1].inlineCode.join('\n')));
    output.delete(); project.delete();
    const sampleProject = gd.ProjectHelper.createNewGDJSProject();
    const sampleInput = gd.Serializer.fromJSON(build(require('./dialogue-sample')())['game.json']);
    sampleProject.unserializeFrom(sampleInput);
    const sampleOutput = new gd.SerializerElement(); sampleProject.serializeTo(sampleOutput);
    const sampleScene = JSON.parse(gd.Serializer.toJSON(sampleOutput)).layouts[0];
    assert.equal(sampleScene.objects.find(o => o.name === 'Apple').animations[0].directions[0].sprites[0].image, 'apple.png');
    assert.ok(sampleScene.instances.some(i => i.name === 'Apple'));
    const sampleData = JSON.parse(build(require('./dialogue-sample')())['dialogue.json']);
    assert.equal(createConstructDialogueSession(sampleData.characters[0], {hasApple:0}).start().dialogueID, 200);
    assert.equal(createConstructDialogueSession(sampleData.characters[0], {hasApple:1}).start().dialogueID, 210);
    sampleOutput.delete(); sampleProject.delete();
});

if (process.argv.includes('--sample')) {
    const output = path.join(__dirname,'../artifacts/gdevelop-playground');
    const files = build(require('./dialogue-sample')());
    for (const [name,content] of Object.entries(files)) {
        const target = path.join(output,name); fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,content);
    }
    createExportZip(files).arrayBuffer().then(buffer => fs.writeFileSync(path.join(output,'../dialogue-gdevelop.zip'),Buffer.from(buffer)));
}
