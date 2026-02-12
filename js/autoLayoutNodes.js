function autoLayoutAllCharacters() {
    const X_GAP = 220;
    const Y_GAP = 180;
    const ROOT_OFFSET_Y = 140;

    gameDialogueMakerProject.characters.forEach(character => {
        const nodeMap = new Map(character.dialogueNodes.map(n => [String(n.dialogueID), n]));

        // roots = not targeted
        const targeted = new Set();
        character.dialogueNodes.forEach(n => (n.outgoingLines || []).forEach(l => targeted.add(String(l.toNode))));
        const roots = character.dialogueNodes.filter(n => !targeted.has(String(n.dialogueID)));

        if (!roots.length) return;

        // Anchor X under the character's plus button (socket 0), fallback to characterNodeX
        let anchorX = Number(character.characterNodeX) || 0;
        const charEl = document.querySelector(`.characterRoot[data-character-id="${character.characterID}"]`);
        const plus = charEl ? charEl.querySelector(`.blockPlusButton[data-buttonindex="0"]`) : null;
        const main = document.getElementById("mainArea");
        if (plus && main) {
            const pr = plus.getBoundingClientRect();
            const mr = main.getBoundingClientRect();
            const z = (window.SVGConnections && SVGConnections.screenToWorld) ? null : 1;
            // compensate for body zoom if needed
            let zoom = 1;
            const zRaw = getComputedStyle(document.body).zoom;
            if (zRaw) zoom = String(zRaw).includes('%') ? parseFloat(zRaw) / 100 : parseFloat(zRaw);
            if (!isFinite(zoom) || zoom <= 0) zoom = 1;
            anchorX = ((pr.left + pr.width / 2) - mr.left) / zoom;
        }

        const startY = (Number(character.characterNodeY) || 0) + ROOT_OFFSET_Y;

        // Pack multiple roots tightly around anchorX
        const widths = roots.map(r => measureWidthUnits(r, nodeMap));
        const totalUnits = widths.reduce((a, b) => a + b, 0);
        const totalPx = (totalUnits - 1) * X_GAP;

        let cursor = anchorX - totalPx / 2;

        roots.forEach((root, i) => {
            const w = widths[i];
            const rootX = cursor + ((w - 1) * X_GAP) / 2;

            layoutMinLines(root, rootX, startY, nodeMap, X_GAP, Y_GAP);

            cursor += w * X_GAP;
        });

        console.group(`AUTO-LAYOUT character ${character.characterID} (${character.characterName})`);

        console.log(
            "Roots:",
            roots.map(n => n.dialogueID)
        );

        console.log(
            "Outgoing map:",
            character.dialogueNodes.map(n => ({
                id: n.dialogueID,
                outgoing: (n.outgoingLines || []).map(l => l.toNode)
            }))
        );

    });
}


function layoutSubtreeTight(node, x, y, character, nodeMap, X_GAP, Y_GAP) {

    node.dialogueNodeX = x;
    node.dialogueNodeY = y;

    const kids = getChildren(node, character, nodeMap);

    if (kids.length === 0) return;

    // ✅ Keep single-child lines as short as possible: same X (vertical chain)
    if (kids.length === 1) {
        layoutSubtreeTight(kids[0], x, y + Y_GAP, character, nodeMap, X_GAP, Y_GAP);
        return;
    }

    // For multiple children: compute widths and pack them centered under parent
    const widths = kids.map(k => measureSubtreeWidth(k, character, nodeMap, X_GAP));
    const total = widths.reduce((a, b) => a + b, 0);

    // Convert "width units" into actual pixels spacing.
    // Each width unit roughly maps to X_GAP.
    const totalPx = (total - 1) * X_GAP;

    let cursor = x - totalPx / 2;

    for (let i = 0; i < kids.length; i++) {
        const w = widths[i];
        const childCenterX = cursor + ((w - 1) * X_GAP) / 2;
        layoutSubtreeTight(kids[i], childCenterX, y + Y_GAP, character, nodeMap, X_GAP, Y_GAP);
        cursor += w * X_GAP;
    }
}



