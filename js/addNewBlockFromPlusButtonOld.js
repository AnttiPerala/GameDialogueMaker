

//CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW NODE


$('body').on('click', '.blockPlusButton', function () {

    if ($(this).attr('data-acceptclicks') == 'true') {

        //for line connections a bit more down in the code:

        const theClickedPlusButton = $(this);

        let selectedBlock = $(this).closest('.blockWrap').find('.block');

        let topMostParent = $(this).closest('.blockWrap');

        let parentBlockType = $(this).closest('.blockWrap').find('.selectBlockType').val();

        let parentBlockCharacterName = $(this).closest('.blockWrap').find('.characterName').val();

        let parentBlockNextInputField = $(this).closest('.blockWrap').find('.next');

        //console.log(`parentBlockType ${parentBlockType}`);

        //answers should have read-only selects

        let selectElementContentBasedOnParentBlockType = ``;

        let storyIdToAssignBasedOnBlockType;

        //Dialogue box placeholder is also depending on the type

        let dialoguePlaceholderBasedOnParentBlockType = ``;

        if (parentBlockType == "line") {

            selectElementContentBasedOnParentBlockType = `

            <select name="blockType" class="selectBlockType">
                <option value="line">Line</option>
                <option value="question">Question</option>
                <option value="fight">Fight</option>
            </select>
            `
            dialoguePlaceholderBasedOnParentBlockType = "Type the dialogue here";
            storyId++;
            storyIdToAssignBasedOnBlockType = storyId;
            parentBlockNextInputField.val(storyId);

            console.log(`inside line and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);

        } else if (parentBlockType == "question") { //note that the previous node was a question so now we are actually creating an answer

            latestQuestionStoryID = storyId;

            selectElementContentBasedOnParentBlockType = `

            <select name="blockType" class="selectBlockType">
                <option value="answer${theClickedPlusButton.attr('data-buttonindex')}">answer</option>
            </select>
            `
            //notice that we are not progressing the storyID after a question node. But if the user creates other nodes before the answer node, things can get messy... thats why we have now the latestQuestionStoryID
            dialoguePlaceholderBasedOnParentBlockType = "Type the answer option here";
            storyIdToAssignBasedOnBlockType = latestQuestionStoryID;

            console.log(`inside question and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);

        } else if (parentBlockType == "answer" || "fight") {

            console.log(`inside answer and latestQuestionStoryID: ${latestQuestionStoryID} the storyId was:  ${storyId}`);

            selectElementContentBasedOnParentBlockType = `

            <select name="blockType" class="selectBlockType">
                <option value="line">Line</option>
                <option value="question">Question</option>
                <option value="fight">Fight</option>
            </select>
            `
            dialoguePlaceholderBasedOnParentBlockType = "Type the dialogue here";
            storyId++;
            storyIdToAssignBasedOnBlockType = storyId; //not sure if in right place

            parentBlockNextInputField.val(storyId);

            console.log(`inside answer and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);

        }

        //calculate where to place the item

        let newBlockPositionY = 0;
        let newBlockPositionX = 0;

        newBlockPositionY = $(this).position().top - 30;
        newBlockPositionX = $(this).position().left - 250 + (20 * (theClickedPlusButton.attr('data-buttonindex') + 1));
        //console.log("newBlockPositionY: " + newBlockPositionY + $(this).attr("class"));

        console.log(`before creating newBlock and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);

        let newBlock = $(`
                <div class="blockWrap">
                <div class="contentWrap">
                    <div style="display: flex; align-items:center; justify-content: center;">
                        <div class="topConnectionSocket">o</div>
                    </div>
                        <div id="id${newBlockId}" class="block">
                            <div style="text-align: left;">
                                <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid"
                                    style="width: 15%; display:inline-block;" readonly type="number" value="${storyIdToAssignBasedOnBlockType}">
                            </div>
                            <input type="text" class="characterName elementInfoField" placeholder="character name" value="${parentBlockCharacterName}">
                            ${selectElementContentBasedOnParentBlockType}
                            <textarea class="dialogue" placeholder="${dialoguePlaceholderBasedOnParentBlockType}" data-autoresize>CHILD NODE FOR TESTING</textarea>
                            <div>
                            <div class="optionsUnderDialogue" style="text-align: right;">
                                <div class="option1"></div>
                                <div class="option2"></div>
                                <div class="option3">
                                    <span style=" text-align: right;">Next:</span><input class="next"
                                    style="display:inline-block;" type="number">
                                </div>
                            </div>
                            </div>

                            
                        </div>
                        <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                            <div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>
                        </div>
                    </div>
                    
                </div>
                            `);

        newBlock.appendTo(topMostParent)
            .draggable({
                drag: function (event, ui) {
                    //console.log('dragging');
                    updateLines($(this).find('.block'));
                    updateElementPositionInObject();
                }
            })
            .css({ top: newBlockPositionY + 'px', left: newBlockPositionX + 'px' })
            .children('.block')
            //.attr('id', 'id' + newBlockId);
            ;

        addAutoResize();

        //console.log('newBlockID' + newBlockId);

        //add line connection

        newBlock.find('.block').attr('id', 'id' + newBlockId);

        newBlockId++;

        //let plusButton = selectedBlock.parents('.blockWrap').find('.blockPlusButton');
        let topSocket = $(newBlock).find('.topConnectionSocket');

        //make the plus button no longer accept new clicks (while it already has a connection line)

        $(theClickedPlusButton).html('-').addClass('disabled').attr('data-acceptclicks', false);


        let x1Pos = theClickedPlusButton.offset().left + theClickedPlusButton[0].getBoundingClientRect().width / 2;
        let y1Pos = theClickedPlusButton.offset().top + theClickedPlusButton[0].getBoundingClientRect().height / 2;
        let x2Pos = topSocket.offset().left + topSocket[0].getBoundingClientRect().width / 2;
        let y2Pos = topSocket.offset().top + topSocket[0].getBoundingClientRect().height / 2;

        createLine(x1Pos, y1Pos, x2Pos, y2Pos, selectedBlock.attr('id'), $(newBlock).find('.block').attr('id'), theClickedPlusButton.data('buttonindex'), latestNodeForLines);

        //when a plus plutton is used to create a new connected node the next field of the parent node should automatically take the value of the connected nodes storyId except for question/answer combos where next for the question can be left empty

    }//end if data-acceptclicks = true;

});

