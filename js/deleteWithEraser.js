//ERASER TOOL

//enable or disable clone brush
$('#eraser').on('click', function () {
    eraseMode = !eraseMode; //toggle boolean

    //when clone mode is on:
    if (eraseMode) {
        $('body').css('cursor', 'url(iconmonstr-eraser-1-48.png) 16 32, auto');
    } else {
        $('body').css('cursor', 'unset');
    }

})

//CLICKING ON A BLOCK WITH ERASEMODE ON
//DELETING STUFF WITH THE DELETE TOOL

$('body').on('mousedown', '.block, .line', function () {
    if (eraseMode) {
        //console.log(`erase ${this}`);

        //delete the corresponding node from the object
        let idToBeErased = $(this).closest('.blockWrap').attr('id').replace(/\D/g, '');

        

        //loop through the connected lines that should also be erased
        let allConnectedLines = $('.line[data-block1="' + $(this).attr('id') + '"],.line[data-block2="' + $(this).attr('id') + '"]');

        $(allConnectedLines).remove();

        $(this).closest('.blockWrap').remove();

        //$(this).remove();

    }
}
);