// checkIfPlusButtonShouldBeTurnedOff.js
function checkIfPlusButtonShouldBeTurnedOff(theButton) {

  const $btn = $(theButton);
  const $wrap = $btn.closest(".blockWrap");

  // Helper: robust ID extraction
  function numFromAttr($el, attrName) {
    const v = $el.attr(attrName);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function numFromIdLike($el) {
    const id = $el.attr("id");
    if (!id) return null;
    const digits = String(id).replace(/\D/g, "");
    if (!digits) return null;
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  // Default: clickable unless we find a connection occupying this socket
  let accept = true;

  // --- CHARACTER ROOT BUTTON ---
  if ($wrap.hasClass("characterRoot")) {
    const characterId =
      numFromAttr($wrap, "data-character-id") ??
      numFromIdLike($wrap);

    const charObj = getCharacterById(characterId);
    if (!charObj) {
      // If we can't find the character, don't block clicks
      accept = true;
    } else {
      // One socket on character root: accept only if no outgoing lines yet
      accept = (charObj.outgoingLines || []).length < 1;
    }

  } else {
    // --- DIALOGUE NODE BUTTON (flat-safe) ---
    const dialogueId =
      numFromAttr($wrap, "data-dialogue-id") ??
      numFromIdLike($wrap);

    const characterId =
      numFromAttr($wrap, "data-character-id") ??
      // fallback: any ancestor that might carry the character id
      numFromAttr($wrap.closest("[data-character-id]"), "data-character-id") ??
      null;

    const plusButtonIndex = String($btn.attr("data-buttonindex") ?? "0");

    if (dialogueId == null || characterId == null) {
      // Can't resolve ownership -> don't block
      accept = true;
    } else {
      const dialogueNodeInMaster = getDialogueNodeById(characterId, dialogueId);

      if (!dialogueNodeInMaster) {
        accept = true;
      } else {
        // If an outgoing line already uses this socket, block it
        accept = true;
        (dialogueNodeInMaster.outgoingLines || []).forEach((outgoingLine) => {
          if (String(outgoingLine.fromSocket) === plusButtonIndex) {
            accept = false;
          }
        });
      }
    }
  }

  // Apply result to DOM
  $btn.attr("data-acceptclicks", accept ? "true" : "false");

  if (!accept) $btn.addClass("no-clicks");
  else $btn.removeClass("no-clicks");
}