function packSubtrees(roots, character, nodeMap, X_GAP) {
    return roots.map(root => ({
        root,
        width: measureSubtreeWidth(root, character, nodeMap, X_GAP)
    }));
}

// Width in "layout units" so siblings don't explode sideways.
// - single child => width = 1 (keeps chain vertical)
// - multiple children => sum child widths + gaps
function measureSubtreeWidth(node, character, nodeMap, X_GAP) {
    const kids = getChildren(node, character, nodeMap);
    if (kids.length === 0) return 1;
    if (kids.length === 1) return 1;

    const childWidths = kids.map(k => measureSubtreeWidth(k, character, nodeMap, X_GAP));
    return childWidths.reduce((a, b) => a + b, 0);
}

function getChildren(node, character, nodeMap) {
    const out = node.outgoingLines || [];
    const kids = [];
    for (const l of out) {
        const child = nodeMap.get(String(l.toNode));
        if (child) kids.push(child);
    }
    return kids;
}


function getChildrenFromMap(node, nodeMap) {
    const kids = [];
    for (const l of (node.outgoingLines || [])) {
        const child = nodeMap.get(String(l.toNode));
        if (child) kids.push(child);
    }
    return kids;
}

// width units: chain = 1, branching = sum of child widths
function measureWidthUnits(node, nodeMap) {
  const kids = getChildrenFromMap(node, nodeMap);

  console.log(
    `[WIDTH] node ${node.dialogueID} → children`,
    kids.map(k => k.dialogueID)
  );

  if (kids.length === 0) {
    console.log(`[WIDTH] node ${node.dialogueID} = 1 (leaf)`);
    return 1;
  }

  if (kids.length === 1) {
    console.log(`[WIDTH] node ${node.dialogueID} = 1 (single-child)`);
    return 1;
  }

  const w = kids
    .map(k => measureWidthUnits(k, nodeMap))
    .reduce((a, b) => a + b, 0);

  console.log(`[WIDTH] node ${node.dialogueID} = ${w} (branch)`);

  return w;
}


function layoutMinLines(node, x, y, nodeMap, X_GAP, Y_GAP) {

  console.log(
    `[PLACE] node ${node.dialogueID} at`,
    { x, y }
  );

  node.dialogueNodeX = x;
  node.dialogueNodeY = y;

  const kids = getChildrenFromMap(node, nodeMap);

  console.log(
    `[PLACE] node ${node.dialogueID} children`,
    kids.map(k => k.dialogueID)
  );

  if (kids.length === 0) {
    console.log(`[PLACE] node ${node.dialogueID} → leaf`);
    return;
  }

  if (kids.length === 1) {
    console.log(
      `[PLACE] node ${node.dialogueID} → vertical child ${kids[0].dialogueID}`
    );
    layoutMinLines(kids[0], x, y + Y_GAP, nodeMap, X_GAP, Y_GAP);
    return;
  }

  console.log(
    `[PLACE] node ${node.dialogueID} → branching (${kids.length} children)`
  );

  const widths = kids.map(k => measureWidthUnits(k, nodeMap));
  const totalUnits = widths.reduce((a, b) => a + b, 0);
  const totalPx = (totalUnits - 1) * X_GAP;

  let cursor = x - totalPx / 2;

  for (let i = 0; i < kids.length; i++) {
    const w = widths[i];
    const cx = cursor + ((w - 1) * X_GAP) / 2;

    console.log(
      `[PLACE] child ${kids[i].dialogueID}`,
      { cx, parentX: x, widthUnits: w }
    );

    layoutMinLines(kids[i], cx, y + Y_GAP, nodeMap, X_GAP, Y_GAP);
    cursor += w * X_GAP;
  }
}
