
/* 

TO DO:

Memento pattern undo

Command pattern undo would be more efficient but harder to code

turn relevant (connected) plus buttons gray when user changes the number of answers to a question

draw a dotted line when the user connects a node to another node without the plus button (by manually setting the "next" value)


*/
let cloneMode = false;
let eraseMode = false;
let latestNodeForLines;

//these make moving/dragging the canvas possible
$("#mainArea").draggable({drag: function (event, ui) {
    //console.log('dragging');
    updateAllLines(ui.helper); //called only when dragged
}});
$("#mainArea").draggable(
    'enable'
);












