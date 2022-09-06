function exportJson(){

    console.log(` hello from export ${''}`);

    let jsonToExport = {
        "scene": [ //push ids here

        ]
    }

//loop through our structure

//select all blockWraps

let blockWraps = $('.blockWrap');


    //problem: this idObject is empty again when we try to add answers to it. So maybe we need to take out from the loop and empty it manually after other types than question

    let idObject = {
        id:0,
        dialogs:[]
    }

blockWraps.each(function (index, blockWrapElem) {
        //console.log($(this));

    let blockType = $(blockWrapElem).find('.selectBlockType').val();
    let characterName = $(blockWrapElem).find('.characterName').val();
    let blockStoryId = $(blockWrapElem).find('.blockid').val();
    let dialogs = $(blockWrapElem).find(".dialogue").val().split(/\r?\n/);
    let dialogsWhiteSpacesAndEmptyElementsStripped = dialogs.filter(function (str) {
        return /\S/.test(str);
    });


    //set the id
    //idObject.id = blockStoryId;

    console.log(`blocktype was: ${blockType} and blockStoryId was ${blockStoryId}`);

    console.log(`IDOBJECT when each loop index is: ${index} is like this: ${JSON.stringify(idObject)}`);

    //check if the types should be set to line or question or answer

    if (blockType == "line"){

        //empty idObject dialogues when a new block starts as long as its not the answer block:
        idObject = {
            id: blockStoryId,
            dialogs: []
        };

        console.log(`IDOBJECT should have been now totally emptied when each loop index is: ${index} is like this: ${JSON.stringify(idObject)}`);


        dialogsWhiteSpacesAndEmptyElementsStripped.forEach(element => {

            let dialogObject = {

                "char": characterName,
                "type": "line",
                "line": element

            }

            idObject.dialogs.push(dialogObject);
            
            
        });//end  dialogsWhiteSpacesAndEmptyElementsStripped.forEach

        console.log(`IDOBJECT.dialogs have now all the dialogs from the line block: ${JSON.stringify(idObject)}`);
        //we need to add end statements as the last dialogue except for questions
        idObject.dialogs.push({
            "type": "end"
        });
        jsonToExport.scene.push(idObject);
        console.log(`jsonToExport.scene.length:  ${jsonToExport.scene.length}`);
        console.log(`blocktype was: ${blockType}, blockStoryId was ${blockStoryId} and jsonToExport should have gotten a push just now and it looks like this: ${JSON.stringify(jsonToExport)}`);

         

    } else if (blockType == "question"){

        console.log(`blocktype question, line 76 and jsonToExport looks like:  ${JSON.stringify(jsonToExport) }`);

        //empty idObject dialogues when a new block starts as long as its not the answer block:
        idObject = {
            id: blockStoryId,
            dialogs: []
        };

        console.log(`IDOBJECT.dialogs shoudl have been now emptied when each loop index is: ${index} is like this: ${JSON.stringify(idObject)}`);

        dialogsWhiteSpacesAndEmptyElementsStripped.forEach(element => {

            let dialogObject = {

                "char": characterName,
                "type": "line", //changed to question only for the last one
                "question": element

            }

            //idObject is basically one block which can have several dialogue objects due to line breaks (or a question block plus its answers) 
            idObject.dialogs.push(dialogObject);

            console.log(`blocktype question, line 94 and jsonToExport looks like:  ${JSON.stringify(jsonToExport)}`);
            

            //change the LAST type to question (there can be regular lines before the question comes):

            idObject.dialogs[idObject.dialogs.length-1].type = "question";
            idObject.dialogs[idObject.dialogs.length - 1].nbanswers = $(blockWrapElem).find('.answerNumber').val(); //store the number of answers



        }); //END dialogsWhiteSpacesAndEmptyElementsStripped.forEach    


        console.log(`blocktype question, line 107 and jsonToExport looks like:  ${JSON.stringify(jsonToExport)}`);

        //only take the first 6 characters for the comparison to cut out the numbers at the end ie answer1 answer2 ect
    } else if (blockType.substring(0, 6) == "answer"){ 

        console.log(`blocktype answer, line 112 and jsonToExport looks like:  ${JSON.stringify(jsonToExport)}`);
        
        //might need answer1 answer2 etc
        //how do we make sure that the answers belong to the right question node? by taking the id of the question node
        //should the answer nodes even get different id's really? maybe not since in scirra tutorial they are just part of the same id
        //okay lets now give automatic ids when creating nodes
        //okay done so now we should be able to select the question in the idObject based on the "id". The tricky part is that we should also identify that it's a "question" type node
        //to be on the safe side and that one would need to be checkedd from the nested dialogues array from the last element of the array. But maybe its safe enough just to test that with a simple if statement before actually modifying.
        //so lets grab the element:

        //first take the storyId of the answer for later comparison, or we already actually have it: blockStoryId

        //figure out the number of the answer
        let numberOfThisAnswer = $(blockWrapElem).find('.selectBlockType').val();

        console.log(` numberOfThisAnswer: ${numberOfThisAnswer}`);

        idObjectNow = idObject;

        //can we add a dynamic key to the object like this (the dynamic key is numberOfThisAnswer)
        lastObject = idObject.dialogs[idObject.dialogs.length - 1];

        console.log('lastObject: ' + JSON.stringify(lastObject));
        
        console.log(`dialogsWhiteSpacesAndEmptyElementsStripped.join(' ') ${dialogsWhiteSpacesAndEmptyElementsStripped.join(' ') }`);
        
        lastObject[numberOfThisAnswer] = dialogsWhiteSpacesAndEmptyElementsStripped.join(' ');



        /* Model:
        
                    "char": "Jessie",
                    "type": "question",
                    "question": "Are you bored of these projects yet? I sure am.",
                    "nbanswers": 3,
                    "answer0": "Of course not!",
                    "nextscene0": 7,
                    "answer1": "Maybe a little.",
                    "nextscene1": 8,
                    "answer2": "I am so done with this.",
                    "nextscene2": 9*/

        //if we have the last answer, then push the whole question/answer object into the array. But how do we do this? Should we count how many times we have excecuted the blockType = answer code? But what if there are more answer blocks in the tree? Maybe for the sake of ease lets limit the number of max answers to 9 so that we can then do an easy substring to get the actual number?

        console.log(`numberOfThisAnswer.substring(6, 7): ${numberOfThisAnswer.substring(6, 7)} idObject.dialogs[idObject.dialogs.length - 1].nbanswers ${idObject.dialogs[idObject.dialogs.length - 1].nbanswers}`);

        //shouldnt we compare the current answer to the total amount of answers from the parent block? we can get this from the object now too:
        if (numberOfThisAnswer.substring(6, 7) >= idObject.dialogs[idObject.dialogs.length - 1].nbanswers-1){ 
            
            console.log(`about to push q and a. The state of jsonToExport is:  ${JSON.stringify(jsonToExport) }`);

            

            jsonToExport.scene.push(idObject);

        }

 

    } //end if answer

    console.log(`jsonToExport.scene.length:  ${jsonToExport.scene.length}`);

    console.log(`If statements have ended. blocWraps index: ${index}  jsonToExport ${JSON.stringify(jsonToExport)}`);

    jsonReady = jsonToExport;

    

    }); //end blockWraps.each

    function downloadTextFile(text, name) {
        const a = document.createElement('a');
        const type = name.split(".").pop();
        a.href = URL.createObjectURL(new Blob([text], { type: `text/${type === "txt" ? "plain" : type}` }));
        a.download = name;
        a.click();
    }

    downloadTextFile(JSON.stringify(jsonToExport), 'dialogue.json');

} //End exportJson()