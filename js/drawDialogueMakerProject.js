// drawDialogueMakerProject.js
// FLAT DOM + real subtree drag + SVGConnections lines + stub dotted hints when hideChildren=true

// ------------------------------
// Character HTML
// ------------------------------
function createCharacterNodeHTML(character) {

  let eyeImageSource;
  // closed or open eye:
  if (!('hideChildren' in character)) { // in case the property is missing
    character.hideChildren = false;
  }
  if (character.hideChildren == false) {
    eyeImageSource = 'img/iconmonstr-eye-filled-32.png';
  } else {
    eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png';
  }

  let acceptclicksValue = false;

  // check for acceptclicks
  if ((character.outgoingLines || []).length < 1) {
    acceptclicksValue = true;
  }

  let characterNodeHTML = $(`
    <div class="blockWrap characterRoot"
         data-character-id="${character.characterID}"
         id="char${character.characterID}"
         data-hidechildren="${character.hideChildren}">
      <div class="contentWrap">
        <div style="display: flex; align-items:center; justify-content: center;"></div>

        <div class="block" style="background-color: ${character.bgColor}">
          <div class="characterElementIDLine" style="text-align: left;">
            <span style="width: 35%; display:inline-block; text-align: right;">Character ID:</span>
            <input class="blockid" style="width: 15%; display:inline-block;" readonly type="number" value="${character.characterID}">
            <img class="eyeImage characterNodeEye btnSmall" src="${eyeImageSource}" alt="eye" width="24" height="24">
          </div>

          <input type="text" class="characterName elementInfoField" placeholder="character name" value="${character.characterName}">
        </div>

        <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
          <div class="blockPlusButton" data-buttonindex="0" data-acceptclicks="${acceptclicksValue}">+</div>
        </div>
      </div>
    </div>
  `);

  characterNodeHTML.css({
    position: "absolute",
    left: character.characterNodeX,
    top: character.characterNodeY,
  });

  character.nodeElement = characterNodeHTML;

  return characterNodeHTML;
}


