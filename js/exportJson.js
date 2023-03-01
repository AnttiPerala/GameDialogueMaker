function exportJson(){

    // remove HTML element references from the master object (these should then be recreated by redrawing the entire object)
    for (let character of gameDialogueMakerProject.characters) {
        character.nodeElement = '';
        for (let dialogueNode of character.dialogueNodes) {
            dialogueNode.nodeElement = '';
            for (let outgoingLine of dialogueNode.outgoingLines) {
                outgoingLine.lineElem = '';
            }
        }
    }



    function downloadTextFile(text, name) {
        const a = document.createElement('a');
        const type = name.split(".").pop();
        a.href = URL.createObjectURL(new Blob([text], { type: `text/${type === "txt" ? "plain" : type}` }));
        a.download = name;
        a.click();
    }

    downloadTextFile(JSON.stringify(gameDialogueMakerProject), 'dialogue.json');

} //End exportJson()