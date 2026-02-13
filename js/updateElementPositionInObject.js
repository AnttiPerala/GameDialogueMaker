// updateElementPositionInObject.js

function updateElementPositionInObject(element) {

  // Stored positions are "world" coordinates relative to #mainArea.
  // Nodes can be nested, so offsetLeft/Top is NOT reliable.
  // The app also uses CSS `zoom` on <body>, so we divide DOMRect by zoom.
  function getBodyZoomFactorSafe() {
    const zRaw = window.getComputedStyle(document.body).zoom;
    let z = 1;
    if (zRaw) z = String(zRaw).includes('%') ? (parseFloat(zRaw) / 100) : parseFloat(zRaw);
    if (!isFinite(z) || z <= 0) z = 1;
    return z;
  }

  function getWorldPosRelativeToMainArea($elem) {
    const mainEl = document.getElementById('mainArea');
    if (!mainEl || !$elem || !$elem.length) {
      return { x: $elem.get(0).offsetLeft, y: $elem.get(0).offsetTop };
    }

    const z = getBodyZoomFactorSafe();
    const elRect = $elem.get(0).getBoundingClientRect();
    const mainRect = mainEl.getBoundingClientRect();

    return {
      x: (elRect.left - mainRect.left) / z,
      y: (elRect.top - mainRect.top) / z,
    };
  }

  // Make sure we always have a jQuery object
  const $el = (element && element.jquery) ? element : $(element);

  // ---- CHARACTER ROOT DRAG ----
  if ($el.hasClass('characterRoot')) {

    const characterId =
      Number($el.attr('data-character-id')) ||
      Number(($el.attr('id') || '').replace(/\D/g, ''));

    const theNodeObjectToChange = getCharacterById(characterId);

    if (theNodeObjectToChange) {
      const { x: xPos, y: yPos } = getWorldPosRelativeToMainArea($el);
      theNodeObjectToChange.characterNodeX = xPos;
      theNodeObjectToChange.characterNodeY = yPos;
    }

    return;
  }

  // ---- DIALOGUE NODE DRAG ----
  const characterId =
    Number($el.attr('data-character-id')) ||
    Number(($el.closest('.characterRoot').attr('data-character-id')) || '') ||
    Number((($el.closest('.characterRoot').attr('id') || '').replace(/\D/g, '')));

  const dialogueId =
    Number(($el.attr('id') || '').replace(/\D/g, '')) ||
    Number($el.attr('data-dialogue-id'));

  const theNodeObjectToChange = getDialogueNodeById(characterId, dialogueId);

  if (theNodeObjectToChange) {
    const { x: xPos, y: yPos } = getWorldPosRelativeToMainArea($el);
    theNodeObjectToChange.dialogueNodeX = xPos;
    theNodeObjectToChange.dialogueNodeY = yPos;
  }

  // IMPORTANT:
  // Do NOT save/redraw here. This function should ONLY update the master object.
  // Saving is handled by the drag-stop handler (so we can choose redraw:false).
}
