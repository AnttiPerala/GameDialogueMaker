
let gameDialogueMakerProject = {
    settings: {},
    characters:[{
        characterName: 'Mike',
        characterID: 1,
        characterNodeX: 271,
        characterNodeY: 85,
        hideChildren: false,
        bgColor: '#4b4b4b',
        nodeElement: $('<div class="blockWrap characterRoot"></div>'),
        outgoingLines: [
            {
                fromNode: 0,
                fromSocket: 0,
                toNode: 1,
                lineElem: '',
                transitionConditions: [
                    {
                        variableName: 'characterTransitionExample',
                        comparisonOperator: '=',
                        variableValue: 'truuu'
                    }
                ]
            }
        ],
        dialogueNodes: [
            {
                dialogueID: 1,
                dialogueType: 'line',
                dialogueText: 'Example dialogue, hello!',
                nextNode: -1,
                dialogueNodeX: 5,
                dialogueNodeY: 128,
                outgoingSockets: 1,
                hideChildren: false,
                bgColor: '#4b4b4b',
                nodeElement: $('<div></div>'),
                outgoingLines: [
                    {
                        fromNode: 1,
                        fromSocket: 0,
                        toNode: 2,
                        lineElem: '',
                        transitionConditions: [
                            {
                                variableName: 'yourvar',
                                comparisonOperator: '!=',
                                variableValue: 'true'
                            }
                        ]
                    }
                ]
            },
            {
                dialogueID: 2,
                dialogueType: 'question',
                dialogueText: 'How are you today?',
                nextNode: -1,
                dialogueNodeX: 0,
                dialogueNodeY: 178,
                outgoingSockets: 3,
                hideChildren: false,
                bgColor: '#4b4b4b',
                nodeElement: $('<div></div>'),
                outgoingLines: [
                    {
                        fromNode: 2,
                        fromSocket: 0,
                        toNode: 3,
                        lineElem: '',
                        transitionConditions: [
                           
                        ]
                    },
                    {
                        fromNode: 2,
                        fromSocket: 1,
                        toNode: 4,
                        lineElem: '',
                        transitionConditions: [
                            {
                                variableName: 'yesvar',
                                comparisonOperator: '=',
                                variableValue: 'no'
                            }
                        ]
                    },
                    {
                        fromNode: 2,
                        fromSocket: 2,
                        toNode: 5,
                        lineElem: '',
                        transitionConditions: [
                            {
                                variableName: 'myvar',
                                comparisonOperator: '=',
                                variableValue: 'false'
                            }
                        ]
                    }
                   
                ] //end lines
            },
            {
                dialogueID: 3,
                dialogueType: 'answer',
                siblings: 3,
                siblingNumber: 1,
                dialogueText: 'Fine thank you',
                nextNode: -1,
                dialogueNodeX: -280,
                dialogueNodeY: 215,
                outgoingSockets: 1,
                hideChildren: false,
                bgColor: '#4b4b4b',
                nodeElement: $('<div></div>'),
                outgoingLines: [
                    
                ] //end lines
            },
            {
                dialogueID: 4,
                dialogueType: 'answer',
                siblings: 3,
                siblingNumber: 2,
                dialogueText: 'Not so great',
                nextNode: -1,
                dialogueNodeX: 27,
                dialogueNodeY: 211,
                outgoingSockets: 1,
                hideChildren: false,
                bgColor: '#4b4b4b',
                nodeElement: $('<div></div>'),
                outgoingLines: [
                  
                ] //end lines
            },
            {
                dialogueID: 5,
                dialogueType: 'answer',
                siblings: 3,
                siblingNumber: 3,
                dialogueText: 'third',
                nextNode: -1,
                dialogueNodeX: 350,
                dialogueNodeY: 208,
                outgoingSockets: 1,
                hideChildren: false,
                bgColor: '#4b4b4b',
                nodeElement: $('<div></div>'),
                outgoingLines: [

                ] //end lines
            }

        ]//end dialoguenodes

    }
]//end characters
}