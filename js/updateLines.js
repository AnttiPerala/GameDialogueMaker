
let allConnectedLines;

//when the mainArea is dragged or an update for all lines is needed for some reason
function updateAllLines() {
    gameDialogueMakerProject.characters.forEach((character) => {
        character.dialogueNodes.forEach((dialogueNode) => {
            dialogueNode.outgoingLines.forEach((outgoingLine) => {
                const lineElem = outgoingLine.lineElem;
                lineElem.position(); //LeaderLine function call
            });
        });
    });
}

function updateLines(element) { //element is the dragged node dom element

    console.log('calling updateLines');

    console.log('element id: ' + element.attr('id'));

    let parent = element.parent();

    let character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, '');//strip char from id

    let justTheIdNumber = element.attr('id').replace(/\D/g, ''); //strip "dialogue" from the id

    let justTheIdNumberForParent = parent.attr('id').replace(/\D/g, ''); //strip "dialogue" from the id

    console.log('just the id number: ' + justTheIdNumber);

    let theNodeInTheMasterObject = getDialogueNodeById(character, justTheIdNumber);

    let theParentNodeInTheMasterObject = getDialogueNodeById(character, justTheIdNumberForParent);

    console.log('theNodeInTheMasterObject: ' + theNodeInTheMasterObject);

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
                console.log('should update linelem next, elem is: ' + line);
                line.lineElem.position();
            }
        }
        
    }

    

    //if not null, loop through each line for PARENT
    if (theParentNodeInTheMasterObject) {
        for (let i = 0; i < theParentNodeInTheMasterObject.outgoingLines.length; i++) {
            let line = theParentNodeInTheMasterObject.outgoingLines[i];
            console.log('should update linelem next, elem is: ' + line);
            line.lineElem.position();
        }
    }



    allConnectedLines = $(element).parent().find('.line');

    myelems = allConnectedLines;

    allConnectedLines.each(function (i, e) {

       

        console.log('each lines, line number: ' + i)

        //createLine(x1Pos, y1Pos, x2Pos, y2Pos, block1.attr('id'), block2.attr('id'), plusButtonNumberConnectedTo, latestNodeForLines);

        e.get(0).position();
    })

}


function getDialogueNodeById(charID, id) {
    console.log(`inside getDialogueNodeById and characterID is ${charID}`);
    const character = gameDialogueMakerProject.characters.find(char => char.characterID == charID);
    if (!character) {
        return null; // character not found
    }
    const node = character.dialogueNodes.find(node => node.dialogueID == id);
    return node || null; // return node if found, else null
}