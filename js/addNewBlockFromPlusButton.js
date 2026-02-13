// addNewBlockFromPlusButton.js
// CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW DIALOGUE NODE

// --- world coord helper (handles wrapper transform + body zoom) ---
function getWorldFromClient(clientX, clientY) {
  const worldEl =
    document.querySelector("#mainArea .wrapper") ||
    document.getElementById("mainArea");

  const r = worldEl.getBoundingClientRect();

  // ✅ body zoom compensation (CSS zoom breaks coordinate math otherwise)
  const zRaw = window.getComputedStyle(document.body).zoom;
  let z = 1;
  if (zRaw) z = String(zRaw).includes('%') ? (parseFloat(zRaw) / 100) : parseFloat(zRaw);
  if (!isFinite(z) || z <= 0) z = 1;

  const style = getComputedStyle(worldEl);
  const t =
    style.transform && style.transform !== "none"
      ? style.transform
      : "matrix(1,0,0,1,0,0)";

  const m = new DOMMatrixReadOnly(t);
  const inv = m.inverse();

  // point in element-local screen space → convert to unzoomed local space
  const local = new DOMPoint(
    (clientX - r.left) / z,
    (clientY - r.top) / z
  );

  // convert back to pre-transform world space
  const world = local.matrixTransform(inv);

  return {
    x: world.x,
    y: world.y,
    scaleX: m.a || 1,
    scaleY: m.d || 1,
  };
}

// Get approximate node width in WORLD units by measuring an existing blockWrap
function getNodeWidthWorld(referenceEl) {
  const ref = referenceEl || document.querySelector(".blockWrap.dialogue");
  if (!ref) return 360;

  const rect = ref.getBoundingClientRect();
  const w = getWorldFromClient(rect.left + rect.width, rect.top).x - getWorldFromClient(rect.left, rect.top).x;
  return (isFinite(w) && w > 50) ? w : 360;
}

// CLICK ON THE BLOCK PLUS BUTTON TO ADD A NEW DIALOGUE NODE
$('body').on('click', '.blockPlusButton', function () {
  if ($(this).attr('data-acceptclicks') != 'true') return;

  console.log('plusbuttonclick', this);

  const theClickedPlusButton = $(this);
  const clickedPlusButtonButtonIndex = Number(theClickedPlusButton.attr('data-buttonindex')) || 0;

  const topMostParent = $(this).closest('.blockWrap');
  const parentBlockType = $(this).closest('.blockWrap').find('.selectBlockType').val();

  // Character object (master)
  const info = getInfoByPassingInDialogueNodeOrElement(this);
  const characterObject = info.characterNode;

  // Parent node object in master (can be character root "node 0" style)
  const previousDialogueNodeInMasterObject = findDialogueObjectBasedOnPassedInHtmlElement(this);

  const earlierObjectBGColor =
    previousDialogueNodeInMasterObject?.bgColor ||
    characterObject?.bgColor ||
    '#4b4b4b';

  // Get next dialogue ID
  let biggestDialogueID = getMaxDialogueNodeId(characterObject);
  const newId = biggestDialogueID + 1;

  // ------------------------------------------------------------
  // Placement: anchor to clicked plus-button center (world coords),
  // and place new node just below parent with small padding.
  // ------------------------------------------------------------

  // Anchor to the CLICKED plus button center, converted to WORLD coords
  const pr = theClickedPlusButton.get(0).getBoundingClientRect();
  const centerClientX = pr.left + pr.width / 2;
  const centerClientY = pr.top + pr.height / 2;
  const w = getWorldFromClient(centerClientX, centerClientY);

  // Node width in WORLD units (store LEFT, not center)
  const NODE_WIDTH = getNodeWidthWorld(topMostParent.get(0));
  const px = w.x - NODE_WIDTH / 2;

  // Parent height in WORLD units (to avoid huge gaps)
  const refNode = topMostParent.get(0);
  const rect = refNode ? refNode.getBoundingClientRect() : null;

  const zRaw = window.getComputedStyle(document.body).zoom;
  let z = 1;
  if (zRaw) z = String(zRaw).includes('%') ? (parseFloat(zRaw) / 100) : parseFloat(zRaw);
  if (!isFinite(z) || z <= 0) z = 1;

  const parentH = rect ? (rect.height / z) : 150;

  // Put the new node just below the parent + small padding
  const Y_PAD = 15; // tweak: 10–25
  const py = w.y + (parentH / 2) + Y_PAD;

  // --- CHARACTER ROOT + ---
  if ($(topMostParent).hasClass('characterRoot')) {

    // Connect character -> new node
    characterObject.outgoingLines.push({
      fromNode: 0,
      fromSocket: clickedPlusButtonButtonIndex,
      toNode: newId,
      lineElem: '',
      transitionConditions: []
    });

    const newDialogueNode = {
      dialogueID: newId,
      dialogueType: 'line',
      dialogueText: 'This is a new dialogue node!',
      nextNode: -1,
      dialogueNodeX: px,
      dialogueNodeY: py,
      outgoingSockets: 1,
      bgColor: earlierObjectBGColor,
      nodeElement: $('<div></div>'),
      outgoingLines: []
    };

    characterObject.dialogueNodes.push(newDialogueNode);

  } else {
    // --- NORMAL NODE + ---

    // Connect parent node -> new node
    previousDialogueNodeInMasterObject.outgoingLines.push({
      fromNode: previousDialogueNodeInMasterObject.dialogueID,
      fromSocket: clickedPlusButtonButtonIndex,
      toNode: newId,
      lineElem: '',
      transitionConditions: []
    });

    if (parentBlockType == "line" || parentBlockType == "answer" || parentBlockType == "fight") {

      const newDialogueNode = {
        dialogueID: newId,
        dialogueType: 'line',
        dialogueText: 'This is a new dialogue node!',
        nextNode: -1,
        dialogueNodeX: px,
        dialogueNodeY: py,
        outgoingSockets: 1,
        bgColor: earlierObjectBGColor,
        nodeElement: $('<div></div>'),
        outgoingLines: []
      };

      characterObject.dialogueNodes.push(newDialogueNode);

    } else if (parentBlockType == "question") {
      // Parent is question so this should be an answer
      const newDialogueNode = {
        dialogueID: newId,
        dialogueType: 'answer',
        siblings: 3,
        siblingNumber: clickedPlusButtonButtonIndex + 1,
        dialogueText: 'Fine thank you',
        nextNode: -1,

        // Start under clicked socket (then spread all answers)
        dialogueNodeX: px,
        dialogueNodeY: py,

        outgoingSockets: 1,
        bgColor: earlierObjectBGColor,
        nodeElement: $('<div></div>'),
        outgoingLines: []
      };

      characterObject.dialogueNodes.push(newDialogueNode);

      // Spread all answers under this question under their sockets
      // (do it AFTER node exists)
      positionNewAnswersUnderQuestion(characterObject.characterID, previousDialogueNodeInMasterObject.dialogueID);
    }
  }

  // Persist + redraw
  if (typeof storeMasterObjectToLocalStorage === "function") {
    storeMasterObjectToLocalStorage();
  }

  clearCanvasBeforeReDraw();
  drawDialogueMakerProject();
});


