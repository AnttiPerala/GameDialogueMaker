//search for a specific character and then a specific node id
function getDialogueNodeById(charID, id) {

    //myLog(`(inside getDialogueNodeById and characterID is ${charID})`,0, fileInfo = getFileInfo());

    const character = gameDialogueMakerProject.characters.find(char => char.characterID == charID);
    if (!character) {
        return null; // character not found
    }
    if (id != 0){ //not the characterNode, which i set to zero
        const node = character.dialogueNodes.find(node => node.dialogueID == id);
        return node || null; // return node if found, else null
    } else {//end if
        const char = getCharacterById(charID);
        return char;
    }
    
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


function findDialogueObjectBasedOnPassedInHtmlElement(elem){

    let characterID ='';
    let dialogueID='';

    //check for character root, both in the situation where the element was the root or one of the direct children 
    if ($(elem).closest('.blockWrap').hasClass('characterRoot') || $(elem).hasClass('characterRoot')) { //if the element is already the characterRoot
        if ($(elem).closest('.blockWrap').length > 0){
            characterID = $(elem).closest('.blockWrap').attr('id').replace(/\D/g, ''); //get just the number from the id
        } else {
            characterID = $(elem).attr('id').replace(/\D/g, ''); //get just the number from the id
        }
        
        dialogueID = 0;
    } else {
          //regular nodes
        dialogueID = $(elem).closest('.blockWrap').attr('id').replace(/\D/g, ''); //get just the number from the id

        characterID = $(elem).closest('.characterRoot').attr('id').replace(/\D/g, ''); //get just the number from the id
    }


    let dialogueNodeFromObject = getDialogueNodeById(characterID, dialogueID);

    return dialogueNodeFromObject;

}

function findCharacterNodeBasedOnPassedInHtmlElement(elem) {

    let characterID;

    if ($(elem).hasClass('characterRoot') || $(elem).closest('.blockWrap').hasClass('characterRoot')){ //if the element is already the characterRoot
        if ($(elem).hasClass('characterRoot')){
            characterID = $(elem).attr('id').replace(/\D/g, ''); //get just the number from the id
        } else {
            characterID = $(elem).closest('.blockWrap').attr('id').replace(/\D/g, ''); //get just the number from the id
        }
        
        
    } else { //the element is not the characterRoot
        characterID = $(elem).closest('.characterRoot').attr('id').replace(/\D/g, ''); //get just the number from the id

    }


    let characterNodeFromObject = getCharacterById(characterID);

    return characterNodeFromObject;

}

//find the connecting line based on the 'toNode' values of lines

//returns line object from master array (not DOM line)

function findLineThatConnectsElementToParent(characterObject, dialogueID){

    let targetNode = dialogueID;
    let targetLine = null;


        //maybe no need to handle the characterRoot separately, since this should be only needed with dialogues

        //hmm but shouldnt we also check here that the line is from the correct character?

        //loop through all dialogue nodes of a character
    for (let j = 0; j < characterObject.dialogueNodes.length; j++) {
        let dialogueNode = characterObject.dialogueNodes[j];

            //loop through all outgoingLines of a dialogue
            for (let k = 0; k < dialogueNode.outgoingLines.length; k++) {
                let line = dialogueNode.outgoingLines[k];

                //if the toNode of the line matches the passed in dialogueID
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
        console.log("Found line with toNode value of " + targetNode + ": ", targetLine);
    } else {
        console.log("Could not find line with toNode value of " + targetNode);
    }
    return targetLine;
}

//find a specific line based on its fromNode and toNode

function getLineObjectFromMasterObjectUsingFromAndTo(fromNode, toNode) {
    let foundLine = '';

    // Search through each character's dialogue nodes
    for (let c = 0; c < gameDialogueMakerProject.characters.length; c++) {
        let character = gameDialogueMakerProject.characters[c];
        for (let i = 0; i < character.dialogueNodes.length; i++) {
            let node = character.dialogueNodes[i];

            // Search through each outgoing line from the node
            for (let j = 0; j < node.outgoingLines.length; j++) {
                let line = node.outgoingLines[j];

                // Check if the line matches the specified from and to nodes
                if (line.fromNode == fromNode && line.toNode == toNode) {
                    //console.log(line);
                    // Do something with the line object
                    foundLine = line;
                }
            }
        }

        // Search through each line coming from the character object
        for (let j = 0; j < character.outgoingLines.length; j++) {
            let line = character.outgoingLines[j];

            // Check if the line matches the specified from and to nodes
            if (line.fromNode == fromNode && line.toNode == toNode) {
                //console.log(line);
                // Do something with the line object
                foundLine = line;
            }
        }
    }

    return foundLine;
}
