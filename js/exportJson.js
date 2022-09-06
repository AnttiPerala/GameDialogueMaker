function exportJson(){

    console.log(` hello from export ${''}`);

    let jsonToExport = {
        "scene": [ //push ids here

        ]
    }

//loop through our structure

//select all blockWraps

let blockWraps = $('.blockWrap');

//let currId = 0; //for constructing the block ids with the loop

blockWraps.each(function (index, element) {
        console.log($(this));

    let blockType = $(element).find('.selectBlockType').val();
    let characterName = $(element).find('.characterName').val();
    let blockStoryId = $(element).find('.blockid').val();
    let dialogs = $(element).find(".dialogue").val().split(/\r?\n/);
    let dialogsWhiteSpacesAndEmptyElementsStripped = dialogs.filter(function (str) {
        return /\S/.test(str);
    });

    cheeeee = dialogsWhiteSpacesAndEmptyElementsStripped;

    let idObject = {
        "id": blockStoryId,
        "dialogs": [
            
        ]
    }

    //check if the types should be set to line or question or answer

    if (blockType == "line"){

        dialogsWhiteSpacesAndEmptyElementsStripped.forEach(element => {

            let dialogObject = {

                "char": characterName,
                "type": "line",
                "line": element

            }

            idObject.dialogs.push(dialogObject);
            
        });

         

    } else if (blockType == "question"){

        dialogsWhiteSpacesAndEmptyElementsStripped.forEach(element => {

            let dialogObject = {

                "char": characterName,
                "type": "line", //changed to question only for the last one
                "line": element

            }


            idObject.dialogs.push(dialogObject);

            //change the LAST type to question (there can be regular lines before the question comes):

            idObject.dialogs[idObject.dialogs.length-1].type = "question";
            idObject.dialogs[idObject.dialogs.length - 1].nbanswers = $(element).find('.answerNumber').val(); //store the number of answers



        });




    } else if (blockType == "answer"){ 
        
        //might need answer1 answer2 etc
        //how do we make sure that the answers belong to the right question node? by taking the id of the question node
        //should the answer nodes even get different id's really? maybe not since in scirra tutorial they are just part of the same id
        //okay lets now give automatic ids when creating nodes
        //okay done so now we should be able to select the question in the idObject based on the "id". The tricky part is that we should also identify that it's a "question" type node
        //to be on the safe side and that one would need to be checkedd from the nested dialogues array from the last element of the array. But maybe its safe enough just to test that with a simple if statement before actually modifying.
        //so lets grab the element:

        id



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


    }

    jsonToExport.scene.push(idObject);

    chId = jsonToExport;

    

    });








//this is the structure of an Id:

    let exampleID = {
        "id": 0,
            "dialogs": [
                {
                    "type": "end",
                    "nextscene": 3
                }
            ]
    }


}