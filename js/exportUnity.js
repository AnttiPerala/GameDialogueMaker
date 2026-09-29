const unityExportHelpers = typeof module !== 'undefined' ? require('./exportCommon') :
    { createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

function buildUnityProject(source, template) {
    const data = unityExportHelpers.cleanDialogueProject(source);
    unityExportHelpers.validateDialogueProject(data);
    const edges = lines => (lines || []).map(line => ({
        target: String(line.toNode),
        conditions: (line.transitionConditions || []).map(condition => {
            const value = condition.variableValue;
            if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value)))
                throw new Error(`Condition ${condition.variableName}: use a finite number or text value.`);
            return { name: condition.variableName, op: condition.comparisonOperator,
                kind: typeof value === 'number' ? 'number' : 'text',
                number: typeof value === 'number' ? value : 0,
                text: typeof value === 'string' ? value : '' };
        })
    }));
    const runtime = { demoAppleQuest: data.demoAppleQuest === true, characters: data.characters.map(character => ({
        id: String(character.characterID), name: character.characterName || 'Unnamed character',
        color: /^#[0-9a-f]{6}$/i.test(character.bgColor) ? character.bgColor : '#b68af7',
        start: edges(character.outgoingLines),
        nodes: (character.dialogueNodes || []).map(node => ({
            id: String(node.dialogueID), type: node.dialogueType, text: String(node.dialogueText || ''),
            next: Number(node.nextNode) > 0 ? String(node.nextNode) : null,
            edges: edges(node.outgoingLines)
        }))
    })) };
    const root = 'Assets/GameDialogueMaker/';
    return { ...template,
        ...(data.demoAppleQuest === true ? { [root + 'Art/apple.png']: unityExportHelpers.createDemoApplePng() } : {}),
        [root + 'Resources/GDMDialogue.json']: JSON.stringify(runtime, null, 2),
        [root + 'Source/dialogue.json']: JSON.stringify(data, null, 2),
        [root + 'Art/character.png']: Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKUlEQVR4nO3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBgXdgl/rw4unIZ5cAAAAASUVORK5CYII='), c => c.charCodeAt(0))
    };
}

function exportUnity() {
    unityExportHelpers.downloadDialogueBlob(unityExportHelpers.createExportZip(
        buildUnityProject(gameDialogueMakerProject, unityTemplate)), 'dialogue-unity.zip');
}

if (typeof module !== 'undefined') module.exports = { buildUnityProject };
