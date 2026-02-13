// storeMasterObjectToLocalStorage.js

let myObjectTest;

/**
 * Save master object to localStorage.
 * By default it also redraws (old behavior), but you can disable redraw:
 *   storeMasterObjectToLocalStorage({ redraw: false })
 */
function storeMasterObjectToLocalStorage(opts = {}) {
  const { redraw = true } = opts;

  // remove HTML element references from the master object (these should then be recreated by redrawing the entire object)
  for (let character of gameDialogueMakerProject.characters) {
    character.nodeElement = '';
    for (let dialogueNode of character.dialogueNodes) {
      dialogueNode.nodeElement = '';
      dialogueNode.nextNodeLineElem = '';
      for (let outgoingLine of dialogueNode.outgoingLines) {
        outgoingLine.lineElem = '';
      }
    }
  }

  localStorage.setItem("gameDialogueMakerProject", JSON.stringify(gameDialogueMakerProject));

  // visual feedback (if save button exists)
  const $element = $('#save img');
  if ($element && $element.length) {
    $element.addClass('flashgreen');
    setTimeout(() => {
      $element.removeClass('flashgreen');
    }, 1000);
  }

  // put some empty divs back in the object (so the app keeps working without reload)
  for (let character of gameDialogueMakerProject.characters) {
    character.nodeElement = $('<div class="blockWrap characterRoot"></div>');
    for (let dialogueNode of character.dialogueNodes) {
      dialogueNode.nodeElement = $('<div></div>');
      for (let outgoingLine of dialogueNode.outgoingLines) {
        outgoingLine.lineElem = '';
      }
    }
  }

  // IMPORTANT CHANGE:
  // Only redraw when caller asks for it (e.g. Autolayout, manual Save button).
  if (redraw) {
    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();
  }
}
