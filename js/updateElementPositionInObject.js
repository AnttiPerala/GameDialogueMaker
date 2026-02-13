// updateElementPositionInObject.js
// Update ONLY the dragged element's position in the master object (WORLD coords).
// Subtree shifting is handled by drawDialogueMakerProject.js draggable stop.

function updateElementPositionInObject(draggedElement) {
  const el = draggedElement?.get?.(0) || draggedElement;
  if (!el) return;

  const isCharacterRoot = el.classList.contains("characterRoot");
  const characterId = Number(el.dataset.characterId);

  if (!Number.isFinite(characterId)) return;

  const charObj = gameDialogueMakerProject.characters.find(
    (c) => Number(c.characterID) === characterId
  );
  if (!charObj) return;

  // Get WORLD top-left from screen coords (handles zoom/pan via SVGConnections)
  const r = el.getBoundingClientRect();

  let newWorldLeft = 0;
  let newWorldTop = 0;

  if (window.SVGConnections && typeof SVGConnections.screenToWorld === "function") {
    const w = SVGConnections.screenToWorld(r.left, r.top);
    newWorldLeft = w.x;
    newWorldTop = w.y;
  } else {
    // fallback (no zoom support)
    const main = document.getElementById("mainArea")?.getBoundingClientRect();
    if (!main) return;
    newWorldLeft = r.left - main.left;
    newWorldTop = r.top - main.top;
  }

  if (isCharacterRoot) {
    charObj.characterNodeX = newWorldLeft;
    charObj.characterNodeY = newWorldTop;
    return;
  }

  const dialogueId = Number(el.dataset.dialogueId);
  if (!Number.isFinite(dialogueId)) return;

  const nodeObj = (charObj.dialogueNodes || []).find(
    (n) => Number(n.dialogueID) === dialogueId
  );
  if (!nodeObj) return;

  nodeObj.dialogueNodeX = newWorldLeft;
  nodeObj.dialogueNodeY = newWorldTop;
}
