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
        //console.log("Could not find line with toNode value of " + targetNode);
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

//FIND LINE START AND END OBJECTS FROM LINE ELEMENT
function getLineAnchorHTMLElementsFromLine(line) {
    // Convert the start and end elements to jQuery objects
    let $start = $(line.start);
    let $end = $(line.end);

    // Ensure the start element is a plusButton and the end element has the class 'topConnectionSocket'
    if ($start.is('.blobkPlusButton') && $end.is('.topConnectionSocket')) {
        return { start: $start, end: $end };
    } else {
        console.warn("Line start and end elements do not match expected classes. start was ", $start);
        console.warn("Line end was ", $end);
        return null;
    }
}

//GET MATCHING OBJECT ELEMENT BASED ON PASSED IN BLOCKWRAP
function findMatchingDialogueNodeInObjectFromPassedInBlockwrap(blockWrap) {
    // Iterate over all characters
    for(let character of gameDialogueMakerProject.characters) {
        // Iterate over all dialogueNodes of the current character
        for(let dialogueNode of character.dialogueNodes) {
            // Compare the nodeElement of the dialogueNode with the provided blockWrap
            if(dialogueNode.nodeElement.is(blockWrap)) {
                // If they match, return the dialogueNode
                return dialogueNode;
            }
        }
    }

    // If no matching dialogueNode was found, return null
    return null;
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
          if (node == dialogueNode) {
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

//takes a character object as argument
function getMaxDialogueNodeId(character) {
    let highestDialogueNodeId = 0;
  
    if (character.dialogueNodes && character.dialogueNodes.length > 0) {
        for (let dialogueNode of character.dialogueNodes) {
            if (dialogueNode.dialogueID > highestDialogueNodeId) {
                highestDialogueNodeId = dialogueNode.dialogueID;
            }
        }
    }
  console.log(`returning highestDialogueNodeId which was: ${highestDialogueNodeId}`);
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

function* iterateConnectedNodes(startNode, characterId, visitedNodes = new Set()) {
    if (!startNode || !startNode.dialogueID) {
        console.log("Invalid startNode:", startNode);
        return;
    }

    visitedNodes.add(startNode.dialogueID);

    console.log("Visiting startNode:", startNode);

    let theCharid = findCharacterIDByPassingInDialogueNode(startNode);

    yield startNode;

    for (let outgoingLine of startNode.outgoingLines) {
        const character = gameDialogueMakerProject.characters.find(character => character.characterID == theCharid);
        const toNode = character.dialogueNodes.find(node => node.dialogueID == outgoingLine.toNode);

        console.log("Outgoing line from ", startNode.dialogueID, " to ", outgoingLine.toNode);
        console.log("Found toNode: ", toNode);

        if (toNode && !visitedNodes.has(toNode.dialogueID)) {
            console.log("Traversing toNode:", toNode);
            yield* iterateConnectedNodes(toNode, characterId, visitedNodes);
        }
    }
}



  

//GET CHARACTER ID FROM PASSED IN DIALOGUE NODE
function findCharacterIDByPassingInDialogueNode(dialogueNode) {
    // Check if the dialogueNode has a characterID key
    if (dialogueNode && dialogueNode.hasOwnProperty('characterID')) {
        console.log('Found characterID in the input dialogueNode:', dialogueNode.characterID);
        return dialogueNode.characterID;
    }

    // Iterate through all characters
    for (let character of gameDialogueMakerProject.characters) {
        // Check if the character has dialogueNodes
        if (character.dialogueNodes && character.dialogueNodes.length > 0) {
            // Iterate through all dialogueNodes of the current character
            for (let node of character.dialogueNodes) {
                // If the current node is the same object instance as the input dialogueNode
                if (typeof node == 'object' && node == dialogueNode) {
                    console.log('Found characterID by matching dialogueNode:', character.characterID);
                    return character.characterID;
                }
            }
        }
    }

    // No matching characterID was found
    console.log('No matching characterID was found');
    return null;
}



//UPDATE THE DIALOGUE ID's WHILE MAINTAINING THE CORRECT LINE RELATIONSHIPS

function updateDialogueIds(node, newIdFunction, oldToNewIds) {
    // Assign a new ID to the node
    let oldId = node.dialogueID;
    let newId = newIdFunction(oldId);
    node.dialogueID = newId;

    for (let line of node.outgoingLines) {
        // Update fromNode and toNode based on the oldToNewIds mapping
        if (oldToNewIds.hasOwnProperty(line.fromNode)) {
            line.fromNode = oldToNewIds[line.fromNode];
        }
        if (oldToNewIds.hasOwnProperty(line.toNode)) {
            line.toNode = oldToNewIds[line.toNode];
        }
    }
}




// Generate a function that starts IDs from any number
function generateNewIdFunction(start) {
    let nextId = start;
    return function(oldId) {
        let newId = nextId;
        nextId++;
        return newId;
    }
}

//USE FIND ONLY TO A RECURSION LIMIT

jQuery.fn.findWithDepth = function(selector, maxDepth) {
    var depths = [], i, elements = jQuery();
    if(maxDepth > 0){
        for(i = 0; i < maxDepth; i++) {
            depths = i === 0 ? this.children() : depths.children();
            elements = elements.add(depths.filter(selector));
        }
    }
    return elements;
};

function reparentNodeAndDescendants(startNode, oldParentId, newParentId, nextId, gameDialogueMakerProject) {
    // This will hold the mapping from old IDs to new IDs
    const oldToNewIds = {};

    // This will temporarily hold the nodes to be transferred
    let tempArray = [];

    // Find the parent characters
    const oldParent = gameDialogueMakerProject.characters.find(character => character.characterID == oldParentId);
    const newParent = gameDialogueMakerProject.characters.find(character => character.characterID == newParentId);

    // First, generate new IDs for all the nodes and build the oldToNewIds mapping
    for (let dialogueNode of iterateConnectedNodes(startNode, oldParentId)) {
        // Remove the node from the old parent's dialogueNodes array
        oldParent.dialogueNodes = oldParent.dialogueNodes.filter(node => node.dialogueID !== dialogueNode.dialogueID);

        // Assign a new ID to the node and save the mapping from the old ID to the new ID
        let oldId = dialogueNode.dialogueID;
        let newId = nextId++;
        oldToNewIds[oldId] = newId;

        // Push the node to the tempArray
        tempArray.push(dialogueNode);
    }

    // Now, go through the nodes again and update their IDs and their outgoing lines
    for (let dialogueNode of tempArray) {
        // Update the node's ID
        dialogueNode.dialogueID = oldToNewIds[dialogueNode.dialogueID];

        // Update the node's outgoing lines
        for (let line of dialogueNode.outgoingLines) {
            if (oldToNewIds.hasOwnProperty(line.fromNode)) {
                line.fromNode = oldToNewIds[line.fromNode];
            }
            if (oldToNewIds.hasOwnProperty(line.toNode)) {
                line.toNode = oldToNewIds[line.toNode];
            }
        }
    }

    // Finally, append the nodes to the new parent's dialogueNodes
    newParent.dialogueNodes = newParent.dialogueNodes.concat(tempArray);
}


