

//CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW DIALOGUE NODE


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

        let characterObject = getInfoByPassingInDialogueNodeOrElement(this).characterNode;

        let previousDialogueNodeInMasterObject = findDialogueObjectBasedOnPassedInHtmlElement(this);
        

        let earlierObjectBGColor = previousDialogueNodeInMasterObject.bgColor;

        //get the biggest dialogueID so far in the character

        let biggestDialogueID = getMaxDialogueNodeId(characterObject)

        //check if it's a characterRoot node:

        if ($(topMostParent).hasClass('characterRoot')){
            //console.log('rooooot');
            //console.log('characterObject: ' + characterObject.characterName);
            //add a line from the previous node to the new node:
            characterObject.outgoingLines.push(
                {
                    fromNode: 0,
                    fromSocket: clickedPlusButtonButtonIndex,
                    toNode: biggestDialogueID + 1,
                    lineElem: '',
                    transitionConditions: [
                        
                    ]
                }
            );

            let newDialogueNode = {
                dialogueID: biggestDialogueID + 1,
                dialogueType: 'line',
                dialogueText: 'This is a new dialogue node!',
                nextNode: -1,
                dialogueNodeX: 0,
                dialogueNodeY: 200, //these can be hardcoded since they are relative values relative to their parent nodes 
                outgoingSockets: 1,
                bgColor: earlierObjectBGColor,
                nodeElement: $('<div></div>'),
                outgoingLines: [

                ]
            };

            characterObject.dialogueNodes.push(newDialogueNode);
            //console.log(newDialogueNode);

        } else {
            //was not characterRoot


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
                    toNode: biggestDialogueID + 1,
                    lineElem: '',
                    transitionConditions: [
                        
                    ]
                }
            )


            if (parentBlockType == "line" || parentBlockType == "answer" || parentBlockType == "fight") {


                let newDialogueNode = {
                    dialogueID: biggestDialogueID + 1,
                    dialogueType: 'line',
                    dialogueText: 'This is a new dialogue node!',
                    nextNode: -1,
                    dialogueNodeX: 0,
                    dialogueNodeY: 200,
                    outgoingSockets: 1,
                    bgColor: earlierObjectBGColor,
                    nodeElement: $('<div></div>'),
                    outgoingLines: [

                    ]
                };

                characterObject.dialogueNodes.push(newDialogueNode);
                //console.log(newDialogueNode);


            } else if (parentBlockType == "question") { //parent is question so this should be an answer


                let newDialogueNode = {
                    dialogueID: biggestDialogueID + 1,
                    dialogueType: 'answer',
                    siblings: 3,
                    siblingNumber: Number(clickedPlusButtonButtonIndex)+1,
                    dialogueText: 'Fine thank you',
                    nextNode: -1,
                    dialogueNodeX: (previousDialogueNodeInMasterObject.dialogueNodeX - 382) + (clickedPlusButtonButtonIndex *(382)),
                    dialogueNodeY: 200,
                    outgoingSockets: 1,
                    bgColor: earlierObjectBGColor,
                    nodeElement: $('<div></div>'),
                    outgoingLines: [

                    ] //end lines
                };

                characterObject.dialogueNodes.push(newDialogueNode);

            }

        } //end else (not hasClass characterRoot)




        clearCanvasBeforeReDraw();
        drawDialogueMakerProject();

  
    }//end if data-acceptclicks = true;

});

