function calculateNewPositionAfterElementParentChange(elem, newParentElem){

    console.log('calculate with elem ',elem );


        var childElement = elem.nodeElement;
        var wrapElement = newParentElem;

        // Get the child's current position relative to the viewport
        var rectBefore = childElement.get(0).getBoundingClientRect();

        // Append the child to the wrap
    //wrapElement.get(0).appendChild(childElement.get(0));
    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

        // Get the child's new position relative to the viewport
    var rectAfter = childElement.get(0).getBoundingClientRect();

        // Calculate the change in the child's position
        var changeInTop = rectAfter.top - rectBefore.top;
        var changeInLeft = rectAfter.left - rectBefore.left;

        let theInfo = getInfoByPassingInDialogueNodeOrElement(elem);

    theInfo.dialogueNode.dialogueNodeX = childElement.get(0).style.left = (childElement.get(0).offsetLeft - changeInLeft);
    theInfo.dialogueNode.dialogueNodeY = childElement.get(0).style.top = (childElement.get(0).offsetTop - changeInTop);

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

        // Adjust the child's position to cancel out the change
   /*      childElement.style.position = 'absolute';
        childElement.style.top = (childElement.offsetTop - changeInTop) + 'px';
        childElement.style.left = (childElement.offsetLeft - changeInLeft) + 'px'; */

}