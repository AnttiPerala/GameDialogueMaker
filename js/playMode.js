const playButton = $('#playMode img');
$(playButton).click(startPlayMode);


let currentNode = null; // This should be initialized to your starting node in startPlayMode
let playModeCharID; 
let charName;
let dialogueNodeInObject;
let playModeNodeInfo;
let generator;

function startPlayMode() {
    playModeActive = true;

    let selectedElement = $('.selected');
    if (selectedElement.length == 0) {
        drawDialogueBox('You need to select the node from which you want to start the playback first (by clicking on it)');
    }

    let selectedElementBlockWrap = selectedElement.closest('.blockWrap');

    console.log('selectedElementBlockWrap ', selectedElementBlockWrap );

    playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(selectedElementBlockWrap);

    if (playModeNodeInfo.isCharacter == true) {
        let nextNodeID = playModeNodeInfo.characterNode.outgoingLines[0].toNode;
        let nextNodeInObject = getDialogueNodeById(playModeNodeInfo.characterID, nextNodeID);
        playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(nextNodeInObject);
        dialogueNodeInObject = playModeNodeInfo.dialogueNode;
    }

    generator = iterateConnectedNodes(playModeNodeInfo.dialogueNode, playModeCharID);
    //generator.next(); // Move past the first node

    dialogueNodeInObject = playModeNodeInfo.dialogueNode;
    playModeCharID = playModeNodeInfo.characterID;
    charName = playModeNodeInfo.characterName;

    $(document).on("click", '#leftArrow', function () {
        drawDialogueBox("reversing has not been implemented yet");
    });

    $(document).off('click', '#rightArrow').on('click', '#rightArrow', function () {
        moveNext();
    });

    $(document).off('click', '.conditionButton').on('click', '.conditionButton', function () {
        moveNext();
    });


    $(document).off('click', '#nextButton').on('click', '#nextButton', function () {
        moveNext();
    });

    $(document).off('click', '#restartButton').on('click', '#restartButton', function () {
        startPlayMode();
    });

    renderPlayMode(charName, playModeNodeInfo.dialogueNode);
}

 //end start playmode



//RENDER PLAY MODE

