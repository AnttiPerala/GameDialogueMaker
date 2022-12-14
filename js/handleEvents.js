//CLICK ON THE MAIN PLUS BUTTON TO ADD A NEW CHARACTER 

$('.plus').on('click', function () {

    //calculate where to place the item

    let newBlockPosition = 0;
    if (newBlockId < 20) {

        newBlockPosition = newBlockId * 5;

    } else {

        newBlockPosition = 20;

    }

    storyId++;

    $(`
             <div class="blockWrap characterRoot">
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket">o</div>
                </div>
                    <div id="id${newBlockId}" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${storyId}">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name">
                        <select name="blockType" class="selectBlockType">
                            <option value="line">Line</option>
                            <option value="question">Question</option>
                            <option value="fight">Fight</option>

                        </select>
                        <textarea class="dialogue" placeholder="Dialogue" data-autoresize></textarea>
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

                        `)
        .prependTo('#mainArea')
        .draggable({
            drag: function (event, ui) {
                //console.log('dragging');
                updateLines($(this).find('.block'));
            }
        })
        .css({ top: newBlockPosition, left: newBlockPosition })
        .find('.block')
        .attr('id', 'id' + newBlockId)
        ;
        

    addAutoResize();

    newBlockId++;
    //storyId++;

});



//CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW NODE


