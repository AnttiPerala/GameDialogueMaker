const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const template = require('../js/constructTemplate');
const {buildConstructProject} = require('../js/exportConstruct');
const {createConstructDialogueSession} = require('../js/constructRuntime');
const {startConstructNativeDialogue} = require('../js/constructNative');
const fixture = require('./dialogue-fixture');

// Small deterministic Text double. Production uses Construct's own textHeight measurement.
function nativeText(width = 860, sizePt = 16) {
    return {text:'',width,sizePt,fontFace:'Arial',isBold:false,isItalic:false,lineHeight:0,wordWrapMode:'word',
        get textHeight() {
            const columns = Math.max(1, Math.floor(this.width / (this.sizePt * 0.7)));
            let lines = 1, used = 0;
            for (const word of this.text.split(' ')) {
                if (used && used + 1 + word.length > columns) { lines++; used = 0; }
                if (used) used++;
                used += word.length;
                while (used > columns) { lines++; used -= columns; }
            }
            return lines * (this.sizePt * 4 / 3 + this.lineHeight);
        }
    };
}

function setup(source = fixture()) {
    const files = buildConstructProject(source, template, createConstructDialogueSession);
    const data = JSON.parse(files['files/dialogue.json']);
    const bindings = JSON.parse(files['files/construct-bindings.json']).variables;
    const sheet = JSON.parse(files['eventSheets/Dialogue events.json']);
    const globalVars = Object.fromEntries(sheet.events.filter(e=>e.eventType==='variable').map(v=>[v.name,v.type==='number'?Number(v.initialValue):v.initialValue]));
    const answers = {width:0,values:[],
        setSize(width,height,depth) { this.width=width; this.height=height; this.depth=depth; this.values=Array.from({length:width},()=>[0,0]); },
        setAt(value,x,y=0) { assert.ok(x>=0 && x<this.width); this.values[x][y]=value; },
        getAt(x,y=0) { return this.values[x]?.[y] ?? 0; }
    };
    const text = nativeText();
    const runtime = {globalVars,tickCount:0,objects:{Answers:{getFirstInstance:()=>answers},DialogueText:{getFirstInstance:()=>text}}};
    const api = startConstructNativeDialogue(runtime,data,createConstructDialogueSession,bindings);
    const choose = n => {runtime.tickCount++;api.choose(n);};
    return {files,data,bindings,sheet,runtime,g:globalVars,api,choose,answers};
}

test('Construct literal string defaults do not trigger a false load error or alter conditions',()=>{
    const source=fixture();
    const expected='the "office"\nupstairs';
    source.gameIntegration={variables:{location:{type:'string',initialValue:expected}}};
    source.characters[0].outgoingLines[0].transitionConditions=[{variableName:'location',comparisonOperator:'=',variableValue:expected}];
    const {data,sheet,g,api}=setup(source);
    assert.equal(sheet.events.find(e=>e.name==='LoadError').initialValue,'');
    assert.equal(g.LoadError,'','successful loading must not display the error banner');
    assert.equal(g.location,expected);
    api.start(data.characters[0].characterID);
    assert.equal(g.CurrentNode,'10','text conditions compare the exact native global value');
});

test('native bridge exposes speaker, pages and choices and rechecks live Construct globals',()=>{
    const {data,g,api,choose,answers}=setup();
    api.start(data.characters[0].characterID);
    assert.equal(g.DialogueActive,1);
    assert.equal(g.SpeakerName,data.characters[0].characterName);
    // The fixture starts with two text pages, followed by a question.
    for(let n=0;g.CurrentNode!=='20' && n<10;n++) choose(1);
    assert.equal(g.CurrentNode,'20'); assert.equal(answers.width,3);
    assert.equal(g.AnswerSpeaker,'You'); assert.equal(answers.getAt(2,1),0);
    choose(3); assert.equal(g.CurrentNode,'20');
    g.keys=1; api.refresh(); assert.equal(answers.getAt(2,1),1);
    // A changed variable cannot leave a stale clickable answer.
    g.keys=0; choose(3); assert.equal(g.CurrentNode,'20');
    g.keys=1; choose(3); assert.equal(g.CurrentNode,'60');
    choose(1); assert.equal(g.DialogueActive,0);
});

