/* This function will recursively loop through the entire project object and write it to the page as nodes */
function drawDialogueMakerProject() {

    //store the previously create node after every node creation so right parents can be appended to. Don't change this for answer nodes, because they should all go inside the same parent (the question node)
    let latestNode = '';
    //store every node, including answers in this one for line appending:

    //loop through each character
    for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
        //console.log(gameDialogueMakerProject.characters[i].characterName);

        let currI = gameDialogueMakerProject.characters[i];
        /* Creating the character roots here  */

        //empty the existing element
        //currI.nodeElement = '';

        //set some values for the stuff inside the characterNodeHTML
        characterNodeHTML.strictSelect('.blockid').val(`${currI.characterID}`);
        characterNodeHTML.strictSelect('.characterName').val(`${currI.characterName}`);
        currI.nodeElement.attr('id', `char${currI.characterID}`);
        currI.nodeElement.html(characterNodeHTML);

        latestNode = currI.nodeElement;
        //myLog(`latestNode ${JSON.stringify(latestNode) }`,3,fileInfo = getFileInfo())

        //loop through all dialogue nodes of a character
        for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {
            //console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText);
            //append the dialogue node to the previous dialogue node. But if it's a answer node, maybe it needs to be appended to the closest question node.

            let currJ = gameDialogueMakerProject.characters[i].dialogueNodes[j];

            let dialogueNode = createDialogueNode(currJ.nodeElement, currJ.dialogueID, currJ.dialogueType, currJ.dialogueText, currJ.nextNode, currJ.dialogueNodeX, currJ.dialogueNodeY, currJ.outgoingSockets, currJ.outgoingLines); // nodeElement, dialogueID,dialogueType,

            //calculate rigid dialogue block position:
            //for x we need to know for answer nodes if the node has siblings (nodes connecting to the same parent node). 

            let rigidX;
            let rigidY = 138 * (j + 1);

            myLog(`rigid y ${rigidY}`, 0, fileInfo = getFileInfo());
            if (currJ.dialogueType == "answer") {
                rigidX = ((currJ.siblings - 1) * 320 * -1) + currJ.siblingNumber * 320; //NOTE: ONLY answernodes have a siblingNumber
                rigidY = ((currJ.siblingNumber + 1) * 277) - currJ.siblingNumber * 277; //so that answer "siblings" are created at same height
            }

            //let me try overwriting those mathmatically calculated values from values inside the actual nodes instead
            rigidX = currJ.dialogueNodeX;
            rigidY = currJ.dialogueNodeY;


            //for y I think we can check how many non-answer nodes there are

            dialogueNode.appendTo(latestNode) //latestnode is set below after append
                .draggable({
                    drag: function (event, ui) {
                        //console.log('dragging');
                        updateLines(ui.helper); //called only when dragged
                    },
                    stop: function (event, ui) {
                        var position = ui.position;
                        console.log("Element stopped at: (" + position.left + ", " + position.top + ")");
                        // Your code to update some other element or data
                        updateElementPositionInObject(ui.helper); //update master object positions

                    }
                })
                .css({ top: rigidY + 'px', left: rigidX + 'px', position: 'absolute' }); //absolute needs to be called AFTER draggable



            //set the appended node to be the new lastestNode (except for answers)
            if (currJ.dialogueType !== 'answer') {
                latestNode = dialogueNode;
                //console.log('latest node set to ' + latestNode.attr("class"));
            }
            //this is set also for answers because the are parents for lines
            latestNodeForLines = dialogueNode;

            //loop through the lines of a dialogue node
            for (let k = 0; k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length; k++) {

                myLog(`line ${k} array length: ${gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length}`, 0, fileInfo = getFileInfo());

                //NOTE! The lines are loop through again below, after the nodes are in dom

            }//end k loop

        } //end j loop

        //ADD THE CHARACTER TO THE DOM

        gameDialogueMakerProject.characters[i].nodeElement.prependTo('#mainArea')
            .draggable({
                drag: function (event, ui) {
                    //console.log('dragging');
                    updateLines(ui.helper); //called only when dragged


                },
                stop: function (event, ui) {
                    var position = ui.position;
                    myLog(("Element stopped at: (" + position.left + ", " + position.top + ")"),3);
                    // Your code to update some other element or data
                    updateElementPositionInObject(ui.helper); //update master object positions
                }
            })
            .css({ left: gameDialogueMakerProject.characters[i].characterNodeX, top: gameDialogueMakerProject.characters[i].characterNodeY });

        addAutoResize();

        //loop through the object AGAIN to create the lines:

        //FIRST THE CHARACTERS AND THEIR LINES

        for (let c = 0; c < gameDialogueMakerProject.characters[i].outgoingLines.length; c++) {

            let currLine = gameDialogueMakerProject.characters[i].outgoingLines[c]; //line we are handling currently

            let plusButtonElem = $(currI.nodeElement).find('.blockPlusButton');

            let lineEndNodeId = currLine.toNode;

            let lineEndNode = currI.dialogueNodes.find(obj => obj.dialogueID == lineEndNodeId);

            let lineEndNodeElement = lineEndNode.nodeElement;

            //get the top socket
            let lineEndElementTopSocket = $(lineEndNodeElement).find('.topConnectionSocket');

            //TO DO: Implement this pointanchor thing to center the ends of the lines https://anseki.github.io/leader-line/#pointanchor
    
            //draw lines from characterRoot (should be only one):
            let theLine = new LeaderLine(
                plusButtonElem.get(0), //get(0) converts jQuery object to regular dom object
                lineEndElementTopSocket.get(0),
                {
                    color: '#0075ff',
                    size: 4,
                    dash: false,
                    path: 'straight', //deafult is straight, arc, fluid, magnet, grid
                    startSocket: 'bottom',
                    endSocket: 'bottom',
                    endPlug: 'disc'
                }
            );

            currLine.lineElem = theLine; //stores a reference to the actual line into the object
            
        }

        //loop through all dialogue nodes of a character
        for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {

     
            //loop through the lines of a dialogue node
            for (let k = 0; k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length; k++) {

                let lineStartNode = gameDialogueMakerProject.characters[i].dialogueNodes[j].nodeElement; //node which we are handling currently


                let currLine;

                //check that there are lines
                if (gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length != 0) {
                    currLine = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k]; //line we are handling currently
                }

                //select the correct plus button to draw the line from
                let plusButtonToConnectTo = currLine.fromSocket;

                let plusButtonElem = $(lineStartNode).find('.blockPlusButton[data-buttonindex="' + plusButtonToConnectTo + '"]');

                let lineEndNodeId = currLine.toNode;

                let lineEndNode = currI.dialogueNodes.find(obj => obj.dialogueID == lineEndNodeId);

                if (lineEndNode){ //check that it's not undefined

                    let lineEndNodeElement = lineEndNode.nodeElement;

                    //get the top socket
                    let lineEndElementTopSocket = $(lineEndNodeElement).find('.topConnectionSocket');

                    let theLine = new LeaderLine(
                        plusButtonElem.get(0), //get(0) converts jQuery object to regular dom object
                        lineEndElementTopSocket.get(0),
                        {
                            color: '#0075ff',
                            size: 4,
                            dash: false,
                            path: 'straight', //deafult is straight, arc, fluid, magnet, grid
                            startSocket: 'bottom',
                            endSocket: 'bottom',
                            endPlug: 'disc'
                        }
                    );

                    myline = theLine; //just a global tester

                    currLine.lineElem = theLine;

                }//end if lineEndNode

                

                //myLine.start is the native way of selecting the fromNode but only seems to work for the reference, not for dom
                //myLine.end is the native way of selecting the toNode

                //maybe store the line reference in the master object and then select from there?


            }//end k loop

        } //end j loop

    } // end i loop

} // end function drawDialogueMakerProject