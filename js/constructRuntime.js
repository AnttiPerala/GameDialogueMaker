// Kept independent of the editor and Construct APIs so traversal can be tested.
function createConstructDialogueSession(character, variables) {
    const nodes = new Map(character.dialogueNodes.map(node => [String(node.dialogueID), node]));
    let current = null, waiting = [];
    const allows = line => (line.transitionConditions || []).every(condition => {
        const actual = variables[condition.variableName];
        const expected = condition.variableValue;
        switch (condition.comparisonOperator) {
            case '=': return actual === expected;
            case '!=': return actual !== expected;
            case '<': return actual < expected;
            case '>': return actual > expected;
            case '<=': return actual <= expected;
            case '>=': return actual >= expected;
            default: return false;
        }
    });
    const go = id => {
        current = nodes.get(String(id)) || null;
        waiting = (current?.outgoingLines || []).filter(line =>
            (line.transitionConditions || []).some(c => c.waitUntilMet !== false) && !allows(line));
        return current;
    };
    const next = node => {
        const lines = node.outgoingLines || [];
        if (lines.length) {
            const line = lines.find(allows);
            return line ? go(line.toNode) : current;
        }
        return go(node.nextNode);
    };
    return {
        get current() { return current; },
        start() {
            if (current && waiting.length) {
                // Reopen at the checkpoint; never select a player response automatically.
                const unlocked = waiting.find(allows);
                if (unlocked && !['question','fight'].includes(current.dialogueType)) return go(unlocked.toNode);
                return current;
            }
            const lines = character.outgoingLines || [];
            return go(lines.find(allows)?.toNode);
        },
        options() {
            if (!current) return [];
            const node = current;
            if (node.dialogueType === 'question') {
                return node.outgoingLines.map(line => {
                    const answer = nodes.get(String(line.toNode));
                    const exits = answer.outgoingLines || [];
                    return {
                        text: answer.dialogueText || '(Empty answer)',
                        enabled: allows(line) && (!exits.length || exits.some(allows)),
                        choose: () => next(answer)
                    };
                });
            }
            if (node.dialogueType === 'fight') {
                return node.outgoingLines.map((line, index) => ({
                    text: index === 0 ? 'Win the fight' : index === 1 ? 'Lose the fight' : `Outcome ${index + 1}`,
                    enabled: allows(line), choose: () => go(line.toNode)
                }));
            }
            return [{ text: node.outgoingLines.length || Number(node.nextNode) > 0 ? 'Continue' : 'Finish',
                enabled: !node.outgoingLines.length || node.outgoingLines.some(allows),
                choose: () => next(node) }];
        }
    };
}

