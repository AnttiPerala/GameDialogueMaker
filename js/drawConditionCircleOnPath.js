function getMidpoint(path) {
    // Get the starting and ending coordinates of the line
    var pathLength = path.getTotalLength();
    var midpoint = path.getPointAtLength(pathLength / 2);
    

    // Create a new HTML element for the div
    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = midpoint.x + "px";
    div.style.top = midpoint.y + "px";
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.backgroundColor = "red";
    div.style.borderRadius = "50%";

    // Add the div to the body
    document.body.appendChild(div);
    return [midpoint.x, midpoint.y];


}