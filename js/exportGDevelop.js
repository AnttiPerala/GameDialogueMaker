const gdevelopExportHelpers = typeof module !== 'undefined' ? require('./exportCommon') :
    { createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

function buildGDevelopProject(source, template, sessionFactory, gameRunner) {
    const data = gdevelopExportHelpers.cleanDialogueProject(source);
    const plainJson = JSON.stringify(data);
    for (const character of data.characters || []) {
        character.dialogueNodes = character.dialogueNodes || [];
        for (const node of [character,...character.dialogueNodes]) {
            node.outgoingLines = node.outgoingLines || [];
            for (const line of node.outgoingLines)
                for (const c of line.transitionConditions || [])
                    if (typeof c.variableValue !== 'string' && (typeof c.variableValue !== 'number' || !Number.isFinite(c.variableValue)))
                        throw new Error(`Condition ${c.variableName}: use a finite number or text value.`);
        }
    }
    gdevelopExportHelpers.validateDialogueProject(data);
    const project = JSON.parse(JSON.stringify(template.project));
    Object.assign(project.properties, {projectUuid:crypto.randomUUID(),name:'Dialogue Playground',
        description:'Playable dialogue exported from Game Dialogue Maker.',adaptGameResolutionAtRuntime:false,
        sizeOnStartupMode:'',pixelsRounding:true,scaleMode:'nearest'});
    project.resources = {resources:[{file:'assets/character.png',kind:'image',metadata:'',name:'character.png',smoothed:false,userAdded:true}]};
    const scene = project.layouts[0];
    Object.assign(scene,{r:18,v:23,b:36,title:'Dialogue Playground'});
    project.resources.resources.push({file:'dialogue.json',kind:'json',metadata:'',name:'dialogue.json',userAdded:true});
    scene.variables = [{name:'DialogueCharacters',type:'string',value:JSON.stringify(data.characters.map((c,i)=>({characterId:String(c.characterID),object:'NPC_'+(i+1),label:'Label_'+(i+1)})))}];
    const sprite = name => ({name,type:'Sprite',assetStoreId:'',adaptCollisionMaskAutomatically:true,updateIfNotVisible:false,
        variables:[],effects:[],behaviors:[],animations:[{name:'Idle',useMultipleDirections:false,directions:[{looping:false,timeBetweenFrames:1,
            sprites:[{image:'character.png',hasCustomCollisionMask:false,points:[],originPoint:{name:'origine',x:16,y:16},
                centerPoint:{automatic:true,name:'centre',x:16,y:16},customCollisionMask:[]}]}]}]});
    const label = (name,text) => ({name,type:'TextObject::Text',assetStoreId:'',variables:[],effects:[],behaviors:[],
        bold:false,italic:false,underlined:false,smoothed:true,string:text,font:'',textAlignment:'center',characterSize:16,color:{r:237,g:243,b:255},
        content:{text,font:'',textAlignment:'center',verticalTextAlignment:'top',characterSize:16,lineHeight:0,color:'237;243;255',
            bold:false,italic:false,underlined:false,smoothed:true,isOutlineEnabled:false,outlineColor:'0;0;0',outlineThickness:2,
            isShadowEnabled:false,shadowAngle:90,shadowBlurRadius:2,shadowColor:'0;0;0',shadowDistance:4,shadowOpacity:127}});
    const instance = (name,x,y,text = false) => ({name,x,y,angle:0,zOrder:text ? 2 : 1,layer:'',persistentUuid:crypto.randomUUID(),
        customSize:text,width:text ? 180 : 32,height:text ? 64 : 32,keepRatio:!text,numberProperties:[],stringProperties:[],initialVariables:[]});
    scene.objects = [sprite('Player'),label('DialogueStatus','Loading dialogue...')];
    scene.instances = [instance('Player',140,140),instance('DialogueStatus',24,20,true)];
    if (data.demoAppleQuest === true) {
        project.resources.resources.push({file:'assets/apple.png',kind:'image',metadata:'',name:'apple.png',smoothed:false,userAdded:true});
        const apple = sprite('Apple');
        apple.animations[0].directions[0].sprites[0].image = 'apple.png';
        scene.objects.push(apple);
        scene.instances.push(instance('Apple',580,180));
    }
    data.characters.forEach((character,index) => {
        const npc = `NPC_${index + 1}`, text = `Label_${index + 1}`;
        const x = 140 + index % 4 * 220, y = 280 + Math.floor(index / 4) * 150;
        scene.objects.push(sprite(npc),label(text,character.characterName || 'Unnamed character'));
        scene.instances.push(instance(npc,x,y),instance(text,x - 90,y + 26,true));
    });
    scene.objectsFolderStructure = {folderName:'__ROOT',children:scene.objects.map(o => ({objectName:o.name}))};
    const code = `if (!runtimeScene.__gdmDialogue && !runtimeScene.__dialogueLoading) {
    runtimeScene.__dialogueLoading = true;
    runtimeScene.getGame().getJsonManager().loadJson("dialogue.json", (error, source) => {
        try {
            if (error || !source) throw new Error("Could not load dialogue.json: " + (error || "empty resource"));
            const data = JSON.parse(JSON.stringify(source));
            (${gdevelopExportHelpers.validateDialogueProject.toString()})(data);
            for (const character of data.characters) {
                character.dialogueNodes ||= []; character.outgoingLines ||= [];
                for (const node of character.dialogueNodes) node.outgoingLines ||= [];
            }
            const bindings = JSON.parse(runtimeScene.getVariables().get("DialogueCharacters").getAsString());
            runtimeScene.getObjects("DialogueStatus").forEach(object=>object.setString(""));
            runtimeScene.__gdmDialogue = (${gameRunner.toString()})(runtimeScene, data, ${sessionFactory.toString()}, gdjs, bindings);
        } catch (failure) {
            runtimeScene.getVariables().get("DialogueError").setString(String(failure.message));
            runtimeScene.getObjects("DialogueStatus").forEach(object=>object.setString("Dialogue could not load: " + failure.message));
            console.error(failure);
        }
    });
}
if (runtimeScene.__gdmDialogue) runtimeScene.__gdmDialogue.tick();`;
    scene.events = [{type:'BuiltinCommonInstructions::Comment',color:{b:80,g:180,r:80},comment:
        'Dialogue playground: move with WASD/arrows and touch NPCs. Replace the dialogue.json resource to update writing. DialogueCharacters maps scene objects to stable character IDs. DialogueError reports load failures.'},
        {type:'BuiltinCommonInstructions::JsCode',inlineCode:code.split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false}];
    return {
        ...(data.demoAppleQuest === true ? {'assets/apple.png':gdevelopExportHelpers.createDemoApplePng()} : {}),
        'game.json':JSON.stringify(project,null,2),
        'dialogue.json':plainJson,
        'README.md':template.readme,
        'assets/character.png':Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKUlEQVR4nO3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBgXdgl/rw4unIZ5cAAAAASUVORK5CYII='),c => c.charCodeAt(0))
    };
}
function exportGDevelop() {
    gdevelopExportHelpers.downloadDialogueBlob(gdevelopExportHelpers.createExportZip(buildGDevelopProject(
        gameDialogueMakerProject,gdevelopTemplate,createConstructDialogueSession,startGDevelopDialogueGame)), 'dialogue-gdevelop.zip');
}
if (typeof module !== 'undefined') module.exports = {buildGDevelopProject};
