
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

                rigidX = currJ.siblingNumber*290;

            }

            //for y I think we can check how many non-answer nodes there are

            

            dialogueNode.appendTo(latestNode) //latestnode is set below after append
                .draggable({
                    drag: function (event, ui) {
                        //console.log('dragging');
                        updateLines($(this).find('.block')); //called only when dragged
                    }
                })
            .css({ top: rigidY + 'px', left: rigidX + 'px' });

        

            //set the appended node to be the new lastestNode (except for answers)
            if (currJ.dialogueType !== 'answer'){
                latestNode = dialogueNode;
                //console.log('latest node set to ' + latestNode.attr("class"));
            }
            //this is set also for answers because the are parents for lines
            latestNodeForLines = dialogueNode;

          } //end j loop

        

        gameDialogueMakerProject.characters[i].nodeElement.prependTo('#mainArea')
            .draggable({
                drag: function (event, ui) {
                    //console.log('dragging');
                    updateLines($(this).find('.block')); //called only when dragged
                }
            })
        .css({ top: 10, left: 10 });

        addAutoResize();

      } // end i loop


    /* LOOP A SECOND TIME AFTER APPEND FOR LINES: */

//loop through each character
for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {

    //loop through all dialogue nodes of a character
    for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {
        //console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText);
        //append the dialogue node to the previous dialogue node. But if it's a answer node, maybe it needs to be appended to the closest question node.


        //set the appended node to be the new lastestNode (except for answers)
        if (gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueType !== 'answer') {

            //console.log('latest node set to ' + latestNode.attr("class"));
        }
 
        //loop through all outgoing lines of a dialogue node
        for (let k = 0; k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length; k++) {
            //console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].fromNode);

            let x1 = 14; //gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeX
            let y1 = gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeY;

            //for the second node I think we need to search the nodes based on the toNode value of the line and take it's x and y

            //find the node to connect to based on the outgoingLine's toNode: 
            const foundObject = gameDialogueMakerProject.characters[i].dialogueNodes.find(obj => obj.dialogueID == gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].toNode);

            gameDialogueMakerProject.characters[i].dialogueNodes[j].nodeElement.addClass('blockWrap');
            let connectionNode1 = gameDialogueMakerProject.characters[i].dialogueNodes[j].nodeElement;
            let connectionNode2 = foundObject.nodeElement; //access the actual div of the wrap (hopefully)

            let x2 = foundObject.dialogueNodeX + 14;
            let y2 = foundObject.dialogueNodeY + 50;

            let block1 = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].fromNode;
            let block2 = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].toNode;
            let buttonindex = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].fromSocket;

            //console.log(`x1: ${x1} y1: ${y1} x2: ${x2} y2: ${y2} before calling createline latestNodeForLines is: ${latestNodeForLines}`)

            createLine(x1, y1, x2, y2, block1, block2, buttonindex, latestNodeForLines, connectionNode1, connectionNode2); //x1, y1, x2, y2, block1, block2, buttonindex, latest html parent element. //block1 and block2 are html element id's 

            //loop through all transition conditions of a line
            for (let l = 0; l < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].transitionConditions.length; l++) {
                console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].transitionConditions[l].variableName);

            } //end l loop

        } //end k loop

    } //end j loop

   
}

 // end i loop

} // end function drawDialogueMakerProject

drawDialogueMakerProject();





 //auto resize text area, the textareas need  data-autoresize attribute, also need to call addAutoResize() after adding to dom:
 function addAutoResize() {
    document.querySelectorAll('[data-autoresize]').forEach(function (element) {
        element.style.boxSizing = 'border-box';
        var offset = element.offsetHeight - element.clientHeight;
        element.addEventListener('input', function (event) {
            event.target.style.height = 'auto';
            event.target.style.height = event.target.scrollHeight + offset + 'px';
        });
        element.removeAttribute('data-autoresize');
    });
}

function createDialogueNode(nodeElement,dialogueIDSent,dialogueType,dialogueText,nextNode,dialogueNodeX,dialogueNodeY,outgoingSockets,outgoingLines){
   //answers should have read-only selects
    let selectElementContentBasedOnParentBlockType = ``;
    let storyIdToAssignBasedOnBlockType;
    //Dialogue box placeholder is also depending on the type
    let dialoguePlaceholderBasedOnParentBlockType = ``;
    let blockOptionsOption1 ="";
    let blockOptionsOption2 ="";
    let blockOptionsOption3 = `<span style=" text-align: right;">Next:</span><input class="next"
    style="display:inline-block;" type="number">`;
    let singlePlusButton = '<div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>';
    let plusButtons = singlePlusButton;

    if (dialogueType == "line"){

        selectElementContentBasedOnParentBlockType = `

        <select name="blockType" class="selectBlockType">
            <option value="line">Line</option>
            <option value="question">Question</option>
            <option value="fight">Fight</option>
        </select>
        `
        dialoguePlaceholderBasedOnParentBlockType = "Type the dialogue here";
 

        //console.log(`inside line and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);
        

    } else if (dialogueType == "question") { //note that the previous node was a question so now we are actually creating an answer



        selectElementContentBasedOnParentBlockType =  
        `
        <select name="blockType" class="selectBlockType">
            <option value="line">Line</option>
            <option value="question" selected>Question</option>
            <option value="fight">Fight</option>
        </select>

        `

        blockOptionsOption1 = 

        `
            Answers: <input class="answerNumber" type="number" min="2" max="9" value=${outgoingSockets}>
        `;

        //add as many plus buttons as there are outgoingSockets
       for (i=1; i < outgoingSockets; i++){

            plusButtons += `<div class="blockPlusButton" data-buttonindex=${i} data-acceptclicks=true>+</div>`;
       
        }
        

    } else if (dialogueType == "answer") {

        selectElementContentBasedOnParentBlockType = `

        <select name="blockType" class="selectBlockType">
            <option value="answer">answer</option>
        </select>
        `
       
        dialoguePlaceholderBasedOnParentBlockType = "Type the answer option here";

    
} else if (dialogueType == "fight") {


    selectElementContentBasedOnParentBlockType = `

    <select name="blockType" class="selectBlockType">
        <option value="line">Line</option>
        <option value="question">Question</option>
        <option value="fight">Fight</option>
    </select>
    `
    dialoguePlaceholderBasedOnParentBlockType = "Type the fight name here";

}


    //console.log('dialogueIDSent: ' + dialogueIDSent);
    nodeElement.classList = "blockWrap";
    nodeElement.append(`

                <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket">o</div>
                </div>
                    <div id="id${dialogueIDSent}" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${dialogueIDSent}">
                        </div>
                        ${selectElementContentBasedOnParentBlockType}
                        <textarea class="dialogue" placeholder="${dialoguePlaceholderBasedOnParentBlockType}" data-autoresize>${dialogueText}</textarea>
                        <div>
                        <div class="optionsUnderDialogue" style="text-align: right;">
                            <div class="option1">${blockOptionsOption1}</div>
                            <div class="option2">${blockOptionsOption2}</div>
                            <div class="option3">${blockOptionsOption3}</div>
                        </div>
                        </div>

                        
                    </div>
                    <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                        ${plusButtons}
                    </div>
                </div>
                        `);
      
    return nodeElement;
}

