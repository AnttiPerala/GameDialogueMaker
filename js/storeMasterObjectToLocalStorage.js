let myObjectTest;

function storeMasterObjectToLocalStorage() {

    // make a deep copy of gameDialogueMakerProject using structuredClone()
    const gameDialogueMakerProjectWithoutHtmlElements = window.structuredClone(gameDialogueMakerProject);

    // remove HTML element references from the copy
    for (let character of gameDialogueMakerProjectWithoutHtmlElements.characters) {
        for (let dialogueNode of character.dialogueNodes) {
            dialogueNode.nodeElement = '';
            for (let outgoingLine of dialogueNode.outgoingLines) {
                outgoingLine.lineElem = '';
            }
        }
    }

    console.log(`Should store object now: ${gameDialogueMakerProjectWithoutHtmlElements}`);

    localStorage.setItem("gameDialogueMakerProject", JSON.stringify(gameDialogueMakerProjectWithoutHtmlElements));
}
