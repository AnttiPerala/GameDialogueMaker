// drawDialogueMakerProject.js

/* This function will recursively loop through the entire project object and write it to the page as nodes */
function drawDialogueMakerProject() {

  //store the previously create node after every node creation so right parents can be appended to. Don't change this for answer nodes, because they should all go inside the same parent (the question node)
  let latestNode = "";
  //store every node, including answers in this one for line appending:

  let wrapper = $('<div class="wrapper"></div>');

  gameDialogueMakerProject.characters.forEach((character) => {
    let characterElem = createCharacterNodeHTML(character);
    wrapper.append(characterElem);

    // Create a map of dialogue nodes for easy lookup
    let dialogueNodeMap = character.dialogueNodes.reduce((map, node) => {
      map[node.dialogueID] = node;
      return map;
    }, {});

    // Create a separate map to manage the children without modifying the original object
    let childrenMap = {};

    // Initialize a Set to store dialogue nodes that are referenced by any outgoingLines
    let childNodeIds = new Set();

    // Build the parent-child relationships and populate the Set of child node ids
    character.dialogueNodes.forEach((dialogueNode) => {
      (dialogueNode.outgoingLines || []).forEach((outgoingLine) => {
        let targetNode = dialogueNodeMap[outgoingLine.toNode];
        if (targetNode) {
          if (!childrenMap[dialogueNode.dialogueID]) {
            childrenMap[dialogueNode.dialogueID] = [];
          }
          childrenMap[dialogueNode.dialogueID].push(targetNode);
          childNodeIds.add(targetNode.dialogueID); // stores all the dialogue node ids that are children of other dialogue nodes
        }
      });
    });

    // Character absolute ("world") coords from data
    const charAbsX = Number(character.characterNodeX) || 0;
    const charAbsY = Number(character.characterNodeY) || 0;

    // Append to the character element only the dialogue nodes that are not in the Set of child node ids
    character.dialogueNodes.forEach((dialogueNode) => {
      if (!childNodeIds.has(dialogueNode.dialogueID)) {
        let dialogueElem = createDialogueHTMLElement(dialogueNode);

        // Node absolute ("world") coords from data
        const nodeAbsX = Number(dialogueNode.dialogueNodeX) || 0;
        const nodeAbsY = Number(dialogueNode.dialogueNodeY) || 0;

        // ✅ ROOT nodes are appended inside characterElem,
        // so their CSS left/top must be RELATIVE to the character element.
        $(dialogueElem).css({
          position: "absolute",
          left: (nodeAbsX - charAbsX) + "px",
          top: (nodeAbsY - charAbsY) + "px"
        });

        $(characterElem).append(dialogueElem);

        // recurse with absolute coords
        appendChildren(dialogueElem, dialogueNode, childrenMap, nodeAbsX, nodeAbsY);
      }
    });

    function appendChildren(parentElem, parentNode, childrenMap, parentAbsX, parentAbsY) {
      (childrenMap[parentNode.dialogueID] || []).forEach((childNode) => {
        let childElem = createDialogueHTMLElement(childNode);

        const childAbsX = Number(childNode.dialogueNodeX) || 0;
        const childAbsY = Number(childNode.dialogueNodeY) || 0;

        // ✅ CHILD nodes are appended inside parentElem,
        // so their CSS left/top must be RELATIVE to the parent dialogue element.
        $(childElem).css({
          position: "absolute",
          left: (childAbsX - parentAbsX) + "px",
          top: (childAbsY - parentAbsY) + "px"
        });

        $(parentElem).append(childElem);

        appendChildren(childElem, childNode, childrenMap, childAbsX, childAbsY);
      });
    }
  });

  console.log('wrapper is ', wrapper);

  const main = $("#mainArea");

  // detach the SVG overlay if it exists (keeps event listeners + state)
  const svgOverlay = main.children("#connectionsSvg").detach();

  // clear everything else
  main.empty();

  // put SVG back first, then your wrapper
  if (svgOverlay.length) main.append(svgOverlay);
  main.append(wrapper);

  SVGConnections.init({ worldId: "mainArea" }); // idempotent: recreates SVG if missing

  $('.characterRoot').draggable(draggableSettings).css({ position: "absolute" });
  $('.dialogue').draggable(draggableSettings).css({ position: "absolute" });

  applyHideToElements();

  $('.dialogueTextArea').each(function () {
    autoGrowTextArea(this);
  });

  /* A SECOND ITERATION FOR DRAWING THE LINES IS NEEDED, BECAUSE THEY DIALOGUES NEED TO ALREADY BE IN THE DOM WHEN THE LINES ARE CREATED */

  const allConnections = [];

  gameDialogueMakerProject.characters.forEach((character) => {
    if (character.hideChildren !== true) {
      drawOutgoingLines(character, true, character.characterID);
      character.dialogueNodes.forEach((dialogueNode) => {
        drawOutgoingLines(dialogueNode, false, character.characterID);
      });
    }
  });

  // ✅ keep for drag-end rebuilds
  window.__gdmAllConnections = allConnections;

  // ✅ AFTER ALL LOOPS ARE DONE
  SVGConnections.render(allConnections);

  // Wait until SVGConnections has updated path "d" attributes (next frame)
  requestAnimationFrame(() => {
    SVGConnections.requestUpdate();
    requestAnimationFrame(() => {
      rebuildConditionCirclesFromSvgConnections(allConnections);
    });
  });

  function drawOutgoingLines(node, isCharacter, characterId) {
    // Normal outgoingLines
    (node.outgoingLines || []).forEach((outgoingLine) => {
      const c = drawLines(
        (node.dialogueID || node.characterID),
        outgoingLine.toNode,
        isCharacter,
        outgoingLine,
        characterId
      );
      if (c) allConnections.push(c);
    });

    // ✅ NEXT dotted link (SVG) – dialogue nodes only
    if (!isCharacter) {
      const nextNodeValue = Number(node.nextNode);
      if (Number.isFinite(nextNodeValue) && nextNodeValue > 0) {
        const fromNodeId = Number(node.dialogueID);

        allConnections.push({
          id: `next_${Number(characterId)}_${fromNodeId}__${Number(characterId)}_${nextNodeValue}`,
          type: "next",
          from: {
            characterId: Number(characterId),
            dialogueId: fromNodeId,
            port: "next"
          },
          to: {
            characterId: Number(characterId),
            dialogueId: Number(nextNodeValue)
          }
        });
      }
    }
  }

  $(".blockPlusButton").each(function () {
    checkIfPlusButtonShouldBeTurnedOff(this);
  });

  // DRAGGING ON TOP OF A TOP CONNECTION SOCKET. IF IT'S EMPTY, CREATE A NEW LINE FROM IT. IF IT HAS A LINE, DELETE THE LINE.

  $(".topConnectionSocket").mousedown(function (event) {
    if (window.__svgEdgeDragging) return;
    handleMouseDownOverTopConnectionSocket(event, this);
  });

  $(document).mousemove(function (e) {
    if (window.__svgEdgeDragging) return;

    if (currentlyDrawingALine) {
      line.setOptions({
        end: LeaderLine.pointAnchor({ x: e.pageX, y: e.pageY }),
      });
    }
  });

  $(document).mouseup(function (event) {
    if (window.__svgEdgeDragging) return;
    handleDocumentMouseUp(event, this);
  });

} // end function drawDialogueMakerProject


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Our app supports zooming by setting CSS `zoom` on <body>.
// jQuery-UI draggable doesn't account for that, which can cause elements to
// "jump" (often too far up/left) as soon as you start dragging.
// We fix it by dividing draggable's computed positions by the current zoom.
function getBodyZoomFactor() {
  const zRaw = window.getComputedStyle(document.body).zoom;
  let z = 1;
  if (zRaw) {
    z = String(zRaw).includes('%') ? (parseFloat(zRaw) / 100) : parseFloat(zRaw);
  }
  if (!isFinite(z) || z <= 0) z = 1;
  return z;
}


