/* This function will recursively loop through the entire project object and write it to the page as nodes */
function drawDialogueMakerProject() {
    
    // 1. Setup the SVG connection layer
    setupSVGLayer();

    let wrapper = $('<div class="wrapper"></div>');

    gameDialogueMakerProject.characters.forEach((character) => {
        let characterElem = createCharacterNodeHTML(character);
        wrapper.append(characterElem);

        // Helper to find parent-child relationships
        let dialogueNodeMap = character.dialogueNodes.reduce((map, node) => {
            map[node.dialogueID] = node;
            return map;
        }, {});

        let childrenMap = {};
        let childNodeIds = new Set();

        character.dialogueNodes.forEach((dialogueNode) => {
            dialogueNode.outgoingLines.forEach((outgoingLine) => {
                let targetNode = dialogueNodeMap[outgoingLine.toNode];
                if (targetNode) {
                    if (!childrenMap[dialogueNode.dialogueID]) childrenMap[dialogueNode.dialogueID] = [];
                    childrenMap[dialogueNode.dialogueID].push(targetNode);
                    childNodeIds.add(targetNode.dialogueID);
                }
            });
        });

        // Add nodes to the DOM
        character.dialogueNodes.forEach((dialogueNode) => {
            if (!childNodeIds.has(dialogueNode.dialogueID)) {
                let dialogueElem = createDialogueHTMLElement(dialogueNode);
                $(dialogueElem).css({ top: dialogueNode.dialogueNodeY + "px", left: dialogueNode.dialogueNodeX + "px" });
                
                // CRITICAL: Ensure the element has a way to be found by ID
                $(dialogueElem).attr('id', 'node' + dialogueNode.dialogueID);
                $(dialogueElem).attr('data-dialogue-id', dialogueNode.dialogueID);
                $(dialogueElem).attr('data-character-id', character.characterID);

                $(characterElem).append(dialogueElem);
                appendChildren(dialogueElem, dialogueNode, childrenMap, character.characterID);
            }
        });

        function appendChildren(element, node, childrenMap, charID) {
            (childrenMap[node.dialogueID] || []).forEach((childNode) => {
                let childElem = createDialogueHTMLElement(childNode);
                $(childElem).css({ top: childNode.dialogueNodeY + "px", left: childNode.dialogueNodeX + "px" });
                
                // CRITICAL: Ensure the element has a way to be found by ID
                $(childElem).attr('id', 'node' + childNode.dialogueID);
                $(childElem).attr('data-dialogue-id', childNode.dialogueID);
                $(childElem).attr('data-character-id', charID);

                $(element).append(childElem);
                appendChildren(childElem, childNode, childrenMap, charID);
            });
        }
    });

    // 2. Clear previous content and append new nodes
    $('#mainArea').find('.wrapper').remove();
    $('#mainArea').append(wrapper);

    // 3. Initialize Draggables
    $('.characterRoot').draggable(draggableSettings).css({ position: "absolute" });
    // Note: ensure createDialogueHTMLElement adds the 'dialogue' or 'blockWrap' class
    $('.dialogue, .blockWrap').draggable(draggableSettings).css({ position: "absolute" });

    applyHideToElements();

    $('.dialogueTextArea').each(function () {
        autoGrowTextArea(this);
    });

    // 4. Draw lines after a short delay to ensure DOM is ready
    setTimeout(() => {
        updateAllLines();
    }, 10);

    $(".blockPlusButton").each(function () {
        checkIfPlusButtonShouldBeTurnedOff(this);
    });

    $(".topConnectionSocket").off('mousedown').on('mousedown', function (event) {
        handleMouseDownOverTopConnectionSocket(event, this);
    });
}

function setupSVGLayer() {
    // If it exists, we remove it to force a refresh of the marker definitions
    $('#connectionLayer').remove(); 

    const svgHTML = `
    <svg id="connectionLayer" style="position:absolute; top:0; left:0; width:10000px; height:10000px; pointer-events:none; overflow:visible; z-index:0;">
        <defs>
            <marker id="dot" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <circle cx="5" cy="5" r="3" fill="#0075ff" />
            </marker>
        </defs>
        <g id="svgLineGroup"></g>
    </svg>`;
    $('#mainArea').prepend(svgHTML);
}

