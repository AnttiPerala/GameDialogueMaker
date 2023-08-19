function loadFile() {

    $('<input type="file" accept=".json, .txt">')
        .on('change', function () {
            const file = this.files[0];

            if (!file) return;

            const fileType = file.name.split('.').pop();

            const reader = new FileReader();

            reader.onload = function (e) {
                if (fileType === 'json') {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        gameDialogueMakerProject = jsonData;
                        addEmptyDivsToTheObject();
                        clearCanvasBeforeReDraw();
                        drawDialogueMakerProject();
                    } catch (err) {
                        console.error('Error parsing JSON:', err);
                    }
                } else if (fileType === 'txt') {
                    try {
                        const textData = e.target.result;
                        const convertedData = convertTextToJSON(textData);
                        gameDialogueMakerProject = {
                            settings: {},
                            characters: [convertedData]
                        };
                        addEmptyDivsToTheObject();
                        clearCanvasBeforeReDraw();
                        autoLayoutNodes(gameDialogueMakerProject);
                        drawDialogueMakerProject();
                    } catch (err) {
                        console.error('Error converting text to JSON:', err);
                    }
                }
            };

            reader.readAsText(file);
        })
        .click();
}


//TEXT TO JSON CONVERTER

function convertTextToJSON(text) {
    let lines = text.split('\n').filter(line => line.trim() !== '');
    let dialogueIDCounter = 1;
    let dialogueNodes = [];

    function createNode(line, id, type, childrenCount) {
        let parts = line.split(': ');
        let name = parts[0].trim();
        let content = parts[1].trim();

        return {
            dialogueID: id,
            dialogueType: type,
            dialogueText: content,
            dialogueNodeX: 0,
            dialogueNodeY: id * 50,
            outgoingSockets: type === 'question' ? childrenCount : 1, // Adjusted based on actual children count
            hideChildren: false,
            bgColor: "#4b4b4b",
            nodeElement: "",
            outgoingLines: [],
            nextNodeLineElem: "",
            nextNode: -1
        };
    }

    function countChildren(index, childDepth) {
        let count = 0;
        for (let i = index + 1; i < lines.length; i++) {
            let nextLinePrefix = lines[i].split(' ')[0];
            let nextLineDepth = nextLinePrefix.split('.').length;

            if (nextLineDepth === childDepth) {
                count++;
            } else if (nextLineDepth < childDepth) {
                break;
            }
        }
        return count;
    }

    function parseLine(index, parentType) {
        let currentLine = lines[index];
        if (!currentLine) return;

        let type;
        if (parentType === 'line' || !parentType || parentType === 'answer') {
            type = 'question';
        } else if (parentType === 'question') {
            type = 'answer';
        }

        let id = dialogueIDCounter++;

        let childPrefix = currentLine.split(' ')[0];
        let childDepth = childPrefix.split('.').length;

        let childrenCount = countChildren(index, childDepth + 1);
        let node = createNode(currentLine, id, type, childrenCount);

        dialogueNodes.push(node);

        let siblingCount = 0;

        for (let i = index + 1; i < lines.length; i++) {
            let nextLinePrefix = lines[i].split(' ')[0];
            let nextLineDepth = nextLinePrefix.split('.').length;

            if (nextLineDepth === childDepth + 1) {
                let childNode = parseLine(i, type);

                // Assign sibling properties for answers
                if (type === 'question' && childNode.dialogueType === 'answer') {
                    childNode.siblings = siblingCount++;
                    childNode.siblingNumber = siblingCount;
                }

                node.outgoingLines.push({
                    fromNode: id,
                    fromSocket: node.outgoingLines.length,
                    toNode: childNode.dialogueID,
                    lineElem: {},
                    transitionConditions: []
                });
            } else if (nextLineDepth <= childDepth) {
                break;
            }
        }

        return node;
    }

    parseLine(0);

    return {
        characterName: "Liora",
        characterID: 1,
        characterNodeX: 389,
        characterNodeY: 29,
        hideChildren: false,
        bgColor: "#4b4b4b",
        nodeElement: "",
        outgoingLines: [
            {
                fromNode: 0,
                fromSocket: 0,
                toNode: 1,
                lineElem: {},
                transitionConditions: []
            }
        ],
        dialogueNodes: dialogueNodes
    };
}



