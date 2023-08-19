function autoLayoutNodes(gameDialogueMakerProject) {
    const nodeWidth = 300;
    const xGap = 10;
    const yGap = 250;

    function layoutChildren(parentNode, nodes) {
        if (!parentNode.outgoingLines || parentNode.outgoingLines.length === 0) return;

        const children = parentNode.outgoingLines.map(line => nodes.find(node => node.dialogueID === line.toNode));

        // Sort children based on siblingNumber or dialogueID
        children.sort((a, b) => {
            if (a.siblingNumber !== undefined && b.siblingNumber !== undefined) {
                return a.siblingNumber - b.siblingNumber;
            }
            return a.dialogueID - b.dialogueID;
        });

        const totalWidth = (children.length - 1) * (nodeWidth + xGap);
        let startX = parentNode.dialogueNodeX - totalWidth / 2;

        for (let i = 0; i < children.length; i++) {
            children[i].dialogueNodeX = startX + i * (nodeWidth + xGap);
            children[i].dialogueNodeY = yGap;
        }

        children.forEach(child => layoutChildren(child, nodes));
    }


    let lastCharacterEndX = 0;

    gameDialogueMakerProject.characters.forEach(character => {
        const root = character.dialogueNodes[0];
        const characterWidth = calculateTotalWidth(character);

        // Position the character node
        character.characterNodeX = lastCharacterEndX;
        character.characterNodeY = 0;

        // Reset the root dialogue node's X-coordinate for every character
        root.dialogueNodeX = 0;
        root.dialogueNodeY = character.characterNodeY + yGap;

        layoutChildren(root, character.dialogueNodes);

        // Update the end X position for the next character
        lastCharacterEndX = character.characterNodeX + characterWidth + xGap;
    });
}


function calculateTotalWidth(character) {
    const nodeWidth = 300;
    const xGap = 10;
    const maxOutgoingLines = Math.max(...character.dialogueNodes.map(node => (node.outgoingLines ? node.outgoingLines.length : 0)));
    return maxOutgoingLines * nodeWidth + (maxOutgoingLines - 1) * xGap;
}

