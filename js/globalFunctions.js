/* For adding globally accessible functions, not all have been moved here yet though */

/* Block content creation */

/* NEED TO MARK THE TOPCONNECTIONSOKCET HASLINE ATTRIBUTE DYNAMICALLY */

function createQuestionBlock(nodeInfo){

    //closed or open eye:
    let determinedEyeImageSource = determineEyeImageSource(nodeInfo);
   

    //console.log('create question block for ', nodeInfo);

    let plusButtonHTML = '';
    //add as many plus buttons as needed
    for (i = 0; i < nodeInfo.dialogueNode.outgoingSockets; i++) {

        plusButtonHTML += `<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`;

    }


    let blockHTML = `<div data-character-id="${nodeInfo.characterID}" data-dialogue-id="${nodeInfo.dialogueID}" data-hidechildren="${nodeInfo.dialogueNode.hideChildren}" id="dialogue${nodeInfo.dialogueID}" class="blockWrap dialogue ui-draggable ui-draggable-handle" style="top: ${nodeInfo.dialogueNode.dialogueNodeY}px; left: ${nodeInfo.dialogueNode.dialogueNodeX}px; position: absolute;">

        <div class="contentWrap">
            <div style="display: flex; align-items:center; justify-content: center;">
                <div class="topConnectionSocket" data-hasline="false"><div class="roundSocket"></div></div>
            </div>
            <div id="id${nodeInfo.dialogueID}" class="block" style="background-color: #4b4b4b;">
                <div class="dialoguNodeTopRow" style="text-align: left;">
                    <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid" style="width: 15%; display:inline-block;" readonly="" type="number" value="${nodeInfo.dialogueID}">
                        <img class="eyeImage dialogueNodeEye" src="${determinedEyeImageSource}" alt="eye" width="24" height="24">
                        </div>

                        <select name="blockType" class="selectBlockType">
                            <option value="line">Line</option>
                            <option value="question" selected="">Question</option>
                            <option value="fight">Fight</option>
                        </select>


                        <textarea class="dialogueTextArea" placeholder="" data-autoresize="" style="height: 48px;">${nodeInfo.dialogueNode.dialogueText}</textarea>

                        <div class="optionsUnderDialogue" style="text-align: right;">
                            <div class="option1">
                                Answers: <input class="answerNumber" type="number" min="2" max="9" value="${nodeInfo.dialogueNode.outgoingSockets}">
                            </div>
                            <div class="option2"></div>
                            <div class="option3"></div>
                        </div>



                </div>
                <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                   ${plusButtonHTML}
                </div>
            </div>`

    jQueryBlockHTML = $(blockHTML);

    return jQueryBlockHTML;
            
}


function createAnswerBlock(nodeInfo){

    //console.log('create answer block for ', nodeInfo);

    //closed or open eye:
    let determinedEyeImageSource = determineEyeImageSource(nodeInfo);

    let plusButtonHTML = `<div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>`;
    //only one plus buttons is needed

    let blockHTML = `<div data-character-id="${nodeInfo.characterID}" data-dialogue-id="${nodeInfo.dialogueID}" data-hidechildren="${nodeInfo.dialogueNode.hideChildren}" id="dialogue${nodeInfo.dialogueID}" class="blockWrap dialogue ui-draggable ui-draggable-handle" style="top: ${nodeInfo.dialogueNode.dialogueNodeY}px; left: ${nodeInfo.dialogueNode.dialogueNodeX}px; position: absolute;">

        <div class="contentWrap">
            <div style="display: flex; align-items:center; justify-content: center;">
                <div class="topConnectionSocket" data-hasline="false"><div class="roundSocket"></div></div>
            </div>
            <div id="id${nodeInfo.dialogueID}" class="block" style="background-color: #4b4b4b;">
                <div class="dialoguNodeTopRow" style="text-align: left;">
                    <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid" style="width: 15%; display:inline-block;" readonly="" type="number" value="${nodeInfo.dialogueID}">
                        <img class="eyeImage dialogueNodeEye" src="${determinedEyeImageSource}" alt="eye" width="24" height="24">
                        </div>

                        <select name="blockType" class="selectBlockType">
                            <option value="line" >Line</option>
                            <option value="answer" selected="">Answer</option>
                            <option value="fight">Fight</option>
                        </select>


                        <textarea class="dialogueTextArea" placeholder="" data-autoresize="" style="height: 48px;">${nodeInfo.dialogueNode.dialogueText}</textarea>

                        <div class="optionsUnderDialogue" style="text-align: right;">
                            <div class="option1">
                               
                            </div>
                            <div class="option2"></div>
                            <div class="option3"></div>
                        </div>



                </div>
                <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                    ${plusButtonHTML}
                </div>
            </div>`;

    jQueryBlockHTML = $(blockHTML);

    return jQueryBlockHTML;

};



