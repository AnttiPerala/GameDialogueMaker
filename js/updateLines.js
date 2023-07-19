let allConnectedLines;

// Simplify check for lineElem instance of LeaderLine
function updateLineElem(lineElem) {
  if (lineElem instanceof LeaderLine) {
    lineElem.position(); // call the position function on the instance
  } else {
    console.error('lineElem is not an instance of LeaderLine');
  }
}

// When the mainArea is dragged or an update for all lines is needed for some reason
function updateAllLines() {
  if (!eraseMode) {
    gameDialogueMakerProject.characters.forEach((character) => {
      if (character.hideChildren === true) return;

      character.outgoingLines.forEach((outgoingLine) => updateLineElem(outgoingLine.lineElem));
      character.dialogueNodes.forEach((dialogueNode) => {
        dialogueNode.outgoingLines.forEach((outgoingLine) => updateLineElem(outgoingLine.lineElem));
      });
    });
  }
}

// Update lines based on specific element
function updateLines(element) {
  if (eraseMode) return;

  $(".conditionCircle").hide();

  //scoping
  const id = element.hasClass('characterRoot') || element.parent().hasClass('characterRoot') ? element.attr('id') : $(element).closest('.characterRoot').attr('id');
  const character = id.replace(/\D/g, ''); // Strip char from id

  if (element.hasClass('characterRoot') || element.closest('.characterRoot').length) {
    return updateAllLines();
  }

  const parent = element.parent();
  const justTheIdNumber = element.attr('id').replace(/\D/g, '');
  const justTheIdNumberForParent = parent.attr('id').replace(/\D/g, '');

  const theNodeInTheMasterObject = getDialogueNodeById(character, justTheIdNumber);
  const theParentNodeInTheMasterObject = getDialogueNodeById(character, justTheIdNumberForParent);

  const characterToLoop = gameDialogueMakerProject.characters.find(char => char.characterID === character);

  if (characterToLoop && characterToLoop.hideChildren !== true) {
    const startIndex = characterToLoop.dialogueNodes.findIndex(d => d.dialogueID === justTheIdNumberForParent);
    for (let i = startIndex; i < characterToLoop.dialogueNodes.length; i++) {
      let node = characterToLoop.dialogueNodes[i];
      node.outgoingLines.forEach(line => updateLineElem(line.lineElem));

      if (node.nextNode !== undefined && node.nextNode > 0) {
        node.nextNodeLineElem.position();
      }
    }
  }

  if (theParentNodeInTheMasterObject) {
    theParentNodeInTheMasterObject.outgoingLines.forEach(line => updateLineElem(line.lineElem));
  }

  allConnectedLines = $(element).parent().find('.line');

  myelems = allConnectedLines;

  allConnectedLines.each(function (i, e) {
    e.get(0).position();
  });
}
