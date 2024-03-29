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
        //note that im using .blueline because dotted lines should not be detected
        $('svg.blueline').each(function () {
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

        //UNPLUG!!!!! DISCONNECT!!!

        if (myelement && myelement.classList.contains('leader-line')) {
            console.log(`UNPLUG!`);

            console.log('myelement', myelement);

            //use the info on the clicked line to select the correct line from the master object
            disconnectedLineCharacterID = $(myelement).attr('data-character');

            disconnectedLineFromNodeID = $(myelement).attr('data-fromnode');

            disconnectedLineToNodeID = $(myelement).attr('data-tonode');

 

            console.log(`THIS is the disconnecte line's disconnectedLineCharacterID ${disconnectedLineCharacterID} disconnectedLineFromNodeID ${disconnectedLineFromNodeID} disconnectedLineToNodeID ${disconnectedLineToNodeID}`);


            $(myelement).remove(); //remove because we will redraw

            //we can start by finding the correct fromNode (plus button), to draw a line from it towards mouse coords

            let originalFromNode = getDialogueNodeById(disconnectedLineCharacterID, disconnectedLineFromNodeID);

            console.log('originalFromNode gotten by getDialogueNodeById: ', originalFromNode);

            let originalFromNodeDomElem = originalFromNode.nodeElement;

            console.log('originalFromNodeDomElem ', originalFromNodeDomElem);

            //console.log('originalFromNodeDomElem: ', originalFromNodeDomElem);

            const mousePoint = {
                x: event.pageX,
                y: event.pageY
            };

                //is this really needed here since we create new lines onmousemove?
        /*      line = new LeaderLine(
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
            );  */



            $(document).mousemove(function (event) {
                if (currentlyDrawnLineInfo && currentlyDrawnLineInfo.line) {
                    currentlyDrawnLineInfo.line.remove();
                }
                const endPoint = {
                    x: event.pageX,
                    y: event.pageY
                };

                const fromElement = originalFromNodeDomElem.get(0);

                //console.log(' originalFromNodeDomElem.get(0)', originalFromNodeDomElem.get(0));
                //console.log('document.body.contains(originalFromNodeDomElem.get(0))', document.body.contains(originalFromNodeDomElem.get(0)));
                //console.log('Contained in body:', document.body.contains(originalFromNodeDomElem.get(0)));

                //logAllElements($('#mainArea')[0]);
                const blockPlusButtonToConnect = $(fromElement).find('.blockPlusButton'); //TO DO: add detection for socketnumber
                const toPoint = LeaderLine.pointAnchor(endPoint);

               /*  if (!fromElement || !document.body.contains(fromElement)) {
                    console.error("From element is null, undefined, or not in the document");
                    return;
                }

                if (!toPoint) {
                    console.error("ToPoint is null or undefined");
                    return;
                } */

                line = new LeaderLine(
                    blockPlusButtonToConnect.get(0),
                    toPoint,
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

                line.positionByWindowResize = false;
 
                leaderLines.push(line);
            
                lineInfo = {

                    line: line,

                    lineCharacterId: disconnectedLineCharacterID,

                    lineFromNodeId: disconnectedLineFromNodeID,

                    lineToNodeId: null
                }

                currentlyDrawnLineInfo = lineInfo;
            
            }); //end mousemove

            $(document).mouseup(function () {
                // Stop updating line when mouse button is released
                $(document).off('mousemove');
                $(document).off('mouseup');

                console.log('mouseup, should del line now: ');
                console.log('disconnectedLineCharacterID: ', disconnectedLineCharacterID);
                console.log('disconnectedLineFromNodeID: ', disconnectedLineFromNodeID);
                console.log('disconnectedLineToNodeID: ', disconnectedLineToNodeID);

                //delete the line from the master object
                let theLineInTheObject = deleteLineFromObject(gameDialogueMakerProject, disconnectedLineCharacterID, disconnectedLineFromNodeID, disconnectedLineToNodeID);

                //console.log('socketElement', socketElement);
                $(socketElement).attr('data-hasline', 'false');


                //delete the line, ...maybe redraw instead
                //line.remove(); //note this is leaderLines remove method not jQuery

                let theElem = getDialogueNodeById(disconnectedLineCharacterID, disconnectedLineToNodeID);

                let theInfo = getInfoByPassingInDialogueNodeOrElement(theElem);

                //sending the elemement and the character node, because disconnected elements become children of the character
                calculateNewPositionAfterElementParentChange(theElem, theInfo.characterNode.nodeElement);

        
                lineInfo = {

                    line: theLineInTheObject,

                    lineCharacterId: disconnectedLineCharacterID,

                    lineFromNodeId: disconnectedLineFromNodeID,

                    lineToNodeId: null
                }

                currentlyDrawnLineInfo = lineInfo;

            });


        } else {
            // Mouse is not over an svg element with class "leader-line"
            console.log('Mouse is not over an svg element with class "leader-line"');
        }

        //turn svg pointer events back off
        $('svg.leader-line').each(function () {
            this.style.setProperty('pointer-events', 'none', 'important');
        });

        

        //DRAW NEW  LINE FROM EMPTY SOCKET

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

        line.positionByWindowResize = false;

        leaderLines.push(line);

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

             lineFromNodeId: null,

             lineToNodeId: nodeIdFromWhichWeAreDrawing
        }

        currentlyDrawnLineInfo = lineInfo;

    } //end else for if ($(socketElement).attr('data-hasline') == 'true')

    event.stopPropagation();

    console.log('returning lineInfo, which looks like this: ', lineInfo);

    return lineInfo;

}/* end mousedownOverTopConnectionSocket */

