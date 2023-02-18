
let gameDialogueMakerProject = {
    settings: {},
    characters:[{
        characterName: 'Mike',
        characterID: 1,
        characterNodeX: 0,
        characterNodeY: 0,
        dialogueNodes: [
            {
                dialogueID: 1,
                dialogueType: 'line',
                dialogueText: 'Example dialogue, hello!',
                nextNode: 2,
                dialogueNodeX: 0,
                dialogueNodeY: 20,
                outgoingSockets: 1,
                outgoingLines: [
                    {
                        fromNode: 1,
                        fromSocket: 1,
                        toNode: 2,
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
                outgoingLines: [
                    {
                        fromNode: 2,
                        fromSocket: 1,
                        toNode: 3,
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
                        fromSocket: 2,
                        toNode: 4,
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
                dialogueText: 'Fine thank you',
                nextNode: 4,
                dialogueNodeX: -100,
                dialogueNodeY: 20,
                outgoingSockets: 1,
                outgoingLines: [
                    
                ] //end lines
            },
            {
                dialogueID: 4,
                dialogueType: 'answer',
                dialogueText: 'Not so great',
                nextNode: 6,
                dialogueNodeX: 250,
                dialogueNodeY: -160,
                outgoingSockets: 1,
                outgoingLines: [
                  
                ] //end lines
            }

        ]//end dialoguenodes

    }]
}