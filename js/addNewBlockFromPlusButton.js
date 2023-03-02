

//CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW NODE


$('body').on('click', '.blockPlusButton', function () {

    if ($(this).attr('data-acceptclicks') == 'true') {

        //for line connections a bit more down in the code:

        const theClickedPlusButton = $(this);

        let clickedPlusButtonButtonIndex = theClickedPlusButton.attr('data-buttonindex');

        let selectedBlock = $(this).closest('.blockWrap').find('.block');

        let topMostParent = $(this).closest('.blockWrap');

        let parentBlockType = $(this).closest('.blockWrap').find('.selectBlockType').val();

        let parentBlockCharacterName = $(this).closest('.blockWrap').find('.characterName').val();

        let parentBlockNextInputField = $(this).closest('.blockWrap').find('.next');

        //console.log(`parentBlockType ${parentBlockType}`);

        let characterObject = findCharacterNodeBasedOnPassedInHtmlElement(this);

        let previousDialogueNodeInMasterObject = findDialogueNodeBasedOnPassedInHtmlElement(this);

        //get the biggest dialogueID so far in the character

        let biggestDialogueID = 0;

        characterObject.dialogueNodes.forEach(function (node) {
            if (node.dialogueID > biggestDialogueID) {
                biggestDialogueID = node.dialogueID;
            }
        });

        //add a line from the previous node to the new node:
        previousDialogueNodeInMasterObject.outgoingLines.push(
            {
                fromNode: previousDialogueNodeInMasterObject.dialogueID,
                fromSocket: clickedPlusButtonButtonIndex,
                toNode: biggestDialogueID+1,
                lineElem: '',
                transitionConditions: [
                    {
                        variableName: 'myvar',
                        comparisonOperator: '=',
                        variableValue: 'false'
                    }
                ]
            }
        )


        if (parentBlockType == "line" || parentBlockType == "answer") {

  
            let newDialogueNode = {
                dialogueID: biggestDialogueID+1,
                dialogueType: 'line',
                dialogueText: 'This is a new dialogue node!',
                nextNode: -1,
                dialogueNodeX: previousDialogueNodeInMasterObject.dialogueNodeX + 200,
                dialogueNodeY: previousDialogueNodeInMasterObject.dialogueNodeY + 200,
                outgoingSockets: 1,
                nodeElement: $('<div></div>'),
                outgoingLines: [
                   
                ]
            };

            gameDialogueMakerProject.characters[0].dialogueNodes.push(newDialogueNode);

        } else if (parentBlockType == "question") { //parent is question so this should be an answer


            let newDialogueNode = {
                dialogueID: biggestDialogueID+1,
                dialogueType: 'answer',
                siblings: 3,
                siblingNumber: 1,
                dialogueText: 'Fine thank you',
                nextNode: -1,
                dialogueNodeX: previousDialogueNodeInMasterObject.dialogueNodeX + 200,
                dialogueNodeY: previousDialogueNodeInMasterObject.dialogueNodeX + 200,
                outgoingSockets: 1,
                nodeElement: $('<div></div>'),
                outgoingLines: [

                ] //end lines
            };

            gameDialogueMakerProject.characters[0].dialogueNodes.push(newDialogueNode);

        }

        $('#mainArea').get(0).innerHTML = '';
        $('svg').remove();
        drawDialogueMakerProject();

  
    }//end if data-acceptclicks = true;

});
