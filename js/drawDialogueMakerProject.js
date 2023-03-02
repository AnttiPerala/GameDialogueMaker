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

        latestNode = currI.nodeElement; //for appending to the correct parent. To be deprecated by connection lines based system?

        //myLog(`latestNode ${JSON.stringify(latestNode) }`,3,fileInfo = getFileInfo())

        //loop through all dialogue nodes of a character
        for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {
            //console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText);
            //append the dialogue node to the previous dialogue node. But if it's a answer node, maybe it needs to be appended to the closest question node.

            let currJ = gameDialogueMakerProject.characters[i].dialogueNodes[j];

            let dialogueNode = createDialogueNode(currJ.nodeElement, currJ.dialogueID, currJ.dialogueType, currJ.dialogueText, currJ.nextNode, currJ.dialogueNodeX, currJ.dialogueNodeY, currJ.outgoingSockets, currJ.outgoingLines); // nodeElement, dialogueID,dialogueType,

            //Question: How do we know which node we should append to. The answer can't be based on the looping order, because elements can be pushed in many ways. The only thing really telling that seems to be the line. So what if we select the line that has its 'toNode' value same as the node that we are creating and the choose the parent from the lines 'fromNode'. The only pitfall might be that what if the html element for the 'fromNode' hasn't been created yet at this point? Can we create it right then in that case?

            let theConnectingLineFromParentToNewNode = findLineThatConnectsElementToParent(currJ.dialogueID); //passing in the node id we are creating

            let theParentHtmlElement;

            if (theConnectingLineFromParentToNewNode){
                let theParentId = theConnectingLineFromParentToNewNode.fromNode;

                //select the actual html element based on the parent id:
                let theParentNode = getDialogueNodeById(gameDialogueMakerProject.characters[i].characterID, theParentId);

                theParentHtmlElement = theParentNode.nodeElement;
            }

            

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

            //if parentHtmlElement is null (could be for example because it's tha characterRoot) the use latest element instead

            if (theParentHtmlElement){
                //do nothing
            } else {
                theParentHtmlElement = latestNode; //fall back to latestNode system
            }

            //for y I think we can check how many non-answer nodes there are

            dialogueNode.appendTo(theParentHtmlElement) //latestnode is set below after append
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
            //set the id also of the svg for easier selection
            const all_svgs = document.querySelectorAll("svg");
            const this_svg = all_svgs[all_svgs.length - 1];
            this_svg.setAttribute("data-fromnode", currLine.fromNode);
            this_svg.setAttribute("data-tonode", currLine.toNode);

            let theSVGInDOM = $('svg[data-fromnode="' + currLine.fromNode + '"][data-tonode="' + currLine.toNode + '"]');

            let thePath = $(theSVGInDOM).find('.leader-line-line-path'); //If theLine is undefined, the expression will evaluate to undefined, so thePath will be undefined as well. If theLine is defined, the expression will proceed to execute theLine.find('path') and return its result.
            //Should we also save the SVG element in the object? I think the proble here is that we are trying to find the svg path from the object and not from DOM..

            //const path = document.getElementById('leader-line-5-line-path');
            const midpoint = drawConditionCircle(thePath.get(0), currLine.fromNode, currLine.toNode);
            
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

                    //set the id also of the svg for easier selection
                    const all_svgs = document.querySelectorAll("svg");
                    const this_svg = all_svgs[all_svgs.length - 1];
                    this_svg.setAttribute("data-fromnode", currLine.fromNode);
                    this_svg.setAttribute("data-tonode", currLine.toNode);

                    //every line should get at least an empty condition circle:
                    //svgInDom is already define once when giving the circle to the line from the characterRoot
                    theSVGInDOM = $('svg[data-fromnode="' + currLine.fromNode + '"][data-tonode="' + currLine.toNode + '"]');


                    //check that it's not undefined
                    if (theSVGInDOM) {

                        let thePath = $(theSVGInDOM).find('.leader-line-line-path'); //If theLine is undefined, the expression will evaluate to undefined, so thePath will be undefined as well. If theLine is defined, the expression will proceed to execute theLine.find('path') and return its result.
                        //Should we also save the SVG element in the object? I think the proble here is that we are trying to find the svg path from the object and not from DOM..

                        //const path = document.getElementById('leader-line-5-line-path');
                        const midpoint = drawConditionCircle(thePath.get(0), currLine.fromNode, currLine.toNode);

                    } else {
                        myLog(`line was undefined: ${theLine}`, 3, fileInfo = getFileInfo())
                    }


                }//end if lineEndNode


                //myLine.start is the native way of selecting the fromNode but only seems to work for the reference, not for dom
                //myLine.end is the native way of selecting the toNode
                //maybe store the line reference in the master object and then select from there?

                // Loop through the transition conditions of the current outgoing line and add a 'withCondition' class to the corresponding circles
                for (let l = 0; l < currLine.transitionConditions.length; l++) {
                    let transitionCondition = currLine.transitionConditions[l];
                    // Do something with the transition condition, e.g. compare the variable value to the variable name using the comparison operator
                    myLog(` Transition found, it's number is ${l}`,1,fileInfo = getFileInfo());

                    //select the matching circle from DOM
                    let theCircleinDOM = $('.conditionCircle[data-fromnode="' + currLine.fromNode + '"][data-tonode="' + currLine.toNode + '"]');

                    theCircleinDOM.addClass('withCondition');


                    //how can we connect the transition condition to a line? Well we should have a reference to the line element already in the object

                    
                    
                }


            }//end k loop

        } //end j loop

    } // end i loop

    //test path drawing

    
   

} // end function drawDialogueMakerProject