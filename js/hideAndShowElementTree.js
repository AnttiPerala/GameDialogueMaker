$(document).on('click', '.eyeImage', function(event) {


    var currentImage = $(this).attr('src');

    console.log(` currentImage: ${currentImage}`);

    if (currentImage === 'img/iconmonstr-eye-off-filled-32.png') {
        $(this).attr('src', 'img/iconmonstr-eye-filled-32.png');
    } else {
        $(this).attr('src', 'img/iconmonstr-eye-off-filled-32.png');
    }
});
