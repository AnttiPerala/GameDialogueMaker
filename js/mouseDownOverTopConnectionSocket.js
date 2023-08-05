function mousedownOverTopConnectionSocket(event, elem) {
    var socketElement = $(elem);
    let line;
    let socketElementCharacterID = findCharacterIDByPassingInDialogueNode(elem);
    var lineIndex;

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

            leaderLines.push(line);
            lineIndex = leaderLines.length - 1;

            $(document).mousemove(handleMouseMove);
            $(document).mouseup(handleDocumentMouseUp);
        }

        $('svg.leader-line').each(function () {
            this.style.setProperty('pointer-events', 'none', 'important');
        });
    } else {
        currentlyDrawingALine = true;
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
        leaderLines[lineIndex].setOptions({
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