// Spread answers under a question (WORLD coords): place each answer under its socket center
function positionNewAnswersUnderQuestion(characterId, questionId) {
  const charObj = gameDialogueMakerProject.characters.find(c => Number(c.characterID) === Number(characterId));
  if (!charObj) return;

  const q = charObj.dialogueNodes.find(n => Number(n.dialogueID) === Number(questionId));
  if (!q) return;

  const qEl = document.querySelector(`.blockWrap[data-dialogue-id="${questionId}"][data-character-id="${characterId}"]`);
  if (!qEl) return;

  const outgoing = (q.outgoingLines || [])
    .filter(l => Number.isFinite(Number(l.toNode)) && Number(l.toNode) > 0);

  if (!outgoing.length) return;

  // Compute Y below question in world coords
  const qr = qEl.getBoundingClientRect();
  const qBottomWorld = getWorldFromClient(qr.left, qr.top + qr.height).y;
  const targetY = qBottomWorld + 90;

  // Measure answer width (world) from any existing answer/dialogue node
  const sampleAnswerEl =
    document.querySelector(`.blockWrap.dialogue[data-character-id="${characterId}"]`) ||
    document.querySelector(".blockWrap.dialogue");

  const ANSWER_W = getNodeWidthWorld(sampleAnswerEl);

  // stable order: by fromSocket
  outgoing.sort((a, b) => (Number(a.fromSocket) || 0) - (Number(b.fromSocket) || 0));

  // Gather socket X positions (world). Some layouts stack/overlay the plus buttons,
  // which makes all answers land on the same X and overlap. If the socket X range
  // is tiny, we fall back to a nice horizontal spread.
  const socketWorldXs = outgoing.map(line => {
    const socketIndex = Number(line.fromSocket) || 0;
    const plusEl = qEl.querySelector(`.blockPlusButton[data-buttonindex="${socketIndex}"]`);
    if (!plusEl) return NaN;
    const pr = plusEl.getBoundingClientRect();
    const w = getWorldFromClient(pr.left + pr.width / 2, pr.top + pr.height / 2);
    return w.x;
  }).filter(x => isFinite(x));

  const xMin = socketWorldXs.length ? Math.min(...socketWorldXs) : NaN;
  const xMax = socketWorldXs.length ? Math.max(...socketWorldXs) : NaN;
  const socketsAreStacked = (!isFinite(xMin) || !isFinite(xMax)) ? true : (Math.abs(xMax - xMin) < 12);

  // Compute spread if sockets are stacked/too close
  const qCenterWorld = getWorldFromClient(qr.left + qr.width / 2, qr.top + qr.height / 2).x;
  const X_GAP = 40;
  const totalW = outgoing.length * ANSWER_W + Math.max(0, outgoing.length - 1) * X_GAP;
  const startX = qCenterWorld - totalW / 2;

  outgoing.forEach((line, i) => {
    const socketIndex = Number(line.fromSocket) || 0;
    const toId = Number(line.toNode);

    const answerNode = charObj.dialogueNodes.find(n => Number(n.dialogueID) === toId);
    if (!answerNode) return;

    if (socketsAreStacked) {
      // spread answers so they don't overlap
      answerNode.dialogueNodeX = startX + i * (ANSWER_W + X_GAP);
      answerNode.dialogueNodeY = targetY;
      return;
    }

    // Normal: place each answer under its socket center
    const plusEl = qEl.querySelector(`.blockPlusButton[data-buttonindex="${socketIndex}"]`);
    if (!plusEl) return;
    const pr = plusEl.getBoundingClientRect();
    const w = getWorldFromClient(pr.left + pr.width / 2, pr.top + pr.height / 2);

    // store LEFT, not center
    answerNode.dialogueNodeX = w.x - ANSWER_W / 2;
    answerNode.dialogueNodeY = targetY;
  });
}
