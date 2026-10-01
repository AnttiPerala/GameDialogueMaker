const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fixture = require('./dialogue-fixture');
const {createConstructDialogueSession, startConstructDialogueGame} = require('../js/constructRuntime');
const {startGDevelopDialogueGame} = require('../js/gdevelopRuntime');

// Exercise the shipped DOM runners with simulated engine/DOM APIs.
class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.hidden = false; }
    append(...children) { this.children.push(...children); }
    prepend(child) { this.children.unshift(child); }
    replaceChildren() { this.children = []; }
    setAttribute() {}
    addEventListener() {}
    querySelectorAll(tag) { return descendants(this).filter(e=>e.tagName===tag.toUpperCase()); }
    closest() { return this.tagName === 'INPUT' ? this : null; }
    click() { if (!this.disabled) this.onclick?.(); }
}
function descendants(element) { return [element, ...element.children.flatMap(descendants)]; }
for (const engine of ['Construct', 'GDevelop']) test(`${engine}: number keys follow displayed choices, pages and conditions`, () => {
    const document = {body:new Element('body'), head:new Element('head'), createElement:tag=>new Element(tag), createTextNode:text=>Object.assign(new Element('text'), {textContent:text})};
    const events = {};
    const context = vm.createContext({document, window:{addEventListener:(name, f)=>events[name]=f}, HTMLInputElement:Element});
    const project = fixture();
    project.characters[0].dialogueNodes[0].dialogueSpeakers = ['player', 'npc'];
    const player = {x:140,y:140,addChild(){},getX(){return this.x;},getY(){return this.y;},setPosition(x,y){this.x=x;this.y=y;},setColor(){}};
    const npc = {...player, x:140, y:280};
    let tick;
    context.project = project;
    vm.runInContext(`var createSession = ${createConstructDialogueSession};`, context);
    if (engine === 'Construct') {
        context.runtime = {globalVars:{keys:0},objects:{Player:{getFirstInstance:()=>player},PlayerLabel:{getFirstInstance:()=>({})},NPC_1:{getFirstInstance:()=>npc},NPC_2:{getFirstInstance:()=>({...npc,x:500})}},dt:0,
            layout:{width:960,height:640,scrollTo(){},addEventListener(){}},addEventListener:(name,f)=>tick=f};
        vm.runInContext(`(${startConstructDialogueGame})(runtime, project, createSession)`, context);
    } else {
        context.scene = {getObjects:name=>[name==='Player'?player:name==='NPC_1'?npc:{...npc,x:500}],getGame:()=>({getInputManager:()=>({isKeyPressed:()=>false})}),getTimeManager:()=>({getElapsedTime:()=>0}),getLayer:()=>({setCameraX(){},setCameraY(){}})};
        context.gdjs = {RuntimeObject:{collisionTest:(a,b)=>a.x===b.x&&a.y===b.y},registerRuntimeSceneUnloadedCallback(){},registerRuntimeScenePausedCallback(){},registerRuntimeSceneResumedCallback(){}};
        tick = vm.runInContext(`(${startGDevelopDialogueGame})(scene, project, createSession, gdjs)`, context).tick;
    }
    player.y = npc.y; tick();
    const panel = descendants(document.body).find(e=>e.className===(engine==='Construct'?'gdm-dialogue':'dialogue'));
    const buttons = ()=>panel.children.filter(e=>e.tagName==='BUTTON');
    const text = ()=>panel.children.find(e=>e.tagName==='P').textContent;
    const speaker = ()=>panel.children.find(e=>e.tagName==='H2').textContent;
    const key = (code,extra={})=>events.keydown({code,target:document.body,preventDefault(){},...extra});
    assert.equal(buttons()[0].children[0].textContent,'1');
    assert.equal(speaker(), 'You', 'player identity is separate from text');
    assert.equal(buttons().at(-1).children.length,0,'close is not numbered');
    key('Digit2'); assert.equal(text(),'Hello, traveler!');
    key('Digit1',{repeat:true}); assert.equal(text(),'Hello, traveler!');
    key('Digit1',{target:new Element('input')}); assert.equal(text(),'Hello, traveler!');
    project.characters[0].characterName = 'Renamed NPC';
    key('Digit1'); assert.equal(text(),'Welcome to the playground.');
    assert.equal(speaker(), 'Renamed NPC', 'NPC speaker comes from the root, not the text');
    key('Numpad1'); assert.equal(text(),'Which path?');
    assert.equal(panel.children.find(e=>e.tagName==='H3').textContent, 'You', 'answer options have their own player label');
    assert.deepEqual(buttons().slice(0,3).map(b=>b.children[0].textContent),['1','2','3']);
    key('Digit3'); assert.equal(text(),'Which path?','disabled choice cannot be activated');
    if (engine === 'Construct') {
        context.runtime.globalVars.keys = 1; tick();
        assert.equal(buttons()[2].disabled,false,'native event-sheet changes unlock open choices');
        context.gdmDialogueVariables.keys = 0;
        assert.equal(context.runtime.globalVars.keys,0,'script alias writes the native global');
        tick(); assert.equal(buttons()[2].disabled,true,'conditions can lock again');
    }
    key('Digit9'); assert.equal(text(),'Which path?','out of range does nothing');
    const toggle = descendants(document.body).find(e=>e.textContent==='Test variables');
    toggle.click(); key('Digit2'); assert.equal(text(),'Which path?'); toggle.click();
    key('Digit2',{ctrlKey:true}); assert.equal(text(),'Which path?');
    key('Numpad2'); assert.equal(text(),'You made it!','second answer selects the second branch');
    key('Digit1'); assert.equal(panel.hidden,true,'1 finishes a terminal line');
    for(let frame=0;frame<5;frame++)tick();
    assert.equal(panel.hidden,true,'end stays closed while overlapping');
    player.y=140;tick();player.y=npc.y;tick();
    assert.equal(panel.hidden,false,'leave and re-enter opens a new conversation');
    buttons().at(-1).click();tick();
    assert.equal(panel.hidden,true,'Close button stays closed while overlapping');
    player.y=140;tick();player.y=npc.y;tick();
    key('Escape');tick();assert.equal(panel.hidden,true,'Escape also stays closed');
    player.y=140;tick();player.y=npc.y;tick();
    // Contacts must still be recorded when another system moves an NPC during dialogue.
    npc.y+=10;player.y=npc.y;tick();
    buttons().at(-1).click();tick();assert.equal(panel.hidden,true);
    // Returning to a waiting NPC must use its cached session in both DOM runners.
    project.characters[0].dialogueNodes.find(n=>n.dialogueID===60).outgoingLines=[
        {toNode:70,transitionConditions:[{variableName:'keys',comparisonOperator:'=',variableValue:1}]}
    ];
    const approach=()=>{player.y=140;tick();player.y=npc.y;tick();};
    approach();key('Digit1');key('Digit1');key('Digit2');
    assert.equal(text(),'You made it!');
    buttons().at(-1).click();approach();assert.equal(text(),'You made it!');
    buttons().at(-1).click();
    const input=descendants(document.body).find(e=>e.tagName==='INPUT');
    if(engine==='Construct')context.runtime.globalVars.keys=1;
    else {input.value='1';input.oninput();}
    assert.equal(panel.hidden,true);
    approach();assert.equal(text(),'Try again.','unlock starts at the downstream line');
    for(const code of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']) {
        key(code);assert.equal(panel.hidden,true,'movement closes dialogue');
        tick();assert.equal(panel.hidden,true,'overlap does not reopen dialogue');
        approach();assert.equal(panel.hidden,false);
    }
});
