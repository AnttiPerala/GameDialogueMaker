
let allConnectedLines;

//when the mainArea is dragged or an update for all lines is needed for some reason
function updateAllLines() {

    if (!eraseMode) {
        
        gameDialogueMakerProject.characters.forEach((character) => {

            //all lines of character nodes
            character.outgoingLines.forEach((outgoingLine) => {
                const lineElem = outgoingLine.lineElem;

                // check if lineElem is an instance of LeaderLine
                if (lineElem instanceof LeaderLine) {
                    lineElem.position(); // call the position function on the instance
                } else {
                    console.error('lineElem is not an instance of LeaderLine');
                }
            });

            //all lines of regular dialogue nodes
            character.dialogueNodes.forEach((dialogueNode) => {
                dialogueNode.outgoingLines.forEach((outgoingLine) => {
                    const lineElem = outgoingLine.lineElem;
                    lineElem.position(); //LeaderLine function call
                });
            });
        });
        //$('svg').css({ 'zoom': zoomValue + '%' }); //also change the lines zoom
        
    }//end if eraseMode
    

}

function updateLines(element) { //element is the dragged node dom element

    console.log(` Hello from updateLines`);

    if (!eraseMode){

        $(".conditionCircle").hide();

        //myLog('calling updateLines', 1, fileInfo = getFileInfo());

        //myLog(('element id: ' + element.attr('id')), 1, fileInfo = getFileInfo());

        //scoping

        let parent;

        let character;

        let justTheIdNumber;

        let justTheIdNumberForParent;

        //check if the dragged element is a character root and handle line drawing a bit differently in that case

        if (element.hasClass('characterRoot') || element.parent().hasClass('characterRoot')) { //just update everything if its the root or it's parent is the root


            character = element.attr('id').replace(/\D/g, '');//strip char from id
            updateAllLines();

        } else {
            // Do something else if the element does not have the class
            parent = element.parent(); //the previous node, not needed for a characterRoot node

            character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, '');//strip char from id

            justTheIdNumber = element.attr('id').replace(/\D/g, ''); //strip "dialogue" from the id

            justTheIdNumberForParent = parent.attr('id').replace(/\D/g, ''); //strip "dialogue" from the id

            //myLog(`just the id number: ${justTheIdNumber}`, 1, fileInfo = getFileInfo())

        }



        let theNodeInTheMasterObject = getDialogueNodeById(character, justTheIdNumber);

        let theParentNodeInTheMasterObject = getDialogueNodeById(character, justTheIdNumberForParent);

        //myLog(('theNodeInTheMasterObject: ' + theNodeInTheMasterObject), 1, fileInfo = getFileInfo());

        //start looping from the parents lines and after that loop through each child also, but how? I think it's enough to get the relevant children by taking the nodes of a character with a bigger ID

        const characterToLoop = gameDialogueMakerProject.characters.find(char => char.characterID == character);
        // Start iterating from dialogueID 2
        let startIndex = characterToLoop.dialogueNodes.findIndex(d => d.dialogueID == justTheIdNumberForParent);

        // Iterate until the last node
        for (let i = startIndex; i < characterToLoop.dialogueNodes.length; i++) {
            let node = characterToLoop.dialogueNodes[i];
            // Do something with the node
            //if not null, loop through each line
            if (node) {
                for (let i = 0; i < node.outgoingLines.length; i++) {
                    let line = node.outgoingLines[i];
                    //console.log('should update linelem next, elem is: ' + line);
                    line.lineElem.position();
                }
            }

        }


        //if not null, loop through each line for PARENT
        if (theParentNodeInTheMasterObject) {
            for (let i = 0; i < theParentNodeInTheMasterObject.outgoingLines.length; i++) {
                let line = theParentNodeInTheMasterObject.outgoingLines[i];
                //myLog(('should update linelem next, elem is: ' + line), 1, fileInfo = getFileInfo());
                line.lineElem.position();
            }
        }


        allConnectedLines = $(element).parent().find('.line');

        myelems = allConnectedLines;

        allConnectedLines.each(function (i, e) {



            e.get(0).position();
        })


    }//end if erasemode

    

}


