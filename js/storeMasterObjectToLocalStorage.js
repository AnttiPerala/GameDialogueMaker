let myObjectTest;

function storeMasterObjectToLocalStorage() {

    //console.log('trying to store to local storage');

    
        // remove HTML element references from the master object (these should then be recreated by redrawing the entire object)
        for (let character of gameDialogueMakerProject.characters) {
            character.nodeElement = '';
            for (let dialogueNode of character.dialogueNodes) {
                dialogueNode.nodeElement = '';
                dialogueNode.nextNodeLineElem = '';
                for (let outgoingLine of dialogueNode.outgoingLines) {
                    outgoingLine.lineElem = '';
                }
            }
        }

        //myLog(`Should store object now: ${gameDialogueMakerProject}`, 1, fileInfo = getFileInfo());

        localStorage.setItem("gameDialogueMakerProject", JSON.stringify(gameDialogueMakerProject));

        const $element = $('#save img');

        // Add the class
        $element.addClass('flashgreen');

        // Remove the class after 1 second
        setTimeout(() => {
            $element.removeClass('flashgreen');
        }, 1000);



        //put some empty divs back in the object
        for (let character of gameDialogueMakerProject.characters) {
            character.nodeElement = $('<div class="blockWrap characterRoot"></div>');
            for (let dialogueNode of character.dialogueNodes) {
                dialogueNode.nodeElement = $('<div></div>');
                for (let outgoingLine of dialogueNode.outgoingLines) {
                    outgoingLine.lineElem = '';
                }
            }
        }

        //delete everything

        clearCanvasBeforeReDraw();

        //redraw object

        drawDialogueMakerProject();
    
    //$('svg').css({ 'zoom': zoomValue + '%' }); //also change the lines zoom

  
}
