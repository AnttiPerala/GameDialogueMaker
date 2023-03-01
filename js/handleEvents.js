


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
                updateElementPositionInObject();
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



//MOUSE DOWN LOG FOR EASIER DEBUGGING
$(document).mousedown(function () {
   //console.log("NEW MOUSEDOWN!!!!!!!");
});





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

    // Check if the clicked element is the line itself or a child of the line.
    if (!$(event.target).is('.conditionCircle')) {

        if (!event.shiftKey) {

            $('.line').removeClass('selected');
            $(this).addClass('selected');


        }
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



//TYPE IN THE CHARACTER NAME FIELD
jQuery(document).on('change keyup', '.characterName', function () {

    let valueTyped = $(this).val();

    let nodeToUpdate = findCharacterNodeBasedOnPassedInHtmlElement(this);

    nodeToUpdate.characterName = valueTyped;

})

//UPDATE THE MASTER OBJECT WHEN A TEXT FIELD IS CHANGED
$(document).on('change keyup', 'textarea.dialogue', function () {



    let updatedText = $(this).val();

    let nodeToUpdate = findDialogueNodeBasedOnPassedInHtmlElement(this);

    nodeToUpdate.dialogueText = updatedText;

    

})

//UPDATE THE MASTER OBJECT WHEN A SELECT OPTION IS CHANGED
$(document).on('change', '.selectBlockType', function () {

    let updatedValue = $(this).val();

    let nodeToUpdate = findDialogueNodeBasedOnPassedInHtmlElement(this);

    nodeToUpdate.dialogueType = updatedValue;

})

//UPDATE THE MASTER OBJECT WHEN THE NUMBER OF ANSWERS IS CHANGED
$(document).on('change', '.answerNumber', function () {

    let updatedValue = $(this).val();

    let nodeToUpdate = findDialogueNodeBasedOnPassedInHtmlElement(this);

    nodeToUpdate.outgoingSockets = updatedValue;

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

/* CLICK ON THE CONDITION CIRCLE TO EXPAND IT */
jQuery(document).on('click', '.conditionCircle', function () {

    //check if the circle already contains the inputs
    if ($(this).find('.conditionInputsWrap').length) {
        console.log('The parent element already contains a child with the class ".conditionInputsWrap"');
    } else {

        $(this).append(`
        <div class="conditionInputsWrap">
        <h3>Add a condition for the transition</h3>
        <input type="text" class="variableName elementInfoField" placeholder="Variable name to check" value="">
        <select class="comparisonOperator">
            <option value="&lt;">&lt;</option>
            <option value="&gt;">&gt;</option>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value="&gt;=">&gt;=</option>
            <option value="&lt;=">&lt;=</option>
        </select>
        <input type="text" class="variableValue elementInfoField" placeholder="Variable value" value="">
        <button class="okTransition">ADD</button>

        </div>
        `);

    } //end else
    
    $(this).animate({
        width: '20vw',
        height: '20vw'
    }, 800);



})

/* CLICK ON THE CONDITION CIRCLE OK BUTTON TO ACCEPT THE CONDITION */

jQuery(document).on('click', '.conditionCircle .okTransition', function () {

console.log('OK');

    let parentLine = $(this).closest('.line'); //grab the line the circle belongs to
    let conditionCircle = $(this).closest('.conditionCircle');

    let variableNameFromInput = $(conditionCircle).find('.variableName').val();
    let comparisonOperatorFromInput = $(conditionCircle).find('.comparisonOperator').val();
    let variableValueFromInput = $(conditionCircle).find('.variableValue').val();

    myElem = {
        'block1': parentLine.data('block1'),
        'block2': parentLine.data('block2'),
        'variableName': variableNameFromInput,
        'comparisonOperator': comparisonOperatorFromInput,
        'variableValue': variableValueFromInput,

    }

    //NOTE! What we set with .data() will NOT be visible in the HTML! It's only in memory. .attr() makes visible also in html
    //let's give this multiple data attributes at the same time:
    $(conditionCircle).data({
        'block1': parentLine.data('block1'),
        'block2': parentLine.data('block2'),
        'variableName': variableNameFromInput,
        'comparisonOperator': comparisonOperatorFromInput,
        'variableValue': variableValueFromInput
    
    });//end data


}) //end click


//CHANGE BLOCK SIZE WHEN RANGE SLIDER IS MOVED

$('#blocksize').on('change input', function(){
    //console.log(`change ${$(this).val()}`);
    //$('.selected').css("width", $(this).val());
    let scaleValue = $(this).val()/100;
    $('.selected').css({ 'transform': 'scale(' + scaleValue + ')'});
    //$('.block input').css("font-size", $(this).val()/8+10 +'px');
    selectedSize = scaleValue;
})

//CHANGE ZOOM WHEN RANGE SLIDER IS MOVED

    $('#zoomAmount').on('change input', function () {
       //console.log(`change zoom to ${$(this).val()} %`);
        //$('.selected').css("width", $(this).val());
        let zoomValue = $(this).val();
        $('#mainArea').css({ 'zoom': zoomValue + '%' });
        //$('.block input').css("font-size", $(this).val()/8+10 +'px');
        
    })

//DELETE SAVE FROM LOCAL STORAGE

const deleteSaveButton = document.querySelector("#delete");

deleteSaveButton.addEventListener("click", function () {
    localStorage.removeItem("gameDialogueMakerProject");
    alert("Save deleted!");
});

//ESC ENDS ALL SPECIAL MODES
$(document).keydown(function (event) {
    if (event.keyCode === 27) { // 27 is the keyCode for "Esc" key
        eraseMode = false;
        //when clone mode is on:
        if (eraseMode) {
            $('body').css('cursor', 'url(iconmonstr-eraser-1-48.png) 16 32, auto');
        } else {
            $('body').css('cursor', 'unset');
        }
    }
});