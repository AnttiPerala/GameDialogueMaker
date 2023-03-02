let myObjectTest;

function storeMasterObjectToLocalStorage() {

    
        // remove HTML element references from the master object (these should then be recreated by redrawing the entire object)
        for (let character of gameDialogueMakerProject.characters) {
            character.nodeElement = '';
            for (let dialogueNode of character.dialogueNodes) {
                dialogueNode.nodeElement = '';
                for (let outgoingLine of dialogueNode.outgoingLines) {
                    outgoingLine.lineElem = '';
                }
            }
        }

        myLog(`Should store object now: ${gameDialogueMakerProject}`, 1, fileInfo = getFileInfo());

        localStorage.setItem("gameDialogueMakerProject", JSON.stringify(gameDialogueMakerProject));



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

        function clearCanvasBeforeReDraw(){

            document.querySelector('#mainArea').innerHTML = '';
            $('svg').remove();
            $('.conditionCircle').remove();

        }

    clearCanvasBeforeReDraw();

        //redraw object

        drawDialogueMakerProject();
    


  
}