function createLineBlock(nodeInfo){
    //console.log('create line block for ', nodeInfo );

    //closed or open eye:
    let determinedEyeImageSource = determineEyeImageSource(nodeInfo);

    let activeNextNode ='';  
    if (nodeInfo.dialogueNode.nextNode > 0) { //only display the number if it's greater than zero
        activeNextNode = nodeInfo.dialogueNode.nextNode;
    }

    let option3content = '';
    //if it has no outgoing lines, add next input
    if (nodeInfo.dialogueNode.outgoingLines.length < 1){
        option3content = `<span style="text-align: right;" title="Optional value. Use this if you want to take the conversation to some other node from here.">Next:</span><input class="next"
    style="display:inline-block;" type="number" value="${activeNextNode}">`
    }

    let plusButtonHTML = `<div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>`;
    //only one plus buttons is needed for lines

    
    let blockHTML = `<div data-character-id="${nodeInfo.characterID}" data-dialogue-id="${nodeInfo.dialogueID}" data-hidechildren="${nodeInfo.dialogueNode.hideChildren}" id="dialogue${nodeInfo.dialogueID}" class="blockWrap dialogue ui-draggable ui-draggable-handle" style="top: ${nodeInfo.dialogueNode.dialogueNodeY}px; left: ${nodeInfo.dialogueNode.dialogueNodeX}px; position: absolute;">

        <div class="contentWrap">
            <div style="display: flex; align-items:center; justify-content: center;">
                <div class="topConnectionSocket" data-hasline="false"><div class="roundSocket"></div></div>
            </div>
            <div id="id${nodeInfo.dialogueID}" class="block" style="background-color: #4b4b4b;">
                <div class="dialoguNodeTopRow" style="text-align: left;">
                    <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid" style="width: 15%; display:inline-block;" readonly="" type="number" value="${nodeInfo.dialogueID}">
                        <img class="eyeImage dialogueNodeEye" src="${determinedEyeImageSource}" alt="eye" width="24" height="24">
                        </div>

                        <select name="blockType" class="selectBlockType">
                            <option value="line" selected="">Line</option>
                            <option value="question" >Question</option>
                            <option value="fight">Fight</option>
                        </select>


                        <textarea class="dialogueTextArea" placeholder="" data-autoresize="" style="height: 48px;">${nodeInfo.dialogueNode.dialogueText}</textarea>

                        <div class="optionsUnderDialogue" style="text-align: right;">
                            <div class="option1">
                               
                            </div>
                            <div class="option2"></div>
                            <div class="option3">${option3content}</div>
                        </div>



                </div>
                <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                    ${plusButtonHTML}
                </div>
            </div>`

    jQueryBlockHTML = $(blockHTML);

    return jQueryBlockHTML;
};



function createFightBlock(nodeInfo){
    //console.log('create fight block for ', nodeInfo);

    //closed or open eye:
    let determinedEyeImageSource = determineEyeImageSource(nodeInfo);

    let plusButtonHTML = '';
    //add as many plus buttons as needed
    for (i = 0; i < nodeInfo.dialogueNode.outgoingSockets; i++) {

        plusButtonHTML += `<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`;

    }

    let blockHTML = `<div data-character-id="${nodeInfo.characterID}" data-dialogue-id="${nodeInfo.dialogueID}" data-hidechildren="${nodeInfo.dialogueNode.hideChildren}" id="dialogue${nodeInfo.dialogueID}" class="blockWrap dialogue ui-draggable ui-draggable-handle" style="top: ${nodeInfo.dialogueNode.dialogueNodeY}px; left: ${nodeInfo.dialogueNode.dialogueNodeX}px; position: absolute;">

        <div class="contentWrap">
            <div style="display: flex; align-items:center; justify-content: center;">
                <div class="topConnectionSocket" data-hasline="false"><div class="roundSocket"></div></div>
            </div>
            <div id="id${nodeInfo.dialogueID}" class="block" style="background-color: #4b4b4b;">
                <div class="dialoguNodeTopRow" style="text-align: left;">
                    <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid" style="width: 15%; display:inline-block;" readonly="" type="number" value="${nodeInfo.dialogueID}">
                        <img class="eyeImage dialogueNodeEye" src="${determinedEyeImageSource}" alt="eye" width="24" height="24">
                        </div>

                        <select name="blockType" class="selectBlockType">
                            <option value="line" >Line</option>
                            <option value="question" >Question</option>
                            <option value="fight" selected="">Fight</option>
                        </select>


                        Fight ID: <input class="fightID">

                        <div class="optionsUnderDialogue" style="text-align: right;">
                            <div class="option1">
                               
                            </div>
                            <div class="option2"></div>
                            <div class="option3"></div>
                        </div>



                </div>
                <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                    <div class="blockPlusButton fightWin" title="If fight was won" data-buttonindex=0 data-acceptclicks=true>+</div>
                    <div class="blockPlusButton fightLose" title="If fight was lost" data-buttonindex=1 data-acceptclicks=true>+</div>
                </div>
            </div>`

    jQueryBlockHTML = $(blockHTML);

    return jQueryBlockHTML;
};


function determineEyeImageSource(nodeInfo){

    let eyeImageSource;

    if (!('hideChildren' in nodeInfo.dialogueNode)) { //in case the property is missing
        nodeInfo.dialogueNode.hideChildren = false;
    }
    if (nodeInfo.dialogueNode.hideChildren == false) {

        eyeImageSource = 'img/iconmonstr-eye-filled-32.png'

    } else {

        eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png'

    }

    return eyeImageSource;

}