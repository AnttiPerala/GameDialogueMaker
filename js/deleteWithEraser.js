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

        let characterObjectToEraseFrom = getCharacterById(characterToEraseFrom);

        //find the node ID
        let idToBeErased = $(this).closest('.blockWrap').attr('id').replace(/\D/g, '');

        //based on the character id and the node id we can find the correct node from the master object:
        let nodeTOErase = getDialogueNodeById(characterToEraseFrom, idToBeErased);

        const characterIndex = gameDialogueMakerProject.characters.findIndex(char => char.characterID == characterToEraseFrom);
        //let character = gameDialogueMakerProject.characters[characterIndex];
        const nodeIndex = characterObjectToEraseFrom.dialogueNodes.findIndex(node => node.dialogueID == idToBeErased);

        
        //remove the clicked node from the dialogueNodes array
        characterObjectToEraseFrom.dialogueNodes.splice(nodeIndex, 1);

        //figure out which lines were connected to the deleted node, because they should go too
        deleteLinesByToNode(characterObjectToEraseFrom, idToBeErased);

        //update all the ids that come after the deleted node to avoid leaving gaps in the numbering. Note that this should be done for all characters if the nodes will all have unique values. But do they need to have unique values? Because maybe it doesn't even make sense to be able to go from a node under character 1 to a node under character 2. What would that even mean? But we should be able to go to any node under the same character by changing the next value.

        // Loop through the dialogueNodes and decrement the dialogueID of each node starting from the deleted index
        for (let i = nodeIndex; i < characterObjectToEraseFrom.dialogueNodes.length; i++) {
            characterObjectToEraseFrom.dialogueNodes[i].dialogueID--;
        }

        // Loop through the outgoingLines and update the fromNode and toNode values based on the new dialogueID of the nodes
        // This might be more complicated than I thought, because the lineElems might also need to be changed...
        /* gameDialogueMakerProject.characters.forEach(character => {
            character.outgoingLines.forEach(line => {
                if (line.fromNode > nodeIndex) {
                    line.fromNode--;
                }
                if (line.toNode > nodeIndex) {
                    line.toNode--;
                }
            });
        }); */

        //myLog(`should erase now ${idToBeErased}`,0,fileInfo = getFileInfo());

        clearCanvasBeforeReDraw();

        //now we should shift the line numbers before the redraw since the node id's have also been shifted
        //maybe it's enought to shift things inside the master object since dom elements will be redrawn anywas

        shiftObjecElementsThatAreGreaterThanDeletedIDDownByOne(characterObjectToEraseFrom, idToBeErased); //the passed in character is the actual object here

        drawDialogueMakerProject();

        

/* 

        //loop through the connected lines that should also be erased
        let allConnectedLines = $('.line[data-block1="' + $(this).attr('id') + '"],.line[data-block2="' + $(this).attr('id') + '"]');

        $(allConnectedLines).remove();

        $(this).closest('.blockWrap').remove();

        //$(this).remove(); */

    } //end if eraseMode
}
);


function deleteLinesByToNode(characterObjectToEraseFrom,toNodeId) {
    // loop through each character

    //check the characterRoot separately
    characterObjectToEraseFrom.outgoingLines.forEach((line, index) =>{
        if (line.toNode == toNodeId) {
            characterObjectToEraseFrom.outgoingLines.splice(index, 1);
            //index--; // decrement i since we just removed an element from the array
        }
    })
    
        // loop through each dialogue node of the character
    characterObjectToEraseFrom.dialogueNodes.forEach((dialogueNode) => {
            // loop through each outgoing line of the dialogue node
            for (let i = 0; i < dialogueNode.outgoingLines.length; i++) {
                const outgoingLine = dialogueNode.outgoingLines[i];
                // if the toNode of the outgoing line matches the specified toNodeId, remove it from the array
                if (outgoingLine.toNode == toNodeId) {
                    console.log('a match with passed in toNode and lines toNode');
                    dialogueNode.outgoingLines.splice(i, 1);
                    i--; // decrement i since we just removed an element from the array
                }
            }
        });
    
}

function clearCanvasBeforeReDraw() {

    document.querySelector('#mainArea').innerHTML = '';
    $('svg').remove();
    $('.conditionCircle').remove();

}

//shift elements down
function shiftObjecElementsThatAreGreaterThanDeletedIDDownByOne(characterObjectToEraseFrom, erasedID) {

    //loop through based on toNode value
    //but only for current character!!



    for (let j = 0; j < characterObjectToEraseFrom.dialogueNodes.length; j++) {
        let node = characterObjectToEraseFrom.dialogueNodes[j];
            for (let k = 0; k < node.outgoingLines.length; k++) {
                let line = node.outgoingLines[k];
                if (line.toNode > erasedID) {
                    line.toNode -= 1;
                }
            }//end for k
        }//end for j


    //we should also shift fromNode values that were greater than the deleted element down by one
    //loop through based on fromNode value
    //but only for current character!!


    for (let j = 0; j < characterObjectToEraseFrom.dialogueNodes.length; j++) {
        let node = characterObjectToEraseFrom.dialogueNodes[j];
            for (let k = 0; k < node.outgoingLines.length; k++) {
                let line = node.outgoingLines[k];
                if (line.fromNode > erasedID) {
                    line.fromNode -= 1;
                }
            }//end for k
        }//end for j



} // end function
