//ERASER TOOL

            //to do:
            //looks like we need to convert the x and y position of the node somehow to adapt to the new parent it gets

//enable or disable eraser brush
$('#eraser').on('click', function () {
    eraseMode = !eraseMode; //toggle boolean

    //when erase mode is on:
    if (eraseMode) {
        $('body').css('cursor', 'url(img/iconmonstr-eraser-1-48.png) 16 32, auto');
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

        //lets first check if the clicked node (or it's immediate 2nd parent) was a character root node
        if ($(this).hasClass('characterRoot') || $(this).parent().parent().hasClass('characterRoot')) {
            //console.log(`clicked node was character root`);

            //i think it's not safe to let nodes exists without a characterRoot parent so I think we need to delete the entire character tree from the gameDialogueMakerProject

            let characterIDToErase = $(this).closest('.characterRoot').attr('id').replace(/\D/g, '');

            let characterObjectToErase = getCharacterById(characterIDToErase);

            //this gives us the correct character
            const characterIndex = gameDialogueMakerProject.characters.findIndex(char => char.characterID == characterIDToErase);

            gameDialogueMakerProject.characters.splice(characterIndex, 1);

            // Loop through the characters and decrement the characterID of each character starting from the deleted index
            for (let i = characterIndex; i < gameDialogueMakerProject.characters.length; i++) {
                gameDialogueMakerProject.characters[i].characterID--;
            }

            clearCanvasBeforeReDraw();
            drawDialogueMakerProject();

        } else {

            //console.log(`clicked node was not character root, but had classes  ${$(this).attr('class')}`);

            //find the right characterRoot
            let characterToEraseFrom = $(this).closest('.characterRoot').attr('id').replace(/\D/g, '');

            let characterObjectToEraseFrom = getCharacterById(characterToEraseFrom);

            //find the node ID
            let idToBeErased = $(this).closest('.blockWrap').attr('id').replace(/\D/g, '');

            //based on the character id and the node id we can find the correct node from the master object:
            let nodeTOErase = getDialogueNodeById(characterToEraseFrom, idToBeErased);

            //this gives us the correct character
            const characterIndex = gameDialogueMakerProject.characters.findIndex(char => char.characterID == characterToEraseFrom);
            //this give us the correct dialogue node from the character
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

        

            //myLog(`should erase now ${idToBeErased}`,0,fileInfo = getFileInfo());

            clearCanvasBeforeReDraw();

            //now we should shift the line numbers before the redraw since the node id's have also been shifted
            //maybe it's enought to shift things inside the master object since dom elements will be redrawn anywas

            shiftObjecElementsThatAreGreaterThanDeletedIDDownByOne(characterObjectToEraseFrom, idToBeErased); //the passed in character is the actual object here

            drawDialogueMakerProject();

        } //end else

       

       


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
                    //console.log('a match with passed in toNode and lines toNode');
                    dialogueNode.outgoingLines.splice(i, 1);
                    //now also select the node html element and make the topConnectionSocket data-hasline="false" so that it can be reconnected
                    $(dialogueNode.nodeElement).find('.topConnectionSocket').attr('data-hasline', 'false');
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
