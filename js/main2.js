
/* 

TO DO:

Memento pattern undo

Command pattern undo would be more efficient but harder to code

turn relevant (connected) plus buttons gray when user changes the number of answers to a question

draw a dotted line when the user connects a node to another node without the plus button (by manually setting the "next" value)


*/
let cloneMode = false;
let eraseMode = false;
let latestNodeForLines;

//these make moving/dragging the canvas possible
$("#mainArea").draggable();
$("#mainArea").draggable('enable');



/* This function will recursively loop through the entire project object and write it to the page as nodes */
function drawDialogueMakerProject(){

    //store the previously create node after every node creation so right parents can be appended to. Don't change this for answer nodes, because they should all go inside the same parent (the question node)
    let latestNode;
    //store every node, including answers in this one for line appending:
    
    //loop through each character
    for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
        //console.log(gameDialogueMakerProject.characters[i].characterName);

        let currI = gameDialogueMakerProject.characters[i];
        /* Creating the character roots here  */

        //set some values for the stuff inside the characterNodeHTML
        characterNodeHTML.strictSelect('.blockid').val(`${currI.characterID}`);
        characterNodeHTML.strictSelect('.characterName').val(`${currI.characterName}`);
        currI.nodeElement.attr('id', `char${currI.characterID}`);
        currI.nodeElement.append(characterNodeHTML);

        latestNode = currI.nodeElement;
        
        //loop through all dialogue nodes of a character
        for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {
            //console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText);
            //append the dialogue node to the previous dialogue node. But if it's a answer node, maybe it needs to be appended to the closest question node.

            let currJ = gameDialogueMakerProject.characters[i].dialogueNodes[j];

            let dialogueNode = createDialogueNode(currJ.nodeElement, currJ.dialogueID, currJ.dialogueType, currJ.dialogueText, currJ.nextNode, currJ.dialogueNodeX, currJ.dialogueNodeY, currJ.outgoingSockets, currJ.outgoingLines); // nodeElement, dialogueID,dialogueType,
            
            //calculate rigid dialogue block position:
            //for x we need to know for answer nodes if the node has siblings (nodes connecting to the same parent node). 

            let rigidX;
            let rigidY;
            if (currJ.dialogueType == "answer"){

                rigidX = ((currJ.siblings-1)*320) - currJ.siblingNumber*320;
                rigidY = currJ*190 - currJ.siblingNumber*190;

            }

            //for y I think we can check how many non-answer nodes there are

            

            dialogueNode.appendTo(latestNode) //latestnode is set below after append
                .draggable({
                    drag: function (event, ui) {
                        //console.log('dragging');
                        updateLines(ui.helper); //called only when dragged
                    }
                })
            .css({ top: rigidY + 'px', left: rigidX + 'px', position: 'absolute' }); //absolute needs to be called AFTER draggable

        

            //set the appended node to be the new lastestNode (except for answers)
            if (currJ.dialogueType !== 'answer'){
                latestNode = dialogueNode;
                //console.log('latest node set to ' + latestNode.attr("class"));
            }
            //this is set also for answers because the are parents for lines
            latestNodeForLines = dialogueNode;

            //loop through the lines of a dialogue node
            for (let k = 0; k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length; k++){

                console.log(`line ${k} array length: ${gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length}`);

                let lineStartNode = gameDialogueMakerProject.characters[i].dialogueNodes[j].nodeElement; //node which we are handling currently

                let currLine; 
                
                //check that there are lines
                if (gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length != 0){
                    currLine = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k]; //line we are handling currently
                }

                

                let lineEndNodeId = currLine.toNode;

                let lineEndNode = currI.dialogueNodes.find(obj => obj.dialogueID == lineEndNodeId);

                let lineEndNodeElement = lineEndNode.nodeElement;


                //createLine("x1", "y1", "x2", "y2", "block1", "block2", "buttonindex", latestNodeForLines, lineStartNode, lineEndNodeElement);
                
                //tried to create lines here, but it's too difficult since none of the elements are in dom

                
                

            }//end k loop

          } //end j loop

        

        gameDialogueMakerProject.characters[i].nodeElement.prependTo('#mainArea')
            .draggable({
                drag: function (event, ui) {
                    //console.log('dragging');
                    updateLines(ui.helper); //called only when dragged
                }
            })
        .css({ top: 10, left: 10 });

        addAutoResize();

        //loop through the object again to create the lines

        //loop through all dialogue nodes of a character
        for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {

            //loop through the lines of a dialogue node
            for (let k = 0; k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length; k++){

                let lineStartNode = gameDialogueMakerProject.characters[i].dialogueNodes[j].nodeElement; //node which we are handling currently

                let currLine; 
                
                //check that there are lines
                if (gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length != 0){
                    currLine = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k]; //line we are handling currently
                }

                let lineEndNodeId = currLine.toNode;

                let lineEndNode = currI.dialogueNodes.find(obj => obj.dialogueID == lineEndNodeId);

                let lineEndNodeElement = lineEndNode.nodeElement;

                new LeaderLine(
                    lineStartNode.get(0), //get(0) converts jQuery object to regular dom object
                    lineEndNodeElement.get(0),
                    {
                        color: 'blue',
                        size: 2,
                        dash: true,
                        class: 'line' // add a class to the line
                      }
                );
                
            }//end k loop

          } //end j loop

        

      } // end i loop

    


} // end function drawDialogueMakerProject

drawDialogueMakerProject();






