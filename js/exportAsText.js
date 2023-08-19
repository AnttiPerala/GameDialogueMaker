function exportDialogueToText(dialogueData) {
    console.log('expoting as text');
    let outputText = "Dialogue Export\n\n";

    const getNodeByID = (id) => {
        return dialogueData.characters[0].dialogueNodes.find(node => node.dialogueID === id);
    };

    const processNode = (node, number = '1') => {
        let currentText = "";

        switch (node.dialogueType) {
            case 'line':
                currentText = `${number}. ${dialogueData.characters[0].characterName}: ${node.dialogueText}\n`;
                if (node.outgoingLines.length > 0 && node.outgoingLines[0].transitionConditions.length > 0) {
                    const condition = node.outgoingLines[0].transitionConditions[0];
                    currentText += `   CONDITION: If ${condition.variableName} ${condition.comparisonOperator} ${condition.variableValue}\n`;
                }
                outputText += currentText;
                break;
            case 'question':
                currentText = `${number}. ${dialogueData.characters[0].characterName}: ${node.dialogueText}\n`;
                outputText += currentText;
                node.outgoingLines.forEach((line, idx) => {
                    const answerNode = getNodeByID(line.toNode);
                    if (answerNode) {
                        processNode(answerNode, `${number}.${idx + 1}`);
                    }
                });
                break;
            case 'answer':
                currentText = `${number}. Answer: ${node.dialogueText}\n`;
                outputText += currentText;
                break;
        }

        if (node.dialogueType !== 'question' && node.outgoingLines.length > 0) {
            const nextNode = getNodeByID(node.outgoingLines[0].toNode);
            if (nextNode) {
                processNode(nextNode, `${number}.1`);
            }
        }
    };

    processNode(dialogueData.characters[0].dialogueNodes[0]);

    function downloadTextFile(text, name) {
        const a = document.createElement('a');
        const type = name.split(".").pop();
        a.href = URL.createObjectURL(new Blob([text], { type: `text/${type === "txt" ? "plain" : type}` }));
        a.download = name;
        a.click();
    }

    downloadTextFile(outputText, 'dialogue.txt');
}


