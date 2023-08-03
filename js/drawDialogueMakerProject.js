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
      node.children = [];
      map[node.dialogueID] = node;
      return map;
    }, {});

    // Initialize a Set to store dialogue nodes that are referenced by any outgoingLines
    let childNodeIds = new Set();

    // Build the parent-child relationships and populate the Set of child node ids
    character.dialogueNodes.forEach((dialogueNode) => {
      dialogueNode.outgoingLines.forEach((outgoingLine) => {
        let targetNode = dialogueNodeMap[outgoingLine.toNode];
        if (targetNode) {
          dialogueNode.children.push(targetNode);
          childNodeIds.add(targetNode.dialogueID); // stores all the dialogue node ids that are children of other dialogue nodes
        }
      });
    });

    // Append to the character element only the dialogue nodes that are not in the Set of child node ids
    character.dialogueNodes.forEach((dialogueNode) => {
      if (!childNodeIds.has(dialogueNode.dialogueID)) {
        let dialogueElem = createDialogueHTMLElement(dialogueNode);
        dialogueElem.css({ top: dialogueNode.dialogueNodeY + "px", left: dialogueNode.dialogueNodeX + "px" }); // Setting position here
        characterElem.append(dialogueElem);
        appendChildren(dialogueElem, dialogueNode);
      }
    });

    function appendChildren(element, node) {
      node.children.forEach((childNode) => {
        let childElem = createDialogueHTMLElement(childNode);
        childElem.css({ top: childNode.dialogueNodeY + "px", left: childNode.dialogueNodeX + "px" }); // Setting position here
        element.append(childElem);
        appendChildren(childElem, childNode);
      });
    }



  });

  $('#mainArea').html(wrapper);

  $('.characterRoot').draggable(draggableSettings).css({ position: "absolute" });

  $('.dialogue').draggable(draggableSettings).css({ position: "absolute" });

  applyHideToElements();


/* A SECOND ITERATION FOR DRAWING THE LINES IS NEEDED, BECAUSE THEY DIALOGUES NEED TO ALREADY BE IN THE DOM WHEN THE LINES ARE CREATED */

  gameDialogueMakerProject.characters.forEach((character) => {
    if (character.hideChildren !== true) {
      drawOutgoingLines(character, true, character.characterID); // true because it's a character
      character.dialogueNodes.forEach((dialogueNode) => {
        drawOutgoingLines(dialogueNode, false, character.characterID); // false because it's a dialogueNode
      });
    }
  });

  function drawOutgoingLines(node, isCharacter, characterId) {
    node.outgoingLines.forEach((outgoingLine) => {
      drawLines((node.dialogueID || node.characterID), outgoingLine.toNode, isCharacter, outgoingLine, characterId);
    });
  }

} // end function drawDialogueMakerProject

/* DRAGGABLE SETTINGS */
const draggableSettings = {
  drag: function (event, ui) {
    //console.log('dragging');
    updateLines(ui.helper); //called only when dragged
  },
  stop: function (event, ui) {
    var position = ui.position;
    //myLog(("Element stopped at: (" + position.left + ", " + position.top + ")"),3);
    // Your code to update some other element or data
    updateElementPositionInObject(ui.helper); //update master object positions
    $(".conditionCircle").show(); //bring the circle visibility back up
  },
}



function createCharacterNodeHTML(character){

  let eyeImageSource;
  //closed or open eye:
  if (character.hideChildren == false) {

    eyeImageSource = 'img/iconmonstr-eye-filled-32.png'

  } else {

    eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png'

  }

  let characterNodeHTML = $(`
          <div class="blockWrap characterRoot" data-character-id="${character.characterID}" id="char${character.characterID}" data-hidechildren="${character.hideChildren}">
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
          
                </div>
                    <div class="block">
                        <div class="characterElementIDLine" style="text-align: left;">
                            <span style="width: 35%; display:inline-block; text-align: right;">Character ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${character.characterID}">
                                <img class="eyeImage" src="${eyeImageSource}" alt="eye" width="24" height="24">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name" value="${character.characterName}">
              
                    </div>
                    <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                        <div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>
                    </div>
            </div>
          </div>

        `);

  characterNodeHTML.css({
    left: character.characterNodeX,
    top: character.characterNodeY,
  });

  return characterNodeHTML;

}/*End createCharacterNodeHTML  */


/* DRAWING THE LINES */

function drawLines(sourceId, targetId, isCharacter, outgoingLine, characterId) {
  let sourceElement, targetElement, plusButtonElem;

  

  if (isCharacter) {
    // Select the source element based on characterId and sourceId
    sourceElement = $(`.characterRoot[data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);

  } else {
    // Select the source element based on characterId and sourceId
    sourceElement = $(`.blockWrap[data-dialogue-id="${sourceId}"][data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
  }

  // Select the target element based on characterId and targetId
  targetElement = $(`.blockWrap[data-dialogue-id="${targetId}"][data-character-id="${characterId}"]`);



  // Find the character based on the characterId
  let character = gameDialogueMakerProject.characters.find(
    (char) => char.characterID === characterId
  );

  if (character) {
    // Check if the target node belongs to the current character
    let targetNode = character.dialogueNodes.find(
      (dialogueNode) => dialogueNode.dialogueID === targetId
    );

    // If the target node does not belong to the current character, find the character that owns it
    if (!targetNode) {
      let targetCharacter = gameDialogueMakerProject.characters.find((char) =>
        char.dialogueNodes.some((node) => node.dialogueID === targetId)
      );
      if (targetCharacter) {
        // Change the character and find the node in the correct character
        character = targetCharacter;
        targetNode = targetCharacter.dialogueNodes.find(
          (dialogueNode) => dialogueNode.dialogueID === targetId
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

      // Stores a reference to the actual line into the object
      outgoingLine.lineElem = theLine;

      // Set the id also of the svg for easier selection
      const all_svgs = document.querySelectorAll("svg");
      const this_svg = all_svgs[all_svgs.length - 1]; //this will select the latest svg
      this_svg.setAttribute("data-character", characterId);
      this_svg.setAttribute("data-fromnode", sourceId);
      this_svg.setAttribute("data-tonode", targetId);

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
