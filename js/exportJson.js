function exportJson(){

    console.log(` hello from export ${''}`);

    let jsonToExport = {
        "scene": [ //push ids here

        ]
    }

//loop through our structure

//select all blockWraps

let blockWraps = $('.blockWrap');

let currId = 0; //for constructing the block ids with the loop

blockWraps.each(function (index, element) {
        console.log($(this));

    let blockType = $(element).find('.selectBlockType').val();
    let currId = index;
    let dialogs = $(element).find(".dialogue").val().split(/\r?\n/);
    let dialogsWhiteSpacesAndEmptyElementsStripped = dialogs.filter(function (str) {
        return /\S/.test(str);
    });

    cheeeee = dialogsWhiteSpacesAndEmptyElementsStripped;

    let idObject = {
        "id": currId,
        "dialogs": [
            {
                "type": "end",
                "nextscene": 3
            }
        ]
    }

    //check if the types should be set to line or question or answer

    if (blockType == "line"){

        let 

    } else if (blockType == "question"){


    } else if (blockType == "answer"){ //might need answer1 answer2 etc


    }


    

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