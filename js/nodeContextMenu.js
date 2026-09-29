// Copies are independent of DOM references and existing connection ownership.
function duplicateDialogueNode(project, characterId, dialogueId, offsetX = 380) {
    const character = project.characters.find(c => String(c.characterID) === String(characterId));
    if (!character) return null;
    const copyData = value => JSON.parse(JSON.stringify(value, (key, item) =>
        ['nodeElement', 'lineElem', 'nextNodeLineElem'].includes(key) ? undefined : item));
    if (dialogueId == null) {
        const copy = copyData(character);
        copy.characterID = Math.max(0, ...project.characters.map(c => Number(c.characterID))) + 1;
        copy.characterName = (copy.characterName || 'Character') + ' copy';
        copy.characterNodeX = (Number(copy.characterNodeX) || 0) + offsetX;
        copy.characterNodeY = (Number(copy.characterNodeY) || 0) + 40;
        for (const node of copy.dialogueNodes || []) {
            node.dialogueNodeX = (Number(node.dialogueNodeX) || 0) + offsetX;
            node.dialogueNodeY = (Number(node.dialogueNodeY) || 0) + 40;
        }
        project.characters.push(copy);
        return {characterId:copy.characterID, dialogueId:null};
    }
    const source = character.dialogueNodes.find(n => String(n.dialogueID) === String(dialogueId));
    if (!source) return null;
    const copy = copyData(source);
    copy.dialogueID = Math.max(0, ...character.dialogueNodes.map(n => Number(n.dialogueID))) + 1;
    copy.dialogueNodeX = (Number(copy.dialogueNodeX) || 0) + offsetX;
    copy.dialogueNodeY = (Number(copy.dialogueNodeY) || 0) + 40;
    copy.outgoingLines = [];
    copy.nextNode = -1;
    copy.hideChildren = false;
    character.dialogueNodes.push(copy);
    return {characterId:character.characterID, dialogueId:copy.dialogueID};
}

if (typeof module !== 'undefined') module.exports = {duplicateDialogueNode};

if (typeof document !== 'undefined') (() => {
    const menu = document.createElement('div');
    menu.id = 'nodeContextMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Node actions');
    menu.hidden = true;
    // Outside the zoomed/panned canvas and body so pointer coordinates stay literal.
    document.documentElement.append(menu);
    let target = null;
    let returnFocus = null;
    const select = wrapper => {
        $('.selected').removeClass('selected');
        $(wrapper).find('.block').first().addClass('selected');
    };
    const close = (restore = false) => {
        menu.hidden = true;
        target = null;
        if (restore && returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
    };
    const actions = [
        ['Play from here', wrapper => { select(wrapper); startPlayMode(wrapper); }],
        ['Duplicate', wrapper => {
            const copy = duplicateDialogueNode(gameDialogueMakerProject, wrapper.dataset.characterId,
                wrapper.classList.contains('characterRoot') ? null : wrapper.dataset.dialogueId,
                typeof getNodeWidthWorld === 'function' ? getNodeWidthWorld(wrapper) + 40 : 380);
            if (!copy) return;
            storeMasterObjectToLocalStorage();
            const selector = copy.dialogueId == null ? '.characterRoot' : `.dialogue[data-dialogue-id="${copy.dialogueId}"]`;
            const element = document.querySelector(`${selector}[data-character-id="${copy.characterId}"]`);
            if (element) select(element);
        }],
        ['Delete', wrapper => deleteBlockWrap(wrapper)]
    ];
    for (const [label, action] of actions) {
        const button = document.createElement('button');
        button.type = 'button'; button.role = 'menuitem'; button.textContent = label;
        if (label === 'Delete') button.className = 'node-menu-delete';
        button.onclick = () => {
            const wrapper = target;
            close();
            if (wrapper?.isConnected) action(wrapper);
        };
        menu.append(button);
    }
    // Prevent right clicks from activating eraser/style brushes or drag handlers.
    for (const name of ['pointerdown', 'mousedown']) document.addEventListener(name, event => {
        if (event.button === 2 && event.target.closest('#mainArea .blockWrap')) event.stopImmediatePropagation();
    }, true);
    document.addEventListener('contextmenu', event => {
        const wrapper = event.target.closest('#mainArea .blockWrap');
        if (!wrapper) { close(); return; }
        event.preventDefault(); event.stopPropagation();
        // Commit any text currently being edited before a copy/delete redraw.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        target = wrapper; select(wrapper);
        returnFocus = wrapper.querySelector('.block');
        returnFocus.tabIndex = -1;
        menu.hidden = false;
        const anchor = wrapper.getBoundingClientRect();
        const x = event.clientX || anchor.left + 20, y = event.clientY || anchor.top + 20;
        menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - menu.offsetWidth - 8))}px`;
        menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - menu.offsetHeight - 8))}px`;
        menu.querySelector('button').focus({preventScroll:true});
    });
    document.addEventListener('pointerdown', event => {
        if (!menu.hidden && !menu.contains(event.target)) close();
    }, true);
    menu.addEventListener('keydown', event => {
        const buttons = [...menu.querySelectorAll('button')];
        const index = buttons.indexOf(document.activeElement);
        if (event.key === 'Escape' || event.key === 'Tab') { close(true); if (event.key === 'Escape') event.preventDefault(); }
        else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
                (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
            buttons[next].focus();
        }
    });
    window.addEventListener('resize', () => close());
    window.addEventListener('blur', () => close());
    document.addEventListener('scroll', event => { if (!menu.contains(event.target)) close(); }, true);
})();