/* DRAGGABLE SETTINGS */
const draggableSettings = {
  // ✅ don't start dragging when interacting with controls
  cancel: "input, textarea, select, option, button, .blockPlusButton, .eyeImage, .topConnectionSocket, .conditionCircle",

  // optional: require a small movement before drag starts (reduces accidental drags)
  distance: 3,

  start: function (event, ui) {
    // compensate for body zoom to prevent the initial "jump"
    const z = getBodyZoomFactor();
    ui.position.left /= z;
    ui.position.top /= z;

    // ✅ also compensate originalPosition to prevent "snap" on drag end
    if (ui.originalPosition) {
      ui.originalPosition.left /= z;
      ui.originalPosition.top /= z;
    }
  },

  drag: function (event, ui) {
    // keep compensation during drag as the mouse moves
    const z = getBodyZoomFactor();
    ui.position.left /= z;
    ui.position.top /= z;

    if (window.SVGConnections) SVGConnections.requestUpdate();
    $('.conditionCircle').hide();
  },

  stop: function (event, ui) {
    // save new position to master object
    updateElementPositionInObject(ui.helper);

    // ✅ don't show stale circles; rebuild after SVG updated to new geometry
    $(".conditionCircle").hide();

    requestAnimationFrame(() => {
      if (window.SVGConnections) SVGConnections.requestUpdate();

      requestAnimationFrame(() => {
        rebuildConditionCirclesFromSvgConnections(window.__gdmAllConnections || []);
        $(".conditionCircle").show();
      });
    });
  },
};


