const playButton = $('#playMode img');
$(playButton).click(startPlayMode);


let currentNode = null; // This should be initialized to your starting node in startPlayMode

function startPlayMode() {
    //console.log(`playmode started`);
    playModeActive = true;
    //get the selected node
    let selectedElement = $('.selected');

    if (selectedElement.length == 0){
        drawDialogueBox('You need to select the node from which you want to start the playback first (by clicking on it)')
    }

    let selectedElementBlockWrap = selectedElement.closest('.blockWrap');

    let startNodeInObject = findMatchingDialogueNodeInObjectFromPassedInBlockwrap(selectedElementBlockWrap);

    alert(startNodeInObject.dialogueText);

    let dialogueContainer = $(`
    
    `);

    currentNode = startNode; // Assuming startNode is your starting node
    renderNode(currentNode);
}

function renderNode(node) {
    // Clear the current dialogue
    const dialogueContainer = document.getElementById('dialogueContainer');
    dialogueContainer.innerHTML = '';

    // Display the node's dialogue
    const dialogueElement = document.createElement('p');
    dialogueElement.textContent = node.dialogue;
    dialogueContainer.appendChild(dialogueElement);

    // If the node is a question, display answer buttons
    if (node.isQuestion) {
        for (let outgoingLine of node.outgoingLines) {
            const answerButton = document.createElement('button');
            answerButton.textContent = outgoingLine.answer;
            answerButton.addEventListener('click', () => handleAnswerClick(outgoingLine.toNode));
            dialogueContainer.appendChild(answerButton);
        }
    }
}

function handleAnswerClick(toNodeId) {
    const characterId = findCharacterIDByPassingInDialogueNode(currentNode);
    const character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);
    currentNode = character.dialogueNodes.find(node => node.dialogueID == toNodeId);
    renderNode(currentNode);
}
