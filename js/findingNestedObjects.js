//search for a specific character and then a specific node id
function getDialogueNodeById(charID, id) {

    //myLog(`(inside getDialogueNodeById and characterID is ${charID})`,0, fileInfo = getFileInfo());
    let character;
    if (id == 0){ //its a character node
        character = gameDialogueMakerProject.characters.find(char => char.characterID == charID);
        return character;
    } else { //not 0
         character = gameDialogueMakerProject.characters.find(char => char.characterID == charID);
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


function findDialogueObjectBasedOnPassedInHtmlElement(elem) {
  const $el = (elem && elem.jquery) ? elem : $(elem);

  // Resolve the owning node wrapper
  const $bw = $el.hasClass("blockWrap") ? $el : $el.closest(".blockWrap");
  if (!$bw.length) return null;

  // Character root has no dialogue object (it uses outgoingLines on character)
  if ($bw.hasClass("characterRoot")) return null;

  // ✅ Prefer data attributes (flat DOM safe)
  let characterId =
    Number($bw.attr("data-character-id")) ||
    Number($bw.data("character-id"));

  let dialogueId =
    Number($bw.attr("data-dialogue-id")) ||
    Number($bw.data("dialogue-id"));

  // Fallback: parse from id="dialogue7"
  if (!dialogueId) {
    const idAttr = String($bw.attr("id") || "");
    dialogueId = Number(idAttr.replace(/\D/g, "")) || null;
  }

  if (!dialogueId) return null;

  // Find character object
  let characterObj = null;

  if (characterId) {
    characterObj = gameDialogueMakerProject.characters.find(
      (c) => Number(c.characterID) === Number(characterId)
    ) || null;
  }

  // If characterId missing/incorrect, find by dialogueId globally
  if (!characterObj) {
    characterObj = gameDialogueMakerProject.characters.find((c) =>
      c.dialogueNodes?.some((n) => Number(n.dialogueID) === Number(dialogueId))
    ) || null;
  }

  if (!characterObj) return null;

  // Return the dialogue node object
  return characterObj.dialogueNodes.find(
    (n) => Number(n.dialogueID) === Number(dialogueId)
  ) || null;
}

function findCharacterNodeBasedOnPassedInHtmlElement(elem) {
  const $el = (elem && elem.jquery) ? elem : $(elem);

  // Prefer the nearest owning blockWrap, then use its data-character-id
  const $bw = $el.hasClass("blockWrap") ? $el : $el.closest(".blockWrap");
  if (!$bw.length) return null;

  // ✅ Get characterId from data attr (works in flat DOM)
  let characterID =
    Number($bw.attr("data-character-id")) ||
    Number($bw.data("character-id"));

  // Fallback: try closest characterRoot if present
  if (!characterID) {
    const $cr = $bw.hasClass("characterRoot") ? $bw : $bw.closest(".characterRoot");
    if ($cr.length) {
      characterID =
        Number($cr.attr("data-character-id")) ||
        Number($cr.data("character-id")) ||
        Number(String($cr.attr("id") || "").replace(/\D/g, ""));
    }
  }

  if (!characterID) return null;

  return getCharacterById(characterID);
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
    if (!fromNode || !toNode) {
        throw new Error("Both fromNode and toNode parameters must be provided");
    }

    let foundLine = '';

    if (!gameDialogueMakerProject || !Array.isArray(gameDialogueMakerProject.characters)) {
        throw new Error("Invalid or missing gameDialogueMakerProject structure");
    }

    // Search through each character's dialogue nodes
    for (let c = 0; c < gameDialogueMakerProject.characters.length; c++) {
        let character = gameDialogueMakerProject.characters[c];

        if (character.dialogueNodes && Array.isArray(character.dialogueNodes)) {
            for (let i = 0; i < character.dialogueNodes.length; i++) {
                let node = character.dialogueNodes[i];

                if (node.outgoingLines && Array.isArray(node.outgoingLines)) {
                    for (let j = 0; j < node.outgoingLines.length; j++) {
                        let line = node.outgoingLines[j];

                        // Check if the line matches the specified from and to nodes
                        if (line.fromNode == fromNode && line.toNode == toNode) {
                            foundLine = line;
                        }
                    }
                }
            }
        }

        // Search through each line coming from the character object
        if (character.outgoingLines && Array.isArray(character.outgoingLines)) {
            for (let j = 0; j < character.outgoingLines.length; j++) {
                let line = character.outgoingLines[j];

                // Check if the line matches the specified from and to nodes
                if (line.fromNode == fromNode && line.toNode == toNode) {
                    foundLine = line;
                }
            }
        }
    }

    if (!foundLine) {
        console.warn(`No line found matching fromNode "${fromNode}" and toNode "${toNode}"`);
    } else {
        console.log('foundLine', foundLine);
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
    for (let character of gameDialogueMakerProject.characters) {
        // Check if the blockWrap matches the characterNode's nodeElement
        if (character.nodeElement.is(blockWrap)) {
            // If they match, return the characterNode
            return character;
        }

        // Iterate over all dialogueNodes of the current character
        for (let dialogueNode of character.dialogueNodes) {
            // Compare the nodeElement of the dialogueNode with the provided blockWrap
            if (dialogueNode.nodeElement.is(blockWrap)) {
                // If they match, return the dialogueNode
                return dialogueNode;
            }
        }
    }

    // If no matching dialogueNode or characterNode was found, return null
    return null;
}



//check if its a number like value

function checkIfNumberLike(myinput){

    if (isNaN(myinput)) {
        //console.log("Input value is not a number");
        return("NaN");
    } else {
        //console.log("Input value is a number");
        return("numer");
    }


}


//FIND THE CHARACTERS NAME BASED ON A DIALOGUENODE REFERENCE

function getCharacterNameFromDialogueNode(dialogueNode) {

    mychhh = dialogueNode;

    //console.log('inside the getCharacterNameFromDialogueNode function and dialogueNode is '+ dialogueNode +' dialogueNode id is: ' + $(dialogueNode).attr('id'));

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
  //console.log(`returning highestDialogueNodeId which was: ${highestDialogueNodeId}`);
    return highestDialogueNodeId;
}


//FOR FINDING A LINE REFERENCE FROM THE MASTER OBJECT WHEN YOU KNOW THE CHARACTER ID, FROMNODE AND TONODE

function getLineElemFromObject(gameDialogueMakerProject, characterId, fromNodeValue, toNodeValue) {
    // Search through the characters array

    //console.log(`hello from getLineElemFromObject. characterId: ${characterId}`);

    let character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);
    
    if (!character) {
        //console.log(`no character found`);
        return null; // No character found with the given ID
    }

    //console.log(`character match`);

    // Search through the character's outgoingLines array
    let outgoingLine = character.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);
    
    if (!outgoingLine) {
        // If not found in character's outgoingLines, search through each dialogueNodes
        for (let dialogueNode of character.dialogueNodes) {
            outgoingLine = dialogueNode.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);
            if (outgoingLine) {
                //console.log(`found matching line using getLineElemFromObject ${outgoingLine}`);
                break; // Found a matching outgoingLine, so break out of the loop
            }
        }
    }
    
    return outgoingLine ? outgoingLine.lineElem : null; // Return the lineElem or null if not found
}