test('native bridge handles pickup state, duplicate names, restart and single action per tick',()=>{
    const {data,g,api,choose,runtime}=setup(require('./dialogue-sample')());
    api.start(data.characters[0].characterID); assert.equal(g.CurrentNode,'200');
    api.close(); g.hasApple=1;
    api.start(data.characters[0].characterID); assert.equal(g.CurrentNode,'210');
    const saved=g.LineText;
    api.start(data.characters[1].characterID); assert.equal(g.LineText,saved,'active conversation is not replaced');
    choose(1); const node=g.CurrentNode; api.choose(1); assert.equal(g.CurrentNode,node);
    api.close(); runtime.tickCount++; api.start(data.characters[1].characterID);
    assert.equal(g.SpeakerName,'Rowan');
});

test('blocked roots offer Close and can be reopened after a native variable change',()=>{
    const source=fixture();
    source.characters[0].outgoingLines[0].transitionConditions=[{variableName:'keys',comparisonOperator:'=',variableValue:1}];
    const {data,g,api,choose,answers}=setup(source);
    api.start(data.characters[0].characterID);
    assert.equal(g.CurrentNode,''); assert.equal(answers.getAt(0,0),'Close');
    choose(1); assert.equal(g.DialogueActive,0); assert.equal(answers.width,0);
    g.keys=1; api.start(data.characters[0].characterID); assert.equal(g.CurrentNode,'10');
});

test('terminal and condition-blocked lines offer an enabled Close on option 1',()=>{
    for (const blocked of [false,true]) {
        const source=fixture(), c=source.characters[0];
        c.outgoingLines=[{toNode:60,transitionConditions:[]}];
        const end=c.dialogueNodes.find(n=>n.dialogueID===60);
        if(blocked) end.outgoingLines=[{toNode:70,transitionConditions:[{variableName:'keys',comparisonOperator:'=',variableValue:1}]}];
        const {api,choose,answers,g}=setup(source);
        api.start(c.characterID);
        assert.equal(answers.width,1); assert.equal(answers.getAt(0,0),'Close'); assert.equal(answers.getAt(0,1),1);
        if(blocked) {
            g.keys=1;api.refresh();assert.equal(answers.getAt(0,0),'Continue');
            g.keys=0;api.refresh();assert.equal(answers.getAt(0,0),'Close');
        }
        choose(1);assert.equal(g.DialogueActive,0);assert.equal(answers.width,0);
    }
});

test('remaining text pages still Continue; all-blocked questions offer Close',()=>{
    const source=fixture(), c=source.characters[0];
    c.dialogueNodes.find(n=>n.dialogueID===20).outgoingLines.forEach(line=>line.transitionConditions=[{variableName:'keys',comparisonOperator:'=',variableValue:1}]);
    const {api,choose,answers,g}=setup(source);
    api.start(c.characterID);
    assert.equal(answers.getAt(0,0),'Continue');choose(1);
    assert.match(g.LineText,/Welcome/);choose(1);
    assert.equal(g.CurrentNode,'20');assert.equal(answers.width,1);assert.equal(answers.getAt(0,0),'Close');
    g.keys=1;api.refresh();assert.equal(answers.width,3);
    g.keys=0;api.refresh();choose(1);assert.equal(g.DialogueActive,0);
});

