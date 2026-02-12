function drawConditionCircle(path, character, fromNode, toNode) {
  if (!path) return;

  const svg = path.ownerSVGElement;
  if (!svg) return;

  const pathLength = path.getTotalLength();
  if (!pathLength || !isFinite(pathLength)) return;

  const midpoint = path.getPointAtLength(pathLength / 2);

  // Convert SVG coords -> screen coords
  const pt = svg.createSVGPoint();
  pt.x = midpoint.x;
  pt.y = midpoint.y;

  const ctm = path.getScreenCTM();
  if (!ctm) return;

  const screenPt = pt.matrixTransform(ctm);

  // ✅ COMPENSATE for CSS body zoom (so we don't double-scale)
  // body zoom might be "80%" or "0.8" depending on how it's set/read
  let z = 1;
  const zRaw = window.getComputedStyle(document.body).zoom;
  if (zRaw) {
    if (String(zRaw).includes("%")) z = parseFloat(zRaw) / 100;
    else z = parseFloat(zRaw);
  }
  if (!isFinite(z) || z <= 0) z = 1;

  // Create circle div
  const div = document.createElement("div");
  div.style.position = "absolute";

  // Divide by zoom so visual position matches the line
  div.style.left = ((screenPt.x + window.scrollX) / z) + "px";
  div.style.top  = ((screenPt.y + window.scrollY) / z) + "px";

  div.style.borderRadius = "50%";
  div.classList.add("conditionCircle");

  div.setAttribute("data-fromnode", fromNode);
  div.setAttribute("data-tonode", toNode);
  div.setAttribute("data-character", character);
  div.setAttribute("title", "Click to add a condition for the transition");

  document.body.appendChild(div);

  return [screenPt.x, screenPt.y];
}
