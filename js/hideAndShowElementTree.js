$(document).on('click', '.eyeImage', function (event) {

    var currentImage = $(this).attr('src');

    //find out if we clicked on a character or individual dialogue node
    if ($(this).hasClass('dialogueNodeEye')) {
        //regular dialogue
        console.log('regular dialogue eye');
        let dialogueNodeInObject = getInfoByPassingInDialogueNodeOrElement(this).dialogueNode;

        // Check if the hideChildren property is missing and set it to false if needed
        if (!('hideChildren' in dialogueNodeInObject)) {
            dialogueNodeInObject.hideChildren = false;
        }

        if (currentImage === 'img/iconmonstr-eye-off-filled-32.png') {
            dialogueNodeInObject.hideChildren = false;
        } else {
            dialogueNodeInObject.hideChildren = true;
        }

    } else {
        //character
        let characterNodeInObject = getInfoByPassingInDialogueNodeOrElement(this).characterNode;

        // Check if the hideChildren property is missing and set it to false if needed
        if (!('hideChildren' in characterNodeInObject)) {
            characterNodeInObject.hideChildren = false;
        }

        if (currentImage === 'img/iconmonstr-eye-off-filled-32.png') {
            characterNodeInObject.hideChildren = false;
        } else {
            characterNodeInObject.hideChildren = true;
        }

    } //end else character

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();
});