test('exported startup needs no DOM, input listeners or world objects', async()=>{
    const {files,data,bindings,runtime,g}=setup();
    let startup;
    const context=vm.createContext({runOnStartup:fn=>fn(runtime),console});
    runtime.addEventListener=(event,fn)=>{assert.equal(event,'beforeprojectstart');startup=fn;};
    runtime.assets={fetchJson:async name=>name==='dialogue.json'?data:{version:1,variables:bindings}};
    vm.runInContext(files['scripts/main.js'],context); await startup();
    assert.equal(g.DialogueReady,1);
    assert.doesNotMatch(files['scripts/main.js'],/document\.|window\.|runtime\.objects\.(?!Answers|DialogueText)|keydown|collision|\.style/);
    context.dialogue.start(data.characters[0].characterID);
    assert.equal(g.DialogueActive,1);
    runtime.assets.fetchJson=async()=>{throw Error('bad data');};
    context.console={error:()=>{}}; await startup();
    assert.equal(g.LoadError,'bad data');
});

test('native export contains editable gameplay, UI and integration event functions',()=>{
    const {files,sheet}=setup(require('./dialogue-sample')());
    const all=[];
    const walk=e=>{all.push(e);for(const child of [...(e.children||[]),...(e.conditions||[]),...(e.actions||[])])walk(child);};
    sheet.events.forEach(walk);
    assert.deepEqual(all.filter(e=>e.eventType==='function-block').map(e=>e.functionName),['StartDialogue','ChooseAnswer','CloseDialogue']);
    assert.ok(all.some(e=>e.id==='on-collision-with-another-object'&&e.parameters.object==='Apple'));
    assert.ok(all.some(e=>e.id==='set-eventvar-value'&&e.parameters.variable==='hasApple'&&e.parameters.value==='1'));
    assert.ok(all.some(e=>e.id==='set-text'&&e.objectClass==='DialogueText'));
    assert.equal(all.filter(e=>e.id==='on-any-key-pressed').length,1);
    assert.ok(all.some(e=>e.id==='on-mouse-wheel'));
    assert.ok(all.some(e=>e.id==='on-object-clicked'));
    assert.ok(all.filter(e=>e.type==='script').every(e=>e.script.join('\n').startsWith('globalThis.dialogue?.')));
    const layout=JSON.parse(files['layouts/Dialogue Playground.json']);
    const hud=layout.layers.find(l=>l.name==='Dialogue UI');
    assert.equal(hud.parallaxX,0);
    for (const name of ['DialogueSpeaker','DialogueText','Answer','AnswerNumber','DialogueClose']) {
        assert.equal(JSON.parse(files[`objectTypes/${name}.json`])['plugin-id'],'Text');
        assert.ok(hud.instances.some(i=>i.type===name));
    }
});

test('game variables cannot shadow generated object types, functions or bridge globals',()=>{
    const source=fixture();
    const names=['LineText','DialogueText','Answers','Mouse','StartDialogue'];
    source.gameIntegration={variables:Object.fromEntries(names.map(name=>[name,{type:'number',initialValue:0}]))};
    const {bindings}=setup(source);
    for(const name of names) assert.notEqual(bindings.find(v=>v.dialogueName===name).name.toLowerCase(),name.toLowerCase());
});

test('answer array and reusable UI support more answers without new globals or object types',()=>{
    const source=fixture(), character=source.characters[0];
    const question=character.dialogueNodes.find(n=>n.dialogueID===20);
    question.outgoingLines=Array.from({length:12},(_,i)=>({toNode:100+i,transitionConditions:[]}));
    character.dialogueNodes.push(...Array.from({length:12},(_,i)=>({dialogueID:100+i,dialogueType:'answer',dialogueText:'Option '+(i+1),outgoingLines:[],nextNode:60})));
    const {data,files,sheet,g,api,choose,answers}=setup(source);
    api.start(character.characterID);
    for(let n=0;g.CurrentNode!=='20' && n<10;n++)choose(1);
    assert.equal(answers.width,12);
    assert.equal(answers.getAt(11,0),'Option 12');
    assert.equal(answers.getAt(11,1),1);
    choose(13);assert.equal(g.CurrentNode,'20');
    choose(12);assert.equal(g.CurrentNode,'60');assert.equal(answers.width,1);
    assert.equal(answers.getAt(11,0),0,'shrinking removes stale answers');
    api.close();assert.equal(answers.width,0);
    api.start(character.characterID);assert.equal(answers.width,1);
    const baseline=setup();
    assert.deepEqual(Object.keys(files),Object.keys(baseline.files),'answer count does not add objects');
    assert.deepEqual(sheet.events.filter(e=>e.eventType==='variable').map(e=>e.name),baseline.sheet.events.filter(e=>e.eventType==='variable').map(e=>e.name));
    assert.ok(!sheet.events.some(e=>e.name?.startsWith('GDM_')));
    assert.equal(data.constructChoiceSlots,undefined);
    const array=JSON.parse(files['objectTypes/Answers.json']);
    assert.equal(array['plugin-id'],'Arr');assert.equal(array.isGlobal,true);
    assert.match(JSON.stringify(sheet),/for-each-ordered/);
    assert.match(JSON.stringify(sheet),/Answers.Width/);
});

