const unrealExportHelpers = typeof module !== 'undefined' ? require('./exportCommon') :
    { cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

// Fixed-width octal UTF-8 escapes keep arbitrary user text entirely inside literals.
function unrealString(value) {
    return '"' + Array.from(new TextEncoder().encode(String(value)), byte => '\\' + byte.toString(8).padStart(3, '0')).join('') + '"';
}

function buildUnrealProject(source, template) {
    unrealExportHelpers.validateDialogueProject(source);
    for (const character of source.characters) {
        const texts = [character.characterName];
        for (const node of [character,...(character.dialogueNodes || [])]) {
            texts.push(node.dialogueText);
            for (const edge of node.outgoingLines || []) for (const condition of edge.transitionConditions || [])
                texts.push(condition.variableName,condition.variableValue);
        }
        if (texts.some(value=>typeof value==='string' && value.includes('\0')))
            throw new Error('Unreal export does not support null characters in text.');
    }
    return {...template,
        'Content/Dialogue/dialogue.json':JSON.stringify(unrealExportHelpers.cleanDialogueProject(source)),
        '.gitignore':'Binaries/\nDerivedDataCache/\nIntermediate/\nSaved/\n.vs/\n*.sln\n'};
}

function exportUnreal() {
    unrealExportHelpers.downloadDialogueBlob(unrealExportHelpers.createExportZip(
        buildUnrealProject(gameDialogueMakerProject, unrealTemplate)), 'dialogue-unreal.zip');
}
if (typeof module !== 'undefined') module.exports = { buildUnrealProject, unrealString };
