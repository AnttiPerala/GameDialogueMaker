
/* 

TO DO:

Memento pattern undo

Command pattern undo would be more efficient but harder to code

turn relevant (connected) plus buttons gray when user changes the number of answers to a question

draw a dotted line when the user connects a node to another node without the plus button (by manually setting the "next" value)


*/
let cloneMode = false;
let eraseMode = false;

//these make moving/dragging the canvas possible
$("#mainArea").draggable();
$("#mainArea").draggable('enable');

let newBlockId = 2; //give each block unique id regardless of questions/answers
let storyId = 1; //this one will remain the same for questions and their answers but otherwise changes. Not sure if I like this design choice anymore now with the new system.. Using just a single blockID sounds simpler..


//calculate where to place the item

let newBlockPosition = 0;
if (newBlockId < 20) {

    newBlockPosition = newBlockId * 5;

} else {

    newBlockPosition = 20;

}

//not actually so sure if I should create a structure where each branch is nested more and more inside. Maybe the Construct Tutorial data structure is kind of avoiding that by using ID:s

//what if we just try to handle things by dom traversal? in that situation it might be actually useful to nest nodes in the dom so that when you move the topmost node, all the children move with it

//Okay edit in 18.2.2023: I will create a master object after all, something like this:

let gameDialogueMakerProject = {
    settings: {},
    characters:[{
        characterName: 'Mike',
        characterID: 1,
        characterNodeX: 10,
        characterNodeY: 10,
        dialogueNodes: [
            {
                dialogueID: 1,
                dialogueType: 'line',
                dialogueText: 'Example dialogue, hello!',
                nextNode: 2,
                dialogueNodeX: 10,
                dialogueNodeY: 10,
                outgoingSockets: 1,
                outgoingLines: [
                    {
                        fromNode: 1,
                        fromSocket: 1,
                        toNode: 2,
                        transitionConditions: [
                            {
                                variableName: 'myvar',
                                comparisonOperator: '=',
                                variableValue: 'false'
                            }
                        ]
                    }
                ]
            },
            {
                dialogueID: 2,
                dialogueType: 'question',
                dialogueText: 'How are you today?',
                nextNode: -1,
                dialogueNodeX: 10,
                dialogueNodeY: 10,
                outgoingSockets: 3,
                outgoingLines: [
                    {
                        fromNode: 2,
                        fromSocket: 1,
                        toNode: 3,
                        transitionConditions: [
                            {
                                variableName: 'only write option if all transition conditions are true',
                                comparisonOperator: '=',
                                variableValue: 'false'
                            }
                        ]
                    },
                    {
                        fromNode: 2,
                        fromSocket: 2,
                        toNode: 5,
                        transitionConditions: [
                            {
                                variableName: 'only write option if all transition conditions are true',
                                comparisonOperator: '=',
                                variableValue: 'false'
                            }
                        ]
                    }
                ] //end lines
            },
            {
                dialogueID: 3,
                dialogueType: 'answer',
                dialogueText: 'Fine thank you',
                nextNode: 4,
                dialogueNodeX: -100,
                dialogueNodeY: 10,
                outgoingSockets: 1,
                outgoingLines: [
                    
                ] //end lines
            },
            {
                dialogueID: 5,
                dialogueType: 'answer',
                dialogueText: 'Not so great',
                nextNode: 6,
                dialogueNodeX: 250,
                dialogueNodeY: -160,
                outgoingSockets: 1,
                outgoingLines: [
                  
                ] //end lines
            }

        ]//end dialoguenodes

    }]
}
/* This function will recursively loop through the entire project object and write it to the page as nodes */
function drawDialogueMakerProject(){

    //store the previously create node after every node creation so right parents can be appended to. Don't change this for answer nodes, because they should all go inside the same parent (the question node)
    let latestNode;

    for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
        console.log(gameDialogueMakerProject.characters[i].characterName);

        let blockWrap = $('<div/>', {
            class: 'blockWrap characterRoot',
          });

        /* Creating the character roots here  */
        blockWrap.append(`
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
          
                </div>
                    <div id="id${newBlockId}" class="block">
                        <div style="text-align: left;">
                            <span style="width: 35%; display:inline-block; text-align: right;">Character ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${gameDialogueMakerProject.characters[i].characterID}">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name" value="${gameDialogueMakerProject.characters[i].characterName}">
              
                        
                    </div>
                    <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                        <div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>
                    </div>
            </div>

        `);

        addAutoResize();

        latestNode = blockWrap; //always store the latest created node here for parenting purposes (just not for answer nodes)
        
        //newBlockId++; Not needed since all values should come from object directly



        /*  */

        //loop through all dialogue nodes of a character
        for (let j = 0; j < gameDialogueMakerProject.characters[i].dialogueNodes.length; j++) {
            console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText);
            //append the dialogue node to the previous dialogue node. But if it's a answer node, maybe it needs to be appended to the closest question node.



            let dialogueNode = createDialogueNode(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueID, gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueType, gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText, gameDialogueMakerProject.characters[i].dialogueNodes[j].nextNode, gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeX, gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeY, gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingSockets, gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines); // dialogueID,dialogueType,dialogueText,nextNode,dialogueNodeX,dialogueNodeY,outgoingSockets,outgoingLines 
            //newBlockId++; //increase the global id after creating a block. Nope, take directly from object instead.

            //calculate where to place the item, other elements seem position themselves according to neighboring elements, but answers should be next to each other horizontally
            //we need the position of the parent node and the type of the node to be created for calculating the position
            //actually, we should only calculate a position if the element is completely new, since all other positions should come from the existing node information in the object
            //so actually maybe it's simplest to calculate this much earlier, at the point of clicking on a plus button
            //so all nodes should already know their exact position before even placed in the object structure

            
            dialogueNode.appendTo(latestNode) //latestnode is set below after append
            .draggable({
                drag: function (event, ui) {
                    //console.log('dragging');
                    updateLines($(this).find('.block'));
                }
            })
            .css({ top: gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeY + 'px', left: gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeX + 'px' })
           
            ;

        addAutoResize();

            //set the appended node to be the new lastestNode (except for answers)
            if (gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueType !== 'answer'){
                latestNode = dialogueNode;
                console.log('latest node set to ' + latestNode.attr("class"));
            }


            //loop through all outgoing lines of a dialogue node
            for (let k = 0; k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length; k++) {
                console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].fromNode);

                let x1 = gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeX;
                let y1 = gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueNodeY;

                //for the second node I think we need to search the nodes based on the toNode value of the line and take it's x and y

                const foundObject = gameDialogueMakerProject.characters[i].dialogueNodes.find(obj => obj.dialogueID == gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].toNode);

                let x2 = foundObject.dialogueNodeX;
                let y2 = foundObject.dialogueNodeY;

                let block1 =  gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].fromNode;
                let block2 = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].toNode;
                let buttonindex = gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].buttonindex;

                createLine(x1, y1, x2, y2, block1, block2, buttonindex); //x1, y1, x2, y2, block1, block2, buttonindex. //block1 and block2 are html element id's
                
                //loop through all transition conditions of a line
                for (let l = 0; l < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].transitionConditions.length; l++) {
                    console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines[k].transitionConditions[l].variableName);
                    
                  } //end l loop

              } //end k loop

          } //end j loop

        blockWrap.prependTo('#mainArea')
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

      } // end i loop

} // end function drawDialogueMakerProject

