/* try again from scratch, keep version 1 around in case this fails */

function updateLines(domNode){
    //console.log('domNode', domNode);
    let nodeInfo = getInfoByPassingInDialogueNodeOrElement(domNode);
    //console.log('returned nodeInfo: ', nodeInfo);
    if (nodeInfo.isCharacter == true){
        updateAllLines();
    } else {
        let matchingObjectNode = nodeInfo.dialogueNode;
        let cID = nodeInfo.characterNode.characterID;
        let dID = nodeInfo.dialogueNode.dialogueID;
        //console.log('updateLines2, domNode: ', domNode);
        //console.log('cID: ', cID);
        //console.log('dID: ', dID);
        const lines = getAllConnectedLines(cID, dID); //the result seems to be lines in the object (not dom)
        //console.log('lines: ', lines);
        lines.forEach(line => {
            line.lineElem.position();
        });
    }
   
    
    
} /* end update lines 2 */

function updateAllLines() {
    if (!eraseMode) {
        gameDialogueMakerProject.characters.forEach((character) => {
            if (character.hideChildren === true) return;

            character.outgoingLines.forEach((outgoingLine) => outgoingLine.lineElem.position());
            character.dialogueNodes.forEach((dialogueNode) => {
                dialogueNode.outgoingLines.forEach((outgoingLine) => outgoingLine.lineElem.position());
            });
        });
    }
}