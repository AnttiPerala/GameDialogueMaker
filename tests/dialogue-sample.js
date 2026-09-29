// Friendly demo data for downloadable projects. Edge-case names stay in tests.
const fixture = require('./dialogue-fixture');
module.exports = function sample() {
    const data = fixture();
    data.characters[0].characterName = 'Mira';
    data.characters[0].bgColor = '#e74c3c';
    data.demoAppleQuest = true;
    data.characters[0].outgoingLines = [0, 1].map(value => ({ toNode: value ? 210 : 200,
        transitionConditions: [{ variableName: 'hasApple', comparisonOperator: '=', variableValue: value }] }));
    data.characters[0].dialogueNodes = [
        { dialogueID: 200, dialogueType: 'line', dialogueText: 'Could you bring me an apple? Look for the little red apple with green leaves and walk into it to pick it up. Then come back and talk to me!', outgoingLines: [], nextNode: -1 },
        { dialogueID: 210, dialogueType: 'line', dialogueText: 'You found the apple! Thank you for bringing it to me. That is just what I wanted!', outgoingLines: [], nextNode: -1 }
    ];
    data.characters[1].characterName = 'Rowan';
    data.characters[1].bgColor = '#2ecc71';
    data.characters[1].outgoingLines = [{ toNode: 100, transitionConditions: [] }];
    data.characters[1].dialogueNodes = [
        { dialogueID: 100, dialogueType: 'line', dialogueText: 'Hello! I am Rowan. Welcome to our village.', outgoingLines: [{ toNode: 110, transitionConditions: [] }], nextNode: -1 },
        { dialogueID: 110, dialogueType: 'line', dialogueText: 'Mira is looking for an apple. I saw one nearby. Walk into it to pick it up, then return to her!', outgoingLines: [], nextNode: -1 }
    ];
    return data;
};
