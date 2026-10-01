const {test} = require('node:test');
const assert = require('node:assert/strict');
const project = require('../examples/two-suspects-investigation.json');
const {validateDialogueProject} = require('../js/exportCommon');
const {createConstructDialogueSession} = require('../js/constructRuntime');

test('the officer speaks only through choices with at least three alternatives', () => {
    for (const character of project.characters) {
        const selectable = new Set();
        for (const node of character.dialogueNodes) {
            if (node.dialogueType === 'question') {
                assert.ok(node.outgoingLines.length >= 3);
                node.outgoingLines.forEach(edge=>selectable.add(edge.toNode));
            }
            if (node.dialogueType !== 'answer') assert.ok(!node.dialogueSpeakers.includes('player'), `scripted speech at ${character.characterID}:${node.dialogueID}`);
        }
        for (const node of character.dialogueNodes) if (node.dialogueType === 'answer') {
            assert.ok(selectable.has(node.dialogueID));
            assert.ok(node.dialogueSpeakers.every(role=>role==='player'));
        }
    }
});

test('NPC replies include the next reaction choices without a Continue-only node', () => {
    for (const character of project.characters) {
        const nodes = new Map(character.dialogueNodes.map(n=>[n.dialogueID,n]));
        for (const node of character.dialogueNodes) {
            if (node.dialogueType !== 'line' || node.outgoingLines.length !== 1) continue;
            const edge = node.outgoingLines[0];
            if (!edge.transitionConditions.length)
                assert.notEqual(nodes.get(edge.toNode).dialogueType, 'question', 'combine reply and question into one screen');
        }
    }
    const character = project.characters.find(c=>c.characterID===1);
    const state = createConstructDialogueSession(character,{cabinetRecordChecked:0});
    state.start(); state.options()[1].choose();
    assert.equal(state.current.dialogueType,'question');
    assert.equal(state.options().length,3);
    assert.equal(state.current.dialogueText.split('\n').length,1,'consecutive NPC comments share one page');
    assert.match(state.current.dialogueText,/20:35/);
});

test('colleague and both suspects have complete reachable graphs and exits from all loops', () => {
    validateDialogueProject(project);
    assert.equal(project.characters.length,3);
    assert.equal(project.characters[0].characterID,3);
    assert.equal(project.characters.reduce((count,c)=>count+c.dialogueNodes.length,0),183);
    for(const c of project.characters) {
        const nodes=new Map(c.dialogueNodes.map(n=>[n.dialogueID,n]));
        const seen=new Set(), queue=c.outgoingLines.map(e=>e.toNode);
        while(queue.length) {
            const id=queue.pop();if(seen.has(id))continue;seen.add(id);
            const node=nodes.get(id);assert.ok(node);
            queue.push(...node.outgoingLines.map(e=>e.toNode));
            if(node.nextNode>0)queue.push(node.nextNode);
            if(node.dialogueType==='question') {
                assert.equal(node.outgoingLines.length,3);
                node.outgoingLines.forEach(e=>assert.equal(nodes.get(e.toNode).dialogueType,'answer'));
            }
            node.outgoingLines.forEach(e=>assert.equal(e.fromNode,node.dialogueID));
        }
        assert.equal(seen.size,nodes.size,'no orphan scenes');
        const endings=c.dialogueNodes.filter(n=>!n.outgoingLines.length&&n.nextNode<0);
        assert.equal(endings.length, {1:3,2:2,3:1}[c.characterID]);
        // Every node can reach an ending: loops have an exit rather than trapping the player.
        const canFinish=new Set(endings.map(n=>n.dialogueID));
        let changed=true;
        while(changed){changed=false;for(const node of c.dialogueNodes)if(!canFinish.has(node.dialogueID)&&node.outgoingLines.some(e=>canFinish.has(e.toNode))){canFinish.add(node.dialogueID);changed=true}}
        assert.equal(canFinish.size,nodes.size);
    }
});

test('careful questioning reaches corroborated theft and independently established innocence', () => {
    for(const [id,expected] of [[1,'ACCOUNT CORROBORATED'],[2,'CLEARED BY THE EVIDENCE']]) {
        const state=createConstructDialogueSession(project.characters.find(c=>c.characterID===id),{cabinetRecordChecked:1});state.start();
        let last='',steps=0;
        while(state.current && steps++<100) {last=state.current.dialogueText;state.options()[0].choose()}
        assert.ok(steps<100);assert.match(last,new RegExp(expected));
    }
});

test('disclosing the secret detail still allows an evidence-led recovery route', () => {
    const c=project.characters.find(c=>c.characterID===1),state=createConstructDialogueSession(c,{cabinetRecordChecked:1});state.start();
    let disclosed=false,last='',steps=0;
    while(state.current&&steps++<100){
        last=state.current.dialogueText;
        const options=state.options();
        const choice=options.find(o=>o.text.includes('Ask whether he remembers the orange'));
        if(choice&&!disclosed){disclosed=true;choice.choose()}else options[0].choose();
    }
    assert.ok(disclosed);assert.ok(steps<100);assert.match(last,/ACCOUNT CORROBORATED/);
});

test('suspect contact immediately offers three police questions without a briefing page', () => {
    for(const id of [1,2]) {
        const c=project.characters.find(c=>c.characterID===id);
        const state=createConstructDialogueSession(c,{cabinetRecordChecked:0});
        const start=state.start();
        assert.equal(start.dialogueType,'question');
        assert.match(start.dialogueText,/^You begin the interview/);
        assert.equal(state.options().length,3);
        assert.ok(state.options().every(o=>o.enabled && !o.text.startsWith('Officer Ellis:')));
        assert.ok(!c.dialogueNodes.some(n=>n.dialogueText.includes('[CASE BRIEF]')));
    }
});

test('late evidence gate blocks every admission route until the external numeric variable changes', () => {
    const c=project.characters.find(c=>c.characterID===1),vars={cabinetRecordChecked:0};
    const state=createConstructDialogueSession(c,vars);state.start();
    let steps=0;
    while(state.options()[0].enabled && steps++<80)state.options()[0].choose();
    assert.ok(steps>=10 && steps<80,'gate follows at least ten substantive questions, without padding from Continue nodes');
    assert.equal(state.current.dialogueID,project.gameIntegration.evidenceCheckpoint.dialogueID);
    const gate=state.current.dialogueID;
    assert.equal(state.options()[0].enabled,false);
    state.options()[0].choose();assert.equal(state.current.dialogueID,gate);
    vars.cabinetRecordChecked='1';assert.equal(state.options()[0].enabled,false,'numeric variable required');
    vars.cabinetRecordChecked=1;assert.equal(state.options()[0].enabled,true);
    state.options()[0].choose();assert.notEqual(state.current.dialogueID,gate);
    // Check the entire graph, including the alternate contaminated-evidence route.
    const nodes=new Map(c.dialogueNodes.map(n=>[n.dialogueID,n])),seen=new Set(),queue=c.outgoingLines.map(e=>e.toNode);
    while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);
        for(const e of nodes.get(id).outgoingLines)if(!(e.transitionConditions||[]).length)queue.push(e.toNode)}
    const ending=c.dialogueNodes.find(n=>n.dialogueText.startsWith('ACCOUNT CORROBORATED'));
    assert.ok(!seen.has(ending.dialogueID),'no ungated route to successful conclusion');
    for(const character of project.characters)for(const node of character.dialogueNodes)assert.equal(node.setVariables,undefined);
});
