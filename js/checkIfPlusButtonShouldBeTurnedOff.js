function checkIfPlusButtonShouldBeTurnedOff(theButton){


  //start by checking if the button is a child of a characterRoot or dialogueNode

  let closestBlockWrap = $(theButton).closest('.blockWrap');

  if ($(closestBlockWrap).hasClass('characterRoot')){

    let characterNodeInfo = getInfoByPassingInDialogueNodeOrElement(closestBlockWrap);

    if (characterNodeInfo.characterNode.outgoingLines.length < 1){

      //no outgoing lines
      closestBlockWrap.find('.blockPlusButton').attr("data-acceptclicks", true);

    }

  } else {
    let theDialogueIdToGet = $(theButton)
    .closest(".blockWrap")
    .attr("id")
    .replace(/\D/g, ""); //strip char from id
  let theCharacterIdToGet = $(theButton)
    .closest(".characterRoot")
    .attr("id")
    .replace(/\D/g, ""); //strip char from id
  let plusButtonIndex = $(theButton).attr("data-buttonindex");

  let dialogueNodeInMaster = getDialogueNodeById(
    theCharacterIdToGet,
    theDialogueIdToGet
  );

  //loop through all the lines of this dialogueNode

  //loop through all the lines of this dialogueNode
if (dialogueNodeInMaster) {
  //console.log('dialogueNodeInMaster exists:', dialogueNodeInMaster);
  if (dialogueNodeInMaster.outgoingLines.length > 0) {
    //console.log('outgoingLines length:', dialogueNodeInMaster.outgoingLines.length);
    dialogueNodeInMaster.outgoingLines.forEach((outgoingLine) => {
      // Do something with the outgoingLine
      //console.log('outgoingLine:', outgoingLine);
      if (outgoingLine.fromSocket == plusButtonIndex) {
        //console.log('outgoingLine.fromSocket == plusButtonIndex', outgoingLine.fromSocket, plusButtonIndex);
        //we have an outgoing line
        $(theButton).attr("data-acceptclicks", false);
        //console.log('data-acceptclicks attribute:', $(this).attr("data-acceptclicks"));
      }
    });
  } else {
    //console.log('No outgoing lines.');
  } //end if dialogueNodeInMaster.outgoingLines
} else {
  //console.log('dialogueNodeInMaster does not exist.');
} //end if dialogueNodeInMaster
  }





  if ($(theButton).attr("data-acceptclicks") == "false") {
    $(theButton).addClass("no-clicks");
  }

  // If data-acceptclicks is true, remove the no-clicks class
  if ($(theButton).attr("data-acceptclicks") == "true") {
    $(theButton).removeClass("no-clicks");
  }


}