test('player uses native 8 Direction behavior with editable settings and conversation pause',()=>{
    const {files,sheet}=setup();
    const player=JSON.parse(files['objectTypes/Player.json']);
    assert.equal(player.behaviorTypes[0].behaviorId,'EightDir');
    assert.equal(player.behaviorTypes[0].name,'Movement');
    assert.ok(player.behaviorTypes.some(b=>b.behaviorId==='ScrollTo'&&b.name==='ScrollTo'));
    const layout=JSON.parse(files['layouts/Dialogue Playground.json']);
    const properties=layout.layers[0].instances.find(i=>i.type==='Player').behaviors.Movement.properties;
    assert.equal(layout.layers[0].instances.find(i=>i.type==='Player').behaviors.ScrollTo.properties.enabled,true);
    assert.doesNotMatch(JSON.stringify(sheet),/scroll-to-position/);
    assert.equal(properties.directions,'dir-8');assert.equal(properties['default-controls'],true);
    assert.equal(properties['set-angle'],'no');assert.equal(properties['max-speed'],220);
    const project=JSON.parse(files['project.c3proj']);
    assert.ok(project.usedAddons.some(a=>a.type==='behavior'&&a.id==='EightDir'));
    assert.ok(project.usedAddons.some(a=>a.type==='behavior'&&a.id==='ScrollTo'));
    const world=sheet.events.find(e=>e.title==='Demo movement and interactions');
    const pause=world.children.find(e=>e.conditions.some(c=>c.parameters.variable==='DialogueActive'&&c.parameters.value==='1'));
    assert.deepEqual(pause.actions.map(a=>[a.behaviorType,a.id]),[['Movement','stop'],['Movement','set-enabled']]);
    assert.doesNotMatch(JSON.stringify(world),/GDM_MoveSpeed|simulate-control|key-is-down| \* dt/);
});

test('dialogue input shares one active guard and combines equivalent controls with OR',()=>{
    const {sheet}=setup();
    const input=sheet.events.find(e=>e.title==='Dialogue input');
    assert.equal(input.children.length,1);
    const guard=input.children[0];
    assert.equal(guard.conditions[0].parameters.variable,'DialogueActive');
    assert.equal(guard.conditions[0].parameters.value,'1');
    const descendants=[];
    const walk=e=>{descendants.push(e);(e.children||[]).forEach(walk);};
    guard.children.forEach(walk);
    assert.ok(descendants.every(e=>e.conditions.every(c=>c.parameters.variable!=='DialogueActive')));
    const close=descendants.find(e=>e.actions.some(a=>a.callFunction==='CloseDialogue'));
    assert.equal(close.isOrBlock,true);
    assert.deepEqual(close.conditions.filter(c=>c.id==='on-key-pressed').map(c=>c.parameters.key),[27,37,38,39,40]);
    assert.equal(close.conditions.at(-1).id,'on-object-clicked');
    const ranges=descendants.find(e=>e.isOrBlock&&e.conditions[0].id==='is-between-values');
    assert.deepEqual(ranges.conditions.map(c=>[c.parameters['lower-bound'],c.parameters['upper-bound']]),[['49','57'],['97','105']]);
    for(const scroll of descendants.filter(e=>e.conditions.some(c=>c.id==='on-mouse-wheel'))) {
        assert.equal(scroll.conditions.length,1);
        assert.equal(scroll.conditions[0].id,'on-mouse-wheel');
    }
    assert.ok(descendants.every(e=>e.conditions.every(c=>c.id!=='on-key-pressed'||![33,34].includes(c.parameters.key))));
    const click=descendants.find(e=>e.conditions.some(c=>c.parameters['object-clicked']==='Answer'));
    assert.equal(click.actions[0].parameters[0],'Answer.Index + 1');
    assert.ok(click.conditions.some(c=>c.parameters.value==='Mouse.Y("Dialogue UI")'&&c.parameters['lower-bound']==='DialogueHeader.Y + DialogueHeader.Height / 2'&&c.parameters['upper-bound']==='DialoguePanel.Y + DialoguePanel.Height / 2'));
});

