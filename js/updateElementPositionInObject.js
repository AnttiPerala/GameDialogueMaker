function updateElementPositionInObject(element){

//update object
console.log(`dragging ${element.attr('id')}`);

let character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, '');//strip char from id

   


    theNodeObjectToChange = getDialogueNodeById(character, element.attr('id').replace(/\D/g, ''));

    console.log(` character: ${character} and node id: ${element.attr('id').replace(/\D/g, '') }`);

    //const rect = element.getBoundingClientRect();
    //const xPos = rect.left + window.scrollX;
    const xPos = element.get(0).offsetLeft;
    const yPos = element.get(0).offsetTop;

    theNodeObjectToChange.dialogueNodeX = xPos;
    theNodeObjectToChange.dialogueNodeY = yPos;

storeMasterObjectToLocalStorage();


}
