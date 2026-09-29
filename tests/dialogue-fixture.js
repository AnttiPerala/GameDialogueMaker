const line = (toNode, transitionConditions = []) => ({ toNode, transitionConditions });
const node = (dialogueID, dialogueType, dialogueText, outgoingLines = [], nextNode = -1) => ({ dialogueID, dialogueType, dialogueText, outgoingLines, nextNode });
function fixture() {
    return { characters: [{ characterID: 9, characterName: 'Mira / 森 "Hello"', bgColor: '#a974df', outgoingLines: [line(10)], dialogueNodes: [
        node(10, 'line', 'Hello, traveler!\nWelcome to the playground.', [line(20)]),
        node(20, 'question', 'Which path?', [line(30), line(40), line(80)]),
        node(30, 'answer', 'Take the long road', [line(50)]),
        node(40, 'answer', 'Take the shortcut', [], 60),
        node(50, 'fight', 'A test battle!', [line(60), line(70)]),
        node(60, 'line', 'You made it!'),
        node(70, 'line', 'Try again.', [], 10),
        node(80, 'answer', 'Open the locked gate', [line(60, [{variableName: 'keys', comparisonOperator: '>=', variableValue: 1}])])
    ] }, { characterID: 22, characterName: 'Mira / 森 "Hello"', outgoingLines: [], dialogueNodes: [] }] };
}

module.exports = fixture;
