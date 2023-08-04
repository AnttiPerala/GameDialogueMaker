/* var resizeEndTimer;

window.addEventListener('resize', function () {

    console.log('leaderLines when resize fires: ', leaderLines);

    // Remove LeaderLines and clear from memory
    for (var i = 0; i < leaderLines.length; i++) {
        leaderLines[i].remove();
    }

    // Reset the lines array
    leaderLines = [];

    // Clear elements from page
    document.querySelector('#mainArea').innerHTML = '';

    //lines after emptying array:
    console.log('leaderLines when resize fires: ', leaderLines);

    // Clear remaining elements
    $('svg').remove();
    $('.leader-line').remove();
    $('.conditionCircle').remove();

    clearTimeout(resizeEndTimer);  // Clear the previous timer

    resizeEndTimer = setTimeout(function () {
        console.log('Resizing ended');
        drawDialogueMakerProject();

    }, 500);  // Time to wait until resize is "complete"
}, true);
 */