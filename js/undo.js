document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'z') {
        alert('Sorry, undo hasn\'t been implemented yet, but we are planning it');
        event.preventDefault();
    }
});