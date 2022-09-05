
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
                    <div id="id0" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="next"
                                style="width: 15%; display:inline-block;" type="number">
                        </div>
                        <input type="text" class="elementInfoField" placeholder="character name">
                        <select name="blockType" class="selectBlockType">
                            <option value="line">Line</option>
                            <option value="question">Question</option>
                            <option value="fight">Fight</option>

                        </select>
                        <textarea placeholder="Dialogue" data-autoresize></textarea>
                        <div style="text-align: right;">
                            <span style="width: 45%; display:inline-block; text-align: right;">Next:</span><input class="next" style="width: 15%; display:inline-block;" type="number">
                        </div>

                        
                    </div>
                    <div style="display: flex; align-items: end; justify-content: center;">
                        <div class="blockPlusButton">+</div>
                    </div>
                </div><!-- end contentwrap -->
                
            </div><!-- end blockwrap -->
                        `)
        .prependTo('#mainArea')
        .draggable({
            drag: function (event, ui) {
                //console.log('dragging');
                updateLines($(this).find('.block'));
            }
        })
        .children('.block')
        .attr('id', 'id' + newBlockId)
        .css({ top: newBlockPosition, left: newBlockPosition });

    addAutoResize();

    newBlockId++;

});



//CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW NODE


$('body').on('click', '.blockPlusButton', function () {


    //for line connections a bit more down in the code:

    const theClickedPlusButton = $(this);

    let selectedBlock = $(this).parents('.blockWrap').find('.block');

    //calculate where to place the item

    let newBlockPositionY = 0;
    let newBlockPositionX = 0;

    newBlockPositionY = $(this).offset().top - 150;
    newBlockPositionX = $(this).offset().left - 125;
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
                        <input type="text" class="elementInfoField" placeholder="character name">
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

    newBlock.appendTo('#mainArea')
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

    createLine(x1Pos, y1Pos, x2Pos, y2Pos, selectedBlock.attr('id'), $(newBlock).find('.block').attr('id'));

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

        jQuery(this).parents('.blockWrap').find('.optionsUnderDialogue').children('.option1').append(`
            Answers: <input class="answerNumber" type="number" value=3>
        `)

        //append more plus buttons
        jQuery(this).parents('.blockWrap').find('.plusButtonContainer').append('<div class="blockPlusButton" data-buttonindex=1>+</div>');
        jQuery(this).parents('.blockWrap').find('.plusButtonContainer').append('<div class="blockPlusButton" data-buttonindex=2>+</div>');

        jQuery(this).parents('.blockWrap').find('textarea').attr("placeholder", "Type the question");

    }

    if (selectedValue == "line") {

        //remove all plus buttons
        jQuery(this).parents('.blockWrap').find('.blockPlusButton').remove();
        
        //then bring back just one
        jQuery(this).parents('.blockWrap').find('.plusButtonContainer').append('<div class="blockPlusButton">+</div>');

        jQuery(this).parents('.blockWrap').find('textarea').attr("placeholder", "Type the line");

    }
})


//SET THE NUMBER OF ANSWERS

jQuery(document).on('change', '.answerNumber', function () {

    const selectedValue = $(this).val();

    //remove all plus buttons
    jQuery(this).parents('.blockWrap').find('.blockPlusButton').remove();

    for (let i = 0; i < selectedValue; i++) {
        //append more plus buttons
        jQuery(this).parents('.blockWrap').find('.plusButtonContainer').append(`<div class="blockPlusButton" data-buttonindex=${i}>+</div>`);
        
    }



    }
)