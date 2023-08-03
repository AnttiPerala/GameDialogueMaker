
//CLICK ON THE MAIN PLUS BUTTON TO ADD A NEW CHARACTER 

$('.plus').on('click', function () {

    let charactersSoFar = gameDialogueMakerProject.characters.length;

    let newCharacterNode = {
        characterName: 'Name the character',
        characterID: charactersSoFar+1,
        characterNodeX: 271 * (charactersSoFar + 1),
        characterNodeY: 85,
        bgColor: '#4b4b4b',
        hideChildren: false,
        nodeElement: $('<div class="blockWrap characterRoot"></div>'),
        outgoingLines: [
           
        ],
        dialogueNodes: []
    };

    gameDialogueMakerProject.characters.push(newCharacterNode);

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

});


//MOUSE DOWN LOG FOR EASIER DEBUGGING
$(document).mousedown(function () {
   //console.log("NEW MOUSEDOWN!!!!!!!");
});


//SELECT BLOCKS BY CLICKING ON THEM

$('body').on('mousedown', '.block', function (event) {

    //quit immediately if the eye image was clicked since that shouldn affect selection
    if ($(event.target).hasClass('eyeImage')) {
        return; // Don't do anything if the event was triggered on the .eyeImage
    }
    if ($(event.target).hasClass('answerNumber')) {
        return; // Don't do anything if the event was triggered on the .eyeImage
    }

    if (!eraseMode && !cloneMode) { //not erasing and the clonebrush is not active

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

//COLOR PICKER

$('#blockColor').on('change input', function () {
    //console.log(`change ${$(this).val()}`);
    let selectedDomObject = $('.selected');
    //if nothing got selected (so no node is active)
    if (selectedDomObject.length === 0){
        drawDialogueBox('Select a node first');
    } else {

        selectedDomObject.css("background-color", $(this).val());
        selectedColor = $(this).val(); //for cloning

        let characterObjectToChange = '';
        let characterID = '';
        //check if already root
        if ($(selectedDomObject).closest('.blockWrap').hasClass('characterRoot')) { //if the element is already the characterRoot

            characterID = $(selectedDomObject).closest('.blockWrap').attr('id').replace(/\D/g, ''); //get the if of character
            characterObjectToChange = getCharacterById(characterID); //send the ID number to the find function
            characterObjectToChange.bgColor = $(this).val();


        } else { //the element is not the characterRoot

            characterID = $(selectedDomObject).closest('.characterRoot').attr('id').replace(/\D/g, ''); //get just the number from the id
            let nodeId = $(selectedDomObject).closest('.blockWrap').attr('id').replace(/\D/g, '');

            //store the color also to the object
            let objectToChange = getDialogueNodeById(characterID, nodeId); //send the ID number to the find function
            objectToChange.bgColor = $(this).val();

        }


    } // end else if selectedDomObject.length !== 0

}) //END COLOR PICKER

//COPY FORMATTING BRUSH FEATURE

//enable or disable clone brush
$('#stylebrush').on('click', function () {
    cloneMode = !cloneMode; //toggle boolean

    //when clone mode is on:
    if (cloneMode) {
        $('body').css('cursor', 'url(img/iconmonstr-paintbrush-3-64.png) 16 32, auto'); //16 32 are the interaction point coordinates of the cursor #0075ff
    } else {
        $('body').css('cursor', 'unset');
    }

})


//CLICKING ON A BLOCK WITH CLONEMODE ON

$('body').on('mousedown', '.blockWrap', function () {

    let blockWrapToBeColored = this;

    if (cloneMode) {

        let selectedNode = $('.selected');
        let colorOfSelectedNode = selectedNode.css('backgroundColor');

        //check if already root
        if ($(blockWrapToBeColored).hasClass('characterRoot')) { //if the element is already the characterRoot
            //console.log(` root`);

            characterID = $(blockWrapToBeColored).attr('id').replace(/\D/g, ''); //get the if of character
            characterObjectToChange = getCharacterById(characterID); //send the ID number to the find function
            characterObjectToChange.bgColor = colorOfSelectedNode;

        } else { //the element is not the characterRoot

            //if no node was selected
            if (selectedNode.length === 0) {
                drawDialogueBox('Select the source node for the cloning first.')
            } else {

                
                //console.log('colorOfSelectedNode: ' + colorOfSelectedNode);
                /* $(this).css('transform', 'scale(' + selectedSize + ')'); */

                let blockWrapToBeColoredCharacterID = $(blockWrapToBeColored).closest('.characterRoot').attr('id').replace(/\D/g, ''); //get just the number from the id

                let blockWrapToBeColoredNodeID = $(blockWrapToBeColored).attr('id').replace(/\D/g, '');

                let objectToBeColored = getDialogueNodeById(blockWrapToBeColoredCharacterID, blockWrapToBeColoredNodeID);

                objectToBeColored.bgColor = colorOfSelectedNode; //set the color in the object

                $(blockWrapToBeColored).children().children('.block').css('background-color', colorOfSelectedNode);


            /* $(this).children('input').css('font-size', selectedFontSize); */

        }

        }//end else

    }
}
);


//SET THE BLOCK TYPE TO QUESTION

jQuery(document).on('change', '.selectBlockType', function () {

    const selectedValue = $(this).val();

        let nodeToUpdate = findDialogueObjectBasedOnPassedInHtmlElement(this);

    nodeToUpdate.dialogueType = selectedValue;
    nodeToUpdate.outgoingSockets = 3; //when changing the block type to question, set default answer amount to three also in the aobject

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

        //console.log('theQuestionBlockNextValue' + theQuestionBlockNextValue + 'childNodeIdValue' + childNodeIdValue);
        if (theQuestionBlockNextValue == childNodeIdValue){
            //console.log('match');
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
}) // end selectBlockType change


//SET THE NUMBER OF ANSWERS

jQuery(document).on('change', '.answerNumber', function () {

    const selectedValue = $(this).val();

    let dialogueNodeToUpdate = findDialogueObjectBasedOnPassedInHtmlElement(this);

    dialogueNodeToUpdate.outgoingSockets = $(this).val();

    //check for situation in which there are less plus buttons than outgoing lines and simply remove the last line
    if(dialogueNodeToUpdate.outgoingLines.length > dialogueNodeToUpdate.outgoingSockets) {
        dialogueNodeToUpdate.outgoingLines.splice( dialogueNodeToUpdate.outgoingSockets);
    }

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

/*     //remove all plus buttons
    let blockWrap = jQuery(this).closest('.blockWrap');
    
    blockWrap.findWithDepth('.blockPlusButton', 3).remove(); //here we should only remove the immediate children

    for (let i = 0; i < selectedValue; i++) {

        let newPlusButton = $(`<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`);
        
        let theDialogueElementInDOM = jQuery(this).closest('.blockWrap');

        let theDialogueElementInObject = findMatchingDialogueNodeInObjectFromPassedInBlockwrap(theDialogueElementInDOM); 
        
        //append more plus buttons
        theDialogueElementInDOM.find('.plusButtonContainer').first().append(newPlusButton);

        theDialogueElementInObject.nodeElement.find('.plusButtonContainer').first().append(newPlusButton);
        
        
        //need to turn connected plus buttons gray
        checkIfPlusButtonShouldBeTurnedOff(newPlusButton);
    } */

    //when the number is lowered, we need to delete the blocks connected to the deleted plus buttons:

    /* $(blockWrap).find('.line').each(function (index) {

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
        
    }); */

 }); //end onchange answernumber


//TYPE IN THE CHARACTER NAME FIELD
jQuery(document).on('change keyup', '.characterName', function () {

    let valueTyped = $(this).val();

    let nodeToUpdate = findCharacterNodeBasedOnPassedInHtmlElement(this);

    nodeToUpdate.characterName = valueTyped;

})

//UPDATE THE MASTER OBJECT WHEN A TEXT FIELD IS CHANGED
$(document).on('change keyup', 'textarea.dialogueTextArea', function () {


    let updatedText = $(this).val();

    let nodeToUpdate = findDialogueObjectBasedOnPassedInHtmlElement(this);

    nodeToUpdate.dialogueText = updatedText;

    

})



//UPDATE THE MASTER OBJECT WHEN THE NUMBER OF ANSWERS IS CHANGED
$(document).on('change', '.answerNumber', function () {

    let updatedValue = $(this).val();

    let nodeToUpdate = findDialogueObjectBasedOnPassedInHtmlElement(this);

    nodeToUpdate.outgoingSockets = updatedValue;

})

//REACT TO CHANGE IN THE NEXT FIELD
$(document).on('change', '.next', function () {

    let updatedValue = $(this).val();

    let nodeToUpdate = findDialogueObjectBasedOnPassedInHtmlElement(this);

    nodeToUpdate.nextNode = updatedValue;

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

})


//CLICKED ON THE EXPORT JSON BUTTON (code handled in separate exportJson.js file)
jQuery(document).on('click', '#export', function () {

   //console.log(`Export json ${this}`);
    exportJson(); //defined in separate exportJson.js file

})

//FUNCTION TO ADD EMPTY DIVS TO A LOADED JSON OBJECT
function addEmptyDivsToTheObject(){

//put some empty divs back in the object
for (let character of gameDialogueMakerProject.characters) {
    character.nodeElement = $('<div class="blockWrap characterRoot"></div>');
    for (let dialogueNode of character.dialogueNodes) {
        dialogueNode.nodeElement = $('<div></div>');
        for (let outgoingLine of dialogueNode.outgoingLines) {
            outgoingLine.lineElem = '';
        }
    }
}
    }

//CLICK ON THE LOAD JSON BUTTON
$('#openFile').click(function () {
    $('<input type="file" accept=".json">')
        .on('change', function () {
            const file = this.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        gameDialogueMakerProject = jsonData;
                        addEmptyDivsToTheObject();
                        clearCanvasBeforeReDraw();
                        drawDialogueMakerProject();
                       
                    } catch (err) {
                        console.error('Error parsing JSON:', err);
                    }
                };

                reader.readAsText(file);
               
            }
        })
        .click();
});

//CLICKED ON THE MANUAL BUTTON
jQuery(document).on('click', '#showManual', function () {

    $('#tutorial').toggle();


})

//CLICK ON THE TUTORIAL TO DESTROY IT
jQuery(document).on('click', '#tutorial', function () {

    $(this).hide();

})

/* CLICK ON THE CONDITION CIRCLE TO EXPAND IT */
jQuery(document).on('click', '.conditionCircle', function () {

    //check if the circle already contains the inputs
    if ($(this).find('.conditionInputsWrap').length) {
        //console.log('The parent element already contains a child with the class ".conditionInputsWrap"');
    } else {

        //find the line in the master object that corresponds with the clicked circle:

        let fromNode = $(this).attr('data-fromnode');
        let toNode = $(this).attr('data-tonode');

        //does this support characterRoot yet?
        let lineObjectInMasterObject = getLineObjectFromMasterObjectUsingFromAndTo(fromNode, toNode);

        let currentTransitionCondition;
        //not that we only support one condition at the moment so we wont loop through conditions, just take the first one:
        if (lineObjectInMasterObject.transitionConditions){
            currentTransitionCondition = lineObjectInMasterObject.transitionConditions[0];
        }

        

        //take the corresponding transition values from the master object:
        let comparisonOperator = '';
        let variableName = '';
        let variableValue = '';

        if (currentTransitionCondition){
            comparisonOperator = currentTransitionCondition.comparisonOperator;
            variableName = currentTransitionCondition.variableName;
            variableValue = currentTransitionCondition.variableValue;
        }

        //create a delete button only if there is a variableName (so not an empty condition)
        let deleteButton = '';
        if (variableName){
            deleteButton = '<button class="deleteTransition">DELETE</button>';
        }
        

        $(this).append(`
        <div class="conditionInputsWrap">
        <h3>Add a condition for the transition</h3>
        <input type="text" class="variableName elementInfoField" placeholder="Variable name to check" value="${variableName}">
        <select class="comparisonOperator">
            <option value="=">= Equal</option>
            <option value="!=">!= Not equal</option>
            <option value="&lt;">&lt; Less than</option>
            <option value="&gt;">&gt; Greater than</option>
            <option value="&gt;=">&gt;= Greater or equal</option>
            <option value="&lt;=">&lt;= Less or equal</option>
        </select>
        <input type="text" class="variableValue elementInfoField" placeholder="Variable value" value="${variableValue}">
        <button class="okTransition">ADD</button>
        ${deleteButton}
        </div>
        `);

        //myLog(`comparisonoperator: ${comparisonOperator}`,4,fileInfo = getFileInfo())

        // loop through each <option> element and set the selected attribute
        $(this).find('option').each(function () {
            if ($(this).val() === comparisonOperator) {
                $(this).prop('selected', true);
            }
        });

        $(this).find('.conditionInputsWrap').hide();

    } //end else
    
    $(this).animate({
        width: '30vw',
        height: '30vw'
    }, 800, function() {
        // This is the callback function
        // Add the text once the animation is complete to prevent shaking
        $(this).find('.conditionInputsWrap').show();
    });



})

/* CLICK ON THE CONDITION CIRCLE OK BUTTON TO ACCEPT THE CONDITION */

jQuery(document).on('click', '.conditionCircle .okTransition', function (event) {

    event.stopPropagation(); //so that the circle itself doesn'r register a click



    //let parentLine = $(this).closest('.line'); //grab the line the circle belongs to
    let conditionCircle = $(this).closest('.conditionCircle');

    let fromNode = $(conditionCircle).attr('data-fromnode');
    let toNode = $(conditionCircle).attr('data-tonode');

    

    //select the line object from the master object:
    let theLine = getLineObjectFromMasterObjectUsingFromAndTo(fromNode, toNode);

    //empty possible previous conditions:
    theLine.transitionConditions = [];

    //if no transition condition existed, just push a new one to the master object

    let variableNameFromInput = $(conditionCircle).find('.variableName').val();
    let comparisonOperatorFromInput = $(conditionCircle).find('.comparisonOperator').val();
    let variableValueFromInput = $(conditionCircle).find('.variableValue').val();

    let numberOrNot = checkIfNumberLike(variableValueFromInput);

    if (numberOrNot == "NaN"){
        //not a number so store as string
    } else {
        variableValueFromInput = Number(variableValueFromInput);
    }

    myElem = {

        'variableName': variableNameFromInput,
        'comparisonOperator': comparisonOperatorFromInput,
        'variableValue': variableValueFromInput,

    }

    theLine.transitionConditions.push(myElem);

    //NOTE! What we set with .data() will NOT be visible in the HTML! It's only in memory. .attr() makes visible also in html
    //let's give this multiple data attributes at the same time:
    /* $(conditionCircle).data({
        'variableName': variableNameFromInput,
        'comparisonOperator': comparisonOperatorFromInput,
        'variableValue': variableValueFromInput
    
    });//end data */

    //delete the inputs
    conditionCircle.find('.conditionInputsWrap').remove();

    //animate closed
    $(conditionCircle).animate({
        width: '1rem',
        height: '1rem',
        backgroundColor: '#ff3f34'
    }, 800);



}) //end add click

/* CLICK ON THE CONDITION CIRCLE DELETE BUTTON TO DELETE THE CONDITION */

jQuery(document).on('click', '.conditionCircle .deleteTransition', function (event) {

    event.stopPropagation(); //so that the circle itself doesn'r register a click


    //let parentLine = $(this).closest('.line'); //grab the line the circle belongs to
    let conditionCircle = $(this).closest('.conditionCircle');

    let fromNode = $(conditionCircle).attr('data-fromnode');
    let toNode = $(conditionCircle).attr('data-tonode');


    //select the line object from the master object:
    let theLine = getLineObjectFromMasterObjectUsingFromAndTo(fromNode, toNode);

    //empty possible previous conditions:
    theLine.transitionConditions = [];

    //delete the inputs
    conditionCircle.find('.conditionInputsWrap').remove();

    //animate closed
    $(conditionCircle).animate({
        width: '1rem',
        height: '1rem',
        backgroundColor: '#0075ff'
    }, 800);

   

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

var zoomTimeout;

$('#zoomAmount').on('input', function () {
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(function () {
        var zoomValue = $('#zoomAmount').val();
        $('body').css('zoom', zoomValue + '%');
        $('#header').css('zoom', 1 / (zoomValue / 100));
    }, 50); // debounce time in milliseconds
});

//DELETE SAVE FROM LOCAL STORAGE

const deleteSaveButton = document.querySelector("#delete");

deleteSaveButton.addEventListener("click", function () {
    localStorage.removeItem("gameDialogueMakerProject");

    var message = "Save deleted! Click OK to reload";
    if (window.confirm(message)) {
        window.location.href = "index.html";
    }
});

//ESC ENDS ALL SPECIAL MODES
$(document).keydown(function (event) {
    if (event.keyCode === 27) { // 27 is the keyCode for "Esc" key
        eraseMode = false;
        //when clone mode is on:
        if (eraseMode) {
            $('body').css('cursor', 'url(img/iconmonstr-eraser-1-48.png) 16 32, auto');
        } else {
            $('body').css('cursor', 'unset');
        }

        cloneMode = false;
        //when clone mode is on:
        if (cloneMode) {
            $('body').css('cursor', 'url(img/iconmonstr-eraser-1-48.png) 16 32, auto');
        } else {
            $('body').css('cursor', 'unset');
        }

        //close all conditionCircles on esc

            jQuery('.conditionCircle').each(function () {
                if (parseInt(jQuery(this).css('width')) > 32) { // 32 is equivalent to 2 rem when using pixels
                    jQuery(this).animate({
                        width: '1rem',
                        height: '1rem'
                    }, 800);
                }
                $(this).find('.conditionInputsWrap').remove(); //remove also the inputs
            });
        

    }
});

//CLOSE CONDITION CIRCLES WHEN CLICKING ON AN EMPTY SPOT IN #mainArea
jQuery(document).on('click', '#mainArea', function (event) {
    if (event.target === this) {
        // The user clicked on an empty spot inside #mainArea
        //close all conditionCircles
        jQuery('.conditionCircle').each(function () {
            if (parseInt(jQuery(this).css('width')) > 32) { // 32 is equivalent to 2 rem when using pixels
                jQuery(this).animate({
                    width: '1rem',
                    height: '1rem'
                }, 800);
            }
            $(this).find('.conditionInputsWrap').remove(); //remove also the inputs
        });
        //exit eraseMode when clicking on empty spot
        if (eraseMode){
            
            $('body').css('cursor', 'unset');
            
            eraseMode = false;

        }
        if (cloneMode) {

            $('body').css('cursor', 'unset');

            cloneMode = false;

        }

        if (playModeActive == true){
            $('.playModeDialogueContainer').remove();
            playModeActive = false;
        }
    } else {
        // The user clicked on a child element inside #mainArea
    }
});

//WARN THE USER THAT A PLUS BUTTON CAN ONLY HAVE ONE NODE CONNECTED

$(document).on('click', '.blockPlusButton[data-acceptclicks="false"]', function () {
    // Do something when the user clicks on the button
    drawDialogueBox('A plus button can only have one node connected. If you want to use it, delete the currently connected node first with the eraser.')
});
