function createDialogueHTMLElement(dialogueNode) {

  let nodeInfo = getInfoByPassingInDialogueNodeOrElement(dialogueNode);
  let dialogueElement = '';
  let activeNextNode = '';

  if (dialogueNode.nextNode > 0) {
    activeNextNode = dialogueNode.nextNode;
  }

  // if character, return immediately because character nodes are created elsewhere
  if (nodeInfo.isCharacter === true) {
    return null;
  }

  if (dialogueNode.dialogueType == 'question') {
    dialogueElement = createQuestionBlock(nodeInfo);
  }

  if (dialogueNode.dialogueType == 'answer') {
    dialogueElement = createAnswerBlock(nodeInfo);
  }

  if (dialogueNode.dialogueType == 'line') {
    dialogueElement = createLineBlock(nodeInfo);
  }

  if (dialogueNode.dialogueType == 'fight') {
    dialogueElement = createFightBlock(nodeInfo);
  }

  // store element reference in object
  nodeInfo.dialogueNode.nodeElement = dialogueElement;

  return dialogueElement;
}

// ✅ make it accessible across files
window.createDialogueHTMLElement = createDialogueHTMLElement;
