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

    console.log('selectedElementBlockWrap', selectedElementBlockWrap);

    let nodeInfo = getInfoByPassingInDialogueNodeOrElement(selectedElementBlockWrap);

    console.log('nodeInfo: ', nodeInfo);

    let dialogueNodeInObject = nodeInfo.dialogueNode;

    let charID = nodeInfo.characterID;

    let charName = nodeInfo.characterName;

    //handle selected element being root
    if (selectedElementBlockWrap.hasClass('characterRoot')){
        console.log(`root`);
        console.log('nodeInfo.characterNode', nodeInfo.characterNode);
        let nextNodeID = nodeInfo.characterNode.outgoingLines[0].toNode;
        console.log('charID ', charID);
        console.log('nextNodeID', nextNodeID);
        let nextNodeInObject = getDialogueNodeById(charID, nextNodeID);
        dialogueNodeInObject = nextNodeInObject ?? dialogueNodeInObject; //The nullish coalescing operator ?? checks if nextNodeInObject is null or undefined. If nextNodeInObject is null or undefined, it returns the value on the right-hand side

    }
let generator = iterateConnectedNodes(dialogueNodeInObject, charID);
generator.next().value; //move from sent in node once
    

    renderPlayMode(charName, dialogueNodeInObject);

    function renderPlayMode(charName, dialogueNodeInObject) {
        $('.playModeDialogueContainer').remove();
        let answerElements = ``;
        if (dialogueNodeInObject.dialogueType == 'question') {
            answerElements = "";
            let character = gameDialogueMakerProject.characters.find(character => character.characterID == charID);
            for (let i = 0; i < dialogueNodeInObject.outgoingLines.length; i++) {
                let outgoingLine = dialogueNodeInObject.outgoingLines[i];
                let answerNode = character.dialogueNodes.find(node => node.dialogueID == outgoingLine.toNode);
                if (answerNode) {
                    let reactionNodeId = answerNode.outgoingLines[0]?.toNode;
                    answerElements += `<button class="answerButton" data-reaction-node="${reactionNodeId}">${answerNode.dialogueText}</button>`;
                }
            }
        }
        let playModeDialogueContainer = $(`
    <div class="playModeDialogueContainer">
        <div class="infoLine">
        Character: <span class="charName">${charName}</span> Dialogue: <span class="dialogueId">${dialogueNodeInObject.dialogueID}</span>
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
            let character = gameDialogueMakerProject.characters.find(character => character.characterID == charID);
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

    $(document).off('click', '.answerButton').on('click', '.answerButton', function () {
        let reactionNodeId = $(this).data('reaction-node');
        let character = gameDialogueMakerProject.characters.find(character => character.characterID == charID);
        let reactionNode = character.dialogueNodes.find(node => node.dialogueID == reactionNodeId);
        if (reactionNode) {
            dialogueNodeInObject = reactionNode;
            renderPlayMode(charName, dialogueNodeInObject);
        } else {
            console.error(`Could not find reaction node with ID: ${reactionNodeId}`);
        }
    });

    $(document).off('click', '.conditionButton').on('click', '.conditionButton', function () {
        let variableName = $(this).data('variable-name');
        let comparisonOperator = $(this).data('comparison-operator');
        let variableValue = $(this).data('variable-value');

        // Here, you would handle what happens when the condition is completed
        // The exact behavior would depend on how your conditions are set up, 
        // and might involve updating some state in your game
        console.log(`Condition completed: ${variableName} ${comparisonOperator} ${variableValue}`);
    });



    $(document).on("click", '#leftArrow', function(){
        drawDialogueBox("reversing has not been implemented yet");
    })
    
    $(document).off('click', '#rightArrow').on('click', '#rightArrow', function () {
        let outgoingLine = dialogueNodeInObject.outgoingLines[0]; // Assuming only one outgoing line per node
        if (outgoingLine && outgoingLine.transitionConditions && outgoingLine.transitionConditions.length > 0) {
            // Clear the dialogue line and remove any condition buttons
            $('#dialogueLine').empty();
            $('.conditionButton').remove();

            // Display the transition conditions as buttons
            outgoingLine.transitionConditions.forEach((condition, index) => {
                $('#dialogueLine').append(`There was a condition for progressing to the next dialogue: <button class="conditionButton" data-condition-index="${index}">Fulfil  ${condition.variableName} ${condition.comparisonOperator} ${condition.variableValue}</button>`);
            });
        } else {
            moveNext();
        }
    });

    $(document).off('click', '.conditionButton').on('click', '.conditionButton', function () {
        moveNext();
    });

    function moveNext() {
        let nextNodeId = dialogueNodeInObject.nextNode;
        let character = gameDialogueMakerProject.characters.find(character => character.characterID == charID);
        if (nextNodeId !== -1 && nextNodeId !== "" && nextNodeId !== null && nextNodeId !== undefined) {
            let nextNode = character.dialogueNodes.find(node => node.dialogueID == nextNodeId);
            if (nextNode) {
                dialogueNodeInObject = nextNode;
                generator = iterateConnectedNodes(dialogueNodeInObject, charID);
                generator.next();
                renderPlayMode(charName, dialogueNodeInObject);

                // Check if the next node is the last one
                if ((dialogueNodeInObject.nextNode === -1 || dialogueNodeInObject.nextNode === "" ||
                    dialogueNodeInObject.nextNode === null || dialogueNodeInObject.nextNode === undefined) &&
                    dialogueNodeInObject.outgoingLines.length === 0) {
                    // Append the restart button to the dialogue line
                    $('#dialogueLine').append('<button id="restartButton">Restart Dialogue</button>');
                }
            } else {
                console.error(`Could not find node with ID: ${nextNodeId}`);
            }
        } else {
            const nextNode = generator.next().value;
            if (nextNode) {
                dialogueNodeInObject = nextNode;
                renderPlayMode(charName, dialogueNodeInObject);
            } else {
                drawDialogueBox("You have reached the end of this dialogue branch");
            }
        }
    }
/* end moveNext */

    $(document).off('click', '#nextButton').on('click', '#nextButton', function () {
        console.log('next');
        moveNext();
    });





    $(document).off('click', '#restartButton').on('click', '#restartButton', function () {
        // Reset your dialogue to the beginning here
        startPlayMode();
    });
    

    //currentNode = dialogueNodeInObject; // Assuming startNode is your starting node
    //renderNode(currentNode);
}



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

