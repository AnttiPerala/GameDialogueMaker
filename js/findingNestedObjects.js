//search for a specific character and then a specific node id
function getDialogueNodeById(charID, id) {

    myLog(`(inside getDialogueNodeById and characterID is ${charID})`,0, fileInfo = getFileInfo());

    const character = gameDialogueMakerProject.characters.find(char => char.characterID == charID);
    if (!character) {
        return null; // character not found
    }
    const node = character.dialogueNodes.find(node => node.dialogueID == id);
    return node || null; // return node if found, else null
}


//for finding just a specific character
function getCharacterById(id) {
    for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
        if (gameDialogueMakerProject.characters[i].characterID == id) {
            return gameDialogueMakerProject.characters[i];
        }
    }
    return null; // if no character is found with the given id
}


function findDialogueNodeBasedOnPassedInHtmlElement(elem){

    let dialogueID = $(elem).closest('.blockWrap').attr('id').replace(/\D/g, ''); //get just the number from the id

    let characerID = $(elem).closest('.characterRoot').attr('id').replace(/\D/g, ''); //get just the number from the id

    let dialogueNodeFromObject = getDialogueNodeById(characerID, dialogueID);

    return dialogueNodeFromObject;

}

function findCharacterNodeBasedOnPassedInHtmlElement(elem) {

    let characerID;

    if ($(elem).hasClass('characterRoot')){ //if the element is already the characterRoot
        characerID = elem.attr('id').replace(/\D/g, ''); //get just the number from the id
    } else { //the element is not the characterRoot
        characerID = $(elem).closest('.characterRoot').attr('id').replace(/\D/g, ''); //get just the number from the id

    }


    let characterNodeFromObject = getCharacterById(characerID);

    return characterNodeFromObject;

}

//find the connecting line based on the 'toNode' values of lines

function findLineThatConnectsElementToParent(dialogueID){

    let targetNode = dialogueID;
    let targetLine = null;

    for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
        let character = gameDialogueMakerProject.characters[i];

        for (let j = 0; j < character.dialogueNodes.length; j++) {
            let dialogueNode = character.dialogueNodes[j];

            for (let k = 0; k < dialogueNode.outgoingLines.length; k++) {
                let line = dialogueNode.outgoingLines[k];

                if (line.toNode == targetNode) {
                    targetLine = line;
                    break;
                }
            }

            if (targetLine) {
                break;
            }
        }

        if (targetLine) {
            break;
        }
    }

    if (targetLine) {
        console.log("Found line with toNode value of " + targetNode + ": ", targetLine);
    } else {
        console.log("Could not find line with toNode value of " + targetNode);
    }
    return targetLine;
}