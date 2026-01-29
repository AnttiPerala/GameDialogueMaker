/* svgLineSystem.js */

function getGlobalZoom() {
    let zoomValue = $('body').css('zoom');
    if (!zoomValue || zoomValue === "normal") return 1;
    if (zoomValue.includes('%')) return parseFloat(zoomValue) / 100;
    let zoomNum = parseFloat(zoomValue);
    return zoomNum > 0 ? zoomNum : 1;
}

function updateAllLines() {
    const lineGroup = document.getElementById('svgLineGroup');
    const canvas = document.getElementById('mainArea');
    if (!lineGroup || !canvas || !gameDialogueMakerProject) return;

    const zoom = getGlobalZoom();
    const canvasRect = canvas.getBoundingClientRect();

    lineGroup.innerHTML = ''; 

    gameDialogueMakerProject.characters.forEach(character => {
        const charID = character.characterID;
        const charElem = document.getElementById(`char${charID}`);

        // 1. Character Root Lines
        if (charElem && character.outgoingLines) {
            character.outgoingLines.forEach(line => {
                const target = findNodeInDOM(line.toNode);
                // Characters usually only have one socket (index 0)
                if (target) drawSVGPath(charElem, target, canvasRect, zoom, false, line.fromSocket || 0);
            });
        }

        // 2. Dialogue Node Lines
        character.dialogueNodes.forEach(node => {
            const nodeElem = findNodeInDOM(node.dialogueID);
            if (!nodeElem) return;

            node.outgoingLines.forEach(line => {
                const target = findNodeInDOM(line.toNode);
                // Use line.fromSocket to pick the correct "+" button
                if (target) drawSVGPath(nodeElem, target, canvasRect, zoom, false, line.fromSocket);
            });

            if (node.nextNode > 0) {
                const target = findNodeInDOM(node.nextNode);
                if (target) drawSVGPath(nodeElem, target, canvasRect, zoom, true, 0);
            }
        });
    });
}

function drawSVGLine(startNode, endNode, canvasRect, zoom, isDotted) {
    const svg = document.getElementById('connectionLayer');
    const socket = startNode.querySelector('.blockPlusButton') || startNode;

    const sRect = socket.getBoundingClientRect();
    const eRect = endNode.getBoundingClientRect();

    // Normalize coordinates: (ScreenPos - CanvasPos) / Zoom
    const startX = (sRect.left + sRect.width / 2 - canvasRect.left) / zoom;
    const startY = (sRect.top + sRect.height / 2 - canvasRect.top) / zoom;
    
    const endX = (eRect.left + eRect.width / 2 - canvasRect.left) / zoom;
    const endY = (eRect.top - canvasRect.top) / zoom;

    const cp1Y = startY + (endY - startY) / 2;
    const cp2Y = startY + (endY - startY) / 2;
    const pathData = `M ${startX} ${startY} C ${startX} ${cp1Y}, ${endX} ${cp2Y}, ${endX} ${endY}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", isDotted ? "#999" : "#0075ff");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrowhead)");
    if (isDotted) path.setAttribute("stroke-dasharray", "5,5");

    svg.appendChild(path);
}