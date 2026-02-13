function updateElementPositionInObject(draggedElement, blockObject) {
    // Accept DOM element, jQuery object, or id string
    let el = draggedElement;

    // If it's a jQuery object, unwrap it
    if (el && el.jquery) el = el[0];

    // If it's an id string, resolve it
    if (typeof el === "string") el = document.getElementById(el);

    if (!el) return;

    const zoom = (typeof getBodyZoomFactor === "function") ? getBodyZoomFactor() : 1;

    const mainArea = document.getElementById("mainArea");
    if (!mainArea) return;

    const mainRect = mainArea.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // World position inside mainArea, compensated for CSS zoom
    const left = (elRect.left - mainRect.left) / zoom;
    const top  = (elRect.top  - mainRect.top)  / zoom;

    const id = el.id;

    // Store back to your data model
    if (blockObject && blockObject[id]) {
        blockObject[id].left = left;
        blockObject[id].top = top;
        return;
    }

    if (blockObject && blockObject.blocks && blockObject.blocks[id]) {
        blockObject.blocks[id].left = left;
        blockObject.blocks[id].top = top;
        return;
    }

    // Fallback if caller passed the record itself
    if (blockObject && typeof blockObject === "object") {
        blockObject.left = left;
        blockObject.top = top;
    }
}