// Serialized into scripts/main.js in the exported project. No editor globals.
function startConstructDialogueGame(runtime, project, createSession) {
    const player = runtime.objects.Player.getFirstInstance();
    const playerLabel = runtime.objects.PlayerLabel.getFirstInstance();
    player.addChild(playerLabel, {
        transformX: true, transformY: true, transformVisibility: true, destroyWithParent: true
    });
    const npcs = project.characters.map((character, index) => ({
        character, sprite: runtime.objects[`NPC_${index + 1}`].getFirstInstance()
    }));
    const variables = Object.create(null);
    const conditions = project.characters.flatMap(character => [character, ...character.dialogueNodes]
        .flatMap(node => (node.outgoingLines || []).flatMap(line => line.transitionConditions || [])));
    const bindings = project.constructVariables || [...new Set(conditions.map(c => c.variableName))].map(name => ({dialogueName:name, name}));
    for (const binding of bindings) {
        Object.defineProperty(variables, binding.dialogueName, {
            enumerable:true,
            get:() => runtime.globalVars[binding.name],
            set:value => { runtime.globalVars[binding.name] = value; }
        });
    }
    // Compatibility alias: values are native Construct globals, never a second store.
    globalThis.gdmDialogueVariables = variables;
    let apple = project.demoAppleQuest === true ? runtime.objects.Apple.getFirstInstance() : null;
    const style = document.createElement('style');
    style.textContent = `
        .gdm-hud,.gdm-dialogue,.gdm-vars {position:fixed;z-index:1000;color:#edf3ff;
            background:#141d30f5;font:16px/1.5 system-ui,sans-serif;border:1px solid #526785;
            border-radius:12px;box-sizing:border-box;box-shadow:0 8px 30px #0005}
        .gdm-hud {top:12px;left:12px;padding:10px 16px;max-width:calc(100vw - 24px)}
        .gdm-dialogue {left:50%;bottom:16px;transform:translateX(-50%);width:min(760px,96vw);
            max-height:70vh;overflow:auto;padding:20px}
        .gdm-dialogue h2 {font-size:20px;margin:0 0 12px;color:#9bd9ff}
        .gdm-dialogue p {white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0}
        .gdm-dialogue button,.gdm-hud button,.gdm-vars button {background:#2b4163;color:white;
            border:1px solid #7294c4;border-radius:6px;padding:8px 12px;cursor:pointer;font:inherit}
        .gdm-dialogue button {display:block;width:100%;margin-top:8px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}
        .gdm-dialogue button:disabled {opacity:.5;cursor:not-allowed}
        .gdm-dialogue button:focus-visible {outline:3px solid #9bd9ff}
        .gdm-vars {right:12px;top:80px;padding:16px;max-height:45vh;max-width:90vw;overflow:auto;z-index:1001}
        .gdm-vars label {display:block;margin-bottom:8px}
        .gdm-vars input {display:block;font:inherit;max-width:100%;box-sizing:border-box}
    `;
    document.head.append(style);
    const hud = document.createElement('div');
    hud.className = 'gdm-hud';
    hud.append(document.createTextNode('Blue square = you · Move: arrows / WASD · Touch an NPC to talk · Esc: close '));
    const variableButton = document.createElement('button');
    variableButton.textContent = 'Test variables';
    hud.append(variableButton);
    const questStatus = document.createElement('span');
    if (apple) { questStatus.textContent = ' · Apple: not collected'; hud.append(questStatus); }
    document.body.append(hud);
    const panel = document.createElement('section');
    panel.className = 'gdm-dialogue';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Character dialogue');
    panel.hidden = true;
    document.body.append(panel);
    const variablePanel = document.createElement('section');
    variablePanel.className = 'gdm-vars';
    variablePanel.hidden = true;
    const hint = document.createElement('p');
    hint.textContent = 'Edit native Construct global variables. Event-sheet changes also update dialogue conditions.';
    variablePanel.append(hint);
    for (const name of Object.keys(variables)) {
        const label = document.createElement('label');
        label.textContent = bindings.find(binding => binding.dialogueName === name).name;
        const input = document.createElement('input');
        const numeric = typeof variables[name] === 'number';
        input.type = numeric ? 'number' : 'text';
        input.value = variables[name];
        input.addEventListener('input', () => {
            variables[name] = numeric ? Number(input.value) : input.value;
            if (session) render();
        });
        label.append(input);
        variablePanel.append(label);
    }
    if (!Object.keys(variables).length) variablePanel.append(document.createTextNode('No conditions in this dialogue.'));
    document.body.append(variablePanel);
    variableButton.onclick = () => { refreshVariableInputs(); variablePanel.hidden = !variablePanel.hidden; };
    const refreshVariableInputs = () => {
        [...variablePanel.querySelectorAll('input')].forEach((input, index) => {
            input.value = variables[Object.keys(variables)[index]];
        });
    };
    const sessions = new Map();
    let session = null, activeNPC = null, page = 0;
    let previousContacts = new Set();
    const keys = new Set();
    const contactsNow = () => new Set(npcs.filter(npc => Math.abs(npc.sprite.x - player.x) < 32 && Math.abs(npc.sprite.y - player.y) < 32));
    const close = () => { previousContacts = contactsNow(); panel.hidden = true; session = null; activeNPC = null; keys.clear(); };
    let numberedButtons = [];
    function button(text, action, enabled = true, numbered = true) {
        const element = document.createElement('button');
        element.textContent = text;
        if (numbered) {
            const badge = document.createElement('span');
            badge.textContent = String(numberedButtons.length + 1);
            badge.style.cssText = 'display:inline-block;min-width:1.6em;opacity:.45;font-size:.8em;vertical-align:baseline';
            element.prepend(badge);
            numberedButtons.push(element);
        }
        element.disabled = !enabled;
        element.onclick = action;
        panel.append(element);
    }
    function render() {
        numberedButtons = [];
        panel.replaceChildren();
        panel.hidden = false;
        const title = document.createElement('h2');
        title.textContent = activeNPC.character.characterName;
        panel.append(title);
        const node = session.current;
        const text = document.createElement('p');
        if (!node) {
            text.textContent = 'No available starting dialogue. Check the character’s root connection and test variables.';
            panel.append(text);
            button('Try again', () => { session.start(); page = 0; render(); });
        } else {
            const pages = String(node.dialogueText || '').split(/\r?\n/);
            const role = session.current.dialogueSpeakers?.[page] || (session.current.dialogueType === 'answer' ? 'player' : 'npc');
            title.textContent = role === 'player' ? 'You' : role === 'scene' ? 'Scene' : activeNPC.character.characterName;
            text.style.fontStyle = role === 'scene' ? 'italic' : 'normal';
            text.textContent = pages[page];
            panel.append(text);
            if (page < pages.length - 1) {
                button('Continue', () => { page++; render(); });
            } else {
                if (session.current.dialogueType === 'question') {
                    const speaker = document.createElement('h3');
                    speaker.textContent = 'You';
                    speaker.style.cssText = 'font-size:14px;color:#9bd9ff;margin:16px 0 4px';
                    panel.append(speaker);
                }
                const options = session.options();
                for (const [index, option] of options.entries()) button(option.text, () => {
                    const currentOption = session.options()[index];
                    if (!currentOption?.enabled) { render(); return; }
                    currentOption.choose();
                    page = 0;
                    if (session.current) render(); else close();
                }, option.enabled);
                if (options.some(option => !option.enabled)) {
                    const blocked = document.createElement('p');
                    blocked.textContent = 'Some paths are locked by conditions. Use Test variables to try them.';
                    panel.append(blocked);
                }
            }
        }
        button('Close conversation (Esc)', close, true, false);
        panel.scrollTop = 0;
    }
    function keydown(event) {
        const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
        if (digit && session && variablePanel.hidden && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey &&
            !event.target.closest?.('input,textarea,select,[contenteditable]')) {
            event.preventDefault();
            numberedButtons[Number(digit[1]) - 1]?.click();
            return;
        }
        if (session && variablePanel.hidden && !event.repeat &&
            !event.target.closest?.('input,textarea,select,[contenteditable]') &&
            ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(event.code)) close();
        if (event.code === 'Escape') { close(); variablePanel.hidden = true; return; }
        if (event.target instanceof HTMLInputElement) return;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
        keys.add(event.code);
        if (event.repeat) return;
        if (session && (event.code === 'Space' || event.code === 'Enter') && event.target.tagName !== 'BUTTON') {
            panel.querySelector('button:not(:disabled)')?.click();
        }
    }
    const keyup = event => keys.delete(event.code);
    const blur = () => keys.clear();
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    let lastVariableValues = Object.values(variables);
    const tick = () => {
        const values = Object.values(variables);
        if (values.some((value, index) => value !== lastVariableValues[index])) {
            lastVariableValues = values;
            refreshVariableInputs();
            if (session) render();
        }
        if (session || !variablePanel.hidden) { previousContacts = contactsNow(); return; }
        let dx = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
        let dy = Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
        const distance = Math.hypot(dx, dy) || 1;
        const step = Math.min(runtime.dt, 0.05) * 220;
        player.x = Math.max(20, Math.min(runtime.layout.width - 20, player.x + dx / distance * step));
        player.y = Math.max(100, Math.min(runtime.layout.height - 20, player.y + dy / distance * step));
        runtime.layout.scrollTo(player.x, player.y);
        if (apple && Math.abs(apple.x - player.x) < 30 && Math.abs(apple.y - player.y) < 30) {
            variables.hasApple = 1;
            apple.destroy(); apple = null;
            questStatus.textContent = ' · Apple collected! Return to Mira.';
            refreshVariableInputs();
        }
        const contacts = contactsNow();
        const entered = [...contacts].find(npc => !previousContacts.has(npc));
        previousContacts = contacts;
        if (entered) {
            activeNPC = entered;
            if (!sessions.has(entered.character)) sessions.set(entered.character, createSession(entered.character, variables));
            session = sessions.get(entered.character);
            session.start();
            page = 0;
            keys.clear();
            render();
        }
    };
    runtime.addEventListener('tick', tick);
    const layout = runtime.layout;
    const cleanup = () => {
        runtime.removeEventListener('tick', tick);
        layout.removeEventListener('beforelayoutend', cleanup);
        window.removeEventListener('keydown', keydown);
        window.removeEventListener('keyup', keyup);
        window.removeEventListener('blur', blur);
        for (const element of [style, hud, panel, variablePanel]) element.remove();
        delete globalThis.gdmDialogueVariables;
    };
    layout.addEventListener('beforelayoutend', cleanup);
}

if (typeof module !== 'undefined') module.exports = { createConstructDialogueSession, startConstructDialogueGame };
