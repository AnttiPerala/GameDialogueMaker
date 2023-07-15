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

    console.log('inside findDialogueObjectBasedOnPassedInHtmlElement and elem classlist is:' + $(elem).classList + ' and elem html is: ' + $(elem).html());

    //this one is passed in text fields and inputs from the dialogue node

    let characterID ='';
    let dialogueID='';

    //check for character root, both in the situation where the element was the root or one of the direct children 
    if ($(elem).closest('.blockWrap').hasClass('characterRoot') || $(elem).hasClass('characterRoot')) { //if the element is already the characterRoot
        
        if ($(elem).closest('.blockWrap').length > 0){ //whether elem is inside an element with the class .blockWrap.
            characterID = $(elem).closest('.blockWrap').attr('id').replace(/\D/g, ''); //get just the number from the id
        } else {
            characterID = $(elem).attr('id').replace(/\D/g, ''); //get just the number from the id. I think this assumes the element itself is the root
        }
        
        dialogueID = 0;
    } else {
        console.log('not character root, id was: ' + $(elem).closest('.blockWrap').attr('id'));
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
        //console.log("Found line with toNode value of " + targetNode + ": ", targetLine);
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

//check if its a number like value

function checkIfNumberLike(myinput){

    if (isNaN(myinput)) {
        console.log("Input value is not a number");
        return("NaN");
    } else {
        console.log("Input value is a number");
        return("numer");
    }


}


//FIND THE CHARACTERS NAME BASED ON A DIALOGUENODE REFERENCE

function getCharacterNameFromDialogueNode(dialogueNode) {

    mychhh = dialogueNode;

    console.log('inside the getCharacterNameFromDialogueNode function and dialogueNode is '+ dialogueNode +' dialogueNode id is: ' + $(dialogueNode).attr('id'));

    let characterName;

    if('characterName' in dialogueNode) { //if we are already at the character root with the dialogueNode
        characterName = dialogueNode.characterName;
    } else {
        //not at root
        // Iterate over characters
    for (let character of gameDialogueMakerProject.characters) {
        // Iterate over dialogueNodes
        for (let node of character.dialogueNodes) {
          // Check if the dialogueNode matches the provided dialogueNode
          if (node === dialogueNode) {
            characterName = character.characterName;
            break;  // Exit the loop early since we found a match
          }
        }
    
        // If we've found a characterName, we can stop searching
        if (characterName) {
          break;
        }
      }
    }
    
    
  
    
  
    return characterName;
}


 
  //GET CHARACTER OBJECT IF YOU KNOW THE NAME:
  function getCharacterByName(gameDialogueMakerProject, characterName) {
    return gameDialogueMakerProject.characters.find(char => char.characterName === characterName);
}

//GET THE LARGEST DIALOGUE ID OF A CHARACTER:

function getMaxDialogueNodeId(character) {
    let highestDialogueNodeId = 0;
  
    for (let dialogueNode of character.dialogueNodes) {
        if (dialogueNode.dialogueID > highestDialogueNodeId) {
            highestDialogueNodeId = dialogueNode.dialogueID;
        }
    }
  
    return highestDialogueNodeId;
}

//FOR FINDING A LINE REFERENCE FROM THE MASTER OBJECT WHEN YOU KNOW THE CHARACTER ID, FROMNODE AND TONODE

function getLineElemFromObject(gameDialogueMakerProject, characterId, fromNodeValue, toNodeValue) {
    // Search through the characters array

    console.log(`hello from getLineElemFromObject. characterId: ${characterId}`);

    let character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);
    
    if (!character) {
        console.log(`no character found`);
        return null; // No character found with the given ID
    }

    console.log(`character match`);

    // Search through the character's outgoingLines array
    let outgoingLine = character.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);
    
    if (!outgoingLine) {
        // If not found in character's outgoingLines, search through each dialogueNodes
        for (let dialogueNode of character.dialogueNodes) {
            outgoingLine = dialogueNode.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);
            if (outgoingLine) {
                console.log(`found matching line using getLineElemFromObject ${outgoingLine}`);
                break; // Found a matching outgoingLine, so break out of the loop
            }
        }
    }
    
    return outgoingLine ? outgoingLine.lineElem : null; // Return the lineElem or null if not found
}

//DELETE A LINE FROM THE OBJECT

function deleteLineFromObject(gameDialogueMakerProject, characterId, fromNodeValue, toNodeValue) {
    // Search through the characters array
    console.log(`hello from getLineElemFromObject. characterId: ${characterId}`);

    let character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);

    if (!character) {
        console.log(`no character found`);
        return null; // No character found with the given ID
    }

    console.log(`character match`);

    // Search through the character's outgoingLines array
    let outgoingLine = character.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);

    if (outgoingLine) {
        // Remove the outgoingLine from the character's outgoingLines array
        const index = character.outgoingLines.indexOf(outgoingLine);
        character.outgoingLines.splice(index, 1);
        console.log(`removed outgoingLine`);
    } else {
        // If not found in character's outgoingLines, search through each dialogueNodes
        for (let dialogueNode of character.dialogueNodes) {
            outgoingLine = dialogueNode.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);
            if (outgoingLine) {
                // Remove the outgoingLine from the dialogueNode's outgoingLines array
                const index = dialogueNode.outgoingLines.indexOf(outgoingLine);
                dialogueNode.outgoingLines.splice(index, 1);
                console.log(`removed outgoingLine from dialogueNode`);
                break; // Found a matching outgoingLine, so break out of the loop
            }
        }
    }

    return outgoingLine ? outgoingLine.lineElem : null; // Return the lineElem or null if not found
}

//TRAVERSE ALL NODES CONNECTED TO A NODE WITH LINES

function* iterateConnectedNodes(dialogueNode, visitedNodes = new Set()) {
    visitedNodes.add(dialogueNode.dialogueID);
    
    yield dialogueNode;
  
    for (let outgoingLine of dialogueNode.outgoingLines) {
      const character = gameDialogueMakerProject.characters[0];
      const toNode = character.dialogueNodes.find(node => node.dialogueID === outgoingLine.toNode);
      
      if (toNode && !visitedNodes.has(toNode.dialogueID)) {
        yield* iterateConnectedNodes(toNode, visitedNodes);
      }
    }
  }
  
  // Example usage:
  const startNode = gameDialogueMakerProject.characters[0].dialogueNodes[0];
  
  for (let node of iterateConnectedNodes(startNode)) {
    // Perform further manipulation on each node (move or delete)
    console.log(node);
  }
  

//GET CHARACTER ID FROM PASSED IN DIALOGUE NODE

function findCharacterIDByPassingInDialogueNode(dialogueNode) {
    // Iterate through all characters
    for(let character of gameDialogueMakerProject.characters) {
        // Iterate through all dialogueNodes of the current character
        for(let node of character.dialogueNodes) {
            // If the current node is the same object instance as the input dialogueNode
            if(node === dialogueNode) {
                // Return the characterID
                return character.characterID;
            }
        }
    }
    // Return null if no matching characterID was found
    console.log(`hello from findCharacterIDByPassingInDialogueNode: no matching characterID was found`);
    return null;
}
