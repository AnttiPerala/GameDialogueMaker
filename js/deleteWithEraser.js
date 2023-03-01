//ERASER TOOL

//enable or disable clone brush
$('#eraser').on('click', function () {
    eraseMode = !eraseMode; //toggle boolean

    //when clone mode is on:
    if (eraseMode) {
        $('body').css('cursor', 'url(iconmonstr-eraser-1-48.png) 16 32, auto');
    } else {
        $('body').css('cursor', 'unset');
    }

})

//CLICKING ON A BLOCK WITH ERASEMODE ON
//DELETING STUFF WITH THE DELETE TOOL

$('body').on('mousedown', '.block, .line', function () {
    if (eraseMode) {
        //console.log(`erase ${this}`);

        //delete the corresponding node from the object

        //find the right characterRoot
        let characterToEraseFrom = $(this).closest('.characterRoot').attr('id').replace(/\D/g, '');

        //find the node ID
        let idToBeErased = $(this).closest('.blockWrap').attr('id').replace(/\D/g, '');

        //based on the character id and the node id we can find the correct node from the master object:
        let nodeTOErase = getDialogueNodeById(characterToEraseFrom, idToBeErased);

        const characterIndex = gameDialogueMakerProject.characters.findIndex(char => char.characterID == characterToEraseFrom);
        const nodeIndex = gameDialogueMakerProject.characters[characterIndex].dialogueNodes.findIndex(node => node.dialogueID == idToBeErased);

        let character = gameDialogueMakerProject.characters[characterIndex];
        //remove the clicked node from the dialogueNodes array
        character.dialogueNodes.splice(nodeIndex, 1);

        //figure out which lines were connected to the deleted node, because they should go too
        deleteLinesByToNode(idToBeErased);

        myLog(`should erase now ${idToBeErased}`,3,fileInfo = getFileInfo())
        $('#mainArea').get(0).innerHTML = '';
        $('svg').remove();
        //drawDialogueMakerProject();

/* 

        //loop through the connected lines that should also be erased
        let allConnectedLines = $('.line[data-block1="' + $(this).attr('id') + '"],.line[data-block2="' + $(this).attr('id') + '"]');

        $(allConnectedLines).remove();

        $(this).closest('.blockWrap').remove();

        //$(this).remove(); */

    }
}
);


function deleteLinesByToNode(toNodeId) {
    // loop through each character
    gameDialogueMakerProject.characters.forEach((character) => {
        // loop through each dialogue node of the character
        character.dialogueNodes.forEach((dialogueNode) => {
            // loop through each outgoing line of the dialogue node
            for (let i = 0; i < dialogueNode.outgoingLines.length; i++) {
                const outgoingLine = dialogueNode.outgoingLines[i];
                // if the toNode of the outgoing line matches the specified toNodeId, remove it from the array
                if (outgoingLine.toNode == toNodeId) {
                    dialogueNode.outgoingLines.splice(i, 1);
                    i--; // decrement i since we just removed an element from the array
                }
            }
        });
    });
}
