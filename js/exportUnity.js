const unityExportHelpers = typeof module !== 'undefined' ? require('./exportCommon') :
    { createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

function buildUnityProject(source, template) {
    const data = unityExportHelpers.cleanDialogueProject(source);
    unityExportHelpers.validateDialogueProject(data);
    const root = 'Assets/GameDialogueMaker/';
    return { ...template,
        ...(data.demoAppleQuest === true ? { [root + 'Art/apple.png']: unityExportHelpers.createDemoApplePng() } : {}),
        [root + 'Resources/dialogue.json']: JSON.stringify(data),
        'Packages/manifest.json': JSON.stringify({dependencies:{'com.unity.nuget.newtonsoft-json':'3.2.1'}},null,2),
        [root + 'Art/character.png']: Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKUlEQVR4nO3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBgXdgl/rw4unIZ5cAAAAASUVORK5CYII='), c => c.charCodeAt(0))
    };
}

function exportUnity() {
    unityExportHelpers.downloadDialogueBlob(unityExportHelpers.createExportZip(
        buildUnityProject(gameDialogueMakerProject, unityTemplate)), 'dialogue-unity.zip');
}

if (typeof module !== 'undefined') module.exports = { buildUnityProject };
