function createDialogueHTMLElement(dialogueNode) {

    let nodeInfo = getInfoByPassingInDialogueNodeOrElement(dialogueNode);
    let activeNextNode = '';

    if (dialogueNode.nextNode > 0){ //only display the number if it's greater than zero
        activeNextNode = dialogueNode.nextNode;
    }

    //answers should have read-only selects
    let selectElementContentBasedOnParentBlockType = ``;
    let storyIdToAssignBasedOnBlockType;
    //Dialogue box placeholder is also depending on the type
    let dialoguePlaceholderBasedOnParentBlockType = ``;
    let textAreaPlaceHolder = "";
    let blockOptionsOption1 = "";
    let blockOptionsOption2 = "";
    let blockOptionsOption3 = `<span style="text-align: right;" title="Optional value. Use this if you want to take the conversation to some other node from here.">Next:</span><input class="next"
    style="display:inline-block;" type="number" value="${activeNextNode}">`;
    //if we have a line going out from the node, then we remove the next input:
    if (dialogueNode.outgoingLines.length > 0){
        blockOptionsOption3 = ''; //make the next element empty
    }
    let singlePlusButton = '<div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>';
    let plusButtons = singlePlusButton;

    if (dialogueNode.dialogueType == "line") {

        selectElementContentBasedOnParentBlockType = `

        <select name="blockType" class="selectBlockType">
            <option value="line">Line</option>
            <option value="question">Question</option>
            <option value="fight">Fight</option>
        </select>
        `
        textAreaPlaceHolder = `<textarea class="dialogueTextArea" placeholder="Type dialogue line here" data-autoresize>${dialogueNode.dialogueText}</textarea>`;


        //console.log(`inside line and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);


    } else if (dialogueNode.dialogueType == "question") { //note that the previous node was a question so now we are actually creating an answer



        selectElementContentBasedOnParentBlockType =
            `
        <select name="blockType" class="selectBlockType">
            <option value="line">Line</option>
            <option value="question" selected>Question</option>
            <option value="fight">Fight</option>
        </select>

        `
        textAreaPlaceHolder = `<textarea class="dialogueTextArea" placeholder="Type question here" data-autoresize>${dialogueNode.dialogueText}</textarea>`;

        blockOptionsOption1 =

            `
            Answers: <input class="answerNumber" type="number" min="2" max="9" value=${dialogueNode.outgoingSockets}>
        `;

        //add as many plus buttons as there are outgoingSockets
        for (i = 1; i < dialogueNode.outgoingSockets; i++) {

            plusButtons += `<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`;

        }


    } else if (dialogueNode.dialogueType == "answer") {

        selectElementContentBasedOnParentBlockType = `

        <select name="blockType" class="selectBlockType">
            <option value="answer">answer</option>
        </select>
        `
        textAreaPlaceHolder = `<textarea class="dialogueTextArea" placeholder="Type the answer option here" data-autoresize>${dialogueNode.dialogueText}</textarea>`;



    } else if (dialogueNode.dialogueType == "fight") {


        selectElementContentBasedOnParentBlockType = `

    <select name="blockType" class="selectBlockType">
        <option value="line">Line</option>
        <option value="question">Question</option>
        <option value="fight">Fight</option>
    </select>
    `
        textAreaPlaceHolder = `<div class="fightIDWrap>">Fight ID: <input class="fightID" placeholder="Give the fight an ID here"></div>`;

        plusButtons = `<div class="blockPlusButton fightWin" title="If fight was won">+</div><div class="blockPlusButton fightLose" title="If fight was lost">+</div></div>`;

    }

    let eyeImageSource;
    //closed or open eye:
    if (!('hideChildren' in dialogueNode)) { //in case the property is missing
        dialogueNode.hideChildren = false;
    }
    if (dialogueNode.hideChildren == false) {

        eyeImageSource = 'img/iconmonstr-eye-filled-32.png'

    } else {

        eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png'

    }


    //myLog(`dialogueIDSent: ${dialogueIDSent}`, 0, fileInfo = getFileInfo());
    let dialogueElement = dialogueNode.nodeElement;
    dialogueElement.attr('data-character-id', nodeInfo.characterID);  // Adding character ID data attribute
    dialogueElement.attr('data-dialogue-id', dialogueNode.dialogueID);  // Adding dialogue ID data attribute
    dialogueElement.attr('data-hidechildren', dialogueNode.hideChildren);
    dialogueElement.get(0).id = `dialogue${dialogueNode.dialogueID}`;
    dialogueElement.get(0).classList = "blockWrap dialogue";
    dialogueElement.html(`

                <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket" data-hasline="false"><div class="roundSocket"></div></div>
                </div>
                    <div id="id${dialogueNode.dialogueID}" class="block" style="background-color: ${dialogueNode.bgColor};">
                        <div class="dialoguNodeTopRow" style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${dialogueNode.dialogueID}">
                                <img class="eyeImage dialogueNodeEye" src="${eyeImageSource}" alt="eye" width="24" height="24">
                        </div>
                        ${selectElementContentBasedOnParentBlockType}
                        <textarea class="dialogueTextArea" placeholder="${dialoguePlaceholderBasedOnParentBlockType}" data-autoresize>${dialogueNode.dialogueText}</textarea>
                        <div>
                        <div class="optionsUnderDialogue" style="text-align: right;">
                            <div class="option1">${blockOptionsOption1}</div>
                            <div class="option2">${blockOptionsOption2}</div>
                            <div class="option3">${blockOptionsOption3}</div>
                        </div>
                        </div>

                        
                    </div>
                    <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                        ${plusButtons}
                    </div>
                </div>
                        `);



    return dialogueElement;
}