function createCharacterNodeHTML(character) {

  let eyeImageSource;
  //closed or open eye:
  if (!('hideChildren' in character)) { //in case the property is missing
    character.hideChildren = false;
  }
  if (character.hideChildren == false) {
    eyeImageSource = 'img/iconmonstr-eye-filled-32.png';
  } else {
    eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png';
  }

  let acceptclicksValue = false;

  //check for acceptclicks (note that there is also a function for this but it might be more efficient to do it here)
  if ((character.outgoingLines || []).length < 1) {
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
    position: "absolute",
    left: character.characterNodeX,
    top: character.characterNodeY,
  });

  character.nodeElement = characterNodeHTML;

  return characterNodeHTML;

}/*End createCharacterNodeHTML  */


/* DRAWING THE LINES (SVG version: returns a connection descriptor) */
function drawLines(sourceId, targetId, isCharacter, outgoingLine, characterId) {

  let sourceElement, plusButtonElem;

  // --- Resolve FROM element (plus button) ---
  if (isCharacter) {
    sourceElement = $(`.characterRoot[data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
    sourceId = 0; // character root is treated as node 0
  } else {
    sourceElement = $(`.blockWrap[data-dialogue-id="${sourceId}"][data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
  }

  // Guard: if we can't find the plus button, skip this connection
  if (!plusButtonElem || plusButtonElem.length === 0) {
    return null;
  }

  // --- Resolve TO node in master object (supports cross-character targets) ---
  let sourceCharacter = gameDialogueMakerProject.characters.find(
    (char) => char.characterID == characterId
  );

  if (!sourceCharacter) return null;

  // We'll find which character actually owns the target node
  let targetCharacter = sourceCharacter;
  let targetNode = targetCharacter.dialogueNodes.find(
    (dialogueNode) => dialogueNode.dialogueID == targetId
  );

  if (!targetNode) {
    // Find the character that owns targetId
    targetCharacter = gameDialogueMakerProject.characters.find((char) =>
      char.dialogueNodes.some((node) => node.dialogueID == targetId)
    );

    if (targetCharacter) {
      targetNode = targetCharacter.dialogueNodes.find(
        (dialogueNode) => dialogueNode.dialogueID == targetId
      );
    }
  }

  if (!targetNode) return null;

  // --- Mark target top socket as having a line (keeps your existing UI/state behavior) ---
  let lineEndNodeElement = targetNode.nodeElement;
  let lineEndElementTopSocket = $(lineEndNodeElement).find(".topConnectionSocket").eq(0);

  if (lineEndElementTopSocket && lineEndElementTopSocket.length) {
    $(lineEndElementTopSocket).attr("data-hasline", "true");
  }

  // --- Return connection descriptor for SVGConnections ---
  const normalizedSourceId = isCharacter ? 0 : sourceId;

  // Make ID stable + unique even for cross-character connections
  const fromChar = Number(characterId);
  const toChar = Number(targetCharacter.characterID);
  const fromNode = Number(normalizedSourceId);
  const toNode = Number(targetId);
  const fromSocket = Number(outgoingLine.fromSocket);

  const connId = `c_${fromChar}_${fromNode}_${fromSocket}__${toChar}_${toNode}`;

  return {
    id: connId,
    from: {
      characterId: fromChar,
      dialogueId: fromNode,       // 0 for character root, else dialogueID
      socketIndex: fromSocket,
      isCharacter: !!isCharacter, // optional, handy for later
    },
    to: {
      characterId: toChar,
      dialogueId: toNode,
    },

    // Keep references so you can map back later without re-searching
    _outgoingLineRef: outgoingLine,
    _fromPlusButtonEl: plusButtonElem.get(0),
    _toSocketEl: lineEndElementTopSocket?.get(0) || null,
  };
}

/* end drawLines */


function rebuildConditionCirclesFromSvgConnections(allConnections) {
  // remove old ones
  document.querySelectorAll('.conditionCircle').forEach(e => e.remove());

  for (const conn of allConnections) {
    if (!conn) continue;

    // Only real outgoing connections get condition circles (skip "next" dotted)
    if (conn.type === "next") continue;

    // Find the SVG path for this connection
    const path = document.querySelector(`#connectionsSvg g[data-conn-id="${conn.id}"] path.connection-path`)
      || document.querySelector(`#connectionsSvg g.conn[data-conn-id="${conn.id}"] path.connection-path`)
      || document.querySelector(`#connectionsSvg g[data-conn-id="${conn.id}"] path`)
      || document.querySelector(`#connectionsSvg g[data-connid="${conn.id}"] path`);

    if (!path) continue;

    // Match the old data attributes your condition system expects
    const characterId = conn.from.characterId;
    const fromNode = conn.from.dialogueId;    // 0 for character root
    const toNode = conn.to.dialogueId;

    drawConditionCircle(path, characterId, fromNode, toNode);

    // Apply withCondition if master object line has conditions
    const outgoing = conn._outgoingLineRef;
    if (outgoing && outgoing.transitionConditions && outgoing.transitionConditions.length > 0) {
      const circle = document.querySelector(
        `.conditionCircle[data-fromnode="${fromNode}"][data-tonode="${toNode}"][data-character="${characterId}"]`
      );
      if (circle) {
        circle.classList.add("withCondition");
        circle.setAttribute("title", "Click to change the condition for the transition");
      }
    }
  }
}


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
  console.log('going to ask for mousedownOverTopConnectionSocket using myThis: ', myThis);
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


function handleDocumentMouseUp(event, myThis) {
  if (currentlyDrawingALine) {
    // Get the element under the cursor
    var elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
    var $elementUnderCursor = $(elementUnderCursor);

    // Check if the element is a plus button and if its data-acceptclicks attribute is true
    if (
      $elementUnderCursor.hasClass("blockPlusButton") &&
      $elementUnderCursor.data("acceptclicks") == true &&
      currentlyDrawingALine == true
    ) {

      console.log('CONNECT!');

      let plusButtonIndexToAttachTo = $elementUnderCursor.data("buttonindex");
      let nodeInfoForFromNode = getInfoByPassingInDialogueNodeOrElement($elementUnderCursor);

      console.log('nodeInfoForFromNode ', nodeInfoForFromNode);
      console.log('currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);

      if (nodeInfoForFromNode.isCharacter) {

        if (nodeInfoForFromNode.characterID == currentlyDrawnLineInfo.lineCharacterId) {

          nodeInfoForFromNode.characterNode.outgoingLines.push({
            fromNode: 0,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: nodeIdFromWhichWeAreDrawing,
            lineElem: "",
            transitionConditions: [],
          });

        } else {

          console.log('Change in parent, currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);

          let highestIdInNewParent = getMaxDialogueNodeId(gameDialogueMakerProject.characters[nodeInfoForFromNode.characterID - 1]);

          console.log('calling reparent function with these arguments: ');
          console.log('objectNodeFromWhichWeAreDrawing ', objectNodeFromWhichWeAreDrawing);
          console.log('currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);
          console.log('nodeInfoForFromNode.characterID ', nodeInfoForFromNode.characterID);
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

        }

      } else {

        console.log('nodeInfoForFromNode.dialogueNode ', nodeInfoForFromNode.dialogueNode);

        if (nodeInfoForFromNode.characterID == currentlyDrawnLineInfo.lineCharacterId) {

          nodeInfoForFromNode.dialogueNode.outgoingLines.push({
            fromNode: nodeInfoForFromNode.dialogueNode.dialogueID,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: nodeIdFromWhichWeAreDrawing,
            lineElem: "",
            transitionConditions: [],
          });

          objectNodeFromWhichWeAreDrawing.dialogueNodeX = 0;
          objectNodeFromWhichWeAreDrawing.dialogueNodeY = 250;

        } else {

          objectNodeFromWhichWeAreDrawing.dialogueNodeX = 0;
          objectNodeFromWhichWeAreDrawing.dialogueNodeY = 250;

          console.log('Change in parent, old character was currentlyDrawnLineInfo.lineCharacterId ', currentlyDrawnLineInfo.lineCharacterId);
          console.log('new character is nodeInfoForFromNode.characterID ', nodeInfoForFromNode.characterID);

          let highestIdInNewParent = getMaxDialogueNodeId(gameDialogueMakerProject.characters[nodeInfoForFromNode.characterID - 1]);

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

        }
      }

    }

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