test('native NPC contact stays latched across Close until the player leaves',()=>{
    const {sheet,api,choose,g,data}=setup();
    const world=sheet.events.find(e=>e.title==='Demo movement and interactions');
    const contactEvents=world.children.filter(e=>e.conditions.some(c=>c.id==='is-overlapping-another-object'&&c.parameters.object==='NPC_Mira_Hello'));
    assert.equal(contactEvents.length,2);
    let overlap=false,touching=0,opened=0;
    function run(event) {
        const pass=event.conditions.every(c=>{
            let value;
            if(c.id==='is-overlapping-another-object') value=overlap;
            else if(c.id==='compare-instance-variable') value=touching===Number(c.parameters.value);
            else if(c.id==='compare-eventvar') value=g[c.parameters.variable]===Number(c.parameters.value);
            else throw Error('Unexpected contact condition '+c.id);
            return c.isInverted?!value:value;
        });
        if(!pass)return;
        for(const a of event.actions) {
            if(a.id==='set-instvar-value')touching=Number(a.parameters.value);
            else if(a.callFunction==='StartDialogue'){opened++;api.start(data.characters[0].characterID);}
            else throw Error('Unexpected contact action');
        }
        (event.children||[]).forEach(run);
    }
    const tick=()=>contactEvents.forEach(run);
    tick();overlap=true;tick();assert.equal(opened,1);
    api.close();for(let i=0;i<10;i++)tick();assert.equal(opened,1);assert.equal(g.DialogueActive,0);
    overlap=false;tick();overlap=true;tick();assert.equal(opened,2);
    // Entry while busy is also consumed, rather than deferred until closing.
    overlap=false;tick();overlap=true;tick();api.close();tick();assert.equal(opened,2);
});

test('Construct dialogue occupies a transparent bottom-half panel without clipping masks',()=>{
    const {files,sheet}=setup();
    const hud=JSON.parse(files['layouts/Dialogue Playground.json']).layers.find(l=>l.name==='Dialogue UI');
    assert.equal(hud.isTransparent,true);assert.equal(hud.forceOwnTexture,false);
    const panel=hud.instances.find(i=>i.type==='DialoguePanel').world;
    assert.equal(panel.y-panel.height/2,320);assert.equal(panel.y+panel.height/2,624);
    assert.ok(hud.instances.every(i=>i.world.blendMode!=='destination-out'));
    assert.doesNotMatch(JSON.stringify(files),/DialogueTopClip|DialogueBottomClip/);
    const presentation=sheet.events.find(e=>e.title==='Dialogue presentation');
    const hidden=presentation.children.find(e=>e.conditions.some(c=>c.parameters.variable==='DialogueActive'&&c.parameters.value==='0'));
    assert.equal(hidden.actions[0].parameters.visibility,'invisible');
});


