// updateLines2.js
// Safe updater during drag: supports both LeaderLine leftovers (e.g. dotted nextNode lines)
// and the new SVGConnections renderer.

function updateLines(uiHelper) {

  // 1) Update SVG connections (your new system)
  if (window.SVGConnections && typeof SVGConnections.requestUpdate === "function") {
    SVGConnections.requestUpdate();
  }

  // 2) Update any remaining LeaderLine instances (legacy)
  //    (Your project still creates dotted LeaderLines for nextNode, etc.)
  try {
    // Update dotted "next node" lines if they exist on nodes
    if (window.gameDialogueMakerProject && gameDialogueMakerProject.characters) {
      gameDialogueMakerProject.characters.forEach((character) => {

        // characterRoot dotted? (if you ever add them)
        if (character && character.nextNodeLineElem && typeof character.nextNodeLineElem.position === "function") {
          character.nextNodeLineElem.position();
        }

        // dialogue nodes dotted + any legacy outgoing lines
        (character.dialogueNodes || []).forEach((node) => {

          // dotted next-node line
          if (node.nextNodeLineElem && typeof node.nextNodeLineElem.position === "function") {
            node.nextNodeLineElem.position();
          }

          // legacy outgoing LeaderLines (most will now be "" or missing)
          (node.outgoingLines || []).forEach((line) => {
            if (line && line.lineElem && typeof line.lineElem.position === "function") {
              line.lineElem.position();
            }
          });
        });
      });
    }

    // Also update anything in your global leaderLines array if it’s still used
    if (window.leaderLines && Array.isArray(window.leaderLines)) {
      window.leaderLines.forEach((ll) => {
        if (ll && typeof ll.position === "function") ll.position();
      });
    }

  } catch (err) {
    // Don't let line updating crash dragging
    console.warn("updateLines(): safe-caught error:", err);
  }
}