function renderPlayMode(charName, dialogueNodeInObject) {
    $('.playModeDialogueContainer').remove();
    let answerElements = ``;
    if (dialogueNodeInObject.dialogueType == 'question') {
        answerElements = "";
        let character = gameDialogueMakerProject.characters.find(character => character.characterID == playModeCharID);
        for (let i = 0; i < dialogueNodeInObject.outgoingLines.length; i++) {
            let outgoingLine = dialogueNodeInObject.outgoingLines[i];
            let answerNode = character.dialogueNodes.find(node => node.dialogueID == outgoingLine.toNode);
            if (answerNode) {
                let reactionNodeId = answerNode.outgoingLines[0]?.toNode;
                answerElements += `<button class="answerButton" data-reaction-node="${reactionNodeId}">${answerNode.dialogueText}</button>`;
            }
        }


        //not a question
    } else if (dialogueNodeInObject.outgoingLines.length > 0) {
        // Check if there are outgoing lines and add a button for it
        let nextNodeID = dialogueNodeInObject.outgoingLines[0].toNode;
        answerElements += `<button class="continueButton" data-next-node="${nextNodeID}">Continue</button>`;
    }

        let playModeDialogueContainer = $(`
        <div class="playModeDialogueContainer">
            <div class="infoLine">
            Character: <span class="charName">${charName}</span> Dialogue: <span class="dialogueId">${dialogueNodeInObject.dialogueID}</span>
            <div class="exitPlayMode" title="exit playmode">X</div>
            </div>
            <div id="dialogueLine" class="dialogueLine">
                <!-- The dialogue text will be added here by the typewriter function -->
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



    // Call the typewriter function for the dialogue text
    typewriter('#dialogueLine', dialogueNodeInObject.dialogueText, 0, 20, function () {
        if ((dialogueNodeInObject.nextNode !== -1 && dialogueNodeInObject.nextNode !== "" &&
            dialogueNodeInObject.nextNode !== null && dialogueNodeInObject.nextNode !== undefined)) {
            $('.answerLine').append('<button id="nextButton">Next</button>');
        }
        else if (dialogueNodeInObject.outgoingLines.length === 0) {
            $('.answerLine').append('<button id="restartButton">Restart Dialogue</button>');
        }
    });


    $(document).off('click', '.answerButton');
    $(document).on('click', '.answerButton', function () {
        let reactionNodeId = $(this).data('reaction-node');
        let character = gameDialogueMakerProject.characters.find(character => character.characterID == playModeCharID);
        let reactionNode = character.dialogueNodes.find(node => node.dialogueID == reactionNodeId);
        if (reactionNode) {
            dialogueNodeInObject = reactionNode;
            renderPlayMode(charName, dialogueNodeInObject);
        } else {
            console.error(`Could not find reaction node with ID: ${reactionNodeId}`);
        }
    });
}


//end render play mode



function handleAnswerClick(toNodeId) {
    const characterId = findCharacterIDByPassingInDialogueNode(currentNode);
    const character = gameDialogueMakerProject.characters.find(character => character.characterID == characterId);
    currentNode = character.dialogueNodes.find(node => node.dialogueID == toNodeId);
    renderNode(currentNode);
}

/* ANIM TYPEWRITER STYLE */
let isTyping = false; // global variable to track if the typewriter is currently typing

function typewriter(id, text, index, time, callback) {
    $(id).html(""); // Clear the content before typing
    function typeWriterInner(id, text, index, time, callback) {
        // Add condition to stop appending
        if (index < text.length) {
            setTimeout(function () {
                let char = text.charAt(index);
                $(id).append(char);
                typeWriterInner(id, text, ++index, time, callback);
            }, time);
        } else {
            isTyping = false; // set isTyping to false when done typing
            // Call the callback function when the typing is done
            if (callback) callback();
        }
    }

    if (!isTyping) { // only start typing if not currently typing
        isTyping = true;
        typeWriterInner(id, text, index, time, callback); 
    }
}

$(document).on('click', '.exitPlayMode', function(){
    console.log('exit', this);
    $('.playModeDialogueContainer').remove();
    playModeActive = false;
})

$(document).off('click', '.continueButton').on('click', '.continueButton', function () {
    console.log('continye button clicked, calling movenext()', );
    moveNext();
});

/* MOVENEXT */
function moveNext(chosenNodeId = null) {
    const nextOutput = generator.next(chosenNodeId).value;

    console.log('generator.next(chosenNodeId).value', nextOutput);

    if (!nextOutput) {
        console.warn('No more nodes to process');
        return;
    }

    // Handle player choices
    if (nextOutput.dialogueType === 'question') {
        renderPlayerChoices(nextOutput.choices);
        return;
    }

    if (nextOutput.type === 'CONDITION') {
        console.log('handleCondition... nextOutput', nextOutput);
        handleCondition(nextOutput);
        return;
    }

    dialogueNodeInObject = nextOutput;

    if (!dialogueNodeInObject) {
        drawDialogueBox("You have reached the end of this dialogue branch");
        return;
    }

    if (dialogueNodeInObject.type !== 'PLAYER_CHOICE') {
        renderPlayMode(charName, dialogueNodeInObject);
    }

    /* if ((dialogueNodeInObject.nextNode === -1 || dialogueNodeInObject.nextNode === "" ||
        dialogueNodeInObject.nextNode === null || dialogueNodeInObject.nextNode === undefined) &&
        dialogueNodeInObject.outgoingLines.length === 0) {
        $('#dialogueLine').append('<button id="restartButton">Restart Dialogue</button>');
    } */
} /* end moveNext */



function handleCondition(conditionObject) {
    $('#dialogueLine').html('A condition needs to be fulfilled before the next dialogue is shown.');
    $('.conditionButton').remove();
    $('.continueButton').remove();

    conditionObject.conditions.forEach((condition, index) => {
        console.log("Processing condition:", condition);
        $('#dialogueLine').append(`<button class="conditionButton" data-condition-index="${index}">Fulfill  ${condition.variableName} ${condition.comparisonOperator} ${condition.variableValue}</button>`);
    });
}

function renderPlayerChoices(choices) {
    if (!choices || !Array.isArray(choices)) {
        console.error("Invalid choices provided:", choices);
        return;
    }
    // Clear any existing choices
    $('.playerChoicesContainer').remove();

    // Construct the choices container
    let choicesHTML = `<div class="playerChoicesContainer">`;

    choices.forEach(choice => {
        choicesHTML += `<button class="choiceButton" data-node-id="${choice.nodeId}">${choice.text}</button>`;
    });

    choicesHTML += `</div>`;

    $('body').append(choicesHTML);

    // Attach event handlers
    $(document).off('click', '.choiceButton').on('click', '.choiceButton', function () {
        const chosenNodeId = $(this).data('node-id');
        moveNext(chosenNodeId);
    });
}
