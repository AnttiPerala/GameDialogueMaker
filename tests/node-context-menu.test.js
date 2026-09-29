const {test} = require('node:test');
const assert = require('node:assert/strict');
const {duplicateDialogueNode} = require('../js/nodeContextMenu');
const fs = require('node:fs');
const vm = require('node:vm');

test('duplicate node receives a unique ID, independent data and no live connections', () => {
    const dom = {}; dom.circular = dom;
    const source = {dialogueID:10,dialogueType:'question',dialogueText:'Hello',bgColor:'#ff0000',
        dialogueNodeX:100,dialogueNodeY:200,nextNode:30,outgoingLines:[{toNode:30,lineElem:dom}],nodeElement:dom};
    const project = {characters:[{characterID:8,dialogueNodes:[source,{dialogueID:30}]}]};
    const result = duplicateDialogueNode(project, '8', '10', 400);
    assert.deepEqual(result,{characterId:8,dialogueId:31});
    const copy = project.characters[0].dialogueNodes[2];
    assert.equal(copy.dialogueText,'Hello'); assert.equal(copy.bgColor,'#ff0000');
    assert.equal(copy.dialogueType,'question'); assert.equal(copy.dialogueNodeX,500);
    assert.equal(copy.nextNode,-1); assert.deepEqual(copy.outgoingLines,[]);
    assert.equal(copy.nodeElement,undefined);
    assert.equal(source.nodeElement,dom); assert.equal(source.outgoingLines[0].toNode,30);
});

test('character duplication copies its whole graph without sharing mutable conditions', () => {
    const character = {characterID:8,characterName:'Mira',outgoingLines:[{toNode:10,transitionConditions:[{variableName:'apple',variableValue:1}]}],
        dialogueNodes:[{dialogueID:10,dialogueNodeX:100,dialogueNodeY:200,outgoingLines:[],nextNode:10}]};
    const project={characters:[character,{characterID:20}]};
    assert.deepEqual(duplicateDialogueNode(project,8,null),{characterId:21,dialogueId:null});
    const copy=project.characters[2];
    assert.equal(copy.characterName,'Mira copy'); assert.equal(copy.dialogueNodes[0].nextNode,10);
    copy.outgoingLines[0].transitionConditions[0].variableValue=2;
    assert.equal(character.outgoingLines[0].transitionConditions[0].variableValue,1);
});

test('deletion removes all incoming edges and Next jumps, preserves other IDs and saves', () => {
    const project = {characters:[{characterID:8,outgoingLines:[{toNode:10},{toNode:10},{toNode:30}],dialogueNodes:[
        {dialogueID:10,outgoingLines:[]}, {dialogueID:30,outgoingLines:[{toNode:10}],nextNode:10},
        {dialogueID:50,outgoingLines:[{toNode:30}],nextNode:30}
    ]}, {characterID:20,dialogueNodes:[]}]};
    let saves = 0;
    const context = vm.createContext({gameDialogueMakerProject:project,window:{},
        $:value => typeof value === 'string' ? {on(){}} : value,
        getCharacterById:id=>project.characters.find(c=>c.characterID==id),storeMasterObjectToLocalStorage:()=>saves++});
    vm.runInContext(fs.readFileSync(require.resolve('../js/deleteWithEraser'),'utf8'),context);
    const wrap = root => ({length:1,hasClass:()=>root,
        attr:name=>({'id':root?'char8':'dialogue10','data-character-id':'8','data-dialogue-id':'10'})[name]});
    context.deleteBlockWrap(wrap(false));
    const c = project.characters[0];
    assert.deepEqual(c.dialogueNodes.map(n=>n.dialogueID),[30,50]);
    assert.equal(c.outgoingLines.length,1); assert.equal(c.outgoingLines[0].toNode,30);
    assert.equal(c.dialogueNodes[0].outgoingLines.length,0); assert.equal(c.dialogueNodes[0].nextNode,-1);
    assert.equal(c.dialogueNodes[1].nextNode,30); assert.equal(c.dialogueNodes[1].outgoingLines[0].toNode,30);
    assert.equal(saves,1);
    context.deleteBlockWrap(wrap(true));
    assert.equal(project.characters[0].characterID,20); assert.equal(saves,2);
});