test('long native dialogue pages retain their speaker and expose choices only after the last portion',()=>{
    const source=fixture(), character=source.characters[0];
    character.outgoingLines=[{toNode:20,transitionConditions:[]}];
    const question=character.dialogueNodes.find(n=>n.dialogueID===20);
    const first=Array.from({length:90},(_,i)=>'detail'+i).join(' ');
    question.dialogueText=first+'\nYour turn to ask.';
    question.dialogueSpeakers=['scene','npc'];
    const {g,api,choose,answers,sheet}=setup(source);
    api.start(character.characterID);
    const portions=[];
    const input=sheet.events.find(e=>e.title==='Dialogue input').children[0];
    const click=input.children.find(e=>e.conditions.some(c=>c.parameters['object-clicked']==='Answer'));
    assert.equal(click.actions[0].callFunction,'ChooseAnswer');
    assert.equal(click.actions[0].parameters[0],'Answer.Index + 1');
    for(let count=0;answers.getAt(0,0)==='Continue' && count<50;count++) {
        assert.equal(g.CurrentNode,'20','pagination must not traverse graph edges');
        assert.equal(g.SpeakerName,'Scene');assert.equal(g.AnswerSpeaker,'');
        assert.equal(answers.width,1);
        const measurement=nativeText();measurement.text=g.LineText;
        assert.ok(measurement.textHeight<=g.PageHeight);
        portions.push(g.LineText);
        // Click on Answer index 0 and keyboard 1 both dispatch ChooseAnswer(1).
        choose(1);
    }
    assert.ok(portions.length>1);
    assert.equal(portions.join(' ').replace(/\s+/g,' '),first);
    assert.equal(g.LineText,'Your turn to ask.');
    assert.equal(g.SpeakerName,character.characterName);
    assert.equal(g.AnswerSpeaker,'You');assert.equal(answers.width,3);
    choose(2);assert.equal(g.CurrentNode,'60');
    choose(1);assert.equal(g.DialogueActive,0);
});

test('a long terminal node continues through its text before offering Close',()=>{
    const source=fixture(), character=source.characters[0];
    character.outgoingLines=[{toNode:60,transitionConditions:[]}];
    const text='This is the final explanation. '.repeat(30).trim();
    character.dialogueNodes.find(n=>n.dialogueID===60).dialogueText=text;
    const {g,api,choose,answers}=setup(source);
    api.start(character.characterID);
    const portions=[];
    for(let count=0;count<50;count++) {
        portions.push(g.LineText);
        if(answers.getAt(0,0)==='Close')break;
        assert.equal(answers.getAt(0,0),'Continue');
        choose(1);assert.equal(g.DialogueActive,1);
    }
    assert.equal(portions.join(' ').replace(/\s+/g,' '),text);
    assert.equal(answers.getAt(0,0),'Close');choose(1);
    assert.equal(g.DialogueActive,0);
});


test('waiting conditions survive closing, isolate characters and resume at the unlocked line',()=>{
    for(const wait of [undefined,true,false]) {
        const source=fixture(), c=source.characters[0];
        const node=c.dialogueNodes.find(n=>n.dialogueID===60);
        node.outgoingLines=[{toNode:70,transitionConditions:[{variableName:'appleGiven',comparisonOperator:'=',variableValue:'true',...(wait===undefined?{}:{waitUntilMet:wait})}]}];
        const {api,choose,g,answers}=setup(source);
        api.start(c.characterID);choose(1);choose(1);choose(2);
        assert.equal(g.CurrentNode,'60');assert.equal(answers.getAt(0,0),'Close');
        choose(1);assert.equal(g.DialogueActive,0);
        api.start(source.characters[1].characterID);assert.equal(g.CurrentNode,'');api.close();
        api.start(c.characterID);assert.equal(g.CurrentNode,wait===false?'10':'60');api.close();
        g.appleGiven='true';assert.equal(g.DialogueActive,0,'variable changes never reopen the UI');
        api.start(c.characterID);assert.equal(g.CurrentNode,wait===false?'10':'70');
        api.close();api.start(c.characterID);assert.equal(g.CurrentNode,'10','leaving the checkpoint clears it');
    }
});


