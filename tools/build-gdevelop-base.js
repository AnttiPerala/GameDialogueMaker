// Optional: regenerate native project defaults using GDevelop's official libGD.js.
// Usage: node tools/build-gdevelop-base.js /path/to/libGD.js (with libGD.wasm beside it).
const fs = require('node:fs');
const path = require('node:path');
(async () => {
    const gd = await require(path.resolve(process.argv[2]))();
    gd.ProjectHelper.initializePlatforms();
    const project = gd.ProjectHelper.createNewGDJSProject();
    project.setName('DialoguePlayground');
    project.setGameResolutionSize(960, 640);
    project.insertNewLayout('DialoguePlayground', 0);
    project.setFirstLayout('DialoguePlayground');
    const serialized = new gd.SerializerElement();
    project.serializeTo(serialized);
    const directory = path.join(__dirname, '..', 'export-templates/gdevelop');
    fs.mkdirSync(directory, {recursive:true});
    fs.writeFileSync(path.join(directory, 'project-base.json'), JSON.stringify(JSON.parse(gd.Serializer.toJSON(serialized)), null, 2));
    serialized.delete(); project.delete();
})();
