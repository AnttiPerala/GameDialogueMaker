/* try again from scratch, keep version 1 around in case this fails */

function updateLines(domNode){
    let matchingObjectNode = findMatchingDialogueNodeInObjectFromPassedInBlockwrap(domNode);
    let cID = findCharacterIDByPassingInDialogueNode(matchingObjectNode);
    let dID = findDialogueObjectBasedOnPassedInHtmlElement(domNode).dialogueID;
    console.log('updateLines2, domNode: ', domNode);
    const lines = getAllConnectedLines(cID, dID); //the result seems to be lines in the object (not dom)
    console.log('lines: ', lines );

    lines.forEach(line => {
        // Assuming you have a function called 'updateLineElem'
        //updateLineElem(line.get(0).lineElem);
        line.lineElem.position();
    });
    
} /* end update lines 2 */

