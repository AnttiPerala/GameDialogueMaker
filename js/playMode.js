// Global Variables
playModeActive = false;
let latestPlayModeNodeInfo;
let currentNode = null;
let playModeCharID;
let charName;
const playModeWaitingNodes = new WeakMap();



// Start Play Mode
function startPlayMode(blockWrap) {
    console.log('start playmode');

    const selectedElement = blockWrap instanceof HTMLElement ? $(blockWrap) : $('.block.selected').first();
    if (selectedElement.length === 0) {
        drawDialogueBox('Select a node for playback.');
        return;
    }

    const selectedElementBlockWrap = selectedElement.closest('.blockWrap');
    let playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(selectedElementBlockWrap);

    console.log('start playModeNodeInfo', playModeNodeInfo);

    // If character, navigate to the next node
    if (playModeNodeInfo.isCharacter) {
        let nextNodeID = playModeWaitingNodes.get(playModeNodeInfo.characterNode) ?? playModeNodeInfo.characterNode.outgoingLines?.[0]?.toNode;
        let nextNodeInObject = getDialogueNodeById(playModeNodeInfo.characterID, nextNodeID);
        if (!nextNodeInObject) {
            drawDialogueBox('Connect this character to a dialogue node before playing.');
            return;
        }
        playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(nextNodeInObject);
        console.log('is char');
    }

    playModeCharID = playModeNodeInfo.characterID;
    playModeActive = true;
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

function renderPlayMode(nodeInfo, page = 0) {
    console.log('renderPlayMode nodeInfo', nodeInfo);
    $('.playModeDialogueContainer').remove();
    let answerElements = ``;

    console.log('render playmode nodeInfo', nodeInfo);
    let character = nodeInfo.characterNode;
    // Preview conditions are fulfilled manually with the existing test button.
    if ((nodeInfo.dialogueNode.outgoingLines || []).some(line =>
        (line.transitionConditions || []).some(condition => condition.waitUntilMet !== false)))
        playModeWaitingNodes.set(character, nodeInfo.dialogueNode.dialogueID);
    else playModeWaitingNodes.delete(character);
    const pages = String(nodeInfo.dialogueNode.dialogueText || '').split(/\r?\n/);
    const lastPage = page >= pages.length - 1;
    const role = nodeInfo.dialogueNode.dialogueSpeakers?.[page] || (nodeInfo.dialogueNode.dialogueType === 'answer' ? 'player' : 'npc');
    const speaker = role === 'player' ? 'You' : role === 'scene' ? 'Scene' : character.characterName;

    if (nodeInfo.dialogueNode.dialogueType == 'question') {
        console.log('its a question');
        answerElements = "";

        //find the answer options by looping through outgoingLines
        for (let i = 0; i < nodeInfo.dialogueNode.outgoingLines.length; i++) {
            let outgoingLine = nodeInfo.dialogueNode.outgoingLines[i];
            let answerNode = character.dialogueNodes.find(node => node.dialogueID == outgoingLine.toNode);
            if (answerNode) {
                const reactionNodeId = answerNode.outgoingLines?.[0]?.toNode;
                const answerNextNodeId = answerNode.nextNode;

                const hasReaction =
                    reactionNodeId !== undefined &&
                    reactionNodeId !== null &&
                    reactionNodeId !== "" &&
                    Number(reactionNodeId) > 0;

                const hasAnswerNext =
                    answerNode.outgoingLines?.length < 1 &&
                    answerNextNodeId !== undefined &&
                    answerNextNodeId !== null &&
                    answerNextNodeId !== "" &&
                    Number(answerNextNodeId) > 0;

                if (hasReaction) {
                    // Prefer outgoing line over nextNode (even if both exist somehow)
                    answerElements += `<button class="answerButton btn" data-transition="line" data-from-node="${answerNode.dialogueID}" data-to-node="${reactionNodeId}">${answerNode.dialogueText}</button>`;
                } else if (hasAnswerNext) {
                    // Answer has no outgoing line, but has a nextNode jump
                    answerElements += `<button class="answerButton btn" data-transition="next" data-from-node="${answerNode.dialogueID}" data-to-node="${answerNextNodeId}">${answerNode.dialogueText}</button>`;
                } else {
                    // End of branch
                    answerElements += `<button class="answerButton btn" data-transition="none" data-from-node="${answerNode.dialogueID}" data-to-node="">${answerNode.dialogueText}</button>`;
                }
            }
        }


        //not a question
    } else if (nodeInfo.dialogueNode.dialogueType == 'fight') {
        console.log('fight!');

        //find the fight options by looping through outgoingLines
        for (let i = 0; i < nodeInfo.dialogueNode.outgoingLines.length; i++) {
            let outgoingLine = nodeInfo.dialogueNode.outgoingLines[i];


            if (i == 0) {
                let reactionNodeId = outgoingLine.toNode;
                answerElements += `<span class="playModeExplainer">A fight started.</span> <button class="winFightButton btn" data-from-node="${nodeInfo.dialogueNode.dialogueID}"  data-to-node="${reactionNodeId}">Win the fight</button>`;
                console.log('answerElements', answerElements);
            }
            if (i == 1) {
                let reactionNodeId = outgoingLine.toNode;
                answerElements += `<button class="loseFightButton btn" data-from-node="${nodeInfo.dialogueNode.dialogueID}" data-to-node="${reactionNodeId}">Lose the fight</button>`;
                console.log('answerElements', answerElements);
            }
        }

        console.log('answerElements after loop', answerElements);


    } else if (nodeInfo.dialogueNode.outgoingLines.length > 0) { //just regular line node
        // Check if there are outgoing lines and add a button for it
        let nextNodeID = nodeInfo.dialogueNode.outgoingLines[0].toNode;
        answerElements += `<button class="continueButton btn" data-from-node="${nodeInfo.dialogueID}" data-to-node="${nextNodeID}">Continue</button>`;
    }

    if (!lastPage) answerElements = '';
    else if (nodeInfo.dialogueNode.dialogueType === 'question') answerElements = '<div class="answerSpeaker" style="color:#9bd9ff;font-weight:bold;margin-bottom:8px">You</div>' + answerElements;
    let playModeDialogueContainer = $(`
        <div class="playModeDialogueContainer">
            <div class="infoLine">
            Character: <span class="charName">${nodeInfo.characterName}</span> Dialogue: <span class="dialogueId">${nodeInfo.dialogueID}</span>
            <img class="exitPlayMode btnSmall" title="exit playmode" src="img/iconmonstr-x-mark-6-32.png">
            </div>
            <div class="dialogueSpeaker" style="font-weight:bold;color:#9bd9ff;margin:12px 0 6px"></div>
            <div id="dialogueLine" class="dialogueLine">
                <!-- The dialogue text will be added here by the typewriter function -->
            </div>
            <div class="answerLine"> 
            ${answerElements}
            </div>
            <div class="bottomLine">
 
            </div>
        </div>
        `);
    $('body').append(playModeDialogueContainer);
    playModeDialogueContainer.find('.dialogueSpeaker').text(speaker);



    // Call the typewriter function for the dialogue text
    typewriter('#dialogueLine', pages[page], 0, 20, function () {
        if (!lastPage) {
            $('<button class="btn">Continue</button>').on('click', () => renderPlayMode(nodeInfo, page + 1)).appendTo(playModeDialogueContainer.find('.answerLine'));
            return;
        }

        console.log('nodeInfo', nodeInfo);
        console.log('nodeInfo.dialogueNode.nextNode value:', nodeInfo.dialogueNode.nextNode);
        console.log('nodeInfo.nextNode !== -1:', nodeInfo.dialogueNode.nextNode !== -1);
        console.log('nodeInfo.nextNode !== "":', nodeInfo.dialogueNode.nextNode !== "");
        console.log('nodeInfo.nextNode !== null:', nodeInfo.dialogueNode.nextNode !== null);
        console.log('nodeInfo.nextNode !== undefined:', nodeInfo.dialogueNode.nextNode !== undefined);
        console.log('Combined condition:', (nodeInfo.dialogueNode.nextNode !== -1 && nodeInfo.dialogueNode.nextNode !== "" && nodeInfo.dialogueNode.nextNode !== null && nodeInfo.dialogueNode.nextNode !== undefined));

        const nextValue = Number(nodeInfo.dialogueNode.nextNode);
        const hasNextValue = Number.isFinite(nextValue) && nextValue > 0;
        const isBranchEnd = (nodeInfo.dialogueNode.outgoingLines || []).length === 0;

        // If the user reached a branch end and a nextNode is defined, automatically advance.
        // (We intentionally do not show a "Next" button.)
        if (isBranchEnd && hasNextValue) {
            moveNext(-1, nextValue);
            return;
        }

        if (isBranchEnd) {
            $('.answerLine').append('<span class="playModeExplainer">No more nodes to progress.</span><button id="restartButton" class="btn">Restart Dialogue</button>');
        }
    });


    $(document).off('click', '.answerButton');
    $(document).on('click', '.answerButton', function () {
        const transitionType = $(this).attr('data-transition');
        const fromNodeID = $(this).attr('data-from-node');
        const toNodeID = $(this).attr('data-to-node');

        if (transitionType === "none" || toNodeID === "" || toNodeID === undefined || toNodeID === null) {
            $('.answerLine').append('<span class="playModeExplainer">No reaction node defined for this answer.</span><button id="restartButton" class="btn">Restart Dialogue</button>');
            return;
        }

        if (transitionType === "next") {
            // Dotted \"next\" transition: skip line lookup/conditions
            moveNext(-1, toNodeID);
            return;
        }

        // Normal answer->reaction transition: go through moveNext() so conditions apply
        moveNext(fromNodeID, toNodeID);
    });

    latestPlayModeNodeInfo = nodeInfo;
} /* end renderPlayMode */




/* ANIM TYPEWRITER STYLE */
let isTyping = false; // global variable to track if the typewriter is currently typing

function typewriter(id, text, index, time, callback) {
    $(id).html(""); // Clear the content before typing

    function nextWordSpace(word, containerWidth, currentLineWidth) {
        // Calculate if the next word and a space will fit in the current line
        let testSpan = $('<span>').html(word + "&nbsp;").appendTo('body');
        let wordWidth = testSpan.width();
        testSpan.remove();

        // If the next word would not fit in the current line, return spaces to push it to the next line
        if (currentLineWidth + wordWidth > containerWidth) {
            let spacesRequired = Math.ceil((containerWidth - currentLineWidth) / wordWidth);
            return " ".repeat(spacesRequired);
        }
        return "";
    }

    function typeWriterInner(id, text, index, time, callback) {
        // Add condition to stop appending
        if (index < text.length) {
            let containerWidth = $(id).width();
            let currentLineWidth = $(id).children('span:last-child').width() || 0;
            let nextWord = text.slice(index).split(" ")[0];

            // Before appending the next word, check if we need to add spaces to push it to the next line
            if (text.charAt(index) === " ") {
                let spaces = nextWordSpace(nextWord, containerWidth, currentLineWidth);
                $(id).append(spaces);
            }

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
        $(id).append('<span></span>');  // Add a span to measure line width
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
    console.log('toNodeID', toNodeID);
    moveNext(fromNodeID, toNodeID);
});

$(document).on('click', '.nextButton', function () {
    console.log('next button clicked, calling moveNext()');
    let fromNodeID = $(this).attr('data-from-node');
    let toNodeID = $(this).attr('data-to-node');
    console.log('fromNodeID', fromNodeID);
    console.log('toNodeID', toNodeID);
    moveNext(fromNodeID, toNodeID);
});

$(document).on('click', '.loseFightButton, .winFightButton', function () {
    console.log('continue button clicked, calling moveNext()');
    let fromNodeID = $(this).attr('data-from-node');
    let toNodeID = $(this).attr('data-to-node');
    console.log('fromNodeID', fromNodeID);
    console.log('toNodeID', toNodeID);
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

    if (fromNodeID == -1) {
        //this is a dotted line "next" transition so we skip the transitionConditions check
        let newNode = getDialogueNodeById(playModeCharID, toNodeID);
        let playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(newNode);

        renderPlayMode(playModeNodeInfo);
        return;
    }

    if (lineObject.transitionConditions.length > 0) {
        console.log('condition found');
        $('.answerLine').append(`<div class="playModeExplainer">There is a condition that needs to be met before you can progress to the next dialogue. Click on the button to fulfill it.</div><button class="conditionButton btn" data-from-node="${fromNodeID}" data-to-node="${toNodeID}">Fulfill condition: ${lineObject.transitionConditions[0].variableName}${lineObject.transitionConditions[0].comparisonOperator}${lineObject.transitionConditions[0].variableValue}</button>`);

    } else {
        //no condition, move to next
        let newNode = getDialogueNodeById(playModeCharID, toNodeID);
        let playModeNodeInfo = getInfoByPassingInDialogueNodeOrElement(newNode);

        renderPlayMode(playModeNodeInfo);
    }

}