// ------------------------------
// DRAWING THE LINES (SVGConnections descriptor)
// ------------------------------
function drawLines(sourceId, targetId, isCharacter, outgoingLine, characterId) {

  let sourceElement, plusButtonElem;

  // --- Resolve FROM element (plus button) ---
  if (isCharacter) {
    sourceElement = $(`.characterRoot[data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
    sourceId = 0; // character root is treated as node 0
  } else {
    sourceElement = $(`.blockWrap[data-dialogue-id="${sourceId}"][data-character-id="${characterId}"]`);
    plusButtonElem = $(sourceElement).find(".blockPlusButton").eq(outgoingLine.fromSocket);
  }

  // Guard: if we can't find the plus button, skip this connection
  if (!plusButtonElem || plusButtonElem.length === 0) {
    return null;
  }

  // --- Resolve TO node in master object (supports cross-character targets) ---
  let sourceCharacter = gameDialogueMakerProject.characters.find(
    (char) => char.characterID == characterId
  );

  if (!sourceCharacter) return null;

  // We'll find which character actually owns the target node
  let targetCharacter = sourceCharacter;
  let targetNode = targetCharacter.dialogueNodes.find(
    (dialogueNode) => dialogueNode.dialogueID == targetId
  );

  if (!targetNode) {
    targetCharacter = gameDialogueMakerProject.characters.find((char) =>
      char.dialogueNodes.some((node) => node.dialogueID == targetId)
    );

    if (targetCharacter) {
      targetNode = targetCharacter.dialogueNodes.find(
        (dialogueNode) => dialogueNode.dialogueID == targetId
      );
    }
  }

  if (!targetNode) return null;

  // --- Mark target top socket as having a line ---
  let lineEndNodeElement = targetNode.nodeElement;
  let lineEndElementTopSocket = $(lineEndNodeElement).find(".topConnectionSocket").eq(0);

  if (lineEndElementTopSocket && lineEndElementTopSocket.length) {
    $(lineEndElementTopSocket).attr("data-hasline", "true");
  }

  // --- Return connection descriptor for SVGConnections ---
  const normalizedSourceId = isCharacter ? 0 : sourceId;

  const fromChar = Number(characterId);
  const toChar = Number(targetCharacter.characterID);
  const fromNode = Number(normalizedSourceId);
  const toNode = Number(targetId);
  const fromSocket = Number(outgoingLine.fromSocket);

  const connId = `c_${fromChar}_${fromNode}_${fromSocket}__${toChar}_${toNode}`;

  return {
    id: connId,
    type: "line",
    from: {
      characterId: fromChar,
      dialogueId: fromNode,       // 0 for character root, else dialogueID
      socketIndex: fromSocket,
      isCharacter: !!isCharacter,
    },
    to: {
      characterId: toChar,
      dialogueId: toNode,
    },

    _outgoingLineRef: outgoingLine,
    _fromPlusButtonEl: plusButtonElem.get(0),
    _toSocketEl: lineEndElementTopSocket?.get(0) || null,
  };
}


// ------------------------------
// Condition circles from SVG paths
// ------------------------------
function rebuildConditionCirclesFromSvgConnections(allConnections) {
  document.querySelectorAll('.conditionCircle').forEach(e => e.remove());

  for (const conn of allConnections) {
    if (!conn) continue;

    // Only real outgoing connections get condition circles
    if (conn.type === "next" || conn.type === "stub") continue;

    const path =
      document.querySelector(`#connectionsSvg g[data-conn-id="${conn.id}"] path.connection-path`) ||
      document.querySelector(`#connectionsSvg g.conn[data-conn-id="${conn.id}"] path.connection-path`) ||
      document.querySelector(`#connectionsSvg g[data-conn-id="${conn.id}"] path`) ||
      document.querySelector(`#connectionsSvg g[data-connid="${conn.id}"] path`);

    if (!path) continue;

    // If hidden / stub, skip
    const g = path.closest("g");
    if (!g || g.style.display === "none" || g.classList.contains("is-stub")) continue;

    const characterId = conn.from.characterId;
    const fromNode = conn.from.dialogueId; // 0 for character root
    const toNode = conn.to.dialogueId;

    drawConditionCircle(path, characterId, fromNode, toNode);

    const outgoing = conn._outgoingLineRef;
    if (outgoing && outgoing.transitionConditions && outgoing.transitionConditions.length > 0) {
      const circle = document.querySelector(
        `.conditionCircle[data-fromnode="${fromNode}"][data-tonode="${toNode}"][data-character="${characterId}"]`
      );
      if (circle) {
        circle.classList.add("withCondition");
        circle.setAttribute("title", "Click to change the condition for the transition");
      }
    }
  }
}


// ------------------------------
// drawDialogueMakerProject (FLAT DOM)
// ------------------------------
function drawDialogueMakerProject() {
  let wrapper = $('<div class="wrapper"></div>');
  wrapper.css({ position: "relative" });

  // --- 1) Draw nodes (FLAT) ---
  gameDialogueMakerProject.characters.forEach((character) => {
    let characterElem = createCharacterNodeHTML(character);
    wrapper.append(characterElem);

    (character.dialogueNodes || []).forEach((dialogueNode) => {
      const dialogueElem = createDialogueHTMLElement(dialogueNode);

      const nodeAbsX = Number(dialogueNode.dialogueNodeX) || 0;
      const nodeAbsY = Number(dialogueNode.dialogueNodeY) || 0;

      $(dialogueElem).css({
        position: "absolute",
        left: nodeAbsX + "px",
        top: nodeAbsY + "px",
      });

      wrapper.append(dialogueElem);
    });
  });

  const main = $("#mainArea");

  // Detach SVG overlay if it exists
  const svgOverlay = main.children("#connectionsSvg").detach();

  main.empty();

  if (svgOverlay.length) main.append(svgOverlay);
  main.append(wrapper);

  SVGConnections.init({ worldId: "mainArea" });

  $(".characterRoot").draggable(draggableSettings).css({ position: "absolute" });
  $(".dialogue").draggable(draggableSettings).css({ position: "absolute" });

  applyHideToElementsGraph();

  $(".dialogueTextArea").each(function () {
    autoGrowTextArea(this);
  });

  // --- 2) Build connections ---
  const allConnections = [];

  // Build graph-hidden set
  const hiddenNodeSetByCharacter = buildHiddenNodeSets();

  // IMPORTANT: we do NOT create our own stubs here unless the SOURCE node itself hides children.
  // For "target is hidden", we still push the real connection and SVGConnections will render it as a stub.
  function pushStubForOutgoingLine(outgoingLine, isCharacter, characterId, fromNodeId) {
    const fromChar = Number(characterId);
    const fromNode = isCharacter ? 0 : Number(fromNodeId);
    const fromSocket = Number(outgoingLine.fromSocket) || 0;

    allConnections.push({
      id: `stub_${fromChar}_${fromNode}_${fromSocket}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type: "stub",
      from: {
        characterId: fromChar,
        dialogueId: fromNode,
        socketIndex: fromSocket,
        isCharacter: !!isCharacter,
      },
      to: null,
      _floatingEnd: null,
    });
  }

  function drawOutgoingLines(node, isCharacter, characterId, hiddenSet) {
    const nodeHides = node && node.hideChildren === true;

    // Normal outgoingLines
    (node.outgoingLines || []).forEach((outgoingLine) => {
      // ✅ DO NOT skip if the TARGET is hidden.
      // We still push the real connection, SVGConnections will stub it.
      if (nodeHides) {
        // If SOURCE is hiding children, show stub hint(s) instead of real lines
        pushStubForOutgoingLine(outgoingLine, isCharacter, characterId, node.dialogueID);
        return;
      }

      const c = drawLines(
        (node.dialogueID || node.characterID),
        outgoingLine.toNode,
        isCharacter,
        outgoingLine,
        characterId
      );
      if (c) allConnections.push(c);
    });

    // NEXT dotted link:
    // If node hides children, we hide "next" entirely (you can change this if you want it stubbed too)
    if (!isCharacter && !nodeHides) {
      const nextNodeValue = Number(node.nextNode);
      if (Number.isFinite(nextNodeValue) && nextNodeValue > 0) {

        // If NEXT target is hidden due to ancestor, we still allow SVGConnections to hide it.
        // But "next" is special: SVGConnections hides it if endpoint missing/hidden anyway.

        const fromChar = Number(characterId);
        const fromNodeId = Number(node.dialogueID);

        let targetCharacter = gameDialogueMakerProject.characters.find((char) =>
          char.dialogueNodes?.some((n) => Number(n.dialogueID) === nextNodeValue)
        );
        if (!targetCharacter) {
          targetCharacter =
            gameDialogueMakerProject.characters.find((c) => Number(c.characterID) === fromChar) ||
            null;
        }
        const toChar = targetCharacter ? Number(targetCharacter.characterID) : fromChar;

        const nextConn = {
          id: `next_${fromChar}_${fromNodeId}__${toChar}_${nextNodeValue}`,
          type: "next",
          from: {
            characterId: fromChar,
            dialogueId: fromNodeId,
            port: "next",
          },
          to: {
            characterId: toChar,
            dialogueId: nextNodeValue,
          },
        };

        const existingIndex = allConnections.findIndex(
          (c) =>
            c &&
            c.type === "next" &&
            Number(c.from?.characterId) === fromChar &&
            Number(c.from?.dialogueId) === fromNodeId
        );

        if (existingIndex >= 0) allConnections[existingIndex] = nextConn;
        else allConnections.push(nextConn);
      }
    }
  }

  gameDialogueMakerProject.characters.forEach((character) => {
    const charId = Number(character.characterID);
    const hiddenSet = hiddenNodeSetByCharacter.get(charId) || new Set();

    // ✅ Always draw root outgoing lines.
    // If character hides children, SVGConnections will stub because targets are hidden.
    // But we ALSO want a stub hint even if character has no visible targets (source hides).
    // We'll treat character.hideChildren like "source hides": render stubs from root sockets.
    if (character.hideChildren === true) {
      (character.outgoingLines || []).forEach((outgoingLine) => {
        pushStubForOutgoingLine(outgoingLine, true, charId, 0);
      });
      // Also still render (optional) the real lines so SVGConnections can stub based on hidden target.
      // If you don't want duplicates, DO NOT push real ones in this branch.
      // We'll skip drawOutgoingLines() to avoid duplicates.
      return;
    }

    // Character root outgoing lines
    drawOutgoingLines(character, true, charId, hiddenSet);

    // Dialogue nodes outgoing lines
    (character.dialogueNodes || []).forEach((dialogueNode) => {
      const id = Number(dialogueNode.dialogueID);
      if (hiddenSet.has(id)) return;

      // Even if this node has hideChildren, we still call drawOutgoingLines()
      // so it can render stub hints from its own sockets.
      drawOutgoingLines(dialogueNode, false, charId, hiddenSet);
    });
  });

  // keep for drag-end rebuilds
  window.__gdmAllConnections = allConnections;

  SVGConnections.render(allConnections);

  // After render, set stub endpoints (short dotted hint)
  requestAnimationFrame(() => {
    const STUB_LEN = 28;
    const worldEl = document.getElementById("mainArea");

    allConnections.forEach((conn) => {
      if (!conn || conn.type !== "stub") return;

      const fromChar = conn.from.characterId;
      const fromNode = conn.from.dialogueId;

      const isRoot = !!conn.from.isCharacter || Number(fromNode) === 0;
      const nodeEl = isRoot
        ? document.querySelector(`.characterRoot[data-character-id="${fromChar}"]`)
        : document.querySelector(`.blockWrap.dialogue[data-character-id="${fromChar}"][data-dialogue-id="${fromNode}"]`);

      if (!nodeEl) return;

      const btn = nodeEl.querySelector(`.blockPlusButton[data-buttonindex="${conn.from.socketIndex}"]`);
      if (!btn) return;

      const p = SVGConnections.getWorldPointOfElement(btn, worldEl);
      conn._floatingEnd = { x: p.x, y: p.y + STUB_LEN };
    });

    SVGConnections.requestUpdate();

    requestAnimationFrame(() => {
      rebuildConditionCirclesFromSvgConnections(allConnections);
    });
  });

  $(".blockPlusButton").each(function () {
    checkIfPlusButtonShouldBeTurnedOff(this);
  });

} // end drawDialogueMakerProject


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBodyZoomFactor() {
  const zRaw = window.getComputedStyle(document.body).zoom;
  let z = 1;
  if (zRaw) z = String(zRaw).includes("%") ? parseFloat(zRaw) / 100 : parseFloat(zRaw);
  if (!isFinite(z) || z <= 0) z = 1;
  return z;
}


// ---------------------------------------------------------------------------
// Subtree drag (LIVE) for flat DOM
// ---------------------------------------------------------------------------

let __subtreeDrag = null;
// { type:"character"|"dialogue", characterId, rootDialogueId,
//   start: Map(key-> {x,y}), elements: Map(key->HTMLElement), rootKey }

function buildChildrenMapForCharacter(charObj) {
  const map = {};
  const byId = {};
  (charObj.dialogueNodes || []).forEach((n) => (byId[Number(n.dialogueID)] = n));

  (charObj.dialogueNodes || []).forEach((n) => {
    const fromId = Number(n.dialogueID);
    (n.outgoingLines || []).forEach((l) => {
      const toId = Number(l.toNode);
      if (!Number.isFinite(toId) || toId <= 0) return;
      const target = byId[toId];
      if (!target) return;
      if (!map[fromId]) map[fromId] = [];
      map[fromId].push(target);
    });
  });

  return { map, byId };
}

function collectDescendants(charObj, startDialogueId) {
  const { map } = buildChildrenMapForCharacter(charObj);
  const out = [];
  const seen = new Set();
  const stack = [Number(startDialogueId)];

  while (stack.length) {
    const id = stack.pop();
    const kids = map[id] || [];
    for (const kid of kids) {
      const kidId = Number(kid.dialogueID);
      if (seen.has(kidId)) continue;
      seen.add(kidId);
      out.push(kid);
      stack.push(kidId);
    }
  }
  return out;
}

function getDialogueEl(characterId, dialogueId) {
  return document.querySelector(
    `.blockWrap.dialogue[data-character-id="${Number(characterId)}"][data-dialogue-id="${Number(dialogueId)}"]`
  );
}

function applyDeltaToEl(el, startX, startY, dx, dy) {
  if (!el) return;
  el.style.left = (startX + dx) + "px";
  el.style.top = (startY + dy) + "px";
}


// DRAGGABLE SETTINGS
const draggableSettings = {
  cancel: "input, textarea, select, option, button, .blockPlusButton, .eyeImage, .topConnectionSocket, .conditionCircle",
  distance: 3,

  start: function (event, ui) {
    const z = getBodyZoomFactor();
    ui.position.left /= z;
    ui.position.top /= z;
    if (ui.originalPosition) {
      ui.originalPosition.left /= z;
      ui.originalPosition.top /= z;
    }

    const el = ui.helper.get(0);
    const isChar = el.classList.contains("characterRoot");
    const characterId = Number(el.dataset.characterId);
    if (!Number.isFinite(characterId)) return;

    const charObj = gameDialogueMakerProject.characters.find((c) => Number(c.characterID) === characterId);
    if (!charObj) return;

    __subtreeDrag = {
      type: isChar ? "character" : "dialogue",
      characterId,
      rootDialogueId: isChar ? null : Number(el.dataset.dialogueId),
      start: new Map(),
      elements: new Map(),
      rootKey: isChar ? `char:${characterId}` : `dlg:${characterId}:${Number(el.dataset.dialogueId)}`,
    };

    const rootStartX = ui.originalPosition ? ui.originalPosition.left : parseFloat(el.style.left) || 0;
    const rootStartY = ui.originalPosition ? ui.originalPosition.top : parseFloat(el.style.top) || 0;

    __subtreeDrag.start.set(__subtreeDrag.rootKey, { x: rootStartX, y: rootStartY });
    __subtreeDrag.elements.set(__subtreeDrag.rootKey, el);

    if (isChar) {
      // affect ALL dialogue nodes of this character
      (charObj.dialogueNodes || []).forEach((n) => {
        const key = `dlg:${characterId}:${Number(n.dialogueID)}`;
        const nodeEl = getDialogueEl(characterId, n.dialogueID);
        if (!nodeEl) return;

        const sx = parseFloat(nodeEl.style.left) || 0;
        const sy = parseFloat(nodeEl.style.top) || 0;
        __subtreeDrag.start.set(key, { x: sx, y: sy });
        __subtreeDrag.elements.set(key, nodeEl);
      });
    } else {
      const rootId = __subtreeDrag.rootDialogueId;
      if (!Number.isFinite(rootId)) return;

      const descendants = collectDescendants(charObj, rootId);
      descendants.forEach((n) => {
        const key = `dlg:${characterId}:${Number(n.dialogueID)}`;
        const nodeEl = getDialogueEl(characterId, n.dialogueID);
        if (!nodeEl) return;

        const sx = parseFloat(nodeEl.style.left) || 0;
        const sy = parseFloat(nodeEl.style.top) || 0;
        __subtreeDrag.start.set(key, { x: sx, y: sy });
        __subtreeDrag.elements.set(key, nodeEl);
      });
    }
  },

  drag: function (event, ui) {
    const z = getBodyZoomFactor();
    ui.position.left /= z;
    ui.position.top /= z;

    if (!__subtreeDrag) {
      if (window.SVGConnections) SVGConnections.requestUpdate();
      $(".conditionCircle").hide();
      return;
    }

    const root = __subtreeDrag.start.get(__subtreeDrag.rootKey);
    if (!root) return;

    const dx = ui.position.left - root.x;
    const dy = ui.position.top - root.y;

    for (const [key, startPos] of __subtreeDrag.start.entries()) {
      const el = __subtreeDrag.elements.get(key);
      applyDeltaToEl(el, startPos.x, startPos.y, dx, dy);
    }

    if (window.SVGConnections) SVGConnections.requestUpdate();
    $(".conditionCircle").hide();
  },

  stop: function (event, ui) {
    if (__subtreeDrag) {
      const root = __subtreeDrag.start.get(__subtreeDrag.rootKey);
      const el = ui.helper.get(0);

      const rootNowX = parseFloat(el.style.left) || 0;
      const rootNowY = parseFloat(el.style.top) || 0;

      const dx = root ? (rootNowX - root.x) : 0;
      const dy = root ? (rootNowY - root.y) : 0;

      const characterId = __subtreeDrag.characterId;
      const charObj = gameDialogueMakerProject.characters.find((c) => Number(c.characterID) === Number(characterId));

      if (charObj) {
        if (__subtreeDrag.type === "character") {
          charObj.characterNodeX = (Number(charObj.characterNodeX) || 0) + dx;
          charObj.characterNodeY = (Number(charObj.characterNodeY) || 0) + dy;

          (charObj.dialogueNodes || []).forEach((n) => {
            n.dialogueNodeX = (Number(n.dialogueNodeX) || 0) + dx;
            n.dialogueNodeY = (Number(n.dialogueNodeY) || 0) + dy;
          });
        } else {
          const rootId = Number(__subtreeDrag.rootDialogueId);
          const rootNode = (charObj.dialogueNodes || []).find((n) => Number(n.dialogueID) === rootId);
          if (rootNode) {
            rootNode.dialogueNodeX = (Number(rootNode.dialogueNodeX) || 0) + dx;
            rootNode.dialogueNodeY = (Number(rootNode.dialogueNodeY) || 0) + dy;
          }

          const descendants = collectDescendants(charObj, rootId);
          descendants.forEach((n) => {
            n.dialogueNodeX = (Number(n.dialogueNodeX) || 0) + dx;
            n.dialogueNodeY = (Number(n.dialogueNodeY) || 0) + dy;
          });
        }
      }

      __subtreeDrag = null;
    } else {
      // fallback single element
      updateElementPositionInObject(ui.helper);
    }

    if (!eraseMode) storeMasterObjectToLocalStorage({ redraw: false });

    $(".conditionCircle").hide();

    requestAnimationFrame(() => {
      if (window.SVGConnections) SVGConnections.requestUpdate();
      requestAnimationFrame(() => {
        rebuildConditionCirclesFromSvgConnections(window.__gdmAllConnections || []);
        $(".conditionCircle").show();
      });
    });
  },
};


// ---------------------------------------------------------------------------
// Hide system (graph-based because DOM is flat)
// ---------------------------------------------------------------------------

function buildHiddenNodeSets() {
  const out = new Map(); // charId -> Set(hidden dialogue IDs)

  gameDialogueMakerProject.characters.forEach((character) => {
    const charId = Number(character.characterID);
    const hidden = new Set();

    if (character.hideChildren === true) {
      (character.dialogueNodes || []).forEach((n) => hidden.add(Number(n.dialogueID)));
      out.set(charId, hidden);
      return;
    }

    const { map: kidsMap } = buildChildrenMapForCharacter(character);

    function dfsHide(fromId) {
      const kids = kidsMap[Number(fromId)] || [];
      kids.forEach((kid) => {
        const kidId = Number(kid.dialogueID);
        if (hidden.has(kidId)) return;
        hidden.add(kidId);
        dfsHide(kidId);
      });
    }

    (character.dialogueNodes || []).forEach((n) => {
      if (n.hideChildren === true) dfsHide(Number(n.dialogueID));
    });

    out.set(charId, hidden);
  });

  return out;
}

function applyHideToElementsGraph() {
  document.querySelectorAll(".blockWrap.hide").forEach((e) => e.classList.remove("hide"));

  const hiddenSets = buildHiddenNodeSets();

  gameDialogueMakerProject.characters.forEach((character) => {
    const charId = Number(character.characterID);
    const hidden = hiddenSets.get(charId) || new Set();

    hidden.forEach((dlgId) => {
      const el = document.querySelector(
        `.blockWrap.dialogue[data-character-id="${charId}"][data-dialogue-id="${dlgId}"]`
      );
      if (el) el.classList.add("hide");
    });
  });
}


// ---------------------------------------------------------------------------
// Small helper
// ---------------------------------------------------------------------------

function autoGrowTextArea(element) {
  element.style.height = "5px";
  element.style.height = element.scrollHeight + "px";
}
