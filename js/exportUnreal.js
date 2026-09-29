const unrealExportHelpers = typeof module !== 'undefined' ? require('./exportCommon') :
    { cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

// Fixed-width octal UTF-8 escapes keep arbitrary user text entirely inside literals.
function unrealString(value) {
    return '"' + Array.from(new TextEncoder().encode(String(value)), byte => '\\' + byte.toString(8).padStart(3, '0')).join('') + '"';
}

function buildUnrealProject(source, template) {
    const data = unrealExportHelpers.cleanDialogueProject(source);
    unrealExportHelpers.validateDialogueProject(data);
    const conditions = values => '{' + (values || []).map(c => {
        const v = c.variableValue;
        if (typeof v !== 'string' && (typeof v !== 'number' || !Number.isFinite(v)))
            throw new Error(`Condition ${c.variableName}: use a finite number or text value.`);
        if ([c.variableName, v].some(x => typeof x === 'string' && x.includes('\0')))
            throw new Error('Unreal export does not support null characters in text.');
        return `{${unrealString(c.variableName)},${unrealString(c.comparisonOperator)},{${typeof v === 'number'},${typeof v === 'number' ? v.toExponential(17) : '0.0'},${unrealString(typeof v === 'string' ? v : '')}}}`;
    }).join(',') + '}';
    const edges = lines => '{' + (lines || []).map(l => `{${unrealString(l.toNode)},${conditions(l.transitionConditions)}}`).join(',') + '}';
    const people = data.characters.map(c => {
        if ([c.characterName, ...(c.dialogueNodes || []).map(n => n.dialogueText)].some(x => typeof x === 'string' && x.includes('\0')))
            throw new Error('Unreal export does not support null characters in text.');
        const nodes = (c.dialogueNodes || []).map(n => `{${unrealString(n.dialogueID)},${unrealString(n.dialogueType)},${unrealString(n.dialogueText || '')},${unrealString(Number(n.nextNode) > 0 ? n.nextNode : '')},${edges(n.outgoingLines)}}`);
        const color = /^#[0-9a-f]{6}$/i.test(c.bgColor) ? c.bgColor : '#b68af7';
        return `{${unrealString(c.characterName || 'Unnamed character')},${unrealString(color)},${edges(c.outgoingLines)},{${nodes.join(',\n')}}}`;
    });
    return { ...template,
        'Source/DialoguePlayground/DialogueData.h': '#pragma once\n#include "DialogueSession.h"\nnamespace GDM {\ninline bool DemoAppleQuest() { return ' + (data.demoAppleQuest === true ? 'true' : 'false') + '; }\ninline std::vector<Character> MakeCharacters() { return {\n' + people.join(',\n') + '\n}; }\n}\n',
        'DialogueSource/dialogue.json': JSON.stringify(data, null, 2),
        '.gitignore': 'Binaries/\nDerivedDataCache/\nIntermediate/\nSaved/\n.vs/\n*.sln\n'
    };
}

function exportUnreal() {
    unrealExportHelpers.downloadDialogueBlob(unrealExportHelpers.createExportZip(
        buildUnrealProject(gameDialogueMakerProject, unrealTemplate)), 'dialogue-unreal.zip');
}
if (typeof module !== 'undefined') module.exports = { buildUnrealProject, unrealString };
