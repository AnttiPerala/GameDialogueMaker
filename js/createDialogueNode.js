function createDialogueHTMLElement(dialogueNode) {

    let nodeInfo = getInfoByPassingInDialogueNodeOrElement(dialogueNode);
    let dialogueElement = ''; //the final product
    let activeNextNode = '';

    if (dialogueNode.nextNode > 0){ //only display the number if it's greater than zero
        activeNextNode = dialogueNode.nextNode;
    }


    //new approach

    //if character, return immediately because character nodes are created inside drawDialogueMakerProject

    if (nodeInfo.isCharacter === true){
        return;
    }

    if (dialogueNode.dialogueType == 'question'){
       dialogueElement = createQuestionBlock(nodeInfo);
       
       
    }

    if (dialogueNode.dialogueType == 'answer') {
        dialogueElement = createAnswerBlock(nodeInfo);
    }

    if (dialogueNode.dialogueType == 'line') {
       dialogueElement = createLineBlock(nodeInfo);
    }

    if (dialogueNode.dialogueType == 'fight') {
        dialogueElement = createFightBlock(nodeInfo);
    }

    //store element reference in object
    nodeInfo.dialogueNode.nodeElement = dialogueElement;

    


    return dialogueElement;
}

window.createDialogueHTMLElement = createDialogueHTMLElement;

