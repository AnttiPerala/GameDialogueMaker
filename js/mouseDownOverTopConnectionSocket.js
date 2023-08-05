function mousedownOverTopConnectionSocket(event, elem) {
    var socketElement = $(elem);
    let line;
    let socketElementCharacterID = findCharacterIDByPassingInDialogueNode(elem);
    var lineIndex;
    currentlyDrawingALine = true;
   


    if ($(socketElement).attr("data-hasline") == 'true') {
        $('svg.leader-line').each(function () {
            this.style.setProperty('pointer-events', 'auto', 'important');
        });

        var x = event.clientX,
            y = event.clientY,
            myelement = document.elementFromPoint(x, y);

        while (myelement && !(myelement instanceof SVGSVGElement)) {
            myelement = myelement.ownerSVGElement;
        }

        if (myelement && myelement.classList.contains('leader-line')) {
            lineCharacterId = $(myelement).attr('data-character');
            lineFromNodeId = $(myelement).attr('data-fromnode');
            lineToNodeId = $(myelement).attr('data-tonode');
            $(myelement).remove();
            let originalFromNode = getDialogueNodeById(lineCharacterId, lineFromNodeId);
            let originalFromNodeDomElem = originalFromNode.nodeElement;
            const mousePoint = {
                x: event.pageX,
                y: event.pageY
            };

            //get the connection socket number
            let myLine = originalFromNode.outgoingLines.find(line => line.fromNode == lineFromNodeId && line.toNode == lineToNodeId);
            let mySocketNumber = myLine.fromSocket;

            //get button based on button number
            let theRightButtonElement = originalFromNodeDomElem.find('[data-buttonindex="' + mySocketNumber + '"]');

            if (theRightButtonElement.length > 0) {
                console.log(`Found matching theRightButtonElement: `, theRightButtonElement);
            } else {
                console.log(`No matching theRightButtonElement found`);
            }

            console.log('theRightButtonElement:', theRightButtonElement);

            line = new LeaderLine(
                theRightButtonElement.get(0),
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

            leaderLines.push(line);
            lineIndex = leaderLines.length - 1;

            lineInformation = { 
                line: line,
                lineCharacterId: lineCharacterId, 
                lineFromNodeId: lineFromNodeId, 
                lineToNodeId: lineToNodeId 
            }

            console.log('before mouseup call, lineInformation is: ', lineInformation);

            $(document).mousemove(handleMouseMove);
            $(document).mouseup(function (mouseupEvent) {
                handleDocumentMouseUp(mouseupEvent, this)
            });
        }

        $('svg.leader-line').each(function () {
            this.style.setProperty('pointer-events', 'none', 'important');
        });
    } else { //the socket did not have a line so we will start one from it now

        objectNodeFromWhichWeAreDrawing = findDialogueObjectBasedOnPassedInHtmlElement($(elem).closest(".blockWrap").find(".blockid"));
        nodeIdFromWhichWeAreDrawing = $(elem).closest(".blockWrap").find(".block").attr("id").replace(/\D/g, "");
        characterNameFromWhichWeAreDrawing = $(elem).closest(".characterRoot").find(".characterName").val();

        line = new LeaderLine(
            socketElement[0],
            LeaderLine.pointAnchor({ x: event.pageX, y: event.pageY }),
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

        leaderLines.push(line);
        lineIndex = leaderLines.length - 1;

        const all_svgs = document.querySelectorAll("svg");
        const this_svg = all_svgs[all_svgs.length - 1];
        this_svg.setAttribute("data-character", socketElementCharacterID);
    }

    event.stopPropagation();

    let lineInfo = {
        line: line,
        lineCharacterId: socketElementCharacterID,
        lineFromNodeId: lineFromNodeId,
        lineToNodeId: lineToNodeId
    }

    return lineInfo;

    function handleMouseMove(event) {
        console.log('lineInformation.line', lineInformation.line);
        lineInformation.line.setOptions({
            end: LeaderLine.pointAnchor({ x: event.pageX, y: event.pageY }),
        });
    }

    /* function handleMouseUp() {
        $(document).off('mousemove', handleMouseMove);
        $(document).off('mouseup', handleMouseUp);
        deleteLineFromObject(gameDialogueMakerProject, lineCharacterId, lineFromNodeId, lineToNodeId);
        $(socketElement).attr('data-hasline', 'false');
        leaderLines.splice(lineIndex, 1);
        clearCanvasBeforeReDraw();
        drawDialogueMakerProject();
    } */
}

/* end mousedownOverTopConnectionSocket */

