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

  // Create circle div
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.left = (screenPt.x + window.scrollX) + "px";
  div.style.top  = (screenPt.y + window.scrollY) + "px";
  div.style.borderRadius = "50%";
  div.classList.add("conditionCircle");

  div.setAttribute("data-fromnode", fromNode);
  div.setAttribute("data-tonode", toNode);
  div.setAttribute("data-character", character);
  div.setAttribute("title", "Click to add a condition for the transition");

  document.body.appendChild(div);

  return [screenPt.x, screenPt.y];
}
