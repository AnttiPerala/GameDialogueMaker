const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validateDialogueProject} = require('../js/exportCommon');
const fixture = require('./dialogue-fixture');

test('speaker metadata survives native engine serialization without changing dialogue text', () => {
    const source = fixture();
    source.characters[0].characterName = 'A renamed character';
    source.characters[0].dialogueNodes[0].dialogueSpeakers = ['player', 'npc'];
    const unity = require('../js/exportUnity').buildUnityProject(source, require('../js/unityTemplate'));
    const gm = require('../js/exportGameMaker').buildGameMakerProject(source, require('../js/gameMakerTemplate'));
    for (const node of [JSON.parse(unity['Assets/GameDialogueMaker/Resources/dialogue.json']).characters[0].dialogueNodes[0],
        JSON.parse(gm['datafiles/dialogue.json']).characters[0].dialogueNodes[0]]) {
        assert.deepEqual(node.dialogueSpeakers, ['player', 'npc']);
        assert.equal(node.dialogueText, source.characters[0].dialogueNodes[0].dialogueText);
    }
    const {buildUnrealProject, unrealString} = require('../js/exportUnreal');
    const unreal = buildUnrealProject(source, require('../js/unrealTemplate'));
    assert.deepEqual(JSON.parse(unreal['Content/Dialogue/dialogue.json']).characters[0].dialogueNodes[0].dialogueSpeakers,['player','npc']);
    validateDialogueProject(source);
    source.characters[0].dialogueNodes[0].dialogueSpeakers[0] = 'Hard-coded person';
    assert.throws(()=>validateDialogueProject(source), /speaker roles/);
});

test('investigation speaker roles are separate from prose and keep all graph nodes', () => {
    const source = require('../examples/two-suspects-investigation.json');
    validateDialogueProject(source);
    let count = 0;
    for (const character of source.characters) for (const node of character.dialogueNodes) {
        count++;
        assert.doesNotMatch(node.dialogueText, /\b(?:Officer Ellis|Ellis|Daniel|Leah|Morgan):/);
        assert.equal(node.dialogueSpeakers.length, node.dialogueText.split('\n').length);
        if (node.dialogueType === 'answer') assert.ok(node.dialogueSpeakers.every(s=>s==='player'));
    }
    assert.equal(count,183);
});
