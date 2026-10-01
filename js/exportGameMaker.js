const gameMakerExportHelpers = typeof module !== 'undefined' ? require('./exportCommon') :
    { createDemoApplePng, cleanDialogueProject, validateDialogueProject, createExportZip, downloadDialogueBlob };

function buildGameMakerProject(source, template) {
    const data = gameMakerExportHelpers.cleanDialogueProject(source);
    gameMakerExportHelpers.validateDialogueProject(data);
    const files = {...template};
    const json = (name, value) => { files[name] = JSON.stringify(value, null, 2); };
    const resource = (type, name, version = '') => ({['$' + type]:version, '%Name':name, name, resourceType:type, resourceVersion:'2.0'});
    const parent = {name:'Dialogue Playground', path:'folders/Dialogue Playground.yy'};
    const resources = [];
    const add = (kind, name, content) => {
        const path = `${kind}/${name}/${name}.yy`;
        json(path, content); resources.push({id:{name,path}});
        return {name,path};
    };
    for (const name of ['gdm_session', 'gdm_ui'])
        add('scripts', name, {...resource('GMScript', name, 'v1'), isCompatibility:false, isDnD:false, parent});
    const objects = {};
    const definitions = {
        obj_gdm_controller:[[0,0],[3,0],[8,0],[8,64],[12,0]],
        obj_gdm_player:[[0,0],[3,0]],
        obj_gdm_npc:[[0,0],[3,0],[8,0]]
    };
    for (const [name, events] of Object.entries(definitions)) {
        objects[name] = add('objects', name, {...resource('GMObject', name), parent,
            eventList:events.map(([eventType,eventNum]) => ({...resource('GMEvent', '', 'v1'), eventType,eventNum,collisionObjectId:null,isDnD:false})),
            managed:true, overriddenProperties:[], parentObjectId:null, persistent:false, physicsAngularDamping:0.1,
            physicsDensity:0.5, physicsFriction:0.2, physicsGroup:1, physicsKinematic:false, physicsLinearDamping:0.1,
            physicsObject:false, physicsRestitution:0.1, physicsSensor:false, physicsShape:1, physicsShapePoints:[],
            physicsStartAwake:true, properties:[], solid:false, spriteId:null, spriteMaskId:null, visible:true});
    }
    const roomName = 'rm_gdm_playground';
    const roomPath = `rooms/${roomName}/${roomName}.yy`;
    const instanceName = 'inst_gdm_controller';
    const room = add('rooms', roomName, {...resource('GMRoom',roomName,'v1'), parent,
        creationCodeFile:'', inheritCode:false, inheritCreationOrder:false, inheritLayers:false, isDnd:false,
        instanceCreationOrder:[{name:instanceName,path:roomPath}], parentRoom:null,
        layers:[{...resource('GMRInstanceLayer','Instances'), depth:0, effectEnabled:true, effectType:null, gridX:32,gridY:32,
            hierarchyFrozen:false, inheritLayerDepth:false, inheritLayerSettings:false, inheritSubLayers:true, inheritVisibility:true,
            instances:[{...resource('GMRInstance',instanceName,'v4'), colour:4294967295, frozen:false, hasCreationCode:false,
                ignore:false, imageIndex:0, imageSpeed:1, inheritCode:false,inheritedItemId:null,inheritItemSettings:false,isDnd:false,
                objectId:objects.obj_gdm_controller,properties:[],rotation:0,scaleX:1,scaleY:1,x:0,y:0}],
            layers:[],properties:[],userdefinedDepth:false,visible:true},
        {...resource('GMRBackgroundLayer','Background'), depth:100, effectEnabled:true, effectType:null, gridX:32,gridY:32,
            animationFPS:30, animationSpeedType:0, colour:4280557330, hspeed:0,htiled:false,inheritLayerDepth:false,
            inheritLayerSettings:false,inheritSubLayers:true,inheritVisibility:true,layers:[],properties:[],spriteId:null,
            stretch:false,userdefinedAnimFPS:false,userdefinedDepth:false,visible:true,vspeed:0,vtiled:false,x:0,y:0}],
        physicsSettings:{inheritPhysicsSettings:false,PhysicsWorld:false,PhysicsWorldGravityX:0,PhysicsWorldGravityY:10,PhysicsWorldPixToMetres:0.1},
        roomSettings:{Height:Math.max(640,260 + Math.ceil(data.characters.length / 4) * 150),Width:960,inheritRoomSettings:false,persistent:false},
        sequenceId:null,views:Array.from({length:8}, () => ({hborder:32,hport:640,hspeed:-1,hview:640,inherit:false,objectId:null,
            vborder:32,visible:false,vspeed:-1,wport:960,wview:960,xport:0,xview:0,yport:0,yview:0})),
        viewSettings:{clearDisplayBuffer:true,clearViewBackground:false,enableViews:false,inheritViewSettings:false},volume:1});
    const included = ['dialogue.json','character.png'];
    if (data.demoAppleQuest === true) { included.push('apple.png'); files['datafiles/apple.png'] = gameMakerExportHelpers.createDemoApplePng(); }
    json('DialoguePlayground.yyp', {...resource('GMProject','DialoguePlayground','v1'),
        AudioGroups:[{...resource('GMAudioGroup','audiogroup_default','v1'),exportDir:'',targets:-1}],
        configs:{children:[],name:'Default'},defaultScriptType:0,
        Folders:[{...resource('GMFolder',parent.name),folderPath:parent.path}],ForcedPrefabProjectReferences:[],
        IncludedFiles:included.map(name => ({...resource('GMIncludedFile',name),CopyToMask:-1,filePath:'datafiles'})),
        isEcma:false,LibraryEmitters:[],MetaData:{IDEVersion:'2026.0.0.16'},resources,RoomOrderNodes:[{roomId:room}],templateType:'game',
        TextureGroups:[{...resource('GMTextureGroup','Default'),autocrop:true,border:2,compressFormat:'bz2',customOptions:'',directory:'',
            groupParent:null,isScaled:true,loadType:'default',mipsToGenerate:0,targets:-1}]});
    json('options/main/options_main.yy', {name:'Main',resourceType:'GMMainOptions',resourceVersion:'1.4',
        option_gameguid:crypto.randomUUID(),option_gameid:'0',option_game_speed:60,option_mips_for_3d_textures:false,
        option_draw_colour:4294967295,option_window_colour:255,option_steam_app_id:'0',option_sci_usesci:false,
        option_author:'',option_collision_compatibility:false,option_copy_on_write_enabled:false,option_spine_licence:false});
    files['datafiles/dialogue.json'] = JSON.stringify(data);
    files['datafiles/character.png'] = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKUlEQVR4nO3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBgXdgl/rw4unIZ5cAAAAASUVORK5CYII='), c => c.charCodeAt(0));
    return files;
}
function exportGameMaker() {
    gameMakerExportHelpers.downloadDialogueBlob(gameMakerExportHelpers.createExportZip(
        buildGameMakerProject(gameDialogueMakerProject, gameMakerTemplate)), 'dialogue-gamemaker.zip');
}
if (typeof module !== 'undefined') module.exports = {buildGameMakerProject};