function updateAllLines() {
    const lineGroup = document.getElementById('svgLineGroup');
    const canvas = document.getElementById('mainArea');
    if (!lineGroup || !canvas || !gameDialogueMakerProject) return;

    const zoom = getGlobalZoom();
    const canvasRect = canvas.getBoundingClientRect();
    let lineCount = 0;

    lineGroup.innerHTML = ''; // Clear lines

    gameDialogueMakerProject.characters.forEach(character => {
        const charElem = document.getElementById(`char${character.characterID}`);

        // 1. Root Lines
        if (charElem && character.outgoingLines) {
            character.outgoingLines.forEach(line => {
                const target = findNodeInDOM(line.toNode);
                if (target) {
                    drawSVGPath(charElem, target, canvasRect, zoom, false);
                    lineCount++;
                }
            });
        }

        // 2. Node Lines
        character.dialogueNodes.forEach(node => {
            const nodeElem = findNodeInDOM(node.dialogueID);
            if (!nodeElem) return;

            node.outgoingLines.forEach(line => {
                const target = findNodeInDOM(line.toNode);
                if (target) {
                    drawSVGPath(nodeElem, target, canvasRect, zoom, false);
                    lineCount++;
                }
            });

            if (node.nextNode > 0) {
                const target = findNodeInDOM(node.nextNode);
                if (target) {
                    drawSVGPath(nodeElem, target, canvasRect, zoom, true);
                    lineCount++;
                }
            }
        });
    });
    console.log(`SVG Line System: Drew ${lineCount} lines.`);
}

/**
 * Robust node finder: looks for ID, then data-attribute
 */
function findNodeInDOM(nodeID) {
    return document.getElementById(`node${nodeID}`) || 
           document.querySelector(`[data-dialogue-id="${nodeID}"]`);
}

