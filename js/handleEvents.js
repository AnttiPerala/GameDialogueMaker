//CLICK ON THE MAIN PLUS BUTTON TO ADD A NEW CHARACTER 

$('.plus').on('click', function () {

    //calculate where to place the item

    let newBlockPosition = 0;
    if (newBlockId < 20) {

        newBlockPosition = newBlockId * 5;

    } else {

        newBlockPosition = 20;

    }

    $(`
             <div class="blockWrap">
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket">o</div>
                </div>
                    <div id="id0" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="next"
                                style="width: 15%; display:inline-block;" type="number">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name">
                        <select name="blockType" class="selectBlockType">
                            <option value="line">Line</option>
                            <option value="question">Question</option>
                            <option value="fight">Fight</option>

                        </select>
                        <textarea placeholder="Dialogue" data-autoresize></textarea>
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
                        <div class="blockPlusButton" data-buttonindex=0>+</div>
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

});



//CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW NODE


$('body').on('click', '.blockPlusButton', function () {


    //for line connections a bit more down in the code:

    const theClickedPlusButton = $(this);

    let selectedBlock = $(this).closest('.blockWrap').find('.block');

    let topMostParent = $(this).closest('.blockWrap');

    //calculate where to place the item

    let newBlockPositionY = 0;
    let newBlockPositionX = 0;

    newBlockPositionY = $(this).position().top - 30;
    newBlockPositionX = $(this).position().left - 55;
    console.log("newBlockPositionY: " + newBlockPositionY + $(this).attr("class"));


    let newBlock = $(`
               <div class="blockWrap">
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket">o</div>
                </div>
                    <div id="id0" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="next"
                                style="width: 15%; display:inline-block;" type="number">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name">
                        <select name="blockType" class="selectBlockType">
                            <option value="line">Line</option>
                            <option value="question">Question</option>
                            <option value="fight">Fight</option>

                        </select>
                        <textarea placeholder="Dialogue" data-autoresize></textarea>
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
                        <div class="blockPlusButton" data-buttonindex=0>+</div>
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

    console.log('newBlockID' + newBlockId);

    //add line connection

    newBlock.find('.block').attr('id', 'id' + newBlockId);

    newBlockId++;

    //let plusButton = selectedBlock.parents('.blockWrap').find('.blockPlusButton');
    let topSocket = $(newBlock).find('.topConnectionSocket');


    let x1Pos = theClickedPlusButton.offset().left + theClickedPlusButton[0].getBoundingClientRect().width / 2;
    let y1Pos = theClickedPlusButton.offset().top + theClickedPlusButton[0].getBoundingClientRect().height / 2;
    let x2Pos = topSocket.offset().left + topSocket[0].getBoundingClientRect().width / 2;
    let y2Pos = topSocket.offset().top + topSocket[0].getBoundingClientRect().height / 2;

    createLine(x1Pos, y1Pos, x2Pos, y2Pos, selectedBlock.attr('id'), $(newBlock).find('.block').attr('id'), theClickedPlusButton.data('buttonindex'));

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
    console.log("NEW MOUSEDOWN!!!!!!!");
});


let allConnectedLines;

function updateLines(element) {

    //passed in _element_ is the block, not the blockWrap

    //globalCheck = $(element).attr('id');

    //select the lines connected to the element we are moving based on the data attributes on the lines
    let allConnectedLines = $('.line[data-block1="' + $(element).attr('id') + '"],.line[data-block2="' + $(element).attr('id') + '"]');

    console.log('ELEMENT id is ' + $(element).attr('id') + ' allConnectedLines length: ' + allConnectedLines.length);


    //for redrawing them we need to loop through all the selected lines and for each of them we will get the two data attributes, then select two blocks based on those attributes and get the coordinates of those blocks for redrawing
    //finally we destroy the old connected lines

    allConnectedLines.each(function (i, e) {

        //console.log('inside allConnectedLines.each and the current element id is: ' + $(e).attr('id'));

        let lineBlockConnect1 = $(e).data('block1'); //get the block ids from the lines
        let lineBlockConnect2 = $(e).data('block2');
        let plusButtonNumberConnectedTo = $(e).data('buttonindextoconnectto');

        console.log('lineBlockConnect1: ' + lineBlockConnect1 + ' lineBlockConnect2: ' + lineBlockConnect2);

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
        console.log('question');

        jQuery(this).closest('.blockWrap').find('.optionsUnderDialogue').children('.option1').append(`
            Answers: <input class="answerNumber" type="number" min="2" max="99" value=3>
        `)

        //append more plus buttons
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').append('<div class="blockPlusButton" data-buttonindex=1>+</div>');
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').append('<div class="blockPlusButton" data-buttonindex=2>+</div>');

        jQuery(this).closest('.blockWrap').find('textarea').attr("placeholder", "Type the question");

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
        jQuery(this).closest('.blockWrap').find('.plusButtonContainer').first().append(`<div class="blockPlusButton" data-buttonindex=${i}>+</div>`);
        
    }

    //when the number is lowered, we need to delete the blocks connected to the deleted plus buttons:

    $(blockWrap).find('.line').each(function (index) {

        console.log(`this.attr("data-block2") ${$(this).attr("data-block2")}`);

        console.log('inside each loop for lines, this $(this).attr("data-buttonindextoconnectto") is: ' + $(this).attr("data-buttonindextoconnectto") + 'and selectedValue is' + selectedValue);

        if ($(this).attr("data-buttonindextoconnectto") > selectedValue-1){

            //select the end node of the line
            let endNode = $(this).attr("data-block2");

            console.log('endnode: ' + endNode);

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
jQuery(document).on('change', '.characterName', function () {

    let valueTyped = $(this).val();

    $(this).parents('.blockWrap').find('.characterName').val(valueTyped);

})
