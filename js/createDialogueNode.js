function createDialogueNode(nodeElement, dialogueIDSent, dialogueType, dialogueText, nextNode, dialogueNodeX, dialogueNodeY, outgoingSockets, outgoingLines) {
    //answers should have read-only selects
    let selectElementContentBasedOnParentBlockType = ``;
    let storyIdToAssignBasedOnBlockType;
    //Dialogue box placeholder is also depending on the type
    let dialoguePlaceholderBasedOnParentBlockType = ``;
    let blockOptionsOption1 = "";
    let blockOptionsOption2 = "";
    let blockOptionsOption3 = `<span style=" text-align: right;">Next:</span><input class="next"
    style="display:inline-block;" type="number">`;
    let singlePlusButton = '<div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>';
    let plusButtons = singlePlusButton;

    if (dialogueType == "line") {

        selectElementContentBasedOnParentBlockType = `

        <select name="blockType" class="selectBlockType">
            <option value="line">Line</option>
            <option value="question">Question</option>
            <option value="fight">Fight</option>
        </select>
        `
        dialoguePlaceholderBasedOnParentBlockType = "Type the dialogue here";


        //console.log(`inside line and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);


    } else if (dialogueType == "question") { //note that the previous node was a question so now we are actually creating an answer



        selectElementContentBasedOnParentBlockType =
            `
        <select name="blockType" class="selectBlockType">
            <option value="line">Line</option>
            <option value="question" selected>Question</option>
            <option value="fight">Fight</option>
        </select>

        `

        blockOptionsOption1 =

            `
            Answers: <input class="answerNumber" type="number" min="2" max="9" value=${outgoingSockets}>
        `;

        //add as many plus buttons as there are outgoingSockets
        for (i = 1; i < outgoingSockets; i++) {

            plusButtons += `<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`;

        }


    } else if (dialogueType == "answer") {

        selectElementContentBasedOnParentBlockType = `

        <select name="blockType" class="selectBlockType">
            <option value="answer">answer</option>
        </select>
        `

        dialoguePlaceholderBasedOnParentBlockType = "Type the answer option here";


    } else if (dialogueType == "fight") {


        selectElementContentBasedOnParentBlockType = `

    <select name="blockType" class="selectBlockType">
        <option value="line">Line</option>
        <option value="question">Question</option>
        <option value="fight">Fight</option>
    </select>
    `
        dialoguePlaceholderBasedOnParentBlockType = "Type the fight name here";

    }


    myLog(`dialogueIDSent: ${dialogueIDSent}`, 0, fileInfo = getFileInfo());
    nodeElement.get(0).id = `dialogue${dialogueIDSent}`;
    nodeElement.get(0).classList = "blockWrap";
    nodeElement.append(`

                <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket">o</div>
                </div>
                    <div id="id${dialogueIDSent}" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${dialogueIDSent}">
                        </div>
                        ${selectElementContentBasedOnParentBlockType}
                        <textarea class="dialogue" placeholder="${dialoguePlaceholderBasedOnParentBlockType}" data-autoresize>${dialogueText}</textarea>
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

    return nodeElement;
}
