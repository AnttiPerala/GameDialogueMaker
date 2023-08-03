function mousedownOverTopConnectionSocket(event, elem){

    console.log('mousedownOverTopConnectionSocket, event was: ', event);
    console.log('elem was: ', elem);

    var socketElement = $(elem);

    let lineInfo;

    let line;

    //let lineCharacterId; //already define in globalVars

    //let lineFromNodeId; //already define in globalVars

    //let lineToNodeId; //already define in globalVars

    let socketElementCharacterID = getInfoByPassingInDialogueNodeOrElement(elem).characterID;

    console.log('inside mousedownOverTopConnectionSocket, socketElement is: ', socketElement);
    console.log('socketElementCharacterID ', socketElementCharacterID);

    //the socket has a line so we should unplug:
    if ($(socketElement).attr("data-hasline") == 'true') {
        //hide the socket to help elementFromPoint

        //need to temporarily enable svg pointer events for proper detections
        $('svg.leader-line').each(function () {
            this.style.setProperty('pointer-events', 'auto', 'important');
        });


        //first select the line
        var x = event.clientX,
            y = event.clientY,
            myelement = document.elementFromPoint(x, y);

        console.log(`myelement was`, myelement);

        // climb up the DOM tree to the root svg
        while (myelement && !(myelement instanceof SVGSVGElement)) {
            myelement = myelement.ownerSVGElement;
        }

        if (myelement && myelement.classList.contains('leader-line')) {
            //console.log(`mouse over socket AND svg`);

            //use the info on the clicked line to select the correct line from the master object
            disconnectedLineCharacterID = $(myelement).attr('data-character');

            disconnectedLineFromNodeID = $(myelement).attr('data-fromnode');

            disconnectedLineToNodeID = $(myelement).attr('data-tonode');

 

            console.log(`THIS is the disconnecte line's disconnectedLineCharacterID ${disconnectedLineCharacterID} disconnectedLineFromNodeID ${disconnectedLineFromNodeID} disconnectedLineToNodeID ${disconnectedLineToNodeID}`);


            $(myelement).remove(); //remove because we will redraw


            //nah, let's try to get the actual element the original line is attached to 
            //we can start by finding the correct fromNode

            let originalFromNode = getDialogueNodeById(disconnectedLineCharacterID, disconnectedLineFromNodeID);

            let originalFromNodeDomElem = originalFromNode.nodeElement;

            //console.log('originalFromNodeDomElem: ', originalFromNodeDomElem);

            const mousePoint = {
                x: event.pageX,
                y: event.pageY
            };

             line = new LeaderLine(
                originalFromNodeDomElem.get(0),
                LeaderLine.pointAnchor(mousePoint),
                {
                    color: "#0075ff",
                    size: 4,
                    dash: false,
                    path: "straight",
                    startSocket: "bottom",
                    endSocket: "bottom",
                    endPlug: "disc",
                }
            );



            $(document).mousemove(function (event) {
                // Update line end point on mousemove
                line.remove();
                const endPoint = {
                    x: event.pageX,
                    y: event.pageY
                };
                line = new LeaderLine(
                    originalFromNodeDomElem.get(0),
                    LeaderLine.pointAnchor(endPoint),
                    {
                        color: "#0075ff",
                        size: 4,
                        dash: false,
                        path: "straight",
                        startSocket: "bottom",
                        endSocket: "bottom",
                        endPlug: "disc",
                    }
                );
            });

            $(document).mouseup(function () {
                // Stop updating line when mouse button is released
                $(document).off('mousemove');
                $(document).off('mouseup');

                console.log('mouseup, should del line now: ');
                console.log('disconnectedLineCharacterID', disconnectedLineCharacterID);
                console.log('disconnectedLineFromNodeID', disconnectedLineFromNodeID);
                console.log('disconnectedLineToNodeID', disconnectedLineToNodeID);

                //delete the line from the master object
                let theLineInTheObject = deleteLineFromObject(gameDialogueMakerProject, disconnectedLineCharacterID, disconnectedLineFromNodeID, disconnectedLineToNodeID);

                //console.log('socketElement', socketElement);
                $(socketElement).attr('data-hasline', 'false');

                

                //delete the line, ...maybe redraw instead
                //line.remove(); //note this is leaderLines remove method not jQuery

                let theElem = getDialogueNodeById(disconnectedLineCharacterID, disconnectedLineToNodeID);

                let theInfo = getInfoByPassingInDialogueNodeOrElement(theElem);

                calculateNewPositionAfterElementParentChange(theElem, theInfo.characterNode.nodeElement);

            });


        } else {
            // Mouse is not over an svg element with class "leader-line"
        }

        //turn svg pointer events back off
        $('svg.leader-line').each(function () {
            this.style.setProperty('pointer-events', 'none', 'important');
        });

    } else { //draw a line because the socket was empty

        currentlyDrawingALine = true;

        let currentNodeInfo = getInfoByPassingInDialogueNodeOrElement($(elem).closest(".blockWrap"));

        objectNodeFromWhichWeAreDrawing = currentNodeInfo.dialogueNode;

        nodeIdFromWhichWeAreDrawing = currentNodeInfo.dialogueID;

        characterIDFromWhichWeAreDrawing = currentNodeInfo.characterID;

        console.log('currentNodeInfo.characterID!!!!!!!!!', currentNodeInfo.characterID);

        line = new LeaderLine(
            socketElement[0], // Start of the line
            LeaderLine.pointAnchor({ x: event.pageX, y: event.pageY }), // End of the line
            {
                color: "#0075ff",
                size: 4,
                dash: false,
                path: "straight", //deafult is straight, arc, fluid, magnet, grid
                startSocket: "bottom",
                endSocket: "bottom",
                endPlug: "disc",
            }
        );

        //set the id also of the svg for easier selection
        const all_svgs = document.querySelectorAll("svg");
        const this_svg = all_svgs[all_svgs.length - 1]; //this will select the latest svg
        this_svg.setAttribute(
            "data-character",
            characterIDFromWhichWeAreDrawing
        );

         lineInfo = {

            line: line,

             lineCharacterId: characterIDFromWhichWeAreDrawing,

             lineFromNodeId: nodeIdFromWhichWeAreDrawing,

            lineToNodeId: null
        }

        currentlyDrawnLineInfo = lineInfo;

    } //end else for if ($(socketElement).attr('data-hasline') == 'true')

    event.stopPropagation();

   

    return lineInfo;

}/* end mousedownOverTopConnectionSocket */

