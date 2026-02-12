$(document).ready(function () {

  // hide the manual by default
  $('#tutorial').hide();

  // GET STORED OBJECT
  const myObjectString = localStorage.getItem("gameDialogueMakerProject");
  if (myObjectString !== null) {
    gameDialogueMakerProject = JSON.parse(myObjectString);
  }

  addEmptyDivsToTheObject();

  drawDialogueMakerProject();

  // canvas drag (panning)
  $("#mainArea").draggable({
    cancel: ".blockWrap, .block, .dialogue, .characterRoot, .topConnectionSocket, .blockPlusButton, input, textarea, select, button, .conditionCircle",

    drag: throttle(function (event, ui) {
      $(".conditionCircle").hide();
      if (window.SVGConnections) SVGConnections.requestUpdate();
    }, 20),

    stop: function (event, ui) {
      if (ui.position.left === ui.originalPosition.left && ui.position.top === ui.originalPosition.top) {
        $(".conditionCircle").show();
        return;
      }
      clearCanvasBeforeReDraw();
      drawDialogueMakerProject();
      $(".conditionCircle").show();
    }
  });

  // ---------------------------------------------------------------------------
  // SVG connection drag behavior:
  // - pointerdown: visual detach only (handled inside svgConnections.js)
  // - pointerup on empty: DISCONNECT in model (remove outgoingLine)
  // - pointerup on plus button: MOVE connection (remove old + add new)
  // ---------------------------------------------------------------------------

  // We do NOT disconnect on pointerdown anymore.
  SVGConnections.onDetach = (conn) => {
    // intentionally empty
  };

  function removeEdgeByConn(conn) {
    const lineObj = conn._outgoingLineRef || {};
    const fromNode = Number(lineObj.fromNode ?? conn.from?.dialogueId ?? 0);
    const fromSocket = Number(lineObj.fromSocket ?? conn.from?.socketIndex ?? 0);

    // conn.to is null during drag, so use remembered original target
    const toNode = Number(lineObj.toNode ?? conn._detachedTo?.dialogueId);

    let removed = false;

    for (const character of gameDialogueMakerProject.characters) {

      // character root
      if (character.outgoingLines && character.outgoingLines.length) {
        const before = character.outgoingLines.length;
        character.outgoingLines = character.outgoingLines.filter(l =>
          !(Number(l.fromNode) === fromNode &&
            Number(l.fromSocket) === fromSocket &&
            Number(l.toNode) === toNode)
        );
        if (character.outgoingLines.length !== before) removed = true;
      }

      // dialogue nodes
      for (const node of (character.dialogueNodes || [])) {
        if (!node.outgoingLines || !node.outgoingLines.length) continue;

        const before = node.outgoingLines.length;
        node.outgoingLines = node.outgoingLines.filter(l =>
          !(Number(l.fromNode) === fromNode &&
            Number(l.fromSocket) === fromSocket &&
            Number(l.toNode) === toNode)
        );
        if (node.outgoingLines.length !== before) removed = true;
      }
    }

    if (!removed) {
      console.warn("removeEdgeByConn: edge not found", { fromNode, fromSocket, toNode, conn });
    }
  }

  SVGConnections.onDropCancel = (conn) => {
  // child we are disconnecting
  const child = conn._detachedTo;
  if (child) {
    const oldCharId = Number(child.characterId);
    const childId = Number(child.dialogueId);

    // Freeze current visual position so it stays put after becoming a root
    const pos = freezeNodePositionInMainArea(oldCharId, childId);

    const oldChar = gameDialogueMakerProject.characters.find(c => c.characterID == oldCharId);
    const childNode = oldChar?.dialogueNodes?.find(n => n.dialogueID == childId);

    if (pos && childNode) {
      childNode.dialogueNodeX = pos.x;
      childNode.dialogueNodeY = pos.y;
    }
  }

  // Now do the real disconnect
  removeEdgeByConn(conn);

  clearCanvasBeforeReDraw();
  drawDialogueMakerProject();
};


  SVGConnections.onDropConnect = (conn, dropTarget) => {
    // dropTarget = { characterId, dialogueId, socketIndex, el, isCharacterRoot }
    const child = conn._detachedTo;
    if (!child) return false;

    // Remove the old connection first (since we didn't detach at pointerdown)
    removeEdgeByConn(conn);

    const oldCharId = Number(child.characterId);
    const childId = Number(child.dialogueId);

    const oldChar = gameDialogueMakerProject.characters.find(c => c.characterID == oldCharId);
    if (!oldChar) return false;

    const childNode = oldChar.dialogueNodes.find(n => n.dialogueID == childId);
    if (!childNode) return false;

    const newParentCharId = Number(dropTarget.characterId);
    const newParentDialogueId = Number(dropTarget.dialogueId);
    const newSocket = Number(dropTarget.socketIndex);

    const newParentChar = gameDialogueMakerProject.characters.find(c => c.characterID == newParentCharId);
    if (!newParentChar) return false;

    // Respect acceptclicks gate (svgConnections also checks, but safe)
    if (dropTarget.el.dataset.acceptclicks === "false") return false;

    // CASE 1: dropped on character root plus button
    if (dropTarget.isCharacterRoot) {

      if (newParentCharId === oldCharId) {
        newParentChar.outgoingLines.push({
          fromNode: 0,
          fromSocket: newSocket,
          toNode: childId,
          lineElem: "",
          transitionConditions: [],
        });
      } else {
        const highestIdInNewParent = getMaxDialogueNodeId(newParentChar);
        reparentNodeAndDescendants(
          childNode,
          oldCharId,
          newParentCharId,
          highestIdInNewParent + 1,
          gameDialogueMakerProject
        );

        newParentChar.outgoingLines.push({
          fromNode: 0,
          fromSocket: newSocket,
          toNode: childNode.dialogueID,
          lineElem: "",
          transitionConditions: [],
        });
      }

      clearCanvasBeforeReDraw();
      drawDialogueMakerProject();
      return true;
    }

    // CASE 2: dropped on a dialogue node plus button
    const newParentNode = newParentChar.dialogueNodes.find(n => n.dialogueID == newParentDialogueId);
    if (!newParentNode) return false;

    if (newParentCharId === oldCharId) {
      newParentNode.outgoingLines.push({
        fromNode: newParentNode.dialogueID,
        fromSocket: newSocket,
        toNode: childId,
        lineElem: "",
        transitionConditions: [],
      });

      // match your existing behavior
      childNode.dialogueNodeX = 0;
      childNode.dialogueNodeY = 250;

    } else {
      childNode.dialogueNodeX = 0;
      childNode.dialogueNodeY = 250;

      const highestIdInNewParent = getMaxDialogueNodeId(newParentChar);
      reparentNodeAndDescendants(
        childNode,
        oldCharId,
        newParentCharId,
        highestIdInNewParent + 1,
        gameDialogueMakerProject
      );

      newParentNode.outgoingLines.push({
        fromNode: newParentNode.dialogueID,
        fromSocket: newSocket,
        toNode: childNode.dialogueID,
        lineElem: "",
        transitionConditions: [],
      });
    }

    clearCanvasBeforeReDraw();
    drawDialogueMakerProject();
    return true;
  };

  function freezeNodePositionInMainArea(characterId, dialogueId) {
  const el = document.querySelector(
    `.blockWrap[data-character-id="${characterId}"][data-dialogue-id="${dialogueId}"]`
  );
  const main = document.getElementById("mainArea");
  if (!el || !main) return null;

  const r = el.getBoundingClientRect();
  const m = main.getBoundingClientRect();

  // Convert screen -> mainArea coords. If you later add zoom, wire the zoom value here.
  const zoom = (window.SVGConnections && SVGConnections.screenToWorld) ? null : 1;

  // If SVGConnections.screenToWorld exists, use it (handles zoom if you hook it up)
  if (window.SVGConnections && typeof SVGConnections.screenToWorld === "function") {
    const p = SVGConnections.screenToWorld(r.left, r.top);
    return { x: p.x, y: p.y };
  }

  // Fallback (no zoom)
  return { x: r.left - m.left, y: r.top - m.top };
}


});
