// Serialized into a native GDevelop JavaScript event. No editor or module globals.
function startGDevelopDialogueGame(runtimeScene, project, createSession, gdjs) {
    const player = runtimeScene.getObjects('Player')[0];
    let apple = project.demoAppleQuest === true ? runtimeScene.getObjects('Apple')[0] : null;
    const npcs = project.characters.map((character, index) => ({character, sprite:runtimeScene.getObjects(`NPC_${index + 1}`)[0]}));
    if (!player || npcs.some(npc => !npc.sprite)) throw new Error('The playground scene is missing a player or NPC.');
    player.setColor('85;200;255');
    for (const npc of npcs) {
        const hex = /^#[0-9a-f]{6}$/i.test(npc.character.bgColor) ? npc.character.bgColor : '#b68af7';
        npc.sprite.setColor([1,3,5].map(i => Math.max(90, parseInt(hex.slice(i,i + 2),16))).join(';'));
    }
    const variables = Object.create(null);
    for (const character of project.characters)
        for (const node of [character, ...character.dialogueNodes])
            for (const edge of node.outgoingLines)
                for (const condition of edge.transitionConditions || [])
                    if (!Object.hasOwn(variables, condition.variableName)) variables[condition.variableName] = typeof condition.variableValue === 'number' ? 0 : '';

    const root = document.createElement('div');
    root.className = 'gdm-gdevelop';
    const style = document.createElement('style');
    style.textContent = `
      .gdm-gdevelop {position:fixed;inset:0;z-index:1000;pointer-events:none;font:16px/1.5 system-ui,sans-serif;color:#edf3ff}
      .gdm-gdevelop section {position:absolute;pointer-events:auto;background:#141d30f5;padding:16px;border:1px solid #526785;border-radius:10px;box-sizing:border-box}
      .gdm-gdevelop .hud {top:12px;left:12px;max-width:calc(100% - 24px)}
      .gdm-gdevelop .dialogue {bottom:16px;left:50%;transform:translateX(-50%);width:min(760px,96%);max-height:64%;overflow:auto}
      .gdm-gdevelop .vars {right:12px;top:100px;max-width:90%;max-height:40%;overflow:auto}
      .gdm-gdevelop h2 {font-size:21px;margin:0 0 12px}
      .gdm-gdevelop p,.gdm-gdevelop button {white-space:pre-wrap;overflow-wrap:anywhere}
      .gdm-gdevelop button {font:inherit;color:white;background:#2b4163;border:1px solid #7294c4;border-radius:5px;padding:8px 12px;cursor:pointer}
      .gdm-gdevelop .dialogue button {display:block;width:100%;margin-top:8px;text-align:left}
      .gdm-gdevelop button:disabled {opacity:.45;cursor:default}
      .gdm-gdevelop button:focus-visible,.gdm-gdevelop input:focus-visible {outline:3px solid #9bd9ff}
      .gdm-gdevelop label,.gdm-gdevelop input {display:block;margin:6px 0;font:inherit;max-width:100%;box-sizing:border-box}
      .gdm-gdevelop [hidden] {display:none!important}
    `;
    const hud = document.createElement('section'); hud.className = 'hud';
    hud.append(document.createTextNode('Blue square = you · WASD / arrows: move · Touch an NPC to talk '));
    const panel = document.createElement('section'); panel.className = 'dialogue'; panel.hidden = true;
    panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Character dialogue');
    const variablePanel = document.createElement('section'); variablePanel.className = 'vars'; variablePanel.hidden = true;
    const toggle = document.createElement('button'); toggle.textContent = 'Test variables';
    toggle.onclick = () => { variablePanel.hidden = !variablePanel.hidden; };
    hud.append(toggle);
    const questStatus = document.createElement('span');
    if (apple) { questStatus.textContent = ' · Apple: not collected'; hud.append(questStatus); }
    for (const [name, initial] of Object.entries(variables)) {
        const label = document.createElement('label'); label.textContent = name;
        const input = document.createElement('input');
        input.type = typeof initial === 'number' ? 'number' : 'text'; input.value = String(initial);
        input.oninput = () => {
            if (typeof initial === 'number') {
                if (input.value.trim() === '' || !Number.isFinite(Number(input.value))) return;
                variables[name] = Number(input.value);
            } else variables[name] = input.value;
            if (session) render();
        };
        label.append(input); variablePanel.append(label);
    }
    if (!Object.keys(variables).length) variablePanel.append(document.createTextNode('No conditions in this dialogue.'));
    const closeVariables = document.createElement('button'); closeVariables.textContent = 'Close test variables';
    closeVariables.onclick = () => { variablePanel.hidden = true; };
    variablePanel.append(closeVariables);
    root.append(style,hud,panel,variablePanel); document.body.append(root);
    let session = null, activeNPC = null, page = 0, previousContacts = new Set();
    const close = () => { session = null; activeNPC = null; panel.hidden = true; };
    function button(text, action, enabled = true) {
        const element = document.createElement('button'); element.textContent = text;
        element.disabled = !enabled; element.onclick = action; panel.append(element);
    }
    function render() {
        panel.replaceChildren(); panel.hidden = false;
        const title = document.createElement('h2'); title.textContent = activeNPC.character.characterName; panel.append(title);
        const text = document.createElement('p'); panel.append(text);
        if (!session.current) {
            text.textContent = 'No available starting dialogue. Check the root connection and test variables.';
            button('Try again', () => { session.start(); page = 0; render(); });
        } else {
            const pages = String(session.current.dialogueText || '').split(/\r?\n/);
            text.textContent = pages[page];
            if (page + 1 < pages.length) button('Continue', () => { page++; render(); });
            else {
                const options = session.options();
                for (const option of options) button(option.text, () => {
                    option.choose(); page = 0;
                    if (session.current) render(); else close();
                }, option.enabled);
                if (options.some(option => !option.enabled)) {
                    const hint = document.createElement('p'); hint.textContent = 'Locked paths can be tested with Test variables.'; panel.append(hint);
                }
            }
        }
        button('Close conversation (Esc)', close); panel.scrollTop = 0;
    }
    function keydown(event) {
        if (root.hidden) return;
        if (event.code === 'Escape') { close(); variablePanel.hidden = true; }
        if (event.target.tagName !== 'INPUT' && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
    }
    window.addEventListener('keydown', keydown);
    const height = Math.max(640,260 + Math.ceil(npcs.length / 4) * 150);
    const state = {
        variables, root, render,
        get busy() { return !!session || !variablePanel.hidden; },
        tick() {
            if (root.hidden || state.busy) return;
            const input = runtimeScene.getGame().getInputManager();
            const down = key => input.isKeyPressed(key);
            const dx = Number(down(39) || down(68)) - Number(down(37) || down(65));
            const dy = Number(down(40) || down(83)) - Number(down(38) || down(87));
            const distance = Math.hypot(dx,dy) || 1;
            const step = Math.min(runtimeScene.getTimeManager().getElapsedTime() / 1000,0.05) * 220;
            player.setPosition(Math.max(20,Math.min(940,player.getX() + dx / distance * step)),
                Math.max(100,Math.min(height - 20,player.getY() + dy / distance * step)));
            runtimeScene.getLayer('').setCameraX(480);
            runtimeScene.getLayer('').setCameraY(Math.max(320,Math.min(height - 320,player.getY())));
            if (apple && gdjs.RuntimeObject.collisionTest(player,apple,false)) {
                variables.hasApple = 1;
                apple.deleteFromScene(runtimeScene); apple = null;
                questStatus.textContent = ' · Apple collected! Return to Mira.';
                [...variablePanel.querySelectorAll('input')].forEach((input, index) => {
                    input.value = variables[Object.keys(variables)[index]];
                });
            }
            const contacts = new Set(npcs.filter(npc => gdjs.RuntimeObject.collisionTest(player,npc.sprite,false)));
            const entered = [...contacts].find(npc => !previousContacts.has(npc)); previousContacts = contacts;
            if (entered) {
                activeNPC = entered; session = createSession(entered.character,variables); session.start(); page = 0; render();
            }
        },
        dispose() { window.removeEventListener('keydown',keydown); root.remove(); delete runtimeScene.__gdmDialogue; }
    };
    if (!gdjs.__gdmLifecycleRegistered) {
        gdjs.__gdmLifecycleRegistered = true;
        gdjs.registerRuntimeSceneUnloadedCallback(scene => scene.__gdmDialogue?.dispose());
        gdjs.registerRuntimeScenePausedCallback(scene => { if (scene.__gdmDialogue) scene.__gdmDialogue.root.hidden = true; });
        gdjs.registerRuntimeSceneResumedCallback(scene => { if (scene.__gdmDialogue) scene.__gdmDialogue.root.hidden = false; });
    }
    return state;
}
if (typeof module !== 'undefined') module.exports = {startGDevelopDialogueGame};
