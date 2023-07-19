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

    let dialogueNodeInObject = findMatchingDialogueNodeInObjectFromPassedInBlockwrap(selectedElementBlockWrap);

    let charID = findCharacterIDByPassingInDialogueNode(dialogueNodeInObject);

    let charName = getCharacterNameFromDialogueNode(dialogueNodeInObject);

    //handle selected element being root
    if (selectedElementBlockWrap.hasClass('characterRoot')){
        console.log(`root`);
        let nextNodeID = dialogueNodeInObject.outgoingLines[0].toNode;
        let nextNodeInObject = getDialogueNodeById(charID, nextNodeID);
        dialogueNodeInObject = nextNodeInObject ?? dialogueNodeInObject; //The nullish coalescing operator ?? checks if nextNodeInObject is null or undefined. If nextNodeInObject is null or undefined, it returns the value on the right-hand side

    }
const generator = iterateConnectedNodes(dialogueNodeInObject, charID);
generator.next().value; //move from sent in node once
    

    renderPlayMode(charName, dialogueNodeInObject);

    function renderPlayMode(charName, dialogueNodeInObject){

        let answerElements = ``;

        //handle question

        if(dialogueNodeInObject.dialogueType == 'question'){
            console.log('question');
            answerElements = "";
            let character = gameDialogueMakerProject.characters.find(char => char.characterName == charName);
            // Assuming the character is always the first one in the array
            
        
            for (let outgoingLine of dialogueNodeInObject.outgoingLines) {
                let targetNode = character.dialogueNodes.find(node => node.dialogueID == outgoingLine.toNode);
                if (targetNode) {
                    answerElements += `<button>${targetNode.dialogueText}</button>`;
                }
            }
        }

        let playModeDialogueContainer = $(`
        <div class="playModeDialogueContainer">
            <div class="infoLine">
            Character: ${charName} Dialogue: ${dialogueNodeInObject.dialogueID}
            </div>
            <div class="dialogueLine">
                ${dialogueNodeInObject.dialogueText}
            </div>
            <div class="answerLine"> 
            ${answerElements}
            </div>
            <div class="bottomLine">
            <div id="leftArrow" class="gridCell">&lsaquo;</div>
            <div class="gridCell"></div>
            <div id="rightArrow" class="gridCell">&rsaquo;</div>
             
            
            </div>
        </div>
        `);

        $('body').append(playModeDialogueContainer);
        
    } //end render play mode


    $(document).on("click", '#leftArrow', function(){

    })
    
    $(document).on("click", '#rightArrow', function(){
        
        const nextNode = generator.next().value;
        //const nextNextNode = generator.next().value;
        dialogueNodeInObject = nextNode ?? dialogueNodeInObject;
        $('.playModeDialogueContainer').remove(); // Clear the previously rendered dialogue
        renderPlayMode(charName, dialogueNodeInObject);  // re-render the dialogue with the new node
    })


    //currentNode = dialogueNodeInObject; // Assuming startNode is your starting node
    //renderNode(currentNode);
}

/* function renderNode(node) {
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
} */

function handleAnswerClick(toNodeId) {
    const characterId = findCharacterIDByPassingInDialogueNode(currentNode);
    const character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);
    currentNode = character.dialogueNodes.find(node => node.dialogueID == toNodeId);
    renderNode(currentNode);
}