$('body').on('click', '.blockPlusButton', function () {

    if ($(this).attr('data-acceptclicks') == 'true'){

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

        if (parentBlockType == "line"){

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
        newBlockPositionX = $(this).position().left - 250 + (20 * (theClickedPlusButton.attr('data-buttonindex')+1));
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

        createLine(x1Pos, y1Pos, x2Pos, y2Pos, selectedBlock.attr('id'), $(newBlock).find('.block').attr('id'), theClickedPlusButton.data('buttonindex'));

        //when a plus plutton is used to create a new connected node the next field of the parent node should automatically take the value of the connected nodes storyId except for question/answer combos where next for the question can be left empty

    }//end if data-acceptclicks = true;

});


//MOVE A DRAGGABLE BLOCK WITH LINES CONNECTED TO IT

$('.blockWrap').draggable({
    drag: function (event, ui) {
        //console.log('dragging');
        //updateLines($(this).find('.block'));
        
        let allSelectedBlocks = $(this).parents().find('.block');

        allSelectedBlocks.each(function (index, elem) {
            updateLines(elem);
        });

    }
});

//MOUSE DOWN LOG FOR EASIER DEBUGGING
$(document).mousedown(function () {
   //console.log("NEW MOUSEDOWN!!!!!!!");
});


let allConnectedLines;

function updateLines(element) {

    //passed in _element_ is the block, not the blockWrap

    //globalCheck = $(element).attr('id');

    //select the lines connected to the element we are moving based on the data attributes on the lines
    let allConnectedLines = $('.line[data-block1="' + $(element).attr('id') + '"],.line[data-block2="' + $(element).attr('id') + '"]');

    //console.log('ELEMENT id is ' + $(element).attr('id') + ' allConnectedLines length: ' + allConnectedLines.length);


    //for redrawing them we need to loop through all the selected lines and for each of them we will get the two data attributes, then select two blocks based on those attributes and get the coordinates of those blocks for redrawing
    //finally we destroy the old connected lines

    allConnectedLines.each(function (i, e) {

        //console.log('inside allConnectedLines.each and the current element id is: ' + $(e).attr('id'));

        let lineBlockConnect1 = $(e).data('block1'); //get the block ids from the lines
        let lineBlockConnect2 = $(e).data('block2');
        let plusButtonNumberConnectedTo = $(e).data('buttonindextoconnectto');

        //console.log('lineBlockConnect1: ' + lineBlockConnect1 + ' lineBlockConnect2: ' + lineBlockConnect2);

        let block1 = $('#' + lineBlockConnect1); //select the block from dom
        let block2 = $('#' + lineBlockConnect2); //select the block from dom

        //pick the right plus button based on the current line
        
        //let plusButtonToUSe = $('.line[data-button_index_to_connect_to="' + plusButtonNumberConnectedTo + '"]');


        //console.log(` plusButtonNumberConnectedTo ${plusButtonNumberConnectedTo}`);

        let plusButton = block1.closest('.blockWrap').find('.blockPlusButton[data-buttonindex="' + plusButtonNumberConnectedTo + '"]');
        let topSocket = block2.closest('.blockWrap').find('.topConnectionSocket');

        let x1Pos = plusButton.offset().left + plusButton[0].getBoundingClientRect().width / 2;
        let y1Pos = plusButton.offset().top + plusButton[0].getBoundingClientRect().height / 2;
        let x2Pos = topSocket.offset().left + topSocket[0].getBoundingClientRect().width / 2;
        let y2Pos = topSocket.offset().top + topSocket[0].getBoundingClientRect().height / 2;

        $(this).remove();

        createLine(x1Pos, y1Pos, x2Pos, y2Pos, block1.attr('id'), block2.attr('id'), plusButtonNumberConnectedTo);

    })

}





//SELECT BLOCKS BY CLICKING ON THEM

$('body').on('mousedown', '.block', function () {

    if (!event.shiftKey && !cloneMode) { //not holding shift and the clonebrush is not active

        $('.block').removeClass('selected');
        $(this).addClass('selected');
        //also set the block size slider to correspond with selected cicrle size
        $('#blocksize').val(this.getBoundingClientRect().width); //note that getBoundingClientRect is vanilla js so we can't wrap this in a jQuery object
        //set these for the style cloning:
        selectedSize = this.getBoundingClientRect().width / this.offsetWidth;
        selectedColor = $(this).css('background-color');
        selectedFontSize = $(this).children('input').css('font-size');

        //console.log(` selectedSize ${selectedSize} selectedColor ${selectedColor} selectedFontSize ${selectedFontSize}`);
    }

})


//SELECT LINES BY CLICKING ON THEM

$('body').on('mousedown', '.line', function () {

    //console.log(`Line click ${''}`);

    if (!event.shiftKey) {

        $('.line').removeClass('selected');
        $(this).addClass('selected');


    }

})


//SET THE BLOCK TYPE TO QUESTION

jQuery(document).on('change', '.selectBlockType', function () {

    const selectedValue = $(this).val();

    if(selectedValue == "question"){
       //console.log('question');

        jQuery(this).closest('.blockWrap').find('.optionsUnderDialogue').children('.option1').append(`
            Answers: <input class="answerNumber" type="number" min="2" max="9" value=3>
        `)

        //append more plus buttons
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').first().append('<div class="blockPlusButton" data-buttonindex=1 data-acceptclicks=true>+</div>');
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').first().append('<div class="blockPlusButton" data-buttonindex=2 data-acceptclicks=true>+</div>');

        jQuery(this).closest('.blockWrap').find('textarea').attr("placeholder", "Type the question");

        //if there are block already connected to the block turned into a question block, change their mode to "answer". Maybe this could be done by checking the "next" values?
        let theQuestionBlockNextValue = jQuery(this).closest('.blockWrap').find('.next').first().val();
        let childNodeIdValue = jQuery(this).closest('.blockWrap').find('.blockWrap').first().find('.blockid').val();

        console.log('theQuestionBlockNextValue' + theQuestionBlockNextValue + 'childNodeIdValue' + childNodeIdValue);
        if (theQuestionBlockNextValue == childNodeIdValue){
            console.log('match');
            jQuery(this).closest('.blockWrap').children('.blockWrap').find('.selectBlockType').html(`
            <select name="blockType" class="selectBlockType">
                <option value="answer0">answer</option>
            </select>
            `)
        }

    }

    if (selectedValue == "line") {

        //remove input for number of answers
        jQuery(this).closest('.blockWrap').find('.optionsUnderDialogue').children('.option1').html('');

        //remove all plus buttons
        jQuery(this).closest('.blockWrap').find('.blockPlusButton').remove();
        
        //then bring back just one
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').append('<div class="blockPlusButton">+</div>');

        jQuery(this).closest('.blockWrap').find('textarea').attr("placeholder", "Type the line");

    }
})


//SET THE NUMBER OF ANSWERS

jQuery(document).on('change', '.answerNumber', function () {

    const selectedValue = $(this).val();

    //remove all plus buttons
    let blockWrap = jQuery(this).closest('.blockWrap');
    
    blockWrap.find('.blockPlusButton').remove();

    for (let i = 0; i < selectedValue; i++) {
        //append more plus buttons
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').first().append(`<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`);
        
    }

    //when the number is lowered, we need to delete the blocks connected to the deleted plus buttons:

    $(blockWrap).find('.line').each(function (index) {

       //console.log(`this.attr("data-block2") ${$(this).attr("data-block2")}`);

       //console.log('inside each loop for lines, this $(this).attr("data-buttonindextoconnectto") is: ' + $(this).attr("data-buttonindextoconnectto") + 'and selectedValue is' + selectedValue);

        if ($(this).attr("data-buttonindextoconnectto") > selectedValue-1){

            //select the end node of the line
            let endNode = $(this).attr("data-block2");

           //console.log('endnode: ' + endNode);

            //select and remove the block from dom

            cheeck = $('#' + endNode).closest('.blockWrap');

            cheeck.remove();

            //delete the line

            $(this).remove();


        }
        
    });



    }
)


//CLICKING ON A BLOCK WITH ERASEMODE ON

$('body').on('mousedown', '.block, .line', function () {
    if (eraseMode) {
        //console.log(`erase ${this}`);

        //loop through the connected lines that should also be erased
        let allConnectedLines = $('.line[data-block1="' + $(this).attr('id') + '"],.line[data-block2="' + $(this).attr('id') + '"]');

        $(allConnectedLines).remove();

        $(this).closest('.blockWrap').remove();

        //$(this).remove();

    }
}
);

//TYPE IN THE CHARACTER NAME FIELD
jQuery(document).on('change keyup', '.characterName', function () {

    let valueTyped = $(this).val();

    $(this).parents('.blockWrap').find('.characterName').val(valueTyped);

})


//CLICKED ON THE EXPORT JSON BUTTON (code handled in separate exportJson.js file)
jQuery(document).on('click', '#export', function () {

   //console.log(`Export json ${this}`);
    exportJson(); //defined in separate exportJson.js file

})

//CLICK ON THE TUTORIAL TO DESTROY IT
jQuery(document).on('click', '#tutorial', function () {

    this.remove();

})
