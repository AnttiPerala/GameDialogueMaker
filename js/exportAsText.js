function exportDialogueToText(dialogueData) {
    let outputText = "";

    const getNodeByID = (id) => {
        return dialogueData.characters[0].dialogueNodes.find(node => node.dialogueID === id);
    };

    const processNode = (node) => {
        switch (node.dialogueType) {
            case 'line':
                outputText += `${dialogueData.characters[0].characterName}: ${node.dialogueText}\n`;
                if (node.outgoingLines.length > 0 && node.outgoingLines[0].transitionConditions.length > 0) {
                    const condition = node.outgoingLines[0].transitionConditions[0];
                    outputText += `CONDITION: If ${condition.variableName} ${condition.comparisonOperator} ${condition.variableValue}\n`;
                }
                break;
            case 'question':
                outputText += `${dialogueData.characters[0].characterName}: ${node.dialogueText}\n`;
                node.outgoingLines.forEach(line => {
                    const answerNode = getNodeByID(line.toNode);
                    if (answerNode) {
                        processNode(answerNode);
                    }
                });
                break;
            case 'answer':
                outputText += `-> Answer: ${node.dialogueText}\n`;
                break;
        }

        if (node.outgoingLines.length > 0) {
            const nextNode = getNodeByID(node.outgoingLines[0].toNode);
            if (nextNode) {
                processNode(nextNode);
            }
        }
    };

    processNode(dialogueData.characters[0].dialogueNodes[0]);
    return outputText;
}


