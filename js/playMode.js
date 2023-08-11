// Global Variables
playModeActive = false;
let latestPlayModeNodeInfo;
let currentNode = null;
let playModeCharID;
let charName;



// Start Play Mode
function startPlayMode() {
    playModeActive = true;
    console.log('start playmode');

    const selectedElement = $('.selected');
    if (selectedElement.length === 0) {
        drawDialogueBox('Select a node for playback.');
        return;
    }

    const selectedElementBlockWrap = selectedElement.closest('.blockWrap');
    let playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(selectedElementBlockWrap);

    console.log('start playModeNodeInfo', playModeNodeInfo);

    // If character, navigate to the next node
    if (playModeNodeInfo.isCharacter) {
        let nextNodeID = playModeNodeInfo.characterNode.outgoingLines[0].toNode;
        let nextNodeInObject = getDialogueNodeById(playModeNodeInfo.characterID, nextNodeID);
        playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(nextNodeInObject);
        console.log('is char');
    }

    playModeCharID = playModeNodeInfo.characterID;
    charName = playModeNodeInfo.characterName;

    console.log('playModeNodeInfo now', playModeNodeInfo);
    latestPlayModeNodeInfo = playModeNodeInfo;
    renderPlayMode(playModeNodeInfo);
}

// Attach Event Handlers
function attachEventHandlers() {
    $('#playMode img').click(startPlayMode);

   
    $(document).on('click', '.exitPlayMode', function () {
        $('.playModeDialogueContainer').remove();
        playModeActive = false;
    });
    
}

$(document).ready(attachEventHandlers);


//RENDER PLAY MODE

function renderPlayMode(nodeInfo) {
    console.log('renderPlayMode nodeInfo', nodeInfo);
    $('.playModeDialogueContainer').remove();
    let answerElements = ``;

    console.log('render playmode nodeInfo', nodeInfo);
    
    if (nodeInfo.dialogueNode.dialogueType == 'question') {
        console.log('its a question');
        answerElements = "";
        let character = nodeInfo.characterNode;
        //find the answer options by looping through outgoingLines
        for (let i = 0; i < nodeInfo.dialogueNode.outgoingLines.length; i++) {
            let outgoingLine = nodeInfo.dialogueNode.outgoingLines[i];
            let answerNode = character.dialogueNodes.find(node => node.dialogueID == outgoingLine.toNode);
            if (answerNode) {
                let reactionNodeId = answerNode.outgoingLines[0]?.toNode;
                answerElements += `<button class="answerButton" data-reaction-node="${reactionNodeId}">${answerNode.dialogueText}</button>`;
            }
        }


        //not a question
    } else if (nodeInfo.dialogueNode.dialogueType == 'fight'){

        console.log('fight!');

    } else if (nodeInfo.dialogueNode.outgoingLines.length > 0) { //just reular line node
        // Check if there are outgoing lines and add a button for it
        let nextNodeID = nodeInfo.dialogueNode.outgoingLines[0].toNode;
        answerElements += `<button class="continueButton" data-from-node="${nodeInfo.dialogueID}" data-to-node="${nextNodeID}">Continue</button>`;
    }

    let playModeDialogueContainer = $(`
        <div class="playModeDialogueContainer">
            <div class="infoLine">
            Character: <span class="charName">${nodeInfo.characterName}</span> Dialogue: <span class="dialogueId">${nodeInfo.dialogueID}</span>
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
    typewriter('#dialogueLine', nodeInfo.dialogueNode.dialogueText, 0, 20, function () {
        if ((nodeInfo.nextNode !== -1 && nodeInfo.nextNode !== "" &&
            nodeInfo.nextNode !== null && nodeInfo.nextNode !== undefined)) {
            $('.answerLine').append('<button id="nextButton">Next</button>');
        }
        else if (nodeInfo.dialogueNode.outgoingLines.length === 0) {
            $('.answerLine').append('<button id="restartButton">Restart Dialogue</button>');
        }
    });


    $(document).off('click', '.answerButton');
    $(document).on('click', '.answerButton', function () {
        let reactionNodeId = $(this).data('reaction-node');
        let character = gameDialogueMakerProject.characters.find(character => character.characterID == playModeCharID);
        let reactionNode = character.dialogueNodes.find(node => node.dialogueID == reactionNodeId);
        if (reactionNode) {
            playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(reactionNode);
            renderPlayMode(playModeNodeInfo);
        } else {
            console.error(`Could not find reaction node with ID: ${reactionNodeId}`);
        }
    });

    latestPlayModeNodeInfo = nodeInfo;
} /* end renderPlayMode */




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

$(document).on('click', '.exitPlayMode', function () {
    console.log('exit', this);
    $('.playModeDialogueContainer').remove();
    playModeActive = false;
});

$(document).on('click', '.continueButton', function () {
    console.log('continue button clicked, calling moveNext()');
    let fromNodeID = $(this).attr('data-from-node');
    let toNodeID = $(this).attr('data-to-node');
    console.log('fromNodeID', fromNodeID);
    console.log('toNodeID', toNodeID );
    moveNext(fromNodeID, toNodeID);
});

$(document).on('click', '.conditionButton', function () {
    console.log('condition button clicked');
    //let fromNodeID = $(this).attr('data-from-node');
    let toNodeID = $(this).attr('data-to-node');
    //console.log('fromNodeID', fromNodeID);
    console.log('toNodeID', toNodeID);
    let nextNodeInObject = getDialogueNodeById(latestPlayModeNodeInfo.characterID, toNodeID);
    playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(nextNodeInObject);
    latestPlayModeNodeInfo = playModeNodeInfo;
    renderPlayMode(playModeNodeInfo);
});

$(document).on('click', '#restartButton', function () {
    console.log('restart button clicked');
    //let fromNodeID = $(this).attr('data-from-node');
    startPlayMode();
});

/* MOVENEXT */
function moveNext(fromNodeID, toNodeID) {
    //find line and check if it has conditions

    console.log('moveNext fromNodeID', fromNodeID);
    console.log('moveNext toNodeID', toNodeID);

    let lineObject = getLineObjectFromMasterObjectUsingFromAndTo(fromNodeID, toNodeID);

    console.log('lineObject', lineObject);

    if (lineObject.transitionConditions.length > 0){
        console.log('condition found');
        $('.answerLine').append(`<button class="conditionButton" data-from-node="${fromNodeID}" data-to-node="${toNodeID}">Fullfil condition: ${lineObject.transitionConditions[0].variableName}${lineObject.transitionConditions[0].comparisonOperator}${lineObject.transitionConditions[0].variableValue}</button>`);

    } else {
        //no condition, move to next
        let newNode = getDialogueNodeById(playModeCharID, toNodeID);
        let playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(newNode);

        renderPlayMode(playModeNodeInfo);
    }
   
}




