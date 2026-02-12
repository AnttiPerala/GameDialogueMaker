function updateElementPositionInObject(element) {

  // Make sure we always have a jQuery object
  const $el = (element && element.jquery) ? element : $(element);

  // ---- CHARACTER ROOT DRAG ----
  if ($el.hasClass('characterRoot')) {

    const characterId = Number($el.attr('data-character-id')) || Number(($el.attr('id') || '').replace(/\D/g, ''));
    const theNodeObjectToChange = getCharacterById(characterId);

    if (theNodeObjectToChange) {
      const xPos = $el.get(0).offsetLeft;
      const yPos = $el.get(0).offsetTop;

      theNodeObjectToChange.characterNodeX = xPos;
      theNodeObjectToChange.characterNodeY = yPos;
    }

    if (!eraseMode) {
      storeMasterObjectToLocalStorage();
    }

    return;
  }

  // ---- DIALOGUE NODE DRAG ----
  const characterId = Number($el.attr('data-character-id')) ||
                      Number(($el.closest('.characterRoot').attr('data-character-id')) || '') ||
                      Number((($el.closest('.characterRoot').attr('id') || '').replace(/\D/g, '')));

  const questionId = Number(($el.attr('id') || '').replace(/\D/g, '')) ||
                     Number($el.attr('data-dialogue-id'));

  const theNodeObjectToChange = getDialogueNodeById(characterId, questionId);

  if (theNodeObjectToChange) {
    const xPos = $el.get(0).offsetLeft;
    const yPos = $el.get(0).offsetTop;

    theNodeObjectToChange.dialogueNodeX = xPos;
    theNodeObjectToChange.dialogueNodeY = yPos;
  }

  if (!eraseMode) {
    // If this node is a question and has answers, this will only reposition "default/unplaced" ones
    if (typeof positionNewAnswersUnderQuestion === "function") {
      positionNewAnswersUnderQuestion(characterId, questionId);
    }

    storeMasterObjectToLocalStorage();
  }
}
