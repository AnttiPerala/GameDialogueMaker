function updateElementPositionInObject(element){

//check if characterRoot or regular node:
    if (element.hasClass('characterRoot')) {
        // Do something if the element has the class characterRoot

        let character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, ''); //characterID
        let theNodeObjectToChange = getCharacterById(character);
        myLog(`character: ${character}`,3,fileInfo = getFileInfo())
        const xPos = element.get(0).offsetLeft;
        const yPos = element.get(0).offsetTop;

        theNodeObjectToChange.characterNodeX = xPos;
        theNodeObjectToChange.characterNodeY = yPos;

    } else {
        // Do something else if the element does not have the class
        //update object
        myLog(`dragging ${element.attr('id')}`, 1);

        let character = $(element).closest('.characterRoot').attr('id').replace(/\D/g, '');//strip char from id


        theNodeObjectToChange = getDialogueNodeById(character, element.attr('id').replace(/\D/g, ''));

        console.log(` character: ${character} and node id: ${element.attr('id').replace(/\D/g, '')}`);

        //const rect = element.getBoundingClientRect();
        //const xPos = rect.left + window.scrollX;
        const xPos = element.get(0).offsetLeft;
        const yPos = element.get(0).offsetTop;

        theNodeObjectToChange.dialogueNodeX = xPos;
        theNodeObjectToChange.dialogueNodeY = yPos;    

    }

storeMasterObjectToLocalStorage();

}

//for finding a specific character
function getCharacterById(id) {
    for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
        if (gameDialogueMakerProject.characters[i].characterID == id) {
            return gameDialogueMakerProject.characters[i];
        }
    }
    return null; // if no character is found with the given id
}
