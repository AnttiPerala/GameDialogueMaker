const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createConstructDialogueSession} = require('../js/constructRuntime');

test('condition editor defaults to waiting and saves both checkbox states',()=>{
    const source=fs.readFileSync(require.resolve('../js/handleEvents'),'utf8');
    const handlers={};let html='',saved=0,checked=false;
    const line={transitionConditions:[]};
    const chain={hide(){},show(){},remove(){},each(){}};
    const circle={
        attr:name=>name==='data-fromnode'?'7':'8',
        find(selector){
            if(selector==='.conditionInputsWrap')return {...chain,length:0};
            if(selector==='.waitUntilMet')return {prop:()=>checked};
            if(selector==='.variableName')return {val:()=>'appleGiven'};
            if(selector==='.variableValue')return {val:()=>'true'};
            if(selector==='.comparisonOperator')return {val:()=>'='};
            return chain;
        },
        append:value=>{html=value;},
        animate(props,time,callback){if(callback)callback.call(this);}
    };
    const document={};
    const $=value=>value===document?{on:(event,selector,fn)=>handlers[selector]=fn}:value;
    const context=vm.createContext({$,jQuery:$,document,
        getLineObjectFromMasterObjectUsingFromAndTo:()=>line,
        checkIfNumberLike:()=> 'NaN',storeMasterObjectToLocalStorage:()=>saved++});
    const begin=source.indexOf('/* CLICK ON THE CONDITION CIRCLE TO EXPAND IT */');
    const end=source.indexOf('/* CLICK ON THE CONDITION CIRCLE DELETE BUTTON');
    vm.runInContext(source.slice(begin,end),context);
    handlers['.conditionCircle'].call(circle);
    assert.match(html,/class="waitUntilMet" checked/);
    assert.match(html,/Wait here until condition is met/);
    for(const state of [false,true]) {
        checked=state;
        handlers['.conditionCircle .okTransition'].call({closest:()=>circle},{stopPropagation(){}});
        assert.equal(line.transitionConditions[0].waitUntilMet,state);
        assert.equal(line.transitionConditions[0].variableValue,'true');
        handlers['.conditionCircle'].call(circle);
        assert.equal(/class="waitUntilMet" checked/.test(html),state);
    }
    assert.equal(saved,2);
    const restored=JSON.parse(JSON.stringify(line));
    assert.equal(restored.transitionConditions[0].waitUntilMet,true);
});

test('waiting questions never auto-select a player answer, and all conditions must pass',()=>{
    const gate={toNode:2,transitionConditions:[
        {variableName:'apple',comparisonOperator:'=',variableValue:1},
        {variableName:'ready',comparisonOperator:'=',variableValue:1}
    ]};
    const character={outgoingLines:[{toNode:1}],dialogueNodes:[
        {dialogueID:1,dialogueType:'question',dialogueText:'Choose',outgoingLines:[gate]},
        {dialogueID:2,dialogueType:'answer',dialogueText:'Give apple',outgoingLines:[],nextNode:3},
        {dialogueID:3,dialogueType:'line',dialogueText:'Thanks',outgoingLines:[],nextNode:-1}
    ]};
    const vars={apple:0,ready:0}, session=createConstructDialogueSession(character,vars);
    session.start();vars.apple=1;
    assert.equal(session.start().dialogueID,1);assert.equal(session.options()[0].enabled,false);
    vars.ready=1;assert.equal(session.start().dialogueID,1);
    assert.equal(session.options()[0].enabled,true);
    session.options()[0].choose();assert.equal(session.current.dialogueID,3);
});
