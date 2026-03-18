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

function deleteBlockWrap(blockWrapEl) {
    const $blockWrap = $(blockWrapEl);
    if (!$blockWrap || $blockWrap.length === 0) return;

    const blockWrapId = $blockWrap.attr('id');
    const dialogueId = $blockWrap.attr('data-dialogue-id');
    const characterId = $blockWrap.attr('data-character-id');

    // Character root deletion => remove the whole character tree
    if ($blockWrap.hasClass('characterRoot')) {
        const characterIDToErase = String(characterId || blockWrapId || '').replace(/\D/g, '');
        if (!characterIDToErase) return;

        const characterIndex = gameDialogueMakerProject.characters.findIndex(char => char.characterID == characterIDToErase);
        if (characterIndex < 0) return;

        gameDialogueMakerProject.characters.splice(characterIndex, 1);

        // decrement character IDs to avoid gaps
        for (let i = characterIndex; i < gameDialogueMakerProject.characters.length; i++) {
            gameDialogueMakerProject.characters[i].characterID--;
        }

        clearCanvasBeforeReDraw();
        drawDialogueMakerProject();
        return;
    }

    // Dialogue node deletion
    const characterToEraseFrom = String(characterId || '').replace(/\D/g, '');
    const idToBeErased = String(dialogueId || blockWrapId || '').replace(/\D/g, '');
    if (!characterToEraseFrom || !idToBeErased) return;

    const characterObjectToEraseFrom = getCharacterById(characterToEraseFrom);
    if (!characterObjectToEraseFrom) return;

    const nodeIndex = characterObjectToEraseFrom.dialogueNodes.findIndex(node => node.dialogueID == idToBeErased);
    if (nodeIndex < 0) return;

    characterObjectToEraseFrom.dialogueNodes.splice(nodeIndex, 1);
    deleteLinesByToNode(characterObjectToEraseFrom, idToBeErased);

    // decrement dialogue IDs to avoid gaps
    for (let i = nodeIndex; i < characterObjectToEraseFrom.dialogueNodes.length; i++) {
        characterObjectToEraseFrom.dialogueNodes[i].dialogueID--;
    }

    clearCanvasBeforeReDraw();
    shiftObjecElementsThatAreGreaterThanDeletedIDDownByOne(characterObjectToEraseFrom, idToBeErased);
    drawDialogueMakerProject();
}

window.deleteBlockWrap = deleteBlockWrap;

$('body').on('mousedown', '.block, .line', function (event) {
    if (!eraseMode) return;

    // Don't accidentally delete while interacting with condition UI
    if ($(event.target).closest('.conditionCircle').length) return;

    // Only operate on real node wrappers; `.line` clicks have no `.blockWrap`.
    const blockWrap = $(event.target).closest('.blockWrap');
    if (!blockWrap || blockWrap.length === 0) return;

    deleteBlockWrap(blockWrap.get(0));
});


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

  const main = document.querySelector('#mainArea');

  // Remove everything EXCEPT the SVG overlay (and anything else you may later whitelist)
  Array.from(main.children).forEach(child => {
    if (child.id === 'connectionsSvg') return; // keep SVG lines
    child.remove();
  });

  // Remove legacy leaderline SVGs that might live elsewhere
  $("svg").not("#connectionsSvg").remove();

  // Remove your condition circles (these are separate DOM elements)
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
