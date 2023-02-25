
let gameDialogueMakerProject = {
    settings: {},
    characters:[{
        characterName: 'Mike',
        characterID: 1,
        characterNodeX: 0,
        characterNodeY: 0,
        nodeElement: $('<div class="blockWrap characterRoot"></div>'),
        dialogueNodes: [
            {
                dialogueID: 1,
                dialogueType: 'line',
                dialogueText: 'Example dialogue, hello!',
                nextNode: 2,
                dialogueNodeX: 0,
                dialogueNodeY: 20,
                outgoingSockets: 1,
                nodeElement: $('<div></div>'),
                outgoingLines: [
                    {
                        fromNode: 1,
                        fromSocket: 0,
                        toNode: 2,
                        lineElem: '',
                        transitionConditions: [
                            {
                                variableName: 'myvar',
                                comparisonOperator: '=',
                                variableValue: 'false'
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
                dialogueNodeY: 20,
                outgoingSockets: 3,
                nodeElement: $('<div></div>'),
                outgoingLines: [
                    {
                        fromNode: 2,
                        fromSocket: 0,
                        toNode: 3,
                        lineElem: '',
                        transitionConditions: [
                            {
                                variableName: 'myvar',
                                comparisonOperator: '=',
                                variableValue: 'false'
                            }
                        ]
                    },
                    {
                        fromNode: 2,
                        fromSocket: 1,
                        toNode: 4,
                        lineElem: '',
                        transitionConditions: [
                            {
                                variableName: 'myvar',
                                comparisonOperator: '=',
                                variableValue: 'false'
                            }
                        ]
                    },
                    {
                        fromNode: 2,
                        fromSocket: 1,
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
                nextNode: 4,
                dialogueNodeX: -100,
                dialogueNodeY: 20,
                outgoingSockets: 1,
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
                nextNode: 6,
                dialogueNodeX: 250,
                dialogueNodeY: -160,
                outgoingSockets: 1,
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
                nextNode: 6,
                dialogueNodeX: 550,
                dialogueNodeY: -360,
                outgoingSockets: 1,
                nodeElement: $('<div></div>'),
                outgoingLines: [

                ] //end lines
            }

        ]//end dialoguenodes

    }]
}