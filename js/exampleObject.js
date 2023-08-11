
let gameDialogueMakerProject = {
    "settings": {},
    "characters": [{
        "characterName": "Mike",
        "characterID": 1,
        "characterNodeX": 389,
        "characterNodeY": 29,
        "hideChildren": false,
        "bgColor": "#4b4b4b",
        "nodeElement": "",
        "outgoingLines": [{
            "fromNode": 0,
            "fromSocket": 0,
            "toNode": 1,
            "lineElem": {},
            "transitionConditions": []
        }],
        "dialogueNodes": [{
            "dialogueID": 1,
            "dialogueType": "line",
            "dialogueText": "Example dialogue, hello!",
            "nextNode": -1,
            "dialogueNodeX": -7,
            "dialogueNodeY": 132,
            "outgoingSockets": 1,
            "hideChildren": false,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [{
                "fromNode": 1,
                "fromSocket": 0,
                "toNode": 2,
                "lineElem": "",
                "transitionConditions": [{
                    "variableName": "yourvar",
                    "comparisonOperator": "!=",
                    "variableValue": "true"
                }]
            }],
            "nextNodeLineElem": ""
        }, {
            "dialogueID": 2,
            "dialogueType": "question",
            "dialogueText": "condition cleared. What now?",
            "nextNode": -1,
            "dialogueNodeX": 18,
            "dialogueNodeY": 197,
            "outgoingSockets": 3,
            "hideChildren": false,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [{
                "fromNode": 2,
                "fromSocket": 0,
                "toNode": 3,
                "lineElem": "",
                "transitionConditions": []
            }, {
                "fromNode": 2,
                "fromSocket": 1,
                "toNode": 4,
                "lineElem": "",
                "transitionConditions": []
            }, {
                "fromNode": 2,
                "fromSocket": 2,
                "toNode": 5,
                "lineElem": "",
                "transitionConditions": []
            }],
            "nextNodeLineElem": ""
        }, {
            "dialogueID": 3,
            "dialogueType": "answer",
            "siblings": 3,
            "siblingNumber": 1,
            "dialogueText": "dont know",
            "nextNode": -1,
            "dialogueNodeX": -337,
            "dialogueNodeY": 244,
            "outgoingSockets": 1,
            "hideChildren": false,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [],
            "nextNodeLineElem": ""
        }, {
            "dialogueID": 4,
            "dialogueType": "answer",
            "siblings": 3,
            "siblingNumber": 2,
            "dialogueText": "party time",
            "nextNode": -1,
            "dialogueNodeX": 25,
            "dialogueNodeY": 280,
            "outgoingSockets": 1,
            "hideChildren": false,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [],
            "nextNodeLineElem": ""
        }, {
            "dialogueID": 5,
            "dialogueType": "answer",
            "siblings": 3,
            "siblingNumber": 3,
            "dialogueText": "more tasks",
            "nextNode": -1,
            "dialogueNodeX": 384,
            "dialogueNodeY": 221,
            "outgoingSockets": 1,
            "hideChildren": false,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [{
                "fromNode": 5,
                "fromSocket": "0",
                "toNode": 6,
                "lineElem": "",
                "transitionConditions": []
            }],
            "nextNodeLineElem": ""
        }, {
            "dialogueID": 6,
            "dialogueType": "line",
            "dialogueText": "okay take this task",
            "nextNode": -1,
            "dialogueNodeX": -5,
            "dialogueNodeY": 205,
            "outgoingSockets": 1,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [{
                "fromNode": 6,
                "fromSocket": "0",
                "toNode": 7,
                "lineElem": "",
                "transitionConditions": [{
                    "variableName": "fillme",
                    "comparisonOperator": "=",
                    "variableValue": "true"
                }]
            }],
            "hideChildren": false,
            "nextNodeLineElem": ""
        }, {
            "dialogueID": 7,
            "dialogueType": "line",
            "dialogueText": "fulfilled",
            "nextNode": -1,
            "dialogueNodeX": -1,
            "dialogueNodeY": 221,
            "outgoingSockets": 1,
            "bgColor": "#4b4b4b",
            "nodeElement": "",
            "outgoingLines": [],
            "hideChildren": false,
            "nextNodeLineElem": ""
        }]
    }]
}