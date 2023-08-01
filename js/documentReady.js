
$(document).ready(function () {


    //hide the manual by default

    $('#tutorial').hide();

    //GET THE STORED OBJECT FROM LOCAL STORAGE


    const myObjectString = localStorage.getItem("gameDialogueMakerProject");
    if (myObjectString !== null) {
        //myLog(` was not null when getting key from local storage`, 1);
        gameDialogueMakerProject = JSON.parse(myObjectString);
        //myLog(gameDialogueMakerProject, 1);
    } else {
        //myLog(` null it seems: ${myObjectString}`, 1);
    }

    addEmptyDivsToTheObject();


    //myLog(`Inside document ready and local storage should be loaded now ${gameDialogueMakerProject}`, 0);


    

    drawDialogueMakerProject();

    //these make moving/dragging the canvas possible
    $("#mainArea").draggable({
        drag: throttle(function (event, ui) {
            $(".conditionCircle").hide();
            updateAllLines(ui.helper);
        }, 20),
        
        stop: function (event, ui) {
            var position = ui.position;
            //console.log("Element stopped at: (" + position.left + ", " + position.top + ")");
            // Your code to update some other element or data
            //updateElementPositionInObject(ui.helper); //update master object positions
            clearCanvasBeforeReDraw();
            drawDialogueMakerProject();
            $(".conditionCircle").show();//bring the circle visibility back up
        }


    });
    $("#mainArea").draggable(
        'enable'
    );

    theMasterObjectInTheBeginning = _.cloneDeep(gameDialogueMakerProject);

    const observer = new MutationObserver((mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed.');
                console.log('Parent node:', mutation.target);
            }
            else if (mutation.type === 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified on element:', mutation.target);
                console.log('Element ID:', mutation.target.id);
                console.log('Element class list:', mutation.target.classList.toString());
                console.log('Element data attributes:', mutation.target.dataset);
            }
        }
    });

    observer.observe(document, { attributes: true, childList: true, subtree: true });


});