function drawSVGPath(startNode, endNode, canvasRect, zoom, isDotted, socketIndex) {
    const lineGroup = document.getElementById('svgLineGroup');
    
    // Select ALL plus buttons and pick the one at socketIndex
    const allSockets = startNode.querySelectorAll('.blockPlusButton');
    const socket = allSockets[socketIndex] || allSockets[0] || startNode;
    
    const targetSocket = endNode.querySelector('.topConnectionSocket') || endNode;

    const sRect = socket.getBoundingClientRect();
    const eRect = targetSocket.getBoundingClientRect();

    const startX = (sRect.left + sRect.width / 2 - canvasRect.left) / zoom;
    const startY = (sRect.top + sRect.height / 2 - canvasRect.top) / zoom;
    const endX = (eRect.left + eRect.width / 2 - canvasRect.left) / zoom;
    const endY = (eRect.top + eRect.height / 2 - canvasRect.top) / zoom;

    const cpY = startY + (endY - startY) * 0.5;
    const pathData = `M ${startX} ${startY} C ${startX} ${cpY}, ${endX} ${cpY}, ${endX} ${endY}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", isDotted ? "#999" : "#0075ff");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    
    // Use the 'dot' marker
    path.setAttribute("marker-end", "url(#dot)"); 
    
    if (isDotted) path.setAttribute("stroke-dasharray", "8,5");

    lineGroup.appendChild(path);
}

function getGlobalZoom() {
    let zoomValue = $('body').css('zoom');
    if (!zoomValue || zoomValue === "normal") return 1;
    if (zoomValue.includes('%')) return parseFloat(zoomValue) / 100;
    return parseFloat(zoomValue) || 1;
}

const draggableSettings = {
    start: function(event, ui) {
        $(this).data("dragZoom", getGlobalZoom());
    },
    drag: function (event, ui) {
        const zoom = $(this).data("dragZoom");
        let changeLeft = (ui.position.left - ui.originalPosition.left) / zoom;
        let changeTop = (ui.position.top - ui.originalPosition.top) / zoom;
        
        ui.position.left = ui.originalPosition.left + changeLeft;
        ui.position.top = ui.originalPosition.top + changeTop;

        updateAllLines(); 
        $('.conditionCircle').hide();
    },
    stop: function (event, ui) {
        updateElementPositionInObject($(this));
        $(".conditionCircle").show();
        updateAllLines();
    },
}

function updateLines(domNode) {
    updateAllLines();
}


function createCharacterNodeHTML(character){

  let eyeImageSource;
  //closed or open eye:
  if (!('hideChildren' in character)) { //in case the property is missing
    character.hideChildren = false;
  }
  if (character.hideChildren == false) {

    eyeImageSource = 'img/iconmonstr-eye-filled-32.png'

  } else {

    eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png'

  }

  let acceptclicksValue = false;

  //check for acceptclicks (note that there is also a function for this but it might be more efficient to do it here)

  if (character.outgoingLines.length < 1){

    acceptclicksValue = true;

  }

  let characterNodeHTML = $(`
          <div class="blockWrap characterRoot" data-character-id="${character.characterID}" id="char${character.characterID}" data-hidechildren="${character.hideChildren}">
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
          
                </div>
                    <div class="block" style="background-color: ${character.bgColor}">
                        <div class="characterElementIDLine" style="text-align: left;">
                            <span style="width: 35%; display:inline-block; text-align: right;">Character ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${character.characterID}">
                                <img class="eyeImage characterNodeEye btnSmall" src="${eyeImageSource}" alt="eye" width="24" height="24">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name" value="${character.characterName}">
              
                    </div>
                    <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                        <div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=${acceptclicksValue}>+</div>
                    </div>
            </div>
          </div>

        `);

  characterNodeHTML.css({
    left: character.characterNodeX,
    top: character.characterNodeY,
  });

  character.nodeElement = characterNodeHTML;

  return characterNodeHTML;

}/*End createCharacterNodeHTML  */


/* DRAWING THE LINES */

function drawLines(sourceId, targetId, isCharacter, outgoingLine, characterId) {
  
  let sourceElement, targetElement, plusButtonElem;

 
  

  if (isCharacter) {
    // Select the source element based on characterId and sourceId
    sourceElement = $(`.characterRoot[data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
    sourceId = 0; //the source node can be called 0 for characters
    //console.log('we got a character, plusButtonElem is: ', plusButtonElem);
  } else {
    // Select the source element based on characterId and sourceId
    sourceElement = $(`.blockWrap[data-dialogue-id="${sourceId}"][data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
  }

  

  // Select the target element based on characterId and targetId
  targetElement = $(`.blockWrap[data-dialogue-id="${targetId}"][data-character-id="${characterId}"]`);



  // Find the character based on the characterId
  let character = gameDialogueMakerProject.characters.find(
    (char) => char.characterID == characterId
  );

  if (character) {
    // Check if the target node belongs to the current character
    let targetNode = character.dialogueNodes.find(
      (dialogueNode) => dialogueNode.dialogueID == targetId
    );

    // If the target node does not belong to the current character, find the character that owns it
    if (!targetNode) {
      let targetCharacter = gameDialogueMakerProject.characters.find((char) =>
        char.dialogueNodes.some((node) => node.dialogueID == targetId)
      );
      if (targetCharacter) {
        // Change the character and find the node in the correct character
        character = targetCharacter;
        targetNode = targetCharacter.dialogueNodes.find(
          (dialogueNode) => dialogueNode.dialogueID == targetId
        );
      }
    }

    if (targetNode) {
      // Reference the stored DOM element
      let lineEndNodeElement = targetNode.nodeElement;

      // Get the top socket
      let lineEndElementTopSocket = $(lineEndNodeElement).find(".topConnectionSocket").eq(0);

      // Set the socket to contain a line
      $(lineEndElementTopSocket).attr('data-hasline', 'true');

      //console.log('lineEndElementTopSocket', lineEndElementTopSocket);
      //console.log('plusButtonElem.get(0)', plusButtonElem.get(0));

      // Create a new point anchor
      var endPointAnchor = LeaderLine.pointAnchor(
        lineEndElementTopSocket.get(0),
        { x: 8, y: 8 }
      );

      let theLine = new LeaderLine(
        plusButtonElem.get(0),
        endPointAnchor,
        {
          color: "#0075ff",
          size: 4,
          dash: false,
          path: "straight",
          startSocket: "bottom",
          endSocket: "bottom",
          endPlug: "disc",
        }
      );

      LeaderLine.positionByWindowResize = false; //this seems to be a global setting that will stop the disconnected element was passed error because leaderLine wont try to update lines anymore


      leaderLines.push(theLine);

      // Stores a reference to the actual line into the object
      outgoingLine.lineElem = theLine;

      // Set the id also of the svg for easier selection
      const all_svgs = document.querySelectorAll("svg");
      const this_svg = all_svgs[all_svgs.length - 1]; //this will select the latest svg
      this_svg.setAttribute("data-character", characterId);
      this_svg.setAttribute("data-fromnode", sourceId);
      this_svg.setAttribute("data-tonode", targetId);
      $(this_svg).addClass('blueline'); //for separating between dotted lines

   

      let selectTheSVGInDOM = $(
        'svg[data-fromnode="' +
        sourceId +
        '"][data-tonode="' +
        targetId +
        '"][data-character="' +
        characterId +
        '"]'
      );

      let thePath = $(selectTheSVGInDOM).find(".leader-line-line-path");

      const midpoint = drawConditionCircle(
        thePath.get(0),
        characterId,
        sourceId,
        targetId
      );

      // Loop through the transition conditions of the current outgoing line and add a 'withCondition' class to the corresponding circles
      for (let l = 0; l < outgoingLine.transitionConditions.length; l++) {
        let transitionCondition = outgoingLine.transitionConditions[l];

        // Select the matching circle from DOM
        let theCircleinDOM = $(
          '.conditionCircle[data-fromnode="' +
          sourceId +
          '"][data-tonode="' +
          targetId +
          '"][data-character="' +
          characterId +
          '"]'
        );

        theCircleinDOM.addClass("withCondition");
        theCircleinDOM.attr(
          "title",
          "Click to change the condition for the transition"
        );
      }

      return theLine;
    }
  }
}


 /* end drawLines */


function applyHideToElements() {
  // Select all elements with data-hidechildren="true"
  let elementsToHide = $('[data-hidechildren="true"]');

  // Loop through each element and find its descendants with class .blockWrap and hide them
  elementsToHide.each((index, element) => {
    let descendantsToHide = $(element).find('.blockWrap');
    descendantsToHide.addClass('hide');
  });
}

function handleMouseDownOverTopConnectionSocket(event, myThis) {
  console.log('going to ask for mousedownOverTopConnectionSocket using myThis: ', myThis );
  currentlyDrawnLineInfo = mousedownOverTopConnectionSocket(event, myThis); //globalvar
  console.log('mousedownOverTopConnectionSocket call should be over now and it returned: ', currentlyDrawnLineInfo);

  // Check if currentlyDrawnLineInfo is defined and not null
  if (currentlyDrawnLineInfo) {
    console.log('lineInfo', currentlyDrawnLineInfo);

    // Check if properties exist on currentlyDrawnLineInfo before trying to access them
    if ('line' in currentlyDrawnLineInfo) {
      line = currentlyDrawnLineInfo.line;
    } else {
      console.log('Property "line" does not exist on currentlyDrawnLineInfo');
    }

    if ('lineCharacterId' in currentlyDrawnLineInfo) {
      lineCharacterId = currentlyDrawnLineInfo.lineCharacterId; //lineCharacterId is defined in globalVars
    } else {
      console.log('Property "lineCharacterId" does not exist on currentlyDrawnLineInfo');
    }

    if ('lineFromNodeId' in currentlyDrawnLineInfo) {
      lineFromNodeId = currentlyDrawnLineInfo.lineFromNodeId;
    } else {
      console.log('Property "lineFromNodeId" does not exist on currentlyDrawnLineInfo');
    }

    if ('lineToNodeId' in currentlyDrawnLineInfo) {
      lineToNodeId = currentlyDrawnLineInfo.lineToNodeId;
    } else {
      console.log('Property "lineToNodeId" does not exist on currentlyDrawnLineInfo');
    }
  } else {
    console.log('currentlyDrawnLineInfo is undefined or null');
  }
};


function handleDocumentMouseUp(event, myThis){
  //console.log('handleDocumentMouseUp from inside drawDialogueMakerProject', event );
  //console.log('currentlyDrawingALine is: ', currentlyDrawingALine);
  if (currentlyDrawingALine) {
    // Get the element under the cursor
    
    var elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);

    // Get the jQuery object for the element under the cursor
    var $elementUnderCursor = $(elementUnderCursor);

   //delete is handled in mouseDownOverTopConnectionSocket EDIT: that doesnt seem to be firing in all situations

    // Check if the element is a plus button and if its data-acceptclicks attribute is true
    if (
      $elementUnderCursor.hasClass("blockPlusButton") &&
      $elementUnderCursor.data("acceptclicks") == true &&
      currentlyDrawingALine == true
    ) {
      // The line is over the target div and the div accepts clicks, do stuff
      //console.log("Line is over the target div and it accepts clicks");

      //now we should update the master object structure accordingly and then redraw
      //start by detecting to which node the plus buttons belongs to
      //let blockToAttachTo = $($elementUnderCursor).closest('.block');

      console.log('CONNECT!');

      let plusButtonIndexToAttachTo = $elementUnderCursor.data("buttonindex");

      let nodeInfoForFromNode = getInfoByPassingInDialogueNodeOrElement($elementUnderCursor);

      console.log('nodeInfoForFromNode ', nodeInfoForFromNode);
    
      console.log('currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId );

      //check if it is a character:

      if (nodeInfoForFromNode.isCharacter){

        if (nodeInfoForFromNode.characterID == currentlyDrawnLineInfo.lineCharacterId) {
          //no change in parent NOTE: this seems to only think a change in parent is a change between characters.. which it is in the sense that only then do we need to renumber nodes

          nodeInfoForFromNode.characterNode.outgoingLines.push({
            fromNode: 0,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: nodeIdFromWhichWeAreDrawing,
            lineElem: "",
            transitionConditions: [],
          });

        
          

        } else {
          //still handling character
          //change in parent

          console.log('Change in parent, currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);

          let highestIdInNewParent = getMaxDialogueNodeId(gameDialogueMakerProject.characters[nodeInfo.characterID - 1]);
          //console.log(`highestIdInNewParent was: ${highestIdInNewParent}`);

          console.log('calling reparent function with these arguments: ');
          console.log('objectNodeFromWhichWeAreDrawing ', objectNodeFromWhichWeAreDrawing);
          console.log('currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);
          console.log('nodeInfo.characterID ', nodeInfoForFromNode.characterID);
          console.log('highestIdInNewParent + 1 ', highestIdInNewParent + 1);
          console.log('gameDialogueMakerProject ', gameDialogueMakerProject);

          reparentNodeAndDescendants(objectNodeFromWhichWeAreDrawing, currentlyDrawnLineInfo.lineCharacterId, nodeInfoForFromNode.characterID, highestIdInNewParent + 1, gameDialogueMakerProject);

          nodeInfoForFromNode.characterNode.outgoingLines.push({
            fromNode: 0,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: objectNodeFromWhichWeAreDrawing.dialogueID,
            lineElem: "",
            transitionConditions: [],
          });



        } //end else (change in parent)

      } else {//end is character
        //not a character


        //we need to check if the root character changes and if it does then we need to remove the dialogue object from the old character in the object and add it to the new one

        console.log('nodeInfo.dialogueNode ', nodeInfoForFromNode.dialogueNode);

        if (nodeInfoForFromNode.characterID == currentlyDrawnLineInfo.lineCharacterId) {
          //no change in parent
          nodeInfoForFromNode.dialogueNode.outgoingLines.push({
            fromNode: nodeInfoForFromNode.dialogueNode.dialogueID,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: nodeIdFromWhichWeAreDrawing,
            lineElem: "",
            transitionConditions: [],
          });

          //reset x and y
          objectNodeFromWhichWeAreDrawing.dialogueNodeX = 0;
          objectNodeFromWhichWeAreDrawing.dialogueNodeY = 250;

        } else {
          //regular dialogueNode
          //change in parent

          //reset y
          objectNodeFromWhichWeAreDrawing.dialogueNodeX = 0;
          objectNodeFromWhichWeAreDrawing.dialogueNodeY = 250;

          console.log('Change in parent, old character was currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);
          console.log('new character is nodeInfo.characterID ', nodeInfoForFromNode.characterID);

          let highestIdInNewParent = getMaxDialogueNodeId(gameDialogueMakerProject.characters[nodeInfoForFromNode.characterID - 1]);
          //console.log(`highestIdInNewParent was: ${highestIdInNewParent}`);

          console.log('calling reparent function with these arguments: ');
          console.log('objectNodeFromWhichWeAreDrawing ', objectNodeFromWhichWeAreDrawing);
          console.log('currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);
          console.log('nodeInfoForFromNode.characterID ', nodeInfoForFromNode.characterID);
          console.log('highestIdInNewParent + 1: ', highestIdInNewParent + 1);
          console.log('gameDialogueMakerProject ', gameDialogueMakerProject);
          console.log('calling reparent node and descendants');

          reparentNodeAndDescendants(objectNodeFromWhichWeAreDrawing, currentlyDrawnLineInfo.lineCharacterId, nodeInfoForFromNode.characterID, highestIdInNewParent + 1, gameDialogueMakerProject);

          nodeInfoForFromNode.dialogueNode.outgoingLines.push({
            fromNode: nodeInfoForFromNode.dialogueNode.dialogueID,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: objectNodeFromWhichWeAreDrawing.dialogueID,
            lineElem: "",
            transitionConditions: [],
          });



        } //end else (change in parent)
      }

    }//end if (line)

    // Stop updating the line
    line = null;

    currentlyDrawingALine = false;

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();
  }

};

function autoGrowTextArea(element) {
  element.style.height = "5px"; // Temporarily shrink to measure the real needed size
  element.style.height = (element.scrollHeight) + "px";
}

/* for logging all dom elements to console on a specific moment. pass in document.body */
function logAllElements(element) {
  console.log(element);
  for (let i = 0; i < element.children.length; i++) {
    logAllElements(element.children[i]);
  }
}