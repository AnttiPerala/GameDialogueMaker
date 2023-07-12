function repositionElementAfterChangeInParent(element, newParent){

    //i think both element and parent are .blockWraps


    // Get current absolute position
    var rect = element.get(0).getBoundingClientRect();

    // Get absolute position of the new parent
    var newParentRect = newParent.get(0).getBoundingClientRect();

    // Compute the position difference
    var diffTop = rect.top - newParentRect.top;
    var diffLeft = rect.left - newParentRect.left;

    let objectElementToChange = findDialogueObjectBasedOnPassedInHtmlElement($(element).find('.blockid'));


    // Set position
   
    objectElementToChange.characterNodeX = diffLeft;
    objectElementToChange.characterNodeY = diffTop;

}