//DELETE A LINE FROM THE OBJECT

function deleteLineFromObject(gameDialogueMakerProject, characterId, fromNodeValue, toNodeValue) {
    // Search through the characters array
    console.log(`hello from deleteLineFromObject. characterId: ${characterId} fromNodeValue: ${fromNodeValue} toNodeValue: ${toNodeValue }`);

    let character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);

    if (!character) {
        //console.log(`no character found`);
        return null; // No character found with the given ID
    }

    //console.log(`character match`);

    // Search through the character's outgoingLines array
    let outgoingLine = character.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);

    if (outgoingLine) {
        // Remove the outgoingLine from the character's outgoingLines array
        const index = character.outgoingLines.indexOf(outgoingLine);
        character.outgoingLines.splice(index, 1);
        console.log(`removed outgoingLine from character. here's how it looks now: `, character);
    } else {
        // If not found in character's outgoingLines, search through each dialogueNodes
        for (let dialogueNode of character.dialogueNodes) {
            outgoingLine = dialogueNode.outgoingLines.find(line => line.fromNode == fromNodeValue && line.toNode == toNodeValue);
            if (outgoingLine) {
                // Remove the outgoingLine from the dialogueNode's outgoingLines array
                const index = dialogueNode.outgoingLines.indexOf(outgoingLine);
                dialogueNode.outgoingLines.splice(index, 1);
                //console.log(`removed outgoingLine from dialogueNode`);
                break; // Found a matching outgoingLine, so break out of the loop
            }
        }
    }

    return outgoingLine ? outgoingLine.lineElem : null; // Return the lineElem or null if not found
}



  

