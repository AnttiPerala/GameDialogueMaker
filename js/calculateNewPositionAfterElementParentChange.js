function calculateNewPositionAfterElementParentChange(elem, newParentElem){

    console.log('calculate new position after unplug for elem', elem);

    console.log('calculate with elem ',elem );

    //this doesn't seem to do the actual parenting, it only notes the bounding client rect before a canvas redraw and then redraws 

        var wrapElement = newParentElem;

        // Get the child's current position relative to the viewport
    var rectBefore = elem.nodeElement.get(0).getBoundingClientRect();

    console.log('rectBefore ', rectBefore);

        // Append the child to the wrap
    //wrapElement.get(0).appendChild(childElement.get(0));
    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

        // Get the child's new position relative to the viewport
        //needs to be a reference from the master object since the old element gets wiped out
    var rectAfter = elem.nodeElement.get(0).getBoundingClientRect();

    console.log('rectAfter ', rectAfter);

        // Calculate the change in the child's position
        var changeInTop = rectAfter.top - rectBefore.top;
        var changeInLeft = rectAfter.left - rectBefore.left;

        let theInfo = getInfoByPassingInDialogueNodeOrElement(elem);

    let newX = elem.nodeElement.get(0).style.left = (elem.nodeElement.get(0).offsetLeft - changeInLeft);
    let newY = elem.nodeElement.get(0).style.top = (elem.nodeElement.get(0).offsetTop - changeInTop);

    theInfo.dialogueNode.dialogueNodeX = newX;
    theInfo.dialogueNode.dialogueNodeY = newY;

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();

        // Adjust the child's position to cancel out the change
   /*      childElement.style.position = 'absolute';
        childElement.style.top = (childElement.offsetTop - changeInTop) + 'px';
        childElement.style.left = (childElement.offsetLeft - changeInLeft) + 'px'; */

}