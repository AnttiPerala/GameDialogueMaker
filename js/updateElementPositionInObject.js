function updateElementPositionInObject(element){

    console.log('Inside updateElementPositionInObject, element is: ', element);

//check if characterRoot or regular node:
    if (element.hasClass('characterRoot')) {
        // Do something if the element has the class characterRoot

        let character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, ''); //characterID
        let theNodeObjectToChange = getCharacterById(character);
        //myLog(`character: ${character}`,1,fileInfo = getFileInfo())
        const xPos = element.get(0).offsetLeft;
        const yPos = element.get(0).offsetTop;

        theNodeObjectToChange.characterNodeX = xPos;
        theNodeObjectToChange.characterNodeY = yPos;

    } else {
        // Do something else if the element does not have the class
        //update object
        //myLog(`dragging ${element.attr('id')}`, 1);

        let character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, '');//strip char from id


        theNodeObjectToChange = getDialogueNodeById(character, element.attr('id').replace(/\D/g, ''));

        //console.log(` character: ${character} and node id: ${element.attr('id').replace(/\D/g, '')}`);

        //const rect = element.getBoundingClientRect();
        //const xPos = rect.left + window.scrollX;
        const xPos = element.get(0).offsetLeft;
        const yPos = element.get(0).offsetTop;

        theNodeObjectToChange.dialogueNodeX = xPos;
        theNodeObjectToChange.dialogueNodeY = yPos;    

    }

    if (!eraseMode) { //don't do any of this stuff is the eraser is being used because it might cause drawing twice

      storeMasterObjectToLocalStorage();

    }//end if eraseMode

}

