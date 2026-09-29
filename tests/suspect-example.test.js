const {test} = require('node:test');
const assert = require('node:assert/strict');
const project = require('../examples/two-suspects-investigation.json');
const {validateDialogueProject} = require('../js/exportCommon');
const {createConstructDialogueSession} = require('../js/constructRuntime');

test('interview project has two complete, reachable graphs and three reachable endings each', () => {
    validateDialogueProject(project);
    assert.equal(project.characters.length,2);
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
        assert.equal(endings.length,3);
        // Every node can reach an ending: loops have an exit rather than trapping the player.
        const canFinish=new Set(endings.map(n=>n.dialogueID));
        let changed=true;
        while(changed){changed=false;for(const node of c.dialogueNodes)if(!canFinish.has(node.dialogueID)&&node.outgoingLines.some(e=>canFinish.has(e.toNode))){canFinish.add(node.dialogueID);changed=true}}
        assert.equal(canFinish.size,nodes.size);
    }
});

test('careful questioning reaches corroborated theft and independently established innocence', () => {
    for(const [index,expected] of [[0,'ACCOUNT CORROBORATED'],[1,'CLEARED BY THE EVIDENCE']]) {
        const state=createConstructDialogueSession(project.characters[index],{});state.start();
        let last='',steps=0;
        while(state.current && steps++<100) {last=state.current.dialogueText;state.options()[0].choose()}
        assert.ok(steps<100);assert.match(last,new RegExp(expected));
    }
});

test('disclosing the secret detail still allows an evidence-led recovery route', () => {
    const c=project.characters[0],state=createConstructDialogueSession(c,{});state.start();
    let disclosed=false,last='',steps=0;
    while(state.current&&steps++<100){
        last=state.current.dialogueText;
        const options=state.options();
        const choice=options.find(o=>o.text.includes('Ask whether he remembers the orange'));
        if(choice&&!disclosed){disclosed=true;choice.choose()}else options[0].choose();
    }
    assert.ok(disclosed);assert.ok(steps<100);assert.match(last,/ACCOUNT CORROBORATED/);
});
