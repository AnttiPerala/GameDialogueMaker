function exportJson(){

    downloadDialogueBlob(new Blob([JSON.stringify(cleanDialogueProject(gameDialogueMakerProject))],
        { type: 'application/json' }), 'dialogue.json');

} //End exportJson()
