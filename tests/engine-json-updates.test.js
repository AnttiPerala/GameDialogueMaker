const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fixture=require('./dialogue-fixture');
const runtime=require('../js/constructRuntime');
const {buildGDevelopProject}=require('../js/exportGDevelop');
const {startGDevelopDialogueGame}=require('../js/gdevelopRuntime');

test('all six exports contain the exact plain JSON update file',()=>{
    const source=fixture();source.characters.reverse();
    source.characters[1].dialogueNodes[0].dialogueText='Updated writing.';
    const plain=JSON.stringify(source);
    const results=[
        [require('../js/exportConstruct').buildConstructProject(source,require('../js/constructTemplate'),runtime.createConstructDialogueSession),'files/dialogue.json'],
        [require('../js/exportGodot').buildGodotProject(source,require('../js/godotTemplate')),'dialogue.json'],
        [require('../js/exportUnity').buildUnityProject(source,require('../js/unityTemplate')),'Assets/GameDialogueMaker/Resources/dialogue.json'],
        [require('../js/exportUnreal').buildUnrealProject(source,require('../js/unrealTemplate')),'Content/Dialogue/dialogue.json'],
        [require('../js/exportGameMaker').buildGameMakerProject(source,require('../js/gameMakerTemplate')),'datafiles/dialogue.json'],
        [buildGDevelopProject(source,require('../js/gdevelopTemplate'),runtime.createConstructDialogueSession,startGDevelopDialogueGame),'dialogue.json']
    ];
    for(const [files,name] of results) assert.equal(files[name],plain,name);
});

test('GDevelop loads replaced JSON asynchronously while preserving scene bindings',()=>{
    const source=fixture();
    function runner(scene,data,createSession,gdjs,bindings) {
        scene.loaded=data;scene.bindings=bindings;return {tick(){scene.ticks++;}};
    }
    const files=buildGDevelopProject(source,require('../js/gdevelopTemplate'),runtime.createConstructDialogueSession,runner);
    const sceneData=JSON.parse(files['game.json']).layouts[0];
    const savedBinding=sceneData.variables[0].value;
    const scene={ticks:0,status:'loading',getObjects:()=>[{setString:text=>scene.status=text}],
        getVariables:()=>({get:name=>({getAsString:()=>savedBinding,setString:value=>scene.error=value})})};
    let callback,loads=0;
    scene.getGame=()=>({getJsonManager:()=>({loadJson:(name,fn)=>{assert.equal(name,'dialogue.json');loads++;callback=fn;}})});
    const context=vm.createContext({runtimeScene:scene,gdjs:{},console:{error(){}}});
    const code=sceneData.events[1].inlineCode.join('\n');
    vm.runInContext(code,context);vm.runInContext(code,context);assert.equal(loads,1);
    source.characters.reverse();source.characters[1].dialogueNodes[0].dialogueText='New princess greeting';
    files['dialogue.json']=JSON.stringify(source);
    callback(null,JSON.parse(files['dialogue.json']));
    vm.runInContext(code,context);
    assert.equal(scene.ticks,1);assert.equal(scene.status,'');
    assert.equal(scene.bindings[0].characterId,'9');
    assert.equal(scene.loaded.characters.find(c=>String(c.characterID)===scene.bindings[0].characterId).dialogueNodes[0].dialogueText,'New princess greeting');
    assert.equal(sceneData.variables[0].value,savedBinding);
});
