/* This function will recursively loop through the entire project object and write it to the page as nodes */
function drawDialogueMakerProject() {
  //store the previously create node after every node creation so right parents can be appended to. Don't change this for answer nodes, because they should all go inside the same parent (the question node)
  let latestNode = "";
  //store every node, including answers in this one for line appending:

  //loop through each character
  for (let i = 0; i < gameDialogueMakerProject.characters.length; i++) {
    //console.log(gameDialogueMakerProject.characters[i].characterName);

    //console.log(`Processing character ${i} with hideChildren: ${gameDialogueMakerProject.characters[i].hideChildren}`);


    let currI = gameDialogueMakerProject.characters[i];
    /* Creating the character roots here  */

    //empty the existing element
    //currI.nodeElement = '';

    //set some values for the stuff inside the characterNodeHTML (defined in htmlContentDefinitions.js)

    if (!currI.nodeElement || currI.nodeElement == "") {
      currI.nodeElement = $('<div class="blockWrap characterRoot"></div>');
    }

    let eyeImageSource;
    //closed or open eye:
    if (currI.hideChildren == false){

      eyeImageSource = 'img/iconmonstr-eye-filled-32.png'

    } else {

      eyeImageSource = 'img/iconmonstr-eye-off-filled-32.png'

    }

    //have to define here to make a new element on each iteration:
    let characterNodeHTML = $(`
            <div class="contentWrap">
                <div style="display: flex; align-items:center; justify-content: center;">
          
                </div>
                    <div class="block">
                        <div class="characterElementIDLine" style="text-align: left;">
                            <span style="width: 35%; display:inline-block; text-align: right;">Character ID:</span><input class="blockid"
                                style="width: 15%; display:inline-block;" readonly type="number">
                                <img class="eyeImage" src="${eyeImageSource}" alt="eye" width="24" height="24">
                        </div>
                        <input type="text" class="characterName elementInfoField" placeholder="character name">
              
                    </div>
                    <div class="plusButtonContainer" style="display: flex; align-items: end; justify-content: center;">
                        <div class="blockPlusButton" data-buttonindex=0 data-acceptclicks=true>+</div>
                    </div>
            </div>

        `);

    characterNodeHTML.strictSelect(".blockid").val(`${currI.characterID}`); //id input field
    characterNodeHTML
      .strictSelect(".characterName")
      .val(`${currI.characterName}`); //name input field
    currI.nodeElement.attr("id", `char${currI.characterID}`); //set id to char1 etc
    currI.nodeElement.html(characterNodeHTML); //this where the "append" happens

    latestNode = currI.nodeElement; //for appending to the correct parent. To be deprecated by connection lines based system?

    //myLog(`latestNode ${JSON.stringify(latestNode) }`,3,fileInfo = getFileInfo())

    //loop through all dialogue nodes of a character
    for (let j = 0;j < gameDialogueMakerProject.characters[i].dialogueNodes.length;j++) {

       //only do this is the eye symbol is open and the children are not hidden

       if (gameDialogueMakerProject.characters[i].hideChildren == true){
        //console.log(`gameDialogueMakerProject.characters[${i}].hideChildren: ${gameDialogueMakerProject.characters[i].hideChildren}`);
        break;
      }

      //console.log(gameDialogueMakerProject.characters[i].dialogueNodes[j].dialogueText);
      //append the dialogue node to the previous dialogue node. But if it's a answer node, maybe it needs to be appended to the closest question node.

      let currJ = gameDialogueMakerProject.characters[i].dialogueNodes[j];

      let dialogueNode = createDialogueNode(
        currJ.nodeElement,
        currJ.dialogueID,
        currJ.dialogueType,
        currJ.dialogueText,
        currJ.nextNode,
        currJ.dialogueNodeX,
        currJ.dialogueNodeY,
        currJ.outgoingSockets,
        currJ.outgoingLines
      ); // nodeElement, dialogueID,dialogueType,

      //Question: How do we know which node we should append to. The answer can't be based on the looping order, because elements can be pushed in many ways. The only thing really telling that seems to be the line. So what if we select the line that has its 'toNode' value same as the node that we are creating and the choose the parent from the lines 'fromNode'. The only pitfall might be that what if the html element for the 'fromNode' hasn't been created yet at this point? Can we create it right then in that case?

      let theConnectingLineFromParentToNewNode =
        findLineThatConnectsElementToParent(currI, currJ.dialogueID); //passing in the node id we are creating

      let theParentHtmlElement;

      if (theConnectingLineFromParentToNewNode) {
        let theParentId = theConnectingLineFromParentToNewNode.fromNode;

        //select the actual html element based on the parent id:
        let theParentNode = getDialogueNodeById(
          gameDialogueMakerProject.characters[i].characterID,
          theParentId
        );

        theParentHtmlElement = theParentNode.nodeElement;
      }

      //calculate rigid dialogue block position:
      //for x we need to know for answer nodes if the node has siblings (nodes connecting to the same parent node).

      let rigidX;
      let rigidY = 138 * (j + 1);

      //myLog(`rigid y ${rigidY}`, 0, fileInfo = getFileInfo());
      if (currJ.dialogueType == "answer") {
        rigidX = (currJ.siblings - 1) * 320 * -1 + currJ.siblingNumber * 320; //NOTE: ONLY answernodes have a siblingNumber
        rigidY = (currJ.siblingNumber + 1) * 277 - currJ.siblingNumber * 277; //so that answer "siblings" are created at same height
      }

      //let me try overwriting those mathmatically calculated values from values inside the actual nodes instead
      rigidX = currJ.dialogueNodeX;
      rigidY = currJ.dialogueNodeY;

      //if parentHtmlElement is null (could be for example because it's tha characterRoot) the use latest element instead

      if (theParentHtmlElement) {
        //do nothing
      } else {
        theParentHtmlElement = latestNode; //fall back to latestNode system
      }

      //for y I think we can check how many non-answer nodes there are

      dialogueNode
        .appendTo(theParentHtmlElement) //latestnode is set below after append
        .draggable({
          drag: function (event, ui) {
            //console.log('dragging');
            updateLines(ui.helper); //called only when dragged
          },
          stop: function (event, ui) {
            var position = ui.position;
            //console.log("Element stopped at: (" + position.left + ", " + position.top + ")");
            // Your code to update some other element or data
            updateElementPositionInObject(ui.helper); //update master object positions
            $(".conditionCircle").show(); //bring the circle visibility back up
          },
        })
        .css({ top: rigidY + "px", left: rigidX + "px", position: "absolute" }); //absolute needs to be called AFTER draggable

      $(dialogueNode).find(".block").css({ backgroundColor: currJ.bgColor });

      //console.log('dialogueNode.bgColor: ' + currJ.bgColor);

      //set the appended node to be the new lastestNode (except for answers)
      if (currJ.dialogueType !== "answer") {
        latestNode = dialogueNode;
        //console.log('latest node set to ' + latestNode.attr("class"));
      }
      //this is set also for answers because the are parents for lines
      latestNodeForLines = dialogueNode;

      //loop through the lines of a dialogue node
      for (
        let k = 0;
        k <
        gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines
          .length;
        k++
      ) {
        //myLog(`line ${k} array length: ${gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length}`, 0, fileInfo = getFileInfo());
        //NOTE! The lines are loop through again below, after the nodes are in dom
      } //end k loop
    } //end j loop

    //ADD THE CHARACTER TO THE DOM

    gameDialogueMakerProject.characters[i].nodeElement
      .prependTo("#mainArea")
      .draggable({
        drag: function (event, ui) {
          //console.log('dragging');
          updateLines(ui.helper); //called only when dragged
        },
        stop: function (event, ui) {
          var position = ui.position;
          //myLog(("Element stopped at: (" + position.left + ", " + position.top + ")"),3);
          // Your code to update some other element or data
          updateElementPositionInObject(ui.helper); //update master object positions
          $(".conditionCircle").show(); //bring the circle visibility back up
        },
      })
      .css({
        left: gameDialogueMakerProject.characters[i].characterNodeX,
        top: gameDialogueMakerProject.characters[i].characterNodeY,
      });

    $(gameDialogueMakerProject.characters[i].nodeElement)
      .children()
      .children(".block")
      .css({ backgroundColor: gameDialogueMakerProject.characters[i].bgColor });

    addAutoResize();

    let plusButtonElem = $(currI.nodeElement).find(".blockPlusButton").eq(0); //important to only select the first found elem with eq

    if (gameDialogueMakerProject.characters[i].outgoingLines.length < 1){

        //no outgoing lines
            //if the character node has zero outgoing lines, make the plus button of it accept clicks:
            $(plusButtonElem).attr('data-acceptclicks', 'true');
            //console.log('character node had no outgoing lines');
    } else {
        //outgoing lines found for character

        $(plusButtonElem).attr('data-acceptclicks', 'false');

          //loop through the object AGAIN to create the lines:

    //FIRST THE CHARACTERS AND THEIR LINES

    for (let c = 0; c < gameDialogueMakerProject.characters[i].outgoingLines.length; c++) {

         //only do this is the eye symbol is open and the children are not hidden

         if (gameDialogueMakerProject.characters[i].hideChildren == true){
          //console.log(`gameDialogueMakerProject.characters[${i}].hideChildren: ${gameDialogueMakerProject.characters[i].hideChildren}`);
          break;
        }

      let currLine = gameDialogueMakerProject.characters[i].outgoingLines[c]; //line we are handling currently

        
        //find current line end node id
        let lineEndNodeId = currLine.toNode;

        //find the end node itself in the object
        let lineEndNode = currI.dialogueNodes.find(
            (obj) => obj.dialogueID == lineEndNodeId
        );

        //console.log('line end node id was:' + lineEndNodeId);

        let lineEndNodeElement = "";

        //reference the stored dom element
        if (lineEndNode) {
            lineEndNodeElement = lineEndNode.nodeElement;
        }

        //get the top socket
        let lineEndElementTopSocket = $(lineEndNodeElement).find(".topConnectionSocket"); //does this find too many children. Probably but we can just use the first one.




        //set the socket to contain a line. eq will make sure we only talk to the first found child (because other nodes can be children too)
        $(lineEndElementTopSocket).eq(0).attr('data-hasline', 'true');

        //draw lines from characterRoot (should be only zero or one):

        var endPointAnchor = LeaderLine.pointAnchor(
            lineEndElementTopSocket.get(0),
            { x: 8, y: 8 }
        );

        if (gameDialogueMakerProject.characters[i].outgoingLines.length > 0) {
            let theLine = new LeaderLine(
            plusButtonElem.get(0), //get(0) converts jQuery object to regular dom object
            endPointAnchor,
            {
                color: "#0075ff",
                size: 4,
                dash: false,
                path: "straight", //deafult is straight, arc, fluid, magnet, grid
                startSocket: "bottom",
                endSocket: "bottom",
                endPlug: "disc",
            }
            );

            currLine.lineElem = theLine; //stores a reference to the actual line into the object
        }

        //set the id also of the svg for easier selection
        const all_svgs = document.querySelectorAll("svg");
        const this_svg = all_svgs[all_svgs.length - 1];
        this_svg.setAttribute(
            "data-character",
            gameDialogueMakerProject.characters[i].characterID
        );
        this_svg.setAttribute("data-fromnode", currLine.fromNode);
        this_svg.setAttribute("data-tonode", currLine.toNode);

        let theSVGInDOM = $(
            'svg[data-fromnode="' +
            currLine.fromNode +
            '"][data-tonode="' +
            currLine.toNode +
            '"][data-character="' +
            gameDialogueMakerProject.characters[i].characterID +
            '"]'
        );

        let thePath = $(theSVGInDOM).find(".leader-line-line-path");
        //Should we also save the SVG element in the object? I think the proble here is that we are trying to find the svg path from the object and not from DOM..

        //const path = document.getElementById('leader-line-5-line-path');
        const midpoint = drawConditionCircle(
            thePath.get(0),
            gameDialogueMakerProject.characters[i].characterID,
            currLine.fromNode,
            currLine.toNode
        );

        // Loop through the transition conditions of the current outgoing line and add a 'withCondition' class to the corresponding circles
        for (let l = 0; l < currLine.transitionConditions.length; l++) {
            let transitionCondition = currLine.transitionConditions[l];
            // Do something with the transition condition, e.g. compare the variable value to the variable name using the comparison operator
            //myLog(` Transition found, it's number is ${l}`, 1, fileInfo = getFileInfo());

            //select the matching circle from DOM
            let theCircleinDOM = $(
            '.conditionCircle[data-fromnode="' +
                currLine.fromNode +
                '"][data-tonode="' +
                currLine.toNode +
                '"][data-character="' +
                gameDialogueMakerProject.characters[i].characterID +
                '"]'
            );

            theCircleinDOM.addClass("withCondition");
            theCircleinDOM.attr(
            "title",
            "Click to change the condition for the transition"
            );

            //how can we connect the transition condition to a line? Well we should have a reference to the line element already in the object
        }
    }

    } //end else for outgoing lines of character

    

  



    //NOW LOOP THROUGH DIALOGUE NODES AND THEIR LINES for the purpose of drawing lines

   

    //loop through all dialogue nodes of a character

    if (gameDialogueMakerProject.characters[i].dialogueNodes) {
      for (let j = 0;j < gameDialogueMakerProject.characters[i].dialogueNodes.length;j++) {

           //only do this is the eye symbol is open and the children are not hidden

       if (gameDialogueMakerProject.characters[i].hideChildren == true){
        //console.log(`gameDialogueMakerProject.characters[${i}].hideChildren: ${gameDialogueMakerProject.characters[i].hideChildren}`);
        break;
      }

        let currentDialogueNode =
          gameDialogueMakerProject.characters[i].dialogueNodes[j];

        //check if the dialogueNode object in the master has a positive next value
        let nextNodeValue = currentDialogueNode.nextNode;

        if (nextNodeValue > 0) {
          //get the from node
          let lineStart = currentDialogueNode.nodeElement;

          //get the next target node
          let lineEndNode = getDialogueNodeById(
            gameDialogueMakerProject.characters[i].characterID,
            nextNodeValue
          );

          let lineEndNodeElem = lineEndNode.nodeElement;

          let lineEndElementTopSocket = lineEndNodeElem.find(
            ".topConnectionSocket"
          );


          // Create a new point anchor
          var endPointAnchor = LeaderLine.pointAnchor(
            lineEndElementTopSocket.get(0),
            { x: 8, y: 8 }
          );

          //draw dotted lines from nodes with a positive next value

          let theLine = new LeaderLine(
            //find the next-input in the node where the line should start
            lineStart.find(".next").get(0), //get(0) converts jQuery object to regular dom object
            endPointAnchor,
            {
              color: "gray",
              size: 4,
              dash: true,
              path: "arc", //deafult is straight, arc, fluid, magnet, grid
              startSocket: "right",
              endSocket: "bottom",
              endPlug: "disc",
            }
          );

          currentDialogueNode.nextNodeLineElem = theLine;
        } //end if nextnodevalue

        //loop through the lines of a dialogue node
        for (
          let k = 0;k < gameDialogueMakerProject.characters[i].dialogueNodes[j].outgoingLines.length;k++) {

          let lineStartNode =
            gameDialogueMakerProject.characters[i].dialogueNodes[j].nodeElement; //node which we are handling currently

          let currLine;

          //check that there are lines
          if (
            gameDialogueMakerProject.characters[i].dialogueNodes[j]
              .outgoingLines.length != 0
          ) {
            currLine =
              gameDialogueMakerProject.characters[i].dialogueNodes[j]
                .outgoingLines[k]; //line we are handling currently

            //select the correct plus button to draw the line from
          let plusButtonToConnectTo = currLine.fromSocket;

          let plusButtonElem = $(lineStartNode).find(
            '.blockPlusButton[data-buttonindex="' + plusButtonToConnectTo + '"]'
          );

          let lineEndNodeId = currLine.toNode;

          //the end node from the object
          let lineEndNode = currI.dialogueNodes.find(
            (obj) => obj.dialogueID == lineEndNodeId
          );

          if (lineEndNode) {
            //check that it's not undefined

            //get the dom element
            let lineEndNodeElement = lineEndNode.nodeElement;

            //get the top socket
            let lineEndElementTopSocket = $(lineEndNodeElement).find(".topConnectionSocket").eq(0);

            //set the socket to contain a line
          $(lineEndElementTopSocket).attr('data-hasline', 'true');

            // pointAnchors allow us to shift the attachment point of the line

            var endElement = lineEndElementTopSocket.get(0);

            // Create a new point anchor
            var endPointAnchor = LeaderLine.pointAnchor(endElement, {
              x: 8,
              y: 8,
            });

            let theLine = new LeaderLine(
              plusButtonElem.get(0), //get(0) converts jQuery object to regular dom object
              endPointAnchor,
              {
                color: "#0075ff",
                size: 4,
                dash: false,
                path: "straight", //deafult is straight, arc, fluid, magnet, grid
                startSocket: "bottom",
                endSocket: "bottom",
                endPlug: "disc",
              }
            );

            myline = theLine; //just a global tester

            currLine.lineElem = theLine;

            //set the id also of the svg for easier selection
            const all_svgs = document.querySelectorAll("svg");
            const this_svg = all_svgs[all_svgs.length - 1];
            this_svg.setAttribute(
              "data-character",
              gameDialogueMakerProject.characters[i].characterID
            );
            this_svg.setAttribute("data-fromnode", currLine.fromNode);
            this_svg.setAttribute("data-tonode", currLine.toNode);

            //every line should get at least an empty condition circle:
            //svgInDom is already define once when giving the circle to the line from the characterRoot
            theSVGInDOM = $(
              'svg[data-fromnode="' +
                currLine.fromNode +
                '"][data-tonode="' +
                currLine.toNode +
                '"][data-character="' +
                gameDialogueMakerProject.characters[i].characterID +
                '"]'
            );

            //check that it's not undefined
            if (theSVGInDOM) {
              let thePath = $(theSVGInDOM).find(".leader-line-line-path");

              //Should we also save the SVG element in the object? I think the proble here is that we are trying to find the svg path from the object and not from DOM..

              //const path = document.getElementById('leader-line-5-line-path');
              const midpoint = drawConditionCircle(
                thePath.get(0),
                gameDialogueMakerProject.characters[i].characterID,
                currLine.fromNode,
                currLine.toNode
              );
            } else {
              //myLog(`line was undefined: ${theLine}`, 3, fileInfo = getFileInfo())
            }
          } //end if lineEndNode

          //myLine.start is the native way of selecting the fromNode but only seems to work for the reference, not for dom
          //myLine.end is the native way of selecting the toNode
          //maybe store the line reference in the master object and then select from there?

          // Loop through the transition conditions of the current outgoing line and add a 'withCondition' class to the corresponding circles
          for (let l = 0; l < currLine.transitionConditions.length; l++) {
            let transitionCondition = currLine.transitionConditions[l];
            // Do something with the transition condition, e.g. compare the variable value to the variable name using the comparison operator
            //myLog(` Transition found, it's number is ${l}`, 1, fileInfo = getFileInfo());

            //select the matching circle from DOM
            let theCircleinDOM = $(
              '.conditionCircle[data-fromnode="' +
                currLine.fromNode +
                '"][data-tonode="' +
                currLine.toNode +
                '"][data-character="' +
                gameDialogueMakerProject.characters[i].characterID +
                '"]'
            );

            theCircleinDOM.addClass("withCondition");
            theCircleinDOM.attr(
              "title",
              "Click to change the condition for the transition"
            );
          }

          

            //how can we connect the transition condition to a line? Well we should have a reference to the line element already in the object
          }
        } //end k loop
      } //end j loop
    } //end if there are dialogueNodes
  } // end i loop

  //test path drawing

  //let loop through the lines once again and look at fromNode and the fromSocket of the line. then select the blockWrap dom element with the id matching fromNode id and loop through it's buttons. If there is a match with the fromSocket and the button's data-buttonindex then the button has a line

  //or we just loop through all plus buttons, get their closest blockWrap, check it's id, then search up that object in the master object, loop throught it's lines, check if the line has same fromSocket as the button's data-buttonindex and if so, set accept clicks to false

  //turn things that can't be clicked gray:
  // If data-acceptclicks is false, add the no-clicks class

  $(".blockPlusButton").each(function () {
    checkIfPlusButtonShouldBeTurnedOff(this);
  });

  //DRAGGING ON TOP OF A TOP CONNECTION SOCKET. IF IT'S EMPTY, CREATE A NEW LINE FROM IT. IF IT HAS A LINE, DELETE THE LINE.

  var line = null; // Placeholder for the line that will be drawn

  $(".topConnectionSocket").mousedown(function (event) {


    var socketElement = $(this);

    if ($(socketElement).attr("data-hasline") === 'true') {
    //hide the socket to help elementFromPoint
    
    //need to temporarily enable svg pointer events for proper detections
    $('svg.leader-line').each(function () {
        this.style.setProperty('pointer-events', 'auto', 'important');
      });


        //first select the line
        var x = event.clientX, 
        y = event.clientY,
        myelement = document.elementFromPoint(x, y);

          //console.log(`myelement was`, myelement);
    
        // climb up the DOM tree to the root svg
        while (myelement && !(myelement instanceof SVGSVGElement)) {
          myelement = myelement.ownerSVGElement;
        }
    
        if (myelement && myelement.classList.contains('leader-line')) {
          //console.log(`mouse over socket AND svg`);

          //use the info on the clicked line to select the correct line from the master object
          lineCharacterId = $(myelement).attr('data-character');

          lineFromNodeId = $(myelement).attr('data-fromnode');

          lineToNodeId = $(myelement).attr('data-tonode');

          //console.log(`lineCharacterId ${lineCharacterId} lineFromNodeId ${lineFromNodeId} lineToNodeId ${lineToNodeId}`);


            $(myelement).remove();
        

            //nah, let's try to get the actual element the original line is attached to 
            //we can start by finding the correct fromNode

            let originalFromNode = getDialogueNodeById(lineCharacterId, lineFromNodeId);

            let originalFromNodeDomElem = originalFromNode.nodeElement;

            //console.log('originalFromNodeDomElem: ', originalFromNodeDomElem);

            const mousePoint = {
                x: event.pageX, 
                y: event.pageY
            };

            let line = new LeaderLine(
                originalFromNodeDomElem.get(0),
                LeaderLine.pointAnchor(mousePoint),
                {
                    color: "#0075ff",
                    size: 4,
                    dash: false,
                    path: "straight",
                    startSocket: "bottom",
                    endSocket: "bottom",
                    endPlug: "disc",
                }
            );
        
            $(document).mousemove(function(event) {
                // Update line end point on mousemove
                line.remove();
                const endPoint = {
                    x: event.pageX, 
                    y: event.pageY
                };
                line = new LeaderLine(
                    originalFromNodeDomElem.get(0),
                    LeaderLine.pointAnchor(endPoint),
                    {
                        color: "#0075ff",
                        size: 4,
                        dash: false,
                        path: "straight",
                        startSocket: "bottom",
                        endSocket: "bottom",
                        endPlug: "disc",
                    }
                );
            });
        
            $(document).mouseup(function() {
                // Stop updating line when mouse button is released
                $(document).off('mousemove');
                $(document).off('mouseup');

                //delete the line from the master object
                let theLineInTheObject = deleteLineFromObject(gameDialogueMakerProject, lineCharacterId, lineFromNodeId, lineToNodeId);

                //console.log('socketElement', socketElement);
                $(socketElement).attr('data-hasline', 'false');

                //delete the line, ...maybe redraw instead
                //line.remove(); //note this is leaderLines remove method not jQuery
                clearCanvasBeforeReDraw();
                drawDialogueMakerProject();

            });
          

        } else {
          // Mouse is not over an svg element with class "leader-line"
        }

          //turn svg pointer events back on
    $('svg.leader-line').each(function () {
        this.style.setProperty('pointer-events', 'none', 'important');
      });

    } else { //only draw the line if the socket was empty

        currentlyDrawingALine = true;

    objectNodeFromWhichWeAreDrawing =
      findDialogueObjectBasedOnPassedInHtmlElement(
        $(this).closest(".blockWrap").find(".blockid") //gets the blockid input since the function needs a child element
      );

   

    nodeIdFromWhichWeAreDrawing = $(this)
      .closest(".blockWrap")
      .find(".block")
      .attr("id")
      .replace(/\D/g, ""); //strip char from id;

    characterNameFromWhichWeAreDrawing = $(this)
      .closest(".characterRoot")
      .find(".characterName")
      .val();

    line = new LeaderLine(
      socketElement[0], // Start of the line
      LeaderLine.pointAnchor({ x: event.pageX, y: event.pageY }), // End of the line
      {
        color: "#0075ff",
        size: 4,
        dash: false,
        path: "straight", //deafult is straight, arc, fluid, magnet, grid
        startSocket: "bottom",
        endSocket: "bottom",
        endPlug: "disc",
      }
    );

    } //end else for if ($(socketElement).attr('data-hasline') == 'true')

    event.stopPropagation();
    
  });

  $(document).mousemove(function (e) {
    if (line) {
      // Update the end position of the line to follow the mouse
      line.setOptions({
        end: LeaderLine.pointAnchor({ x: e.pageX, y: e.pageY }),
      });
    }
  });

  $(document).mouseup(function (e) {
    if (line) {
      // Get the element under the cursor
      var elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);

      // Get the jQuery object for the element under the cursor
      var $elementUnderCursor = $(elementUnderCursor);

      // Check if the element is a plus button and if its data-acceptclicks attribute is true
      if (
        $elementUnderCursor.hasClass("blockPlusButton") &&
        $elementUnderCursor.data("acceptclicks") === true &&
        currentlyDrawingALine === true
      ) {
        // The line is over the target div and the div accepts clicks, do stuff
        //console.log("Line is over the target div and it accepts clicks");

        //now we should update the master object structure accordingly and then redraw
        //start by detecting to which node the plus buttons belongs to
        //let blockToAttachTo = $($elementUnderCursor).closest('.block');

        let plusButtonIndexToAttachTo = $elementUnderCursor.data("buttonindex");

        let childElementForPassingToFindDialogue = $($elementUnderCursor)
          .closest(".blockWrap")
          .find(".blockid");

          //this is the dialogueNode of the plus button block
        let dialogueFromNodeInObject =
          findDialogueObjectBasedOnPassedInHtmlElement(
            childElementForPassingToFindDialogue
          );


        //we need to check if the root character changes and if it does then we need to remove the dialogue object from the old character in the object and add it to the new one
        //what should then happen with the numbering to avoid clashes?
        //should also check if its an answer, because answer should only connect to questions

          //console.log(`dialogueFromNodeInOnbject: `, dialogueFromNodeInObject);

        let newParentCharacterID = findCharacterIDByPassingInDialogueNode(
          dialogueFromNodeInObject
        );

        //console.log(
            "newParentCharacterID: " +
            newParentCharacterID +
            " lineCharacterId: " +
            lineCharacterId
       

        if (newParentCharacterID == lineCharacterId) {
          //no change in parent
          dialogueFromNodeInObject.outgoingLines.push({
            fromNode: dialogueFromNodeInObject.dialogueID,
            fromSocket: plusButtonIndexToAttachTo,
            toNode: nodeIdFromWhichWeAreDrawing,
            lineElem: "",
            transitionConditions: [],
          });
        } else {
          //change in parent

  

let highestIdInNewParent = getMaxDialogueNodeId(gameDialogueMakerProject.characters[newParentCharacterID-1]);
//console.log(`highestIdInNewParent was: ${highestIdInNewParent}`);
reparentNodeAndDescendants(objectNodeFromWhichWeAreDrawing, lineCharacterId, newParentCharacterID, highestIdInNewParent+1, gameDialogueMakerProject);

dialogueFromNodeInObject.outgoingLines.push({
  fromNode: dialogueFromNodeInObject.dialogueID,
  fromSocket: plusButtonIndexToAttachTo,
  toNode: objectNodeFromWhichWeAreDrawing.dialogueID,
  lineElem: "",
  transitionConditions: [],
});

        

        } //end else (change in parent)
      }//end if (line)

      // Stop updating the line
      line = null;

      currentlyDrawingALine = false;

      clearCanvasBeforeReDraw();
      drawDialogueMakerProject();
    }
  });
} // end function drawDialogueMakerProject
