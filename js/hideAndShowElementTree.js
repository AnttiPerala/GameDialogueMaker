$(document).on('click', '.eyeImage', function(event) {


    var currentImage = $(this).attr('src');

    //find out if we clicked on a character or individual dialogue node

    if ($(this).hasClass('dialogueNodeEye')){
        //regular dialogue
        console.log('regular dialogue eye');
        let dialogueNodeInObject = getInfoByPassingInDialogueNodeOrElement(this).dialogueNode;

        if (currentImage === 'img/iconmonstr-eye-off-filled-32.png') {
            //$(this).attr('src', 'img/iconmonstr-eye-filled-32.png');
            //$(this).closest('.blockWrap').find('.blockWrap').show(); //maybe drawing function is better


            dialogueNodeInObject.hideChildren = false;

        } else {

            dialogueNodeInObject.hideChildren = true;

        }

    } else {
        //character

        //console.log(` currentImage: ${currentImage}`);

        let characterNodeInObject = getInfoByPassingInDialogueNodeOrElement(this).characterNode;


        if (currentImage === 'img/iconmonstr-eye-off-filled-32.png') {
            //$(this).attr('src', 'img/iconmonstr-eye-filled-32.png');
            //$(this).closest('.blockWrap').find('.blockWrap').show(); //maybe drawing function is better


            characterNodeInObject.hideChildren = false;

        } else {

            characterNodeInObject.hideChildren = true;

            //$(this).attr('src', 'img/iconmonstr-eye-off-filled-32.png');

            //$(this).closest('.blockWrap').find('.blockWrap').hide(); //actually maybe just handle this from the drawing function
        }

    } //end else character

   

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();
});
