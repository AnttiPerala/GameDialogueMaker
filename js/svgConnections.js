/* svgConnections.js
   Drop-in SVG connection renderer + endpoint-drag “disconnect/reconnect” interaction.

   Key behavior:
   - Dragging the end circle visually detaches during drag
   - Real detach is handled by host on pointerup via onDropCancel / onDropConnect
*/

(() => {
  const NS = "http://www.w3.org/2000/svg";

  const state = {
    worldEl: null,
    svgEl: null,
    gEl: null,
    camera: { zoom: 1 },
    svgByConnId: new Map(),
    connections: [],
    pending: false,
    drag: null, // { connId, pointerId }
  };

  const API = {
    init,
    render,
    requestUpdate,
    setZoom,

    // Hooks user code can override:
    // NOTE: we no longer call onDetach automatically on pointerdown.
    onDetach: (conn) => { },

    // Called on pointerup if dropped on a plus button.
    onDropConnect: (conn, dropTarget) => false,

    // Called on pointerup if not dropped on a valid target OR if onDropConnect returns false.
    onDropCancel: (conn) => { },

    getWorldPointOfElement,
    screenToWorld,
  };

  window.SVGConnections = API;

  function init(opts = {}) {
    const worldId = opts.worldId || "mainArea";
    state.worldEl = document.getElementById(worldId);
    if (!state.worldEl) throw new Error(`[SVGConnections] world element #${worldId} not found`);

    const cs = getComputedStyle(state.worldEl);
    if (cs.position === "static") state.worldEl.style.position = "relative";

    let svg = state.worldEl.querySelector(":scope > svg#connectionsSvg");
    if (!svg) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("id", "connectionsSvg");
      svg.style.position = "absolute";
      svg.style.left = "0";
      svg.style.top = "0";
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.overflow = "visible";
      svg.style.pointerEvents = "none";
      svg.style.zIndex = "5";

      const g = document.createElementNS(NS, "g");
      g.setAttribute("id", "connectionsGroup");
      svg.appendChild(g);

      // Insert behind nodes (optional)
      state.worldEl.insertBefore(svg, state.worldEl.firstChild);
    }

    state.svgEl = svg;
    state.gEl = svg.querySelector("#connectionsGroup") || svg;

    // Only add listeners once (avoid stacking)
    if (!window.__svgConnectionsListenersAdded) {
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp, { passive: false });
      window.__svgConnectionsListenersAdded = true;
    }

    injectDefaultStyles();
  }

  function injectDefaultStyles() {
    if (document.getElementById("svgConnectionsStyles")) return;
    const style = document.createElement("style");
    style.id = "svgConnectionsStyles";
    style.textContent = `
      #connectionsSvg .connection-path{
        fill:none;
        stroke:#2d86ff;
        stroke-width:3;
        vector-effect: non-scaling-stroke;
      }
      #connectionsSvg .connection-path.dashed{
        stroke-dasharray: 8 8;
        opacity: 0.75;
      }
      #connectionsSvg .endpoint{
        fill:#2d86ff;
        stroke:#ffffff;
        stroke-width:2;
        vector-effect: non-scaling-stroke;
        pointer-events:all;
      }
      #connectionsSvg .endpoint.end{
        cursor: grab;
      }
      #connectionsSvg .endpoint.end.dragging{
        cursor: grabbing;
      }
      #connectionsSvg .connection-path.dim{
        opacity:0.35;
      }
      /* Don't hint drag on dashed/next connections */
      #connectionsSvg g.is-next .endpoint.end{
        cursor: default;
      }
    `;
    document.head.appendChild(style);
  }

  function setZoom(zoom) {
    state.camera.zoom = Math.max(0.01, Number(zoom) || 1);
    requestUpdate();
  }

  function render(connections) {
    if (!state.worldEl || !state.svgEl) {
      throw new Error("[SVGConnections] Call SVGConnections.init() first.");
    }
    state.connections = Array.isArray(connections) ? connections : [];
    syncSvgElementsToConnections();
    requestUpdate();
  }

  function requestUpdate() {
    if (state.pending) return;
    state.pending = true;
    requestAnimationFrame(() => {
      state.pending = false;
      redrawAll();
    });
  }

  function syncSvgElementsToConnections() {
    const keep = new Set(state.connections.map(c => c.id));

    for (const [id, el] of state.svgByConnId.entries()) {
      if (!keep.has(id)) {
        el.g.remove();
        state.svgByConnId.delete(id);
      }
    }

    for (const conn of state.connections) {
      ensureConnSvg(conn);
    }
  }

  function ensureConnSvg(conn) {
    if (state.svgByConnId.has(conn.id)) return state.svgByConnId.get(conn.id);

    const g = document.createElementNS(NS, "g");
    g.classList.add("conn");
    g.setAttribute("data-conn-id", conn.id); // ✅ matches selector

    if (conn.type === "next") g.classList.add("is-next");

    const path = document.createElementNS(NS, "path");
    path.classList.add("connection-path");
    if (conn.type === "next") path.classList.add("dashed");

    const cStart = document.createElementNS(NS, "circle");
    cStart.classList.add("endpoint", "start");
    cStart.setAttribute("r", "6");

    const cEnd = document.createElementNS(NS, "circle");
    cEnd.classList.add("endpoint", "end");
    cEnd.setAttribute("r", "7");

    // Only normal (non-next) connections are draggable
    if (conn.type !== "next") {
      cEnd.addEventListener("pointerdown", (e) => startDragEnd(e, conn.id));
    }

    g.appendChild(path);
    g.appendChild(cStart);
    g.appendChild(cEnd);

    state.gEl.appendChild(g);

    const record = { g, path, cStart, cEnd };
    state.svgByConnId.set(conn.id, record);
    return record;
  }

  function redrawAll() {
    for (const conn of state.connections) {
      updateConnSvg(conn);
    }
  }

  function updateConnSvg(conn) {
    const rec = state.svgByConnId.get(conn.id) || ensureConnSvg(conn);

    // keep dashed state in sync
    if (conn.type === "next") rec.path.classList.add("dashed");
    else rec.path.classList.remove("dashed");

    const p1 = getFromPoint(conn);
    const p2 = getToPoint(conn);

    const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    rec.path.setAttribute("d", d);
    rec.path.setAttribute("d", d);

    rec.cStart.setAttribute("cx", p1.x);
    rec.cStart.setAttribute("cy", p1.y);

    rec.cEnd.setAttribute("cx", p2.x);
    rec.cEnd.setAttribute("cy", p2.y);

    if (state.drag && state.drag.connId === conn.id) {
      rec.path.classList.add("dim");
      rec.cEnd.classList.add("dragging");
    } else {
      rec.path.classList.remove("dim");
      rec.cEnd.classList.remove("dragging");
    }
  }

  function getFromPoint(conn) {
    const el = getFromPortEl(conn);
    if (!el) return { x: 0, y: 0 };
    return getWorldPointOfElement(el, state.worldEl);
  }

  function getToPoint(conn) {
    if (state.drag && state.drag.connId === conn.id && conn._floatingEnd) {
      return conn._floatingEnd;
    }

    if (!conn.to) {
      return conn._floatingEnd || getFromPoint(conn);
    }

    const el = getToPortEl(conn);
    if (!el) return conn._floatingEnd || getFromPoint(conn);
    return getWorldPointOfElement(el, state.worldEl);
  }

  function getFromPortEl(conn) {
    const isRoot = !!conn.from?.isCharacter || Number(conn.from?.dialogueId) === 0;

    const node = findNodeEl(conn.from?.characterId, conn.from?.dialogueId, isRoot);
    if (!node) return null;

    // ✅ NEXT port starts at the "next" input field
    if (conn.from?.port === "next") {
      return node.querySelector(".next");
    }

    const idx = Number(conn.from?.socketIndex);
    if (!Number.isFinite(idx)) return null;

    return node.querySelector(`.blockPlusButton[data-buttonindex="${idx}"]`);
  }

  function getToPortEl(conn) {
    const node = findNodeEl(conn.to?.characterId, conn.to?.dialogueId);
    if (!node) return null;
    return node.querySelector(".topConnectionSocket");
  }

  function findNodeEl(characterId, dialogueId, isCharacterRoot = false) {
    if (characterId === undefined || dialogueId === undefined) return null;

    const c = String(characterId);
    const d = String(dialogueId);

    if (isCharacterRoot || d === "0") {
      return state.worldEl.querySelector(`.characterRoot[data-character-id="${c}"]`);
    }

    return state.worldEl.querySelector(`.blockWrap[data-character-id="${c}"][data-dialogue-id="${d}"]`);
  }

  function getWorldPointOfElement(el, worldEl) {
    const r = el.getBoundingClientRect();
    const w = worldEl.getBoundingClientRect();
    const sx = (r.left + r.width / 2) - w.left;
    const sy = (r.top + r.height / 2) - w.top;
    const z = state.camera.zoom || 1;
    return { x: sx / z, y: sy / z };
  }

  function screenToWorld(clientX, clientY) {
    const w = state.worldEl.getBoundingClientRect();
    const z = state.camera.zoom || 1;
    return { x: (clientX - w.left) / z, y: (clientY - w.top) / z };
  }

  // --- Drag interaction (visual detach during drag; real detach on release) ---

  function startDragEnd(e, connId) {
    e.preventDefault();
    e.stopPropagation();
    window.__svgEdgeDragging = true;

    const conn = state.connections.find(c => c.id === connId);
    if (!conn) return;

    // Remember original target so host can delete/reconnect correctly on release
    conn._detachedTo = conn.to ? { ...conn.to } : null;

    // Visual detach during drag only
    conn._pendingDetach = true;
    conn.to = null;

    conn._floatingEnd = screenToWorld(e.clientX, e.clientY);
    state.drag = { connId, pointerId: e.pointerId };

    const rec = state.svgByConnId.get(connId);
    if (rec) rec.cEnd.setPointerCapture(e.pointerId);

    requestUpdate();
  }

  function onPointerMove(e) {
    if (!state.drag) return;
    e.preventDefault();

    const conn = state.connections.find(c => c.id === state.drag.connId);
    if (!conn) return;

    conn._floatingEnd = screenToWorld(e.clientX, e.clientY);
    requestUpdate();
  }

  function onPointerUp(e) {
    window.__svgEdgeDragging = false;

    if (!state.drag) return;
    e.preventDefault();

    const conn = state.connections.find(c => c.id === state.drag.connId);
    if (!conn) {
      state.drag = null;
      window.__svgEdgeDragging = false;
      return;
    }

    const drop = findPlusButtonUnderPointer(e.clientX, e.clientY);

    if (drop) {
      let ok = false;
      try { ok = !!API.onDropConnect(conn, drop); } catch (_) { ok = false; }
      if (!ok) {
        try { API.onDropCancel(conn); } catch (_) { }
      }
    } else {
      try { API.onDropCancel(conn); } catch (_) { }
    }

    state.drag = null;
    requestUpdate();
  }

  function findPlusButtonUnderPointer(clientX, clientY) {
    const els = document.elementsFromPoint(clientX, clientY);
    const btn = els.find(el => el && el.classList && el.classList.contains("blockPlusButton"));
    if (!btn) return null;

    const accept = btn.dataset.acceptclicks;
    if (accept === "false") return null;

    // Allow BOTH character root and dialogue nodes
    const charRoot = btn.closest(".characterRoot");
    if (charRoot) {
      return {
        el: btn,
        isCharacterRoot: true,
        characterId: charRoot.dataset.characterId,
        dialogueId: 0,
        socketIndex: Number(btn.dataset.buttonindex),
      };
    }

    const node = btn.closest(".blockWrap");
    if (!node) return null;

    return {
      el: btn,
      isCharacterRoot: false,
      characterId: node.dataset.characterId,
      dialogueId: node.dataset.dialogueId,
      socketIndex: Number(btn.dataset.buttonindex),
    };
  }
})();
