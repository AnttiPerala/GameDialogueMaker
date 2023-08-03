let cloneMode = false;
let eraseMode = false;
let currentlyDrawingALine = false;
let currentlyDrawnLineInfo; //line:, lineCharacterId:, lineFromNodeId:, lineToNodeId: 
let nodeIdFromWhichWeAreDrawing = 0;
let objectNodeFromWhichWeAreDrawing='';
let characterNameFromWhichWeAreDrawing = '';
let latestNodeForLines;
let zoomValue;
let selectedColor;
let lineCharacterId;
let lineFromNodeId;
let lineToNodeId;

let disconnectedLineCharacterID;
let disconnectedLineFromNodeID;
let disconnectedLineToNodeID;

let playModeActive = false;


//the master object is called gameDialogueMakerProject