test('plain JSON download replaces only dialogue data in the original Construct export',async()=>{
    const original=fixture();
    original.characters[0].outgoingLines[0].transitionConditions=[{variableName:'door open',comparisonOperator:'=',variableValue:1}];
    const {files,runtime,g,bindings}=setup(original);
    const door=bindings.find(b=>b.dialogueName==='door open').name;
    g[door]=1;g.keys=7;
    const edited=JSON.parse(JSON.stringify(original));
    edited.characters[0].characterName='Princess';
    edited.characters[0].dialogueNodes[0].dialogueText='The updated greeting.';
    edited.characters[1].outgoingLines=undefined;
    edited.characters[1].dialogueNodes=undefined;
    edited.gameIntegration={variables:{keys:{type:'number',initialValue:999}}};
    let downloaded;
    const exportContext=vm.createContext({Blob,gameDialogueMakerProject:edited,
        cleanDialogueProject:require('../js/exportCommon').cleanDialogueProject,
        downloadDialogueBlob:(blob,name)=>{assert.equal(name,'dialogue.json');downloaded=blob;}});
    vm.runInContext(require('node:fs').readFileSync(require.resolve('../js/exportJson'),'utf8'),exportContext);
    exportContext.exportJson();
    const plainJson=await downloaded.text();
    const fresh=buildConstructProject(edited,template,createConstructDialogueSession);
    assert.equal(fresh['files/dialogue.json'],plainJson,'C3P and plain download are byte-identical');
    assert.equal(JSON.parse(plainJson).constructVariables,undefined);
    const saved={...files};files['files/dialogue.json']=plainJson;
    let startup;
    runtime.addEventListener=(event,fn)=>{startup=fn;};
    runtime.assets={fetchJson:async name=>JSON.parse(files['files/'+name])};
    const context=vm.createContext({runOnStartup:fn=>fn(runtime),console});
    vm.runInContext(files['scripts/main.js'],context);await startup();
    assert.equal(g.LoadError,'');assert.equal(g.DialogueReady,1);
    context.dialogue.start(original.characters[0].characterID);
    assert.equal(g.SpeakerName,'Princess');assert.equal(g.LineText,'The updated greeting.');
    assert.equal(g[door],1);assert.equal(g.keys,7,'JSON defaults never overwrite live globals');
    for(const name of Object.keys(saved))if(name!=='files/dialogue.json')assert.equal(files[name],saved[name]);
});

test('updated dialogue accepts new exact-name globals and reports missing or incompatible globals',()=>{
    const {runtime,bindings}=setup();
    const source=fixture();
    const gate={variableName:'newQuestFlag',comparisonOperator:'=',variableValue:1};
    source.characters[0].outgoingLines[0].transitionConditions=[gate];
    assert.throws(()=>startConstructNativeDialogue(runtime,source,createConstructDialogueSession,bindings),/newQuestFlag.*Construct global/);
    runtime.globalVars.newQuestFlag='1';
    assert.throws(()=>startConstructNativeDialogue(runtime,source,createConstructDialogueSession,bindings),/must be number/);
    runtime.globalVars.newQuestFlag=1;
    const api=startConstructNativeDialogue(runtime,source,createConstructDialogueSession,bindings);
    api.start(source.characters[0].characterID);assert.equal(runtime.globalVars.CurrentNode,'10');api.close();
    gate.variableName='DialogueActive';
    assert.throws(()=>startConstructNativeDialogue(runtime,source,createConstructDialogueSession,bindings),/explicit binding/);
    // Removed variables may leave their bindings behind without requiring a global.
    delete runtime.globalVars.keys;
    const noConditions=fixture();
    for(const character of noConditions.characters) for(const node of [character,...character.dialogueNodes])
        for(const edge of node.outgoingLines)edge.transitionConditions=[];
    assert.doesNotThrow(()=>startConstructNativeDialogue(runtime,noConditions,createConstructDialogueSession,bindings));
});

