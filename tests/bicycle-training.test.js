const {test} = require('node:test');
const assert = require('node:assert/strict');
const {buildBicycleTraining} = require('../tools/build-bicycle-training');
const {createConstructDialogueSession:startSession} = require('../js/constructRuntime');
const project=buildBicycleTraining();
const character=id=>project.characters.find(c=>c.characterID===id);
function start(id,value=0){const variables={bikeIdentityVerified:value};const state=startSession(character(id),variables);state.start();return {state,variables};}
function firstUntil(state,key){let count=0;while(state.current.trainingKey!==key && count++<60){assert.ok(state.options()[0].enabled);state.options()[0].choose();}assert.equal(state.current.trainingKey,key);}

test('Finnish case has reachable graphs, three choices, and no automatic player speech',()=>{
    let count=0;
    for(const c of project.characters){
        const nodes=new Map(c.dialogueNodes.map(n=>[n.dialogueID,n]));
        const visited=new Set(),queue=c.outgoingLines.map(e=>e.toNode);
        while(queue.length){const id=queue.pop();if(visited.has(id))continue;visited.add(id);const n=nodes.get(id);assert.ok(n);queue.push(...n.outgoingLines.map(e=>e.toNode));}
        assert.equal(visited.size,nodes.size);
        const finish=new Set(c.dialogueNodes.filter(n=>n.trainingOutcome).map(n=>n.dialogueID));
        let changed=true;while(changed){changed=false;for(const n of c.dialogueNodes)if(!finish.has(n.dialogueID)&&n.outgoingLines.some(e=>finish.has(e.toNode))){finish.add(n.dialogueID);changed=true;}}
        assert.equal(finish.size,nodes.size,'every node has an exit');
        for(const n of c.dialogueNodes){
            count++;assert.equal(n.dialogueText.split('\n').length,1,'no automatic intermediate pages');
            assert.equal(n.setVariables,undefined);
            if(n.dialogueType==='answer')assert.deepEqual(n.dialogueSpeakers,['player']);
            else assert.ok(!n.dialogueSpeakers.includes('player'));
            if(n.dialogueType==='question'){assert.equal(n.outgoingLines.length,3);n.outgoingLines.forEach(e=>assert.equal(nodes.get(e.toNode).dialogueType,'answer'));}
            n.outgoingLines.forEach(e=>assert.equal(e.fromNode,n.dialogueID));
        }
    }
    assert.ok(count>100);
});
test('verified identification gates the breakthrough and uses a native Construct number',()=>{
    const {state,variables}=start(1);firstUntil(state,'summary');
    assert.equal(state.options()[0].enabled,false);assert.equal(state.options()[1].enabled,false);
    variables.bikeIdentityVerified='1';assert.equal(state.options()[0].enabled,false);
    variables.bikeIdentityVerified=1;assert.equal(state.options()[0].enabled,true);
    firstUntil(state,'pass');assert.equal(state.current.trainingOutcome,'pass_corroborated');
    // No route around the evidence gate, including alternative answers.
    const c=character(1),nodes=new Map(c.dialogueNodes.map(n=>[n.dialogueID,n])),seen=new Set(),queue=c.outgoingLines.map(e=>e.toNode);
    while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);for(const e of nodes.get(id).outgoingLines)if(!e.transitionConditions.length)queue.push(e.toNode);}
    assert.ok(!seen.has(c.dialogueNodes.find(n=>n.trainingKey==='pass').dialogueID));
    const r=require('../js/constructRuntime');
    const files=require('../js/exportConstruct').buildConstructProject(project,require('../js/constructTemplate'),r.createConstructDialogueSession,r.startConstructDialogueGame);
    const globals=JSON.parse(files['eventSheets/Dialogue events.json']).events.filter(e=>e.eventType==='variable' && e.comment.startsWith('Dialogue condition:'));
    assert.deepEqual(globals.map(v=>[v.name,v.type,v.initialValue]),[['bikeIdentityVerified','number','0']]);
});
test('rights violation fails, respecting silence passes professionally without solving the case',()=>{
    const a=start(1,1).state;firstUntil(a,'reconsider');a.options()[2].choose();assert.equal(a.current.trainingOutcome,'fail_rights');
    const b=start(1,1).state;firstUntil(b,'evidence');b.options()[2].choose();b.options()[0].choose();assert.equal(b.current.trainingOutcome,'pass_rights_case_open');
    const c=start(2).state;firstUntil(c,'clear');assert.equal(c.current.trainingOutcome,'pass_innocent');
});
test('successful route includes preparation, open account, clarification and independent corroboration',()=>{
    const state=start(1,1).state,seen=[];
    for(let i=0;state.current&&!state.current.trainingOutcome&&i<60;i++){seen.push(state.current.trainingKey);state.options()[0].choose();}
    for(const key of ['rights','account','seller','purchase','description','timeline','summary','evidence','after_advice','account_act','location','verification','closing'])assert.ok(seen.includes(key),key);
    assert.equal(state.current.trainingOutcome,'pass_corroborated');
});
test('the new project can be serialized by all six engine exporters',()=>{
    const r=require('../js/constructRuntime');
    assert.ok(require('../js/exportGodot').buildGodotProject(project,require('../js/godotTemplate'))['dialogue.json']);
    assert.ok(require('../js/exportUnity').buildUnityProject(project,require('../js/unityTemplate'))['Assets/GameDialogueMaker/Resources/dialogue.json']);
    assert.ok(require('../js/exportUnreal').buildUnrealProject(project,require('../js/unrealTemplate'))['Content/Dialogue/dialogue.json']);
    assert.ok(require('../js/exportGameMaker').buildGameMakerProject(project,require('../js/gameMakerTemplate'))['datafiles/dialogue.json']);
    assert.ok(require('../js/exportGDevelop').buildGDevelopProject(project,require('../js/gdevelopTemplate'),r.createConstructDialogueSession,require('../js/gdevelopRuntime').startGDevelopDialogueGame)['game.json']);
});