drawDialogueMakerProject();



function loopThroughArraysCustom(obj) {
  if (Array.isArray(obj)) { // if the object is an array
    // do custom stuff for arrays that belong to a certain object
    if (obj.length > 0 && obj[0].hasOwnProperty('characterName')) {
      // do custom stuff for arrays that belong to the "characters" object
    }
    for (let i = 0; i < obj.length; i++) {
      loopThroughArraysCustom(obj[i]); // recursively call the function with the current element
    }
  } else if (typeof obj === 'object' && obj !== null) { // if the object is an object (but not null)
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        // do custom stuff for object properties that are arrays
        if (key === 'dialogueNodes') {
          // do custom stuff for arrays that belong to the "dialogueNodes" object
        }
      }
      loopThroughArraysCustom(obj[key]); // recursively call the function with the current property value
    }
  }
}

//loopThroughArraysCustom(gameDialogueMakerProject);


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

function createDialogueNode(dialogueID,dialogueType,dialogueText,nextNode,dialogueNodeX,dialogueNodeY,outgoingSockets,outgoingLines){
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
 

        console.log(`inside line and storyIdToAssignBasedOnBlockType: ${storyIdToAssignBasedOnBlockType} the storyId was:  ${storyId}`);
        

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

       for (i=1; i < outgoingSockets; i++){
        plusButtons += singlePlusButton;
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


    
    let newBlock = $(`
            <div class="blockWrap id${dialogueID}">
                <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
                    <div class="topConnectionSocket">o</div>
                </div>
                    <div id="id${dialogueID}" class="block">
                        <div style="text-align: left;">
                            <span style="width: 15%; display:inline-block; text-align: right;">ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number" value="${dialogueID}">
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
                
            </div>
                        `);

            
            return newBlock;
}


