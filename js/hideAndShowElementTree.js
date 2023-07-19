$(document).on('click', '.eyeImage', function(event) {


    var currentImage = $(this).attr('src');

    //console.log(` currentImage: ${currentImage}`);

    let characterNodeInObject = findCharacterNodeBasedOnPassedInHtmlElement(this);


    if (currentImage === 'img/iconmonstr-eye-off-filled-32.png') {
        //$(this).attr('src', 'img/iconmonstr-eye-filled-32.png');
        //$(this).closest('.blockWrap').find('.blockWrap').show(); //maybe drawing function is better


        characterNodeInObject.hideChildren = false;

    } else {

        characterNodeInObject.hideChildren = true; 

        //$(this).attr('src', 'img/iconmonstr-eye-off-filled-32.png');

        //$(this).closest('.blockWrap').find('.blockWrap').hide(); //actually maybe just handle this from the drawing function
    }

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();
});