//GET CHARACTER ID FROM PASSED IN DIALOGUE OBJECT NODE
function findCharacterIDByPassingInDialogueNode(dialogueNode) {
    // Check if the dialogueNode has a characterID key
    if (dialogueNode && dialogueNode.hasOwnProperty('characterID')) {
        //console.log('Found characterID in the input dialogueNode:', dialogueNode.characterID);
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
                    //console.log('Found characterID by matching dialogueNode:', character.characterID);
                    return character.characterID;
                }
            }
        }
    }

    // No matching characterID was found
    //console.log('No matching characterID was found');
    return null;
}


/* UNIVERSAL SYSTEM */
/* UNIVERSAL SYSTEM (robust for FLAT DOM + clicks on child elements like + buttons) */
function getInfoByPassingInDialogueNodeOrElement(input) {
  let dialogueNode = input;
  let isCharacter = false;

  // -----------------------------
  // DOM / jQuery input
  // -----------------------------
  if (input && (input.jquery || input instanceof HTMLElement)) {
    const $raw = input.jquery ? input : $(input);

    // Always resolve to the owning blockWrap
    const $bw = $raw.hasClass("blockWrap") ? $raw : $raw.closest(".blockWrap");

    if (!$bw.length) {
      return {
        characterID: null,
        characterName: null,
        characterNode: null,
        dialogueID: null,
        dialogueNode: null,
        isCharacter: false,
      };
    }

    const idAttr = String($bw.attr("id") || "");
    isCharacter = $bw.hasClass("characterRoot") || idAttr.startsWith("char");

    // ✅ Prefer explicit data attributes (works in flat layout)
    let characterId =
      Number($bw.attr("data-character-id")) ||
      Number($bw.data("character-id"));

    let dialogueId =
      Number($bw.attr("data-dialogue-id")) ||
      Number($bw.data("dialogue-id"));

    // Fallbacks (older markup)
    if (!characterId) {
      // try from closest character root if exists
      const $cr = $bw.hasClass("characterRoot") ? $bw : $bw.closest(".characterRoot");
      const crId = String($cr.attr("id") || "");
      characterId = Number(crId.replace(/\D/g, "")) || null;
    }

    if (!isCharacter && !dialogueId) {
      // derive from id="dialogue7"
      dialogueId = Number(idAttr.replace(/\D/g, "")) || null;
    }

    // Find character object
    let characterObj = null;
    if (characterId != null) {
      characterObj = gameDialogueMakerProject.characters.find(
        (c) => Number(c.characterID) === Number(characterId)
      ) || null;
    }

    // If character wasn't found (edge case), try by locating the dialogueId globally
    if (!characterObj && !isCharacter && dialogueId != null) {
      characterObj = gameDialogueMakerProject.characters.find((c) =>
        c.dialogueNodes?.some((n) => Number(n.dialogueID) === Number(dialogueId))
      ) || null;

      if (characterObj) characterId = characterObj.characterID;
    }

    if (!characterObj) {
      return {
        characterID: characterId ?? null,
        characterName: null,
        characterNode: null,
        dialogueID: isCharacter ? null : (dialogueId ?? null),
        dialogueNode: null,
        isCharacter,
      };
    }

    // Character root return
    if (isCharacter) {
      return {
        characterID: characterId,
        characterName: characterObj.characterName,
        characterNode: characterObj,
        dialogueID: null,
        dialogueNode: null,
        isCharacter: true,
      };
    }

    // Dialogue node return
    let nodeObj = null;
    if (dialogueId != null) {
      nodeObj = characterObj.dialogueNodes.find(
        (n) => Number(n.dialogueID) === Number(dialogueId)
      ) || null;
    }

    return {
      characterID: characterId,
      characterName: characterObj.characterName,
      characterNode: characterObj,
      dialogueID: nodeObj ? nodeObj.dialogueID : (dialogueId ?? null),
      dialogueNode: nodeObj,
      isCharacter: false,
    };
  }

  // -----------------------------
  // dialogueNode object input
  // -----------------------------
  if (dialogueNode && dialogueNode.dialogueID) {
    for (let character of gameDialogueMakerProject.characters) {
      if (!character.dialogueNodes) continue;
      for (let node of character.dialogueNodes) {
        if (node === dialogueNode) {
          return {
            characterID: character.characterID,
            characterName: character.characterName,
            characterNode: character,
            dialogueID: dialogueNode.dialogueID,
            dialogueNode: dialogueNode,
            isCharacter: false,
          };
        }
      }
    }
  }

  // No match
  return {
    characterID: null,
    characterName: null,
    characterNode: null,
    dialogueID: null,
    dialogueNode: null,
    isCharacter: false,
  };
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

// Returns an iterable (generator) over startNode and all descendant dialogue nodes
// within the character `oldParentId`, following outgoingLines[].toNode.
// Usage: for (let dialogueNode of iterateConnectedNodes(startNode, oldParentId)) { ... }
function* iterateConnectedNodes(startNode, oldParentId) {

  const oldParent = gameDialogueMakerProject.characters.find(
    (character) => String(character.characterID) === String(oldParentId)
  );

  if (!oldParent || !oldParent.dialogueNodes) return;

  // Build quick lookup by dialogueID (numbers/strings both ok)
  const nodeMap = new Map();
  for (const n of oldParent.dialogueNodes) {
    nodeMap.set(String(n.dialogueID), n);
  }

  const visited = new Set();

  function* walk(node) {
    if (!node) return;

    const key = String(node.dialogueID);
    if (visited.has(key)) return;
    visited.add(key);

    yield node;

    // Follow children
    const lines = node.outgoingLines || [];
    for (const line of lines) {
      const childId = line.toNode;
      const child = nodeMap.get(String(childId));
      if (child) {
        yield* walk(child);
      }
    }
  }

  // Ensure we start with the real object instance from oldParent.dialogueNodes when possible
  const start = nodeMap.get(String(startNode.dialogueID)) || startNode;
  yield* walk(start);
}



function reparentNodeAndDescendants(startNode, oldParentId, newParentId, nextId, gameDialogueMakerProject) {
    // This will hold the mapping from old IDs to new IDs
    const oldToNewIds = {};

    // This will temporarily hold the nodes to be transferred
    let tempArray = [];

    console.log('oldParentId', oldParentId);
    console.log('newParentId', newParentId);

    // Find the parent characters
    const oldParent = gameDialogueMakerProject.characters.find(character => character.characterID == oldParentId);
    const newParent = gameDialogueMakerProject.characters.find(character => character.characterID == newParentId);

    console.log('oldParent', oldParent);
    console.log('newParent', newParent);

    // First, generate new IDs for all the nodes and build the oldToNewIds mapping
    for (let dialogueNode of iterateConnectedNodes(startNode, oldParentId)) {
        // 1. Check if the dialogueNode with the given dialogueID exists in the oldParent.dialogueNodes array.
        const nodeExistsBefore = oldParent.dialogueNodes.some(node => node.dialogueID === dialogueNode.dialogueID);

        // 2. Perform the filtering operation.
        oldParent.dialogueNodes = oldParent.dialogueNodes.filter(node => node.dialogueID !== dialogueNode.dialogueID);

        // 3. Check if the dialogueNode with the given dialogueID still exists in the oldParent.dialogueNodes array after filtering.
        const nodeExistsAfter = oldParent.dialogueNodes.some(node => node.dialogueID === dialogueNode.dialogueID);

        // 4. Log the result based on these checks.
        if (nodeExistsBefore && !nodeExistsAfter) {
            console.log('Operation was successful. Node with dialogueID:', dialogueNode.dialogueID, 'was removed.');
        } else if (nodeExistsBefore && nodeExistsAfter) {
            console.log('Operation failed. Node with dialogueID:', dialogueNode.dialogueID, 'still exists.');
        } else {
            console.log('Node with dialogueID:', dialogueNode.dialogueID, 'did not exist in the first place.');
        }

        // Assign a new ID to the node and save the mapping from the old ID to the new ID
        let oldId = dialogueNode.dialogueID;
        let newId = nextId++;
        oldToNewIds[oldId] = newId;

        // Push the node to the tempArray
        tempArray.push(dialogueNode);
        console.log(`Inside reparent function, temparray holds all the nodes to be mover from oldparent: ${oldParent.characterID} to newparent:  ${newParent.characterID}`);
        console.log('temparray', tempArray );
    }

    // Now, go through the nodes again and update their IDs and their outgoing lines
    for (let dialogueNode of tempArray) {
        // Update the node's ID
        dialogueNode.dialogueID = oldToNewIds[dialogueNode.dialogueID];

        

        // Update the node's outgoing lines
        for (let line of dialogueNode.outgoingLines) {
            console.log('should work on lines now if oldToNewIds.hasOwnProperty(line.fromNode):', oldToNewIds.hasOwnProperty(line.fromNode));
            if (oldToNewIds.hasOwnProperty(line.fromNode)) {
                console.log('old line fromNode is ', line.fromNode);
                line.fromNode = oldToNewIds[line.fromNode];
                console.log('new line fromNode is ', line.fromNode);
            }
            if (oldToNewIds.hasOwnProperty(line.toNode)) {
                console.log('old line toNode is ', line.toNode);
                line.toNode = oldToNewIds[line.toNode];
                console.log('new line toNode is ', line.toNode);
            }
        }
    }

    console.log('the numbers of the nodes in the temparray should have been changed now and temparray looks like this ', tempArray);
    console.log('before concat: oldParent.dialogueNodes ', oldParent.dialogueNodes);
    console.log('before concat: newParent.dialogueNodes ', newParent.dialogueNodes);
    

    // Finally, append the nodes to the new parent's dialogueNodes
    // 1. Get the initial length of newParent.dialogueNodes.
    const initialLength = newParent.dialogueNodes.length;

    // 2. Perform the concatenation operation.
    newParent.dialogueNodes = newParent.dialogueNodes.concat(tempArray);

    // 3. Compare the final length with the sum of the initial length and tempArray length.
    const expectedLength = initialLength + tempArray.length;

    // 4. Log the result based on this comparison.
    if (newParent.dialogueNodes.length === expectedLength) {
        console.log('Operation was successful. Nodes from tempArray were added to newParent.dialogueNodes.');
    } else {
        console.log('Operation failed. The final count of nodes in newParent.dialogueNodes does not match the expected count.');
    }

    
    console.log('after concat: oldParent.dialogueNodes ', oldParent.dialogueNodes);
    console.log('after concat: newParent.dialogueNodes ', newParent.dialogueNodes);
}





/* GET ALL LINES OF A NODE RECURSIVELY DOWNSTREAM FOR UPDATING THE LINES LATER */

// Helper function to recursively get lines
function getLinesRecursively(dialogueNodes, fromNode) {
    // Find the node that starts from the current node
    const startingNode = dialogueNodes.find((node) => node.dialogueID == fromNode);
    if (!startingNode) {
        return [];
    }

    // Get all lines connected to this node
    let lines = startingNode.outgoingLines;

    // Loop through all lines, and recursively collect lines
    startingNode.outgoingLines.forEach((line) => {
        lines = lines.concat(getLinesRecursively(dialogueNodes, line.toNode));
    });

    return lines;
}

function getAllConnectedLines(characterID, fromDialogueID) {
    // Find the character
    const character = gameDialogueMakerProject.characters.find((character) => character.characterID == characterID);
    if (!character) {
        console.error('Character not found');
        return;
    }

    console.log('fromDialogueID was ', fromDialogueID);

    // If fromDialogueID is undefined, then we're starting from the character root
    if (fromDialogueID === undefined) {
        let lines = character.outgoingLines;
        console.log('fromDialogueID was ', fromDialogueID);

        // For each outgoing line from the character root, get all connected lines downstream
        character.outgoingLines.forEach((line) => {
            lines = lines.concat(getLinesRecursively(character.dialogueNodes, line.toNode));
        });

        return lines;
    } else {
        // Otherwise, start from the specified dialogue node
        let lines = [];

        // Check the outgoing lines of the character
        character.outgoingLines.forEach(line => {
            if (line.toNode == fromDialogueID) {
                lines.push(line);
            }
        });

        // Make sure character.dialogueNodes is defined and is an array
        if (character.dialogueNodes && Array.isArray(character.dialogueNodes)) {
            // Find the incoming line to this node
            character.dialogueNodes.forEach(node => {
                node.outgoingLines.forEach(line => {
                    if (line.toNode == fromDialogueID) {
                        lines.push(line);
                    }
                })
            });
        } else {
            console.error('character.dialogueNodes is not defined or not an array');
            // handle the error case here...
            // return, throw an error, or continue with an empty lines array, as appropriate
        }

        // Add all connected lines downstream
        lines = lines.concat(getLinesRecursively(character.dialogueNodes, fromDialogueID));

        return lines;
    }
}




