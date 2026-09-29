const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/exportDialog'), 'utf8');
const formats = ['json','plainText','construct','godot','unity','unreal','gamemaker','gdevelop'];

function page(storage, denyStorage = false) {
    const element = extra => ({listeners:{}, addEventListener(name, fn){this.listeners[name]=fn}, ...extra});
    const radios = formats.map(value => ({name:'format',value,checked:value==='json'}));
    const target = element({value:'json'}), submit = {}, alert = {}, cancel = element(), form = element();
    const info = formats.map(value => ({dataset:{exportInfo:value}}));
    const settings = element({querySelectorAll:()=>radios});
    const dialog = element({open:false,showModal(){this.open=true},close(){this.open=false},
        querySelector:s=>({'[name="exportTarget"]':target,'[type="submit"]':submit,'[role="alert"]':alert,
            '[data-close-export]':cancel,form})[s],querySelectorAll:()=>info});
    const calls=[];
    const document = element({getElementById:id=>id==='exportDialog'?dialog:settings,
        querySelector:()=>radios.find(r=>r.checked),querySelectorAll:()=>formats.map(value=>({value}))});
    const context = vm.createContext({document,localStorage:{getItem:key=>{if(denyStorage)throw Error();return storage[key]},
        setItem:(key,value)=>{if(denyStorage)throw Error();storage[key]=value}},gameDialogueMakerProject:{},
        ...Object.fromEntries(['exportJson','exportDialogueToText','exportConstruct','exportGodot','exportUnity','exportUnreal','exportGameMaker','exportGDevelop']
            .map((name,index)=>[name,()=>calls.push(formats[index])]))});
    vm.runInContext(source,context);document.listeners.DOMContentLoaded();
    return {radios,target,submit,alert,dialog,info,calls,open:()=>context.openExportDialog(),
        select(value){radios.forEach(r=>r.checked=r.value===value);settings.listeners.change({target:radios.find(r=>r.checked)})},
        download(){form.listeners.submit({preventDefault(){}})}};
}

test('every default export survives reload and dispatches its matching exporter', () => {
    for(const format of formats) {
        const storage={};const first=page(storage);first.select(format);
        const reloaded=page(storage);reloaded.open();
        assert.equal(reloaded.target.value,format);
        assert.ok(reloaded.radios.find(r=>r.value===format).checked);
        if(format==='construct')assert.equal(reloaded.submit.textContent,'Download Construct (.c3p)');
        reloaded.download();assert.deepEqual(reloaded.calls,[format]);assert.equal(reloaded.dialog.open,false);
    }
});

test('one-off export choice does not replace the saved default', () => {
    const storage={},editor=page(storage);editor.select('construct');editor.open();
    editor.target.value='json';editor.target.listeners.change();editor.download();
    assert.deepEqual(editor.calls,['json']);editor.open();assert.equal(editor.target.value,'construct');
    const reloaded=page(storage);reloaded.open();assert.equal(reloaded.target.value,'construct');
});

test('invalid saved formats and unavailable storage are handled without wrong downloads', () => {
    const editor=page({'gameDialogueMaker.defaultExportFormat':'obsolete'});editor.open();assert.equal(editor.target.value,'json');
    editor.target.value='unsupported';editor.download();assert.deepEqual(editor.calls,[]);
    assert.match(editor.alert.textContent,/supported export format/);assert.equal(editor.dialog.open,true);
    const privatePage=page({},true);privatePage.select('construct');privatePage.open();privatePage.download();
    assert.deepEqual(privatePage.calls,['construct']);
});