test('native layout expressions adapt the panel and text to different logical viewports',()=>{
    const {files,sheet}=setup();
    const hud=JSON.parse(files['layouts/Dialogue Playground.json']).layers.find(l=>l.name==='Dialogue UI');
    const group=sheet.events.find(e=>e.title==='Dialogue layout');
    for (const [w,h,font,left,top] of [[960,640,16,0,0],[320,180,6,0,0],[640,360,10,-70,120],[1280,720,20,0,0]]) {
        const values={PageHeight:100,ScrollOffset:900,ScrollLimit:100,AnswerSpeaker:'You',
            max:Math.max,round:Math.round,floor:Math.floor,ceil:Math.ceil,clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),
            ViewportWidth:()=>w,ViewportHeight:()=>h,ViewportLeft:()=>left,ViewportRight:()=>left+w,ViewportTop:()=>top,ViewportBottom:()=>top+h};
        for(const i of hud.instances) {
            const text=nativeText(i.world.width,font);text.text=i.properties.text||'';
            const object={X:i.world.x,Y:i.world.y,Width:i.world.width,Height:i.world.height,...i.instanceVariables};
            Object.defineProperty(object,'TextHeight',{get(){text.width=object.Width;return text.textHeight;}});
            values[i.type]=object;
        }
        const evaluate=expression=>vm.runInNewContext(expression.replace(/AnswerSpeaker = ""/g,'AnswerSpeaker === ""'),values);
        for(const action of group.children[0].actions) {
            const p=action.parameters, object=values[action.objectClass];
            if(action.id==='set-eventvar-value')values[p.variable]=evaluate(p.value);
            else if(action.id==='set-position'){object.X=evaluate(p.x);object.Y=evaluate(p.y);}
            else if(action.id==='set-x')object.X=evaluate(p.x);
            else if(action.id==='set-width')object.Width=evaluate(p.width);
            else if(action.id==='set-height')object.Height=evaluate(p.height);
            else assert.fail('Unexpected layout action '+action.id);
        }
        const panel=values.DialoguePanel, header=values.DialogueHeader, body=values.DialogueText;
        const panelTop=panel.Y-panel.Height/2, panelBottom=panel.Y+panel.Height/2;
        assert.ok(panelTop>=top+h*.45 && panelBottom<=top+h,`${w}x${h}: bottom panel`);
        assert.ok(body.X>=panel.X-panel.Width/2 && body.X+body.Width<=panel.X+panel.Width/2);
        assert.ok(values.PageHeight>=font*4/3 && values.PageHeight<panel.Height-header.Height);
        assert.equal(values.ScrollOffset,100);
        assert.ok(group.children[0].actions.every(a=>a.id!=='set-font-size'));
    }
});

test('native pagination reflows after width and font changes without advancing the dialogue',()=>{
    const source=fixture(), c=source.characters[0];
    c.outgoingLines=[{toNode:60,transitionConditions:[]}];
    const original=Array.from({length:120},(_,i)=>`detail${i}`).join(' ');
    c.dialogueNodes.find(n=>n.dialogueID===60).dialogueText=original;
    const {runtime,g,api,choose,answers}=setup(source);
    const text=runtime.objects.DialogueText.getFirstInstance();
    api.start(c.characterID);choose(1);
    const anchor=g.LineText.split(' ')[0];
    text.width=280;text.sizePt=8;g.PageHeight=30;
    api.refresh();
    assert.equal(g.CurrentNode,'60');
    assert.ok(g.LineText.includes(anchor),'resizing retains the portion being read');
    const resizedFirst=g.LineText;
    text.sizePt=10;api.refresh();
    assert.ok(g.LineText.length<=resizedFirst.length,'larger fonts fit less text');
    // Restart to verify every word remains available at the new dimensions.
    api.close();api.start(c.characterID);
    const portions=[];
    for(let count=0;count<200;count++) {
        portions.push(g.LineText);
        text.text=g.LineText;assert.ok(text.textHeight<=g.PageHeight);
        if(answers.getAt(0,0)==='Close')break;
        choose(1);
    }
    assert.equal(portions.join(' '),original);
    assert.equal(answers.getAt(0,0),'Close');choose(1);assert.equal(g.DialogueActive,0);
});
